# SPEC-076: Nativer Full-HD Kiosk ohne CSS-Skalierung

> **Status**: In Abnahme  
> **Typ**: Optimierung / Bugfix  
> **Branch**: `fix/SPEC-076-kiosk-native-fullhd-ohne-skalierung`  
> **Autor**: Antigravity  
> **Erstellt am**: 2026-10-30  
> **Letzte Änderung**: 2026-10-30  
> **Betroffene Bereiche**: Kiosk (`/kiosk`)  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Auf den Raspberry Pis stürzt Chromium im Kiosk-Modus ab:
1. **CSS `transform: scale(...)` in [`KioskLayout.tsx`](../src/components/layouts/KioskLayout.tsx)**:
   - Der bisherige Virtual-1080p-Scaler aus SPEC-034 berechnet via `useKioskScale` einen Skalierungsfaktor und wendet `transform: scale(...)` auf das Hauptelement an.
   - Auf Raspberry Pi OS (ARM 64-bit mit Mesa V3D unter X11) zwingt `transform: scale(...)` die Rendering-Engine Skia dazu, eine riesige GPU-Composite-Ebene im Grafikspeicher zu allokieren.
   - Da die Fernseher in der Halle per `xrandr` ohnehin fest auf **1920x1080 (Full-HD)** eingestellt sind, ist diese CSS-Skalierung auf den Kiosk-Geräten technisch überflüssig und die Hauptursache für GPU-Speicherüberläufe und `SIGSEGV` (Error 11).
2. **Gleichzeitiges Mounting aller 4 Folien**:
   - Als im vorherigen Versuch alle 4 Folien gleichzeitig im DOM gehalten wurden, führte die Kombination aus 4 Folien (alle 40 Spiele, 16 Teams und Tabellen) innerhalb der `transform: scale(...)`-Ebene zu einem sofortigen Speicherabsturz beim Start.

### 1.2 Zielzustand & Mehrwert
- **Natives 1080p-Layout (100 % skalierungsfrei)**:
  - `KioskLayout.tsx` rendert direkt als nativer Vollbild-Container (`w-screen h-screen flex flex-col p-6 overflow-hidden bg-slate-100 text-slate-900 select-none`).
  - Kein `useKioskScale`, kein `transform: scale(...)`, keine künstlichen GPU-Composite-Layer.
  - Das spart enorm viel Grafik- und Arbeitsspeicher auf den Raspberry Pis und sorgt für ein absolut stabiles, natives Full-HD-Bild.
- **Ressourcenschonendes Single-Slide-Mounting**:
  - In `KioskPage.tsx` wird immer nur die **aktuell aktive Folie** gerendert (`{activeSlide === 0 && ...}`, etc.). Dadurch bleibt der DOM-Baum schlank (1/4 des Speichers).

---

## 2. User Stories

- **US-1**: Als **Zuschauer in der Halle vor dem TV** möchte ich ein stabiles, gestochen scharfes Full-HD-Bild sehen, das ohne Ruckeln und ohne Browser-Abstürze dauerhaft durchläuft.
- **US-2**: Als **Turnierleiter / Hallentechniker** möchte ich, dass der Kiosk-Modus auf nativer 1080p-Hardware ohne überflüssige CSS-Skalierungsschichten ressourcenschonend arbeitet.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope
- [x] **Abschalten von `transform: scale(...)` in `KioskLayout.tsx`**:
  - Entfernung von `useKioskScale` und dem `style={{ width: 1920, height: 1080, transform: ... }}`-Wrapper.
  - Ersatz durch `div className="h-screen w-screen overflow-hidden bg-slate-100 text-slate-900 flex flex-col p-6 select-none"`.
- [x] **Bedingtes Rendering nur der aktiven Folie in `KioskPage.tsx`**:
  - `{activeSlide === 0 && <KioskScoreboardSlide />}`, etc., sodass nur eine Folie im DOM existiert.
- [x] **Aktualisierung der Tests**:
  - Anpassung von `spec034KioskFitToScreenScaling.test.ts` und Hinzufügen von `spec076KioskNativeFullHd.test.ts`.

### 3.2 Explizit Out-of-Scope
- Änderung der Inhalte der 4 Folien.

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien
- [x] **AC-1: KioskLayout rendert nativ ohne CSS-Transform**
  - **Gegeben sei**: Die Kiosk-Ansicht `/kiosk` wird geöffnet.
  - **Dann**: Enthält das Layout kein `transform: scale(...)` mehr, sondern füllt als natives Flex-Layout die gesamte Bildschirmfläche (`h-screen w-screen`).
- [x] **AC-2: Schlanker DOM durch Single-Slide-Rendering**
  - **Gegeben sei**: Die Kiosk-Seite ist aktiv.
  - **Dann**: Befindet sich zu jedem Zeitpunkt nur die aktuell ausgewählte Folie im DOM-Baum.
- [x] **AC-3: Fehlerfreier Start und Folienrotation auf dem Raspberry Pi**
  - **Gegeben sei**: Der Kiosk läuft auf dem Raspberry Pi.
  - **Dann**: Startet die Seite sofort fehlerfrei und rotiert ohne Absturz durch alle Folien.

### 4.2 Allgemeine Qualitätskriterien
- [x] Build fehlerfrei (`npm run build`).
- [x] Linter fehlerfrei (`npm run lint`).
- [x] Alle Unit- und End-to-End-Tests erfolgreich (`npm test`).
