# SPEC-021: Einheitlicher Monospace-Font "Chivo Mono"

> **Status**: In Review  
> **Typ**: Feature / UI-Optimierung  
> **Branch**: `feat/SPEC-021-chivo-mono-font`  
> **Autor**: Antigravity Agent  
> **Erstellt am**: 2026-10-10  
> **Letzte Änderung**: 2026-10-10  
> **Betroffene Bereiche**: Gesamte Applikation (Gast `/`, Turnierleitung `/admin`, Kiosk `/kiosk`, Jingle-Verwaltung `/team/:token`, 404)  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Bisher nutzt die Anwendung für numerische und monospace-formatierte Darstellungen (z. B. Spielstände, Spieluhren/Match-Timer, Tabellenzahlen, Trikotnummern, Zeitstempel) die Standard-Tailwind-Klasse `font-mono`. Diese fällt auf die Standard-Systemschriften des jeweiligen Betriebssystems zurück:
- macOS/iOS rendert *SF Mono* (oder Menlo/Monaco).
- Windows rendert *Consolas*.
- Linux und Android rendern *Liberation Mono* oder andere System-Fonts.

Dadurch unterscheidet sich das visuelle Erscheinungsbild, insbesondere bei großen Ziffern (Kiosk-Großanzeige, Live-Scoreboard, Match-Timer), je nach Endgerät. Zudem weisen einige Standard-Systemschriften abweichende Glyphenbreiten und Zeichenabstände auf.

### 1.2 Zielzustand & Mehrwert
- Auf **allen Plattformen und Endgeräten** soll einheitlich der moderne Monospace-Font **Chivo Mono** verwendet werden.
- Die Einbindung erfolgt **lokal gebündelt** (via `@fontsource-variable/chivo-mono` / Fontsource), sodass:
  1. keine externen Netzwerkanfragen an Drittanbieter (z. B. Google Fonts) erfolgen (100 % DSGVO-konform).
  2. die Schriftarten auch bei Ausfall des Hallen-WLANs oder im Offline-Kiosk-Betrieb zuverlässig geladen und angezeigt werden.
  3. alle benötigten Schriftschnitte (`font-medium`, `font-semibold`, `font-bold`, `font-black`) nahtlos über die Variable-Font-Technologie abgedeckt sind.
- Alle bestehenden `font-mono`-Klassen im Projekt greifen automatisch ohne Änderungen an einzelnen Komponenten auf Chivo Mono zu.

---

## 2. User Stories

- **US-1**: Als **Zuschauer vor dem Kiosk-Bildschirm** möchte ich Spielstände und Timer in einer modernen, klaren und überall konsistenten Schriftart (*Chivo Mono*) sehen, unabhängig davon, auf welchem Betriebssystem der Kiosk-Browser läuft.
- **US-2**: Als **Gast auf dem Smartphone** möchte ich Tabellenzahlen, Spielstände und Torschützenminuten im exakt gleichen Schriftbild sehen wie auf dem Hallen-Monitor.
- **US-3**: Als **Turnierleiter** möchte ich mich darauf verlassen können, dass die Hallenanzeige und der Leitstand auch bei instabiler Internetverbindung in der Halle nicht auf unschöne Fallback-Schriften zurückfallen.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)
- [ ] **Dependency**: Hinzufügen von `@fontsource-variable/chivo-mono` zu `package.json`.
- [ ] **Font-Import**: Einbindung der Variable-Font-Definitionen in `src/main.tsx` (oder zentralem Einstiegspunkt).
- [ ] **Tailwind-Konfiguration**: Erweiterung von `tailwind.config.js` (`theme.extend.fontFamily.mono`), sodass `"Chivo Mono Variable"` bzw. `"Chivo Mono"` an erster Stelle vor den System-Fallbacks steht.
- [ ] **Visuelle Validierung**: Sicherstellen, dass Spielstände (z. B. `text-7xl font-mono font-black`), Spielzeit-Timer, Tabellenspalten und Trikotnummern in allen Ansichten (`/`, `/admin`, `/kiosk`, `/team/:token`) fehlerfrei, ohne Zeilenumbrüche oder Überlappungen dargestellt werden.
- [ ] **Build & Linter**: Erfolgreicher Durchlauf von `npm run build` und `npm run lint`.

### 3.2 Explizit Out-of-Scope
- Kein Austausch der Sans-Serif-Standardschriftart (Texte, Fließtext, Buttons bleiben in der bestehenden Standardschrift).
- Keine Umbenennung oder Anpassung der bestehenden Tailwind-Klassen in den Komponenten (die Klasse `font-mono` bleibt erhalten).

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien
- [ ] **AC-1: Globale Monospace-Schriftart Chivo Mono**
  - **Gegeben sei**: Eine beliebige Ansicht mit `font-mono`-Elementen (z. B. LiveHeroCard, KioskScoreboardSlide, MatchTimerControl).
  - **Wenn**: Ein Element mit der Klasse `font-mono` im Browser gerendert wird.
  - **Dann**: Weist die CSS-Eigenschaft `font-family` als erste Schriftart `"Chivo Mono Variable", "Chivo Mono"` aus und der Font wird aus dem lokalen Bundle geladen.

- [ ] **AC-2: Offline- und Datenschutz-Autonomie**
  - **Gegeben sei**: Die Anwendung wird geladen.
  - **Wenn**: Die Netzwerkanfragen analysiert werden.
  - **Dann**: Werden die Schriftdateien (`.woff2`) ausschließlich aus dem eigenen Build/Host geladen; es erfolgt kein Netzwerkaufruf an `fonts.googleapis.com` oder `fonts.gstatic.com`.

- [ ] **AC-3: Schnitte und Varianten**
  - **Gegeben sei**: Elemente mit unterschiedlichen Schriftgewichten (`font-medium`, `font-bold`, `font-black`).
  - **Wenn**: Diese mit `font-mono` kombiniert sind (z. B. Kiosk-Score mit `font-black font-mono`).
  - **Dann**: Rendert Chivo Mono mit dem entsprechenden Strichstärken-Gewicht sauber und ohne synthetisches "Faux-Bold".

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Betroffene Ansichten & Komponenten
- **Gast-Ansicht (`/`)**:
  - `LiveHeroCard.tsx` (Score, Minute, Torschützen)
  - `GuestScheduleView.tsx` (Uhrzeiten, Endstände)
  - `StandingsView.tsx` (Tore, Differenz, Punkte)
  - `FinalsBracketView.tsx` (Ergebnisse)
- **Turnierleitung (`/admin`)**:
  - `MatchTimerControl.tsx` (Großer Countdown/Timer)
  - `ScoreboardDisplay.tsx` (Zentraler Spielstand)
  - `LiveMatchDesk.tsx` (Spieluhr, Zwischenstände)
  - `TeamRosterManager.tsx` (Trikotnummern)
- **Kiosk (`/kiosk`)**:
  - `KioskScoreboardSlide.tsx` (Riesige Toranzeige, Timer, Torschützen)
  - `KioskStandingsSlide.tsx` (Tabelle, Kennzahlen)
  - `KioskUpcomingSlide.tsx` (Uhrzeiten, Spielpaarungen)
- **Sonstige**:
  - `TeamJinglePage.tsx` (Millisekunden-Offset, Dauer)
  - `NotFoundPage.tsx` (404-Code)

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Datenmodell (`DATABASE.md`)
- Keine Änderungen erforderlich (reines Frontend-Styling / Asset-Bundling).

### 6.2 TypeScript Interfaces (`src/types/`)
- Keine Änderungen erforderlich.

### 6.3 Tailwind Configuration (`tailwind.config.js`)
Erweiterung von `theme.extend`:
```javascript
export default {
  // ...
  theme: {
    extend: {
      fontFamily: {
        mono: [
          '"Chivo Mono Variable"',
          '"Chivo Mono"',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          '"Liberation Mono"',
          '"Courier New"',
          'monospace',
        ],
      },
      // ...
    },
  },
}
```

### 6.4 Paket- und Asset-Management
- Neues Paket: `@fontsource-variable/chivo-mono` (in `package.json` unter `dependencies`).
- Import in `src/main.tsx`:
  ```typescript
  import "@fontsource-variable/chivo-mono";
  ```

---

## 7. Edge Cases & Fehlerbehandlung

- **Fallback bei sehr alten Browsern:** Falls ein veralteter Browser keine Variable Fonts unterstützt, greifen die definierten Fallbacks des Stacks (`ui-monospace`, `Consolas`, etc.).
- **Font-Flicker / FOIT / FOUT:** Da die Schriftart lokal gebündelt ist und per Vite ausgeliefert wird, erfolgt das Laden synchron bzw. minimal verzögert mit dem initialen CSS-Bundle.

---

## 8. Verifikations- & Testplan

### 8.1 Manuelle Tests
1. [ ] Gast-Ansicht öffnen (`/`): Prüfen, ob Spielstände und Tabellenwerte in Chivo Mono gerendert werden.
2. [ ] Kiosk-Ansicht öffnen (`/kiosk`): Großanzeige von Score und Timer auf saubere Zifferndarstellung prüfen.
3. [ ] Admin-Live-Desk öffnen (`/admin`): Match-Timer und Toreingabe prüfen.
4. [ ] Offline-Modus im Browser simulieren: Überprüfen, dass die Schriftarten ohne Fehler aus dem lokalen Cache/Server geladen werden.

### 8.2 Automatisierte Validierung
- [ ] `npm run lint` fehlerfrei.
- [ ] `npm run build` fehlerfrei.

---

## 9. Offene Fragen & Klärungsbedarf
- Keine offenen Fragen.
