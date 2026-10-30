const { jsPDF } = require("jspdf");
const autoTable = require("jspdf-autotable").default || require("jspdf-autotable");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// 1. Prepare directories
const pdfDir = path.resolve(__dirname, "../pdf");
fs.mkdirSync(pdfDir, { recursive: true });

const tempLogosDir = "/tmp/team_logos";
fs.mkdirSync(tempLogosDir, { recursive: true });

// 2. Load snapshot data
const snapshot = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../backup/production_snapshot.json"), "utf8"));
const config = snapshot.data.config.find(c => c.id === "tournament") || {};
const teams = Object.values(snapshot.data.teams);
const teamsById = new Map(teams.map(t => [t.id, t]));
const matches = Object.values(snapshot.data.matches);
const matchesByNumber = new Map(matches.map(m => [m.matchNumber, m]));

// Saturday meal schedule
const saturdayMeals = [
  { time: "12:00 Uhr", match: 10, role: "heim" },
  { time: "12:00 Uhr", match: 10, role: "gast" },
  { time: "12:15 Uhr", match: 11, role: "heim" },
  { time: "12:15 Uhr", match: 11, role: "gast" },
  { time: "12:30 Uhr", match: 12, role: "heim" },
  { time: "12:30 Uhr", match: 12, role: "gast" },
  { time: "12:45 Uhr", match: 5, role: "heim" },
  { time: "12:45 Uhr", match: 5, role: "gast" },
  { time: "13:00 Uhr", match: 6, role: "heim" },
  { time: "13:00 Uhr", match: 6, role: "gast" },
  { time: "13:15 Uhr", match: 7, role: "heim" },
  { time: "13:15 Uhr", match: 7, role: "gast" },
  { time: "13:30 Uhr", match: 8, role: "heim" },
  { time: "13:30 Uhr", match: 8, role: "gast" },
  { time: "13:45 Uhr", match: 9, role: "heim" },
  { time: "13:45 Uhr", match: 9, role: "gast" },
];

const teamMeals = new Map();
saturdayMeals.forEach(m => {
  const match = matchesByNumber.get(m.match);
  if (match) {
    const teamId = m.role === "heim" ? match.teamHomeId : match.teamAwayId;
    teamMeals.set(teamId, m.time);
  }
});

// Helper: resolve referee name
function resolveRefereeName(refVar) {
  if (!refVar) return "-";
  const matchVar = refVar.match(/\{\{(?:spiel|match):(\d+):(heim|gast|home|away)(?::(kurz|short))?\}\}/i);
  if (matchVar) {
    const matchNum = parseInt(matchVar[1], 10);
    const role = matchVar[2].toLowerCase();
    const isHome = role === "heim" || role === "home";
    const refMatch = matchesByNumber.get(matchNum);
    if (refMatch) {
      const teamId = isHome ? refMatch.teamHomeId : refMatch.teamAwayId;
      const team = teamsById.get(teamId);
      return team ? team.name : teamId;
    }
  }
  const directTeam = teams.find(t => t.id === refVar || t.name === refVar || t.shortName === refVar);
  return directTeam ? directTeam.name : refVar;
}

// Helper: identify which team ID is assigned as referee
function getRefTeamId(refVar) {
  if (!refVar) return null;
  const matchVar = refVar.match(/\{\{(?:spiel|match):(\d+):(heim|gast|home|away)/i);
  if (matchVar) {
    const matchNum = parseInt(matchVar[1], 10);
    const role = matchVar[2].toLowerCase();
    const isHome = role === "heim" || role === "home";
    const refMatch = matchesByNumber.get(matchNum);
    if (refMatch) return isHome ? refMatch.teamHomeId : refMatch.teamAwayId;
  }
  const found = teams.find(t => t.id === refVar || t.name === refVar || t.shortName === refVar);
  return found ? found.id : null;
}

// Convert all team logos to PNG
const logoPngMap = new Map();
teams.forEach(t => {
  const srcWebp = path.resolve(__dirname, `../backup/archive/backup-2026-10-27_20-40-00/storage/teams/${t.id}/logo.webp`);
  const destPng = path.join(tempLogosDir, `${t.id}.png`);
  if (fs.existsSync(srcWebp)) {
    try {
      execSync(`sips -s format png "${srcWebp}" --out "${destPng}"`, { stdio: "ignore" });
      if (fs.existsSync(destPng)) {
        logoPngMap.set(t.id, destPng);
      }
    } catch (e) {
      console.warn(`Failed to convert logo for ${t.id}:`, e.message);
    }
  }
});

// Helper: calculate group standings
function calculateGroupStandings(gender, group) {
  const groupTeams = teams.filter(t => t.gender === gender && t.group === group);
  const standingsMap = new Map();
  groupTeams.forEach(t => {
    standingsMap.set(t.id, {
      teamId: t.id,
      teamName: t.name,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0
    });
  });

  const groupMatches = matches.filter(m =>
    m.gender === gender &&
    m.phase === "group" &&
    m.group === group &&
    (m.status === "finished" || m.status === "live" || m.status === "paused")
  );

  groupMatches.forEach(match => {
    const home = standingsMap.get(match.teamHomeId);
    const away = standingsMap.get(match.teamAwayId);
    if (!home || !away) return;
    home.played += 1;
    away.played += 1;
    home.goalsFor += match.scoreHome || 0;
    home.goalsAgainst += match.scoreAway || 0;
    home.goalDifference = home.goalsFor - home.goalsAgainst;
    away.goalsFor += match.scoreAway || 0;
    away.goalsAgainst += match.scoreHome || 0;
    away.goalDifference = away.goalsFor - away.goalsAgainst;

    if (match.scoreHome > match.scoreAway) {
      home.won += 1;
      home.points += 3;
      away.lost += 1;
    } else if (match.scoreHome < match.scoreAway) {
      away.won += 1;
      away.points += 3;
      home.lost += 1;
    } else {
      home.drawn += 1;
      home.points += 1;
      away.drawn += 1;
      away.points += 1;
    }
  });

  const standings = Array.from(standingsMap.values());
  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.teamName.localeCompare(b.teamName);
  });
  return standings;
}

function sanitizeFilename(str) {
  return str
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/Ä/g, "Ae")
    .replace(/Ö/g, "Oe")
    .replace(/Ü/g, "Ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_");
}

function parseTimeToMinutes(timeStr) {
  const clean = timeStr.replace(" Uhr", "").trim();
  const [h, m] = clean.split(":").map(Number);
  return h * 60 + (m || 0);
}

// Generate PDF for each team
const saturdayMatches = matches.filter(m => m.day === "saturday").sort((a, b) => a.matchNumber - b.matchNumber);

const generatedFiles = [];

teams.forEach(currentTeam => {
  const isFemale = currentTeam.gender === "wU14";
  const primaryColor = isFemale ? [147, 51, 234] : [37, 99, 235]; // purple-600 / blue-600
  const darkColor = isFemale ? [126, 34, 206] : [29, 78, 216]; // purple-700 / blue-700
  const lightBgColor = isFemale ? [250, 245, 255] : [239, 246, 255];
  const lightBorderColor = isFemale ? [233, 213, 255] : [191, 219, 254];

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;

  // Background subtle top banner
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, pageWidth, 36, "F");

  // Accent color line on top
  doc.setFillColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.rect(0, 0, pageWidth, 3, "F");

  // Logo top left
  const logoPath = logoPngMap.get(currentTeam.id);
  const textStartX = margin + 26;

  if (logoPath && fs.existsSync(logoPath)) {
    try {
      const logoData = fs.readFileSync(logoPath).toString("base64");
      // Scale proportionally inside 22x22 box
      doc.addImage("data:image/png;base64," + logoData, "PNG", margin, 6.5, 22, 22);
    } catch {
      // Fallback
    }
  }

  // Header Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14.5);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text("20. Kurt-Becker-Cup 2026", textStartX, 12.5);

  // Subtitle
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text(`Spielplan & Tagesplan — ${currentTeam.name} (${currentTeam.gender})`, textStartX, 18.5);

  // Meta line
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Samstag, 31. Oktober 2026 • Gruppe ${currentTeam.group} • Spielzeit: 20 Min. • Großsporthalle Rüsselsheim`, textStartX, 24);

  // Badge right
  doc.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
  doc.setDrawColor(lightBorderColor[0], lightBorderColor[1], lightBorderColor[2]);
  doc.roundedRect(pageWidth - margin - 34, 7, 34, 15, 2, 2, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text("SAMSTAG", pageWidth - margin - 17, 12.5, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text("31. Okt. 2026", pageWidth - margin - 17, 18, { align: "center" });

  // Separator
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(margin, 32, pageWidth - margin, 32);

  let currentY = 38;

  // ==========================================
  // SECTION 1: Spiele des Teams
  // ==========================================
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`1. Turnierspiele von ${currentTeam.name} (Gruppe ${currentTeam.group})`, margin, currentY);

  const teamMatches = saturdayMatches
    .filter(m => m.teamHomeId === currentTeam.id || m.teamAwayId === currentTeam.id)
    .sort((a, b) => a.matchNumber - b.matchNumber);

  const matchRows = teamMatches.map(m => {
    const home = teamsById.get(m.teamHomeId)?.name || m.teamHomeId;
    const away = teamsById.get(m.teamAwayId)?.name || m.teamAwayId;
    const ref1 = resolveRefereeName(m.referee1);
    const ref2 = resolveRefereeName(m.referee2);
    const hasScore = m.status === "finished" || m.status === "live" || m.status === "paused";
    const scoreText = hasScore ? `${m.scoreHome} : ${m.scoreAway}` : "     :     ";

    return [
      `Spiel #${m.matchNumber}`,
      m.scheduledTime + " Uhr",
      home,
      away,
      `${ref1} & ${ref2}`,
      scoreText
    ];
  });

  autoTable(doc, {
    startY: currentY + 2.5,
    margin: { left: margin, right: margin },
    head: [["Spiel", "Anpfiff", "Heim", "Gast", "Schiedsrichter", "Ergebnis"]],
    body: matchRows,
    theme: "grid",
    headStyles: {
      fillColor: darkColor,
      textColor: 255,
      fontStyle: "bold",
      fontSize: 8.5,
      halign: "center"
    },
    styles: {
      lineColor: [203, 213, 225],
      lineWidth: 0.2,
      font: "helvetica",
      fontSize: 8,
      cellPadding: 2.3,
    },
    columnStyles: {
      0: { halign: "center", fontStyle: "bold", cellWidth: 18 },
      1: { halign: "center", fontStyle: "bold", cellWidth: 22 },
      2: { halign: "left", cellWidth: 42 },
      3: { halign: "left", cellWidth: 42 },
      4: { halign: "left", cellWidth: 38, fontSize: 7.5, textColor: [71, 85, 105] },
      5: { halign: "center", cellWidth: 20, fontStyle: "bold" },
    },
    didParseCell: (data) => {
      if (data.section === "body") {
        if (data.column.index === 2 && data.cell.raw === currentTeam.name) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.textColor = darkColor;
        }
        if (data.column.index === 3 && data.cell.raw === currentTeam.name) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.textColor = darkColor;
        }
      }
    }
  });

  currentY = doc.lastAutoTable.finalY + 6.5;

  // ==========================================
  // SECTION 2: Schiedsrichter-Einsätze
  // ==========================================
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`2. Schiedsrichter-Einsätze von ${currentTeam.name}`, margin, currentY);

  const refMatches = saturdayMatches
    .filter(m => getRefTeamId(m.referee1) === currentTeam.id || getRefTeamId(m.referee2) === currentTeam.id)
    .sort((a, b) => a.matchNumber - b.matchNumber);

  const refRows = refMatches.map(m => {
    const home = teamsById.get(m.teamHomeId)?.name || m.teamHomeId;
    const away = teamsById.get(m.teamAwayId)?.name || m.teamAwayId;
    const isRef1 = getRefTeamId(m.referee1) === currentTeam.id;
    const partnerRef = isRef1 ? resolveRefereeName(m.referee2) : resolveRefereeName(m.referee1);

    return [
      `Spiel #${m.matchNumber}`,
      m.scheduledTime + " Uhr",
      `${m.gender} (Gr. ${m.group || "-"})`,
      `${home} vs. ${away}`,
      partnerRef
    ];
  });

  autoTable(doc, {
    startY: currentY + 2.5,
    margin: { left: margin, right: margin },
    head: [["Spiel", "Uhrzeit", "Kategorie", "Begegnung", "Partner-Schiedsrichter"]],
    body: refRows,
    theme: "grid",
    headStyles: {
      fillColor: [217, 119, 6], // amber-600
      textColor: 255,
      fontStyle: "bold",
      fontSize: 8.5,
      halign: "center"
    },
    styles: {
      lineColor: [203, 213, 225],
      lineWidth: 0.2,
      font: "helvetica",
      fontSize: 8,
      cellPadding: 2.2,
    },
    columnStyles: {
      0: { halign: "center", fontStyle: "bold", cellWidth: 18 },
      1: { halign: "center", fontStyle: "bold", cellWidth: 22 },
      2: { halign: "center", cellWidth: 24, textColor: darkColor, fontStyle: "bold" },
      3: { halign: "left", cellWidth: 68 },
      4: { halign: "left", cellWidth: 50, fontSize: 7.5, textColor: [71, 85, 105] },
    }
  });

  currentY = doc.lastAutoTable.finalY + 6.5;

  // ==========================================
  // SECTION 3: Tagesablauf (Chronologisch)
  // ==========================================
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`3. Kompletter Tagesablauf am Samstag`, margin, currentY);

  const timelineItems = [];

  // Team Matches
  teamMatches.forEach((m, idx) => {
    const opp = m.teamHomeId === currentTeam.id ? (teamsById.get(m.teamAwayId)?.name || m.teamAwayId) : (teamsById.get(m.teamHomeId)?.name || m.teamHomeId);
    timelineItems.push({
      time: m.scheduledTime + " Uhr",
      minutes: parseTimeToMinutes(m.scheduledTime),
      type: `SPIEL ${idx + 1}`,
      desc: `${idx + 1}. Gruppenspiel vs. ${opp} (Spiel #${m.matchNumber}, Gruppe ${m.group})`
    });
  });

  // Ref Duties
  refMatches.forEach(m => {
    const home = teamsById.get(m.teamHomeId)?.name || m.teamHomeId;
    const away = teamsById.get(m.teamAwayId)?.name || m.teamAwayId;
    timelineItems.push({
      time: m.scheduledTime + " Uhr",
      minutes: parseTimeToMinutes(m.scheduledTime),
      type: "Pfeifen",
      desc: `Schiedsrichter bei Spiel #${m.matchNumber} (${m.gender} Gr. ${m.group}: ${home} vs. ${away})`
    });
  });

  // Meal
  const mealTime = teamMeals.get(currentTeam.id);
  if (mealTime) {
    timelineItems.push({
      time: mealTime,
      minutes: parseTimeToMinutes(mealTime),
      type: "Mittagessen",
      desc: "Gemeinsames Team-Mittagessen laut Essensplan im Verpflegungsbereich"
    });
  }

  // Sort chronological
  timelineItems.sort((a, b) => {
    if (a.minutes !== b.minutes) return a.minutes - b.minutes;
    // If same minute, order: Spiel, then Pfeifen, then Mittagessen
    const priority = { "SPIEL 1": 1, "SPIEL 2": 1, "SPIEL 3": 1, "Pfeifen": 2, "Mittagessen": 3 };
    return (priority[a.type] || 5) - (priority[b.type] || 5);
  });

  const timelineRows = timelineItems.map(item => [item.time, item.type, item.desc]);

  autoTable(doc, {
    startY: currentY + 2.5,
    margin: { left: margin, right: margin },
    head: [["Uhrzeit", "Aktion", "Aktivität / Details"]],
    body: timelineRows,
    theme: "striped",
    headStyles: {
      fillColor: [51, 65, 85], // slate-700
      textColor: 255,
      fontStyle: "bold",
      fontSize: 8.5,
    },
    styles: {
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      font: "helvetica",
      fontSize: 8,
      cellPadding: 1.8,
    },
    columnStyles: {
      0: { halign: "center", fontStyle: "bold", cellWidth: 24 },
      1: { halign: "center", fontStyle: "bold", cellWidth: 26 },
      2: { halign: "left", cellWidth: 132 },
    },
    didParseCell: (data) => {
      if (data.section === "body") {
        const type = data.row.raw[1];
        if (type.startsWith("SPIEL")) {
          data.cell.styles.fillColor = lightBgColor;
          if (data.column.index === 1) {
            data.cell.styles.textColor = darkColor;
          }
        } else if (type === "Mittagessen") {
          data.cell.styles.fillColor = [240, 253, 244]; // green-50
          if (data.column.index === 1) {
            data.cell.styles.textColor = [22, 101, 52];
          }
        } else if (type === "Pfeifen") {
          if (data.column.index === 1) {
            data.cell.styles.textColor = [180, 83, 9];
          }
        }
      }
    }
  });

  currentY = doc.lastAutoTable.finalY + 6.5;

  // ==========================================
  // SECTION 4: Tabelle (ersetzt den Kader)
  // ==========================================
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`4. Tabelle ${currentTeam.gender} — Gruppe ${currentTeam.group}`, margin, currentY);

  const standings = calculateGroupStandings(currentTeam.gender, currentTeam.group);
  const standingsRows = standings.map((s, idx) => {
    const hasMatches = s.played > 0;
    if (hasMatches) {
      const diffSign = s.goalDifference > 0 ? "+" : "";
      const diffStr = `${s.goalsFor}:${s.goalsAgainst} (${diffSign}${s.goalDifference})`;
      return [
        String(idx + 1),
        s.teamName,
        String(s.played),
        diffStr,
        String(s.points)
      ];
    } else {
      return [
        String(idx + 1),
        s.teamName,
        "",
        "     :     ",
        ""
      ];
    }
  });

  autoTable(doc, {
    startY: currentY + 2.5,
    margin: { left: margin, right: margin },
    head: [["Pl.", "Team", "Spiele", "Tore (Diff.)", "Punkte"]],
    body: standingsRows,
    theme: "grid",
    headStyles: {
      fillColor: darkColor,
      textColor: 255,
      fontStyle: "bold",
      fontSize: 8.5,
      halign: "center"
    },
    styles: {
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      font: "helvetica",
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { halign: "center", fontStyle: "bold", cellWidth: 14 },
      1: { halign: "left", cellWidth: 80 },
      2: { halign: "center", cellWidth: 26 },
      3: { halign: "center", cellWidth: 34 },
      4: { halign: "center", cellWidth: 28, fontStyle: "bold" },
    },
    didParseCell: (data) => {
      if (data.section === "body") {
        const teamName = data.row.raw[1];
        if (teamName === currentTeam.name) {
          data.cell.styles.fillColor = lightBgColor;
          data.cell.styles.fontStyle = "bold";
          if (data.column.index === 1) {
            data.cell.styles.textColor = darkColor;
          }
        }
      }
    }
  });

  // Small explanation line below table
  const tableFinalY = doc.lastAutoTable.finalY + 3.5;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("Modus: 20 Minuten Spielzeit • 5 Minuten Wechselpause • Plätze 1 & 2 erreichen die Halbfinals am Sonntag", margin, tableFinalY);

  // Footer
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin, 286, pageWidth - margin, 286);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text("Kurt-Becker-Cup 2026 • Rüsselsheimer RK 08 e.V. • Großsporthalle Rüsselsheim (Evreuxring 31)", pageWidth / 2, 291, { align: "center" });

  // Output filename
  const fileName = `${currentTeam.gender}_${currentTeam.group}_${sanitizeFilename(currentTeam.name)}_Samstag.pdf`;
  const filePath = path.join(pdfDir, fileName);
  fs.writeFileSync(filePath, Buffer.from(doc.output("arraybuffer")));
  generatedFiles.push({ team: currentTeam, fileName, filePath });
});

console.log(`Successfully generated ${generatedFiles.length} team PDFs in ${pdfDir}!`);
generatedFiles.forEach(f => console.log(` - ${f.fileName}`));
