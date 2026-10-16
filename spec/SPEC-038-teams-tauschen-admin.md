# SPEC-038: Teams tauschen in der Admin-Teamverwaltung

> **Status**: In Abnahme  
> **Typ**: Feature  
> **Branch**: `feat/SPEC-038-teams-tauschen-admin`  
> **Autor**: Agent (Antigravity)  
> **Erstellt am**: 2026-10-16  
> **Letzte Änderung**: 2026-10-16  
> **Betroffene Bereiche**: Turnierleitung (/admin) | Datenbank/Firestore  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
In der Turnierverwaltung (`/admin` -> Reiter *Teams*) werden die 16 Mannschaften (8x wU14, 8x mU14) initial angelegt (z. B. via Standardteams-Seed). Dabei besitzt jede Mannschaft eine feste ID (z. B. `team-wu14-1` bis `team-wu14-8`), die gleichzeitig die Zuteilung zu einer Gruppe (A oder B) und die Paarungsposition im automatischen Spielplan definiert.
Bislang gibt es keine einfache Möglichkeit, zwei Mannschaften miteinander zu vertauschen, um:
1. Eine Mannschaft von Gruppe A nach Gruppe B (oder umgekehrt) zu verschieben.
2. Die Setzposition innerhalb einer Gruppe zu verändern (z. B. damit zwei bestimmte Vereine nicht direkt im Eröffnungsspiel aufeinandertreffen).
3. Dies durchzuführen, ohne alle Vereinsdaten, Logos, Kader und Jingle-Uploads manuell neu eintippen zu müssen.

### 1.2 Zielzustand & Mehrwert
Die Turnierleitung kann im Adminbereich über einen übersichtlichen Auswahldialog sowie über Schnellwahlschaltflächen an den Team-Karten zwei Mannschaften schnell und sicher gegeneinander tauschen:
- **Geschlechter-Integrität**: Ein Tausch ist ausschließlich innerhalb desselben Geschlechts erlaubt (`wU14` mit `wU14`, `mU14` mit `mU14`). Ein versehentliches Vertauschen von Mädchen- und Jungenteams ist technisch ausgeschlossen.
- **Gruppenübergreifend & gruppenintern**: Ein Tausch ist sowohl innerhalb einer Gruppe (A ⇄ A, B ⇄ B) als auch gruppenübergreifend (A ⇄ B) möglich.
- **ID- und Slot-Tausch**: Die Dokument-IDs und die damit verknüpften Spielplan-Slots (und Gruppenzugehörigkeiten der Slots) bleiben fest im Spielplan verankert; die Vereine (Name, Kurzname, Logo, Jingle-URL, Jingle-Token, Spielerkader, Kontaktdaten) tauschen die Dokumente bzw. Plätze. Dadurch aktualisiert sich auch ein bereits generierter Spielplan sofort und nahtlos auf die neuen Teams, ohne Spielnummern oder Anstoßzeiten zu zerstören.
- **Sicherheits-Gate**: Wurden für die betroffene Altersklasse bereits Spiele angepfiffen oder beendet (`live` oder `finished`), wird das Vertauschen gesperrt, um Verfälschungen historischer Spielergebnisse zu verhindern.

---

## 2. User Stories

- **US-1**: Als **Turnierleiter** möchte ich in der Teamverwaltung zwei Mädchen- oder zwei Jungenteams per Knopfdruck gegeneinander tauschen können, um die Gruppeneinteilungen und Spielplan-Startplätze individuell und flexibel zusammenzustellen.
- **US-2**: Als **Turnierleiter** möchte ich vor der Ausführung des Tauschs eine klare Vorschau sehen (welches Team von welcher Gruppe auf welchen Platz wechselt), um Fehlbedienungen zu vermeiden.
- **US-3**: Als **Turnierleiter** möchte ich direkt an einer Team-Karte einen Tausch anstoßen können, damit dieses Team im Tausch-Dialog bereits vorausgewählt ist.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)
- [x] **Tausch-Service (`swapTeams`)**:
  - Atomare Vertauschung der Team-Identitäten (Name, Kurzname, Logo-URL, Jingle-URL, Jingle-Startzeit, Jingle-Token, Spieler-Array, Kontaktdaten) in Firestore via `writeBatch` (bzw. im Mock-Storage für Offline/Dev).
  - Tausch zwischen Teams verschiedener Gruppen: Doc A (Gruppe A) behält `group: "A"`, Doc B (Gruppe B) behält `group: "B"`. Team A wechselt dadurch nach Gruppe B, Team B nach Gruppe A.
  - Tausch innerhalb derselben Gruppe: Beide behalten ihre Gruppe, tauschen jedoch die Slot-Position/ID.
  - Das `jingleToken` wandert mit dem Team mit, sodass bereits verteilte Betreuer-Links für den Jingle-Upload für den jeweiligen Verein gültig bleiben.
- [x] **Validierungsregeln**:
  - Teams müssen das gleiche Geschlecht (`gender`) haben.
  - Ein Team kann nicht mit sich selbst getauscht werden.
  - Beide Teams müssen existieren.
  - Sperre / Warnung, falls Spiele dieser Altersklasse bereits im Status `live` oder `finished` sind.
- [x] **UI-Komponenten**:
  - Neuer Button `Teams tauschen` im Header der Teamverwaltung (`TeamList.tsx`).
  - Neuer Quick-Action Button (z. B. `ArrowLeftRight`) auf jeder `TeamCard.tsx`.
  - Neues Modal `TeamSwapModal.tsx` mit:
    - Geschlechter-Umschalter (wU14 / mU14).
    - Dropdown/Auswahlliste für Team 1 und Team 2.
    - Visuelle Gegenüberstellung (Logo, Name, aktuelle Gruppe, ID).
    - Statusprüfung bezüglich bereits laufender Spiele.
    - Bestätigungsbutton "Teams jetzt tauschen" mit Ladeanzeige.

### 3.2 Explizit Out-of-Scope
- Kein Tausch zwischen Mädchen und Jungs (wU14 ⇄ mU14 ist strikt verboten).
- Kein manuelles Umsortieren während eines laufenden Spielbetriebs (laufende/beendete Matches sperren den Tausch).

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien

- [x] **AC-1: Tausch zweier Teams zwischen den Gruppen (A ⇄ B)**
  - **Gegeben sei**: Team 1 ist "Kreuznacher HC (w)" (Gruppe A, ID `team-wu14-1`) und Team 2 ist "SC Frankfurt 1880 (w)" (Gruppe B, ID `team-wu14-6`).
  - **Wenn**: Die Turnierleitung im Tausch-Dialog Team 1 und Team 2 auswählt und auf "Teams jetzt tauschen" klickt.
  - **Dann**:
    - Befindet sich "SC Frankfurt 1880 (w)" auf Platz 1 von Gruppe A mit ID `team-wu14-1`.
    - Befindet sich "Kreuznacher HC (w)" auf Platz 2 von Gruppe B mit ID `team-wu14-6`.
    - Alle Kader (`players`), Jingle-Tokens und Logos der beiden Teams sind vollständig und korrekt mitgewandert.
    - Alle existierenden Vorrundenspiele, die zuvor `team-wu14-1` referenzierten, zeigen nun automatisch "SC Frankfurt 1880 (w)".

- [x] **AC-2: Tausch zweier Teams innerhalb derselben Gruppe (A ⇄ A)**
  - **Gegeben sei**: Team 1 ist "Kreuznacher HC (w)" (Gruppe A, ID `team-wu14-1`) und Team 2 ist "Dürkheimer HC (w)" (Gruppe A, ID `team-wu14-2`).
  - **Wenn**: Beide Teams im Dialog ausgewählt und getauscht werden.
  - **Dann**:
    - Behalten beide Teams die Gruppe A.
    - Tauschen beide Teams ihre IDs und damit ihre Ansetzungen im Spielplan.

- [x] **AC-3: Strikte Trennung nach Geschlechtern**
  - **Gegeben sei**: Die Turnierleitung öffnet den Tausch-Dialog.
  - **Wenn**: Als Geschlecht "wU14" gewählt ist.
  - **Dann**: Werden in den Auswahllisten ausschließlich wU14-Teams angezeigt. Ein Auswählen eines mU14-Teams ist unmöglich.

- [x] **AC-4: Schnellaktion an der Team-Karte**
  - **Gegeben sei**: Die Turnierleitung betrachtet die Team-Karten in `/admin`.
  - **Wenn**: An einer Team-Karte auf das Tauschen-Icon geklickt wird.
  - **Dann**: Öffnet sich das `TeamSwapModal` mit diesem Team als vorausgewähltes "Team 1" und passend gesetzter Geschlechter-Kategorie.

- [x] **AC-5: Schutz vor Tausch bei laufendem Turnier**
  - **Gegeben sei**: Für die Altersklasse wU14 ist bereits mindestens ein Spiel im Status `live` oder `finished`.
  - **Wenn**: Die Turnierleitung den Tausch-Dialog für wU14 öffnet.
  - **Dann**: Wird ein warnender Hinweis angezeigt, dass der Spielbetrieb bereits läuft und Teams nicht mehr getauscht werden können, und die Tausch-Schaltfläche ist deaktiviert.

### 4.2 Allgemeine Qualitätskriterien
- [x] Keine fest kodierten Parameter (`AGENTS.md`).
- [x] Vollständige TypeScript-Typisierung ohne `any`.
- [x] Firestore Batch-Operation für atomare Ausführung (`writeBatch`).
- [x] Build (`npm run build`) und Linter laufen fehlerfrei durch.

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Betroffene Ansichten & Komponenten
- **Pfad**: `/admin` (Reiter `teams`)
- **Komponenten**:
  - `src/components/admin/TeamList.tsx`: Neuer Button "Teams tauschen" in der oberen Aktionsleiste.
  - `src/components/admin/TeamCard.tsx`: Neuer Quick-Action Button mit Tooltip "Team tauschen".
  - `src/components/admin/TeamSwapModal.tsx` (neu): Modal-Dialog zur Auswahl und Bestätigung des Tauschs.

### 5.2 Interaktionsablauf
1. **Aufruf**:
   - Entweder über Button "Teams tauschen" in der Aktionsleiste von `TeamList`.
   - Oder direkt per Klick auf den Tauschen-Button an einer beliebigen `TeamCard`.
2. **Auswahl**:
   - Geschlecht wählen (wU14 oder mU14).
   - Team 1 wählen (falls nicht schon über Card vorselektiert).
   - Team 2 wählen (Liste filtert automatisch Team 1 heraus).
3. **Vorschau**:
   - Die Box zeigt beide Teams mit Logo, Name, ID und Gruppe sowie den Pfeil `⇄`.
   - Textuelle Erklärung der Auswirkung (z. B. "Wechselt von Gruppe A nach Gruppe B").
4. **Bestätigung**:
   - Klick auf "Teams jetzt tauschen".
   - Atomare Speicherung in Firestore / Mock-Storage.
   - Modal schließt sich, UI aktualisiert sich in Echtzeit.

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Datenmodell (`DATABASE.md`)
- Keine neuen Collections oder Schema-Änderungen erforderlich. Die bestehende `teams`-Collection und `matches`-Collection decken die Funktionalität 1:1 ab.

### 6.2 TypeScript & Service-Funktionen
- In `src/services/teamService.ts`:
  ```typescript
  export async function swapTeams(
    team1Id: string,
    team2Id: string
  ): Promise<void>
  ```
- Liest beide Teams aus Firestore (bzw. Mock).
- Verifiziert: `team1.gender === team2.gender` und `team1Id !== team2Id`.
- Schreibt in einem `writeBatch`:
  - `doc(db, "teams", team1Id)` erhält alle Inhaltsdaten von Team 2 (inkl. `jingleToken`, `players` etc.), behält aber die ursprüngliche Gruppe von Team 1.
  - `doc(db, "teams", team2Id)` erhält alle Inhaltsdaten von Team 1, behält aber die ursprüngliche Gruppe von Team 2.
  - Beide Dokumente erhalten `updatedAt: serverTimestamp()`.

---

## 7. Edge Cases & Fehlerbehandlung

- **Identische Teams**: Die Benutzeroberfläche verhindert die Auswahl desselben Teams für Team 1 und Team 2.
- **Unterschiedliche Geschlechter**: Technisch durch strikte Filterung im Dropdown und serverseitige/Service-seitige Überprüfung abgewehrt.
- **Ungültige oder fehlende Teams**: Fehlermeldung bei fehlenden Daten.
- **Verbindungsabbruch während des Tauschs**: Durch `writeBatch` werden entweder beide Dokumente gemeinsam aktualisiert oder keines (kein inkonsistenter Halb-Zustand).

---

## 8. Verifikations- & Testplan

1. **Testfall 1 (Gruppenübergreifend wU14)**:
   - Team 1 aus Gruppe A (`team-wu14-1`) und Team 2 aus Gruppe B (`team-wu14-5`) tauschen.
   - Prüfen: In der Admin-Teamliste und in der Spielplanansicht erscheint das bisherige Team 5 nun in Gruppe A und Team 1 in Gruppe B.
2. **Testfall 2 (Gruppenintern mU14)**:
   - Team 1 aus Gruppe A (`team-mu14-1`) und Team 2 aus Gruppe A (`team-mu14-2`) tauschen.
   - Prüfen: Die Plätze und IDs im Spielplan sind vertauscht.
3. **Testfall 3 (Jingle & Kader-Konsistenz)**:
   - Vor dem Tausch Spieler zu Team 1 hinzufügen.
   - Nach dem Tausch prüfen: Die Spieler gehören weiterhin zum selben Team-Namen und Wappen (am neuen Slot).
4. **Testfall 4 (Build & Typen)**:
   - `npm run build` muss ohne Fehler durchlaufen.
