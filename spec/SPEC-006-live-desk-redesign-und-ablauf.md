# SPEC-006: Redesign des Live-Desks & Optimierung des Spielablaufs

> **Status**: Abgeschlossen  
> **Typ**: Optimierung & Refactoring  
> **Branch**: `feat/SPEC-006-live-desk-redesign-und-ablauf`  
> **Autor**: Thorsten / Antigravity  
> **Erstellt am**: 2026-10-06  
> **Letzte Änderung**: 2026-10-06  
> **Betroffene Bereiche**: Turnierleitung (/admin -> Live-Desk) | Audio & Soundboard | UI-Komponenten  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Auf dem Bildschirm **Live-Desk** der Turnierleitung (`/admin` -> Tab *Live-Desk*) sind aktuell Komponenten in einem mehrspaltigen Raster nebeneinander angeordnet:
- Links befindet sich die Spieluhr (`MatchTimerControl`, 1 Spalte), rechts daneben der Spielstand (`ScoreboardDisplay`, 2 Spalten).
- Darunter teilen sich die Strafkarten-Verwaltung (`PenaltyCardManager`) und das Soundboard (`SoundboardPanel`) jeweils 50 % der Bildschirmbreite.
- **Problem 1 (Überflüssige Funktionen)**: Karten- und Zeitstrafen (Grüne/Gelbe/Rote Karten sowie 2-Minuten-Strafen) werden im praktischen Turnierbetrieb des KBC nicht über die Web-App erfasst oder verwaltet. Das Element `PenaltyCardManager` belegt wertvollen Platz und lenkt das Kampfgericht ab.
- **Problem 2 (Ungünstige Anordnung & Ergonomie)**: Das bisherige Grid entspricht nicht dem tatsächlichen linearen Ablauf am Kampfgerichtstisch (Spiel auswählen -> Anpfiff abwarten & Uhr starten -> Tore eintragen & Jingles steuern -> Spiel abpfeifen & weiter zum nächsten Spiel).
- **Problem 3 (Jingle-Steuerung & Fade-Out)**: Torjingles können bei einem Treffer zwar abgespielt werden, es fehlt jedoch eine intuitive Möglichkeit, einen laufenden Jingle bei Wiederanpfiff der Schiedsrichter sanft auszublenden (Fade-Out), anstatt ihn entweder bis zum Ende laufen zu lassen oder abrupt abzuhacken.
- **Problem 4 (Sicherheit bei Tor-Korrektur)**: Der Minus-Button (`-` Tor) zum Abziehen eines fälschlich erfassten Tors ist aktuell visuell ähnlich gewichtet wie der Plus-Button (`+`). Er darf keinesfalls versehentlich geklickt werden und darf niemals einen Jingle auslösen.

### 1.2 Zielzustand & Mehrwert
1. **Fokussiertes Full-Width Layout**:
   - Die Strafkarten- und Zeitstrafen-Verwaltung (`PenaltyCardManager`) wird vollständig entfernt.
   - Alle verbleibenden Elemente erstrecken sich über die **volle Zeilenbreite (Full-Width)** und sind in exakt 4 logischen Hauptzeilen übereinander gestaffelt:
     - **Zeile 1**: Spielauswahl & Match-Metadaten (inkl. Navigations-Pfeile und "Spiel beenden"-Aktion)
     - **Zeile 2**: Spieluhr (Timer-Großanzeige, Start, Pause, Reset, 1-Minuten-Korrekturen)
     - **Zeile 3**: Aktueller Spielstand (Heim vs. Gast, Wappen, dominanter `+` Tor-Button, dezenter `-` Tor-Korrektur-Button)
     - **Zeile 4**: Soundboard (Buzzer-Schlusshorn, Signal-Gong, Team-Jingles sowie prominenter Jingle-Stop-Button mit Sanftem Fade-Out)
2. **Exakte Anpassung an den realen Kampfgericht-Ablauf**:
   - Schnelle Spielauswahl vor der Begegnung.
   - Ein-Klick-Start bei Schiedsrichter-Anpfiff mit Countdown.
   - Ergonomisches Eintragen von Toren mit automatischer Jingle-Wiedergabe.
   - Sanftes manuelles Ausfaden von laufenden Jingles über einen prominenten Stop-Button.
   - Klare Trennung zwischen primärer Toreingabe (`+`) und fehlerverzeihender, zurückhaltender Korrektur (`-`).
   - Geführtes Spielende mit Sicherheits-Bestätigung und automatischem Übergang zur nächsten Partie.

---

## 2. User Stories

- **US-1 (Fokussiertes Layout)**: Als **Turnierleiter am Kampfgericht** möchte ich ein übersichtliches, einspaltiges Layout mit voller Zeilenbreite für jedes Bedienelement haben, damit ich auf Tablets oder Laptops alle Bedienelemente sofort treffe und keine ungenutzten Strafkarten-Elemente den Bildschirm überladen.
- **US-2 (Spielstart per Schiri-Pfiff)**: Als **Zeitnehmer** möchte ich direkt nach Auswahl des Spiels mit einem großen Start-Button die Spieluhr synchron zum Schiedsrichter-Pfiff starten und bei Unterbrechungen pausieren können.
- **US-3 (Torerfassung mit Torjingle)**: Als **Turnierleiter** möchte ich mit einem markanten Klick auf den Tor-Plus-Button das Tor verbuchen und sofort den Torjingle des Teams erklingen lassen, ohne das Fenster wechseln zu müssen.
- **US-4 (Jingle manuell ausfaden)**: Als **Sound-Beauftragter** möchte ich einen laufenden Jingle per Knopfdruck sanft ausfaden lassen, sobald die Schiedsrichter den Anstoß zur Spielfortsetzung anpfeifen.
- **US-5 (Sichere Tor-Korrektur)**: Als **Turnierleiter** möchte ich versehentlich eingetragene Tore über einen optisch dezenten Korrektur-Button abziehen können, ohne dass dabei versehentlich ein Jingle abgespielt wird.
- **US-6 (Spielende & Nächstes Spiel)**: Als **Turnierleiter** möchte ich nach Ablauf der Spielzeit das Spiel offiziell mit Bestätigung beenden und nahtlos zum nächsten Spiel wechseln.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have / Should-Have)

- [x] **Must-Have: Entfernung der Strafkarten (`PenaltyCardManager`)**:
  - Vollständiges Entfernen der Komponente `PenaltyCardManager` aus dem Live-Desk.
  - Entfernen von Strafkarten-Zuständen (`activePenalties`, `addPenalty`, `removePenalty`) aus der aktiven Desk-Ansicht.
  - Bereinigung des Ereignis-Protokolls unterhalb des Desks (Fokussierung auf Tor-Ereignisse).
- [x] **Must-Have: Neues 4-Zeilen Full-Width-Layout**:
  - **Zeile 1 (Spielauswahl & Kopfzeile)**:
    - Dropdown zur Auswahl aller Turnierspiele (`#1` bis `#40`) mit Statusindikator (⏳ geplant, 🔴 live, ✓ beendet).
    - Vor-/Zurück-Pfeile (`<`, `>`) zum Durchschalten.
    - Metadaten-Badge: Spielnummer, Platz/Feld, Tag/Phase, Altersklasse/Geschlecht.
    - Prominenter Button "Spiel beenden & weiter" (mit Dialog-/Confirm-Abfrage).
  - **Zeile 2 (Spieluhr / MatchTimerControl)**:
    - Volle Zeilenbreite.
    - Große, gut lesbare digitale Zeitanzeige (MM:SS), farbcodiert (Normal: Dunkel, letzte Minute: Amber, 00:00: Rot pulsierend).
    - Status-Pille (geplant / live / pausiert / beendet).
    - Großer Haupt-Aktionsbutton: Bei Stillstand grünes **"Start"**, bei laufender Uhr bernsteinfarbenes **"Pause"**.
    - Reset-Button (zurück auf reguläre Spielzeit).
    - Zeitkorrektur-Buttons (`-1 Min`, `+1 Min`) dezent platziert.
  - **Zeile 3 (Aktueller Spielstand / ScoreboardDisplay)**:
    - Volle Zeilenbreite.
    - Dreiteilung innerhalb der Zeile: Team Heim (links) | Live-Spielstand (Mitte) | Team Gast (rechts).
    - Prominenter grüner Button **"+ Tor [Team]"** (mit Torsymbol ⚽ und Musik-Icon 🎵, falls Jingle vorhanden).
    - Stark untergeordneter, kleiner Korrektur-Button **"- 1"** (dezentes Grau, kein Jingle, Tooltip "Korrektur").
    - Anzeige der aktuellen Spielminute.
  - **Zeile 4 (Soundboard / SoundboardPanel)**:
    - Volle Zeilenbreite.
    - Schnellbuttons: **Schlusshorn (Buzzer)**, **Signal-Gong**, **Jingle Heim**, **Jingle Gast**.
    - Prominenter, aktiver **"Ton stoppen (Fade-Out)"** Button, der sichtbar wird bzw. hervorsticht, sobald eine Audiodatei abgespielt wird.
- [x] **Must-Have: Audio Fade-Out Logik**:
  - Erweiterung von `useAudioPlayer`: Ergänzung um sanftes Ausblenden (`fadeOut(durationMs = 800)` oder Anpassung von `stop()`).
  - Beim manuellen Stoppen wird die Lautstärke (`audio.volume`) über ein kurzes Zeitfenster (600–800 ms) linear auf 0 gesenkt und die Wiedergabe anschließend pausiert und zurückgesetzt.
  - Wird ein neuer Sound gestartet, während ein Fade-Out läuft, wird das vorherige Fading sofort abgebrochen und die neue Audiodatei mit voller Lautstärke gestartet.
- [x] **Must-Have: Sichere Tor-Korrektur (`decrementScore`)**:
  - Subtiler Button, disabled wenn Spielstand 0 ist.
  - Löst **keinen** Audio-Aufruf aus.
  - Entfernt wie bisher das letzte Goal-Event des jeweiligen Teams in Firestore.
- [x] **Must-Have: Geführter Übergang zum nächsten Spiel**:
  - Nach Klick auf "Spiel beenden & weiter" erscheint eine Bestätigung (z. B. `confirm` oder modal dialog).
  - Bei Bestätigung: Spielstatus wird auf `finished` gesetzt, Timer gestoppt, etwaiges Audio gestoppt.
  - Der Desk wählt automatisch das nächste Spiel aus der Spielliste vor (sofern vorhanden).

### 3.2 Explizit Out-of-Scope (Nicht Teil dieser Spec)
- Verwaltung von Spielernamen / Mannschaftskadern (Tore werden rein für das Team verbucht, Torschützen-Auswahl bleibt optional).
- Änderungen an den Kiosk- oder Gastansichten (diese beziehen den Spielstand unverändert in Echtzeit über Firestore).
- Änderungen an den Berechnungsalgorithmen der Tabellen oder Spielplangenerierung.

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien

- [x] **AC-1: Vollständige Entfernung des PenaltyCardManagers**
  - **Gegeben sei**: Die Live-Desk-Ansicht unter `/admin`.
  - **Wenn**: Der Desk geladen wird.
  - **Dann**:
    - Ist kein Element zur Erfassung oder Anzeige von grünen/gelben/roten Karten oder 2-Minuten-Strafen sichtbar.
    - Die Datei `PenaltyCardManager.tsx` wird nicht mehr im Live-Desk gerendert.

- [x] **AC-2: Full-Width 4-Zeilen Anordnung**
  - **Gegeben sei**: Ein geöffnetes Spiel im Live-Desk.
  - **Wenn**: Die Seite gerendert wird.
  - **Dann**:
    - Befinden sich die 4 Elemente genau in der vertikalen Reihenfolge:
      1. Zeile 1: Spielauswahl & Header-Aktionen (100 % Breite)
      2. Zeile 2: Spieluhr-Bedienung (100 % Breite)
      3. Zeile 3: Aktueller Spielstand & Tor-Buttons (100 % Breite)
      4. Zeile 4: Soundboard & Audio-Steuerung (100 % Breite)
    - Es existieren keine nebeneinanderliegenden Spaltenblöcke mehr für Timer und Scoreboard.

- [x] **AC-3: Spielstart & Pausieren (Schiri-Ablauf)**
  - **Gegeben sei**: Ein ausgewähltes Spiel im Status `scheduled`.
  - **Wenn**: Der Schiedsrichter anpfeift und der Nutzer auf den grünen "Start"-Button klickt.
  - **Dann**:
    - Schaltet der Status des Spiels auf `live`.
    - Der Countdown beginnt sekündlich abwärts zu zählen.
    - Der Button wechselt sofort zu einem gut sichtbaren bernsteinfarbenen "Pause"-Button.
    - Bei Klick auf "Pause" stoppt der Countdown und der Status wird auf `paused` synchronisiert.

- [x] **AC-4: Torerfassung mit Torjingle**
  - **Gegeben sei**: Ein laufendes Spiel und das Heimteam hat eine gültige `jingleUrl`.
  - **Wenn**: Der Nutzer auf den großen grünen Button "+ Tor Heim" klickt.
  - **Dann**:
    - Erhöht sich der Spielstand des Heimteams sofort um 1.
    - Das Tor wird mit der aktuellen Spielminute in Firestore gespeichert.
    - Der Torjingle des Heimteams beginnt unmittelbar abzuspielen.
    - Im Soundboard wird optisch signalisiert, dass der Jingle aktiv läuft.

- [x] **AC-5: Manuelles Stoppen mit sanftem Fade-Out**
  - **Gegeben sei**: Ein Torjingle oder Sound läuft aktuell.
  - **Wenn**: Der Nutzer auf den "Ton stoppen"-Button klickt.
  - **Dann**:
    - Bricht der Sound nicht schlagartig ab, sondern fadet innerhalb von ca. 600–800 ms sanft auf Lautstärke 0 herunter.
    - Nach Abschluss des Fade-Outs wird das Audio pausiert und der Status auf inaktiv gesetzt.

- [x] **AC-6: Dezente Tor-Korrektur ohne Jingle**
  - **Gegeben sei**: Ein Spielstand von 2:1.
  - **Wenn**: Der Nutzer auf den dezenten "-" Button des Heimteams klickt.
  - **Dann**:
    - Sinkt der Heimspielstand auf 1:1.
    - Das letzte Tor-Event des Heimteams wird entfernt.
    - Es wird **kein** Ton und **kein** Jingle abgespielt.

- [x] **AC-7: Spiel beenden & Weiterschalten**
  - **Gegeben sei**: Spiel #5 ist beendet oder die Spielzeit ist abgelaufen.
  - **Wenn**: Der Nutzer auf "Spiel beenden & weiter" klickt und die Abfrage bestätigt.
  - **Dann**:
    - Wird Spiel #5 in Firestore auf `status = "finished"` gesetzt.
    - Eventuell laufende Sounds werden gestoppt.
    - Der Desk wechselt automatisch zu Spiel #6 (nächste Partie in der Liste).
    - Die Spieluhr von Spiel #6 ist auf die volle Turnierspielzeit (z. B. 20:00) voreingestellt.

### 4.2 Allgemeine Qualitätskriterien
- [x] Keine fest kodierten Spielzeiten, Pausenzeiten oder Teamnamen (`AGENTS.md`).
- [x] Striktes TypeScript ohne `any`.
- [x] Sauberes Aufräumen aller Web-Audio / HTMLAudioElement Timer und Intervalle.
- [x] Fehlerfreie Ausführung von `npm run build` und `npm run lint`.

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Betroffene Ansichten & Komponenten
- **Pfad**: `/admin` (Tab: `live`, Komponente: `src/components/admin/live/LiveMatchDesk.tsx`)
- **Unterkomponenten**:
  - `src/components/admin/live/MatchTimerControl.tsx` (überarbeitet auf Full-Width)
  - `src/components/admin/live/ScoreboardDisplay.tsx` (überarbeitet auf Full-Width, prominentes Plus, dezentes Minus)
  - `src/components/admin/live/SoundboardPanel.tsx` (überarbeitet auf Full-Width mit prominenter Fade-Out Stop-Aktion)
  - `src/hooks/useAudioPlayer.ts` (Erweiterung um sanftes Audio-Fade-Out)
  - `src/hooks/useLiveMatchDesk.ts` (Bereinigung um Penalty-Code)
  - `src/components/admin/live/PenaltyCardManager.tsx` (wird entfernt bzw. im Desk nicht mehr eingebunden)

### 5.2 Zeilenaufbau im Detail (Full-Width Stack)

```
┌────────────────────────────────────────────────────────────────────────┐
│ ZEILE 1: SPIELAUSWAHL & METADATEN                                      │
│ [ < ] [ Dropdown: 🔴 #12 (11:30) wU14 Gr.A: Club A vs. Club B ▼ ] [ > ]│
│ Spiel #12 • Feld 1 • Samstag (Gruppe)        [ ✓ Spiel beenden & weiter]│
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ ZEILE 2: SPIELUHR (FULL-WIDTH)                                         │
│                          ● LIVE (Spieluhr)                             │
│                              14:35                                     │
│            [ ❚❚ Pause ]            [ ⟲ Reset ]                         │
│               Korrektur: [ - 1 Min ]  [ + 1 Min ]                      │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ ZEILE 3: AKTUELLER SPIELSTAND (FULL-WIDTH)                             │
│        HEIMTEAM                 SPIELSTAND                 GASTTEAM    │
│       [ Wappen ]                14. Minute                [ Wappen ]   │
│      Club A (CA)                                         Club B (CB)   │
│                                                                        │
│                                   3 : 1                                │
│                                                                        │
│  [ ⚽ + Tor Heim 🎵 ]                               [ ⚽ + Tor Gast 🎵 ] │
│  [ - Korrektur ]                                    [ - Korrektur ]    │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ ZEILE 4: SOUNDBOARD & JINGLE-STEUERUNG (FULL-WIDTH)                    │
│ [ 📯 Schlusshorn (Buzzer) ]  [ 🔔 Signal-Gong ]                         │
│ [ ▶ Jingle Club A ]          [ ▶ Jingle Club B ]                       │
│                                                                        │
│ (Bei aktiver Wiedergabe):                                              │
│ [ ⏹ Ton sanft ausfaden (Stop) ] -------------------------------------- │
└────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Ergonomischer Interaktionsablauf
1. **Vor dem Spiel**:
   - Die Turnierleitung wählt das nächste Spiel in Zeile 1 aus.
   - Die Teams (Logos, Namen) und die Spieluhr (z. B. 20:00) werden geladen.
2. **Anpfiff**:
   - Die Schiedsrichter pfeifen an.
   - Der Zeitnehmer klickt in Zeile 2 auf den großen grünen **"Start"**-Button.
   - Uhr läuft runter, Button wird zu **"Pause"**.
3. **Spielunterbrechung (optional)**:
   - Bei Auszeit oder Schiedsrichter-Rücksprache Klick auf **"Pause"** in Zeile 2. Uhr steht.
   - Klick auf **"Start"** setzt das Spiel fort.
4. **Tor fällt**:
   - Blick wandert nach Zeile 3. Klick auf den großen grünen Button **"+ Tor [Team]"**.
   - Spielstand erhöht sich sofort (z. B. 3 : 1).
   - Der Torjingle des Teams startet automatisch.
5. **Jingle stoppen (Fade-Out)**:
   - Sobald die Schiedsrichter das Spiel wieder anpfeifen wollen, klickt die Turnierleitung in Zeile 4 auf **"Ton sanft ausfaden"** (oder alternativ direkt im Soundboard).
   - Der Sound blendet über 600–800 ms sanft aus.
6. **Fehlklick-Korrektur (Ausnahmefall)**:
   - Wurde ein Tor versehentlich eingetragen, klickt die Turnierleitung auf den kleinen, dezent grauen Button **"- Korrektur"** unterhalb des Tor-Buttons.
   - Das Tor wird abgezogen, es ertönt kein Jingle.
7. **Abpfiff & Spielende**:
   - Wenn die Uhr abgelaufen ist (00:00), ertönt automatisch das Schlusshorn.
   - Klick auf **"Spiel beenden & weiter"** in Zeile 1.
   - Bestätigungsdialog: *"Möchtest du Spiel #12 (3:1) wirklich offiziell beenden?"*
   - Bei Klick auf *"Ja"*: Spielstatus wird `finished`, Desk schaltet automatisch auf Spiel #13 um.

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Datenmodell (`DATABASE.md`)
- **Keine Schema-Änderungen erforderlich**.
- Die Firestore-Collection `matches/{matchId}` bleibt unverändert:
  - `scoreHome`: `number`
  - `scoreAway`: `number`
  - `status`: `"scheduled" | "live" | "paused" | "finished"`
  - `timerSecondsRemaining`: `number`
  - `isTimerRunning`: `boolean`
  - `events`: Array von `MatchEvent` (wird weiterhin für Tore genutzt)

### 6.2 TypeScript Interfaces (`src/types/`)
- Keine Änderungen an `src/types/database.ts`.
- In `src/hooks/useLiveMatchDesk.ts` kann das Interface `ActivePenalty` entfernt werden.

### 6.3 State & Hook Optimierung (`useAudioPlayer.ts`)
- Implementierung der Fade-Out-Funktion in `useAudioPlayer`:
  ```typescript
  const fadeOutAndStop = useCallback((durationMs = 800) => {
    if (!audioRef.current || !isPlaying) return
    const audio = audioRef.current
    const startVolume = audio.volume
    const steps = 16
    const stepInterval = durationMs / steps
    let currentStep = 0

    const fadeTimer = setInterval(() => {
      currentStep++
      const newVolume = Math.max(0, startVolume * (1 - currentStep / steps))
      if (audioRef.current) {
        audioRef.current.volume = newVolume
      }
      if (currentStep >= steps) {
        clearInterval(fadeTimer)
        if (audioRef.current) {
          audioRef.current.pause()
          audioRef.current.currentTime = 0
          audioRef.current.volume = 1 // Für nächsten Track zurücksetzen
        }
        setIsPlaying(false)
        setCurrentUrl(null)
      }
    }, stepInterval)
  }, [isPlaying])
  ```

---

## 7. Edge Cases & Fehlerbehandlung

- **Team hat keinen Torjingle**: Bei Klick auf "+ Tor" wird kein Ton abgespielt, der Torzähler zählt verzugs- und fehlerfrei hoch.
- **Mehrfaches schnelles Klicken auf Stop**: Das Fade-Out-Intervall wird gecleart, sodass keine multiplen Timer konkurrieren.
- **Klick auf Jingle während Fade-Out**: Ein neuer Play-Befehl bricht das Fade-Out sofort ab, setzt die Lautstärke auf 1.0 zurück und startet den neuen Sound.
- **Spielstand 0**: Der Minus-Button ist deaktiviert (`disabled={score <= 0}`), um negative Spielstände unmöglich zu machen.
- **Letztes Spiel des Turniers beendet**: Wenn das letzte Spiel (#40) beendet wird, schaltet der Desk nicht weiter bzw. bleibt auf dem aktuellen Spiel stehen, ohne einen Out-of-Bounds Fehler zu erzeugen.

---

## 8. Verifikations- & Testplan

### 8.1 Manuelle Tests
1. [ ] **Layout-Inspektion**: Live-Desk öffnen. Prüfen, dass alle 4 Bereiche (Spielauswahl, Spieluhr, Spielstand, Soundboard) jeweils die volle Zeilenbreite einnehmen und keine Strafkarten mehr existieren.
2. [ ] **Timer-Test**: Start drücken -> Uhr zählt abwärts, Button wird zu Pause. Pause drücken -> Uhr stoppt. Reset drücken -> Uhr steht auf Startzeit.
3. [ ] **Tor-Plus-Test**: Tor Heim eintragen -> Spielstand 1:0, Torjingle startet, Stop-Button im Soundboard wird sichtbar/aktiv.
4. [ ] **Fade-Out-Test**: Während Jingle spielt, auf "Ton ausfaden" klicken -> Ton blendet über knapp 1 Sekunde weich aus und stoppt sauber.
5. [ ] **Tor-Minus-Test**: Tor-Korrektur klicken -> Spielstand 0:0, kein Ton ertönt. Weiteres Klicken ist deaktiviert.
6. [ ] **Spiel beenden & Weiter**: Klick auf "Spiel beenden & weiter" -> Bestätigen -> Spiel #1 wird auf `finished` gesetzt, Spiel #2 wird im Desk vorausgewählt.

### 8.2 Automatisierte Validierung
- [ ] `npm run lint` fehlerfrei.
- [ ] `npm run build` fehlerfrei.

---

## 9. Freigabe & Nächste Schritte

Gemäß **Spec Driven Development (SDD)**:
- Diese Spec befindet sich im Status **`In Review`**.
- **Stopp-Bedingung**: Es wird kein Code implementiert, bevor der Benutzer die Spec mit dem Signalwort **`APPROVED`** freigegeben hat.
