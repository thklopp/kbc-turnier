const { jsPDF } = require("jspdf");
const autoTable = require("jspdf-autotable").default || require("jspdf-autotable");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// 1. Convert logo to temporary PNG
const logoWebpPath = path.resolve(__dirname, "../public/images/RRK.webp");
const logoPngPath = "/tmp/rrk_logo_pdf.png";
try {
  execSync(`sips -s format png "${logoWebpPath}" --out "${logoPngPath}"`, { stdio: "ignore" });
} catch (e) {
  console.warn("Could not convert logo:", e.message);
}

// 2. Load snapshot data
const snapshot = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../backup/production_snapshot.json"), "utf8"));
const config = snapshot.data.config.find(c => c.id === "tournament") || {};
const teams = Object.values(snapshot.data.teams);
const teamsById = new Map(teams.map(t => [t.id, t]));
const matches = Object.values(snapshot.data.matches);
const matchesByNumber = new Map(matches.map(m => [m.matchNumber, m]));

const rrkTeam = teams.find(t => t.id === "team-mu14-5") || {};

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
  return refVar;
}

// 3. Setup PDF (A4 Portrait: 210 x 297 mm)
const doc = new jsPDF({
  orientation: "portrait",
  unit: "mm",
  format: "a4",
});

const pageWidth = 210;
const pageHeight = 297;
const margin = 14;
const contentWidth = pageWidth - 2 * margin;

// Background subtle top banner
doc.setFillColor(248, 250, 252); // slate-50
doc.rect(0, 0, pageWidth, 36, "F");

// Blue accent line at the very top
doc.setFillColor(29, 78, 216); // blue-700
doc.rect(0, 0, pageWidth, 3, "F");

// Header with Logo
let textStartX = margin;
if (fs.existsSync(logoPngPath)) {
  const logoData = fs.readFileSync(logoPngPath).toString("base64");
  doc.addImage("data:image/png;base64," + logoData, "PNG", margin, 6.5, 22, 22);
  textStartX = margin + 26;
}

// Main Title
doc.setFont("helvetica", "bold");
doc.setFontSize(14.5);
doc.setTextColor(15, 23, 42); // slate-900
doc.text("20. Kurt-Becker-Cup 2026", textStartX, 12.5);

// Subtitle
doc.setFont("helvetica", "bold");
doc.setFontSize(10.5);
doc.setTextColor(29, 78, 216); // blue-700
doc.text("Spielplan & Tagesplan — Rüsselsheimer RK (mU14)", textStartX, 18.5);

// Meta line
doc.setFont("helvetica", "normal");
doc.setFontSize(8);
doc.setTextColor(100, 116, 139); // slate-500
doc.text("Samstag, 31. Oktober 2026 • Gruppe B • Spielzeit: 20 Min. • Großsporthalle Rüsselsheim", textStartX, 24);

// Date / Badge right aligned
doc.setFillColor(239, 246, 255); // blue-50
doc.setDrawColor(191, 219, 254); // blue-200
doc.roundedRect(pageWidth - margin - 34, 7, 34, 15, 2, 2, "FD");
doc.setFont("helvetica", "bold");
doc.setFontSize(8);
doc.setTextColor(29, 78, 216);
doc.text("SAMSTAG", pageWidth - margin - 17, 12.5, { align: "center" });
doc.setFont("helvetica", "normal");
doc.setFontSize(7.5);
doc.setTextColor(71, 85, 105);
doc.text("31. Okt. 2026", pageWidth - margin - 17, 18, { align: "center" });

// Separator line
doc.setDrawColor(226, 232, 240); // slate-200
doc.setLineWidth(0.4);
doc.line(margin, 32, pageWidth - margin, 32);

let currentY = 38;

// ==========================================
// SECTION 1: Spiele des RRK mU14
// ==========================================
doc.setFont("helvetica", "bold");
doc.setFontSize(10.5);
doc.setTextColor(15, 23, 42);
doc.text("1. Turnierspiele des RRK mU14 (Gruppe B)", margin, currentY);

const myMatches = matches
  .filter(m => m.day === "saturday" && (m.teamHomeId === "team-mu14-5" || m.teamAwayId === "team-mu14-5"))
  .sort((a, b) => a.matchNumber - b.matchNumber);

const myMatchNumbers = new Set(myMatches.map(m => m.matchNumber));

const myMatchRows = myMatches.map(m => {
  const home = teamsById.get(m.teamHomeId)?.name || m.teamHomeId;
  const away = teamsById.get(m.teamAwayId)?.name || m.teamAwayId;
  const ref1 = resolveRefereeName(m.referee1);
  const ref2 = resolveRefereeName(m.referee2);
  const refText = `${ref1} & ${ref2}`;
  
  return [
    `Spiel #${m.matchNumber}`,
    m.scheduledTime + " Uhr",
    home,
    away,
    refText,
    "     :     "
  ];
});

autoTable(doc, {
  startY: currentY + 2.5,
  margin: { left: margin, right: margin },
  head: [["Spiel", "Anpfiff", "Heim", "Gast", "Schiedsrichter", "Ergebnis"]],
  body: myMatchRows,
  theme: "grid",
  headStyles: {
    fillColor: [29, 78, 216], // blue-700
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
    cellPadding: 2.5,
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
      if (data.column.index === 2 && data.cell.raw === "Rüsselsheimer RK") {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.textColor = [29, 78, 216];
      }
      if (data.column.index === 3 && data.cell.raw === "Rüsselsheimer RK") {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.textColor = [29, 78, 216];
      }
    }
  }
});

currentY = doc.lastAutoTable.finalY + 7;

// ==========================================
// SECTION 2: Schiedsrichter-Einsätze RRK mU14
// ==========================================
doc.setFont("helvetica", "bold");
doc.setFontSize(10.5);
doc.setTextColor(15, 23, 42);
doc.text("2. Schiedsrichter-Einsätze des RRK mU14", margin, currentY);

function isExactRrkMu14Ref(refVar) {
  if (!refVar) return false;
  const match = refVar.match(/\{\{(?:spiel|match):(\d+):(heim|gast|home|away)/i);
  if (!match) return false;
  const matchNum = parseInt(match[1], 10);
  const role = match[2].toLowerCase();
  const isHome = role === "heim" || role === "home";
  // Only matches where RRK mU14 was playing (Spiel 7, 15, 23) and RRK is Home team
  return myMatchNumbers.has(matchNum) && isHome;
}

const refMatches = matches
  .filter(m => m.day === "saturday")
  .filter(m => isExactRrkMu14Ref(m.referee1) || isExactRrkMu14Ref(m.referee2))
  .sort((a, b) => a.matchNumber - b.matchNumber);

const refRows = refMatches.map(m => {
  const home = teamsById.get(m.teamHomeId)?.name || m.teamHomeId;
  const away = teamsById.get(m.teamAwayId)?.name || m.teamAwayId;
  const isRef1 = isExactRrkMu14Ref(m.referee1);
  const partnerRef = isRef1 ? resolveRefereeName(m.referee2) : resolveRefereeName(m.referee1);

  return [
    `Spiel #${m.matchNumber}`,
    m.scheduledTime + " Uhr",
    m.gender + ` (Gr. ${m.group || "-"})`,
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
    cellPadding: 2.4,
  },
  columnStyles: {
    0: { halign: "center", fontStyle: "bold", cellWidth: 18 },
    1: { halign: "center", fontStyle: "bold", cellWidth: 22 },
    2: { halign: "center", cellWidth: 24, textColor: [29, 78, 216], fontStyle: "bold" },
    3: { halign: "left", cellWidth: 68 },
    4: { halign: "left", cellWidth: 50, fontSize: 7.5, textColor: [71, 85, 105] },
  }
});

currentY = doc.lastAutoTable.finalY + 7;

// ==========================================
// SECTION 3: Tagesablauf & Wichtige Zeiten (Timeline Box)
// ==========================================
doc.setFont("helvetica", "bold");
doc.setFontSize(10.5);
doc.setTextColor(15, 23, 42);
doc.text("3. Kompletter Tagesablauf RRK mU14 am Samstag", margin, currentY);

const scheduleTimeline = [
  ["10:50 Uhr", "Pfeifen", "Schiedsrichter bei Spiel #3 (mU14 Gr. A: TV Alzey vs. Münchner SC)"],
  ["12:30 Uhr", "SPIEL 1", "1. Gruppenspiel vs. Bonner THV (Spiel #7, Gruppe B)"],
  ["13:15 Uhr", "Mittagessen", "Gemeinsames Team-Mittagessen laut Essensplan"],
  ["14:10 Uhr", "Pfeifen", "Schiedsrichter bei Spiel #11 (mU14 Gr. A: TV Alzey vs. HTC Stuttgarter Kickers)"],
  ["15:50 Uhr", "SPIEL 2", "2. Gruppenspiel vs. HC Ludwigsburg (Spiel #15, Gruppe B)"],
  ["17:55 Uhr", "Pfeifen", "Schiedsrichter bei Spiel #20 (mU14 Gr. A: Münchner SC vs. HTC Stuttgarter Kickers)"],
  ["19:10 Uhr", "SPIEL 3", "3. Gruppenspiel vs. TuS C Obermenzing (Spiel #23, Gruppe B)"]
];

autoTable(doc, {
  startY: currentY + 2.5,
  margin: { left: margin, right: margin },
  head: [["Uhrzeit", "Aktion", "Aktivität / Details"]],
  body: scheduleTimeline,
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
    cellPadding: 2,
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
        data.cell.styles.fillColor = [239, 246, 255]; // blue-50
        if (data.column.index === 1) {
          data.cell.styles.textColor = [29, 78, 216];
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

currentY = doc.lastAutoTable.finalY + 7;

// ==========================================
// SECTION 4: Teamkader RRK mU14
// ==========================================
doc.setFont("helvetica", "bold");
doc.setFontSize(10.5);
doc.setTextColor(15, 23, 42);
doc.text("4. Gemeldeter Kader RRK mU14 (17 Spieler)", margin, currentY);

const players = (rrkTeam.players || []).slice().sort((a, b) => a.number - b.number);
const playerCols = 4;
const playerRowsCount = Math.ceil(players.length / playerCols);
const playerTableRows = [];

for (let r = 0; r < playerRowsCount; r++) {
  const row = [];
  for (let c = 0; c < playerCols; c++) {
    const idx = r + c * playerRowsCount;
    if (idx < players.length) {
      const p = players[idx];
      row.push(`#${p.number} ${p.firstName} ${p.lastName}`);
    } else {
      row.push("");
    }
  }
  playerTableRows.push(row);
}

autoTable(doc, {
  startY: currentY + 2.5,
  margin: { left: margin, right: margin },
  body: playerTableRows,
  theme: "plain",
  styles: {
    font: "helvetica",
    fontSize: 7.5,
    cellPadding: 1.4,
    textColor: [51, 65, 85],
  },
  columnStyles: {
    0: { cellWidth: 45.5 },
    1: { cellWidth: 45.5 },
    2: { cellWidth: 45.5 },
    3: { cellWidth: 45.5 },
  }
});

// Footer
doc.setDrawColor(226, 232, 240);
doc.setLineWidth(0.3);
doc.line(margin, 286, pageWidth - margin, 286);

doc.setFont("helvetica", "normal");
doc.setFontSize(7.5);
doc.setTextColor(148, 163, 184);
doc.text("Kurt-Becker-Cup 2026 • Rüsselsheimer RK 08 e.V. • Großsporthalle Rüsselsheim (Evreuxring 31)", pageWidth / 2, 291, { align: "center" });

// Output
const outPath = path.resolve(__dirname, "../RRK_mU14_Spielplan_Samstag.pdf");
fs.writeFileSync(outPath, Buffer.from(doc.output("arraybuffer")));
console.log("PDF successfully updated at:", outPath);
