# SPEC-030: Finalrunde in Gästeansicht nach Spielnummer sortieren und Zwischenüberschriften entfernen

> **Status**: In Abnahme  
> **Typ**: Optimierung / UI-Redesign  
> **Branch**: feat/SPEC-030-finalrunde-sortierung-und-clean-layout  
> **Autor**: Antigravity Agent  
> **Erstellt am**: 2026-10-12  
> **Letzte Änderung**: 2026-10-12  
> **Betroffene Bereiche**: Gast-Ansicht (/) – `FinalsBracketView.tsx`  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Auf der Seite **Finalrunde** der Gästeansicht (`/#finals` / `FinalsBracketView.tsx`) wurden die Finalspiele bisher nicht nach Spielnummer bzw. chronologischer Reihenfolge angezeigt, sondern:
1. Nach Geschlecht gruppiert (erst alle 8 wU14-Spiele, danach alle 8 mU14-Spiele),
2. Innerhalb jedes Geschlechts durch Zwischenüberschriften („Halbfinals“ und „Medaillenspiele & Endplatzierungen“) unterteilt.

Dadurch traten folgende Probleme auf:
- In der Gesamtansicht („Alle“) wurden wU14 und mU14 blockweise getrennt, obwohl die Spiele am Turniertag im 2er-Wechsel stattfinden.
- Halbfinals wurden vor den Platzierungsspielen gerendert, obwohl die Platzierungsspiele (Spiele #25–#28) zeitlich und von der Spielnummer her vor den Halbfinals (#29–#32) ausgetragen werden.
- Die Zwischenüberschriften erzeugten unnötigen visuellen Ballast auf Mobil- und Desktop-Geräten.

### 1.2 Zielzustand & Mehrwert
- **Sortierung nach Spielnummer**: Alle Finalspiele werden streng aufsteigend nach `matchNumber` sortiert (Spiele #25 bis #40), sodass der reale chronologische Ablauf des Finaltags abgebildet wird.
- **Entfernung der Zwischenüberschriften**: Die Abschnitte „Halbfinals“ und „Medaillenspiele & Endplatzierungen“ sowie die Geschlechter-Zwischenüberschriften werden vollständig entfernt.
- **Einheitliches Layout**: Die Spiele werden in einem konsistenten 2-Spalten-Grid (`grid grid-cols-1 md:grid-cols-2 gap-3.5`) analog zur Vorrundenansicht (`GuestScheduleView.tsx`) dargestellt.
- **Kategorie-Filter**: Die Umschalter „Alle“, „wU14“ und „mU14“ bleiben voll funktionsfähig und filtern die nach Spielnummer sortierten Finalspiele.

---

## 2. User Stories

- **US-1 (Gast / Zuschauer)**: Als **Zuschauer auf dem Smartphone** möchte ich die Finalspiele in der tatsächlichen chronologischen Reihenfolge nach Spielnummer sortiert sehen, um sofort zu erfassen, welches Spiel als Nächstes stattfindet.
- **US-2 (Gast / Zuschauer)**: Als **Gast** möchte ich eine aufgeräumte Ansicht ohne redundante Zwischenüberschriften, damit die Spielkarten kompakt und übersichtlich dargestellt werden.
- **US-3 (Team / Fan)**: Als **Unterstützer eines wU14- oder mU14-Teams** möchte ich weiterhin nach Kategorie filtern können, wobei auch im gefilterten Zustand die Spielnummernsortierung strikt gewahrt bleibt.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)
- [x] **Sortierung nach Spielnummer**: Finalspiele (`m.phase === 'final' || m.matchNumber > 24`) werden strikt mit `(a, b) => a.matchNumber - b.matchNumber` sortiert.
- [x] **Kategorie-Filter**: Filterung nach `selectedCategory` („all“, „wU14“, „mU14“) behält die `matchNumber`-Sortierung bei.
- [x] **Entfernung aller Zwischenüberschriften**:
  - Wegfall von `Halbfinals ({gender})` und zugehörigem `Sparkles`-Icon.
  - Wegfall von `Medaillenspiele & Endplatzierungen ({gender})` und zugehörigem `Medal`-Icon.
- [x] **Kompakte Kopfzeile / Counter**: Analog zu `GuestScheduleView.tsx` Anzeige von:
  - Titel: `Finalspiele` bzw. `Finalspiele (wU14)` / `Finalspiele (mU14)`
  - Badge mit Anzahl: `X Spiele` / `1 Spiel`
- [x] **Grid-Layout**: Einheitliches responsives Grid (`grid grid-cols-1 md:grid-cols-2 gap-3.5`).
- [x] **Spielbezeichnung & Tags**: Beibehaltung der detaillierten Match-Header (Uhrzeit, Geschlechter-Badge, Match-Badge wie „Finale“, „Halbfinale 1“, „Spiel um Platz 3“ etc.).

### 3.2 Explizit Out-of-Scope
- Änderungen am Datenmodell oder an den Spielplan-Generierungs-Services (diese sind bereits in SPEC-029 umgesetzt).
- Änderungen an Kiosk- oder Admin-Ansichten.

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien
- [x] **AC-1: Sortierung nach Spielnummer in der Ansicht „Alle“**
  - **Gegeben sei**: Der Nutzer befindet sich auf der Seite `/#finals` mit ausgewähltem Tab „Alle“.
  - **Wenn**: Die Seite geladen wird.
  - **Dann**: Werden alle 16 Finalspiele fortlaufend von Spiel #25 bis Spiel #40 in aufsteigender Reihenfolge angezeigt.
- [x] **AC-2: Sortierung nach Spielnummer bei aktivem Geschlechter-Filter**
  - **Gegeben sei**: Der Nutzer wählt den Filter „wU14“ oder „mU14“.
  - **Wenn**: Der Filter aktiv ist.
  - **Dann**: Werden nur die Spiele der gewählten Kategorie angezeigt, weiterhin strikt aufsteigend nach `matchNumber` sortiert.
- [x] **AC-3: Keine Zwischenüberschriften im Content-Bereich**
  - **Gegeben sei**: Der Nutzer betrachtet die Finalrunden-Spiele.
  - **Wenn**: Die Match-Karten dargestellt werden.
  - **Dann**: Gibt es zwischen den Spielkarten keine trennenden Zwischenüberschriften mehr, sondern einen durchgängigen Grid-Fluss.
- [x] **AC-4: Header-Information konsistent zu Vorrunde**
  - **Gegeben sei**: Die Finalrunde wird angezeigt.
  - **Wenn**: Spiele vorhanden sind.
  - **Dann**: Zeigt die obere Infoleiste „Finalspiele“ (bzw. mit Geschlecht in Klammern) und die Spielanzahl im Badge an.

### 4.2 Allgemeine Qualitätskriterien
- [x] Vollständige TypeScript-Typisierung ohne `any`.
- [x] Fehlerfreie Ausführung von `npm run build` und `npm run lint`.
- [x] Beibehaltung aller Live-Status- und Score-Anzeigen der Matchkarten.

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Betroffene Komponente
- `src/components/guest/FinalsBracketView.tsx`

### 5.2 Layout-Struktur
1. **Kategorie-Switcher** (Alle | wU14 | mU14)
2. **Kompakte Kopfzeile** mit Spielanzahl-Badge
3. **Responsive Grid**:
   - Mobile: 1 Spalte (`grid-cols-1`)
   - Tablet / Desktop: 2 Spalten (`md:grid-cols-2`)
4. **Empty State**: Anzeige bei noch keinen generierten Finalspielen („Noch keine Finalspiele generiert.“).

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Datenmodell (`DATABASE.md`)
- Keine Änderungen erforderlich.

### 6.2 TypeScript Interfaces (`src/types/`)
- Keine Änderungen erforderlich.

---

## 7. Edge Cases & Fehlerbehandlung
- **Leere Finalspiele-Liste**: Zeigt wie bisher eine saubere Hinweismeldung im Empty State.
- **Matches ohne matchName**: Fallback auf `m.finalType` bzw. „Finalspiel“ greift wie gehabt zuverlässig.

---

## 8. Verifikations- & Testplan

### 8.1 Manuelle Tests
1. [ ] Aufrufen von `/#finals` in der Gästeansicht.
2. [ ] Prüfen, dass Spiele streng von #25 bis #40 sortiert sind.
3. [ ] Umschalten auf „wU14“ und „mU14“: Prüfen der Filterung und Beibehaltung der Spielnummernsortierung.
4. [ ] Prüfen, dass keine Zwischenüberschriften („Halbfinals“, „Medaillenspiele“) mehr vorhanden sind.
5. [ ] Responsive Ansicht auf Mobilgröße prüfen.

### 8.2 Automatisierte Tests / Validierung
- [ ] `npm run lint` und `npm run build` fehlerfrei.
