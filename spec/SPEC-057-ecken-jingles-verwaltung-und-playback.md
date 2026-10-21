# SPEC-057: Ecken-Jingles Verwaltung und Live-Desk Playback

> **Status**: In Abnahme  
> **Typ**: Feature  
> **Branch**: feat/SPEC-057-ecken-jingles  
> **Autor**: Antigravity  
> **Erstellt am**: 2026-10-21  
> **Letzte Änderung**: 2026-10-21  
> **Betroffene Bereiche**: Turnierleitung (/admin) | Datenbank/Firestore | Audio/Storage  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Im Hallenhockey führen Strafecken (kurze Ecken) zu spannenden und dynamischen Spielunterbrechungen. In der Turnierleitung existiert auf dem Live-Desk (`ScoreboardDisplay.tsx`) bereits ein visueller Platzhalter-Button für den „Ecken-Jingle“ zwischen den beiden Tor-Buttons. Aktuell besitzt dieser Button jedoch weder eine hinterlegte Spiellogik noch gibt es im Adminbereich eine Möglichkeit, Audio-Jingles für Strafecken einzupflegen. Im Unterschied zu Tor-Jingles sind Ecken-Jingles nicht teamspezifisch, sondern allgemeine Hallen-Jingles des Turniers.

### 1.2 Zielzustand & Mehrwert
1. **Verwaltung im Admin-Bereich**: Ein neuer Administrations-Tab **„Ecken-Jingles“** (`/admin#corners`) ermöglicht das Hochladen, Benennen, Vorhören, Konfigurieren von Startzeitpunkten, Löschen und Festlegen eines Standard-Jingles.
2. **Dateivorgaben analog Tor-Jingles**: Maximale Dateigröße 5 MB, Unterstützung aller etablierten Audioformate (`.mp3`, `.m4a`, `.aac`, `.acc`, `.wav`, `.ogg`), individuelle Startzeit in Millisekunden.
3. **Live-Desk Integration**:
   - Der Ecken-Jingle-Button auf dem Live-Desk spielt den aktuell ausgewählten Ecken-Jingle für maximal 15 Sekunden ab (sanftes 1-Sekunden-Ausfaden ab Sekunde 14).
   - Bei erneutem Klick während des Abspielens fadet der Jingle sofort innerhalb von 1 Sekunde sanft aus.
   - Ein Split-Button bzw. Zahnrad-/Auswahl-Trigger am Button öffnet ein Menü/Popover zur schnellen Auswahl eines anderen Ecken-Jingles während des laufenden Spielbetriebs.
   - Falls keine Jingles hinterlegt sind, ist der Button deaktiviert mit dem Hinweis „Keine Ecken-Jingles hinterlegt“.

---

## 2. User Stories

- **US-1**: Als **Turnierleiter** möchte ich im Admin-Bereich in einem eigenen Tab mehrere Ecken-Jingles mit kurzem Namen, Startzeitpunkt und Audiodatei hochladen, um für das Turnier eine abwechslungsreiche Musikauswahl für Strafecken bereitzustellen.
- **US-2**: Als **Turnierleiter** möchte ich einen Ecken-Jingle als Standard-Jingle definieren können, damit auf dem Live-Desk automatisch ein voreingestellter Jingle spielbereit ist.
- **US-3**: Als **Turnierleiter am Live-Desk** möchte ich bei Pfiff einer Strafecke auf den Ecken-Jingle-Button drücken, damit die Musik sofort ab der konfigurierten Startzeit bis maximal 15 Sekunden eingespielt wird.
- **US-4**: Als **Turnierleiter am Live-Desk** möchte ich durch erneuten Klick auf den Button den Jingle vorzeitig ausblenden können (Fade-Out), sobald die Ecke ausgeführt wird oder das Spiel weitergeht.
- **US-5**: Als **Turnierleiter am Live-Desk** möchte ich über ein Popover/Menü direkt am Button schnell zwischen den verfügbaren Ecken-Jingles wechseln können.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)
- [x] **Admin-Tab „Ecken-Jingles“**: Neuer Navigationspunkt im `AdminLayout` (`/admin#corners`) und entsprechende Einbindung in `AdminPage`.
- [x] **Firestore Collection `cornerJingles`**:
  - `id`: string (eindeutige Dokumenten-ID)
  - `name`: string (kurzer Name, z. B. „Techno Horn“, „Seven Nation Army“)
  - `audioUrl`: string (Firebase Storage Download-URL)
  - `storagePath`: string (Pfad in Firebase Storage zum sauberen Löschen)
  - `startTimeMs`: number (Startzeit in Millisekunden, Default 0)
  - `isDefault`: boolean (ob dieser Jingle als Standard vorgewählt ist)
  - `createdAt`: Timestamp
  - `updatedAt`: Timestamp
- [x] **Firebase Storage Upload**: Speicherung unter `/teams/corners/{jingleId}.{ext}` mit Validierung auf max. 5 MB und Audio-MIME-Types (kompatibel mit den bestehenden Storage-Rules für `/teams/{teamId}/**`).
- [x] **Admin-UI zur Verwaltung**:
  - Übersichtliche Karten/Liste aller hinterlegten Ecken-Jingles mit Name, Startzeit, Format/Badge, Standard-Indikator.
  - Vorhör-Player (Play/Pause/Fade) für jeden Jingle.
  - Dialog/Modal zum Anlegen und Bearbeiten eines Ecken-Jingles (inkl. Upload-Zone, Startzeit-Slider und Probehören).
  - Aktion zum Markieren als Standard-Jingle (stellt sicher, dass immer nur genau ein Jingle `isDefault = true` besitzt).
  - Löschen eines Jingles (inkl. Entfernung aus Storage und Firestore).
- [x] **Live-Desk Integration (`ScoreboardDisplay.tsx` & `useLiveMatchDesk.ts`)**:
  - Mittiger Button exakt auf Höhe der Tor-Buttons.
  - Split-Button bzw. Zahnrad-Icon zur Schnellauswahl aus der Liste aller Ecken-Jingles.
  - Anzeige des aktuellen Jingle-Namens.
  - Deaktiviert (disabled) mit Tooltip, falls noch kein Jingle vorhanden ist.
  - Abspielen mit Startzeit-Offset.
  - Automatisches Ausfaden: Nach 14 Sekunden startet ein 1-Sekunden-Fade-Out (Gesamtdauer max. 15 Sekunden).
  - Manuelles Ausfaden: Erneuter Klick während der Wiedergabe blendet sofort innerhalb 1 Sekunde aus.

### 3.2 Explizit Out-of-Scope (Nicht Teil dieser Spec)
- Speicherung von Strafecken als Match-Statistik oder Event in `match.events` (reiner Audio-Trigger zur Hallenunterhaltung).
- Teamspezifische Ecken-Jingles (Ecken-Jingles sind turnierweit neutral).
- Betreuerbereich-Upload für Ecken-Jingles (nur im geschützten Adminbereich zugänglich).

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien

- [x] **AC-1: Admin-Tab und Navigation**
  - **Gegeben sei**: Ein angemeldeter Administrator befindet sich auf `/admin`.
  - **Wenn**: Der Tab „Ecken-Jingles“ (`/admin#corners`) angeklickt wird,
  - **Dann**: Wechselt die Ansicht zur Übersicht der Ecken-Jingles mit Zähler und Button „Ecken-Jingle hinzufügen“.

- [x] **AC-2: Ecken-Jingle anlegen mit Validierung**
  - **Gegeben sei**: Das Modal „Ecken-Jingle hinzufügen“ ist geöffnet.
  - **Wenn**: Eine Audiodatei > 5 MB oder ein nicht unterstütztes Dateiformat ausgewählt wird,
  - **Dann**: Erscheint eine sprechende Fehlermeldung und der Upload wird blockiert.
  - **Wenn**: Eine gültige Audiodatei (`.mp3`, `.m4a`, `.aac`, `.wav`, `.ogg`), ein Name und eine optionale Startzeit eingetragen werden,
  - **Dann**: Wird die Datei nach Firebase Storage hochgeladen, in Firestore gespeichert und erscheint in der Liste.

- [x] **AC-3: Standard-Jingle Definition**
  - **Gegeben sei**: Es sind mehrere Ecken-Jingles hinterlegt.
  - **Wenn**: Ein Jingle als Standard markiert wird (im Dialog oder per Schnellaktion in der Liste),
  - **Dann**: Erhält dieser das Badge „Standard“ und der bisherige Standard-Jingle verliert diesen Status.

- [x] **AC-4: Vorhören im Admin-Bereich**
  - **Gegeben sei**: Die Liste der Ecken-Jingles oder der Bearbeitungsdialog ist geöffnet.
  - **Wenn**: Auf den Play-Button geklickt wird,
  - **Dann**: Startet die Wiedergabe an der konfigurierten Startzeit `startTimeMs`. Ein erneuter Klick fadet die Wiedergabe sanft aus.

- [x] **AC-5: Ecken-Jingle Playback auf dem Live-Desk mit 15-Sekunden-Limit**
  - **Gegeben sei**: Mindestens ein Ecken-Jingle ist vorhanden und das Spiel läuft oder ist pausiert.
  - **Wenn**: Der Turnierleiter auf den Ecken-Jingle-Button klickt,
  - **Dann**: Startet die Wiedergabe des aktuell gewählten Jingles ab `startTimeMs`.
  - **Wenn**: Keine weitere Aktion erfolgt,
  - **Dann**: Beginnt nach exakt 14 Sekunden ein 1-Sekunden-Fade-Out, sodass die Musik nach maximal 15 Sekunden verstummt.
  - **Wenn**: Während des Abspielens vor Ablauf der 15 Sekunden erneut auf den Button geklickt wird,
  - **Dann**: Fadet der Jingle sofort innerhalb 1 Sekunde sanft aus.

- [x] **AC-6: Schnellauswahl auf dem Live-Desk**
  - **Gegeben sei**: Mehrere Ecken-Jingles sind hinterlegt.
  - **Wenn**: Der Turnierleiter auf das Zahnrad-/Dropdown-Icon neben dem Ecken-Jingle-Button klickt,
  - **Dann**: Öffnet sich ein Menü mit allen verfügbaren Ecken-Jingles (inkl. Hervorhebung des aktiven).
  - **Wenn**: Ein anderer Jingle ausgewählt wird,
  - **Dann**: Wechselt der aktive Jingle für die Live-Desk Session sofort und wird beim nächsten Klick abgespielt.

- [x] **AC-7: Fallback bei leeren Ecken-Jingles**
  - **Gegeben sei**: In der Datenbank sind noch keine Ecken-Jingles hinterlegt.
  - **Wenn**: Der Live-Desk geöffnet wird,
  - **Dann**: Ist der Ecken-Jingle-Button deaktiviert (`disabled`) und zeigt per Hover/Tooltip „Keine Ecken-Jingles hinterlegt“.

### 4.2 Allgemeine Qualitätskriterien
- [x] Keine fest kodierten Grenzwerte oder URLs gemäß `AGENTS.md`.
- [x] 100 % TypeScript-Typisierung ohne `any`.
- [x] Firestore-Listener mit sauberem `unsubscribe()`.
- [x] Erfolgreicher Build ohne Fehler (`npm run build`).

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Betroffene Ansichten & Komponenten
- `src/components/layouts/AdminLayout.tsx`: Ergänzung des Sub-Navigationstabs `Ecken-Jingles` mit passendem Icon (`Music` oder `Disc3`).
- `src/pages/admin/AdminPage.tsx`: Verzweigung bei `activeTab === "corners"`.
- `src/components/admin/corners/CornerJingleManager.tsx`: Hauptkomponente für die Listenansicht, Statistiken (Anzahl Jingles) und Aktionen.
- `src/components/admin/corners/CornerJingleModal.tsx`: Dialog zum Hinzufügen und Bearbeiten (Name, Audio-Upload, Startzeit-Slider, Vorhören, Standard-Toggle).
- `src/components/admin/live/ScoreboardDisplay.tsx`: Ersetzen des Platzhalters durch den interaktiven Ecken-Jingle Split-Button mit Dropdown/Popover.

### 5.2 Interaktionsablauf Live-Desk
```
[ Strafecke gepfiffen ]
        │
        ▼
[ Klick auf Ecken-Jingle ] ──(Spielt bereits?)──► Ja ──► [ 1-Sekunden Fade-Out ] ──► [ Stop ]
        │
       Nein
        ▼
[ Audio-Playback startet bei startTimeMs ]
        │
        ├──(Vor 14s erneut geklickt?)──► Ja ──► [ 1-Sekunden Fade-Out ]
        │
        └──(Nach 14s) ──► [ Automatischer 1s Fade-Out ] ──► [ Stop bei 15s ]
```

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Datenmodell (`DATABASE.md`)
Neue Collection `cornerJingles`:
```typescript
export interface CornerJingle {
  id: string;
  name: string;
  audioUrl: string;
  storagePath: string;
  startTimeMs: number;
  isDefault: boolean;
  fileSize?: number;
  mimeType?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 6.2 Firebase Storage
- Speicherpfad: `/corner_jingles/{jingleId}.{ext}`
- Max. 5 MB, MIME-Typen: `audio/mpeg`, `audio/mp4`, `audio/aac`, `audio/wav`, `audio/ogg`, etc.

### 6.3 Services & Hooks
- `src/services/cornerJingleService.ts`:
  - `subscribeCornerJingles(onNext, onError)`
  - `addCornerJingle(name, file, startTimeMs, isDefault)`
  - `updateCornerJingle(id, updates, newFile?)`
  - `deleteCornerJingle(id, storagePath)`
  - `setDefaultCornerJingle(id)`
- `src/hooks/useLiveMatchDesk.ts` / `src/hooks/useAudioPlayer.ts`:
  - Unterstützung für Timer-gestütztes automatisches Ausfaden nach 14 Sekunden (Max-Limit 15 Sekunden).
