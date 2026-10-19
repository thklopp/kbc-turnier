import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import type { Match, Team, TournamentConfig } from "@/types/database"
import { getMatchDisplayName } from "./matchService"

interface DocWithAutoTable extends jsPDF {
  lastAutoTable?: {
    finalY: number
  }
}

/**
 * Wandelt die Bild-URL in eine Data-URL (PNG Base64) um,
 * damit jsPDF das Logo verlässlich im PDF einbetten kann.
 */
async function loadLogoDataUrl(url: string): Promise<string> {
  if (typeof window === "undefined" || !url) return ""
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas")
        canvas.width = img.naturalWidth || img.width
        canvas.height = img.naturalHeight || img.height
        const ctx = canvas.getContext("2d")
        if (!ctx) return resolve("")
        ctx.drawImage(img, 0, 0)
        resolve(canvas.toDataURL("image/png"))
      } catch {
        resolve("")
      }
    }
    img.onerror = () => resolve("")
    img.src = url
  })
}

/**
 * Zeichnet den einheitlichen Kopfbereich für alle 3 PDF-Seiten.
 */
function drawHeader(
  doc: jsPDF,
  pageNumber: number,
  totalPages: number,
  pageTitle: string,
  config: TournamentConfig,
  logoDataUrl?: string
) {
  const startY = 10

  // Vereinslogo links
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, "PNG", 14, startY, 15, 15)
    } catch {
      // Fallback: Kein Abbruch, falls Logo im Browser-Kontext blockiert wird
    }
  }

  const textStartX = logoDataUrl ? 32 : 14

  // Turniertitel
  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  doc.setTextColor(15, 23, 42) // slate-900
  doc.text(config.tournamentName || "20. Kurt-Becker-Cup", textStartX, startY + 5)

  // Seitenüberschrift
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10.5)
  doc.setTextColor(37, 99, 235) // blue-600
  doc.text(pageTitle, textStartX, startY + 10)

  // Meta-Informationen (Spielzeit & Pause dynamisch aus Einstellungen)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139) // slate-500
  const metaText = `Spielzeit: ${config.gameDurationMinutes} Min. | Pause: ${config.breakDurationMinutes} Min. | Großsporthalle Rüsselsheim`
  doc.text(metaText, textStartX, startY + 14.5)

  // Seitennummerierung rechts oben
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  doc.setTextColor(148, 163, 184) // slate-400
  doc.text(`Seite ${pageNumber} von ${totalPages}`, 196, startY + 5, { align: "right" })

  // Trennlinie
  doc.setDrawColor(226, 232, 240) // slate-200
  doc.setLineWidth(0.4)
  doc.line(14, startY + 18, 196, startY + 18)
}

/**
 * Zeichnet den einheitlichen Fußbereich für alle 3 PDF-Seiten.
 */
function drawFooter(doc: jsPDF) {
  doc.setFont("helvetica", "normal")
  doc.setFontSize(7.5)
  doc.setTextColor(148, 163, 184) // slate-400
  doc.text(
    "Kurt-Becker-Cup • Rüsselsheimer RK 08 e.V. • Großsporthalle Rüsselsheim",
    105,
    290,
    { align: "center" }
  )
}

/**
/**
 * Generiert das 3-seitige DIN-A4-Hochkant-PDF für das Turnier.
 */
export async function generateSchedulePdf(
  config: TournamentConfig,
  teams: Team[],
  matches: Match[],
  logoUrl?: string
): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  }) as DocWithAutoTable

  const totalPages = 3
  const logoDataUrl = logoUrl ? await loadLogoDataUrl(logoUrl) : ""
  const teamMap = new Map<string, Team>()
  teams.forEach((t) => teamMap.set(t.id, t))

  // =========================================================================
  // SEITE 1: Gruppenübersicht (wU14 & mU14)
  // =========================================================================
  drawHeader(doc, 1, totalPages, "Gruppenübersicht (wU14 & mU14)", config, logoDataUrl)
  drawFooter(doc)

  interface GroupConfig {
    title: string
    gender: "wU14" | "mU14"
    group: "A" | "B"
    color: [number, number, number]
  }

  const groupConfigs: GroupConfig[] = [
    { title: "wU14 – Gruppe A", gender: "wU14", group: "A", color: [147, 51, 234] }, // purple
    { title: "wU14 – Gruppe B", gender: "wU14", group: "B", color: [147, 51, 234] },
    { title: "mU14 – Gruppe A", gender: "mU14", group: "A", color: [37, 99, 235] },  // blue
    { title: "mU14 – Gruppe B", gender: "mU14", group: "B", color: [37, 99, 235] },
  ]

  let currentY = 31

  for (const grp of groupConfigs) {
    const groupTeams = teams.filter((t) => t.gender === grp.gender && t.group === grp.group)

    // Falls weniger als 4 Teams hinterlegt sind, bis 4 Zeilen auffüllen
    const rowsCount = Math.max(groupTeams.length, 4)
    const tableRows: string[][] = []

    for (let i = 0; i < rowsCount; i++) {
      const team = groupTeams[i]
      tableRows.push([
        String(i + 1),
        team?.name || "",
        "",
        "     :     ",
        "",
      ])
    }

    doc.setFont("helvetica", "bold")
    doc.setFontSize(9.5)
    doc.setTextColor(30, 41, 59)
    doc.text(grp.title, 14, currentY + 3.5)

    autoTable(doc, {
      startY: currentY + 5.5,
      margin: { left: 14, right: 14 },
      head: [["Pl.", "Team", "Spiele", "Tore (Diff.)", "Punkte"]],
      body: tableRows,
      theme: "grid",
      headStyles: {
        fillColor: grp.color,
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
        0: { halign: "center", cellWidth: 12 },
        1: { halign: "left", cellWidth: 80 },
        2: { halign: "center", cellWidth: 25 },
        3: { halign: "center", cellWidth: 35 },
        4: { halign: "center", cellWidth: 30 },
      },
    })

    currentY = (doc.lastAutoTable?.finalY ?? currentY + 35) + 6
  }

  // =========================================================================
  // SEITE 2: Vorrunde (Matches 1..24)
  // =========================================================================
  doc.addPage()
  drawHeader(doc, 2, totalPages, "Vorrunde", config, logoDataUrl)
  drawFooter(doc)

  const vorrundeMatches = matches
    .filter((m) => m.phase === "group" || m.matchNumber <= 24)
    .sort((a, b) => a.matchNumber - b.matchNumber)

  const vorrundeRows = vorrundeMatches.map((m) => {
    const home = teamMap.get(m.teamHomeId)
    const away = teamMap.get(m.teamAwayId)
    return [
      String(m.matchNumber),
      m.scheduledTime,
      m.gender,
      m.group ? `Gr. ${m.group}` : "-",
      home?.name || m.teamHomePlaceholder || "Heim",
      away?.name || m.teamAwayPlaceholder || "Gast",
      "     :     ",
    ]
  })

  autoTable(doc, {
    startY: 31,
    margin: { left: 14, right: 14 },
    head: [["Nr.", "Zeit", "Kat.", "Gr.", "Heim", "Gast", "Ergebnis"]],
    body: vorrundeRows,
    theme: "grid",
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: 255,
      fontStyle: "bold",
      fontSize: 8,
    },
    bodyStyles: {
      fillColor: [255, 255, 255],
    },
    styles: {
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      font: "helvetica",
      fontSize: 7.5,
      cellPadding: 1.6,
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      1: { halign: "center", cellWidth: 18 },
      2: { halign: "center", cellWidth: 16 },
      3: { halign: "center", cellWidth: 16 },
      4: { halign: "right", cellWidth: 50 },
      5: { halign: "left", cellWidth: 50 },
      6: { halign: "center", cellWidth: 22 },
    },
    didParseCell: (data) => {
      if (data.section === "body") {
        const rowData = data.row.raw as string[]
        const gender = rowData[2]
        if (data.column.index === 2) {
          if (gender === "wU14") {
            data.cell.styles.textColor = [126, 34, 206] // dezent lila (wU14)
            data.cell.styles.fontStyle = "bold"
          } else if (gender === "mU14") {
            data.cell.styles.textColor = [29, 78, 216] // dezent blau (mU14)
            data.cell.styles.fontStyle = "bold"
          }
        }
      }
    },
    didDrawCell: (data) => {
      // Dezente Farblinie (1.2mm) am linken Zeilenrand zur optischen Orientierung
      if (data.section === "body" && data.column.index === 0) {
        const rowData = data.row.raw as string[]
        const gender = rowData[2]
        const color = gender === "wU14" ? [147, 51, 234] : [37, 99, 235]
        doc.setFillColor(color[0], color[1], color[2])
        doc.rect(data.cell.x, data.cell.y, 1.2, data.cell.height, "F")
      }
    },
  })

  // =========================================================================
  // SEITE 3: Finalrunde (Matches 25..36)
  // =========================================================================
  doc.addPage()
  drawHeader(doc, 3, totalPages, "Finalrunde", config, logoDataUrl)
  drawFooter(doc)

  const finalMatches = matches
    .filter((m) => m.phase === "final" || m.matchNumber > 24)
    .sort((a, b) => a.matchNumber - b.matchNumber)

  // Per Nutzerwunsch: Immer die Vorlagen-Bezeichnungen (z. B. "1. Gruppe A", "Sieger HF 1")
  const finalRows = finalMatches.map((m) => {
    const home = m.teamHomePlaceholder || teamMap.get(m.teamHomeId)?.name || "Heim"
    const away = m.teamAwayPlaceholder || teamMap.get(m.teamAwayId)?.name || "Gast"
    return [
      String(m.matchNumber),
      m.scheduledTime,
      m.gender,
      m.matchName || getMatchDisplayName(m),
      home,
      away,
      "     :     ",
    ]
  })

  autoTable(doc, {
    startY: 31,
    margin: { left: 14, right: 14 },
    head: [["Nr.", "Zeit", "Kat.", "Spiel / Runde", "Heim", "Gast", "Ergebnis"]],
    body: finalRows,
    theme: "grid",
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: 255,
      fontStyle: "bold",
      fontSize: 8,
    },
    bodyStyles: {
      fillColor: [255, 255, 255],
    },
    styles: {
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      font: "helvetica",
      fontSize: 7.5,
      cellPadding: 1.8,
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      1: { halign: "center", cellWidth: 18 },
      2: { halign: "center", cellWidth: 16 },
      3: { halign: "left", cellWidth: 34 },
      4: { halign: "right", cellWidth: 41 },
      5: { halign: "left", cellWidth: 41 },
      6: { halign: "center", cellWidth: 22 },
    },
    didParseCell: (data) => {
      if (data.section === "body") {
        const rowData = data.row.raw as string[]
        const gender = rowData[2]
        if (data.column.index === 2) {
          if (gender === "wU14") {
            data.cell.styles.textColor = [126, 34, 206] // dezent lila (wU14)
            data.cell.styles.fontStyle = "bold"
          } else if (gender === "mU14") {
            data.cell.styles.textColor = [29, 78, 216] // dezent blau (mU14)
            data.cell.styles.fontStyle = "bold"
          }
        }
      }
    },
    didDrawCell: (data) => {
      // Dezente Farblinie (1.2mm) am linken Zeilenrand zur optischen Orientierung
      if (data.section === "body" && data.column.index === 0) {
        const rowData = data.row.raw as string[]
        const gender = rowData[2]
        const color = gender === "wU14" ? [147, 51, 234] : [37, 99, 235]
        doc.setFillColor(color[0], color[1], color[2])
        doc.rect(data.cell.x, data.cell.y, 1.2, data.cell.height, "F")
      }
    },
  })

  // Infokarte mit Durchführungsbestimmungen unter der Finaltabelle
  const finalTableY = doc.lastAutoTable?.finalY ?? 130
  const boxY = finalTableY + 8

  doc.setFillColor(248, 250, 252) // slate-50
  doc.setDrawColor(226, 232, 240) // slate-200
  doc.roundedRect(14, boxY, 182, 34, 2, 2, "FD")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(8.5)
  doc.setTextColor(15, 23, 42)
  doc.text("Turnierbestimmungen & Finalmodus:", 18, boxY + 6.5)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(7.5)
  doc.setTextColor(71, 85, 105)
  doc.text(
    "• Bei Gleichstand nach regulärer Spielzeit in Platzierungs- und Finalspielen:",
    18,
    boxY + 13
  )
  doc.text(
    "  Sofortiges Penaltyschießen (3 Schützen je Team, danach ggf. Sudden Death).",
    18,
    boxY + 18
  )
  doc.text(
    "• Die Siegerehrung aller Teams findet unmittelbar im Anschluss an das Finale der mU14 statt.",
    18,
    boxY + 24
  )
  doc.text(
    "• Spielzeit und Pausen gemäß Durchführungsbestimmungen der Turnierleitung.",
    18,
    boxY + 29
  )

  return doc
}

/**
 * Erstellt das PDF und stößt den direkten Download im Browser an.
 */
export async function downloadSchedulePdf(
  config: TournamentConfig,
  teams: Team[],
  matches: Match[],
  logoUrl?: string,
  fileName = "kbc-spielplan.pdf"
): Promise<void> {
  const doc = await generateSchedulePdf(config, teams, matches, logoUrl)
  doc.save(fileName)
}
