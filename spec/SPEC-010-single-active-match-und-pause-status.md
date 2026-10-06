# SPEC-010: Exklusiv aktives Spiel & Vollständiger Pausenstatus (Live-Desk, Gast-Ansicht, Kiosk)

> **Status**: In Abnahme  
> **Typ**: Feature & Optimierung  
> **Branch**: `feat/SPEC-010-single-active-match-und-pause-status`  
> **Autor**: Thorsten / Antigravity  
> **Erstellt am**: 2026-10-06  
> **Letzte Änderung**: 2026-10-06  
> **Freigabe**: APPROVED (Entscheidung: Option A – Bestätigungsdialog vor dem Beenden des vorherigen Spiels)  
> **Betroffene Bereiche**: Gast-Ansicht (/) | Turnierleitung (/admin) | Kiosk (/kiosk) | Services/Firestore (`src/services/matchService.ts`)  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Das KBC-Turnier wird auf einem einzigen Spielfeld (Ein-Platz-System, `courtsCount: 1`) ausgetragen. Folglich kann zu jedem Zeitpunkt immer nur **genau ein Spiel** auf dem Spielfeld aktiv sein. Ein Spiel gilt als **aktiv**, solange es entweder läuft (`status: "live"`) oder sich in einer Spielunterbrechung bzw. Pause befindet (`status: "paused"`).

Aktuell existieren in der Anwendung mehrere Inkonsistenzen:
1. **Keine Exklusivität im Live-Desk**: Im Live-Desk (`/admin`) kann die Spieluhr eines Spiels gestartet werden, ohne dass geprüft wird, ob bereits ein anderes Spiel den Status `"live"` oder `"paused"` besitzt. Es ist technisch möglich, versehentlich zwei Spiele gleichzeitig als aktiv in Firestore zu führen.
2. **Inkonsistente Interpretation von `"paused"` in der Gast-Ansicht**:
   - In der `LiveHeroCard` (`/`) wird nur nach `matches.find(m => m.status === "live")` gesucht. Wird ein Spiel pausiert, fällt die Komponente auf `scheduled` zurück und zeigt das pausierte Spiel fälschlicherweise als "Nächstes Spiel" an.
   - Sobald ein Spiel pausiert wird, verschwindet der Spielstand in der `LiveHeroCard` sowie im Spielplan (`GuestScheduleView`) und wird durch ein statisches `"vs"` ersetzt (`isLive || isFinished ? score : "vs"`).
   - In der Spielplan-Übersicht (`GuestScheduleView`) verliert das pausierte Spiel seine Live-Hervorhebung und wirkt wie eine noch nicht gestartete Partie.
3. **Lückenhafte Pausensignalisierung im Kioskmodus (`/kiosk`)**:
   - Auf dem `KioskScoreboardSlide` fehlt im oberen Meta-Badge ein Indikator für den Pausenstatus (dort wird nur `"Live im Spiel"` angezeigt, wenn `status === "live"`).
   - Der permanente Footer-Ticker zeigt bei einem pausierten Spiel weiterhin `"Live auf Feld 1"` mit pulsierendem rotem Punkt, anstatt klar `"Pausiert auf Feld 1"` zu signalisieren.

### 1.2 Zielzustand & Mehrwert
- **Exklusives aktives Spiel**: Zu jedem Zeitpunkt kann im gesamten Turnier nur **ein einziges Spiel** den Status `"live"` oder `"paused"` besitzen. Beim Starten eines Spiels im Live-Desk wird sichergestellt, dass kein anderes Spiel parallel aktiv bleibt.
- **Konsistente Anzeige aktiver & pausierter Spiele**:
   - Wenn ein Spiel pausiert wird, bleibt es **überall** (Live-Desk, Gast-Hero, Gast-Spielplan, Kiosk) das aktive Spiel.
   - Es wird überall unmissverständlich signalisiert, dass das Spiel **pausiert** ist (gelbe/amber Farbcodierung, Badge "PAUSIERT" / "Pause").
- **Dauerhafte Spielstand-Sichtbarkeit**: Der aktuelle Spielstand (`scoreHome : scoreAway`) und die aktuelle Spielminute bleiben während einer Pause in allen Ansichten uneingeschränkt sichtbar und aktuell.

---

## 2. User Stories

- **US-1**: Als **Turnierleiter im Live-Desk** möchte ich sicher sein, dass immer nur genau ein Spiel aktiv sein kann, damit Fehlbedienungen und parallele Spielstände auf dem Ein-Platz-System ausgeschlossen sind.
- **US-2**: Als **Zuschauer oder Team auf der Gast-Website** möchte ich während einer Spielunterbrechung (Auszeit, Verletzung, Schiedsrichter-Rücksprache) weiterhin das aktuelle Spiel mit dem aktuellen Spielstand sehen und sofort erkennen, dass die Partie gerade pausiert ist, damit ich nicht denke, das Spiel sei abgebrochen oder noch gar nicht gestartet.
- **US-3**: Als **Zuschauer in der Halle vor dem Kiosk-Bildschirm** möchte ich auf dem Scoreboard und im Hallen-Ticker deutlich sehen, wenn das Spiel pausiert ist (z. B. "Pausiert" statt "Live"), während der Spielstand und die verbleibende Restzeit gut lesbar eingefroren bleiben.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have / Should-Have)

#### A. Exklusivität des aktiven Spiels (Live-Desk & Services)
- [x] **Definition eines aktiven Spiels**: Ein Spiel ist aktiv, wenn `status === "live" || status === "paused"`.
- [x] **Schutz vor Mehrfach-Aktivierung beim Start (`useLiveMatchDesk` / `LiveMatchDesk`)**:
  - Wenn im Live-Desk für ein Spiel die Spieluhr gestartet wird (`startTimer`), wird geprüft, ob ein **anderes** Spiel in `matches` noch den Status `"live"` oder `"paused"` hat.
  - Falls ja: Das System verhindert das versehentliche Starten mit einem Bestätigungsdialog (Option A: *"Spiel #X ist aktuell noch aktiv/pausiert. Möchtest du Spiel #X zuerst beenden, um Spiel #Y zu starten?"*).
  - Nach Bestätigung wird das bisherige aktive Spiel offiziell beendet (`status: "finished"`), sodass niemals zwei aktive Spiele in Firestore existieren.
- [x] **Automatischer Fokus im Live-Desk**:
  - Wenn ein aktives Spiel (`live` oder `paused`) existiert, wählt der Live-Desk beim Laden dieses Spiel standardmäßig im Dropdown aus.

#### B. Gast-Ansicht: Live-Hero-Card (`src/components/guest/LiveHeroCard.tsx`)
- [x] **Erkennung von pausierten Spielen als aktives Spiel**:
  - Ermittlung des aktuellen Spiels via `matches.find((m) => m.status === "live" || m.status === "paused") || matches.find((m) => m.status === "scheduled")`.
- [x] **Signalisierung des Pausenstatus**:
  - Wenn `currentMatch.status === "paused"`:
    - Status-Badge im Header: Amber/Gelb gestaltet mit Pause-Symbol (`⏸ PAUSIERT • {currentPeriodMinute}. Minute`).
    - Deutliche visuelle Unterscheidung zu `LIVE` (rot/pulsierend) und `scheduled` (blau/Uhrzeit).
- [x] **Permanente Anzeige des Spielstands**:
  - Der Spielstand wird bei `isLive || isPaused || isFinished` immer im Format `${currentMatch.scoreHome} : ${currentMatch.scoreAway}` gerendert.
  - Nur bei `scheduled` wird `"vs"` angezeigt.
- [x] **Live-Ticker-Ereignisse auch bei Pause sichtbar**:
  - Wenn Tore oder Karten vorhanden sind, bleibt die Ereignisliste auch bei `status === "paused"` vollständig sichtbar.

#### C. Gast-Ansicht: Spielplan (`src/components/guest/GuestScheduleView.tsx`)
- [x] **Pausiertes Spiel im Spielplan hervorheben**:
  - Wenn `match.status === "paused"`:
    - Card-Styling: Amber-Rahmen und dezenter Amber-Hintergrund (`border-amber-300 bg-amber-50/40 ring-1 ring-amber-400`).
    - Badge oben rechts: `PAUSIERT` (in Amber/Gelb).
  - Spielstand-Anzeige: Spielstand `${match.scoreHome} : ${match.scoreAway}` wird auch bei `match.status === "paused"` angezeigt.
  - Anzeige der Minute: Die Spielminute `${match.currentPeriodMinute || 1}'` wird auch bei `paused` in Amber angezeigt.

#### D. Kioskmodus (`src/pages/kiosk/KioskPage.tsx` & `src/components/kiosk/KioskScoreboardSlide.tsx`)
- [x] **`KioskScoreboardSlide.tsx`**:
  - Meta-Badge oben: Wenn `displayMatch.status === "paused"`, wird neben den Spiel-Infos ein auffälliges Badge `⏸ PAUSIERT` (amber) angezeigt.
  - Die Uhr-Box zeigt weiterhin wie bisher `Pause / Timeout` mit der eingefrorenen Restzeit.
  - Spielstand `${displayMatch.scoreHome} : ${displayMatch.scoreAway}` bleibt prominent lesbar.
- [x] **Kiosk Ticker-Footer (`KioskPage.tsx`)**:
  - Wenn `liveMatch.status === "paused"`:
    - Das Ticker-Badge links wechselt von rot `"Live auf Feld 1"` zu amber/gelb `"⏸ Pausiert auf Feld 1"`.
    - Der Tickertext zeigt weiterhin den aktuellen Spielstand mit Kennzeichnung: `Spiel #X: TeamA 2 : 1 TeamB (Pausiert)`.

### 3.2 Explizit Out-of-Scope (Nicht Teil dieser Spec)
- Automatischer Timer für Halbzeitpausen (Halbzeiten gibt es beim KBC-Modus mit durchgehenden 20 Minuten nicht).
- Mehrplatz-Support (das Turnier bleibt strikt auf 1 Spielfeld ausgelegt).
- Strafzeiten-Timer / Zeitstrafen-Uhr (Karten werden protokolliert, Zeitstrafen laufen über Schiedsgericht/Handstoppung).

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien

- [x] **AC-1: Genau ein aktives Spiel im Live-Desk**
  - **Gegeben sei**: Spiel #1 hat den Status `live` oder `paused`.
  - **Wenn**: Der Turnierleiter im Live-Desk im Dropdown zu Spiel #2 wechselt und auf "Start" klickt.
  - **Dann**:
    - Das System startet Spiel #2 nicht unkontrolliert parallel.
    - Der Turnierleiter erhält eine Bestätigungsabfrage gemäß Option A (`window.confirm`). Bei Bestätigung wird Spiel #1 automatisch auf `finished` gesetzt und Spiel #2 gestartet.
    - Zu keinem Zeitpunkt sind in Firestore zwei Dokumente mit `status: "live"` oder `status: "paused"` aktiv.

- [x] **AC-2: Spiel pausieren & Anzeige in der Gast Live-Hero-Card**
  - **Gegeben sei**: Spiel #3 läuft (`status: "live"`, Spielstand 2:1, 12. Minute) und wird in der Gast-Ansicht (`/`) als Live-Spiel angezeigt.
  - **Wenn**: Die Turnierleitung im Live-Desk auf "Pause" klickt (`status: "paused"`).
  - **Dann**:
    - Die Gast-Ansicht wechselt **nicht** zu "Nächstes Spiel" oder "Turnierpause".
    - Spiel #3 bleibt das aktive Spiel in der `LiveHeroCard`.
    - Das Header-Badge zeigt in Amber `⏸ PAUSIERT • 12. Minute`.
    - Der Spielstand `2 : 1` bleibt prominent sichtbar.
    - Die Ticker-Ereignisse (Tore, Karten) bleiben unverändert sichtbar.

- [x] **AC-3: Pausiertes Spiel in der Gast-Spielplan-Liste**
  - **Gegeben sei**: Ein Spiel befindet sich im Status `paused` mit Spielstand 3:2.
  - **Wenn**: Ein Gast den Spielplan auf `/` betrachtet.
  - **Dann**:
    - Die Match-Karte ist amber-umrandet hervorgehoben (`ring-amber-400`).
    - Oben rechts prangt ein `PAUSIERT`-Badge.
    - Im Score-Feld steht `3 : 2` (nicht `vs`).
    - Unter dem Score steht die aktuelle Spielminute in Amber.

- [x] **AC-4: Pausiertes Spiel auf dem Kiosk-Scoreboard**
  - **Gegeben sei**: Das Scoreboard auf `/kiosk` (Slide 1) zeigt das aktuelle Spiel.
  - **Wenn**: Das Spiel von der Turnierleitung pausiert wird.
  - **Dann**:
    - Oben in der Meta-Leiste erscheint ein amberfarbenes Badge `⏸ PAUSIERT`.
    - Das zentrale Uhren-Widget zeigt den eingefrorenen Countdown mit der Beschriftung `Pause / Timeout`.
    - Die Spielstände beider Teams (`scoreHome : scoreAway`) bleiben in voller Größe sichtbar.

- [x] **AC-5: Pausiertes Spiel im permanenten Kiosk-Ticker**
  - **Gegeben sei**: Die Kiosk-Ansicht rotiert durch Folien (z. B. Tabelle oder nächste Partien).
  - **Wenn**: Ein Spiel pausiert ist.
  - **Dann**:
    - Der Ticker unten zeigt links ein amberfarbenes Badge `⏸ Pausiert auf Feld 1` (kein rot pulsierendes "Live").
    - Der Tickertext enthält den aktuellen Spielstand mit Kennzeichnung (z. B. `Spiel #2: KHC 1 : 0 RRK (Pausiert)`).

- [x] **AC-6: Fortsetzen des Spiels**
  - **Gegeben sei**: Ein Spiel befindet sich im Status `paused`.
  - **Wenn**: Die Turnierleitung auf "Start" klickt.
  - **Dann**:
    - Der Status wechselt sofort wieder zu `live`.
    - Überall (Live-Desk, Gast-Hero, Spielplan, Kiosk) schalten die Status-Indikatoren synchron wieder auf `LIVE` / rot pulsierend um.
    - Der Spielstand bleibt unverändert erhalten.

### 4.2 Allgemeine Qualitätskriterien
- [x] Keine fest kodierten Werte (gemäß `AGENTS.md`).
- [x] Strikte TypeScript-Typisierung ohne `any`.
- [x] Sauberes Aufräumen aller Firestore-Listener (`unsubscribe`).
- [x] Fehlerfreier Build (`npm run build`).

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Status-Matrix für die UI-Komponenten

| Ansicht & Element | Zustand: `scheduled` | Zustand: `live` | Zustand: `paused` | Zustand: `finished` |
| :--- | :--- | :--- | :--- | :--- |
| **Live-Desk Dropdown** | ⏳ Symbol | 🔴 Symbol | ⏸ Symbol | ✓ Symbol |
| **Live-Desk Scoreboard** | Blaues Badge `GEPLANT` | Grünes Badge `LIVE` (Puls) | Amber Badge `PAUSIERT` | Graues Badge `BEENDET` |
| **Gast Hero-Badge** | Blau: `Nächstes Spiel • {Zeit}` | Rot: `🔴 LIVE • {Min}. Min` | Amber: `⏸ PAUSIERT • {Min}. Min` | (zeigt nächstes Spiel) |
| **Gast Hero-Score** | `vs` | `{ToreH} : {ToreA}` | `{ToreH} : {ToreA}` | `{ToreH} : {ToreA}` |
| **Gast Spielplan-Card** | Standard grau/weiß | Roter Rahmen + Puls-Badge | Amber Rahmen + `PAUSIERT` | Standard, Score fett |
| **Kiosk Scoreboard Top** | Geplanter Anpfiff | Rot `🔴 Live im Spiel` | Amber `⏸ Pausiert` | Endstand |
| **Kiosk Ticker Badge** | Grau `Turnier-Ticker` | Rot `Radio: Live auf Feld 1` | Amber `⏸ Pausiert auf Feld 1` | Grau `Turnier-Ticker` |

### 5.2 Farbgebung & Design-System
- **Live-Zustand**: `rose-500` / `rose-600`, rote Ringe/Hintergründe, dynamischer Ping/Pulse-Effekt.
- **Pausen-Zustand**: `amber-500` / `amber-600` Text & Icons, `amber-50` / `amber-100` Badges und Border `amber-300`, statisch (kein nervöser Pulse, sondern Signalwirkung für Ruhe/Unterbrechung).
- **Icons**: Lucide `Pause` bzw. `Clock` in Amber.

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Datenmodell (`DATABASE.md`)
Das bestehende Datenmodell unterstützt bereits die Typen:
```typescript
export type MatchStatus = "scheduled" | "live" | "paused" | "finished";
```
Es sind **keine** Schemaänderungen in Firestore notwendig. Die bestehenden Status-Werte werden lediglich konsistent und lückenlos ausgewertet.

### 6.2 Match Service & Exklusivitäts-Logik (`src/services/matchService.ts`)
Ergänzung einer Service-Hilfsfunktion zur Sicherstellung der Exklusivität:
```typescript
/**
 * Startet ein Spiel und stellt sicher, dass alle anderen Spiele,
 * die versehentlich noch 'live' oder 'paused' waren, zurückgestellt oder beendet werden.
 */
export async function activateMatchExclusively(
  matchId: string,
  updates: Partial<Match>,
  otherActiveMatches: Match[]
): Promise<void>
```
Alternativ: Direkte Prüfung in `useLiveMatchDesk.ts` mit Warnung/Bestätigung vor dem Status-Update.

### 6.3 Betroffene Dateien
1. `src/hooks/useLiveMatchDesk.ts`: Prüfung vor `startTimer()` gegen aktive Spiele in der Liste.
2. `src/components/admin/live/LiveMatchDesk.tsx`: Automatische Vorwahl von `live || paused` und Übergabe der Exklusivitätslogik.
3. `src/components/guest/LiveHeroCard.tsx`: Einbindung von `status === "paused"` in Match-Selektion, Header-Badge und Score-Anzeige.
4. `src/components/guest/GuestScheduleView.tsx`: Styling und Badges für `status === "paused"`, Beibehaltung der Score-Anzeige.
5. `src/pages/kiosk/KioskPage.tsx`: Ticker-Anpassung für `paused`.
6. `src/components/kiosk/KioskScoreboardSlide.tsx`: Meta-Badge oben für `paused`.

---

## 7. Edge Cases & Fehlerbehandlung

- **Mehrere Admins / parallele Tabs**: Falls ein Admin an Gerät A ein Spiel startet, während Gerät B ein anderes Spiel geöffnet hat, fängt Firestore `onSnapshot` das Event sofort ab; der UI-Status synchronisiert sich in Millisekunden.
- **Direkter Wechsel im Live-Desk Dropdown**: Wählt der Admin ein anderes Spiel aus, während das vorherige pausiert ist, zeigt der Desk das gewählte Spiel an. Klickt er dort auf "Start", warnt das System vor dem noch pausierten Erstspiel.
- **Kein Spiel aktiv**: Wenn kein Spiel `live` oder `paused` ist, fällt das System wie bisher reibungslos auf das nächste `scheduled` Match oder "Turnierpause" zurück.

---

## 8. Verifikations- & Testplan

### 8.1 Manuelle Tests
1. **Live-Desk Einzelaktivität**:
   - Spiel #1 starten (`live`).
   - Im Dropdown zu Spiel #2 wechseln. "Start" anklicken -> Bestätigungsdialog prüfen. Sicherstellen, dass Spiel #1 nicht unbemerkt live weiterläuft.
2. **Pausen-Signalisierung in der Gast-Ansicht**:
   - Spiel #1 im Live-Desk pausieren (`Pause` klicken).
   - Auf `/` prüfen: `LiveHeroCard` bleibt bei Spiel #1, zeigt `PAUSIERT` und Spielstand `X : Y`.
   - Spielplan-Tab prüfen: Spiel #1 hat gelbes/amberfarbenes `PAUSIERT`-Badge und zeigt Spielstand.
3. **Pausen-Signalisierung im Kiosk**:
   - Auf `/kiosk` Slide 1 prüfen: Scoreboard zeigt `⏸ PAUSIERT`, Restzeit steht auf Pause, Spielstand ist sichtbar.
   - Folien durchklicken: Footer-Ticker zeigt `⏸ Pausiert auf Feld 1` mit Spielstand.
4. **Fortsetzen**:
   - Spiel #1 im Live-Desk wieder starten (`Start` klicken).
   - Prüfen, ob alle Ansichten synchron wieder auf `LIVE` (rot) springen.

### 8.2 Automatisierte Validierung
- [ ] TypeScript Compilation: `npm run build` fehlerfrei.
- [ ] Linting: `npm run lint` ohne Fehler.

---

## 9. Offene Fragen & Klärungsbedarf

- **Frage an den Nutzer**: Soll beim Starten eines Spiels im Live-Desk, falls ein anderes Spiel noch aktiv/pausiert ist:
  - **Option A (Empfohlen)**: Ein Bestätigungsdialog erscheinen: *"Spiel #X ist noch aktiv (oder pausiert). Soll Spiel #X beendet werden, um dieses Spiel zu starten?"*
  - **Option B**: Das vorherige aktive Spiel automatisch ohne Nachfrage beendet/pausiert werden?
