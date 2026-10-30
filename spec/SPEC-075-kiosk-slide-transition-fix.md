# SPEC-075: Kiosk Folienwechsel-Fix (Vermeidung von Reload-Crash & DOM-Thrashing)

> **Status**: In Abnahme  
> **Typ**: Bugfix / Stabilität  
> **Branch**: `fix/SPEC-075-kiosk-slide-transition-fix`  
> **Autor**: Antigravity  
> **Erstellt am**: 2026-10-30  
> **Letzte Änderung**: 2026-10-30  
> **Betroffene Bereiche**: Kiosk (`/kiosk`)  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Auf den Raspberry Pis stürzt Chromium im Kiosk-Modus reproduzierbar **exakt nach einem Durchlauf** beim Übergang von Seite 4 (Tabellen, Index 3) zurück auf Seite 1 (Live-Scoreboard, Index 0) mit `Aw, Snap! Error code: 11` ab.

Die Ursachenanalyse ergab:
1. **Unbeabsichtigter Hard-Reload im React-State-Setter**:
   In [`src/pages/kiosk/KioskPage.tsx`](../src/pages/kiosk/KioskPage.tsx) wurde in `nextSlide` innerhalb der Zustandstransformation `setActiveSlide((prev) => { ... })` die Bedingung `if (next === 0 && Date.now() - appStartTimeRef.current >= RELOAD_INTERVAL_MS)` geprüft. Da `appStartTimeRef.current` initial mit `0` belegt war (zur Beruhigung des Linters), ergab `Date.now() - 0 >= 3600000` **schon beim allerersten Durchlauf `true`**!
   Dadurch rief React unmittelbar beim Wechsel von Folie 4 auf 1 mitten in der Reconcilierungsphase `window.location.reload()` auf. Auf dem Raspberry Pi bricht ein harter Reload mitten im Render-Zyklus den Browser-Renderer ab und löst sofort `SIGSEGV` (Error 11) aus.
2. **DOM-Thrashing (Mounting/Unmounting)**:
   Die Folien wurden bisher mit `{activeSlide === 0 && <KioskScoreboardSlide />}`, `{activeSlide === 1 && ...}` bedingt gerendert. Bei jedem Folienwechsel wurde die gesamte Baumstruktur der Folie gelöscht und neu aufgebaut. Beim Wechsel von Folie 4 (4 Tabellen mit 16 Teams und Logos) zu Folie 1 (großes Scoreboard mit 2 großen Logos) führte dies zu einer extremen Spitze bei Speicherfreigabe und Neubelegung.
3. **GPU-Filter-Effekte**:
   `backdrop-blur-md` im Kiosk-Header und `filter drop-shadow-sm` auf den Team-Logos belasten den Skia-Compositor unter X11 auf ARM-Geräten unnötig.

### 1.2 Zielzustand & Mehrwert
- **Kein Reload im React-State-Cycle**: Der gefährliche `window.location.reload()` innerhalb von `setActiveSlide` wird vollständig entfernt.
- **Dauerhafte DOM-Präsenz (Persistent Slides via CSS `hidden`)**: Alle 4 Folien bleiben nach dem ersten Laden im DOM gemountet und werden lediglich über CSS (`hidden` bzw. `block`/`flex`) sichtbar/unsichtbar geschaltet. Es findet kein ständiges Zerstören und Neuaufbauen von DOM-Bäumen mehr statt.
- **Entfernung crash-anfälliger GPU-Filter**: `backdrop-blur-md` im Kiosk-Header wird durch ein solides `bg-white` ersetzt, `filter drop-shadow-sm` an den Logos wird entfernt.

---

## 2. User Stories

- **US-1**: Als **Zuschauer in der Halle** möchte ich, dass der Kiosk-Bildschirm endlos und unterbrechungsfrei von Folie 4 wieder auf Folie 1 wechselt, ohne abzustürzen.
- **US-2**: Als **Turnierleitung** möchte ich ein stabiles Kiosk-System, das ohne riskante JavaScript-Reloads den ganzen Tag flüssig durchläuft.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope
- [x] **Vollständiges Entfernen von `window.location.reload()` aus `KioskPage.tsx`**.
- [x] **Persistente Folienanzeige in `KioskPage.tsx`**:
  - Alle Folien werden im DOM gerendert und über bedingte CSS-Klassen (`hidden` vs. `flex flex-col ...`) ein- und ausgeblendet.
- [x] **Bereinigung von GPU-Filtern**:
  - `KioskHeader.tsx`: `backdrop-blur-md` entfernen, durch sauberes `bg-white` ersetzen.
  - `KioskScoreboardSlide.tsx`: `filter drop-shadow-sm` auf den Bild-Tags entfernen.

### 3.2 Explizit Out-of-Scope
- Änderung der 12-Sekunden-Foliendauer oder der angezeigten Daten.

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien
- [x] **AC-1: Endloser Folienwechsel ohne Absturz**
  - **Gegeben sei**: Der Kiosk-Modus läuft auf dem Raspberry Pi.
  - **Wenn**: Folie 4 (Tabellen) nach 12 Sekunden abgelaufen ist.
  - **Dann**: Wechselt der Kiosk reibungslos und ohne Reload auf Folie 1 (Live-Scoreboard), ohne dass ein Fehler oder Chromium-Absturz auftritt.
- [x] **AC-2: Folien bleiben im DOM gemountet**
  - **Gegeben sei**: Die Kiosk-Seite ist geladen.
  - **Wenn**: Zwischen den Folien gewechselt wird.
  - **Dann**: Werden die Foliencontainer über CSS `hidden` bzw. Sichtbarkeitsklassen gesteuert, sodass keine DOM-Neugenerierung stattfindet.
- [x] **AC-3: Keine `backdrop-blur`-Filter im Kiosk**
  - **Gegeben sei**: Der Kiosk-Header wird angezeigt.
  - **Dann**: Verwendet der Header keine CSS-Eigenschaft `backdrop-filter` / `backdrop-blur`, sondern einen opaken Hintergrund.

### 4.2 Allgemeine Qualitätskriterien
- [x] Build fehlerfrei (`npm run build`).
- [x] Linter fehlerfrei (`npm run lint`).
- [x] Alle Unit- und End-to-End-Tests erfolgreich (`npm test`).

---

## 5. Technische Auswirkungen & Architekturbezug

### 5.1 Betroffene Dateien
- `src/pages/kiosk/KioskPage.tsx`
- `src/components/kiosk/KioskHeader.tsx`
- `src/components/kiosk/KioskScoreboardSlide.tsx`
- `tests/spec074KioskStability.test.ts` (Anpassung der Tests bezüglich Reload-Entfernung)
- `tests/spec075KioskSlideTransition.test.ts`
