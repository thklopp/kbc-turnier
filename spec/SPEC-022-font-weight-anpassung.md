# SPEC-022: Globale Anpassung des Font-Weights von 900 auf 500 (font-black zu font-medium)

> **Status**: Abgeschlossen  
> **Typ**: Optimierung / UI-Design  
> **Branch**: `feat/SPEC-022-font-weight-anpassung`  
> **Autor**: Antigravity Agent  
> **Erstellt am**: 2026-10-11  
> **Letzte Änderung**: 2026-10-11  
> **Betroffene Bereiche**: Gesamte Applikation (Gast `/`, Turnierleitung `/admin`, Kiosk `/kiosk`, 404 `/404`)  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Im bisherigen Layout wurde an verschiedenen prominenten Stellen (z. B. Spielstandanzeigen, Uhren/Timer, Tabellenkopf-Elementen, Badges, Teamnamen und Kiosk-Überschriften) die Tailwind-Klasse `font-black` verwendet. `font-black` entspricht dem CSS-Schriftschnitt `font-weight: 900`.

Der Nutzer empfindet diesen Schriftschnitt als zu fett und visuell zu dominant bzw. unharmonisch ("900 ist mir zu fett").

### 1.2 Zielzustand & Mehrwert
- Alle Vorkommen von `font-weight: 900` (`font-black`) in der Anwendung werden auf `font-weight: 500` (`font-medium`) geändert.
- Dies sorgt für ein ausgewogenes, leserliches und typografisch stimmiges Erscheinungsbild sowohl im Web (Gast-Ansicht, Leitstand) als auch auf der Großanzeige (Kiosk).
- Bereits bestehende `font-bold` (700) oder `font-semibold` (600) Auszeichnungen bleiben unverändert; es werden ausschließlich die mit 900 belegten Stellen harmonisiert.

---

## 2. User Stories

- **US-1**: Als **Nutzer/Zuschauer** möchte ich, dass Überschriften, Badges, Tabellen und Spielstände nicht mehr mit übermäßig dicker Schrift (900) gerendert werden, sondern in einem angenehmen mittleren Schnitt (500), damit das Gesamtbild ruhiger und moderner wirkt.
- **US-2**: Als **Turnierleiter** möchte ich im Leitstand und bei den Live-Steuerungen klare und gut lesbare Ziffern und Texte sehen, ohne dass extrem fette Zeichen die Hierarchie stören.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)
- [x] Ersetzen aller Vorkommen der Tailwind-Klasse `font-black` durch `font-medium` in folgenden Komponenten und Seiten:
  - `src/components/admin/live/ScoreboardDisplay.tsx` (Jingle-Buttons, Header, Live-Score, Teamnamen, Timer)
  - `src/components/admin/live/MatchTimerControl.tsx` (Große Spieluhr-Anzeige)
  - `src/components/admin/live/LiveMatchDesk.tsx` (Torschützen-Teamname)
  - `src/components/common/TeamRosterManager.tsx` (Trikotnummern-Warnung/Fehlerbadge)
  - `src/components/guest/LiveHeroCard.tsx` (Live-Match-Card: Spielzeit, Teamnamen, Live/Pause Badges, Spielstand)
  - `src/components/guest/GuestScheduleView.tsx` (Spielplan: Uhrzeit, Badges, Spielstand)
  - `src/components/guest/FinalsBracketView.tsx` (Turnierbaum: Tore/Ergebnisse)
  - `src/components/guest/StandingsView.tsx` (Tabelle: Spaltenkopf PKT, Platzierungs-Badges, Punkte-Pill)
  - `src/components/kiosk/KioskUpcomingSlide.tsx` (Nächste Spiele: Überschrift, Uhrzeiten, Status-Badges, Teamnamen, Spielstand)
  - `src/components/kiosk/KioskHeader.tsx` (Kiosk-Kopfzeile Titel)
  - `src/components/kiosk/KioskStandingsSlide.tsx` (Kiosk-Tabelle: Gruppen-Icon, Gruppe Titel, Spaltenköpfe, Platzierungs-Badges, Teamnamen, Punkte, Slide-Header)
  - `src/components/kiosk/KioskScoreboardSlide.tsx` (Kiosk-Live: Pause-Titel, Badges, Teamnamen, Spielstand, Pausentimer)
  - `src/pages/kiosk/KioskPage.tsx` (Kiosk Header-Statusbadges für Live & Pause)
  - `src/pages/NotFoundPage.tsx` (404-Fehlercode)

### 3.2 Explizit Out-of-Scope
- Keine Änderung von Textfarben (z. B. `text-slate-900`, `text-blue-900`, da `900` dort die Farbhelligkeit und nicht den Schriftschnitt beschreibt).
- Keine Änderung von anderen Schriftschnitten wie `font-bold` (700) oder `font-semibold` (600).
- Keine Änderungen an der Schriftart (`fontFamily.mono` bleibt Chivo Mono).

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien
- [x] **AC-1: Vollständige Bereinigung von `font-black`**
  - **Gegeben sei**: Das Codebase-Repository auf Branch `feat/SPEC-022-font-weight-anpassung`.
  - **Wenn**: Die Suche nach `font-black` in `src/` ausgeführt wird (`grep -rn "font-black" src/`).
  - **Dann**: Gibt es 0 Treffer.

- [x] **AC-2: Einheitlicher `font-medium` Schriftschnitt**
  - **Gegeben sei**: Ein Element, das zuvor mit `font-black` deklariert war (z. B. MatchTimer, Scoreboard-Ziffern, Badges).
  - **Wenn**: Das Element im DOM inspiziert wird.
  - **Dann**: Besitzt es die Klasse `font-medium` (`font-weight: 500`).

### 4.2 Allgemeine Qualitätskriterien
- [x] Keine Lint-Fehler (`npm run lint`).
- [x] Erfolgreicher TypeScript- und Vite-Build (`npm run build`).
- [x] Erfolgreiche Testsuite (`npm test`).

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Betroffene Ansichten & Komponenten
- Alle Ansichten profitieren von der dezenten, aber deutlichen Entlastung der Typografie:
  - Gast-Ansicht (`/`)
  - Turnierleitung (`/admin`)
  - Kiosk (`/kiosk`)
  - 404-Seite (`/404`)

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Datenmodell (`DATABASE.md`)
- Keine Änderungen am Datenmodell.

### 6.2 TypeScript Interfaces (`src/types/`)
- Keine Änderungen an Interfaces.

### 6.3 State & Firestore Listener
- Keine Änderungen an Listenern oder State.

---

## 7. Verifikations- & Testplan

### 7.1 Manuelle Tests
1. [ ] Gast-Startseite öffnen: Live-Scorecard und Tabellen betrachten und prüfen, ob Zahlen und Badges in `font-medium` gerendert werden.
2. [ ] Kiosk aufrufen: Scoreboard- und Upcoming-Slides prüfen.
3. [ ] Admin Leitstand aufrufen: Match-Timer und Tor-Jingle Buttons prüfen.

### 7.2 Automatisierte Tests / Validierung
- [x] `grep -rn "font-black" src/` liefert 0 Treffer.
- [x] `npm run lint` fehlerfrei.
- [x] `npm run build` fehlerfrei.

---

## 8. Freigabe-Historie

- [x] **1. Gate (Spec-Freigabe)**: Durch PO freigegeben (**`APPROVED`** am 2026-10-11)
- [x] **2. Gate (Merge-Freigabe)**: Durch PO freigegeben (**`MERGE`** am 2026-10-11)
