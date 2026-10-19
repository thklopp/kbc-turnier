# SPEC-049: PDF-Spielplan mit Live-/Endergebnissen und aktuellem Tabellenstand

> **Status**: Entwurf  
> **Typ**: Feature / Optimierung  
> **Branch**: feat/SPEC-049-pdf-spielplan-ergebnisse-und-tabellenstand  
> **Autor**: Agent  
> **Erstellt am**: 2026-10-19  
> **Letzte Änderung**: 2026-10-19  
> **Betroffene Bereiche**: Gast-Ansicht (/) | PDF-Export | `src/services/pdfScheduleService.ts`  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Mit SPEC-040 wurde der PDF-Download des Spielplans als dreiseitiges DIN-A4-Dokument im Hochkantformat eingeführt. Dieser war primär als statische Vorlage / handschriftlicher Druckbogen vor dem Turnier ausgelegt:
- Auf Seite 1 (Gruppenübersicht) wurden die Spalten für *Spiele*, *Tore* und *Punkte* immer als leere Zeilen ausgegeben.
- Auf Seite 2 (Vorrunde) und Seite 3 (Finalrunde) wurden in der Spalte *Ergebnis* ausnahmslos leere Eingabestriche (`     :     `) gedruckt.
- Auf Seite 3 (Finalrunde) wurden zudem immer nur die Platzhaltertexte (z. B. „1. Gruppe A“) anstelle der eventuell schon feststehenden Teams angezeigt.

Sobald das Turnier im Gange ist oder Partien abgeschlossen sind, möchten Turnierleitung, Trainer, Schiedsrichter und Zuschauer jedoch einen aktuellen Zwischenstand oder Endstand als PDF exportieren können, der alle bereits feststehenden Ergebnisse und den aktuellen Tabellenstand der Gruppen widerspiegelt.

### 1.2 Zielzustand & Mehrwert
- **Aktueller Tabellenstand auf Seite 1 (Gruppenübersicht)**:
  - Wurden in einer Gruppe bereits Spiele ausgetragen oder gestartet, werden die Teams gemäß ihrer aktuellen Platzierung (berechnet nach offiziellen Hallenhockey-Kriterien über `calculateGroupStandings`) sortiert dargestellt.
  - Die Spalten *Spiele*, *Tore (Diff.)* (z. B. `12:4 (+8)`) und *Punkte* werden mit den aktuellen Werten befüllt.
  - Wurde in einer Gruppe noch kein einziges Spiel gestartet/ausgetragen, bleiben die Spalten leer (`     :     `), sodass das Dokument vor Turnierbeginn weiterhin als Blanko-Vorlage zum Mitschreiben dient.
- **Ergebnisse in Vor- und Finalrunde (Seite 2 & 3)**:
  - Bei Spielen mit feststehendem Ergebnis bzw. beendeten Spielen (`status === "finished"`) sowie laufenden/pausierten Spielen (`status === "live" | "paused"`) wird das ermittelte Ergebnis (z. B. `3 : 1`) in der Spalte *Ergebnis* ausgegeben.
  - Bei noch nicht begonnenen Spielen (`status === "scheduled"`) bleibt das leere Feld `"     :     "` erhalten.
- **Finalrunden-Paarungen (Seite 3)**:
  - Sobald Teams für Finalspiele qualifiziert und zugewiesen sind, werden die realen Vereinsnamen gedruckt; solange Teams noch nicht feststehen, verbleibt der Vorlagen-Platzhalter (z. B. „1. Gruppe A“).

---

## 2. User Stories

- **US-1**: Als **Trainer / Betreuer / Zuschauer** möchte ich beim Herunterladen des PDF-Spielplans während des Turniers sofort sehen, welche Partien wie ausgegangen sind, damit ich den aktuellen Turnierverlauf schwarz auf weiß habe.
- **US-2**: Als **Turnierleitung / Trainer** möchte ich auf der ersten Seite des PDFs die aktuellen Tabellen mit den tatsächlichen Punkten, Toren und Rängen sehen, anstatt leerer Tabellenfelder.
- **US-3**: Als **Nutzer vor Turnierbeginn** möchte ich weiterhin ein PDF mit leeren Notizfeldern für noch ungespielte Partien erhalten, um Ergebnisse bei Bedarf handschriftlich notieren zu können.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)
- [ ] **Seite 1: Gruppenübersicht & Tabellenstand**:
  - Nutzung des bestehenden `calculateGroupStandings(teams, matches, gender, group)` aus `src/services/standingsService.ts`.
  - Wenn in einer Gruppe mindestens ein Spiel beendet oder aktiv ist (`finished`, `live`, `paused`):
    - Teams nach Rang sortiert anzeigen (Plätze 1 bis max. 4).
    - `Spiele`: Anzahl gespielter Spiele als Zahl (z. B. `3`).
    - `Tore (Diff.)`: Format `${goalsFor}:${goalsAgainst} (${diffSign}${goalDifference})` (z. B. `7:2 (+5)` oder `3:3 (0)`).
    - `Punkte`: Punktzahl als Zahl (z. B. `9`).
  - Wenn in einer Gruppe noch kein Spiel ausgetragen/gestartet wurde:
    - Ausgabe der Teams mit leeren Feldern für *Spiele*, *Tore (Diff.)* (`     :     `) und *Punkte* als handschriftliche Vorlage.
- [ ] **Seite 2: Vorrundenspiele (Matches 1..24)**:
  - Bei Spielen mit Status `finished`, `live` oder `paused`:
    - Ausgabe von `${scoreHome} : ${scoreAway}` in der Ergebnisspalte.
  - Bei Spielen mit Status `scheduled`:
    - Ausgabe von `"     :     "` für handschriftliche Notizen.
- [ ] **Seite 3: Finalrunde (Matches 25..36)**:
  - Teamnamen: Reale Namen anzeigen, wenn `teamHomeId` / `teamAwayId` zugewiesen sind (`teamMap.get(m.teamHomeId)?.name || m.teamHomePlaceholder || "Heim"`).
  - Ergebnisspalte:
    - Bei Spielen mit Status `finished`, `live` oder `paused`: `${scoreHome} : ${scoreAway}`.
    - Bei `scheduled`: `"     :     "`.
- [ ] **Design & Layout**:
  - Beibehaltung des 3-seitigen A4-Hochkant-Formats mit konsistenter Kopf- und Fußzeile, Rändern und Zeilenhöhen.
  - Keine Umbrüche oder Layoutverschiebungen bei ein- oder zweistelligen Toren / Punkten.

### 3.2 Explizit Out-of-Scope
- Keine Änderung an der Datenhaltung (Firestore / `DATABASE.md`).
- Keine Änderungen an den bestehenden UI-Views (`GuestLayout`, `StandingsView`, etc.).
- Keine zusätzlichen Seiten für Torschützenlisten oder Strafkarten im PDF.

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien
- [ ] **AC-1: Ergebnisse beendeter Spiele im PDF**
  - **Gegeben sei**: Mehrere Spiele der Vorrunde (z. B. Spiel 1 und 2) sind beendet mit Ergebnissen `3:1` und `0:2`.
  - **Wenn**: Der Benutzer im Gast-Footer auf „PDF-Spielplan“ klickt und das PDF öffnet.
  - **Dann**: Steht auf Seite 2 bei Spiel 1 `3 : 1` und bei Spiel 2 `0 : 2`.
  - **Und**: Ungespielte Partien weisen weiterhin das leere Ergebnisfeld `"     :     "` auf.

- [ ] **AC-2: Aktueller Tabellenstand auf Seite 1**
  - **Gegeben sei**: In wU14 Gruppe A wurden bereits Spiele gespielt.
  - **Wenn**: Das PDF generiert wird.
  - **Dann**: Entspricht die Reihenfolge der Teams auf Seite 1 in der Tabelle „wU14 – Gruppe A“ exakt der berechneten Tabelle aus `calculateGroupStandings`.
  - **Und**: Die Spalten *Spiele*, *Tore (Diff.)* und *Punkte* zeigen die echten Statistiken der Teams.

- [ ] **AC-3: Fallback für ungespielte Gruppen (Blanko-Modus)**
  - **Gegeben sei**: In einer Gruppe (z. B. vor Turnierbeginn) wurde noch kein einziges Spiel gestartet oder beendet.
  - **Wenn**: Das PDF generiert wird.
  - **Dann**: Werden die Teams der Gruppe aufgelistet, die Spalten für *Spiele*, *Tore* und *Punkte* sind jedoch leer (`""` bzw. `"     :     "`), um handschriftliche Eintragungen zu ermöglichen.

- [ ] **AC-4: Finalspiele mit ermittelten Teams und Ergebnissen**
  - **Gegeben sei**: Die Vorrunde ist beendet und die Halbfinal-Teams stehen fest (z. B. Spiel 29). Ein Halbfinale wurde bereits mit `2:1` beendet.
  - **Wenn**: Das PDF generiert wird.
  - **Dann**: Werden auf Seite 3 die echten Teamnamen statt reiner Platzhalter gedruckt.
  - **Und**: Das Ergebnis `2 : 1` wird im Ergebnisfeld des Spiels ausgewiesen.

### 4.2 Allgemeine Qualitätskriterien
- [ ] TypeScript strikt ohne `any`.
- [ ] `npm run build` und `npm run lint` laufen ohne Fehler durch.
- [ ] Keine fest kodierten Parameter.

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Betroffene Ansichten & Komponenten
- `src/services/pdfScheduleService.ts`:
  - `generateSchedulePdf(...)`
  - Integration von `calculateGroupStandings` für Seite 1.
  - Bedingte Ergebnisausgabe für Seite 2 und 3.
  - Priorisierung von tatsächlichen Teamnamen bei zugewiesenen Finalpaarungen auf Seite 3.

### 5.2 Interaktionsablauf
1. Der Benutzer klickt wie gewohnt im Footer auf „PDF-Spielplan“.
2. Das PDF wird clientseitig mit den aktuellen Firestore-Daten generiert und heruntergeladen.
3. Der Ausdruck oder die PDF-Anzeige zeigt den exakten aktuellen Turnierstand.

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Abhängigkeiten & Services
- Keine neuen npm-Pakete erforderlich (`jspdf` und `jspdf-autotable` sind bereits vorhanden).
- Import von `calculateGroupStandings` aus `@/services/standingsService`.

### 6.2 Keine Schemaänderungen
- `DATABASE.md` bleibt unverändert, da alle benötigten Felder (`scoreHome`, `scoreAway`, `status`, `teamHomeId`, `teamAwayId`, `teamHomePlaceholder`, etc.) bereits im Datenmodell existieren.

---

## 7. Verifikations- & Testplan

### 7.1 Manuelle Tests
1. [ ] PDF vor Turnierstart (ohne beendete Spiele):
   - Prüfen, dass Seite 1 leere Spalten zum handschriftlichen Eintragen besitzt.
   - Prüfen, dass Seite 2 und 3 leere Ergebnisfelder besitzen.
2. [ ] PDF während/nach Turnierspielen:
   - Mindestens ein Vorrundenspiel auf `finished` mit Toren setzen.
   - PDF herunterladen: Prüfen, dass Seite 1 die Tabelle mit Spielen, Tordifferenz und Punkten korrekt darstellt.
   - Prüfen, dass Seite 2 das Ergebnis anzeigt.
3. [ ] Finalrunden-Prüfung:
   - Finalspiel mit zugewiesenen Teams und Ergebnis prüfen (echte Teamnamen und Ergebnis vorhanden).

### 7.2 Automatisierte Validierung
- [ ] `npm run lint`
- [ ] `npm run build`
