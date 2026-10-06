# SPEC-009: Live-Desk Jingle-Steuerung & Startzeitpunkt-Konfiguration

> **Status**: In Abnahme  
> **Typ**: Feature & Optimierung  
> **Branch**: feat/SPEC-009-live-desk-jingle-steuern-und-startzeitpunkt  
> **Autor**: Thorsten / Antigravity  
> **Erstellt am**: 2026-10-06  
> **Letzte Änderung**: 2026-10-06  
> **Betroffene Bereiche**: Turnierleitung (/admin) | Datenbank/Firestore | Audio/Storage  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Im Live-Desk (`/admin`) wird beim Klick auf "Tor Heim (+1)" bzw. "Tor Gast (+1)" der Torjingle des jeweiligen Teams abgespielt. Dabei treten derzeit folgende Usability- und Funktionsprobleme auf:
1. **Fehlende Jingle-Kontrolle im Tor-Button**: Nach dem Klick auf "Tor Heim (+1)" bzw. "Tor Gast (+1)" bleibt der Button unverändert. Möchte die Turnierleitung den Jingle vorzeitig stoppen (z. B. weil der Schiedsrichter anpfeift), besteht die Gefahr, durch erneutes Klicken versehentlich ein weiteres Tor einzutragen.
2. **Abruptes Stoppen statt Fade-Out**: Wenn Jingles manuell gestoppt werden, bricht die Wiedergabe abrupt ab, anstatt sanft über 1 Sekunde auszufaden.
3. **Fester Start am Songanfang**: Viele MP3-Torjingles haben ein langes Intro oder Stille am Anfang. Der treibende Refrain bzw. die Torfanfare beginnt oft erst nach einigen Sekunden (z. B. nach 2.500 ms). Aktuell gibt es in der Mannschaftsverwaltung keine Möglichkeit, einen individuellen Start-Offset festzulegen.

### 1.2 Zielzustand & Mehrwert
- **Dynamischer Tor-/Stopp-Button**: Klickt die Turnierleitung auf ein Tor, wird das Tor wie gewohnt erfasst und der Jingle startet. Solange der Jingle für dieses Team läuft, wandelt sich der Button in einen auffälligen "Jingle stoppen"-Button. Klickt man darauf, wird **kein** weiteres Tor gezählt, sondern der Jingle blendet sanft aus.
- **Sanftes 1-Sekunden-Fade-Out**: Das Stoppen des Jingles fadet die Lautstärke über genau 1 Sekunde (1.000 ms) stufenlos auf 0 ab, bevor die Wiedergabe beendet wird. Nach Beendigung des Fade-Outs wird der Button automatisch wieder zum normalen "Tor (+1)"-Button.
- **Startzeitpunkt in Millisekunden**: In den Teameinstellungen kann pro Mannschaft ein Startzeitpunkt (`jingleStartTimeMs`, z. B. `3200` für 3,2 Sekunden) eingetragen werden. Sowohl beim Tor im Live-Desk als auch beim Probehören in den Team-Karten und im Bearbeiten-Modal startet das Audio exakt an dieser Stelle.

---

## 2. User Stories

- **US-1**: Als **Turnierleiter im Live-Desk** möchte ich, dass der Tor-Button während des Abspielens eines Torjingles als "Jingle stoppen"-Button fungiert, damit ich das Audio bei Wiederanpfiff mit einem Klick beenden kann, ohne versehentlich ein zweites Tor einzutragen.
- **US-2**: Als **Turnierleiter und Hallensprecher** möchte ich, dass der Jingle beim Stoppen innerhalb von 1 Sekunde sanft leiser wird (Fade-Out), damit der Hallensound professionell klingt und nicht abrupt abbricht.
- **US-3**: Als **Turnierleiter** möchte ich in der Mannschaftsverwaltung einen individuellen Startzeitpunkt in Millisekunden für den Torjingle angeben und vorab probehören können, damit der Jingle sofort an der energiegeladenen Stelle (z. B. dem Refrain) einsetzt.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have / Should-Have)
- [x] **Must-Have: `jingleStartTimeMs` im Team-Datenmodell**:
  - Optionales Attribut `jingleStartTimeMs?: number` im `Team`-Interface und Firestore.
  - Standardwert `0` ms.
- [x] **Must-Have: Teambearbeitung mit Startzeitpunkt-Eingabe**:
  - Neues Zahlenfeld "Startzeitpunkt (in Millisekunden)" im `TeamEditModal`.
  - Hilfetext / Umrechnungshilfe (z. B. `1500 ms = 1,5 Sekunden`).
  - Funktion "Probehören ab Startzeitpunkt" im Modal zum direkten Verifizieren.
- [x] **Must-Have: Startzeitpunkt-Unterstützung im Audio-Player**:
  - `play(url: string, startTimeMs?: number)` in `useAudioPlayer.ts` setzt `audio.currentTime = (startTimeMs || 0) / 1000`.
- [x] **Must-Have: Dynamischer Tor- / Stopp-Button im Live-Desk (`ScoreboardDisplay.tsx`)**:
  - Wenn für das jeweilige Team gerade der Jingle läuft (`isPlaying && activeTeamJingleUrl === team.jingleUrl`):
    - Der Button wechselt von "Tor Heim (+1)" (bzw. "Tor Gast (+1)") zu "Jingle stoppen" (mit Stopp-/Audio-Icon und visueller Unterscheidung, z. B. lila/amber pulsierend).
    - Ein Klick darauf ruft das 1-Sekunden-Fadeout auf (`fadeOutAudio(1000)`). Es wird **kein** Tor verbucht!
    - Während des Fade-Outs zeigt der Button "Blende aus..." (deaktiviert oder weiterhin optisch signalisiert).
    - Sobald der Jingle beendet oder ausgefadet ist, wechselt der Button automatisch zurück zu "Tor Heim (+1)" bzw. "Tor Gast (+1)".
- [x] **Must-Have: 1.000 ms Fade-Out**:
  - `fadeOut(1000)` blendet das Audio über 1.000 ms ab (stufenlos in z. B. 20 Schritten à 50 ms).
- [x] **Should-Have: TeamCard Probehören mit Startzeitpunkt**:
  - Auch in der Team-Übersicht (`TeamCard.tsx`) startet der Jingle bei `team.jingleStartTimeMs`.

### 3.2 Explizit Out-of-Scope (Nicht Teil dieser Spec)
- Automatisches Schneiden oder Re-Encodieren von MP3-Dateien auf dem Server/Storage (die Datei bleibt im Originalzustand erhalten; der Versatz wird clientseitig über HTML5 Audio gesteuert).
- Grafische Wellenformanzeige (Waveform) zum visuellen Setzen von Markern.

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien
- [x] **AC-1: Startzeitpunkt im Team pflegen & speichern**
  - **Gegeben sei**: Die Turnierleitung öffnet `/admin` -> "Mannschaften" und klickt auf "Bearbeiten" für ein Team mit Torjingle.
  - **Wenn**: Der Benutzer `2500` in das Feld "Startzeitpunkt (in Millisekunden)" eingibt und auf "Speichern" klickt.
  - **Dann**:
    - Der Wert wird in Firestore / lokalem State persistiert.
    - Beim erneuten Öffnen des Modals steht `2500` im Feld.

- [x] **AC-2: Audio-Wiedergabe startet am konfigurierten Offset**
  - **Gegeben sei**: Ein Team besitzt einen Jingle und `jingleStartTimeMs` ist auf `3000` (3 Sekunden) gesetzt.
  - **Wenn**: Im Modal auf "Probehören" geklickt wird ODER im Live-Desk ein Tor für dieses Team erzielt wird.
  - **Dann**: Startet das Audio exakt bei Sekunde 3,0 und nicht bei 0,0.

- [x] **AC-3: Tor-Button verwandelt sich bei Jingle-Wiedergabe in Stopp-Button**
  - **Gegeben sei**: Im Live-Desk läuft ein Spiel. Heimteam hat einen Jingle hinterlegt.
  - **Wenn**: Der Benutzer auf "Tor Heim (+1)" klickt.
  - **Dann**:
    - Der Spielstand erhöht sich um 1 und wird in Firestore gespeichert.
    - Der Jingle des Heimteams startet bei `jingleStartTimeMs`.
    - Der Button "Tor Heim (+1)" verwandelt sich sofort in einen Stopp-Button (z. B. "Jingle stoppen" mit Stop-Icon).
    - Der Button von Gastteam bleibt davon unbeeinflusst (bzw. ist weiterhin bedienbar).

- [x] **AC-4: Jingle stoppen fadet über 1 Sekunde aus & zählt KEIN Tor**
  - **Gegeben sei**: Der Tor-Button befindet sich im Status "Jingle stoppen".
  - **Wenn**: Der Benutzer auf "Jingle stoppen" klickt.
  - **Dann**:
    - Der Spielstand verändert sich **nicht** (kein zweites Tor!).
    - Der Jingle wird über 1.000 ms sanft ausgeblendet.
    - Nach 1.000 ms stoppt das Audio vollständig.
    - Der Button kehrt sofort/nach dem Fadeout zurück zum Standardzustand "Tor Heim (+1)".

- [x] **AC-5: Normales Durchlaufen des Jingles**
  - **Gegeben sei**: Ein Tor wurde erzielt, der Jingle spielt ab, der Benutzer klickt *nicht* auf Stopp.
  - **Wenn**: Der Jingle bis zum Ende abgespielt wurde (`onended`).
  - **Dann**: Schaltet der Button automatisch wieder zurück auf "Tor Heim (+1)".

- [x] **AC-6: Team ohne Jingle oder Jingle ohne Startzeitpunkt**
  - **Gegeben sei**: Ein Team hat keinen Jingle hinterlegt ODER `jingleStartTimeMs` ist nicht definiert / 0.
  - **Wenn**: Ein Tor erzielt wird.
  - **Dann**: Verhält sich das System fehlerfrei; ohne Jingle bleibt der Tor-Button unverändert und es gibt keine Verzögerung. Mit Jingle ohne Offset startet er wie gewohnt bei Sekunde 0.

### 4.2 Allgemeine Qualitätskriterien
- [x] Keine fest kodierten Zeiten oder Parameter (Einhaltung von `AGENTS.md`).
- [x] Vollständige TypeScript-Typisierung ohne `any`.
- [x] Baut fehlerfrei (`npm run build`).

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Betroffene Ansichten & Komponenten
- **Pfad**: `/admin` (Tabs "Turnierleitung Live-Desk" und "Mannschaften & Torjingles")
- **Komponenten**:
  - `src/components/admin/TeamEditModal.tsx` (Eingabefeld Startzeitpunkt & Test-Play-Button)
  - `src/components/admin/TeamCard.tsx` (Jingle abspielen mit Offset)
  - `src/components/admin/live/ScoreboardDisplay.tsx` (Tor-/Stopp-Button Toggle)
  - `src/hooks/useLiveMatchDesk.ts` (Passing von Jingle-State & Stopp-Funktion)
  - `src/hooks/useAudioPlayer.ts` (1-Sekunden Fade-Out & Offset-Start)

### 5.2 Interaktionsablauf
1. **Tor erzielt**:
   - Klick auf "Tor Heim (+1)".
   - Tor wird gezählt (+1) und in Firestore persistiert.
   - Jingle startet bei `homeTeam.jingleStartTimeMs`.
   - Button wird zu "Jingle stoppen" (lila, pulsierend, `Square`-Icon).
2. **Vorzeitiger Abbruch gewünscht**:
   - Klick auf "Jingle stoppen".
   - Kein Tor gezählt.
   - 1.000 ms Lautstärke-Fade-Out (`1.0 -> 0.0`).
   - Button schaltet zurück auf "Tor Heim (+1)".

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Datenmodell (`DATABASE.md`)
Erweiterung des `teams/{teamId}`-Dokuments:
```typescript
interface Team {
  // bestehende Felder...
  id: string
  name: string
  shortName: string
  gender: GenderCategory
  group: TournamentGroup
  logoUrl: string | null
  jingleUrl: string | null
  // NEU:
  jingleStartTimeMs?: number | null // Startposition in Millisekunden (Standard: 0)
}
```

### 6.2 TypeScript Interfaces (`src/types/database.ts`)
- Ergänzung von `jingleStartTimeMs?: number | null` im Interface `Team`.

### 6.3 State & Hook Anpassungen
- `src/hooks/useAudioPlayer.ts`:
  - `play(url?: string | null, startTimeMs?: number)`:
    ```typescript
    if (startTimeMs && startTimeMs > 0) {
      audio.currentTime = startTimeMs / 1000
    }
    ```
  - `fadeOut(durationMs = 1000)`: Standardmäßig 1.000 ms.
- `src/hooks/useLiveMatchDesk.ts`:
  - `recordGoal`:
    ```typescript
    if (scoringTeam?.jingleUrl) {
      play(scoringTeam.jingleUrl, scoringTeam.jingleStartTimeMs || 0)
    }
    ```
- `src/components/admin/live/ScoreboardDisplay.tsx`:
  - Ermittelt anhand von `isPlayingAudio(homeTeam?.jingleUrl)` bzw. `isFadingAudio`, ob der Heim-Tor-Button als Stopp-Button dargestellt werden soll.

---

## 7. Edge Cases & Fehlerbehandlung

- **Startzeitpunkt größer als Audio-Dauer**: Wenn ein Benutzer versehentlich `99999` ms eingibt, setzt HTML5 `audio.currentTime` auf das Audio-Ende (`onended` feuert sofort). Fehlerfrei, kein App-Absturz.
- **Negative Zahlen**: Im Formular wird `min={0}` und `Math.max(0, val)` erzwungen.
- **Mehrfaches schnelles Klicken**: Klick auf "Jingle stoppen" löst `fadeOut` aus und verhindert durch Status-Toggle ein Erhöhen des Spielstands.
- **Browser Autoplay-Blockade**: Scheitert das Abspielen, bleibt der Tor-Button im Normalzustand oder kehrt sofort zurück.

---

## 8. Verifikations- & Testplan

### 8.1 Manuelle Tests
1. [ ] Team in `/admin` öffnen, `jingleStartTimeMs` auf z. B. `4000` (4 Sekunden) setzen und im Modal Probehören -> Audio startet bei 4s.
2. [ ] Speichern und in Team-Karte "Jingle" abspielen -> Audio startet bei 4s.
3. [ ] Im Live-Desk "Tor Heim (+1)" klicken -> Spielstand 1:0, Jingle startet bei 4s, Button wird zu "Jingle stoppen".
4. [ ] Auf "Jingle stoppen" klicken -> Spielstand bleibt 1:0, Audio fadet sanft über 1 Sekunde aus, Button wird wieder zu "Tor Heim (+1)".
5. [ ] Erneut Tor klicken und Jingle bis zum Ende laufen lassen -> Button schaltet bei Song-Ende automatisch zurück.

### 8.2 Automatisierte Tests / Validierung
- [ ] `npm run build` baut ohne TypeScript- oder Lint-Fehler.
- [ ] Bestehende Test-Suites (`npm run test` falls vorhanden) laufen fehlerfrei durch.

---

## 9. Offene Fragen & Klärungsbedarf
- Keine. Anforderungen sind klar umrissen und fügen sich nahtlos in die bestehende Architektur ein.
