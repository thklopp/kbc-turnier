# SPEC-027: Redesign der Tabellen-Ansicht & Tab-Reihenfolge in der Gäste-Ansicht

> **Status**: Abgeschlossen  
> **Typ**: Optimierung / UI/UX  
> **Branch**: `feat/SPEC-027-guest-tabellen-redesign-und-reorder`  
> **Autor**: Antigravity  
> **Erstellt am**: 2026-10-12  
> **Letzte Änderung**: 2026-10-12  
> **Betroffene Bereiche**: Gast-Ansicht (`/`, `src/components/layouts/GuestLayout.tsx`, `src/components/guest/StandingsView.tsx`, `src/pages/guest/HomePage.tsx`)

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
In der mobilen und Desktop-Gäste-Ansicht (`/`) soll die Navigation intuitiver aufgebaut und die Tabellen-Seite optisch modernisiert werden:
- Der Tab „Tabellen“ befindet sich aktuell an dritter Position (zwischen „Spielplan“ und „Finalphase“), soll aber als abschließender Tab ganz ans Ende der Leiste wandern.
- In der Tabellenansicht (`StandingsView`) gibt es visuelle Inkonsistenzen:
  - Das Geschlecht wU14 wird an einigen Stellen rosa/pink dargestellt statt im etablierten Turnierschema „Lila“.
  - Die Umschalter-Buttons für die Altersklassen (wU14 / mU14) sind rechtsbündig und klein gehalten, statt auf mobilen Endgeräten die volle Breite einzunehmen.
  - In den Tabellenköpfen fehlt eine einheitliche Tag-Darstellung für Geschlecht und Gruppe in den Akzentfarben (Lila für wU14, Blau für mU14).
  - Das grüne Tag `Pl. 1 & 2 ➔ Halbfinale` und die farbigen Rang-Kennzeichnungen (Gold/Silber-Pills, grüne Zeilenhintergründe) lenken optisch ab und sollen entfernt werden.
  - Die Reihenfolge der Spalten führt aktuell Punkte vor Toren auf (`SP`, `PKT`, `Tore`), gewünscht ist der klassische Standard `SP`, `Tore`, `PKT`.
  - Punkte (`PKT`) sind starr blau hervorgehoben (auch bei wU14), anstatt die Akzentfarbe der jeweiligen Spielklasse (Lila bzw. Blau) zu spiegeln.
  - Der Erklärtext zur Hallenhockey-Wertung unterhalb der Tabellen ist für die Zielgruppe redundant und beansprucht unnötig vertikalen Raum.

### 1.2 Zielzustand & Mehrwert
- **Konsistente Farbsprache**: wU14 konsistent in Lila (`purple`), mU14 konsistent in Blau (`blue`).
- **Aufgeräumte Tabellen**: Ruhiges, klares Tabellenlayout ohne störende Playoff-Markierungen oder Erklärtexte.
- **Bessere Touch-Bedienung**: Volle Breite für die Altersklassen-Umschalter wU14 / mU14.
- **Logische Navigationsabfolge**: Live ➔ Spielplan ➔ Finalphase ➔ Tabellen.

---

## 2. User Stories

- **US-1**: Als **Gast oder Fan auf dem Smartphone** möchte ich **die Altersklassen wU14 und mU14 über breite, gut treffbare Buttons umschalten**, um **bequem mit dem Daumen zwischen den Turnierklassen zu wechseln**.
- **US-2**: Als **Zuschauer** möchte ich **auf einen Blick an den Farben (Lila vs. Blau) erkennen, welche Altersklasse und Gruppe angezeigt wird**, und **die Punkte klar hervorgehoben sehen**.
- **US-3**: Als **Zuschauer** möchte ich **eine aufgeräumte Tabelle sehen, in der die Spalten in der gewohnten Reihenfolge (Spiele, Tore, Punkte) stehen und keine ablenkenden bunten Markierungen die Rangnummern überlagern**.
- **US-4**: Als **Gast** möchte ich **in der Tab-Navigation die Reihenfolge Live ➔ Spielplan ➔ Finalphase ➔ Tabellen vorfinden**, damit **aktuelle Spielgeschehen und K.o.-Spiele im Vordergrund stehen**.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)
- [x] **Reihenfolge der Tabs im Guest-Layout**: Live ➔ Spielplan ➔ Finalphase ➔ Tabellen.
- [x] **Breite Altersklassen-Buttons (wU14 / mU14)**: Volle Breite mit Lila (wU14) und Blau (mU14).
- [x] **Tags für Geschlecht & Gruppe in Tabellen-Kopfzeile**: Zentriert (`justify-center`) mit Lila Akzent (wU14) und Blau Akzent (mU14).
- [x] **Grünes Tag aus Kopfzeile entfernen**: `Pl. 1 & 2 ➔ Halbfinale` entfernt.
- [x] **Markierungen aus den Rängen entfernen**: Ränge 1 bis 4 neutral und einheitlich, grüne Zeilenmarkierung entfernt.
- [x] **Spaltenreihenfolge Tore und Punkte tauschen**: SP ➔ Tore ➔ PKT.
- [x] **Punkte farblich wie die Tags hervorheben**: Lila Badge (wU14) und Blaues Badge (mU14).
- [x] **Entfernung des Info-Texts zur Wertung**: Wertungs-Infobox ersatzlos entfernt.

### 3.2 Explizit Out-of-Scope
- Änderungen an der Tabellenberechnungs-Logik in `standingsService.ts` (Berechnung bleibt unverändert).
- Änderungen an Kiosk- oder Admin-Tabellen (Kiosk behält sein eigenes TV-spezifisches Layout).

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien
- [x] **AC-1: Navigation Tabs Reihenfolge**
  - **Gegeben sei**: Ein Nutzer öffnet die Gast-Ansicht (`/`).
  - **Wenn**: Der Nutzer die horizontale Menüleiste betrachtet.
  - **Dann**: Steht „Tabellen“ an der letzten Position nach „Live“, „Spielplan“ und „Finalphase“.
- [x] **AC-2: Vollflächige Umschalter mit Farben Lila & Blau**
  - **Gegeben sei**: Der Nutzer befindet sich auf der Seite Tabellen (`/#standings`).
  - **Wenn**: Die Seite geladen wird.
  - **Dann**: Spannen die beiden Buttons „wU14“ und „mU14“ über die gesamte Containerbreite.
  - **Und**: Bei Auswahl von „wU14“ ist der Button in Lila hinterlegt (`bg-purple-600 text-white`).
  - **Und**: Bei Auswahl von „mU14“ ist der Button in Blau hinterlegt (`bg-blue-600 text-white`).
- [x] **AC-3: Tags für Geschlecht & Gruppe (zentriert)**
  - **Gegeben sei**: Die Tabellenansicht für wU14 oder mU14 ist aktiv.
  - **Wenn**: Die Kopfzeile einer Gruppentabelle betrachtet wird.
  - **Dann**: Werden zwei separate Badges horizontal zentriert angezeigt (z. B. `[wU14]` und `[Gruppe A]`).
  - **Und**: Bei wU14 sind beide Tags in Lila (`bg-purple-50 text-purple-700 border-purple-200`).
  - **Und**: Bei mU14 sind beide Tags in Blau (`bg-blue-50 text-blue-700 border-blue-200`).
  - **Und**: Es ist kein grünes Tag (`Pl. 1 & 2 ➔ Halbfinale`) mehr vorhanden.
- [x] **AC-4: Neutrale Ränge & keine Playoff-Hintergründe**
  - **Gegeben sei**: Eine Gruppentabelle mit 4 Mannschaften.
  - **Wenn**: Die Zeilen gerendert werden.
  - **Dann**: Weist keine Tabellenzeile einen grünen Hintergrund auf.
  - **Und**: Alle Platzierungen 1 bis 4 werden einheitlich ohne runde farbige Kreis-Badges dargestellt.
- [x] **AC-5: Spaltentausch Tore & Punkte mit Farbakzent**
  - **Gegeben sei**: Die Gruppentabelle.
  - **Wenn**: Die Spalten von links nach rechts betrachtet werden.
  - **Dann**: Folgt auf „SP“ die Spalte „Tore“ und danach als letzte Spalte „PKT“.
  - **Und**: Die Punkte sind in derselben Farbe wie die Kopf-Tags hervorgehoben (wU14 = Lila Badge, mU14 = Blaues Badge).
- [x] **AC-6: Kein Wertungs-Infotext**
  - **Gegeben sei**: Die Tabellenseite.
  - **Wenn**: Der Bereich unter den Gruppentabellen betrachtet wird.
  - **Dann**: Gibt es keinen Erläuterungstext zur Wertung.

### 4.2 Allgemeine Qualitätskriterien
- [x] Keine TypeScript- oder Lint-Fehler.
- [x] Erfolgreicher Build (`npm run build`).

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Betroffene Komponenten
- `src/components/layouts/GuestLayout.tsx`:
  - Anordnung der Sub-Nav-Links: Live ➔ Spielplan ➔ Finalphase ➔ Tabellen.
- `src/components/guest/StandingsView.tsx`:
  - Umgestaltung der Gender-Buttons: `w-full bg-slate-100 p-1 rounded-xl flex gap-1`.
  - Refactoring von `GroupTable`:
    - Props: `gender: GenderCategory`, `group: TournamentGroup`, `standings: TeamStanding[]`.
    - Kopfbereich mit `gender`- und `group`-Badges im lila bzw. blauen Farbkleid.
    - Tabellenspalten: `#`, `Mannschaft`, `SP`, `Tore`, `PKT`.
    - Punktezelle: Farbige Badge-Klasse abhängig von `gender === "wU14"`.
    - Ränge: Schlichte Darstellung ohne farbige Kreise.
    - Entfernung des Reglement-Footers.
- `src/pages/guest/HomePage.tsx`:
  - Reihenfolge der tabweisen Render-Blöcke anpassen für sauberen Code-Gleichlauf.

---

## 6. Technische Auswirkungen & Architekturbezug

- **Datenmodell**: Keine Änderungen notwendig.
- **TypeScript-Typen**: Keine Änderungen notwendig (`GenderCategory`, `TournamentGroup` und `TeamStanding` existieren bereits).
- **Abhängigkeiten**: Keine neuen NPM-Pakete erforderlich. `Award`-Icon-Import in `StandingsView.tsx` entfällt.

---

## 7. Verifikations- & Testplan

1. **Visuelle Prüfung**:
   - Navigation im Guest-Layout auf Desktop und Smartphone testen (Reihenfolge Live, Spielplan, Finalphase, Tabellen).
   - Testen des Tabellen-Views mit wU14:
     - Volle Button-Breite, aktiver wU14-Button lila.
     - Gruppenkopf-Tags (`wU14`, `Gruppe A` / `Gruppe B`) in Lila.
     - Punkte-Badges in Lila.
     - Ränge neutral.
     - Spaltenfolge SP ➔ Tore ➔ PKT.
   - Umschalten auf mU14:
     - Aktiver mU14-Button blau.
     - Gruppenkopf-Tags in Blau.
     - Punkte-Badges in Blau.
   - Prüfen, dass das grüne Kopfzeilen-Tag und die Wertungs-Infobox verschwunden sind.
2. **Build- und Lint-Check**:
   - `npm run lint`
   - `npm run build`
