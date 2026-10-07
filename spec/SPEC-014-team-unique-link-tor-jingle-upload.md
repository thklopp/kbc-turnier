# SPEC-014: Unique-Links für Teams zum eigenständigen Tor-Jingle Upload & Startzeit-Konfiguration

> **Status**: In Abnahme  
> **Typ**: Feature  
> **Branch**: `feat/SPEC-014-team-unique-link-tor-jingle-upload`  
> **Autor**: Agent / Antigravity (nach /grill-me Abstimmung mit Nutzer)  
> **Erstellt am**: 2026-10-07  
> **Letzte Änderung**: 2026-10-07  
> **Betroffene Bereiche**: Jingle-Upload-Ansicht (`/jingle/:token`) | Turnierleitung (`/admin`) | Datenbank/Firestore | Audio/Storage  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Bislang können Tor-Jingles und deren Startzeitpunkt nur von der Turnierleitung manuell über das Admin-Panel (`/admin` -> Teams -> Bearbeiten) hochgeladen und konfiguriert werden. Bei 16 Mannschaften bedeutet dies einen erheblichen organisatorischen Aufwand vor und während des Turniers (Dateien per E-Mail/WhatsApp einsammeln, manuell hochladen, Wunsch-Startzeiten absprechen). Mannschaften bzw. Betreuer haben keinen Zugang zum geschützten Admin-Bereich und sollen auch keine Benutzerkonten anlegen müssen.

### 1.2 Zielzustand & Mehrwert
- Jedes Team erhält einen kryptografisch sicheren, eindeutigen Link (z. B. `https://<domain>/jingle/<secret-token>`).
- Betreuer können über diesen Link auf dem Smartphone oder Desktop ohne Login ihren Vereins-Torjingle (MP3, max. 5 MB) hochladen.
- Betreuer können die Startzeit in Millisekunden exakt festlegen (mittels Zeitleiste/Slider, direktem Millisekunden-Feld und einem Button „Aktuelle Position als Startzeit übernehmen“).
- Ein Test-Play-Button ermöglicht das direkte Vorhören ab der gewählten Startzeit (mit automatischem Stopp nach maximal 15 Sekunden).
- **Sicherheits- & Abbruch-Logik**: Änderungen und neue Audio-Dateien werden zunächst rein lokal im Browser (Blob-URL) vorgehört. Erst beim Klick auf „Speichern“ erfolgt der Upload in Firebase Storage und das Update in Firestore. Bei „Abbrechen“ oder Verlassen des Browsers bleibt der bisherige Zustand vollständig erhalten und es entsteht kein Speicher- oder Dateimüll.
- Die Turnierleitung kann im Admin-Bereich:
  - Links pro Team mit einem Klick kopieren.
  - Eine Sammelübersicht aller 16 Team-Links mit aktuellem Upload-Status (vorhanden ja/nein, Änderungsdatum) einsehen und exportieren/teilen.
  - Bei Bedarf Token neu generieren (Invalidierung alter Links).
  - Anhand visueller Indikatoren (Badges) sofort erkennen, welche Teams ihren Jingle aktualisiert haben.

---

## 2. User Stories

- **US-1**: Als **Betreuer/Trainer** möchte ich über einen eindeutigen Link ohne vorherigen Login eine MP3-Datei für mein Team hochladen und vorhören können, damit ich unseren Tor-Jingle selbstständig und unkompliziert bereitstellen kann.
- **US-2**: Als **Betreuer/Trainer** möchte ich die exakte Startzeit (in ms) bestimmen und abspielen können, damit der Jingle beim Torjubel direkt an der besten Stelle des Songs startet.
- **US-3**: Als **Betreuer/Trainer** möchte ich das Vorhören jederzeit abbrechen oder verwerfen können, ohne dass unfertige Dateien gespeichert oder alte Jingles überschrieben werden.
- **US-4**: Als **Turnierleiter** möchte ich in der Admin-Übersicht für jedes Team den Upload-Link kopieren und eine Gesamtübersicht aller Links und Upload-Stati sehen, um den Status vor dem Turnier im Blick zu behalten und fehlende Teams anzuschreiben.
- **US-5**: Als **Turnierleiter** möchte ich sofort sehen, wenn ein Team seinen Jingle aktualisiert hat, und den Jingle direkt in der Turnierleitung testen können.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)
- [ ] **Token-Generierung & Datenmodell**:
  - Jedes Team besitzt ein Feld `jingleToken` (kryptografisch zufälliger String, z. B. UUID v4 oder nanoid) sowie `jingleUpdatedAt` (Timestamp).
  - Existierende Teams erhalten bei Bedarf automatisch einen initialen Token.
- [ ] **Upload-Webseite für Teams (`/jingle/:token`)**:
  - Eigenständige, mobil-optimierte Ansicht im KBC-Design (ohne Admin-Navigation, ohne Login).
  - Anzeige des Teamnamens, Wappens und Altersklasse (mU14 / wU14).
  - Drag & Drop oder Datei-Auswahl für MP3 (max. 5 MB, Format-Validierung).
  - Anzeige des aktuellen Jingles (falls bereits vorhanden) mit Abspielmöglichkeit.
  - Client-seitige Vorschau neuer Dateien via `URL.createObjectURL` ohne vorzeitigen Upload.
  - Startzeit-Steuerung:
    - Numerisches Eingabefeld (Millisekunden).
    - Interaktiver Zeitleisten-Slider (Sekunden & Millisekunden).
    - Button: „Aktuelle Abspielposition als Startzeit übernehmen“.
  - Test-Play-Button: Spielt die Audiodatei ab der konfigurierten Startzeit ab und stoppt automatisch nach **15 Sekunden**.
  - Aktionen:
    - „Speichern & Übernehmen“: Upload nach Firebase Storage (`teams/{teamId}/jingle.mp3`), Update des Team-Dokuments in Firestore, Erfolgsmeldung.
    - „Abbrechen / Zurücksetzen“: Verwirft die lokale Dateiauswahl und setzt alle Felder auf den zuletzt gespeicherten Stand zurück.
    - Optional: „Jingle löschen“ (falls ein Team den Jingle entfernen möchte).
- [ ] **Turnierleitung / Admin-Bereich (`/admin`)**:
  - Direkter Button „Jingle-Link kopieren“ an jeder Team-Karte in `TeamList` und im `TeamEditModal`.
  - Button „Token neu generieren“ (inkl. Sicherheitsabfrage), falls ein Link ungültig gemacht werden soll.
  - Dialog / Sheet „Jingle-Übersicht aller Teams“:
    - Tabelle aller 16 Teams mit Spalten: Team, Status (Jingle vorhanden / fehlt), Startzeit, Zuletzt aktualisiert, Link kopieren.
    - Button „Alle Links kopieren“ (für E-Mail/WhatsApp-Rundschreiben).
  - Visueller Statusindikator (z. B. Badge „Jingle aktualisiert“ oder Datums-Badge) in der Team-Karte.
- [ ] **Sicherheit & Berechtigungen**:
  - Im Hintergrund: Transparente Firebase Anonymous Authentication für Besucher der `/jingle/:token`-Seite (kein Login-Prompt für den Nutzer).
  - Firestore Security Rules: Anonyme Nutzer dürfen `teams/{teamId}` nur aktualisieren, wenn `request.resource.data.jingleToken == resource.data.jingleToken` und ausschließlich die Felder `jingleUrl`, `jingleStartTimeMs` und `jingleUpdatedAt` modifiziert werden.
  - Firebase Storage Rules: Upload nach `teams/{teamId}/jingle.mp3` für anonyme Nutzer erlaubt (max. 5 MB, Typ `audio/mpeg`).

### 3.2 Explizit Out-of-Scope
- Kein Passwort-/PIN-System (die Authentifizierung erfolgt exklusiv über den geheimen Token in der URL).
- Keine Bearbeitung von Teamnamen, Gruppen oder Wappen durch Betreuer (nur Jingle & Startzeit).
- Kein Audio-Transcoding im Backend (Dateiformat muss bereits MP3 sein).
- Keine E-Mail-Versand-Integration direkt aus der App (Links werden von der Turnierleitung kopiert und über bestehende Kanäle verteilt).

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien
- [ ] **AC-1: Zugriff über Secret-Token**
  - **Gegeben sei**: Ein Betreuer öffnet `https://<host>/jingle/<valid-token>`.
  - **Wenn**: Der Token mit einem Team übereinstimmt.
  - **Dann**: Wird die Team-Jingle-Seite mit Teamname, Wappen und aktuellem Jingle-Status angezeigt.
  - **Wenn**: Der Token ungültig ist oder nicht existiert.
  - **Dann**: Wird eine verständliche Fehlermeldung angezeigt („Ungültiger oder abgelaufener Link. Bitte wende dich an die Turnierleitung.“).

- [ ] **AC-2: Datei-Auswahl & lokale Vorschau ohne Cloud-Upload**
  - **Gegeben sei**: Die Betreuer-Seite ist geöffnet.
  - **Wenn**: Der Betreuer eine MP3-Datei (z. B. 3 MB) auswählt.
  - **Dann**: Wird die Datei sofort als Blob geladen; es findet noch KEIN Netzwerk-Upload zu Firebase Storage statt.
  - **Wenn**: Der Betreuer auf „Abbrechen“ klickt oder die Seite schließt.
  - **Dann**: Wurde zu keinem Zeitpunkt eine Datei in Storage gespeichert und das Firestore-Teamdokument bleibt unverändert.

- [ ] **AC-3: Startzeit-Einstellung & 15-Sekunden Auto-Stopp**
  - **Gegeben sei**: Eine Audiodatei (existierend oder neu gewählt) ist geladen.
  - **Wenn**: Der Betreuer die Startzeit auf `4500` ms ändert (per Slider oder Zahleneingabe) und „Test abspielen“ klickt.
  - **Dann**: Startet die Wiedergabe exakt bei Sekunde 4,5 (4500 ms) und stoppt nach 15 Sekunden automatisch.

- [ ] **AC-4: Speichern & Übernahme**
  - **Gegeben sei**: Eine neue MP3 und eine Startzeit von `5000` ms sind gewählt.
  - **Wenn**: Der Betreuer auf „Speichern“ klickt.
  - **Dann**: Wird die MP3 zu Firebase Storage hochgeladen, die Felder `jingleUrl`, `jingleStartTimeMs` und `jingleUpdatedAt` in Firestore gespeichert und eine Erfolgsbestätigung angezeigt.
  - **Und**: In der Turnierleitung (`/admin`) ist der neue Jingle in Echtzeit sofort abspielbar.

- [ ] **AC-5: Admin-Links & Sammelübersicht**
  - **Gegeben sei**: Der Turnierleiter ist im Admin-Bereich unter Teams.
  - **Wenn**: Er auf „Link kopieren“ klickt.
  - **Dann**: Befindet sich der vollständige Link `https://<host>/jingle/<token>` in der Zwischenablage.
  - **Wenn**: Er die „Jingle-Statusübersicht“ öffnet.
  - **Dann**: Sieht er alle 16 Teams, deren Upload-Status, Aktualisierungszeitpunkt und kann einzelne oder alle Links kopieren.

- [ ] **AC-6: Token-Neu-Generierung**
  - **Gegeben sei**: Ein Link wurde versehentlich falsch geteilt.
  - **Wenn**: Der Turnierleiter auf „Link neu generieren“ klickt und bestätigt.
  - **Dann**: Wird ein neuer Token gespeichert, der alte Link ist sofort ungültig.

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Betroffene Ansichten & Komponenten
- **Neue Route**: `/jingle/:token` (`src/pages/jingle/TeamJinglePage.tsx`)
  - Standalone-Layout (ohne Admin-Sidebar, responsiv für Mobile/Desktop, KBC-Branding).
  - Formular mit File-Dropzone, Audio-Player mit Wave/Slider-Fortschrittsbalken, ms-Input, Play/Pause-Button, Speichern- und Abbrechen-Buttons.
- **Admin-Bereich**:
  - `TeamCard.tsx`: Icon-Button zum Kopieren des Jingle-Links + Status-Badge (z. B. grünes Häkchen oder gelber Punkt).
  - `TeamList.tsx`: Neuer Button in der Aktionsleiste „Jingle-Links & Status“.
  - Neuer Dialog: `TeamJingleOverviewModal.tsx` mit tabellarischer Übersicht aller 16 Teams und Link-Kopier-Funktionen.
  - `TeamEditModal.tsx`: Link-Kopieren und „Token neu generieren“-Button integriert.

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Datenmodell (`DATABASE.md`)
Erweiterung des `Team`-Interfaces:
```typescript
export interface Team {
  // ... bestehende Felder ...
  jingleToken?: string;              // Eindeutiger Secret-Token für den Betreuer-Upload
  jingleUpdatedAt?: FirebaseFirestore.Timestamp | null; // Zeitstempel des letzten Jingle-Uploads
}
```

### 6.2 Services & Logik
- `teamService.ts`:
  - `getTeamByJingleToken(token: string): Promise<Team | null>`
  - `saveTeamJingleByToken(token: string, file: File | null, startTimeMs: number): Promise<void>`
  - `regenerateTeamJingleToken(teamId: string): Promise<string>`
  - `subscribeTeams` liefert automatisch `jingleToken` und `jingleUpdatedAt`.
- `lib/firebase.ts` / Auth:
  - Hilfsfunktion `ensureAnonymousAuth()` für die Betreuer-Upload-Route.

---

## 7. Edge Cases & Fehlerbehandlung
- **Datei > 5 MB oder kein MP3**: Direkte clientseitige Validierung mit deutlichem Fehlereinblenden vor dem Hochladen.
- **Abbruch durch Schließen des Tabs**: Keine Auswirkung, vorheriger Stand bleibt 100% erhalten.
- **Ungültiger Token**: 404 / Token-Ungültig-Screen mit Hinweis auf Kontaktaufnahme zur Turnierleitung.
- **Netzwerkfehler während des Uploads**: Fehlermeldung mit „Erneut versuchen“-Möglichkeit; die Datenbank wird erst bei erfolgreichem Storage-Upload aktualisiert.

---

## 8. Verifikations- & Testplan
1. [ ] TypeScript Type-Check & `npm run build` fehlerfrei.
2. [ ] Aufruf von `/jingle/ungueltiger-token` zeigt Fehlermeldung.
3. [ ] Aufruf von `/jingle/<valid-token>` zeigt korrektes Team.
4. [ ] MP3 auswählen -> Vorhören ab 4500 ms -> Stoppt nach 15s.
5. [ ] Klick auf „Abbrechen“ -> Audio-Auswahl zurückgesetzt, keine Änderung in Firestore.
6. [ ] Klick auf „Speichern“ -> Erfolgreich gespeichert, Status in Admin-Übersicht aktualisiert sich in Echtzeit.
7. [ ] Link kopieren und Token neu generieren in Admin-Übersicht verifizieren.
