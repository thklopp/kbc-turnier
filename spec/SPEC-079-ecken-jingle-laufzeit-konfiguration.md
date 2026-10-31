# SPEC-079: Konfigurierbare Ecken-Jingle Maximallaufzeit (Standard 25s)

> **Status**: Abgeschlossen  
> **Typ**: Feature / Konfiguration  
> **Branch**: feat/SPEC-079-ecken-jingle-laufzeit-konfiguration  
> **Autor**: Antigravity  
> **Erstellt am**: 2026-10-31  
> **Letzte Änderung**: 2026-10-31  
> **Betroffene Bereiche**: Turnierleitung (/admin) | Ecken-Jingle-Verwaltung | Live-Desk (/admin) | Firestore-Konfiguration (`config/tournament`)  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Bisher ist die maximale Abspieldauer für Ecken-Jingles im Live-Desk (`useLiveMatchDesk.ts`) statisch auf 15 Sekunden (`maxDurationMs: 15000`) mit 1 Sekunde Fade-Out (`fadeOutDurationMs: 1000`) festgelegt. 15 Sekunden sind bei Strafecken in der Praxis oft zu kurz, da die Ausführung einer Hallen-Strafecke (Vorbereitung der Abwehr, Masken aufsetzen, Freigabe der Schiedsrichter) typischerweise bis zu 20–25 Sekunden in Anspruch nimmt.
Zudem gab es bislang in der Ecken-Jingle-Verwaltung (`/admin` -> Ecken-Jingles) keine Möglichkeit, diese Gesamtlaufzeit dynamisch zu konfigurieren.

### 1.2 Zielzustand & Mehrwert
1. **Neue Standardlaufzeit**: Die maximale Laufzeit für Ecken-Jingles wird von 15 Sekunden auf **25 Sekunden** erhöht (inklusive 1 Sekunde automatischem Fade-Out ab Sekunde 24).
2. **Globale Einstellbarkeit in der Ecken-Jingle-Verwaltung**: Auf der Seite der Ecken-Jingle-Verwaltung (`CornerJingleManager`) erhält die Turnierleitung eine Einstellmöglichkeit für die allgemeine maximale Abspieldauer in Sekunden.
3. **Persistierung in der Turnierkonfiguration**: Der Wert wird zentral im Firestore-Dokument `config/tournament` unter `cornerJingleDurationSeconds` (Standard: 25) gespeichert, sodass er ohne Hardcoding live von allen Live-Desk-Instanzen reaktiv übernommen wird.

---

## 2. User Stories

- **US-1**: Als **Turnierleiter am Live-Desk** möchte ich, dass Ecken-Jingles standardmäßig bis zu 25 Sekunden laufen, damit die musikalische Untermalung die gesamte Vorbereitungsphase der Strafecke abdeckt.
- **US-2**: Als **Turnierleiter in der Ecken-Jingle-Verwaltung** möchte ich die maximale Laufzeit in Sekunden zentral für alle Ecken-Jingles einstellen und speichern können, um flexibel auf den gewünschten Hallenablauf reagieren zu können.
- **US-3**: Als **Turnierleiter** möchte ich sofortiges visuelles Feedback beim Speichern der neuen Laufzeit erhalten, um sicher zu sein, dass die Änderung erfolgreich übernommen wurde.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)
- [x] **Erweiterung `TournamentConfig` (`src/types/database.ts` & `DATABASE.md`)**:
  - Neues optionales Feld `cornerJingleDurationSeconds?: number;` (Standard: 25).
- [x] **Config-Service (`src/services/configService.ts`)**:
  - `DEFAULT_CONFIG` erhält `cornerJingleDurationSeconds: 25`.
  - `normalizeConfig` initialisiert `cornerJingleDurationSeconds` mit dem gespeicherten Wert bzw. Fallback `25` (Validierung: Ganzzahl, Mindestwert 5s, Maximalwert 120s).
- [x] **Ecken-Jingle-Verwaltung UI (`CornerJingleManager.tsx`)**:
  - Neuer Konfigurationsbereich oberhalb des Jingle-Rasters (z. B. Banner/Card mit Eingabefeld für die Laufzeit in Sekunden, Speichern-Button und Erfolgs-/Fehler-Feedback).
  - Aktualisierung des Beschreibungstextes (von statisch „15s Playback“ auf dynamische Anzeige bzw. Hinweis auf die konfigurierte Laufzeit).
- [x] **Live-Desk Integration (`useLiveMatchDesk.ts` & `LiveMatchDesk.tsx`)**:
  - `useLiveMatchDesk` berücksichtigt den Wert `config.cornerJingleDurationSeconds` (Fallback 25) und berechnet `maxDurationMs = durationSeconds * 1000`.
  - Automatischer Fade-Out startet weiterhin `1000 ms` vor Ablauf der maximalen Dauer.

### 3.2 Explizit Out-of-Scope
- Individuelle Laufzeiteinstellung pro einzelnem Ecken-Jingle (vom Nutzer explizit als „nicht pro Jingle sondern allgemein“ angefragt).
- Änderung der maximalen Laufzeit von Tor-Jingles (diese bleiben bei 15s).

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien
- [x] **AC-1: Standardlaufzeit von 25 Sekunden**
  - **Gegeben sei**: Ein frisches System oder eine Konfiguration ohne gesetzten Wert `cornerJingleDurationSeconds`.
  - **Wenn**: Im Live-Desk ein Ecken-Jingle gestartet wird.
  - **Dann**: Läuft der Jingle für 24 Sekunden mit normaler Lautstärke, fadet in Sekunde 25 für 1 Sekunde aus und stoppt nach 25 Sekunden vollständig.

- [x] **AC-2: Laufzeiteinstellung in der Ecken-Jingle-Verwaltung**
  - **Gegeben sei**: Der Admin befindet sich im Reiter „Ecken-Jingles“ (`/admin`).
  - **Wenn**: Er im Konfigurationsfeld eine neue Laufzeit eingibt (z. B. `30` Sekunden) und auf „Speichern“ klickt.
  - **Dann**: Wird der Wert in Firestore (`config/tournament`) gespeichert und eine Bestätigungsmeldung („Gespeichert“) angezeigt.

- [x] **AC-3: Dynamische Übernahme im Live-Desk**
  - **Gegeben sei**: Die Laufzeit wurde auf 30 Sekunden konfiguriert.
  - **Wenn**: Der Turnierleiter im Live-Desk einen Ecken-Jingle abspielt.
  - **Dann**: Wird die neue Spieldauer von 30 Sekunden verwendet (Fade-Out startet nach 29 Sekunden).

- [x] **AC-4: Validierung der Eingabe**
  - **Gegeben sei**: Der Admin gibt einen ungültigen Wert ein (z. B. < 5 Sekunden oder leer).
  - **Wenn**: Er speichern möchte.
  - **Dann**: Verhindert die Validierung das Speichern und gibt einen verständlichen Hinweis aus (z. B. „Bitte einen Wert zwischen 5 und 120 Sekunden angeben“).

### 4.2 Allgemeine Qualitätskriterien
- [x] Keine fest kodierten Parameter (Verbot von Hardcoding gemäß `AGENTS.md`).
- [x] Vollständige TypeScript-Typisierung ohne `any`.
- [x] Fehlerfreie Ausführung von `npm run build` und Linting.
- [x] Sauberes Aufräumen aller Firestore-Listener (`unsubscribe`).

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Betroffene Ansichten & Komponenten
- **Pfad**: `/admin` (Reiter `corners` / `CornerJingleManager.tsx`)
- **Elemente**:
  - Elegante Konfigurations-Card oberhalb der Jingle-Kacheln mit `Clock`-Icon, Eingabefeld (`type="number"`), Label „Maximale Spieldauer im Live-Desk (Sekunden)“, Hilfetext „Inkl. 1s automatischem Fade-Out zum Ende“ und Speichern-Button mit Lade- und Erfolgszustand (`CheckCircle`).
  - Angepasster Untertitel im Header: Dynamische Angabe der aktuell konfigurierten Laufzeit.

### 5.2 Interaktionsablauf
1. Admin ruft `/admin` auf und wechselt in den Bereich „Ecken-Jingles“.
2. Oben in der Konfigurationskarte ist die aktuelle Laufzeit (Standard: `25 s`) vorausgefüllt.
3. Admin ändert den Wert (z. B. auf `20`) und klickt auf „Speichern“.
4. Button zeigt kurzen Spinner (`Speichern...`) gefolgt von einem grünen Haken (`Gespeichert`).
5. Live-Desk übernimmt die Änderung ohne Seiten-Reload in Echtzeit.

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Datenmodell (`DATABASE.md`)
- **Collection / Dokument**: `config/tournament`
- **Erweiterung**:
  ```typescript
  export interface TournamentConfig {
    // ... bestehende Felder
    cornerJingleDurationSeconds?: number; // Maximale Spieldauer von Ecken-Jingles im Live-Desk in Sekunden (Standard: 25)
  }
  ```

### 6.2 TypeScript Interfaces (`src/types/database.ts`)
- Ergänzung von `cornerJingleDurationSeconds?: number` im Interface `TournamentConfig`.

---

## 7. Verifikationsplan

### 7.1 Manuelle Tests
1. **Laufzeit-Konfiguration testen**:
   - Wert auf 10 Sekunden setzen und speichern.
   - Ecken-Jingle auf dem Live-Desk starten und Zeit stoppen (Fade-Out ab Sekunde 9, Stopp bei Sekunde 10).
   - Wert auf 25 Sekunden zurücksetzen und erneut testen (Fade-Out ab Sekunde 24, Stopp bei Sekunde 25).
2. **Validierung testen**:
   - Ungültige Werte (0, negativ, > 120) prüfen.
3. **Persistenz & Fallback**:
   - Reload der Seite, Wert bleibt persistent.

### 7.2 Automatisierte Prüfungen
```bash
npm run lint
npm run build
```
