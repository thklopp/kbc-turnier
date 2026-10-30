# SPEC-074: Kiosk-Stabilität, Performance & Raspberry-Pi-Optimierung

> **Status**: Abgeschlossen  
> **Typ**: Optimierung / Bugfix  
> **Branch**: `fix/SPEC-074-kiosk-stabilitaet-und-performance`  
> **Autor**: Antigravity  
> **Erstellt am**: 2026-10-30  
> **Letzte Änderung**: 2026-10-30  
> **Betroffene Bereiche**: Kiosk (`/kiosk`), Raspberry-Pi-Setup (`raspberry/`)  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Im Hallenbetrieb stürzt der Kiosk-Modus auf Raspberry Pis nach unbestimmter Laufzeit mit der Chromium-Fehlermeldung:  
`Aw, Snap! Something went wrong while displaying the webpage. Error code: 11` ab.

Die Analyse ergab zwei koppelnde Ursachen:
1. **Betriebssystem- & Chromium-Ebene**:
   - `SIGSEGV` (Signal 11 / Error 11) wird primär durch einen volllaufenden Shared Memory (`/dev/shm`) oder Abstürze im Mesa-V3D-Grafiktreiber ausgelöst.
   - Der Swap-Speicher des Pi ist mit 100 MB zu gering für mehrstündige Browser-Sessions.
   - Chromium lief bisher ohne Neustart-Schleife, sodass ein Absturz den Bildschirm dauerhaft blockierte.
2. **React-Anwendungsebene ([`KioskPage.tsx`](../src/pages/kiosk/KioskPage.tsx))**:
   - Zur Animation des blauen Fortschrittsbalkens im Header wurde alle 100 ms ein State-Update (`setElapsedMs`) ausgeführt (`PROGRESS_TICK_MS = 100`).
   - Dadurch renderte die gesamte `KioskPage` samt aller Kindkomponenten (inkl. 4-facher Berechnung von `calculateGroupStandings` in `KioskStandingsSlide`) **10-mal pro Sekunde** neu (36.000 Renders pro Stunde).
   - Auf ressourcenbeschränkter Hardware erzeugte dies kontinuierlichen Garbage-Collection-Druck, CPU-Last und Speicherfragmentierung über einen mehrstündigen Turniertag.

### 1.2 Zielzustand & Mehrwert
- **Maximale Stabilität im Hallen-Dauerbetrieb**: Der Kiosk läuft unterbrechungsfrei über den gesamten Turniertag (8–12 Stunden).
- **Drastische Reduktion der Render-Zyklen**: Der Fortschrittsbalken wird rein über CSS animiert. Die Hauptkomponenten rendern nur noch beim tatsächlichen Folienwechsel (alle 12 Sekunden) bzw. bei Datenänderungen aus Firestore (Reduktion von 36.000 auf 300 Renders/Stunde).
- **Proaktives Memory-Management**: Nach Ablauf von 60 Minuten führt der Kiosk beim Übergang zu Folie 0 einen sauberen Soft-Reload (`window.location.reload()`) durch, um den JavaScript-Heap des Browsers vollständig zu bereinigen.
- **Widerstandsfähiges Startskript**: Sollte Chromium beendet werden oder abstürzen, startet das Skript den Browser nach 2 Sekunden automatisch neu.

---

## 2. User Stories

- **US-1**: Als **Zuschauer und Turnierteilnehmer in der Halle** möchte ich, dass der Kiosk-Bildschirm durchgehend verlässlich Spielstände, Tabellen und Zeitpläne anzeigt, ohne dass Absturzmeldungen wie „Aw, Snap“ erscheinen.
- **US-2**: Als **Turnierleiter / Hallentechniker** möchte ich mich darauf verlassen können, dass die Raspberry Pis morgens gestartet werden und ohne manuelles Eingreifen den ganzen Tag stabil durchlaufen.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope
- [x] **CSS-basierter Fortschrittsbalken im Kiosk-Header**:
  - Ersatz des 100-ms-React-State-Tickers durch eine flüssige CSS-Animation (`transition` bzw. CSS-Keyframe).
  - Folienwechsel wird durch einen einfachen Timer gesteuert.
- [x] **Automatischer Hygiene-Reload**:
  - Kiosk führt nach 60 Minuten Laufzeit beim nächsten Wechsel auf Slide 0 einen transparenten `window.location.reload()` durch.
- [x] **Memoization rechenintensiver Slides**:
  - `KioskStandingsSlide`, `KioskGroupStageSlide` und `KioskFinalsSlide` berechnen Daten nur neu, wenn sich die Abhängigkeiten (`matches`, `teams`) tatsächlich ändern (`useMemo`), statt bei jedem Re-Render.
- [x] **Aktualisierte Raspberry-Skripte**:
  - `start-kiosk.sh`: Flags `--disable-dev-shm-usage`, `--disable-gpu`, `--disable-software-rasterizer`, RAM-Cache `/tmp/chromium-cache` und automatische Neustart-Schleife.
  - `install-kiosk.sh`: Swap-Erhöhung auf 1024 MB.
  - `connect-wifi.sh`: Ergänzung von `--no-sandbox` und `--disable-dev-shm-usage` für den Root-Browser des Captive Portals.

### 3.2 Explizit Out-of-Scope
- Änderung des visuellen Kiosk-Designs oder der Foliendauer (bleibt bei 12 Sekunden).
- Änderung der Firestore-Datenstrukturen.

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien
- [x] **AC-1: Flüssiger Fortschrittsbalken ohne 100-ms-React-State-Rerenders**
  - **Gegeben sei**: Die Kiosk-Ansicht (`/kiosk`) ist geöffnet und nicht pausiert.
  - **Wenn**: Eine Folie angezeigt wird.
  - **Dann**: Füllt sich der blaue Fortschrittsbalken über 12 Sekunden kontinuierlich und gleichmäßig via CSS, während `KioskPage` während der 12 Sekunden keine Zwischen-Renders ausführt.
- [x] **AC-2: Folienwechsel und Pausieren funktionieren weiterhin unverändert**
  - **Gegeben sei**: Die Kiosk-Ansicht läuft.
  - **Wenn**: Der Nutzer auf Pause klickt oder manuell eine Folie anklickt.
  - **Dann**: Hält der Fortschrittsbalken sofort an bzw. springt zur gewählten Folie und startet den Balken neu.
- [x] **AC-3: Tabellenberechnung ist memoisiert**
  - **Gegeben sei**: Die Folie „Tabellen“ (`KioskStandingsSlide`) ist aktiv.
  - **Wenn**: Ein Re-Render ausgelöst wird, ohne dass sich `matches` oder `teams` geändert haben.
  - **Dann**: Werden die 4 Gruppenplatzierungen (`calculateGroupStandings`) nicht redundant neu berechnet.
- [x] **AC-4: Geplanter Speicherhygiene-Reload**
  - **Gegeben sei**: Der Kiosk läuft seit mehr als 60 Minuten ununterbrochen.
  - **Wenn**: Der Folienzyklus wieder bei Folie 0 ankommt.
  - **Dann**: Wird ein `window.location.reload()` ausgeführt, der alle Browser-Ressourcen frisch lädt.
- [x] **AC-5: Robustheit der Shell-Skripte**
  - **Gegeben sei**: Die Shell-Skripte im Ordner `raspberry/` werden ausgeführt.
  - **Wenn**: `start-kiosk.sh` gestartet wird.
  - **Dann**: Werden die Flags `--disable-dev-shm-usage`, `--disable-gpu`, `--disable-software-rasterizer` und die Neustart-Schleife korrekt angewendet.

### 4.2 Allgemeine Qualitätskriterien
- [x] TypeScript ohne Compilerfehler (`npm run build`).
- [x] Keine Verwendung von `any`.
- [x] Linting fehlerfrei (`npm run lint`).
- [x] Keine Unterbrechung bestehender Kiosk-Funktionen (Online/Offline-Banner, Header-Uhrzeit, Slideswitcher).

---

## 5. UI/UX & Interaktionskonzept

- **Kiosk-Header ([`src/components/kiosk/KioskHeader.tsx`](../src/components/kiosk/KioskHeader.tsx))**:
  - Der Fortschrittsbalken unter den Folienbuttons erhält eine CSS-Transition / CSS-Animation, die bei Folienwechsel oder Pause zurückgesetzt/gestoppt wird.
  - Die Uhrzeit (`currentTime`) im Header aktualisiert sich weiterhin jede Sekunde, ohne jedoch die Folien neu zu rendern (bereits als isolierter Timer in `KioskHeader` gekapselt).

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Datenmodell (`DATABASE.md`)
- Keine Änderungen erforderlich.

### 6.2 Betroffene Dateien
- `raspberry/start-kiosk.sh` (bereits angepasst)
- `raspberry/install-kiosk.sh` (bereits angepasst)
- `raspberry/connect-wifi.sh` (bereits angepasst)
- `src/pages/kiosk/KioskPage.tsx`
- `src/components/kiosk/KioskHeader.tsx`
- `src/components/kiosk/KioskStandingsSlide.tsx`

---

## 7. Verifikationsplan

1. `bash -n raspberry/*.sh` $\rightarrow$ Skripte syntaktisch einwandfrei.
2. `npm run lint` & `npm run build` $\rightarrow$ Fehlerfreier Build.
3. Kiosk-Funktionstest im Browser:
   - Folien wechseln automatisch nach 12 Sekunden.
   - Manueller Klick auf Slide-Buttons schaltet Folie um und setzt Fortschritt zurück.
   - Pause-Button friert den Fortschritt ein; Fortsetzen setzt die Zeit fort.
