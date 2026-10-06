# SPEC-007: Zentrales Element "Aktuelles Spiel" im Live-Desk & Layout-Optimierung

> **Status**: Abgeschlossen  
> **Typ**: Optimierung & Refactoring  
> **Branch**: `feat/SPEC-007-live-desk-zentrales-aktuelles-spiel`  
> **Autor**: Thorsten / Antigravity  
> **Erstellt am**: 2026-10-06  
> **Letzte Änderung**: 2026-10-06  
> **Betroffene Bereiche**: Turnierleitung (/admin -> Live-Desk) | UI-Komponenten (`LiveMatchDesk`, `ScoreboardDisplay`, `MatchTimerControl`)  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Im Rahmen von SPEC-006 wurde der Live-Desk der Turnierleitung (`/admin` -> Tab *Live-Desk*) bereits auf ein Full-Width-Layout umgestellt. Der praktische Einsatz und Nutzertests haben jedoch weiteres Optimierungspotenzial im visuellen Aufbau und der Ergonomie aufgezeigt:
1. **Fragmentierte Bedienelemente für das laufende Spiel**:
   - Die Zeitanzeige und Zeitsteuerung (`MatchTimerControl`) belegt als separate Zeile viel vertikalen Platz.
   - Der Button "Spiel beenden & weiter" befindet sich aktuell in der obersten Leiste neben der Spielauswahl, obwohl er logisch den Abschluss des laufenden Spiels darstellt.
   - Das Kampfgericht muss den Blick zwischen oberer Leiste (Beenden), mittlerer Leiste (Uhr) und unterer Leiste (Toreingabe & Spielstand) aufteilen.
2. **Ungünstige Breitenverteilung & Umbruch des Ergebnisses**:
   - In der bisherigen Spielstandskarte haben die Team-Boxen (Heim und Gast) zu breite seitliche Ränder/Paddings bzw. das Raster drängt die mittlere Spalte ein.
   - Dadurch bricht die Ergebnisanzeige (`0 : 0`) bei bestimmten Bildschirmauflösungen (z. B. Standard-Tablets, 13"-Laptops oder verkleinerten Browserfenstern) vertikal um oder wird gequetscht.
3. **Verschnitt in der Spielauswahlzeile**:
   - Da der "Beenden"-Button bisher in der obersten Leiste platziert ist, ist die Spielauswahl (Dropdown und Metadaten) in ihrer Breite künstlich limitiert.

### 1.2 Zielzustand & Mehrwert
1. **Das Element "Aktuelles Spiel" wird das zentrale Herzstück**:
   - Die Karte "Aktueller Spielstand" wird umbenannt in **"Aktuelles Spiel"** und fasst alle Kontrollfunktionen des laufenden Spiels zusammen:
     - **Oben links**: Titel **"Aktuelles Spiel"** mit Spielstatus-Indikator.
     - **Oben Mitte**: **Integrierte, kompakte Zeitanzeige & Zeitsteuerung** (MM:SS, Start/Pause, Reset, Feinjustierung). Die Zeit muss nicht mehr dominant den Bildschirm einnehmen, sondern fügt sich dezent und ergonomisch in die Kopfzeile ein.
     - **Oben rechts**: Der Button **"Spiel beenden und weiter"** mit gewohnter Sicherheitsabfrage.
2. **Entfall des separaten Zeitelements**:
   - Die eigenständige Karte `MatchTimerControl` entfällt ersatzlos. Dadurch spart der Live-Desk erheblich vertikalen Raum und alle Kernbedienungen sind ohne Scrollen im direkten Zugriff.
3. **Optimierte Team-Ränder & stabiles einzeiliges Ergebnis**:
   - Die Ränder (Paddings/Margins) links und rechts der Mannschaften werden verschmälert.
   - Das Layout der Mannschaftsbereiche und der zentralen Score-Anzeige wird so justiert, dass das Ergebnis (`X : Y`) immer stabil und einzeilig auf einer Zeile dargestellt wird.
4. **Volle Breite für die Spielauswahl ganz oben**:
   - Die oberste Zeile dient nun exklusiv der Match-Navigation (Vorheriges Spiel `<`, Spielauswahl-Dropdown mit Matchstatus, Nächstes Spiel `>`, Metadaten wie Platz, Tag, Geschlecht/Gruppe).
   - Da der "Beenden"-Button nach unten gewandert ist, erstreckt sich die Matchauswahl aufgeräumt über die **volle Zeilenbreite**.

---

## 2. User Stories

- **US-1 (Zentrales Kontrollzentrum)**: Als **Turnierleiter am Kampfgericht** möchte ich alle Aktionen des laufenden Spiels (Zeit starten/stoppen, Tore buchen, Spiel beenden) in einer einzigen zentralen Karte *"Aktuelles Spiel"* vorfinden, um schnelle Reaktionszeiten ohne langes Suchen oder Scrollen zu haben.
- **US-2 (Kompakte Zeitanzeige)**: Als **Zeitnehmer** möchte ich die Spielzeit und die Timer-Buttons direkt in der Kopfzeile des aktuellen Spiels dezent, aber klar lesbar sehen, damit die Uhr immer im Blick ist, ohne andere Elemente zu verdrängen.
- **US-3 (Stabiles Spielergebnis ohne Umbrüche)**: Als **Turnierleiter** möchte ich, dass der Spielstand (z. B. `0 : 0` oder `10 : 8`) auf allen gängigen Bildschirmbreiten zuverlässig einzeilig dargestellt wird und nicht durch überflüssige Ränder umbricht.
- **US-4 (Aufgeräumte Matchauswahl)**: Als **Turnierleiter** möchte ich ganz oben eine übersichtliche Spielauswahl über die gesamte Breite haben, um bequem durch den Turnierplan navigieren zu können.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have / Should-Have)

- [x] **Must-Have: Neues Header-Layout der zentralen Karte ("Aktuelles Spiel")**:
  - Titel oben links: Umbenennung von *"Aktueller Spielstand"* in **"Aktuelles Spiel"** (inkl. aktuellem Status-Indikator, z. B. Live/Pausiert/Geplant).
  - Mitte oben: **Kompakte Zeitsteuerung & Anzeige**:
    - Digitale Zeitanzeige `MM:SS` (font-mono, semibold/bold, gut lesbar, mit Farbkennzeichnung: Normal dunkel, letzte Minute bernsteinfarben, abgelaufen rot pulsierend).
    - Kompakter Start/Pause-Toggle-Button (grün für Start, bernsteinfarben für Pause).
    - Kompakter Reset-Button.
    - Dezente Feinjustierung (`-1 Min` / `+1 Min`).
  - Oben rechts: Button **"Spiel beenden und weiter"** (Primary Blue, Bestätigungsdialog bei Klick).
- [x] **Must-Have: Entfernung der separaten Timer-Karte**:
  - Die separate Komponente/Karte `MatchTimerControl` als eigene Großzeile im `LiveMatchDesk` wird entfernt.
  - Die Timer-Logik (`secondsRemaining`, `isRunning`, `startTimer`, `pauseTimer`, `resetTimer`, `adjustTime`) wird direkt an die zentrale Karte übergeben bzw. dort in die Kopfleiste integriert.
- [x] **Must-Have: Rand- und Breiten-Optimierung der Team-Blöcke**:
  - Reduktion der äußeren und inneren horizontalen Abstände (`px`, `mx`) der Team-Boxen.
  - Vergrößerung des Freiraums für den mittleren Ergebnis-Container, sodass Zahlenkombinationen wie `0 : 0`, `2 : 1` oder `12 : 10` niemals umbrechen (`whitespace-nowrap`, stabile Mindestbreite).
  - Teams, Wappen, Torbuttons (`+1`) und Korrekturbuttons (`-1`) bleiben in ihrer vertikalen Anordnung und Bedienbarkeit vollständig erhalten.
- [x] **Must-Have: Spielauswahlleiste ganz oben auf voller Breite**:
  - Entfernung des Buttons "Spiel beenden & weiter" aus Zeile 1.
  - Entfernung des redundanten Metadaten-Texts ("Spiel #X • Feld Y...") rechts neben der Spielauswahl.
  - Das Match-Dropdown füllt nun gemeinsam mit den Vor-/Zurück-Pfeilen nahtlos die gesamte Zeilenbreite aus.
- [x] **Should-Have: Responsive Anpassung für Tablets & Mobile**:
  - Auf schmalen Bildschirmen (unter `md`) bricht die Kopfzeile der zentralen Karte sauber um (z. B. Titel oben, Zeitsteuerung Mitte, Beenden-Button rechts/unten), ohne Überlappungen zu erzeugen.

### 3.2 Explizit Out-of-Scope (Nicht Teil dieser Spec)
- Änderungen an der Audio- und Soundboard-Leiste (diese bleibt als Zeile unterhalb des zentralen Spiels bestehen).
- Änderungen an der Firestore-Datenstruktur oder den Services (alle States und Handlers existieren bereits via `useLiveMatchDesk`).
- Änderungen an der Kiosk- oder Gastansicht.

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien

- [x] **AC-1: Umbenennung & Header-Struktur "Aktuelles Spiel"**
  - **Gegeben sei (Given)**: Die Turnierleitung befindet sich auf `/admin` im Tab *Live-Desk*.
  - **Wenn (When)**: Die zentrale Spielkarte betrachtet wird.
  - **Dann (Then)**: Lautet die Beschriftung oben links *"Aktuelles Spiel"*. Oben in der Mitte befindet sich die digitale Zeitanzeige mit Start/Pause- und Reset-Buttons. Oben rechts befindet sich der Button *"Spiel beenden und weiter"*.

- [x] **AC-2: Vollständige Funktionalität der integrierten Zeitsteuerung**
  - **Gegeben sei**: Ein Spiel ist ausgewählt und die Spielzeit steht z. B. auf 12:00.
  - **Wenn**: Der Start-Button in der Kopfzeile geklickt wird.
  - **Dann**: Läuft der Countdown sekundengenau herunter, der Button wechselt auf "Pause", und bei 00:00 wird die Zeitanzeige rot pulsierend dargestellt. Reset und Korrektur (+/- 1 Min) funktionieren wie gewohnt.

- [x] **AC-3: Keine separate Timer-Karte mehr vorhanden**
  - **Gegeben sei**: Der Live-Desk wird geladen.
  - **Wenn**: Die Seite von oben nach unten gescrollt / betrachtet wird.
  - **Dann**: Gibt es keine eigenständige Zeile "Spieluhr" mehr. Direkt nach der Spielauswahl folgt die Karte "Aktuelles Spiel", gefolgt vom Soundboard und der Tore-Chronik.

- [x] **AC-4: Kein Umbruch der Ergebnisanzeige (Whitespace & Ränder)**
  - **Gegeben sei**: Ein beliebiges Spielergebnis (z. B. `0 : 0` oder zweistellig `10 : 12`) wird angezeigt.
  - **Wenn**: Der Bildschirm auf verschiedenen Bildschirmbreiten (ab 768px Tablet bis 1920px Desktop) angezeigt wird.
  - **Dann**: Steht die Spielstandsanzeige (`X : Y`) stets horizontal auf einer Zeile ohne vertikalen Umbruch zwischen den Ziffern oder dem Doppelpunkt. Die seitlichen Ränder der Team-Container sind schmaler dimensioniert.

- [x] **AC-5: Spielauswahl oben auf voller Breite**
  - **Gegeben sei**: Die oberste Leiste des Live-Desks wird geladen.
  - **Wenn**: Die Zeile gerendert wird.
  - **Dann**: Befinden sich darin weder ein "Spiel beenden"-Button noch der überflüssige Metadaten-Text. Das Dropdown-Menü nutzt zusammen mit den Pfeil-Buttons die gesamte Zeilenbreite.

- [x] **AC-6: Funktion "Spiel beenden und weiter" aus der neuen Position**
  - **Gegeben sei**: Ein Spiel läuft oder ist abgelaufen.
  - **Wenn**: Der Button "Spiel beenden und weiter" oben rechts in der Karte "Aktuelles Spiel" geklickt wird.
  - **Dann**: Öffnet sich der gewohnte Bestätigungsdialog. Nach Bestätigung wird das Spiel beendet und das nächste Spiel vorgewählt.

### 4.2 Allgemeine Qualitätskriterien
- [x] Keine fest kodierten Zeiten oder Parameter (`AGENTS.md`).
- [x] Strikte TypeScript-Typisierung ohne `any`.
- [x] Vollständiges und fehlerfreies Durchlaufen von `npm run build` und `npm run lint`.
- [x] Beibehaltung aller bestehenden Firestore- und Audio-Hooks ohne Regressionen.

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Betroffene Ansichten & Komponenten
- **Pfad / URL**: `/admin` (Tab: *Live-Desk*)
- **Komponenten**:
  - `src/components/admin/live/LiveMatchDesk.tsx`: Entfernung von `MatchTimerControl`, Übergabe der Timer-Props an `ScoreboardDisplay`, Bereinigung der oberen Match-Bar.
  - `src/components/admin/live/ScoreboardDisplay.tsx`: Umgestaltung des Headers (Titel links, Timer Mitte, Beenden-Button rechts), Schmälerung der seitlichen Ränder, Verhinderung von Umbrüchen im Score-Container.
  - `src/components/admin/live/MatchTimerControl.tsx`: Wird als eigenständige Großkarte nicht mehr in `LiveMatchDesk` eingebunden (kann refaktoriert oder als kompakte Teilkomponente wiederverwendet werden).

### 5.2 Drahtmodell / Layout-Skizze

```text
+---------------------------------------------------------------------------------------------------+
| ZEILE 1: MATCH-AUSWAHL (Volle Breite)                                                             |
| [<] [ Dropdown: #3 (10:30) - Damen Gr.A: Club A vs. Club B                           ] [>] [Meta] |
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
| ZEILE 2: AKTUELLES SPIEL (Zentrales Element)                                                      |
| +-----------------------------------------------------------------------------------------------+ |
| | [Shield] AKTUELLES SPIEL   |   [11:42]  [Start/Pause]  [Reset]  [-1m] [+1m]   |  [Beenden & >]| |
| +-----------------------------------------------------------------------------------------------+ |
| |                                                                                               | |
| |   +----------------------+           +-------------+           +----------------------+       | |
| |   |      [Wappen]        |           |             |           |      [Wappen]        |       | |
| |   |      Club A          |           |   0  :  0   |           |      Club B          |       | |
| |   |      (HEIM)          |           |             |           |      (GAST)          |       | |
| |   |                      |           +-------------+           |                      |       | |
| |   |  [+1 Tor Heim (🎵)]  |            Live-Ergebnis            |  [+1 Tor Gast (🎵)]  |       | |
| |   |  [- Tor abziehen]    |                                     |  [- Tor abziehen]    |       | |
| |   +----------------------+                                     +----------------------+       | |
| +-----------------------------------------------------------------------------------------------+ |
|                                                                                                   |
| ZEILE 3: SOUNDBOARD (Volle Breite)                                                                |
| [ Schlusshorn (Buzzer) ]  [ Signal-Gong ]  [ Jingle Heim ]  [ Jingle Gast ]  [ ⏹ Ton stoppen ]   |
+---------------------------------------------------------------------------------------------------+
| ZEILE 4: TORE-CHRONIK (falls Tore vorhanden)                                                      |
+---------------------------------------------------------------------------------------------------+
```

### 5.3 Detail-Anpassungen im CSS / Tailwind
1. **Header der Karte "Aktuelles Spiel"**:
   - Flex-Layout: `flex flex-col lg:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-6`.
   - Links: Icon + `"Aktuelles Spiel"` + Spielminute / Status-Pille.
   - Mitte: Timer-Gruppe `inline-flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-1.5 rounded-xl`. Zeitanzeige in kompakter Schriftgröße (`text-2xl font-mono font-black`), Start/Pause-Button (`px-3 py-1.5 text-xs`), Reset (`p-1.5`), Feinkorrektur (`px-2 py-1 text-[11px]`).
   - Rechts: Button "Spiel beenden & weiter" (`bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-xl`).
2. **Team-Karten & Score-Container**:
   - Team Heim / Gast: Reduzierung von `p-3 sm:p-4` auf schlankere Paddings (`p-2.5 sm:p-3`), Reduzierung unnötiger Maximalbreiten.
   - Mittlerer Score-Container: `whitespace-nowrap min-w-[150px] px-5 py-2.5 text-5xl sm:text-6xl lg:text-7xl font-black`, um Zeilenumbrüche kategorisch auszuschließen.
   - Flex- bzw. Grid-Verhältnis anpassen: z. B. `grid grid-cols-1 md:grid-cols-11` mit Team Heim (md:col-span-4), Score (md:col-span-3), Team Gast (md:col-span-4) oder entsprechendes flexibles Layout, das dem mittleren Ergebnisblock mehr Luft verschafft.

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Datenmodell (`DATABASE.md`)
- Keine Änderungen an Firestore-Collections oder Dokumentstrukturen erforderlich.

### 6.2 TypeScript Interfaces (`src/types/`)
- Keine neuen Datentypen erforderlich.
- Anpassung der Props für `ScoreboardDisplay`:
  ```typescript
  interface ScoreboardDisplayProps {
    homeTeam?: Team
    awayTeam?: Team
    homePlaceholder?: string
    awayPlaceholder?: string
    scoreHome: number
    scoreAway: number
    currentMinute: number
    // Timer-Integration
    secondsRemaining: number
    isRunning: boolean
    timerStatus: string
    onStartTimer: () => void
    onPauseTimer: () => void
    onResetTimer: () => void
    onAdjustTime: (deltaSeconds: number) => void
    // Toreingabe
    onRecordGoal: (isHome: boolean) => void
    onDecrementScore: (isHome: boolean) => void
    // Spielabschluss
    onFinishMatch: () => void
  }
  ```

### 6.3 State & Firestore Listener
- Unverändert: `useLiveMatchDesk` liefert weiterhin alle benötigten States und Handler.

---

## 7. Edge Cases & Fehlerbehandlung

- **Schmale mobile Bildschirme (< 640px)**:
  - Header bricht responsiv in Spalten um (Titel -> Zeitsteuerung -> Beenden-Button).
  - Spielstandsanzeige bleibt dank `whitespace-nowrap` immer einzeilig, Ziffern skalieren responsiv (`text-4xl sm:text-5xl md:text-6xl`).
- **Versehensklick auf "Spiel beenden & weiter"**:
  - Wie bisher schützt der Bestätigungsdialog (`window.confirm`) vor versehentlichem Beenden.
- **Null-Sekunden beim Timer**:
  - Start-Button ist deaktiviert, Zeitanzeige pulsiert rot, Reset setzt auf Standardzeit zurück.

---

## 8. Verifikations- & Testplan

### 8.1 Manuelle Tests
1. [ ] **Kopfzeilen-Aufteilung prüfen**:
   - Titel links: "Aktuelles Spiel".
   - Mitte: Uhrzeit läuft bei Start, stoppt bei Pause, Korrektur +/- 1 Min funktioniert.
   - Rechts: "Spiel beenden & weiter" öffnet Dialog und beendet bei Bestätigung das Spiel.
2. [ ] **Responsives Verhalten & Umbruch-Prüfung**:
   - Auf 1024px (iPad Pro), 1280px (Standard Laptop) und 1440px testen.
   - Prüfen, dass `0 : 0` oder `12 : 11` niemals in zwei Zeilen umbricht.
   - Sicherstellen, dass Teamlogos, Namen und Tor-Buttons gut bedienbar bleiben.
3. [ ] **Spielauswahlleiste oben prüfen**:
   - Navigation mit `<` und `>` sowie Dropdown funktioniert über die gesamte Breite.
   - Kein "Beenden"-Button mehr in der oberen Leiste.
4. [ ] **Soundboard & Tore-Chronik prüfen**:
   - Tor eintragen löst wie gewohnt Jingle aus, Buzzer und Fade-Out funktionieren einwandfrei.

### 8.2 Automatisierte Tests / Validierung
- [ ] `npm run lint` fehlerfrei.
- [ ] `npm run build` fehlerfrei.

---

## 9. Offene Fragen & Klärungsbedarf
- Keine offenen Fragen; die Anforderungen sind präzise spezifiziert.
