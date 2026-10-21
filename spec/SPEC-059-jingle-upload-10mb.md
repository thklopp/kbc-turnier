# SPEC-059: Erhöhung des Jingle-Upload-Limits auf 10 MB (Tor- & Ecken-Jingles)

> **Status**: Abgeschlossen  
> **Typ**: Optimierung  
> **Branch**: `feat/SPEC-059-jingle-upload-10mb`  
> **Autor**: Antigravity  
> **Erstellt am**: 2026-10-21  
> **Letzte Änderung**: 2026-10-21  
> **Betroffene Bereiche**: Turnierleitung (/admin) | Betreuer-Bereich (/team/:token) | Audio/Storage | Services  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Bisher ist die maximale Dateigröße für Jingle-Uploads (sowohl Tor-Jingles der Teams als auch Ecken-Jingles der Turnierleitung) auf **5 MB** limitiert. In der Praxis laden Betreuer und Administratoren Audiodateien (z. B. MP3, M4A, AAC, WAV) hoch, die trotz kurzer Spieldauer aufgrund höherer Bitraten oder ungeschnittener Ausgangsdateien zwischen 5 MB und 10 MB groß sein können. Diese Uploads wurden bislang mit einer Fehlermeldung („maximal 5 MB groß“) abgewiesen.

### 1.2 Zielzustand & Mehrwert
Das Dateigrößenlimit für alle Jingle-Uploads – sowohl teambezogene **Tor-Jingles** (über den Adminbereich sowie die betreuerseitige Jingle-Self-Service-Seite) als auch **Ecken-Jingles** (Turnierleitung) – wird von **5 MB auf 10 MB** (exakt `10 * 1024 * 1024` Bytes = `10.485.760 Bytes`) angehoben. Alle Hinweistexte, clientseitigen Vorab-Validierungen und serverseitigen Service-Validierungen werden einheitlich aktualisiert.

---

## 2. User Stories

- **US-1**: Als **Team-Betreuer** möchte ich auf der Jingle-Upload-Seite (`/team/:token`) Tor-Jingles mit einer Dateigröße von bis zu 10 MB hochladen können, damit auch hochqualitative oder längere Audiodateien ohne vorheriges manuelles Neukodieren akzeptiert werden.
- **US-2**: Als **Turnierleiter** möchte ich im Admin-Bereich (`/admin`) sowohl in den Team-Stammdaten als auch im Ecken-Jingle-Manager Audiodateien bis zu 10 MB hochladen können, ohne an der bisherigen 5-MB-Grenze zu scheitern.
- **US-3**: Als **Nutzer / Betreuer** möchte ich bei Auswahl einer Datei über 10 MB eine verständliche und präzise Fehlermeldung erhalten („maximal 10 MB groß“), damit ich genau weiß, warum der Upload abgelehnt wurde.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)
- [x] **Erhöhung Konstante / Limit Tor-Jingles (Admin & Self-Service)**:
  - Anhebung von 5 MB (`5 * 1024 * 1024`) auf 10 MB (`10 * 1024 * 1024`) in `teamService.ts` (`uploadTeamJingle` und `uploadJingleViaToken`).
  - Anpassung der Fehlermeldungen auf 10 MB.
- [x] **Erhöhung Konstante / Limit Ecken-Jingles**:
  - Anhebung der Konstante `MAX_AUDIO_FILE_SIZE` in `cornerJingleService.ts` von `5 * 1024 * 1024` auf `10 * 1024 * 1024`.
  - Anpassung der Fehlermeldung in `uploadCornerJingleAudio` auf 10 MB.
- [x] **UI-Validierungen & Hinweistexte aktualisieren**:
  - `src/components/admin/TeamEditModal.tsx`: Dateigrößenprüfung und Fehlermeldung auf 10 MB aktualisieren.
  - `src/pages/jingle/TeamJinglePage.tsx`: Dateigrößenprüfung, Fehlermeldung und Upload-Hinweistexte („max. 10 MB“) anpassen.
  - `src/components/admin/corners/CornerJingleModal.tsx`: Dateigrößenprüfung, Fehlermeldung und Hinweistexte („max. 10 MB“) anpassen.
- [x] **Dokumentation**:
  - Aktualisierung der Größenangaben in `DATABASE.md`.
- [x] **Automatisierte Tests**:
  - Aktualisierung der bestehenden Testfälle in `tests/spec052AudioFormate.test.ts` und `tests/spec057EckenJingles.test.ts` auf das neue 10-MB-Limit.
  - Dedizierte Testsuite in `tests/spec059JingleUpload10mb.test.ts`.

### 3.2 Explizit Out-of-Scope
- Änderung des Team-Logo-Upload-Limits (bleibt unverändert bei 2 MB).
- Änderungen an unterstützten Audioformaten (bleiben MP3, M4A, AAC, WAV, OGG).
- Änderungen am Abspielverhalten, Schnitt/Startzeitpunkt oder Fadeout-Dauer im Live-Desk.

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien

- [x] **AC-1: Gültiger Upload bis 10 MB für Tor-Jingle (Admin & Self-Service)**
  - **Gegeben sei**: Eine Audiodatei (z. B. MP3, M4A, AAC, WAV, OGG) mit einer Größe von 8,5 MB (<= 10 * 1024 * 1024 Bytes).
  - **Wenn**: Die Datei im Admin-Bereich (`TeamEditModal`) oder über den Betreuer-Link (`TeamJinglePage`) ausgewählt und gespeichert wird.
  - **Dann**: Wird die Datei erfolgreich validiert und ohne Größenfehler hochgeladen.

- [x] **AC-2: Ablehnung von Tor-Jingle-Dateien über 10 MB**
  - **Gegeben sei**: Eine Audiodatei mit einer Größe von 10,1 MB (> 10 * 1024 * 1024 Bytes).
  - **Wenn**: Die Datei im Betreuer-Bereich oder im Admin-Team-Modal ausgewählt wird.
  - **Dann**: Wird der Upload blockiert und die Fehlermeldung „Der Torjingle darf maximal 10 MB groß sein.“ bzw. „Die Datei darf maximal 10 MB groß sein.“ angezeigt.

- [x] **AC-3: Gültiger Upload bis 10 MB für Ecken-Jingles**
  - **Gegeben sei**: Eine Audiodatei mit einer Größe von 9,0 MB.
  - **Wenn**: Der Turnierleiter im Ecken-Jingle-Modal (`CornerJingleModal`) die Datei auswählt und hochlädt.
  - **Dann**: Wird die Datei erfolgreich angenommen und in Firebase Storage gespeichert.

- [x] **AC-4: Ablehnung von Ecken-Jingles über 10 MB**
  - **Gegeben sei**: Eine Audiodatei mit einer Größe von 10,5 MB.
  - **Wenn**: Die Datei im Ecken-Jingle-Modal ausgewählt wird.
  - **Dann**: Wird der Upload blockiert und die Fehlermeldung „Bitte wähle eine Audiodatei (max. 10 MB) aus.“ bzw. „Der Ecken-Jingle darf maximal 10 MB groß sein.“ angezeigt.

- [x] **AC-5: Konsistente Hinweistexte in der Benutzeroberfläche**
  - **Gegeben sei**: Die Upload-Formulare in `TeamJinglePage` und `CornerJingleModal`.
  - **Wenn**: Die Formulare gerendert werden.
  - **Dann**: Zeigen alle Hinweistexte und Labels explizit „max. 10 MB“ bzw. „bis maximal 10 MB“ anstelle von 5 MB an.

### 4.2 Allgemeine Qualitätskriterien
- [x] Keine fest kodierten Parameter außerhalb der definierten Konstanten.
- [x] Vollständige TypeScript-Typisierung ohne `any`.
- [x] Fehlerfreie Ausführung von `npm run build` und `npm test`.
- [x] Vollständige Dokumentationsaktualisierung in `DATABASE.md`.

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Betroffene Ansichten & Komponenten
- **Team-Self-Service**: `/team/:token` (`src/pages/jingle/TeamJinglePage.tsx`)
  - Label: `Audiodatei auswählen (max. 10 MB)`
  - Hinweistext: `Unterstützt MP3, M4A, AAC, WAV oder OGG bis 10 MB`
- **Admin Team-Bearbeitung**: `/admin` Modal (`src/components/admin/TeamEditModal.tsx`)
  - Fehlermeldung: `Der Torjingle darf maximal 10 MB groß sein.`
- **Admin Ecken-Jingle-Verwaltung**: `/admin#corners` Modal (`src/components/admin/corners/CornerJingleModal.tsx`)
  - Hinweistext: `MP3, M4A, AAC, WAV, OGG bis maximal 10 MB`
  - Validierungsfehler: `Bitte wähle eine Audiodatei (max. 10 MB) aus.`

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Datenmodell (`DATABASE.md`)
- Dokumentation der Collections `/teams/{teamId}` und `/corners/{cornerId}` aktualisieren:
  - `fileSize?: number; // Dateigröße in Bytes (max. 10 MB)`
  - Storage-Pfade Dokumentation:
    - `/teams/{teamId}/jingle.{ext}` (max. 10 MB)
    - `/corners/{cornerId}.{ext}` (max. 10 MB)

### 6.2 Service-Konstanten
- `src/services/cornerJingleService.ts`:
  ```typescript
  export const MAX_AUDIO_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
  ```
- `src/services/teamService.ts`:
  ```typescript
  const MAX_SIZE = 10 * 1024 * 1024 // 10 MB
  ```
