# SPEC-052: Unterstützung erweiterter Audio-Formate für Torjingles (.mp3, .m4a, .aac, .wav, .ogg)

> **Status**: Abgeschlossen  
> **Typ**: Feature / Optimierung  
> **Branch**: feat/SPEC-052-audio-formate-jingle-upload  
> **Autor**: Antigravity  
> **Erstellt am**: 2026-10-20  
> **Letzte Änderung**: 2026-10-20  
> **Betroffene Bereiche**: Admin (/admin -> Team-Verwaltung), Betreuerbereich (/team/:token), Services (teamService), Firebase Storage  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Bislang war das Hochladen von Torjingles im Admin-Bereich (`TeamEditModal`) sowie auf der Betreuerseite (`TeamJinglePage`) ausschließlich auf das Dateiformat `.mp3` beschränkt.  
In der Praxis (insbesondere beim Upload über iPhones, iPads oder Macs von Betreuern und Trainern) liegen Audioaufnahmen, Songausschnitte oder Sprachmemos jedoch sehr häufig im Format `.m4a` (Apple AAC) oder `.aac` vor. Auch unkomprimierte Formate wie `.wav` oder freie Formate wie `.ogg` sind gebräuchlich.  
Da die Wiedergabe im Browser über natives HTML5 Audio (`new Audio()` bzw. `<audio>`) erfolgt, können moderne Browser all diese Audioformate bereits heute ohne jegliche Code-Änderung in der Wiedergabe-Engine abspielen. Die Einschränkung auf `.mp3` war eine rein künstliche Hürde in der Dateityp-Validierung und beim Dateinamen im Storage.

### 1.2 Zielzustand & Mehrwert
- Sowohl im Admin-Bereich (`TeamEditModal`) als auch im Betreuerbereich (`TeamJinglePage`) können Torjingles in den folgenden 5 Standard-Audioformaten hochgeladen werden:
  - **MP3** (`.mp3` / `audio/mpeg`, `audio/mp3`)
  - **M4A** (`.m4a` / `audio/mp4`, `audio/x-m4a`, `audio/m4a`)
  - **AAC** (`.aac`, `.acc` / `audio/aac`, `audio/x-aac`)
  - **WAV** (`.wav` / `audio/wav`, `audio/x-wav`, `audio/wave`)
  - **OGG** (`.ogg` / `audio/ogg`, `audio/x-ogg`, `application/ogg`)
- Die Dateiauswahlfilter (`accept`-Attribut) und die client- sowie serverseitigen Validierungen akzeptieren diese Formate gleichermaßen.
- Beim Upload in den Firebase Storage wird die korrekte Dateiendung (`.mp3`, `.m4a`, `.aac`, `.wav`, `.ogg`) dynamisch beibehalten und der passende MIME-Typ als Metadatum übergeben.
- Die maximale Dateigröße bleibt unverändert bei 5 MB.
- Das Probehören, der Startzeit-Slider (inkl. 15-Sekunden-Vorschau) und der Live-Desk Torjingle-Player spielen alle diese Audioformate nahtlos ab.

---

## 2. User Stories

- **US-1**: Als **Vereinsbetreuer auf dem Smartphone (z. B. iPhone)** möchte ich **meinen Torjingle direkt als .m4a oder .aac hochladen können**, ohne die Datei vorher mühsam am PC in MP3 konvertieren zu müssen.
- **US-2**: Als **Turnierleiter im Admin-Bereich** möchte ich **Jingles in verschiedenen gängigen Audioformaten (.mp3, .m4a, .aac, .wav, .ogg) hochladen und bearbeiten können**, um maximale Flexibilität bei der Vorbereitung zu haben.
- **US-3**: Als **Turnierleiter am Live-Desk** möchte ich **dass Jingles unabhängig von ihrem Dateiformat verzögerungsfrei und fehlerfrei über den bestehenden HTML5-Player abgespielt werden**.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)
- [x] **Erweiterte Format-Unterstützung**:
  - Akzeptanz von `.mp3`, `.m4a`, `.aac` (inkl. Toleranz für `.acc`), `.wav` und `.ogg`.
  - Dateigrößenbeschränkung bleibt unverändert bei maximal 5 MB.
- [x] **Zentrale Validierungsfunktion**:
  - Bereitstellung einer gemeinsamen Hilfsfunktion zur Audio-Validierung (`isSupportedAudioFile(file: File): boolean`), um redundanten Prüfcode zu vermeiden.
- [x] **Dynamische Endung & Metadaten im Firebase Storage**:
  - Beim Upload in `teamService.ts` (`uploadTeamJingle` und `saveTeamJingleSettingsByToken`) wird die tatsächliche Endung aus `file.name` extrahiert (z. B. `jingle_${Date.now()}.${ext}`) anstelle des bisher fest kodierten `.mp3`.
  - Beim Upload wird der `contentType` über `UploadMetadata` gesetzt, um ein sauberes Streaming durch den Browser sicherzustellen.
- [x] **Anpassung der Upload-Komponenten**:
  - `TeamEditModal.tsx` (Admin): File-Input `accept` und Validierungsfehlermeldung anpassen.
  - `TeamJinglePage.tsx` (Betreuerbereich): File-Input `accept`, Hilfstexte und Validierungsfehlermeldung anpassen.
- [x] **Dokumentation**:
  - Aktualisierung von `DATABASE.md` und `ARCHITECTURE.md` bezüglich der unterstützten Jingle-Audioformate.

### 3.2 Explizit Out-of-Scope
- Server- oder clientseitige Transkodierung/Konvertierung (Browser spielen M4A/AAC/MP3/WAV/OGG nativ ab).
- Erhöhung des 5-MB-Dateilimits (5 MB ist ausreichend für Torjingle-Ausschnitte bis 15 Sekunden).

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien
- [x] **AC-1: Upload einer .m4a-Datei im Betreuerbereich**
  - **Gegeben sei**: Ein Betreuer ruft die Torjingle-Seite seines Teams auf (`/team/:token`).
  - **Wenn**: Er eine `.m4a`-Datei (<= 5 MB) auswählt,
  - **Dann**: Wird die Datei erfolgreich geladen, die Wellenform/Dauer angezeigt, die 15-Sekunden-Vorschau kann abgespielt werden und das Speichern schließt ohne Fehler ab.

- [x] **AC-2: Upload im Admin TeamEditModal**
  - **Gegeben sei**: Der Turnierleiter öffnet das Bearbeiten-Modal eines Teams unter `/admin`.
  - **Wenn**: Er eine Audiodatei im Format `.m4a`, `.aac`, `.wav`, `.ogg` oder `.mp3` auswählt,
  - **Dann**: Wird die Datei akzeptiert, der integrierte Vorschau-Player spielt sie ab und beim Speichern wird die Jingle-URL aktualisiert.

- [x] **AC-3: Ablehnung nicht unterstützter Dateiformate**
  - **Gegeben sei**: Ein Nutzer wählt eine ungültige Datei (z. B. `.txt`, `.mp4` Video, `.wma`, `.pdf`) aus.
  - **Wenn**: Die Validierung greift,
  - **Dann**: Wird der Upload abgebrochen und die Fehlermeldung informiert präzise über die erlaubten Formate (.mp3, .m4a, .aac, .wav, .ogg) bis max. 5 MB.

- [x] **AC-4: Dateinamen & Content-Type im Firebase Storage**
  - **Gegeben sei**: Eine Datei `myjingle.m4a` wird hochgeladen.
  - **Wenn**: Der Upload durchgeführt wird,
  - **Dann**: Heißt die Datei im Storage `teams/{teamId}/jingle_{timestamp}.m4a` und besitzt den Content-Type `audio/mp4` bzw. `audio/x-m4a`.

- [x] **AC-5: Abspielen im Live-Desk**
  - **Gegeben sei**: Ein Team besitzt einen `.m4a`-, `.wav`- oder `.ogg`-Jingle.
  - **Wenn**: Im Live-Desk ein Tor für dieses Team erzielt wird,
  - **Dann**: Spielt der Jingle über `useAudioPlayer` nahtlos ab und lässt sich mit Fade-Out stoppen.

### 4.2 Allgemeine Qualitätskriterien
- Keine fest kodierten Parameter.
- Vollständige TypeScript-Typisierung ohne `any`.
- Baut fehlerfrei (`npm run build`) und alle Unit-Tests laufen grün durch.

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Betroffene Ansichten & Komponenten
- `src/components/admin/TeamEditModal.tsx`:
  - `accept="audio/mp3,audio/mpeg,audio/mp4,audio/x-m4a,audio/aac,audio/wav,audio/ogg,.mp3,.m4a,.aac,.acc,.wav,.ogg"`
  - Hinweistext: „MP3, M4A, AAC, WAV oder OGG (max. 5 MB)“
- `src/pages/jingle/TeamJinglePage.tsx`:
  - `accept="audio/mp3,audio/mpeg,audio/mp4,audio/x-m4a,audio/aac,audio/wav,audio/ogg,.mp3,.m4a,.aac,.acc,.wav,.ogg"`
  - Hinweistext: „Erlaubte Formate: MP3, M4A, AAC, WAV oder OGG bis max. 5 MB“

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Services & Hilfsfunktionen
- In `src/services/teamService.ts`:
  ```typescript
  export const SUPPORTED_AUDIO_EXTENSIONS = ["mp3", "m4a", "aac", "acc", "wav", "ogg"] as const
  export const SUPPORTED_AUDIO_MIME_TYPES = [
    "audio/mpeg",
    "audio/mp3",
    "audio/mp4",
    "audio/x-m4a",
    "audio/m4a",
    "audio/aac",
    "audio/x-aac",
    "audio/wav",
    "audio/x-wav",
    "audio/wave",
    "audio/ogg",
    "audio/x-ogg",
    "application/ogg",
  ]
  ```
- Storage-Referenz:
  ```typescript
  const ext = getAudioExtension(file.name)
  const storageRef = ref(storage, `teams/${teamId}/jingle_${Date.now()}.${ext}`)
  await uploadBytes(storageRef, file, { contentType: file.type || `audio/${ext}` })
  ```

---

## 7. Test- & Verifikationsplan

- [x] Unit-Tests in `tests/spec052AudioFormate.test.ts`:
  - Test der Audio-Validierungsfunktion mit gültigen Endungen (`.mp3`, `.m4a`, `.aac`, `.acc`, `.wav`, `.ogg`) und MIME-Typen.
  - Test der Ablehnung ungültiger Formate (`.exe`, `.pdf`, `.wma`).
  - Test der Größenbeschränkung (Dateien > 5 MB werden abgelehnt).
  - Test des dynamischen Dateinamens und Content-Type im Storage-Mock.
- [x] End-to-End Build-Prüfung (`npm run build`).

---

## 8. Freigabe & Historie

| Phase | Datum | Freigegeben durch | Status / Anmerkungen |
| :--- | :--- | :--- | :--- |
| **Spezifikation (1. Gate)** | 2026-10-20 | Nutzer | APPROVED |
| **Abnahme (2. Gate)** | 2026-10-20 | Nutzer | MERGE |
