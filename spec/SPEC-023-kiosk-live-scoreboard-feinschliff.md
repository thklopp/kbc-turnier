# SPEC-023: Kiosk Live-Scoreboard UI-Feinschliff & Tor-Chronik Bereinigung

> **Status**: Abgeschlossen  
> **Typ**: Optimierung / UI-Design  
> **Branch**: `feat/SPEC-023-kiosk-live-scoreboard-feinschliff`  
> **Autor**: Antigravity Agent  
> **Erstellt am**: 2026-10-11  
> **Letzte Änderung**: 2026-10-11  
> **Betroffene Bereiche**: Kiosk-Modus (`/kiosk`)  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Im Live-Scoreboard des Kiosk-Modus (`/kiosk`) wurden bei der visuellen Prüfung vier Detailpunkte identifiziert:
1. **Buchstaben-Abschneidung bei zweizeiligen Teamnamen**: Durch die CSS-Eigenschaft `line-clamp-2` und enge Zeilenhöhe (`leading-tight`) werden Buchstaben mit Unterlängen (*g, j, p, q, y*) in der zweiten Zeile des Vereinsnamens am unteren Rand abgeschnitten. Es fehlt vertikaler Freiraum nach unten.
2. **Inkonsistente Badges in der Kopfleiste**: Das Tag `Spiel #X` nutzt `font-bold`, während das Phasen-Tag `Vorrunde Gruppe B` mit `font-semibold` formatiert ist. Beide Tags sollen einheitlich formatiert sein.
3. **Unruhige Tor-Chronik**: In der Tor-Chronik unter dem Spielstand stören die Bereichsüberschriften (`🥅 Tore [Team] (Anzahl)`). Zudem sind Spielernummer und Spielername fett (`font-bold`) dargestellt, was das Schriftbild überlädt.
4. **Überflüssiger Hinweistext in der Fußzeile**: In der Kiosk-Fußzeile wird der technische Hinweistext `Ansicht wechselt alle 12s` angezeigt, der für Hallenzuschauer störend und überflüssig ist.

### 1.2 Zielzustand & Mehrwert
- Zweizeilige Vereinsnamen erhalten ausreichenden Abstand nach unten (`leading-normal pb-2`), sodass alle Buchstaben und Unterlängen vollständig sichtbar sind.
- Das Badge `Spiel #X` ist optisch identisch mit dem Gruppen-/Phasen-Badge gestaltet (`font-semibold`).
- Die Tor-Chronik wird übersichtlich und aufgeräumt dargestellt: keine separaten Gruppenüberschriften, Spielernummer und Spielername in normaler Schriftstärke (`font-normal`).
- Die Kiosk-Fußzeile wird von der Rotationszeit-Anzeige bereinigt, der Status "Echtzeit-Synchronisierung aktiv" bleibt erhalten.

---

## 2. User Stories

- **US-1**: Als **Zuschauer vor dem Kiosk-Bildschirm** möchte ich Teamnamen mit Unterlängen (z. B. "Dürkheimer HC") vollständig und unbeschnitten lesen können.
- **US-2**: Als **Zuschauer** möchte ich eine saubere, harmonische Meta-Leiste über dem Scoreboard sehen, in der Spielnummer und Phase einheitlich typografiert sind.
- **US-3**: Als **Zuschauer** möchte ich die Torschützen in einer dezenten, übersichtlichen Aufzählung ohne redundante Überschriften und ohne übertriebene Fettschrift erfassen können.
- **US-4**: Als **Zuschauer** möchte ich im Kiosk-Footer keine unnötigen technischen Taktzeiten ("alle 12s") sehen.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)
- [x] **KioskScoreboardSlide.tsx**:
  - **Freiraum Teamnamen**: Anpassen der Typografie und des Innenabstands bei `home.name` und `away.name` (`leading-normal pb-2`), um Abschneiden von Unterlängen zu verhindern.
  - **Badge "Spiel #X"**: Vereinheitlichen des Stylings mit `phaseLabel` (`rounded-full bg-white border border-slate-200 px-4 py-1.5 text-sm font-semibold text-slate-700 shadow-xs`).
  - **Tor-Chronik Bereinigung**:
    - Entfernen der Überschriften-Blöcke (`🥅 Tore [Team] (Count)`).
    - Entfernen der fetten Schrift bei Spielernummer und Spielername in den Tor-Badges (`font-normal text-slate-800`).
- [x] **KioskPage.tsx**:
  - Entfernen des Elements `<span className="font-mono text-slate-400">Ansicht wechselt alle 12s</span>` aus dem Ticker-Footer.

### 3.2 Explizit Out-of-Scope
- Keine Änderungen an der Rotationslogik oder dem 12-Sekunden-Timer selbst.
- Keine Änderungen an anderen Kiosk-Slides (Upcoming, Standings).
- Keine Änderungen an Gast- oder Admin-Ansichten.

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien
- [x] **AC-1: Teamnamen ohne abgeschnittene Buchstaben**
  - **Gegeben sei**: Ein Vereinsname mit Unterlängen (z. B. "Kreuznacher HC", "Dürkheimer HC", "HG Nürnberg") über zwei Zeilen.
  - **Wenn**: Der Scoreboard-Slide im Kiosk angezeigt wird.
  - **Dann**: Sind alle Buchstaben der 2. Zeile inklusive Unterlängen vollständig sichtbar; es ist ausreichend Platz nach unten vorhanden.

- [x] **AC-2: Einheitliche Formatierung "Spiel #X" und "Vorrunde Gruppe B"**
  - **Gegeben sei**: Das Kopfleisten-Tag `Spiel #X` und das Phasen-Tag `Vorrunde Gruppe B`.
  - **Wenn**: Beide Tags gerendert werden.
  - **Dann**: Besitzen beide exakt die gleichen Klassen: `rounded-full bg-white border border-slate-200 px-4 py-1.5 text-sm font-semibold text-slate-700 shadow-xs`.

- [x] **AC-3: Tor-Chronik ohne Überschriften und ohne Fettschrift**
  - **Gegeben sei**: Mindestens ein erfasstes Tor mit Torschützenname / -nummer.
  - **Wenn**: Die Tor-Chronik im Kiosk gerendert wird.
  - **Dann**: Werden keine Sektions-Überschriften ("Tore Heim / Tore Gast") angezeigt und Spielernummer sowie Name sind nicht fett (`font-normal`).

- [x] **AC-4: Entfernung "Ansicht wechselt alle 12s"**
  - **Gegeben sei**: Die Kiosk-Ansicht `/kiosk`.
  - **Wenn**: Der Footer gerendert wird.
  - **Dann**: Ist der String "Ansicht wechselt alle 12s" nicht mehr im DOM vorhanden.

### 4.2 Allgemeine Qualitätskriterien
- [x] Keine Lint-Fehler (`npm run lint`).
- [x] Erfolgreicher TypeScript- und Vite-Build (`npm run build`).
- [x] Erfolgreiche Testsuite (`npm test`).

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Betroffene Komponenten
- [`src/components/kiosk/KioskScoreboardSlide.tsx`](file:///Users/thorsten/Code/kbc-turnier/src/components/kiosk/KioskScoreboardSlide.tsx)
- [`src/pages/kiosk/KioskPage.tsx`](file:///Users/thorsten/Code/kbc-turnier/src/pages/kiosk/KioskPage.tsx)

---

## 6. Verifikations- & Testplan

### 6.1 Manuelle Tests
1. [ ] `/kiosk` aufrufen und Live-Scoreboard prüfen:
   - Prüfen, ob `Spiel #X` und `Vorrunde Gruppe B` exakt identisch aussehen.
   - Prüfen, ob zweizeilige Vereinsnamen nach unten genügend Platz haben und Unterlängen nicht abgeschnitten werden.
   - Prüfen, ob die Tor-Badges ohne Überschrift und mit normaler Schriftstärke angezeigt werden.
   - Prüfen, ob der Text "Ansicht wechselt alle 12s" im Footer entfernt ist.

### 6.2 Automatisierte Tests / Validierung
- [x] `npm run lint` fehlerfrei.
- [x] `npm run build` fehlerfrei.
- [x] `npm test` fehlerfrei.

---

## 7. Freigabe-Historie

- [x] **1. Gate (Spec-Freigabe)**: Durch PO freigegeben (**`APPROVED`** am 2026-10-11)
- [x] **2. Gate (Merge-Freigabe)**: Durch PO freigegeben (**`MERGE`** am 2026-10-11)
