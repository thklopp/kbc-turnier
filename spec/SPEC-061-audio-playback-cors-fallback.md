# SPEC-061: Ausfallsicheres Audio-Playback mit CORS-Fallback & Ecken-Jingle Gain-Sync

> **Status**: In Review  
> **Typ**: Bugfix  
> **Branch**: fix/SPEC-061-audio-playback-cors-fallback  
> **Autor**: Antigravity  
> **Erstellt am**: 2026-10-22  
> **Letzte Änderung**: 2026-10-22  
> **Betroffene Bereiche**: Audio/Storage | Turnierleitung (/admin) | Gast-/Team-Ansicht (/team/:token) | Datenbank/Firestore  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Im Rahmen von SPEC-060 wurde eine Audio-Pegel-Normalisierung und ein Broadcast-Limiter (`DynamicsCompressorNode`) via Web Audio API in `useAudioPlayer` eingeführt. Dabei wurde das zentrale `HTMLAudioElement` fest mit `audio.crossOrigin = "anonymous"` initialisiert und an einen `MediaElementAudioSourceNode` gekoppelt.

Dies führt zu folgendem kritischen Fehler:
1. **Funktioniert im Dialog**: Beim Auswählen einer Audiodatei im Upload-Dialog (`CornerJingleModal`, `TeamEditModal`, `TeamJinglePage`) wird eine lokale `blob:`-URL (`URL.createObjectURL(file)`) erzeugt. Diese ist Same-Origin, wodurch Web Audio und Vorhören einwandfrei funktionieren.
2. **Totalausfall nach dem Speichern**: Sobald der Jingle gespeichert wird, liegt die Datei auf Firebase Storage (`https://firebasestorage.googleapis.com/...`) oder im Mock-Modus als `data:`-URL vor.
   - Firebase Storage Buckets senden standardmäßig **keine** `Access-Control-Allow-Origin`-Header, sofern nicht manuell eine Google Cloud Storage CORS-Konfiguration eingespielt wurde.
   - `data:`-URLs können browserbedingt niemals CORS-Header liefern und schlagen bei gesetztem `crossOrigin = "anonymous"` sofort mit einem CORS-Sicherheitsfehler fehl.
   - Gemäß W3C Web Audio API Spezifikation schlägt entweder das Laden der Ressource mit einem Fehler fehl (`audio.onerror`), oder die Web Audio Engine mutet die Ausgabe aus Sicherheitsgründen auf absolute Stille (Zero-Sample-Output bei Tainted Media).
3. **Ergebnis**: Nach dem Klick auf „Speichern“ ertönt weder in der Ecken-Jingle-Verwaltung (`/admin#corners`), noch auf dem Live-Desk (`ScoreboardDisplay`), noch in der Team-Ansicht ein Ton („nirgends ein Jingle abgespielt“).
4. **Zusatzbefund**: In `src/services/cornerJingleService.ts` wurde das Feld `gain` bei `subscribeCornerJingles` nicht aus dem Firestore-Dokument gemappt, wodurch `jingle.gain` nach dem Neuladen stets `undefined` war.

### 1.2 Zielzustand & Mehrwert
- **Zero-Failure-Garantie für Hallen-Audio**: Das Abspielen von Tor- und Ecken-Jingles muss unter allen Umständen garantiert sein – unabhängig davon, ob CORS-Header auf dem Storage-Bucket existieren oder ob offline/Mock mit Data-URLs gearbeitet wird.
- **Transparenter Fallback auf native HTML5-Audio-Wiedergabe**:
  - `useAudioPlayer` trennt die Audiowiedergabe sauber ab: Scheitert die Web Audio Verbindung oder wird ein CORS-/Ladefehler gemeldet, wechselt der Player sofort und unbemerkt auf ein direktes `HTMLAudioElement` ohne `crossOrigin`.
  - Direct Audio benötigt keine CORS-Header und kann beliebige Audio-URLs zuverlässig wiedergeben.
  - Lautstärkedämpfung und Normalisierung (`gain <= 1.0`) wird auch im Direktmodus über `audio.volume` sichergestellt.
  - Fade-In, Fade-Out (1s) und das automatische 15-Sekunden-Limit am Live-Desk bleiben in beiden Modi vollständig erhalten.
- **CORS-Konfigurationsdatei für Firebase Storage**: Bereitstellung von `cors.json` im Repository sowie Dokumentation für Administratoren zur optionalen Aktivierung von CORS auf dem GCS-Bucket.
- **Firestore Mapping Sync**: `gain` wird in `cornerJingleService.ts` beim Abonnieren und Anlegen von Ecken-Jingles lückenlos übernommen.

---

## 2. User Stories

- **US-1**: Als **Turnierleiter** möchte ich nach dem Anlegen oder Bearbeiten eines Ecken-Jingles diesen sofort in der Ecken-Jingle-Liste vorhören und am Live-Desk abspielen können, ohne dass fehlende CORS-Header die Audioausgabe blockieren.
- **US-2**: Als **Turnierleiter am Live-Desk** möchte ich mich darauf verlassen können, dass beim Klick auf den Ecken-Jingle-Button oder Tor-Button die Musik zuverlässig über die Hallenlautsprecher ertönt und nach max. 15 Sekunden bzw. bei erneutem Klick sanft ausfadet.
- **US-3**: Als **Team-Betreuer** möchte ich nach dem Upload meines Torjingles auf der Betreuerseite sicher sein, dass der gespeicherte Jingle sowohl im Browser als auch in der Halle zuverlässig hörbar ist.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)
- [ ] **Robuster Dual-Mode Audio-Player in `src/hooks/useAudioPlayer.ts`**:
  - Unterstützung für Direkt-Wiedergabe via nativem `HTMLAudioElement` ohne `crossOrigin`-Zwang.
  - Unterstützung für Web-Audio-Kette (`GainNode` + `DynamicsCompressorNode`) für Same-Origin-Quellen (z. B. `blob:`) oder wenn CORS verfügbar ist.
  - Sofortiger, fehlerfreier Fallback: Wenn `audio.onerror` feuert (CORS-Blockade) oder die URL eine `data:`-URL ist, wird das Audio direkt über ein ungebundenes HTML-Audioelement abgespielt.
  - Keine Stummschaltung (keine Stille durch MediaElementAudioSourceNode-Tainting).
  - Volle Unterstützung von `startTimeMs`, `maxDurationMs`, `fadeOutDurationMs`, `seek`, `play`, `stop` und `fadeOut`.
  - Lautstärkesteuerung im Fallback-Modus über `audio.volume = Math.max(0, Math.min(1.0, options?.gain ?? 1.0))`.
- [ ] **Korrektur `src/services/cornerJingleService.ts`**:
  - Einbindung von `gain: typeof data.gain === "number" ? data.gain : 1.0` in `subscribeCornerJingles`.
  - Rückgabe von `gain` im Resultat von `createCornerJingle`.
- [ ] **Firebase Storage CORS Template**:
  - Bereitstellung einer `cors.json` im Projekt-Root zur einfachen Konfiguration via `gsutil` / Google Cloud SDK.
  - Dokumentation des Befehls in `TEST_ENVIRONMENT.md` bzw. `README.md`.

### 3.2 Explizit Out-of-Scope (Nicht Teil dieser Spec)
- Änderung der UI-Komponenten oder des visuellen Layouts von `CornerJingleManager`, `ScoreboardDisplay` oder `CornerJingleModal`.
- Serverseitiges Audio-Transcoding oder Cloud Functions.

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien

- [ ] **AC-1: Ecken-Jingle Wiedergabe nach dem Speichern (Admin)**
  - **Gegeben sei**: Ein Administrator lädt im `CornerJingleModal` eine MP3-Datei hoch, testet sie erfolgreich und klickt auf „Speichern“.
  - **Wenn**: Der Dialog geschlossen ist und der Play-Button des gespeicherten Jingles in `CornerJingleManager` geklickt wird,
  - **Dann**: Ertönt die Audiodatei sofort ab dem konfigurierten Startzeitpunkt, ohne Fehlermeldung oder CORS-Abbruch.

- [ ] **AC-2: Ecken-Jingle am Live-Desk abspielen**
  - **Gegeben sei**: Mindestens ein Ecken-Jingle ist in Firestore gespeichert und als Standard aktiv.
  - **Wenn**: Der Turnierleiter auf dem Live-Desk (`/admin#live`) auf den Button „Ecke: [Name]“ klickt,
  - **Dann**: Spielt der Jingle sofort ab.
  - **Wenn**: Nach 14 Sekunden keine Aktion erfolgt, fadet der Jingle innerhalb 1 Sekunde aus und stoppt nach 15 Sekunden.
  - **Wenn**: Während des Spielens erneut geklickt wird, fadet er sofort innerhalb von 1 Sekunde aus.

- [ ] **AC-3: Fallback bei blockiertem CORS oder Data-URLs**
  - **Gegeben sei**: Eine Audiodatei wird von einer Domain geladen, die keine CORS-Header mitsendet, oder im lokalen Mock-Modus als `data:`-URL.
  - **Wenn**: `play(url)` aufgerufen wird,
  - **Dann**: Blockiert der Player nicht, sondern spielt die Datei über das native HTML-Audioelement ab, wobei die Lautstärke über `audio.volume` geregelt wird.

- [ ] **AC-4: Gain-Feld Sync in `cornerJingleService`**
  - **Gegeben sei**: Ein Ecken-Jingle wurde mit einem berechneten `gain` in Firestore abgelegt.
  - **Wenn**: `subscribeCornerJingles` die Daten lädt,
  - **Dann**: Besitzt das geladene `CornerJingle`-Objekt die Eigenschaft `gain` mit dem korrekten Zahlenwert.

- [ ] **AC-5: Team-Jingle Wiedergabe abgesichert**
  - **Gegeben sei**: Ein Team hat einen Torjingle in Firebase Storage hinterlegt.
  - **Wenn**: Der Jingle in `TeamCard`, `TeamEditModal` oder am Live-Desk abgespielt wird,
  - **Dann**: Ertönt der Torjingle zuverlässig und ohne CORS-Fehler.

### 4.2 Allgemeine Qualitätskriterien
- [ ] Keine fest kodierten Grenzwerte oder URLs gemäß `AGENTS.md`.
- [ ] 100 % TypeScript-Typisierung ohne `any`.
- [ ] `npm run build` und `npm test` laufen fehlerfrei durch.
- [ ] Sauberes Aufräumen aller Event-Listener und Timer.

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Betroffene Ansichten & Komponenten
- `src/hooks/useAudioPlayer.ts`: Robuster Fallback-Mechanismus.
- `src/services/cornerJingleService.ts`: Gain-Mapping.
- `cors.json`: Firebase Storage CORS-Konfiguration.

### 5.2 Interaktionsablauf
```
Klick auf Jingle Play
        │
        ▼
Ist URL eine Data-URL oder bekannt als Non-CORS?
   ├── Ja ──────────────────────────────────────────┐
   └── Nein                                         │
        │                                           ▼
Versuche Web-Audio-Wiedergabe            Natives HTMLAudioElement
(audio.crossOrigin = "anonymous")       (ohne crossOrigin, direkte Boxen)
        │                                           │
  (CORS Fehler?) ─── Ja ───► Fallback ──────────────┤
        │                                           │
       Nein                                         │
        ▼                                           ▼
Ton erklingt über Limiter/Gain             Ton erklingt über audio.volume
```

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Datenmodell (`DATABASE.md`)
Das Datenmodell bleibt unverändert (das Feld `gain?: number` in `CornerJingle` wurde bereits in SPEC-060 definiert). Es wird lediglich in `cornerJingleService.ts` konsistent gelesen und weitergeleitet.

### 6.2 `useAudioPlayer.ts` Architektur
- Vorbereitung zweier Wiedergabepfade:
  1. `webAudioRef`: Für Same-Origin / CORS-fähige Audioquellen mit vollständiger Limiter-Kette.
  2. `fallbackAudioRef`: Für Cross-Origin Quellen ohne CORS-Header oder `data:`-URLs.
- `fallbackAudioRef` verzichtet vollständig auf `crossOrigin = "anonymous"` und `createMediaElementSource()`, sodass der Browser das Audio nativ ausgibt.

---

## 7. Edge Cases & Fehlerbehandlung

- **Schneller Mehrfachklick**: Vorherige Instanzen und Fade-Timer werden vor dem neuen Start zuverlässig gestoppt (`clearMaxDurationTimer`, `clearInterval`).
- **Autoplay-Richtlinien**: Klicks am Spieltisch oder in der Liste erfolgen durch direkte Benutzerinteraktion, wodurch der Browser Autoplay gestattet.
- **Ungültige / defekte Audio-URLs**: Falls eine Datei wirklich unlesbar ist (z. B. 404 Not Found), zeigt der Player die gewohnte Fehlermeldung an.

---

## 8. Verifikations- & Testplan

### 8.1 Manuelle Tests
1. [ ] Neuen Ecken-Jingle anlegen, im Dialog vorhören, speichern.
2. [ ] Nach dem Speichern Play-Button in der Liste drücken -> Audio muss ertönen.
3. [ ] Im Live-Desk den Ecken-Jingle abspielen -> Audio muss ertönen und nach 15s bzw. Re-Klick ausfaden.
4. [ ] Team-Torjingle testen.

### 8.2 Automatisierte Tests / Validierung
- [ ] Neuer Test `tests/spec061AudioPlaybackCorsFallback.test.ts` zur Validierung des Gain-Mappings und des Fallback-Verhaltens.
- [ ] `npm run build` und `npm test` fehlerfrei.

---

## 9. Offene Fragen & Klärungsbedarf
- Keine. Ursache und Lösung sind technisch eindeutig identifiziert.
