# SPEC-029: Tausch der Halbfinals mit den Platzierungsspielen (Qualifikation 5-8) im Sonntags-Spielplan

> **Status**: In Abnahme  
> **Typ**: Optimierung / Ablaufanpassung  
> **Branch**: feat/SPEC-029-spielplan-halbfinals-platzierungsspiele-tauschen  
> **Autor**: Antigravity Agent  
> **Erstellt am**: 2026-10-12  
> **Letzte Änderung**: 2026-10-12  
> **Betroffene Bereiche**: Spielplan-Services (`matchService.ts`, `matchProgressionService.ts`) | Turnierleitung (/admin) | Gast-Ansicht (/) | Kiosk (/kiosk)  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Im bisherigen Spielplan für den Final-Sonntag (16 Spiele, Matches #25 bis #40) war der Ablauf in vier 4er-Blöcke (jeweils 2× wU14 gefolgt von 2× mU14) wie folgt unterteilt:
- **Block 1 (Spiele 25–28)**: Halbfinals (1. Gruppe A vs. 2. Gruppe B / 1. Gruppe B vs. 2. Gruppe A)
- **Block 2 (Spiele 29–32)**: Platzierungs-Qualifikation 5–8 (3. Gruppe A vs. 4. Gruppe B / 3. Gruppe B vs. 4. Gruppe A)
- **Block 3 (Spiele 33–36)**: Platzierungsspiele um Platz 7/8 und Platz 5/6 (aus Qualifikation 5–8)
- **Block 4 (Spiele 37–40)**: Medaillenspiele: Spiel um Platz 3 und Finale (aus Halbfinals)

Dieser Ablauf wies zwei organisatorische und sportliche Nachteile auf:
1. **Keine Pause für Quali-Teams**: Die Teams aus Block 2 (Quali 5–8) mussten unmittelbar danach in Block 3 (Platzierungsspiele) antreten, sodass sie kaum Regenerationszeit hatten.
2. **Überlange Wartezeit für Halbfinalisten**: Die Halbfinalisten aus Block 1 mussten 8 Spiele (zwei komplette Blöcke, ca. 2,5 bis 3 Stunden) pausieren, bevor sie im Finale bzw. Spiel um Platz 3 (Block 4) antraten.
3. **Turnierdramaturgie**: In klassischen Turnierformaten eröffnen am Finaltag die Platzierungsspiele der Gruppendritten und -vierten den Tag, während die Halbfinals als Höhepunkt im späteren Vormittag/Mittag stattfinden und direkt auf den Finalblock hinführen.

### 1.2 Zielzustand & Mehrwert
Die Halbfinalspiele und die ersten Platzierungsspiele (Qualifikation 5–8) werden in der Reihenfolge getauscht:
- **Block 1 (Spiele 25–28)**: Platzierungs-Qualifikation 5–8 (2× wU14, 2× mU14)
- **Block 2 (Spiele 29–32)**: Halbfinals (2× wU14, 2× mU14)
- **Block 3 (Spiele 33–36)**: Platzierungsspiele um Platz 7 und Platz 5 (gespeist aus Block 1)
- **Block 4 (Spiele 37–40)**: Spiel um Platz 3 und Finale (gespeist aus Block 2)

**Mehrwert:**
- Jedes Team erhält zwischen seinem ersten Spiel und seinem Platzierungs-/Finalspiel am Sonntag eine ideale Regenerationspause von genau einem 4er-Spielblock (ca. 80–100 Minuten).
- Die Halbfinals finden zeitnäher zu den Medaillenspielen statt.
- Der Wechselrhythmus (strikter Blockwechsel: 2× wU14, 2× mU14) bleibt zu 100 % erhalten.

---

## 2. User Stories

- **US-1 (Turnierleitung)**: Als **Turnierleiter** möchte ich, dass am Sonntag zuerst die Qualifikationsspiele der Plätze 5–8 ausgetragen werden und danach die Halbfinals, damit alle Teams faire Pausenzeiten zwischen ihren Spielen haben.
- **US-2 (Turnierleitung & Teams)**: Als **Trainer/Team** möchte ich nach einem Halbfinale nicht fast drei Stunden auf das Finale warten müssen, sondern nach angemessener Pause direkt im Finalblock antreten.
- **US-3 (Turnierleitung)**: Als **Turnierleiter** möchte ich, dass die automatische Zuweisung der Finalpaarungen (`syncFinalRoundMatches`) nach dem Tausch automatisch die richtigen Sieger/Verlierer in die entsprechenden Endspiele (Platz 7/5 aus Spielen 25–28; Platz 3/Finale aus Spielen 29–32) einsetzt.
- **US-4 (Zuschauer & Kiosk)**: Als **Zuschauer in der Halle** möchte ich im Spielplan chronologisch zuerst die Platzierungsspiele 5–8 und danach die Halbfinals sehen, gefolgt von den Entscheidungsspielen.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)
- [x] **Anpassung der Spielplan-Generierung (`generateTournamentSchedule` in `src/services/matchService.ts`)**:
  - **Block 1 (Spiele 25–28)** neu:
    - Spiel 25: `gender: "wU14"`, `finalType: "placement_7_8"`, `matchName: "Platzierungsspiel 1"`, `homePlaceholder: "3. Gruppe A"`, `awayPlaceholder: "4. Gruppe B"`
    - Spiel 26: `gender: "wU14"`, `finalType: "placement_7_8"`, `matchName: "Platzierungsspiel 2"`, `homePlaceholder: "3. Gruppe B"`, `awayPlaceholder: "4. Gruppe A"`
    - Spiel 27: `gender: "mU14"`, `finalType: "placement_7_8"`, `matchName: "Platzierungsspiel 1"`, `homePlaceholder: "3. Gruppe A"`, `awayPlaceholder: "4. Gruppe B"`
    - Spiel 28: `gender: "mU14"`, `finalType: "placement_7_8"`, `matchName: "Platzierungsspiel 2"`, `homePlaceholder: "3. Gruppe B"`, `awayPlaceholder: "4. Gruppe A"`
  - **Block 2 (Spiele 29–32)** neu:
    - Spiel 29: `gender: "wU14"`, `finalType: "semi_final"`, `matchName: "Halbfinale 1"`, `homePlaceholder: "1. Gruppe A"`, `awayPlaceholder: "2. Gruppe B"`
    - Spiel 30: `gender: "wU14"`, `finalType: "semi_final"`, `matchName: "Halbfinale 2"`, `homePlaceholder: "1. Gruppe B"`, `awayPlaceholder: "2. Gruppe A"`
    - Spiel 31: `gender: "mU14"`, `finalType: "semi_final"`, `matchName: "Halbfinale 1"`, `homePlaceholder: "1. Gruppe A"`, `awayPlaceholder: "2. Gruppe B"`
    - Spiel 32: `gender: "mU14"`, `finalType: "semi_final"`, `matchName: "Halbfinale 2"`, `homePlaceholder: "1. Gruppe B"`, `awayPlaceholder: "2. Gruppe A"`
  - **Block 3 (Spiele 33–36)**:
    - Spiel 33: `matchName: "Spiel um Platz 7"` (wU14) – `homePlaceholder: "Verlierer Spiel 25"`, `awayPlaceholder: "Verlierer Spiel 26"`
    - Spiel 34: `matchName: "Spiel um Platz 5"` (wU14) – `homePlaceholder: "Sieger Spiel 25"`, `awayPlaceholder: "Sieger Spiel 26"`
    - Spiel 35: `matchName: "Spiel um Platz 7"` (mU14) – `homePlaceholder: "Verlierer Spiel 27"`, `awayPlaceholder: "Verlierer Spiel 28"`
    - Spiel 36: `matchName: "Spiel um Platz 5"` (mU14) – `homePlaceholder: "Sieger Spiel 27"`, `awayPlaceholder: "Sieger Spiel 28"`
  - **Block 4 (Spiele 37–40)**:
    - Spiel 37: `matchName: "Spiel um Platz 3"` (wU14) – `homePlaceholder: "Verlierer HF 1"`, `awayPlaceholder: "Verlierer HF 2"`
    - Spiel 38: `matchName: "Finale"` (wU14) – `homePlaceholder: "Sieger HF 1"`, `awayPlaceholder: "Sieger HF 2"`
    - Spiel 39: `matchName: "Spiel um Platz 3"` (mU14) – `homePlaceholder: "Verlierer HF 1"`, `awayPlaceholder: "Verlierer HF 2"`
    - Spiel 40: `matchName: "Finale"` (mU14) – `homePlaceholder: "Sieger HF 1"`, `awayPlaceholder: "Sieger HF 2"`

- [x] **Anpassung des Progressions-Services (`matchProgressionService.ts`)**:
  - Vorrunden-Tabellenabschluss Stufe 1:
    - 3. & 4. Plätze fließen in Spiele 25, 26 (wU14) bzw. 27, 28 (mU14)
    - 1. & 2. Plätze fließen in Spiele 29, 30 (wU14) bzw. 31, 32 (mU14)
  - K.o.-Abschluss Stufe 2:
    - Sieger/Verlierer der Platzierungsspiele 25 & 26 fließen in Spiel 34 (Platz 5) und Spiel 33 (Platz 7)
    - Sieger/Verlierer der Halbfinals 29 & 30 fließen in Spiel 38 (Finale) und Spiel 37 (Platz 3)
    - Sieger/Verlierer der Platzierungsspiele 27 & 28 fließen in Spiel 36 (Platz 5) und Spiel 35 (Platz 7)
    - Sieger/Verlierer der Halbfinals 31 & 32 fließen in Spiel 40 (Finale) und Spiel 39 (Platz 3)

- [x] **Aktualisierung bestehender Tests (`tests/spec025FinalRoundProgression.test.ts`, `tests/spec012SpielplanAnpassungen.test.ts`)**:
  - Testfälle auf die neuen Spielnummern anpassen und verifizieren.

### 3.2 Explizit Out-of-Scope
- Keine Änderung an der Spielzeit, Pausezeit oder den Startzeiten.
- Keine Änderung am Samstags-Plan (Spiele 1–24 bleiben absolut identisch).
- Keine Änderung an den Datenmodellen oder Firestore-Schemas.

---

## 4. Akzeptanzkriterien

- [x] **AC-1: Geänderte Spielplan-Reihenfolge am Sonntag**
  - **Gegeben sei**: Ein neu generierter Spielplan.
  - **Dann**:
    - Haben die Spiele 25 und 26 (wU14) sowie 27 und 28 (mU14) die Bezeichnung `"Platzierungsspiel 1"` / `"Platzierungsspiel 2"` und den Typ `"placement_7_8"`.
    - Haben die Spiele 29 und 30 (wU14) sowie 31 und 32 (mU14) die Bezeichnung `"Halbfinale 1"` / `"Halbfinale 2"` und den Typ `"semi_final"`.
    - Haben Spiele 33 und 35 die Bezeichnung `"Spiel um Platz 7"` und Spiele 34 und 36 `"Spiel um Platz 5"`.
    - Haben Spiele 37 und 39 die Bezeichnung `"Spiel um Platz 3"` und Spiele 38 und 40 `"Finale"`.

- [x] **AC-2: Korrekte Zuordnung der Vorrundengruppen-Platzierungen**
  - **Gegeben sei**: Alle Vorrundenspiele einer Altersklasse sind beendet.
  - **Wenn**: Die Progression ausgeführt wird (`calculateFinalRoundAssignments` oder `syncFinalRoundMatches`).
  - **Dann**:
    - Spiel 25 erhält 3. Gruppe A vs. 4. Gruppe B (wU14).
    - Spiel 26 erhält 3. Gruppe B vs. 4. Gruppe A (wU14).
    - Spiel 27 erhält 3. Gruppe A vs. 4. Gruppe B (mU14).
    - Spiel 28 erhält 3. Gruppe B vs. 4. Gruppe A (mU14).
    - Spiel 29 erhält 1. Gruppe A vs. 2. Gruppe B (wU14).
    - Spiel 30 erhält 1. Gruppe B vs. 2. Gruppe A (wU14).
    - Spiel 31 erhält 1. Gruppe A vs. 2. Gruppe B (mU14).
    - Spiel 32 erhält 1. Gruppe B vs. 2. Gruppe A (mU14).

- [x] **AC-3: Korrekte Nachbesetzung der Platzierungs- und Medaillenspiele**
  - **Gegeben sei**: Die Sonntags-Spiele 25 bis 32 sind beendet.
  - **Dann**:
    - Spiel 33 (Platz 7 wU14) erhält die Verlierer aus Spiel 25 und Spiel 26.
    - Spiel 34 (Platz 5 wU14) erhält die Sieger aus Spiel 25 und Spiel 26.
    - Spiel 35 (Platz 7 mU14) erhält die Verlierer aus Spiel 27 und Spiel 28.
    - Spiel 36 (Platz 5 mU14) erhält die Sieger aus Spiel 27 und Spiel 28.
    - Spiel 37 (Platz 3 wU14) erhält die Verlierer aus Spiel 29 und Spiel 30.
    - Spiel 38 (Finale wU14) erhält die Sieger aus Spiel 29 und Spiel 30.
    - Spiel 39 (Platz 3 mU14) erhält die Verlierer aus Spiel 31 und Spiel 32.
    - Spiel 40 (Finale mU14) erhält die Sieger aus Spiel 31 und Spiel 32.

---

## 5. UI/UX & Interaktionskonzept

- **Spielplan-Ansichten (Gast, Admin, Kiosk)**:
  - Da alle Komponenten (`GuestScheduleView`, `FinalsBracketView`, `KioskFinalsSlide`, `ScheduleManager`) dynamisch nach `matchNumber`, `scheduledTime` und `finalType` rendern, bleibt die visuelle Darstellung konsistent:
    - Im chronologischen Spielplan erscheinen morgens um 09:00 Uhr die Quali-Spiele 5–8 (#25–28), gefolgt von den Halbfinals (#29–32).
    - Im Turnierbaum (`FinalsBracketView`) verbleiben die Halbfinals im Halbfinal-Abschnitt, referenzieren jedoch automatisch die korrekten Spielzeiten von Match 29–32.

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Datenmodell (`DATABASE.md`)
- Keine Änderungen am Firestore-Schema erforderlich.

### 6.2 Betroffene Dateien
- `src/services/matchService.ts`: Sunday Blocks Reordering in `generateTournamentSchedule`.
- `src/services/matchProgressionService.ts`: Match-Nummern in `calculateFinalRoundAssignments` anpassen.
- `tests/spec025FinalRoundProgression.test.ts`: Aktualisierung der Match-Nummern in den Unit Tests.
- `tests/spec012SpielplanAnpassungen.test.ts`: Aktualisierung der Match-Namen für Sonntag in den Unit Tests.
- Neu: `tests/spec029ScheduleSwap.test.ts`: Dedizierter Unit-Test für die neue Struktur.

---

## 7. Verifikations- & Testplan

### 7.1 Automatisierte Validierung
- [x] `npm test`: Alle Tests inkl. E2E und SPEC-025/029 müssen erfolgreich durchlaufen.
- [x] `npm run build`: Typisierung und Bundle-Build ohne Fehler.

### 7.2 Manuelle Prüfung
- [x] Generieren des Spielplans über `/admin` (bzw. im Testmodus) verifizieren.
- [x] Zeiten und Paarungs-Platzhalter für Matches 25 bis 32 kontrollieren.

---

## 8. Offene Fragen & Klärungsbedarf
- Keine.
