# SPEC-041: Aktives Spiel & Live-Tag in Grün, Pause in Gelb-Orange, Kiosk-Next Cleanup & Tabellen-Team-Highlight

> **Status**: In Abnahme  
> **Typ**: Optimierung / UI/UX  
> **Branch**: feat/SPEC-041-aktives-spiel-gruen-pause-gelb-tabellen-highlight  
> **Autor**: Antigravity  
> **Erstellt am**: 2026-10-19  
> **Letzte Änderung**: 2026-10-19  
> **Betroffene Bereiche**: Gast-Ansicht (/) | Kiosk (/kiosk) | Turnierleitung (/admin)  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
1. **Farbliche Diskrepanz & Signalwirkung**: Aktive Spiele und Live-Tags werden derzeit stellenweise in Rot bzw. Rose (`rose-500`, `bg-red-50/80`, `border-red-500`) dargestellt. Rot wird im Sport- und UI-Kontext jedoch oft als Verwarnung, Fehler oder Rote Karte wahrgenommen. Zudem läuft die Spielzeitanzeige im Kiosk-Scoreboard bereits in Grün (`emerald-50`, `border-emerald-300`, `text-emerald-700`), wodurch eine visuelle Inkonsistenz besteht.
2. **Pausen-Status**: Wenn ein Spiel unterbrochen bzw. pausiert wird, soll die Hervorhebung klar und einheitlich in ein warmes Gelb-Orange (`amber-500`, `bg-amber-50/80`) wechseln.
3. **Kiosk-Spielplan**: Im Kiosk-Vorrunden- und Finalspielplan wird aktuell das nächste geplante Spiel blau hervorgehoben (`isNext`). Dies lenkt ab und konkurriert optisch mit dem laufenden Spiel. Diese blaue Hervorhebung soll entfallen.
4. **Fehlende Zuordnung in den Tabellen**: In den Gruppen-Tabellen (sowohl auf der Gast-Seite als auch im Kiosk) ist für Zuschauer nicht direkt ersichtlich, welche der Teams gerade auf dem Feld stehen.

### 1.2 Zielzustand & Mehrwert
- **Grüne Live-Akzente**: Das laufende Spiel wird in allen Ansichten (Gast-Hero-Card, Gast-Spielplan, Gast-Finalrunde, Kiosk-Spielpläne, Kiosk-Scoreboard) in harmonischem Grün (analog zur laufenden Spielzeituhr) dargestellt. Alle "LIVE"-Badges erhalten einheitlich grüne Tönung.
- **Gelb-Orange bei Pause**: Bei pausiertem Spiel (`status: "paused"`) schalten die Akzente und Badges auf Gelb-Orange (Amber-Palette) um.
- **Klarer Kiosk-Spielplan**: Das nächste Spiel wird im Kiosk nicht mehr blau eingefärbt; nur das aktive/pausierte Spiel sticht hervor.
- **Team-Highlighting in Tabellen**: In der Gast-Tabellenansicht und im Kiosk-Tabellen-Slide werden Mannschaften, die aktuell ein aktives Spiel bestreiten, optisch hervorgehoben (grüner Akzent bei laufendem Spiel, gelb-orange bei Pause) inklusive dezenter Status-Kennzeichnung.

---

## 2. User Stories

- **US-1**: Als **Zuschauer auf dem Smartphone**, möchte ich laufende Spiele und das LIVE-Tag in Grün und pausierte Spiele in Gelb-Orange sehen, um den Spielzustand intuitiv und augenschonend zu erfassen.
- **US-2**: Als **Zuschauer vor dem Kiosk-TV**, möchte ich im Spielplan keine störende blaue Färbung für Folgespiele sehen, sondern den Fokus voll auf dem aktuellen Spiel haben.
- **US-3**: Als **Turnierbesucher in der Tabellenansicht**, möchte ich sofort erkennen, welche Teams der Tabelle gerade ein Match bestreiten, um deren Tabellensituation im laufenden Geschehen direkt mitzuverfolgen.
- **US-4**: Als **Turnierleiter**, möchte ich in der Spielauswahl und Übersicht einheitliche grüne Live- und gelb-orange Pause-Indikatoren sehen.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)
- [ ] **FR-1: Grünes Farbschema für aktive Spiele (`status: "live"`)**:
  - `KioskGroupStageSlide.tsx` & `KioskFinalsSlide.tsx`: Kartenrand, Hintergrund und Ergebnisbox von Rot auf Emerald (`bg-emerald-50/80`, `border-emerald-500`, `ring-emerald-400`, `bg-emerald-100 text-emerald-800 border-emerald-300`, pulsierender Indikator `bg-emerald-500`).
  - `GuestScheduleView.tsx` & `FinalsBracketView.tsx`: Karten-Highlight von `border-rose-300 bg-rose-50/40 ring-rose-400` auf `border-emerald-300 bg-emerald-50/40 ring-emerald-400`.
- [ ] **FR-2: Einheitlich grüne Live-Badges ("LIVE")**:
  - `LiveHeroCard.tsx`: LIVE-Badge von `bg-rose-500` auf `bg-emerald-600`.
  - `GuestScheduleView.tsx` & `FinalsBracketView.tsx`: LIVE-Tag von `bg-rose-500` auf `bg-emerald-600`.
  - `KioskScoreboardSlide.tsx`: LIVE-Tag von `bg-red-50 border-red-200 text-red-600` und Dot `bg-red-500` auf `bg-emerald-50 border-emerald-200 text-emerald-700` und Dot `bg-emerald-500`.
  - `LiveMatchDesk.tsx`: Status-Icon im Match-Select von `🔴` auf `🟢`.
- [ ] **FR-3: Gelb-Orange Farbschema bei Pause (`status: "paused"`)**:
  - `KioskGroupStageSlide.tsx` & `KioskFinalsSlide.tsx`: Eigene Amber-Stile für pausierte Spiele (`bg-amber-50/80 border-amber-500 ring-amber-400`, Score `bg-amber-100 text-amber-800 border-amber-300`, Dot `bg-amber-500`).
  - In allen Ansichten (Gast, Kiosk, Admin) bleibt/wird Pause mit `amber-500`/`amber-600` dargestellt.
- [ ] **FR-4: Entfernung des blauen Kiosk-Next-Highlights**:
  - In `KioskGroupStageSlide.tsx` und `KioskFinalsSlide.tsx` entfällt die `isNext`-Klasse (`bg-blue-50/80`, `border-blue-500`, etc.). Zukünftige Spiele werden einheitlich neutral dargestellt.
- [ ] **FR-5: Tabellen-Hervorhebung für aktuell spielende Teams**:
  - `StandingsView.tsx` (Gast) & `KioskStandingsSlide.tsx` (Kiosk):
  - Ermittlung aller Teams, die sich in einem aktiven Match befinden (`status === "live"` oder `status === "paused"`).
  - Teams im aktiven Live-Match: Zeilenhintergrund dezent in Grün (`bg-emerald-50/80`), `font-semibold` und hervorgehobener Rang (ohne zusätzliches Text-Badge).
  - Teams im pausierten Match: Zeilenhintergrund dezent in Gelb-Orange (`bg-amber-50/80`), `font-semibold` und hervorgehobener Rang.

### 3.2 Explizit Out-of-Scope
- Keine Änderungen an der Tabellen-Berechnungslogik (`calculateGroupStandings`).
- Keine Änderungen an Firestore-Datenstrukturen.

---

## 4. Akzeptanzkriterien

- [ ] **AC-1: Aktives Spiel im Kiosk-Spielplan**:
  - **Gegeben sei**: Ein Spiel in der Vorrunde oder Finalrunde hat `status === "live"`.
  - **Wenn**: Der Kiosk den Vorrunden- oder Finalspielplan anzeigt.
  - **Dann**: Ist die Zeile in Grün (`emerald-50/80`, `border-emerald-500`) hervorgehoben, der Score hat einen grünen Hintergrund und der pulsierende Punkt ist grün.
- [ ] **AC-2: Pausiertes Spiel im Kiosk-Spielplan**:
  - **Gegeben sei**: Ein Spiel hat `status === "paused"`.
  - **Wenn**: Der Kiosk den Vorrunden- oder Finalspielplan anzeigt.
  - **Dann**: Ist die Zeile in Gelb-Orange (`amber-50/80`, `border-amber-500`) hervorgehoben und der Score ist amber-farben.
- [ ] **AC-3: Kein blaues "Nächstes Spiel" im Kiosk-Spielplan**:
  - **Gegeben sei**: Es gibt ein nächstes geplantes Spiel (`status === "scheduled"`).
  - **Wenn**: Der Kiosk-Spielplan dargestellt wird.
  - **Dann**: Wird dieses nächste Spiel mit neutralem Hintergrund (`bg-white` / `border-slate-200`) wie die übrigen Spiele dargestellt, ohne blaue Umrandung oder blauen Hintergrund.
- [ ] **AC-4: Live-Tag überall grün**:
  - **Gegeben sei**: Ein Spiel ist live.
  - **Wenn**: Die Gast-Ansicht (Hero Card, Spielplan, Finals) oder das Kiosk-Scoreboard betrachtet wird.
  - **Dann**: Ist das "LIVE"-Tag durchgängig in Grün gehalten (kein Rot/Rose mehr).
- [ ] **AC-5: Teams in Tabellen hervorgehoben**:
  - **Gegeben sei**: Team X und Team Y spielen gerade gegeneinander (Match ist live).
  - **Wenn**: Ein Nutzer die Tabellen auf dem Smartphone (`/#standings`) oder am Kiosk (Standings-Slide) öffnet.
  - **Dann**: Sind die Zeilen von Team X und Team Y in ihren jeweiligen Gruppen farblich hervorgehoben (grüner Ton für Live, gelb-orange für Pause, ohne Text-Badge).
  - **Und**: Wird das Spiel pausiert, wechselt die Hervorhebung der beiden Zeilen auf Gelb-Orange.
  - **Und**: Ist kein Spiel aktiv oder wird das Spiel beendet, wird die Zeile wieder ganz normal dargestellt.
- [ ] **AC-6: Code-Qualität**:
  - TypeScript ohne `any`, `npm run build` und `npm run lint` laufen fehlerfrei durch.

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Betroffene Komponenten
1. `src/components/kiosk/KioskGroupStageSlide.tsx`
2. `src/components/kiosk/KioskFinalsSlide.tsx`
3. `src/components/kiosk/KioskScoreboardSlide.tsx`
4. `src/components/kiosk/KioskStandingsSlide.tsx`
5. `src/components/guest/LiveHeroCard.tsx`
6. `src/components/guest/GuestScheduleView.tsx`
7. `src/components/guest/FinalsBracketView.tsx`
8. `src/components/guest/StandingsView.tsx`
9. `src/components/admin/live/LiveMatchDesk.tsx`
10. `src/components/admin/ScheduleManager.tsx`

---

## 6. Technische Auswirkungen & Architekturbezug

- **Datenmodell**: Keine Änderungen, `DATABASE.md` bleibt unverändert.
- **Typen**: Keine neuen Typen erforderlich.
- **Performance**: Ermittlung der aktiven Team-IDs geschieht über ein einfaches Set (`activeMatches.map(...)`), extrem performant O(N) mit N=Matches.

---

## 7. Edge Cases & Fehlerbehandlung

- **Kein aktives Spiel**: Alle Tabellenzeilen werden im normalen Standard-Layout gerendert.
- **Finalrunden-Spiel aktiv**: Die beteiligten Teams werden in den Vorrundentabellen ebenfalls hervorgehoben, falls sie dort aufgeführt sind.
- **Zwei parallele Spiele**: Das Ermitteln über ein Set aller aktiven Teams unterstützt auch eventuell mehrere parallele Spiele ohne Einschränkung.

---

## 8. Verifikations- & Testplan

### 8.1 Manuelle Tests
1. Live-Spiel starten im Admin-LiveDesk (`/admin`).
2. Kiosk aufrufen (`/kiosk`):
   - Scoreboard-Slide: LIVE-Tag in Grün, Uhr in Grün.
   - Vorrunden-Slide: Aktives Spiel in Grün hervorgehoben. Nächstes Spiel neutral (nicht mehr blau).
   - Tabellen-Slide: Die beiden aktiven Teams sind mit grünem Hintergrund/Badge hervorgehoben.
3. Spiel pausieren:
   - Kiosk-Spielplan und Tabellen schalten auf Gelb-Orange um.
4. Gast-Ansicht aufrufen (`/`):
   - Hero-Card: LIVE-Tag grün bzw. PAUSIERT gelb-orange.
   - Spielplan: Aktive Karte grün umrandet, LIVE-Tag grün.
   - Tabellen: Beide Teams farblich hervorgehoben.
5. Spiel beenden: Hervorhebungen in Tabellen und Spielplänen verschwinden sauber.

### 8.2 Automatisierte Validierung
- [ ] `npm run lint` fehlerfrei
- [ ] `npm run build` fehlerfrei
