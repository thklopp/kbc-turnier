# SPEC-024: Kiosk-Modus Seiten-Redesign & Struktur-Anpassung

> **Status**: Abgenommen  
> **Typ**: Feature / Refactoring / UI-Optimierung  
> **Branch**: `feat/SPEC-024-kiosk-seiten-redesign`  
> **Autor**: Antigravity  
> **Erstellt am**: 2026-10-11  
> **Letzte Änderung**: 2026-10-11  
> **Betroffene Bereiche**: Kiosk (`/kiosk`)

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Der Kiosk-Modus (`/kiosk`) ist für Großbildschirme und Hallen-TVs konzipiert. Die bisherige Struktur besteht aus den Folien „Live-Scoreboard“, „Nächste Partien“ (zeigt nur 4 Spiele) sowie zwei separaten Folien für „Tabelle wU14“ und „Tabelle mU14“. 
Zudem ist das Live-Scoreboard horizontal zu gedrängt für lange Vereinsnamen, enthält überflüssige vertikale Linien und Textzusätze unter den Vereinsnamen, und es fehlt eine kompakte Gesamtübersicht aller Gruppenspiele und Finalspiele ohne Scroll-Notwendigkeit.

### 1.2 Zielzustand & Mehrwert
1. **Folie 1: „Live“** (umbenannt von „Live-Scoreboard“):
   - Neuer Tag mit der Startzeit / Anpfiffzeit oben in der Meta-Leiste.
   - Entfernung der vertikalen Trennstriche (`border-x`) um das Ergebnis.
   - Entfernung der Subline unter den Vereinsnamen („Gruppe X • Heim/Gast“).
   - Maximal verbreiterter Container; Logos auf gleicher Höhe wie das Ergebnis; Vereinsnamen darunter zentriert auf identischer horizontaler Basislinie mit deutlich mehr Platz.
   - Vertikal leicht nach oben gerückt, um maximale Fläche für die Tor- und Ereignis-Chronik bereitzustellen.
2. **Folie 2: „Vorrunde“** (umbenannt von „Gruppenphase“):
   - Kompakte 2-Spalten-Auflistung aller 24 Spiele der Vorrunde (linke Spalte Spiele 1–12, rechte Spalte Spiele 13–24).
   - Feste tabellarische Ausrichtung mit sauber untereinanderstehenden Ergebnissen: `[Uhrzeit] [Geschlecht] [Gruppe] [Heim-Name + Logo rechtsbündig] [Tore : Tore / - : -] [Logo + Gast-Name linksbündig]`.
   - Aktives Spiel rot hervorgehoben (softe Tönung `bg-red-50/border-red-500`), nächstes Spiel blau hervorgehoben (`bg-blue-50/border-blue-500`).
   - Garantiert scrollfrei auf Full-HD (1920x1080).
3. **Folie 3: „Finalrunde“** (umbenannt von „Finalphase“):
   - 2-Spalten-Auflistung aller 16 Finalspiele (je 8 Spiele pro Spalte).
   - Identisches tabellarisches Zeilenraster wie in der Vorrunde, jedoch anstelle des Gruppen-Tags ein kompakter Spielnamen-Badge (z. B. `[HF 1]`, `[HF 2]`, `[Platz 7]`, `[Platz 5]`, `[Platz 3]`, `[Finale]`).
   - Gleiche Status-Hervorhebungen (Rot = Aktiv, Blau = Nächstes).
4. **Folie 4: „Tabellen“** (zusammengefasst):
   - Alle 4 Gruppentabellen in einer 2x2-Matrix auf einer einzigen Folie:
     - Links oben: wU14 Gruppe A, links unten: wU14 Gruppe B.
     - Rechts oben: mU14 Gruppe A, rechts unten: mU14 Gruppe B.
   - Vollständige Statistiken (`#`, Logo, Team, `Sp`, `S`, `U`, `N`, `Tore`, `Diff`, `Pkt`) bei kompakter Zeilenhöhe ohne Scrollen.
5. **Footer-Leiste**:
   - Die Fußleiste wurde komplett entfernt, um den vollen vertikalen Bildschirmplatz den Folien zur Verfügung zu stellen.
6. **Karussell-Steuerung**:
   - Einheitliche 4-Folien-Rotation: `1. Live`, `2. Vorrunde`, `3. Finalrunde`, `4. Tabellen`.

---

## 2. User Stories

- **US-1 (Kiosk-Zuschauer)**: Als Zuschauer in der Halle möchte ich auf der Live-Folie sofort den Spielstand, die Logos und die Torschützen sehen, ohne dass lange Vereinsnamen abgeschnitten sind oder unnötige Linien das Bild überladen.
- **US-2 (Kiosk-Zuschauer)**: Als Zuschauer möchte ich auf einen Blick alle Spiele der Gruppenphase (bzw. Finalphase) nebeneinander sehen können, ohne scrollen zu müssen, und sofort erkennen, welches Spiel gerade läuft (rot) und welches als Nächstes ansteht (blau).
- **US-3 (Kiosk-Zuschauer)**: Als Zuschauer möchte ich auf der Tabellen-Folie den aktuellen Stand aller vier Gruppen gleichzeitig überblicken können, ohne auf die nächste Folie warten zu müssen.
- **US-4 (Turnierleitung)**: Als Turnierleitung möchte ich, dass der Kiosk-Modus auf dem Hallenfernseher aufgeräumt und professionell wirkt und im Footer jederzeit das nächste bzw. aktive Spiel gut lesbar zentriert darstellt.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)
- [x] **Folie 1: Live**:
  - Umbenennung des Slide-Titels im Header und Code auf `Live`.
  - Hinzufügen eines Startzeit-Tags in der oberen Leiste (z. B. `10:00 Uhr`).
  - Entfernung der vertikalen Begrenzungslinien (`border-x border-slate-200`) links und rechts des Spielstands.
  - Entfernung der Gruppen-/Heim-/Gast-Zusatztexte unter den Vereinsnamen.
  - Verbreiterung des Containers (`max-w-[calc(96rem+100px)]` / `w-full px-6`).
  - Logos und Spielstand auf identischer horizontaler Höhe.
  - Vereinsnamen unter den Logos zentriert auf identischer Ausgangshöhe.
  - Höhere vertikale Positionierung der Match-Karte zur Schaffung von zusätzlichem Raum für die Torschützen- und Ereignis-Chronik.
- [x] **Folie 2: Vorrunde**:
  - Umbenennung des Slide-Titels auf `Vorrunde`.
  - Filterung aller Vorrundenspiele (`phase === "group"` bzw. `matchNumber <= 24`).
  - 2 Spalten: Spalte 1 = Spiele 1 bis 12, Spalte 2 = Spiele 13 bis 24.
  - Jede Zeile: `[Uhrzeit] [Geschlecht-Badge] [Gruppe-Badge] [Heim-Name + Logo] [Score Heim : Score Gast / - : -] [Logo + Gast-Name]`.
  - Ausrichtung: Heim-Name & Logo rechtsbündig, Gast-Logo & Name linksbündig, Spielstand monospaced exakt in der Mitte zentriert.
  - Status-Hervorhebung:
    - Aktives Spiel (`status === "live" | "paused"`): `border-red-500 bg-red-50/60 ring-1 ring-red-400`.
    - Nächstes Spiel (`status === "scheduled"` als erstes Folgespiel): `border-blue-500 bg-blue-50/50 ring-1 ring-blue-400`.
  - Optimierung der Zeilenhöhe und Typografie, sodass alle 12 Zeilen ohne vertikales Scrollen auf 1080p passen.
- [x] **Folie 3: Finalrunde**:
  - Neue Komponente `KioskFinalsSlide`.
  - Filterung aller Finalspiele (`phase === "final"` bzw. `matchNumber > 24`, 16 Spiele).
  - 2 Spalten: je 8 Spiele pro Spalte.
  - Identische Ausrichtung wie Vorrunde, aber anstelle des Gruppe-Tags ein kompakter Spielnamen-Badge (z. B. `HF 1`, `HF 2`, `Platz 7`, `Platz 5`, `Platz 3`, `Finale` mit Trophy-Icon).
  - Status-Hervorhebung (Aktiv = Rot, Nächstes = Blau).
- [x] **Folie 4: Tabellen**:
  - Neue Komponente bzw. Refaktorisierung von `KioskStandingsSlide`.
  - 2x2 Grid-Layout:
    - Links oben: wU14 Gruppe A
    - Links unten: wU14 Gruppe B
    - Rechts oben: mU14 Gruppe A
    - Rechts unten: mU14 Gruppe B
  - Anzeige aller Spalten (`#`, Logo, Team, `Sp`, `S`, `U`, `N`, `Tore`, `Diff`, `Pkt`).
  - Kompaktes Layout ohne vertikales Scrollen.
- [x] **Footer-Bereich**:
  - Die Fußleiste wurde komplett entfernt, damit der Kiosk-Modus maximale vertikale Fläche für die Folieninhalte bietet.
- [x] **Header & Rotation**:
  - Folien-Namen im Header: `Live`, `Vorrunde`, `Finalrunde`, `Tabellen`.
  - Rotation schaltet alle 4 Folien nacheinander durch.

### 3.2 Explizit Out-of-Scope
- Änderung der Turnierlogik oder Firestore-Datenstrukturen (alle Felder existieren bereits).
- Manuelle Editierfunktionen im Kiosk (Kiosk ist strikt Read-Only).

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien
- [x] **AC-1: Folien-Navigation & Bezeichnungen**
  - **Gegeben sei**: Die Kiosk-Ansicht `/kiosk` wird geöffnet.
  - **Wenn**: Der Header betrachtet wird.
  - **Dann**: Sind genau vier Folien-Buttons vorhanden: `Live`, `Vorrunde`, `Finalrunde`, `Tabellen`. Die Rotation durchläuft diese vier Folien.
- [x] **AC-2: Live-Scoreboard Layout & Startzeit**
  - **Gegeben sei**: Ein Spiel ist live oder geplant.
  - **Wenn**: Die Folie `Live` angezeigt wird.
  - **Dann**: 
    1. Ist oben ein Tag mit der geplanten Startzeit sichtbar (z. B. `10:00 Uhr`).
    2. Existieren keine vertikalen Linien zwischen Vereinsname und Ergebnis.
    3. Gibt es keine Sublines unter den Vereinsnamen.
    4. Sind beide Vereinslogos gleich groß und auf horizontaler Höhe mit dem Ergebnis platziert.
    5. Befinden sich die Vereinsnamen zentriert unter den Logos und beginnen auf derselben Höhe.
    6. Steht ausreichend vertikaler Raum für die Torschützen zur Verfügung.
- [x] **AC-3: Gruppenphase 24 Spiele scrollfrei**
  - **Gegeben sei**: Es liegen 24 Vorrundenspiele vor.
  - **Wenn**: Die Folie `Vorrunde` angezeigt wird.
  - **Dann**:
    1. Werden links Spiele 1–12 und rechts Spiele 13–24 angezeigt.
    2. Stehen alle Ergebnisse (`X : Y` bzw. `- : -`) vertikal exakt untereinander.
    3. Ist das aktive Spiel rot und das nächste Spiel blau hinterlegt/gerahmt.
    4. Gibt es bei 1920x1080 Bildschirmhöhe keine Scrollbalken.
- [x] **AC-4: Finalphase 16 Spiele mit Spielnamen**
  - **Gegeben sei**: Es liegen 16 Finalspiele vor.
  - **Wenn**: Die Folie `Finalrunde` angezeigt wird.
  - **Dann**:
    1. Werden je 8 Spiele pro Spalte dargestellt.
    2. Wird anstelle einer Gruppe der kompakte Spielname (`HF 1`, `HF 2`, `Platz 7`, `Platz 5`, `Platz 3`, `Finale`) dargestellt.
    3. Die Ergebnisse sind identisch sauber zentriert ausgerichtet.
- [x] **AC-5: Vier Tabellen auf einer Seite**
  - **Gegeben sei**: Die Folie `Tabellen` ist aktiv.
  - **Wenn**: Der Bildschirm betrachtet wird.
  - **Dann**:
    1. Befinden sich links wU14 Gruppe A (oben) und wU14 Gruppe B (unten).
    2. Befinden sich rechts mU14 Gruppe A (oben) und mU14 Gruppe B (unten).
    3. Alle vier Tabellen enthalten die Spalten `#`, Logo, Team, `Sp`, `S`, `U`, `N`, `Tore`, `Diff`, `Pkt`.
    4. Die Folie passt ohne Scrollen auf einen 1080p TV.
- [x] **AC-6: Footer & Vollbild**
  - **Gegeben sei**: Der Kiosk läuft auf einer beliebigen Folie.
  - **Wenn**: Der Bildschirm betrachtet wird.
  - **Dann**: Bietet die Folie die volle vertikale Bildschirmhöhe ohne störende Fußleiste.

### 4.2 Allgemeine Qualitätskriterien
- [x] Keine fest kodierten Parameter gemäß `AGENTS.md`.
- [x] Vollständige TypeScript-Typisierung ohne `any`.
- [x] Fehlerfreier Build mit `npm run build`.
- [x] Firestore-Listener sauber aufgeräumt.

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Betroffene Komponenten
- `src/pages/kiosk/KioskPage.tsx`: Folien-Verwaltung, SLIDE_NAMES, Slide-Switch, Footer-Layout.
- `src/components/kiosk/KioskScoreboardSlide.tsx`: Layout-Optimierung, Startzeit-Badge, Entfernung Linien & Subline, Anordnung Logos/Namen.
- `src/components/kiosk/KioskUpcomingSlide.tsx` (wird zu `KioskGroupStageSlide.tsx` oder überarbeitet): 2-Spalten Vorrunden-Übersicht (24 Spiele).
- `src/components/kiosk/KioskFinalsSlide.tsx` (neu): 2-Spalten Finalrunden-Übersicht (16 Spiele).
- `src/components/kiosk/KioskStandingsSlide.tsx`: 2x2 Grid für alle 4 Gruppen auf einer Seite.
- `src/components/kiosk/KioskHeader.tsx`: Aktualisierung der Folienauswahl & Labels.

### 5.2 Layout-Raster 1080p
- Gesamthöhe: 1080px (Vollbild-TV).
- Header: ca. 70px.
- Footer: ca. 60px.
- Slide Content Area: ca. 920px verfügbare Höhe.
  - Bei 12 Zeilen in der Gruppenphase: ca. 60px pro Zeile inkl. Gaps (passt perfekt mit `py-1.5` bis `py-2` und Textgröße `text-xs`/`text-sm`).
  - Bei 8 Zeilen in der Finalphase: ca. 90px pro Zeile.
  - Bei 2x2 Tabellen: jede Tabelle hat Header + 4 Teamzeilen (5 Zeilen à ca. 36px = ~180px + Padding = ~280px pro Tabelle, Gesamthöhe ca. 600px).

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Datenmodell
Keine Änderungen am Datenmodell erforderlich. Alle benötigten Daten (`matches`, `teams`, `TournamentConfig`, `matchName`, `finalType`, `scheduledTime`) sind im Schema vorhanden.

### 6.2 TypeScript Interfaces
Bestehende Typen in `src/types/database.ts` decken alle Anforderungen vollständig ab.

### 6.3 State & Firestore Listener
Bestehende Subscriptions in `KioskPage.tsx` (`subscribeMatches`, `subscribeTeams`, `subscribeTournamentConfig`) versorgen weiterhin alle Folien reaktiv.

---

## 7. Edge Cases & Fehlerbehandlung
- **Lange Teamnamen**: Werden mit `truncate` bzw. flexibler Breitenbegrenzung geschützt, sodass das Grid niemals horizontal verschoben wird.
- **Fehlende Logos**: Werden mit Fallback-Emoji bzw. Initialen abgefangen.
- **Noch keine Finalspiele generiert / Platzhalter-Teams**: `teamHomePlaceholder` und `teamAwayPlaceholder` (z. B. "1. Gruppe A") werden formatiert dargestellt.
- **Offline-Betrieb**: Caching bleibt über Firestore aktiv, Offline-Banner bleibt erhalten.

---

## 8. Verifikations- & Testplan

### 8.1 Manuelle Tests
1. [ ] Aufruf von `/kiosk` im Browser und Test im Vollbildmodus (1080p Auflösung).
2. [ ] Prüfung Folie „Live“: Startzeit-Tag sichtbar, Logos auf Höhe des Spielstands, Vereinsnamen darunter zentriert, keine vertikalen Linien.
3. [ ] Prüfung Folie „Gruppenphase“: 24 Spiele in 2 Spalten (12 links, 12 rechts), Ausrichtung geprüft, Rot/Blau-Hervorhebung geprüft, kein Scrollen.
4. [ ] Prüfung Folie „Finalphase“: 16 Spiele in 2 Spalten (8 links, 8 rechts), kompakte Spielnamen-Badges, kein Scrollen.
5. [ ] Prüfung Folie „Tabellen“: Alle 4 Gruppen in 2x2 Anordnung mit allen Statistiken sichtbar.
6. [ ] Prüfung Footer: Mittig zentrierte Anzeige von Spiel und Ergebnis, kein Synchronisierungs-Text.
7. [ ] Test der automatischen Rotation und manuellen Folien-Umschaltung im Header.

### 8.2 Automatisierte Tests / Validierung
- [ ] `npm run build` läuft fehlerfrei durch.
