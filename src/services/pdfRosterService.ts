import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import type { Team, Player, TournamentConfig } from "@/types/database"
import { TEAM_LOGOS, TOURNAMENT_LOGO } from "@/assets/teamLogos"

interface DocWithAutoTable extends jsPDF {
  lastAutoTable?: {
    finalY: number
  }
}

/**
 * Konvertiert eine Bild-URL via Canvas in eine PNG-Data-URL.
 */
async function convertUrlToDataUrl(url: string): Promise<string> {
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
 * Wandelt eine Bild-URL in eine Data-URL (PNG Base64) um,
 * damit jsPDF das Logo verlässlich im PDF einbetten kann.
 * Verwendet primär das vorbereitete lokale Base64-Logo (CORS-frei & offlinefähig)
 * und fällt für neu hochgeladene Logos auf Same-Origin / Canvas zurück.
 */
export async function loadLogoDataUrl(
  url?: string | null,
  teamId?: string
): Promise<string> {
  // 1. Direkt aus dem vorbereiteten Vereinswappen-Bestand laden (Zero-CORS, superschnell)
  if (teamId && TEAM_LOGOS[teamId]) {
    return TEAM_LOGOS[teamId]
  }

  // 2. Falls bereits eine Data-URL übergeben wurde (z.B. aus lokalem Upload-Preview)
  if (url && url.startsWith("data:image/")) {
    return url
  }

  // 3. Fallback auf den Same-Origin Pfad im public-Ordner
  if (teamId) {
    const publicUrl = `/logos/${teamId}.png`
    const publicDataUrl = await convertUrlToDataUrl(publicUrl)
    if (publicDataUrl) return publicDataUrl
  }

  // 4. Fallback auf die direkte Bild-URL
  if (url) {
    const directDataUrl = await convertUrlToDataUrl(url)
    if (directDataUrl) return directDataUrl
  }

  return ""
}

/**
 * Erstellt eine formatierte Datums- und Uhrzeitangabe für den Ausdruck.
 */
function getFormattedDateTime(): string {
  const now = new Date()
  return now.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/**
 * Zeichnet den Kopfbereich und Vereinsdaten für ein Team auf die aktuelle PDF-Seite.
 */
function drawTeamHeader(
  doc: jsPDF,
  team: Team,
  config: TournamentConfig,
  logoDataUrl: string,
  pageNumber: number,
  totalPages: number
) {
  const startX = 14
  const startY = 11
  const pageWidth = 210
  const rightX = pageWidth - startX // 196 mm

  // 1. Oberste Turnierzeile mit Turnierlogo & Metadaten
  let titleX = startX
  try {
    if (TOURNAMENT_LOGO) {
      doc.addImage(TOURNAMENT_LOGO, "PNG", startX, startY - 2, 7, 9)
      titleX = startX + 9.5
    }
  } catch {
    titleX = startX
  }

  doc.setFont("helvetica", "bold")
  doc.setFontSize(10.5)
  doc.setTextColor(30, 41, 59) // slate-800
  doc.text((config.tournamentName || "20. Kurt-Becker-Cup").toUpperCase(), titleX, startY + 4)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  doc.setTextColor(100, 116, 139) // slate-500
  doc.text("Offizieller Mannschaftsspielkader • Großsporthalle Rüsselsheim", titleX + 54, startY + 4)

  // Seitennummer oben rechts
  doc.text(`Seite ${pageNumber} von ${totalPages}`, rightX, startY + 4, { align: "right" })

  // Obere Trennlinie
  doc.setDrawColor(226, 232, 240) // slate-200
  doc.setLineWidth(0.4)
  doc.line(startX, startY + 7.5, rightX, startY + 7.5)

  // 2. Banner-Kasten für Vereinsdaten
  const boxY = startY + 10.5
  const boxHeight = 36
  const boxWidth = rightX - startX // 182 mm

  // Kasten-Hintergrund & Rahmen
  doc.setFillColor(248, 250, 252) // slate-50
  doc.setDrawColor(203, 213, 225) // slate-300
  doc.setLineWidth(0.5)
  doc.roundedRect(startX, boxY, boxWidth, boxHeight, 2.5, 2.5, "FD")

  // Logo oder Initialen links
  const logoX = startX + 4
  const logoY = boxY + 4
  const logoBoxSize = 28

  let hasDrawnLogo = false
  if (logoDataUrl) {
    try {
      const format =
        logoDataUrl.includes("image/jpeg") || logoDataUrl.includes("image/jpg")
          ? "JPEG"
          : "PNG"

      const imgProps = doc.getImageProperties(logoDataUrl)
      const aspect = imgProps.width / imgProps.height
      let renderW = logoBoxSize
      let renderH = logoBoxSize
      if (aspect > 1) {
        renderH = logoBoxSize / aspect
      } else {
        renderW = logoBoxSize * aspect
      }
      const renderX = logoX + (logoBoxSize - renderW) / 2
      const renderY = logoY + (logoBoxSize - renderH) / 2

      doc.addImage(logoDataUrl, format, renderX, renderY, renderW, renderH)
      hasDrawnLogo = true
    } catch (err) {
      console.warn("Fehler beim Zeichnen des Team-Logos in jsPDF:", err)
      hasDrawnLogo = false
    }
  }

  if (!hasDrawnLogo) {
    // Schicker Fallback-Platzhalter mit Kurzname/Initialen
    doc.setFillColor(226, 232, 240) // slate-200
    doc.roundedRect(logoX, logoY, logoBoxSize, logoBoxSize, 2, 2, "F")
    doc.setFont("helvetica", "bold")
    doc.setFontSize(12)
    doc.setTextColor(71, 85, 105) // slate-600
    doc.text(team.shortName || "TEAM", logoX + logoBoxSize / 2, logoY + logoBoxSize / 2 + 4, {
      align: "center",
    })
  }

  // Textbereich rechts neben dem Logo
  const textX = logoX + logoBoxSize + 6

  // Vereinsname / Mannschaftsname
  doc.setFont("helvetica", "bold")
  doc.setFontSize(17)
  doc.setTextColor(15, 23, 42) // slate-900
  // Bei sehr langen Namen Schriftgröße dynamisch anpassen
  if (team.name.length > 25) {
    doc.setFontSize(14)
  }
  doc.text(team.name, textX, boxY + 10)

  // Tags / Meta-Badges
  const isFemale = team.gender === "wU14"
  const genderLabel = isFemale ? "Weibliche U14 (wU14)" : "Männliche U14 (mU14)"
  const metaText = `Kurzname: ${team.shortName}   |   ${genderLabel}   |   Gruppe ${team.group}`

  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  if (isFemale) {
    doc.setTextColor(147, 51, 234) // purple-600
  } else {
    doc.setTextColor(37, 99, 235) // blue-600
  }
  doc.text(metaText, textX, boxY + 17)

  // Kontakt / Betreuer
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  doc.setTextColor(71, 85, 105) // slate-600
  let contactStr = ""
  if (team.contactPerson?.name) {
    contactStr += `Ansprechpartner: ${team.contactPerson.name}`
    if (team.contactPerson.phone) {
      contactStr += ` (Tel: ${team.contactPerson.phone})`
    }
    if (team.contactPerson.email) {
      contactStr += ` • ${team.contactPerson.email}`
    }
  } else {
    contactStr = "Turnierort: Großsporthalle Rüsselsheim"
  }
  doc.text(contactStr, textX, boxY + 24)

  // Stand / Datum rechts im Kasten
  doc.setFont("helvetica", "normal")
  doc.setFontSize(7.5)
  doc.setTextColor(148, 163, 184) // slate-400
  doc.text(`Stand: ${getFormattedDateTime()}`, textX, boxY + 30)
}

/**
 * Zeichnet den unteren Abschluss (Unterschriften & Footer)
 */
function drawTeamFooter(doc: jsPDF, finalY: number) {
  const startX = 14
  const pageWidth = 210
  const rightX = pageWidth - startX // 196 mm

  // Falls noch Platz nach der Tabelle ist, Unterschriftenblöcke zeichnen
  const signY = Math.max(finalY + 8, 258)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139) // slate-500

  // Linke Linie: Mannschaftsführung
  doc.setDrawColor(203, 213, 225)
  doc.setLineWidth(0.4)
  doc.line(startX, signY + 10, startX + 75, signY + 10)
  doc.text("Unterschrift Mannschaftsführung / Trainer", startX, signY + 14)

  // Rechte Linie: Schiedsgericht / Kampfgericht
  doc.line(rightX - 75, signY + 10, rightX, signY + 10)
  doc.text("Unterschrift Kampfgericht / Schiedsrichter", rightX - 75, signY + 14)

  // Ganz unten: Turnierfooter
  doc.setFontSize(7.5)
  doc.setTextColor(148, 163, 184)
  doc.text(
    "Kurt-Becker-Cup • Großsporthalle Rüsselsheim • Rüsselsheimer RK 08 e.V.",
    105,
    290,
    { align: "center" }
  )
}

/**
 * Rendert die Spielerliste einer Mannschaft auf die aktuelle Seite.
 */
function renderTeamRosterPage(
  doc: DocWithAutoTable,
  team: Team,
  config: TournamentConfig,
  logoDataUrl: string,
  pageNumber: number,
  totalPages: number
) {
  // Kopfbereich zeichnen
  drawTeamHeader(doc, team, config, logoDataUrl, pageNumber, totalPages)

  // Spieler sortieren: nach Nummer aufsteigend
  const rawPlayers: Player[] = team.players ? [...team.players] : []
  rawPlayers.sort((a, b) => a.number - b.number)

  // Mindestens 15 Zeilen bereitstellen (falls weniger Spieler, mit Leerzeilen für handschriftliche Ergänzungen auffüllen)
  const targetRowCount = Math.max(rawPlayers.length, 15)
  const tableData: (string | number)[][] = []

  for (let i = 0; i < targetRowCount; i++) {
    if (i < rawPlayers.length) {
      const p = rawPlayers[i]
      tableData.push([p.number, p.firstName, p.lastName, ""])
    } else {
      // Leerzeile für Nachmeldungen vor Ort
      tableData.push(["", "", "", ""])
    }
  }

  // Tabelle erzeugen
  autoTable(doc, {
    startY: 61,
    margin: { left: 14, right: 14 },
    head: [["Nr.", "Vorname", "Nachname", "Bemerkung (TW / C / Notiz)"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [30, 41, 59], // slate-800
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 10.5,
      halign: "left",
      cellPadding: { top: 3.5, bottom: 3.5, left: 3, right: 3 },
    },
    columnStyles: {
      0: {
        cellWidth: 20,
        halign: "center",
        fontStyle: "bold",
        fontSize: 12,
        textColor: [15, 23, 42],
      },
      1: {
        cellWidth: 54,
        halign: "left",
        fontSize: 11,
        textColor: [15, 23, 42],
      },
      2: {
        cellWidth: 54,
        halign: "left",
        fontSize: 11,
        textColor: [15, 23, 42],
      },
      3: {
        cellWidth: 54,
        halign: "left",
        fontSize: 9.5,
        textColor: [100, 116, 139],
      },
    },
    styles: {
      font: "helvetica",
      lineColor: [226, 232, 240], // slate-200
      lineWidth: 0.35,
      minCellHeight: 9.5,
      valign: "middle",
      cellPadding: { top: 2.2, bottom: 2.2, left: 3, right: 3 },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // slate-50
    },
  })

  const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 240
  drawTeamFooter(doc, finalY)
}

/**
 * Erzeugt ein einzelnes DIN-A4-Kader-PDF für ein bestimmtes Team.
 */
export async function generateTeamRosterPdf(
  team: Team,
  config: TournamentConfig
): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  }) as DocWithAutoTable

  const logoDataUrl = await loadLogoDataUrl(team.logoUrl, team.id)
  renderTeamRosterPage(doc, team, config, logoDataUrl, 1, 1)

  return doc
}

/**
 * Lädt das Einzel-PDF für ein Team im Browser herunter.
 */
export async function downloadTeamRosterPdf(
  team: Team,
  config: TournamentConfig
): Promise<void> {
  const doc = await generateTeamRosterPdf(team, config)
  const safeName = team.name.replace(/[^a-zA-Z0-9äöüÄÖÜß_-]/g, "_")
  doc.save(`Kader_${safeName}_${team.gender}.pdf`)
}

/**
 * Erzeugt ein mehrseitiges Sammel-PDF für eine Liste von Mannschaften (jede Mannschaft genau 1 DIN-A4-Seite).
 */
export async function generateAllTeamsRosterPdf(
  teams: Team[],
  config: TournamentConfig
): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  }) as DocWithAutoTable

  // Teams sortieren: Erst wU14, dann mU14; innerhalb nach Gruppe A/B; innerhalb nach Name
  const sortedTeams = [...teams].sort((a, b) => {
    if (a.gender !== b.gender) {
      return a.gender === "wU14" ? -1 : 1
    }
    if (a.group !== b.group) {
      return a.group.localeCompare(b.group)
    }
    return a.name.localeCompare(b.name)
  })

  const totalPages = sortedTeams.length || 1

  // Logos vorab parallel laden
  const logoDataMap = new Map<string, string>()
  await Promise.all(
    sortedTeams.map(async (t) => {
      const dataUrl = await loadLogoDataUrl(t.logoUrl, t.id)
      if (dataUrl) {
        logoDataMap.set(t.id, dataUrl)
      }
    })
  )

  sortedTeams.forEach((team, index) => {
    if (index > 0) {
      doc.addPage("a4", "portrait")
    }
    const pageNum = index + 1
    const logoDataUrl = logoDataMap.get(team.id) || ""
    renderTeamRosterPage(doc, team, config, logoDataUrl, pageNum, totalPages)
  })

  return doc
}

/**
 * Lädt das Sammel-PDF aller übergebenen Mannschaften herunter.
 */
export async function downloadAllTeamsRosterPdf(
  teams: Team[],
  config: TournamentConfig,
  customFilename?: string
): Promise<void> {
  const doc = await generateAllTeamsRosterPdf(teams, config)
  const filename = customFilename || "KBC_Spielkader_Alle_Teams.pdf"
  doc.save(filename)
}
