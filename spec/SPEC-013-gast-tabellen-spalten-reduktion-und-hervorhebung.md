# SPEC-013: Reduktion und Neuordnung der Tabellenspalten in der Gästeansicht mit Punkthervorhebung

> **Status**: In Review  
> **Typ**: UX-Optimierung  
> **Branch**: `feat/SPEC-013-gast-tabellen-spalten-reduktion-und-hervorhebung`  
> **Autor**: Antigravity Agent  
> **Erstellt am**: 2026-10-07  
> **Letzte Änderung**: 2026-10-07  
> **Betroffene Bereiche**: Gast-Ansicht (`/`)  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
In der Gästeansicht (`/`, Reiter „Tabellen“) werden die Gruppentabellen aktuell mit 9 Spalten dargestellt:
- `#` (Platzierung)
- `Mannschaft`
- `Sp` (Gespielte Spiele)
- `S` (Siege)
- `U` (Unentschieden)
- `N` (Niederlagen)
- `Tore` (Erzielte : Erhaltene Tore)
- `Diff` (Tordifferenz)
- `Pkt` (Punkte)

Auf mobilen Endgeräten (Smartphones), die von Zuschauern und Teams in der Halle primär genutzt werden, führt diese Spaltenfülle zu horizontalem Scrollen und gequetschten Teamnamen. Zudem sind Details wie Siege, Unentschieden, Niederlagen und separate Tordifferenz für einen schnellen Überblick entbehrlich – ausschlaggebend für die Platzierung und Orientierung sind vor allem die **Punkte (PKT)**, die Anzahl absolvierter **Spiele (SP)** und das Torverhältnis (**Tore**).

### 1.2 Zielzustand & Mehrwert
- **Kompakte 5-Spalten-Struktur**: Die Tabellen in der Gästeansicht werden auf das Wesentliche reduziert:
  1. `#` (Rang)
  2. `Mannschaft` (Logo & Name)
  3. `SP` (Spiele)
  4. `PKT` (Punkte)
  5. `Tore` (z. B. `5:2`)
- **Entfernte Spalten**: `S` (Siege), `U` (Unentschieden), `N` (Niederlagen) sowie `Diff` (Tordifferenz) werden vollständig aus der Gäste-Tabellenansicht entfernt.
- **Optische Hervorhebung der Punkte**: Die Spalte **PKT** wird visuell hervorgehoben (z. B. durch fetteren Schriftschnitt, dezenten Hintergrund-Akzent / Kontrast), sodass die Punktzahl als zentrales Kriterium sofort ins Auge sticht.
- **Perfekte Mobilansicht**: Durch die Reduktion passt die Tabelle auf nahezu jedem Smartphone ohne horizontales Scrollen auf das Display, und Teamnamen erhalten deutlich mehr Platz.

---

## 2. User Stories

- **US-1**: Als **Zuschauer oder Spieler auf dem Smartphone** möchte ich **eine kompakte Gruppentabelle sehen, die ohne horizontales Scrollen sofort lesbar ist**, um **auf einen Blick die Tabellensituation meiner Mannschaft zu erfassen**.
- **US-2**: Als **Gast** möchte ich **die Punkteanzahl sofort visuell hervorgehoben erkennen**, um **ohne langes Suchen den aktuellen Punktestand und die Rangfolge zu verstehen**.
- **US-3**: Als **Nutzer** möchte ich **die Spalten in der logischen Reihenfolge Spiele (SP), Punkte (PKT) und Tore sehen**, um **eine intuitive und aufgeräumte Informationshierarchie vorzufinden**.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)
- [ ] **Spaltenreduktion in `StandingsView.tsx`**:
  - Entfernung der Header- und Body-Zellen für:
    - Siege (`S`)
    - Unentschieden (`U`)
    - Niederlagen (`N`)
    - Tordifferenz (`Diff`)
- [ ] **Feste Spaltenreihenfolge**:
  - `Rang (#)`
  - `Mannschaft`
  - `SP` (Anzahl gespielter Partien)
  - `PKT` (Punkte)
  - `Tore` (Erzielte : Gegentore, z. B. `8:3`)
- [ ] **Hervorhebung der Punkte (PKT)**:
  - Header `PKT`: Markanter formatiert (z. B. dunklere/kräftigere Schrift `font-black text-slate-900`).
  - Zellen `PKT`: Visuelle Akzentuierung (z. B. dezent hinterlegte Zelle oder Badge-Look mit `font-black text-sm text-slate-900 bg-slate-100/80 rounded-md py-1 px-2 text-center` oder kräftiger Akzent), sodass Punkte sofort als Leitwert wahrgenommen werden.
- [ ] **Labels im Tabellenkopf**:
  - Kurze, prägnante Spaltenbezeichnungen: `SP`, `PKT`, `Tore` (gemäß Nutzeranforderung).
- [ ] **Responsive Darstellung**:
  - Auf schmalen mobilen Bildschirmen (ab 360px Breite) kein horizontales Scrollen erforderlich; der Teamname erhält maximale Breite und bricht bei Bedarf mit Ellipsis um.

### 3.2 Explizit Out-of-Scope (Nicht Teil dieser Spec)
- **Kiosk-Ansicht (`KioskStandingsSlide.tsx`)**: Der Hallen-Großbildschirm behält seine detaillierte 9-Spalten-Tabelle, da dort ausreichend Bildschirmbreite zur Verfügung steht.
- **Berechnungslogik (`standingsService.ts`)**: Die mathematische Tabellenberechnung und Sortierreihenfolge (Punkte -> Tordifferenz -> Erzielte Tore -> Direkter Vergleich) bleibt unverändert.
- **Turnierregeln-Footer**: Die Erläuterung der Wertungsregeln unterhalb der Tabellen bleibt erhalten.

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien
- [ ] **AC-1: Reduzierte Spaltenanzahl in der Gast-Tabelle**
  - **Gegeben sei**: Ein Nutzer ruft in der Gästeansicht den Reiter „Tabellen“ (`/#standings`) auf.
  - **Wenn**: Die Gruppentabellen (Gruppe A und B) gerendert werden.
  - **Dann**: Enthalten beide Tabellen ausschließlich die Spalten `#`, `Mannschaft`, `SP`, `PKT` und `Tore`. Es gibt keine Spalten für `S`, `U`, `N` oder `Diff`.

- [ ] **AC-2: Korrekte Reihenfolge der Datenspalten**
  - **Gegeben sei**: Eine Gruppentabelle wird angezeigt.
  - **Wenn**: Die Spalten von links nach rechts betrachtet werden.
  - **Dann**: Folgt nach der Spalte `Mannschaft` unmittelbar die Spalte `SP`, gefolgt von `PKT` und abschließend `Tore`.

- [ ] **AC-3: Visuelle Hervorhebung der Punkte**
  - **Gegeben sei**: Die Zeilen der Tabelle werden angezeigt.
  - **Wenn**: Der Nutzer die Tabelle betrachtet.
  - **Dann**: Hebt sich die Spalte `PKT` durch fettere Typografie und kontrastierende Hinterlegung optisch klar von den Spalten `SP` und `Tore` ab.

- [ ] **AC-4: Mobiloptimierte Passgenauigkeit**
  - **Gegeben sei**: Die Gästeansicht wird auf einem mobilen Viewport (z. B. 375x667px) geöffnet.
  - **Wenn**: Die Tabelle geladen ist.
  - **Dann**: Werden alle 5 Spalten vollständig ohne horizontales Scrollen dargestellt.

### 4.2 Allgemeine Qualitätskriterien
- [ ] Keine fest kodierten Parameter gemäß `AGENTS.md`.
- [ ] Vollständige TypeScript-Typisierung ohne `any`.
- [ ] Fehlerfreie Ausführung von `npm run build` und Linting.

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Tabellenstruktur im Vergleich

#### Bisherige Struktur (9 Spalten):
```
| # | Mannschaft | Sp | S | U | N | Tore | Diff | Pkt |
```

#### Neue Struktur (5 Spalten):
```
| # | Mannschaft | SP | PKT | Tore |
```

### 5.2 Optische Gestaltung der Spalten
| Spalte | Ausrichtung | Styling Header | Styling Body |
| :--- | :--- | :--- | :--- |
| **#** | Zentriert | `text-slate-400 font-bold` | Rang-Kreis (Gold für Platz 1, Silber für Platz 2, dezent für Rest) |
| **Mannschaft** | Links | `text-slate-400 font-bold` | Team-Logo (28x28px) + Name (`font-bold text-slate-900`) |
| **SP** | Zentriert | `text-slate-500 font-bold` | `font-mono text-slate-600` |
| **PKT** | Zentriert | `text-slate-900 font-black` | `font-mono font-black text-slate-900 bg-slate-100 rounded-md py-0.5 px-2` *(Hervorgehoben)* |
| **Tore** | Zentriert | `text-slate-500 font-bold` | `font-mono text-slate-600` (z. B. `5:2`) |

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Datenmodell (`DATABASE.md`)
- Keine Änderungen erforderlich. Alle Daten (`played`, `points`, `goalsFor`, `goalsAgainst`) werden bereits vom `standingsService` berechnet und bereitgestellt.

### 6.2 TypeScript Interfaces (`src/types/`)
- Keine Änderungen an Interfaces erforderlich.

### 6.3 Betroffene Komponenten
- [`src/components/guest/StandingsView.tsx`](file:///Users/thorsten/Code/kbc-turnier/src/components/guest/StandingsView.tsx):
  - Anpassung der Tabellen-Header (`<thead>`) in `GroupTable`.
  - Anpassung der Tabellen-Zeilen (`<tbody>`) in `GroupTable`.
  - Entfernung der `<td>` / `<th>` Elemente für `won`, `drawn`, `lost`, `goalDifference`.
  - Umsortierung der Spalten: `SP` -> `PKT` -> `Tore`.
  - Styling-Erweiterung für die `PKT`-Hervorhebung.

---

## 7. Edge Cases & Fehlerbehandlung

- **0 Spiele absolviert**: Zu Beginn des Turniers zeigt `SP: 0`, `PKT: 0`, `Tore: 0:0`. Alle Spalten bleiben formatiert und visuell stabil.
- **Hohe Toranzahl (z. B. zweistellig 12:10)**: Die Schriftart `font-mono` und zentrierte Ausrichtung stellen sicher, dass das Layout nicht zerschossen wird.
- **Lange Vereins-/Teamnamen**: Durch den Wegfall von 4 Spalten steht dem Teamnamen signifikant mehr horizontaler Raum zur Verfügung.

---

## 8. Verifikations- & Testplan

### 8.1 Manuelle Tests
1. [ ] Aufruf von `http://localhost:5173/#standings`.
2. [ ] Prüfung von wU14: Tabellen Gruppe A und Gruppe B prüfen.
3. [ ] Prüfung von mU14: Umschalten auf mU14 und Tabellen prüfen.
4. [ ] Verifikation der Spaltenreihenfolge: `#`, `Mannschaft`, `SP`, `PKT`, `Tore`.
5. [ ] Verifikation, dass `S`, `U`, `N`, `Diff` nicht mehr vorhanden sind.
6. [ ] Verifikation der optischen Hervorhebung der Punkte.
7. [ ] Test in der mobilen Ansicht (DevTools Responsive Emulator mit 375px Breite) – kein horizontaler Scrollbalken in der Tabelle.

### 8.2 Automatisierte Tests / Validierung
- [ ] `npm run build` baut fehlerfrei ohne TypeScript- oder Lint-Fehler durch.

---

## 9. Offene Fragen & Klärungsbedarf
- Keine. Die Anforderungen des Nutzers sind vollständig und eindeutig formuliert.
