# SPEC-017: Entfernung aller "Feld 1"-Anzeigen in der App

> **Status**: Abgeschlossen  
> **Typ**: Refactoring / UI-Bereinigung  
> **Branch**: fix/SPEC-017-entfernung-feld-1-anzeigen  
> **Autor**: Antigravity  
> **Erstellt am**: 2026-10-08  
> **Letzte Änderung**: 2026-10-08  
> **Betroffene Bereiche**: Kiosk (/kiosk)  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Das KBC-Turnier wird traditionell in der Großsporthalle Rüsselsheim auf genau einem Spielfeld (Ein-Platz-Turnier, `courtsCount: 1`) ausgetragen. In der Kiosk-Ansicht für Großbildschirme und Hallen-TVs existieren derzeit noch mehrere Textstellen und Badges, die explizit „Feld 1“ ausweisen:
1. Im Kiosk-Header (`KioskHeader.tsx`) prangt neben dem Turniernamen ein Badge `Feld 1`.
2. Im Kiosk-Scoreboard (`KioskScoreboardSlide.tsx`) lautet der Partiekopf `Spiel #{matchNumber} • Feld {court}` und im Leerzustand steht `Aktuell sind keine weiteren Spiele für Feld 1 angesetzt...`.
3. In der Folie der kommenden Spiele (`KioskUpcomingSlide.tsx`) existiert im Header ein Badge mit Sparkles-Icon `Feld 1` und im Footer der Text `20. Kurt-Becker-Cup • Feld 1`.
4. Im dauerhaften Ticker am unteren Bildschirmrand (`KioskPage.tsx`) lauten die Status-Badges `Live auf Feld 1` bzw. `Pausiert auf Feld 1`.

Da es in der Halle kein zweites Feld gibt, haben diese Angaben keinerlei informativen Nutzen und stiften bei Zuschauern und Teams eher Verwirrung.

### 1.2 Zielzustand & Mehrwert
Sämtliche visuellen Anzeigen von „Feld 1“, „Feld {court}“ sowie Zusätze wie „auf Feld 1“ werden aus der Anwendung entfernt. Die Kiosk-Ansichten wirken dadurch noch aufgeräumter, moderner und sind exakt auf das tatsächliche Einzelhallen-Setup zugeschnitten.

---

## 2. User Stories

- **US-1**: Als **Zuschauer oder Betreuer vor dem Hallen-Bildschirm** möchte ich **auf einen Blick Spielstände, Zeiten und nächste Begegnungen erfassen, ohne durch redundante Angaben wie „Feld 1“ abgelenkt zu werden**, um **die Spielinformationen klar und schnell erfassen zu können**.
- **US-2**: Als **Turnierleitung** möchte ich, **dass das Kiosk-System stimmig und passgenau für unsere Einzelhalle präsentiert wird**, um **ein professionelles Erscheinungsbild zu gewährleisten**.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)
- [x] **KioskHeader (`src/components/kiosk/KioskHeader.tsx`)**:
  - Entfernung des Badges `<span ...>Feld 1</span>` neben dem Turniertitel.
- [x] **KioskScoreboardSlide (`src/components/kiosk/KioskScoreboardSlide.tsx`)**:
  - Anpassung der Match-Pille: `Spiel #{displayMatch.matchNumber}` (Entfernung von ` &bull; Feld {displayMatch.court}`).
  - Anpassung des Hinweistextes im Leerzustand: `Aktuell sind keine weiteren Spiele angesetzt oder der Spielplan wird vorbereitet.` (Entfernung von `für Feld 1`).
- [x] **KioskUpcomingSlide (`src/components/kiosk/KioskUpcomingSlide.tsx`)**:
  - Entfernung des Header-Badges `<span ...><Sparkles ... /> Feld 1</span>`.
  - Bereinigung des rechten Fußzeilen-Textes: `20. Kurt-Becker-Cup` statt `20. Kurt-Becker-Cup &bull; Feld 1`.
  - Entfernung des ungenutzten Imports `Sparkles`.
- [x] **KioskPage Footer-Ticker (`src/pages/kiosk/KioskPage.tsx`)**:
  - Ticker-Badge bei laufendem Spiel: `Live` (mit Radio-Icon) statt `Live auf Feld 1`.
  - Ticker-Badge bei pausiertem Spiel: `Pausiert` (mit Pause-Icon) statt `Pausiert auf Feld 1`.

### 3.2 Explizit Out-of-Scope
- **Datenmodell / Firestore**: Das Feld `court: number` in den Spielobjekten sowie `courtsCount: number` in der Turnierkonfiguration bleiben im Datenmodell und in den TypeScript-Typen (`src/types/database.ts`) unverändert erhalten, um die Abwärtskompatibilität und Service-Logik nicht zu gefährden.
- **Gast-Ansicht & Admin-Bereich**: Diese Ansichten enthalten bereits keine "Feld 1"-Anzeigen mehr (in SPEC-008 bereits aus der `LiveHeroCard` entfernt).

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien

- [x] **AC-1: Kiosk-Header ohne Feld-Badge**
  - **Gegeben sei**: Die Kiosk-Ansicht (`/kiosk`) ist geöffnet.
  - **Wenn**: Der Header gerendert wird.
  - **Dann**: Wird neben dem Turniernamen kein Badge mit der Aufschrift „Feld 1“ angezeigt.

- [x] **AC-2: Kiosk-Scoreboard ohne Feld-Angabe**
  - **Gegeben sei**: Auf dem Kiosk-Bildschirm läuft das Scoreboard-Slide (`activeSlide === 0`).
  - **Wenn**: Ein Spiel live oder pausiert ist.
  - **Dann**: Zeigt das linke Badge über dem Spielstand `Spiel #{matchNumber}` ohne den Zusatz `• Feld 1`.
  - **Und wenn**: Kein Spiel aktiv ist (Turnierpause), lautet der Text: `Aktuell sind keine weiteren Spiele angesetzt oder der Spielplan wird vorbereitet.`.

- [x] **AC-3: Kiosk-Upcoming-Slide ohne Feld-Badge und ohne Fußzeilen-Zusatz**
  - **Gegeben sei**: Auf dem Kiosk-Bildschirm läuft das Vorschau-Slide (`activeSlide === 1`).
  - **Wenn**: Die Folie gerendert wird.
  - **Dann**: Befindet sich neben der Überschrift „Kommende Partien • Spielplan“ kein Badge „Feld 1“.
  - **Und**: In der Fußzeile rechts steht ausschließlich `20. Kurt-Becker-Cup` (ohne `• Feld 1`).

- [x] **AC-4: Kiosk Footer-Ticker Status-Badges**
  - **Gegeben sei**: Ein Spiel befindet sich im Status `live`.
  - **Wenn**: Der permanente Kiosk-Ticker gerendert wird.
  - **Dann**: Zeigt das rote Ticker-Badge `Live` (mit Radio-Icon).
  - **Gegeben sei**: Ein Spiel befindet sich im Status `paused`.
  - **Wenn**: Der permanente Kiosk-Ticker gerendert wird.
  - **Dann**: Zeigt das gelb/amberne Ticker-Badge `Pausiert` (mit Pause-Icon).

### 4.2 Allgemeine Qualitätskriterien
- [x] Keine Fehler beim TypeScript-Check und Build (`npm run build`).
- [x] Keine unbenutzten Imports oder Lint-Warnungen.
- [x] Keine Änderungen am Firestore-Schema.

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Betroffene Komponenten
- [KioskHeader.tsx](file:///Users/thorsten/Code/kbc-turnier/src/components/kiosk/KioskHeader.tsx)
- [KioskScoreboardSlide.tsx](file:///Users/thorsten/Code/kbc-turnier/src/components/kiosk/KioskScoreboardSlide.tsx)
- [KioskUpcomingSlide.tsx](file:///Users/thorsten/Code/kbc-turnier/src/components/kiosk/KioskUpcomingSlide.tsx)
- [KioskPage.tsx](file:///Users/thorsten/Code/kbc-turnier/src/pages/kiosk/KioskPage.tsx)

### 5.2 Vorher / Nachher Vergleich
| Stelle | Vorher | Nachher |
|---|---|---|
| **Kiosk Header** | `20. Kurt-Becker-Cup [Feld 1]` | `20. Kurt-Becker-Cup` |
| **Scoreboard Match Badge** | `Spiel #12 • Feld 1` | `Spiel #12` |
| **Scoreboard Pause-Meldung** | `...keine weiteren Spiele für Feld 1 angesetzt...` | `...keine weiteren Spiele angesetzt...` |
| **Upcoming Slide Header** | `Kommende Partien • Spielplan [✨ Feld 1]` | `Kommende Partien • Spielplan` |
| **Upcoming Slide Footer** | `20. Kurt-Becker-Cup • Feld 1` | `20. Kurt-Becker-Cup` |
| **Kiosk Footer Ticker (Live)** | `🔴 Live auf Feld 1` | `🔴 Live` |
| **Kiosk Footer Ticker (Pausiert)** | `⏸ Pausiert auf Feld 1` | `⏸ Pausiert` |

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Datenmodell (`DATABASE.md`)
- Keine Änderungen an `DATABASE.md` oder Firestore-Schemata.

### 6.2 TypeScript Interfaces (`src/types/`)
- Keine Änderungen.

---

## 7. Verifikations- & Testplan

### 7.1 Manuelle Tests
1. `/kiosk` im Browser aufrufen.
2. Folie 1 (Scoreboard): Prüfen, dass `Spiel #X` ohne `• Feld 1` angezeigt wird.
3. Pause-Zustand prüfen: Text lautet `Aktuell sind keine weiteren Spiele angesetzt oder der Spielplan wird vorbereitet.`.
4. Folie 2 (Upcoming): Header enthält kein "Feld 1"-Badge, Footer rechts zeigt `20. Kurt-Becker-Cup`.
5. Kiosk Header: Enthält kein "Feld 1"-Badge neben dem Turniertitel.
6. Footer Ticker: Prüfen bei laufendem Spiel (`Live`) und pausiertem Spiel (`Pausiert`).

### 7.2 Automatisierte Validierung
- [ ] `npm run build` läuft fehlerfrei durch.
