# SPEC-060: Automatische Audio-Pegel-Normalisierung und Dynamik-Limiter für Jingles

> **Status**: Abgeschlossen  
> **Typ**: Feature / Optimierung  
> **Branch**: feat/SPEC-060-audio-pegel-normalisierung  
> **Autor**: Antigravity  
> **Erstellt am**: 2026-10-21  
> **Letzte Änderung**: 2026-10-22  
> **Betroffene Bereiche**: Audio/Storage | Turnierleitung (/admin) | Gast-/Team-Ansicht (/team/:token) | Datenbank/Firestore  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Teams laden für ihre Tor-Jingles und die Turnierleitung für Eckensongs (Corner-Jingles) beliebige Audiodateien in unterschiedlichen Qualitäten und Lautstärken hoch. Während manche Songs professionell gemastert und extrem laut sind (0 dBFS Peak), sind andere Mitschnitte oder ältere Lieder sehr leise (-20 dBFS oder leiser).  
Beim Abspielen im Hallenbetrieb führt dies aktuell zu unberechenbaren Lautstärkesprüngen: Die Turnierleitung muss am Mischpult/Lautsprecher hektisch nachregeln, oder leise Jingles gehen im Hallenlärm unter, während laute Songs die Halle übertönen.

### 1.2 Zielzustand & Mehrwert
- **Automatische Lautheits-Angleichung**: Alle Jingles (Tor- und Eckensongs) werden auf eine einheitliche, angenehme und durchsetzungsfähige Hallenlautstärke (Zielkorridor: -14 LUFS / Hallenstandard) normalisiert.
- **Kombinierter Ansatz**:
  1. *Analyse beim Upload*: Der Browser analysiert die hochgeladene Audiodatei kurz clientseitig via Web Audio API und berechnet den individuellen Lautstärkekorrektur-Faktor (`jingleGain`), der in Firestore gespeichert wird.
  2. *Live-Limiter beim Abspielen*: Über einen `DynamicsCompressorNode` (Broadcast-Limiter) im zentralen Audio-Player werden Lautstärkespitzen abgefangen und Übersteuerungen verhindert.
- **Vollautomatisch & WYSIWYG**: Weder Teams noch Turnierleitung müssen im laufenden Betrieb Regler bedienen. Sowohl in der Vorschau (beim Einstellen der Startzeit) als auch am Spieltisch erklingen alle Jingles im selben konsistenten Lautstärkebild.

---

## 2. User Stories

- **US-1**: Als **Turnierleiter am Live-Desk** möchte ich, dass jeder Torjingle und Eckensong mit annähernd gleicher Lautstärke über die Hallen-Lautsprecher ertönt, um mich voll auf das Spiel konzentrieren zu können, ohne manuell am Regler nachjustieren zu müssen.
- **US-2**: Als **Team-Betreuer im Jingle-Upload-Bereich** möchte ich beim Vorhören und Einstellen der Startzeit genau die Lautstärke hören, die später auch in der Halle abgespielt wird, um den Ausschnitt verlässlich beurteilen zu können.
- **US-3**: Als **Zuschauer in der Halle** möchte ich eine klare und verzerrungsfreie Akustik erleben, ohne durch plötzliche extreme Pegelsprünge erschreckt oder durch unhörbar leise Jingles enttäuscht zu werden.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)
- [x] **Clientseitige Pegelmessung beim Upload**:
  - Implementierung eines Audio-Analyse-Helpers (`calculateAudioGain`), der eine Audiodatei per `AudioContext.decodeAudioData` analysiert.
  - Ermittlung des effektiven Signalpegels (RMS / Peak) und Ableitung des Ziel-Gain-Faktors auf den Zielwert (-14 LUFS äquivalent) mit Clipping-Schutz.
  - Speichern des ermittelten `jingleGain: number` in der `teams`-Collection bzw. `gain: number` in der `corners`-Collection.
- [x] **Erweiterung von `useAudioPlayer` mit Web Audio API Signal Chain**:
  - Routing des Audio-Signals durch:
    `HTMLAudioElement` $\rightarrow$ `MediaElementAudioSourceNode` $\rightarrow$ `GainNode` (angesteuert über das `gain`-Feld) $\rightarrow$ `DynamicsCompressorNode` (Limiter für Hallen-Sound) $\rightarrow$ `AudioContext.destination`.
  - Bereitstellung von Zeit- und Navigationssteuerungen (`currentTime`, `duration`, `seek`, `play`, `stop`, `fadeOut`).
- [x] **Robustes Fallback**:
  - Falls CORS oder Browser-Restriktionen die Web-Audio-Verbindung blockieren, erfolgt die Wiedergabe unterbrechungsfrei direkt über das HTML-Audio-Element (kein Stummschalten oder Abstürzen).
- [x] **Refactoring von `TeamJinglePage`**:
  - Umstellung der Vorschau in `TeamJinglePage` auf `useAudioPlayer`, um Startzeit-Einstellung, Vorschau und Pegel-Normalisierung 100 % einheitlich (WYSIWYG) bereitzustellen.
- [x] **Bestehende Jingles**:
  - Jingles ohne gespeichertes `jingleGain`-Feld fallen automatisch auf Standardwert `1.0` zurück und profitieren sofort vom Live-Dynamik-Limiter.
- [x] **Live-Desk Wiedergabesteuerung (Max. 15s & Toggle)**:
  - Alle Jingles am Live-Desk (sowohl Tor-Jingles als auch Ecken-Jingles) faden nach maximal 15 Sekunden automatisch sanft über 1 Sekunde aus.
  - Wird der aktive Jingle-Button am Live-Desk während des Abspielens erneut gedrückt, wird der 1-Sekunden-Fadeout sofort eingeleitet.
- [x] **Millisekunden-Eingabe für Ecken-Jingles**:
  - `CornerJingleModal` bietet neben dem Schieberegler ein direktes, synchronisiertes Zahlenfeld zur Eingabe der Startzeit in Millisekunden.

### 3.2 Explizit Out-of-Scope
- Kein serverseitiges Transcoding oder Neuberechnen über Firebase Cloud Functions oder FFmpeg (bleibt rein clientseitig ohne Serverkosten).
- Keine manuellen Slider/Regler im Standard-Turnierbetrieb (alles läuft vollautomatisch im Hintergrund).

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien
- [x] **AC-1: Pegelberechnung beim Team-Jingle-Upload**
  - **Gegeben sei**: Ein Betreuer wählt auf `/team/:token` eine Audiodatei aus.
  - **Wenn**: Die Datei geladen und gespeichert wird.
  - **Dann**: Wird der Lautstärkepegel analysiert und der berechnete Faktor `jingleGain` zusammen mit `jingleUrl` in Firestore im Teamdokument gespeichert.
- [x] **AC-2: Normalisierte Wiedergabe am Live-Desk & TeamCard**
  - **Gegeben sei**: Zwei Teams mit stark unterschiedlichen Ausgangspegeln (z. B. leise vs. laut) haben Jingles hinterlegt.
  - **Wenn**: Die Jingles am Live-Desk (`useLiveMatchDesk`) oder in der Team-Übersicht abgespielt werden.
  - **Dann**: Werden beide Jingles mit vergleichbarer empfundener Lautstärke wiedergegeben; laute Peaks werden transparent durch den Limiter abgefangen, ohne zu verzerren.
- [x] **AC-3: WYSIWYG-Vorschau in TeamJinglePage & TeamEditModal**
  - **Gegeben sei**: Ein Betreuer testet seinen Song in `TeamJinglePage` mit Schieberegler.
  - **Wenn**: Er auf „Abspielen“ klickt.
  - **Dann**: Greift dieselbe Audio-Chain wie im Admin-Bereich, sodass der Höreindruck exakt der späteren Hallenausgabe entspricht.
- [x] **AC-4: Eckensongs (Corner Jingles)**
  - **Gegeben sei**: Ein Eckensong wird in der Turnierleitung (`CornerJingleModal`) hochgeladen oder abgespielt.
  - **Wenn**: Der Song abgespielt wird.
  - **Dann**: Greift ebenfalls die Lautstärke-Normalisierung und der Limiter.
- [x] **AC-5: Fehlertoleranz & Autoplay-Lifecycle**
  - **Gegeben sei**: Ein Browser erfordert eine Benutzerinteraktion zum Aktivieren des `AudioContext`.
  - **Wenn**: Ein Jingle per Klick ausgelöst wird.
  - **Dann**: Reaktiviert der Player einen ggf. suspendierten `AudioContext` (`ctx.resume()`) und spielt verzögerungsfrei ab.
- [x] **AC-6: Live-Desk 15-Sekunden-Autostopp & Button-Toggle**
  - **Gegeben sei**: Ein Torjingle oder Eckenjingle wird am Live-Desk abgespielt.
  - **Wenn**: Keine weitere Aktion erfolgt.
  - **Dann**: Fadet die Musik nach exakt 14 Sekunden automatisch über 1 Sekunde aus und stoppt nach 15 Sekunden.
  - **Wenn**: Der jeweilige Jingle-Button während der Wiedergabe erneut gedrückt wird.
  - **Dann**: Schaltet der Button auf Stopp und blendet die Musik sofort über 1 Sekunde sanft aus, ohne den Spielstand erneut zu erhöhen.
- [x] **AC-7: Ecken-Jingle Millisekunden-Eingabe**
  - **Gegeben sei**: Der Administrator bearbeitet einen Ecken-Jingle im `CornerJingleModal`.
  - **Wenn**: Er die Startzeit anpassen möchte.
  - **Dann**: Kann er den Wert wahlweise über den Slider oder direkt über ein synchronisiertes Zahlenfeld in Millisekunden eingeben.

### 4.2 Allgemeine Qualitätskriterien
- [x] Keine fest kodierten Turnier- oder Audioparameter außerhalb konfigurierbarer Konstanten.
- [x] Strikte TypeScript-Typisierung (kein `any`).
- [x] `npm run build` und `npm run lint` laufen ohne Fehler durch.
- [x] Sauberes Ressourcen-Management für `AudioContext` und Event-Listener.

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Betroffene Ansichten & Komponenten
- `src/pages/jingle/TeamJinglePage.tsx`: Audio-Vorschau nutzt `useAudioPlayer`.
- `src/components/admin/TeamEditModal.tsx`: Analyse & Normalisierung beim Admin-Upload.
- `src/components/admin/corners/CornerJingleModal.tsx`: Analyse & Normalisierung bei Eckensongs.
- `src/components/admin/live/LiveMatchDesk.tsx`: Jingle- und Eckensong-Wiedergabe.

### 5.2 Interaktionsablauf
1. **Datei wählen**: Nutzer wählt Audio-Datei (MP3, WAV, etc.).
2. **Analyse**: Ladebalken/Indikator zeigt während des Uploads für wenige Millisekunden die Analyse an.
3. **Speichern**: Metadaten inklusive `jingleGain` werden atomar in Firestore gesichert.
4. **Playback**: Beim Klick auf Jingle-Start wird das Audio über die Limiter-Chain abgespielt.

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Datenmodell (`DATABASE.md`)
- **Collection `teams`**:
  ```typescript
  export interface Team {
    // ... bestehende Felder ...
    jingleGain?: number // Lautstärke-Multiplikator zur Normalisierung (z. B. 0.8 bis 2.5, Default 1.0)
  }
  ```
- **Collection `corners`**:
  ```typescript
  export interface CornerJingle {
    // ... bestehende Felder ...
    gain?: number // Lautstärke-Multiplikator zur Normalisierung (Default 1.0)
  }
  ```

### 6.2 TypeScript Interfaces (`src/types/database.ts`)
- Ergänzung der optionalen Felder `jingleGain?: number` in `Team` und `gain?: number` in `CornerJingle`.

### 6.3 Signal-Graph der Web Audio API
```
[HTMLAudioElement (crossOrigin="anonymous")]
                 │
                 ▼
  [MediaElementAudioSourceNode]
                 │
                 ▼
          [GainNode]  <── (gesteuert durch team.jingleGain || 1.0)
                 │
                 ▼
    [DynamicsCompressorNode]
      - Threshold: -18 dBFS
      - Knee: 20 dB
      - Ratio: 8:1
      - Attack: 0.003 s (3 ms)
      - Release: 0.25 s
                 │
                 ▼
    [AudioContext.destination]
```

---

## 7. Edge Cases & Fehlerbehandlung

- **CORS-Beschränkung**: Falls Firebase Storage oder eine externe Quelle CORS-Header nicht liefert, schlägt `createMediaElementSource()` fehl. Der Player fängt dies mit einem `try/catch` ab und gibt das Audio direkt über den Lautsprecher aus, sodass niemals Stille entsteht.
- **Extreme Dateien (stark übersteuert oder fast lautlos)**: Der berechnete Gain-Faktor wird auf einen sicheren Bereich begrenzt (z. B. Min: `0.2` [-14 dB], Max: `3.0` [+9.5 dB]), um Rausch-Explosionen bei fast stummen Dateien zu vermeiden.
- **AudioContext-Status**: Vor jedem Abspielen wird `if (ctx.state === "suspended") await ctx.resume()` aufgerufen.

---

## 8. Verifikations- & Testplan

### 8.1 Manuelle Tests
1. [x] Upload eines bewusst leisen MP3-Tracks $\rightarrow$ Gain wird ermittelt und Song wird mit kräftiger Lautstärke abgespielt.
2. [x] Upload eines extrem lauten/geclippten Songs $\rightarrow$ Limiter dämpft Spitzen sauber ohne hörbare Verzerrung.
3. [x] Startzeit-Verschiebung in `TeamJinglePage` $\rightarrow$ WYSIWYG-Klang entspricht exakt der Wiedergabe am Live-Desk.
4. [x] Mehrfaches schnelles Abspielen / Stoppen $\rightarrow$ kein Knacken oder Absturz des AudioContext.
5. [x] 15-Sekunden-Autostopp & Klick-Ausblenden am Live-Desk.
6. [x] Millisekunden-Zahlenfeld im Ecken-Jingle-Modal.

### 8.2 Automatisierte Validierung
- [x] `npm run build` kompiliert ohne TypeScript-Fehler.
- [x] `npm run lint` bestätigt Code-Qualität.
- [x] `npm test` führt alle 193 Tests erfolgreich aus.

---

## 9. Freigabe & Nächste Schritte
Gemäß Spec Driven Development (SDD):
- Warten auf ausdrückliche PO-Freigabe mit **`APPROVED`**.
- Nach Freigabe: Aktualisierung von `DATABASE.md` und Beginn der schrittweisen Implementierung auf dem Branch `feat/SPEC-060-audio-pegel-normalisierung`.
