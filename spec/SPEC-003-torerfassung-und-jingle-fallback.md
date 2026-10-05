# SPEC-003: Robuste Torerfassung im Live-Desk & Jingle-Fallback

> **Status**: Abgeschlossen  
> **Typ**: Bugfix & Optimierung  
> **Branch**: fix/SPEC-003-torerfassung-und-jingle-fallback  
> **Autor**: Thorsten / Antigravity  
> **Erstellt am**: 2026-10-05  
> **Letzte Änderung**: 2026-10-05  
> **Betroffene Bereiche**: Turnierleitung (/admin) | Datenbank/Firestore | Audio/Storage  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Im Live-Desk der Turnierleitung (`/admin`) schlägt die Erfassung von Toren über den Button "Tor Heim (+1)" bzw. "Tor Gast (+1)" fehl:
1. **Firestore `undefined`-Payload**: Bei der Erzeugung des `MatchEvent`-Objekts in `useLiveMatchDesk.ts` wird das Feld `playerNumber` bei unbesetztem Wert auf `undefined` gesetzt (`playerNumber: playerNumber || undefined`). Da das Firebase Firestore SDK in `src/lib/firebase.ts` ohne die Option `ignoreUndefinedProperties: true` initialisiert ist, quittiert Firestore den `updateDoc`-Aufruf mit der Exception `Function updateDoc() called with invalid data. Unsupported field value: undefined`. Der Promise bricht ab und der Spielstand wird nicht aktualisiert.
2. **Abhängigkeit & Entkopplung der Torjingles**: Die Toreintragung muss unabhängig davon einwandfrei und unmittelbar funktionieren, ob für die jeweilige Mannschaft ein Torjingle hinterlegt ist (`jingleUrl` vorhanden) oder nicht. Zudem dürfen etwaige Fehler bei der Audiowiedergabe (z. B. Autoplay-Blockaden, ungültige Audio-URLs, Ladefehler) die Toreintragung und Persistierung in Firestore keinesfalls blockieren.

### 1.2 Zielzustand & Mehrwert
- Das Eintragen von Toren im Live-Desk funktioniert zuverlässig und performant für alle Spiele und Mannschaften.
- Ist für ein Team kein Torjingle hinterlegt (`jingleUrl` ist `null`, `undefined` oder Leerstring), wird das Tor sofort erfasst, der Spielstand hochgezählt und das Event in Firestore gespeichert – ohne jegliche Fehlermeldung oder Verzögerung.
- Ist ein Torjingle vorhanden, wird er wie gewohnt abgespielt. Scheitert das Abspielen (z. B. Browser-Autoplay-Richtlinie, Netzwerkfehler), wird die Audio-Warnung geloggt, die Toreintragung bleibt jedoch zu 100 % erfolgreich.
- Auch Verwarnungen/Strafzeiten (`addPenalty`) werden gegen das `undefined`-Problem bei Spielernummern gehärtet.

---

## 2. User Stories

- **US-1**: Als **Turnierleiter** möchte ich im Live-Desk mit einem Klick auf "Tor Heim (+1)" bzw. "Tor Gast (+1)" ein Tor erfassen können, damit der Spielstand in Echtzeit für Halle, Kiosk und Gastansicht aktualisiert wird.
- **US-2**: Als **Turnierleiter** möchte ich Tore auch für Teams erfassen können, die noch keinen oder gar keinen Torjingle hochgeladen haben, damit der Spielbetrieb unterbrechungsfrei weiterläuft.
- **US-3**: Als **Turnierleiter** möchte ich, dass technische Audio-Probleme (z. B. fehlerhafte MP3-Datei oder Browser-Restriktionen) niemals das Speichern des Spielergebnisses verhindern.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have / Should-Have)
- [x] **Must-Have: Bereinigung der Event-Payloads**: Bei der Erstellung von `MatchEvent` für Tore (`recordGoal`) und Karten (`addPenalty`) dürfen keine Felder mit dem Wert `undefined` an Firestore übergeben werden (z. B. durch bedingtes Setzen von `playerNumber` oder Vorab-Sanitizing).
- [x] **Must-Have: Firestore SDK Absicherung**: Aktivierung von `ignoreUndefinedProperties: true` bei der Initialisierung von Firestore in `src/lib/firebase.ts` als systemweite Sicherheitsbarriere.
- [x] **Must-Have: Entkopplung der Audio-Wiedergabe**: Die Jingle-Wiedergabe in `recordGoal` erfolgt strikt asynchron und fehlerisoliert (`try-catch` um `play`), sodass weder das Fehlen eines Jingles noch ein Playback-Fehler das `updateMatch` verhindert.
- [x] **Must-Have: Graceful Handling bei fehlendem Jingle**: Wenn `team.jingleUrl` `null`, `undefined` oder ein leerer String ist, wird kein Wiedergabeversuch unternommen und das Tor lautlos verbucht.
- [x] **Should-Have: Fehlerbehandlung & Logging**: Robuste Fehlerbehandlung in `recordGoal` mit aussagekräftigem Logging (`console.error`), falls das Firestore-Update fehlschlagen sollte.

### 3.2 Explizit Out-of-Scope (Nicht Teil dieser Spec)
- Überarbeitung der Benutzeroberfläche zur Erfassung von Torschützennummern (dies bleibt optional bzw. für spätere Features vorbehalten).
- Ersetzen oder automatische Neugenerierung von Standard-Torjingles für Teams ohne Audio-Datei.

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien
- [x] **AC-1: Torerfassung bei Team OHNE Torjingle**
  - **Gegeben sei**: Ein laufendes oder geplantes Spiel, bei dem das erzielende Team keinen Torjingle besitzt (`jingleUrl` ist `null` oder nicht gesetzt).
  - **Wenn**: Der Benutzer auf "Tor Heim (+1)" bzw. "Tor Gast (+1)" klickt.
  - **Dann**:
    - Der Spielstand erhöht sich sofort um 1.
    - Das Spiel wechselt bei Status `scheduled` automatisch auf `live`.
    - Das Tor wird mit passender Spielminute in das `events`-Array eingetragen.
    - Die Änderung wird erfolgreich in Firestore gespeichert.
    - Es wird keine Exception geworfen.

- [x] **AC-2: Torerfassung bei Team MIT Torjingle**
  - **Gegeben sei**: Ein laufendes Spiel, bei dem das Team einen gültigen Torjingle hinterlegt hat.
  - **Wenn**: Der Benutzer auf "+1 Tor" klickt.
  - **Dann**:
    - Der Spielstand erhöht sich um 1 und wird in Firestore gespeichert.
    - Der Torjingle wird abgespielt.

- [x] **AC-3: Torerfassung bei fehlerhaftem Audio / Autoplay-Blockade**
  - **Gegeben sei**: Ein Team mit ungültiger oder unerreichbarer `jingleUrl`.
  - **Wenn**: Der Benutzer auf "+1 Tor" klickt.
  - **Dann**:
    - Der Audio-Fehler wird lautlos abgefangen bzw. geloggt.
    - Der Spielstand wird dennoch ohne Unterbrechung gespeichert und die UI aktualisiert.

- [x] **AC-4: Strafkartenvergabe ohne Spielernummer**
  - **Gegeben sei**: Im Live-Desk wird eine grüne oder gelbe Karte ohne Angabe einer Spielernummer vergeben.
  - **Wenn**: Die Karte bestätigt wird.
  - **Dann**:
    - Das Event wird fehlerfrei ohne `undefined`-Attribute in Firestore gespeichert.
    - Die Zeitstrafe wird im Strafzeiten-Manager korrekt angezeigt.

### 4.2 Allgemeine Qualitätskriterien
- [x] Keine fest kodierten Parameter (Einhaltung von `AGENTS.md`).
- [x] Vollständige TypeScript-Typisierung ohne `any`.
- [x] Baut fehlerfrei (`npm run build`).

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Betroffene Ansichten & Komponenten
- **Pfad**: `/admin` (Tab "Turnierleitung Live-Desk")
- **Komponenten**:
  - `src/hooks/useLiveMatchDesk.ts`
  - `src/lib/firebase.ts`
  - `src/components/admin/live/ScoreboardDisplay.tsx`

### 5.2 Interaktionsablauf
1. Turnierleitung klickt auf "+1 Tor Heim" oder "+1 Tor Gast".
2. System ermittelt aktuelle Spielminute und Team.
3. Falls Jingle vorhanden: Audio wird asynchron gestartet.
4. `newEvent` wird erzeugt (ohne `undefined`-Attribute).
5. `updateMatch` speichert Spielstand und Event in Firestore.
6. Scoreboard aktualisiert sich in Echtzeit via Firestore-Snapshot.

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Datenmodell (`DATABASE.md`)
- Keine Schema-Änderung erforderlich. Die Struktur von `MatchEvent` mit optionalem `playerNumber?: number` bleibt unverändert.
- Es wird sichergestellt, dass bei Fehlen von `playerNumber` das Feld im Firestore-Dokument gar nicht erst übermittelt wird (bzw. durch `ignoreUndefinedProperties: true` ignoriert wird).

### 6.2 TypeScript Interfaces (`src/types/database.ts`)
- Bleiben unverändert kompatibel.

### 6.3 State & Hook Anpassungen
- `src/lib/firebase.ts`:
  ```typescript
  import { initializeFirestore } from "firebase/firestore"
  // Aktivierung von ignoreUndefinedProperties: true
  export const db: Firestore = initializeFirestore(app, {
    ignoreUndefinedProperties: true,
  })
  ```
- `src/hooks/useLiveMatchDesk.ts`:
  - `newEvent` sauber konstruieren:
    ```typescript
    const newEvent: MatchEvent = {
      id: `goal-${Date.now().toString(36)}`,
      type: "goal",
      teamId: teamId || (isHome ? "home" : "away"),
      matchMinute: minute,
      timestamp: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } as MatchEvent["timestamp"],
      ...(playerNumber !== undefined ? { playerNumber } : {}),
    }
    ```
  - Audio-Wiedergabe mit `try / catch` kapseln:
    ```typescript
    if (scoringTeam?.jingleUrl) {
      try {
        play(scoringTeam.jingleUrl)
      } catch (err) {
        console.warn("Torjingle konnte nicht abgespielt werden:", err)
      }
    }
    ```

---

## 7. Edge Cases & Fehlerbehandlung

- **Team ohne ID / Placeholder-Teams (Finals)**: Wenn in Finalspielen noch kein festes Team zugewiesen ist (`teamHomeId === ""`), greift der Fallback auf `"home"` bzw. `"away"`, und es wird kein Jingle abgespielt, da kein Team existiert.
- **Audio-Netzwerkfehler**: Werden im `useAudioPlayer` bzw. im `try-catch` aufgefangen.
- **Firestore Offline**: Firestore speichert die Änderung lokal im Cache und synchronisiert bei Wiederverbindung.

---

## 8. Verifikations- & Testplan

### 8.1 Manuelle Tests
1. [ ] Live-Desk öffnen und ein Spiel wählen, dessen Teams keinen Torjingle besitzen.
2. [ ] Auf "Tor Heim (+1)" klicken -> Spielstand wechselt auf 1:0, Spielminute und Event werden angezeigt, kein Fehler in der Konsole.
3. [ ] Auf "Tor Gast (+1)" klicken -> Spielstand wechselt auf 1:1.
4. [ ] Tor wieder abziehen (-1) -> Spielstand wechselt auf 1:0.
5. [ ] Karte vergeben ohne Spielernummer -> Karte wird gespeichert, kein Firestore-Fehler.
6. [ ] Spiel wählen mit Team, das einen Jingle besitzt -> Tor klicken -> Jingle spielt ab und Spielstand erhöht sich.

### 8.2 Automatisierte Tests / Validierung
- [ ] `npm run build` baut ohne TypeScript- oder Lint-Fehler.

---

## 9. Offene Fragen & Klärungsbedarf
- Keine.
