# SPEC-036: Entfernung von Rahmen und Hintergrund der Logos in der Gästeansicht

> **Status**: Abgeschlossen  
> **Typ**: Optimierung / UI  
> **Branch**: `feat/SPEC-036-guest-logos-ohne-rahmen-hintergrund`  
> **Autor**: Antigravity  
> **Erstellt am**: 2026-10-13  
> **Letzte Änderung**: 2026-10-13  
> **Betroffene Bereiche**: Gast-Ansicht (`/`)  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
In der Gästeansicht (`/`) werden Teamlogos derzeit in Containern dargestellt, die einen sichtbaren Rand (`border`, `border-2`) sowie einen deckenden Hintergrund (`bg-white`, `bg-slate-50`) und teils Schatten (`shadow-sm`) besitzen. Dies führt zu einer kastenartigen Einrahmung der Logos (oft auch als „Briefmarken-Optik“ wahrgenommen), was insbesondere bei transparenten PNG/SVG/WebP-Vereinswappen unruhig wirkt.

### 1.2 Zielzustand & Mehrwert
In allen Bereichen der Gästeansicht (`/`) werden die Rahmen und der Hintergrund der Logo-Container vollständig entfernt:
- Die Vereinslogos stehen freigestellt auf dem jeweiligen Karten- oder Zeilenhintergrund.
- Die Ausrichtung, Zentrierung und Dimensionierung (`h-16 w-16` / `h-20 w-20` im Live-Hero, `h-9 w-9` in Spielplänen/Finalrunde, `h-7 w-7` in der Tabelle) bleiben exakt erhalten, sodass kein Layout-Shift entsteht.
- Fallback-Anzeigen (z. B. Hockeyschläger-Emoji `🏑`), falls ein Team kein Logo besitzt, bleiben zentriert und harmonisch sichtbar.

---

## 2. User Stories

- **US-1**: Als **Gast/Zuschauer** auf dem Smartphone möchte ich, dass Vereinswappen in allen Ansichten (Live-Scoreboard, Spielplan, Finalrunde und Tabelle) sauber freigestellt ohne Kasten-Rahmen und Hintergrundflächen angezeigt werden, um ein modernes, aufgeräumtes und professionelles Erscheinungsbild zu erleben.
- **US-2**: Als **Zuschauer** möchte ich, dass die Ausrichtung der Teamnamen, Spielstände und Logos zueinander trotz Wegfall der Umrandungen exakt symmetrisch und stabil bleibt.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)
- [x] **Live-Hero-Karte (`LiveHeroCard.tsx`)**:
  - Entfernung von `border-2 border-slate-100`, `bg-white` und `shadow-sm` an den beiden Logo-Containern (Heim- und Gast-Team).
  - Beibehaltung der festen Abmessungen (`h-16 w-16 sm:h-20 sm:w-20`) und Zentrierung (`flex items-center justify-center`).
- [x] **Vorrunden-Spielplan (`GuestScheduleView.tsx`)**:
  - Entfernung von `border border-slate-200` und `bg-slate-50` an den Logo-Containern (Heim- und Gast-Team).
  - Beibehaltung der Abmessungen (`h-9 w-9`) und Abstände (`mr-2 sm:mr-3` bzw. `ml-2 sm:ml-3`).
- [x] **Finalrunden-Ansicht (`FinalsBracketView.tsx`)**:
  - Entfernung von `border border-slate-200` und `bg-slate-50` an den Logo-Containern (Heim- und Gast-Team).
  - Beibehaltung der Abmessungen (`h-9 w-9`) und Abstände (`mr-2 sm:mr-3` bzw. `ml-2 sm:ml-3`).
- [x] **Tabellen-Ansicht (`StandingsView.tsx`)**:
  - Entfernung von `border border-slate-200` und `bg-slate-50` am Team-Logo-Container in jeder Tabellenzeile.
  - Beibehaltung der Abmessungen (`h-7 w-7`) und Ausrichtung in der Tabellenzelle.

### 3.2 Explizit Out-of-Scope (Nicht Teil dieser Spec)
- Kiosk-Ansicht (`/kiosk`) oder Turnierleitung (`/admin`) – diese verfügen über eigene Layouts und bleiben unverändert.
- Keine Änderungen an Backend- oder Storage-Logiken für Team-Logos.

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien
- [x] **AC-1: Live-Hero Scoreboard Logo-Darstellung**
  - **Gegeben sei**: Ein Gast befindet sich auf der Startseite im Tab „Live“.
  - **Wenn**: Ein laufendes oder geplantes Spiel im Hero-Scoreboard angezeigt wird.
  - **Dann**: Haben die Logos von Heim- und Gastteam weder einen Rahmen (`border-slate-100`) noch einen weißen Kasten-Hintergrund (`bg-white`) noch `shadow-sm`. Die Logos sind freigestellt zentriert.

- [x] **AC-2: Vorrunden-Spielplan Logo-Darstellung**
  - **Gegeben sei**: Ein Gast befindet sich im Tab „Vorrunde“.
  - **Wenn**: Die Spiele der Vorrunde aufgelistet werden.
  - **Dann**: Besitzen die Logo-Container links und rechts neben dem Score-Kasten keinen Rahmen (`border-slate-200`) und keinen grauen Hintergrund (`bg-slate-50`).

- [x] **AC-3: Finalrunden-Spielplan Logo-Darstellung**
  - **Gegeben sei**: Ein Gast befindet sich im Tab „Finalrunde“.
  - **Wenn**: Die Spiele der Platzierungs- und Finalrunden aufgelistet werden.
  - **Dann**: Besitzen die Logo-Container neben den Scores keinen Rahmen und keinen Hintergrund.

- [x] **AC-4: Tabellen-Ansicht Logo-Darstellung**
  - **Gegeben sei**: Ein Gast befindet sich im Tab „Tabellen“.
  - **Wenn**: Die Tabellenzeilen der Gruppen gerendert werden.
  - **Dann**: Werden die Team-Logos in der Spalte neben dem Teamnamen ohne Rahmen und ohne Hintergrund dargestellt.

- [x] **AC-5: Fallback-Verhalten bei Teams ohne Logo**
  - **Gegeben sei**: Ein Team besitzt keine `logoUrl`.
  - **Wenn**: Das Team in Live-Hero, Spielplan oder Tabelle dargestellt wird.
  - **Dann**: Wird das Fallback-Icon (`🏑`) weiterhin mittig und unverzerrt an derselben Position gerendert, ohne Rahmen/Hintergrund.

### 4.2 Allgemeine Qualitätskriterien
- [x] Keine fest kodierten Parameter.
- [x] Vollständige TypeScript-Typisierung ohne `any`.
- [x] Fehlerfreier Build (`npm run build`).

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Betroffene Ansichten & Komponenten
- `src/components/guest/LiveHeroCard.tsx`
- `src/components/guest/GuestScheduleView.tsx`
- `src/components/guest/FinalsBracketView.tsx`
- `src/components/guest/StandingsView.tsx`

### 5.2 Tailwind CSS Änderungen im Detail
1. **`LiveHeroCard.tsx`**:
   - Vorher: `relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center overflow-hidden rounded-2xl border-2 border-slate-100 bg-white shadow-sm`
   - Nachher: `relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center overflow-hidden`
2. **`GuestScheduleView.tsx`**:
   - Vorher: `flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 overflow-hidden mr-2 sm:mr-3` (bzw. `ml-2 sm:ml-3`)
   - Nachher: `flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden mr-2 sm:mr-3` (bzw. `ml-2 sm:ml-3`)
3. **`FinalsBracketView.tsx`**:
   - Vorher: `flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 overflow-hidden mr-2 sm:mr-3` (bzw. `ml-2 sm:ml-3`)
   - Nachher: `flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden mr-2 sm:mr-3` (bzw. `ml-2 sm:ml-3`)
4. **`StandingsView.tsx`**:
   - Vorher: `flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-50`
   - Nachher: `flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden`

---

## 6. Technische Auswirkungen & Architekturbezug

- **Datenmodell**: Keine Änderungen notwendig.
- **TypeScript**: Keine neuen Interfaces notwendig.
- **Firestore**: Keine neuen Abfragen oder Listener.
- **Performance**: Minimale Reduktion von DOM-Styling-Last (keine Box-Shadows/Borders mehr).

---

## 7. Edge Cases & Fehlerbehandlung

- **Transparente PNGs**: Werden jetzt nahtlos auf dem jeweiligen Karten- oder Tabellenhintergrund dargestellt.
- **Teams ohne Logo**: Fallback `🏑` bleibt in fester Boxgröße erhalten, kein Zeilenumbruch oder Layout-Verschiebung.

---

## 8. Verifikations- & Testplan

### 8.1 Manuelle Tests
1. [ ] Startseite aufrufen (`/`) und Tab „Live“ prüfen: Hero-Card Logos weisen weder Rahmen noch Hintergrundfarbe auf.
2. [ ] Tab „Vorrunde“ aufrufen: Alle Vorrundenspiele auf fehlerfreie, rahmenlose Logos prüfen.
3. [ ] Tab „Finalrunde“ aufrufen: Alle Final- und Platzierungsspiele prüfen.
4. [ ] Tab „Tabellen“ aufrufen: Ranglisten prüfen, Wappen ohne Kasten/Rahmen.
5. [ ] Responsive Ansicht auf Smartphone- und Desktop-Breite prüfen.

### 8.2 Automatisierte Validierung
- [ ] `npm run build` läuft fehlerfrei durch.

---

## 9. Offene Fragen & Klärungsbedarf
- Keine offenen Fragen.
