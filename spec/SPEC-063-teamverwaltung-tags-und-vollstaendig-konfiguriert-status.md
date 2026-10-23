# SPEC-063: Teamverwaltung – Farbgebung Tags (Blue/Fuchsia), Schreibweise mU14/wU14, Konfigurationsstatus & Grüner Card-Rahmen

> **Status**: Abgeschlossen  
> **Typ**: Feature / UI-Verbesserung  
> **Branch**: feat/SPEC-063-teamverwaltung-tags-und-vollstaendig-konfiguriert-status  
> **Autor**: Antigravity  
> **Erstellt am**: 2026-10-23  
> **Letzte Änderung**: 2026-10-23  
> **Betroffene Bereiche**: Turnierleitung (/admin/teams) – Teamverwaltung  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Auf der Seite **Teamverwaltung** (`/admin/teams`) weicht die visuelle Darstellung der Tags teilweise vom restlichen Turniersystem ab:
1. Das Geschlechts-Tag verwendet derzeit Pink (`pink-100`) statt des einheitlichen **Fuchsia** für weibliche Teams, und die CSS-Klasse `uppercase` erzwingt die Großschreibung `WU14` bzw. `MU14` statt der im Hockey üblichen und im gesamten Projekt verwendeten Schreibweise **`wU14`** und **`mU14`**.
2. Das Gruppen-Tag (`Gruppe A` / `Gruppe B`) ist bislang grau (`bg-slate-100`) formatiert und spiegelt nicht die altersklassenspezifische Farbcodierung (Blau für mU14, Fuchsia für wU14) wider.
3. In der Filterleiste zeigt das Status-Tag bisher lediglich die Gesamtanzahl der existierenden Teams an (z. B. `16 / 16 Teams konfiguriert`), unabhängig davon, ob die Teams tatsächlich schon mit Link, Jingle und Spielerkader vollständig eingerichtet wurden.
4. Es gibt auf der TeamCard keine optische Hervorhebung darüber, ob ein Team bereits startklar bzw. vollständig konfiguriert ist.

### 1.2 Zielzustand & Mehrwert
- **Einheitliche Farbcodierung der Tags**: Die Tags für Geschlecht (`wU14` / `mU14`) und Gruppe (`Gruppe A` / `Gruppe B`) auf jeder TeamCard werden mit **Fuchsia** (für wU14) und **Blue** (für mU14) formatiert.
- **Korrekte Schreibweise**: Die Kennzeichnung lautet exakt **`wU14`** und **`mU14`** (keine störende CSS-Großschreibung `uppercase`).
- **Dynamische Konfigurationsanzeige in der Filterleiste**: Das Statistik-Tag in der Filterleiste zeigt präzise die Anzahl der **vollständig konfigurierten Teams** an (z. B. `2 / 16 Teams konfiguriert`).
- **Präzise Definition "Vollständig konfiguriert"**: Ein Team gilt genau dann als vollständig konfiguriert, wenn:
  1. Der Link-Zähler > 0 ist (`linkGenerationCount > 0`),
  2. ein Tor-Jingle hochgeladen wurde (`jingleUrl` vorhanden und nicht leer),
  3. und mindestens 6 Spieler im Spielerkader eingetragen sind (`players.length >= 6`).
- **Grüner Rahmen für fertige Teams**: Jede Team-Card, die vollständig konfiguriert ist, erhält einen deutlich sichtbaren **grünen Rahmen** (`border-emerald-500 ring-1 ring-emerald-500` bzw. `border-2 border-emerald-500`).
- **Mehrwert**: Die Turnierleitung sieht sofort auf einen Blick, welche Teams spielbereit sind und wo noch Betreuer-Links generiert, Tor-Jingles hochgeladen oder Spielerkader vervollständigt werden müssen.

---

## 2. User Stories

- **US-1**: Als **Turnierleiter** möchte ich in der Teamverwaltung auf einen Blick anhand von Fuchsia und Blau sowie den sauberen Bezeichnungen `wU14` und `mU14` sofort die Altersklasse und Gruppe der Mannschaft erkennen.
- **US-2**: Als **Turnierleiter** möchte ich in der Filterleiste direkt ablesen können, wie viele Mannschaften bereits vollständig spielfertig konfiguriert sind (Link generiert, Jingle hinterlegt, mindestens 6 Spieler im Kader).
- **US-3**: Als **Turnierleiter** möchte ich an den einzelnen Team-Cards anhand eines grünen Rahmens unmittelbar erkennen, welche Teams vollständig konfiguriert sind und welche noch unvollständig sind.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)
- [x] **FR-1: Tag-Farbgebung (Blue & Fuchsia) in `TeamCard.tsx`**:
  - Für **wU14**: Geschlechts-Tag und Gruppen-Tag in Fuchsia formatiert (`bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200` bzw. `bg-fuchsia-100/80 text-fuchsia-700 border-fuchsia-200`).
  - Für **mU14**: Geschlechts-Tag und Gruppen-Tag in Blau formatiert (`bg-blue-50 text-blue-700 border-blue-200` bzw. `bg-blue-100/80 text-blue-700 border-blue-200`).
- [x] **FR-2: Schreibweise `wU14` und `mU14`**:
  - Entfernung von `uppercase` in den Tag-Klassen der `TeamCard.tsx` und Sicherstellung der exakten Schreibweise `wU14` und `mU14`.
- [x] **FR-3: Berechnungsfunktion `isTeamFullyConfigured(team: Team)`**:
  - Implementierung einer wiederverwendbaren Prüffunktion in `src/services/teamService.ts`:
    - `(team.linkGenerationCount ?? 0) > 0`
    - `Boolean(team.jingleUrl && team.jingleUrl.trim().length > 0)`
    - `(team.players?.filter(p => p.firstName?.trim() || p.lastName?.trim() || p.number).length ?? 0) >= 6`
- [x] **FR-4: Filterleisten-Tag in `TeamList.tsx`**:
  - Zählung der vollständig konfigurierten Teams über `teams.filter(isTeamFullyConfigured).length`.
  - Anzeige im Format: `{fullyConfiguredCount} / 16 Teams konfiguriert`.
  - Farbgebung: Grün/Emerald (`bg-emerald-100 text-emerald-800`), wenn `fullyConfiguredCount === 16` (bzw. `=== teams.length && teams.length >= 16`), sonst Amber (`bg-amber-100 text-amber-800`).
- [x] **FR-5: Grüner Rahmen auf der TeamCard**:
  - Wenn `isTeamFullyConfigured(team) === true`: Grüner Rahmen um das Card-Element (`border-emerald-500 ring-1 ring-emerald-500` bzw. `border-2 border-emerald-500`).
  - Wenn nicht vollständig konfiguriert: Standard-Rahmen (`border-slate-200`).
- [x] **FR-6: Harmonisierung der Filter-Buttons in `TeamList.tsx`**:
  - wU14-Filter-Button nutzt `text-fuchsia-700` (statt `text-pink-700`) im aktiven Zustand für einheitliches Corporate Design.

### 3.2 Explizit Out-of-Scope
- Keine Änderungen an der Spiellogik oder dem Spielplan.
- Keine Änderung an der Mindestspielerzahl für das Starten eines Matches am Live-Desk.
- Keine automatische Sperrung von Teams ohne 6 Spieler.

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien
- [x] **AC-1: Tags für Geschlecht und Gruppe mit Fuchsia & Blau und korrekter Schreibweise**
  - **Gegeben sei**: Eine wU14-Mannschaft in Gruppe A wird in der Teamverwaltung angezeigt.
  - **Wenn**: Die TeamCard gerendert wird.
  - **Dann**: 
    - zeigt das Geschlechts-Tag exakt den Text `wU14` (nicht `WU14`) mit Fuchsia-Hintergrund und Fuchsia-Schrift (`bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200`).
    - zeigt das Gruppen-Tag den Text `Gruppe A` ebenfalls mit Fuchsia-Styling.
  - **Und für ein mU14-Team**:
    - zeigt das Geschlechts-Tag exakt den Text `mU14` (nicht `MU14`) mit Blau-Hintergrund und Blau-Schrift (`bg-blue-50 text-blue-700 border-blue-200`).
    - zeigt das Gruppen-Tag `Gruppe B` ebenfalls mit Blau-Styling.

- [x] **AC-2: Kriterien für vollständige Konfiguration**
  - **Gegeben sei**: Ein Team mit folgenden Eigenschaften:
    - Fall A: Link-Zähler = 1, Jingle = vorhanden, Kader = 6 Spieler -> **vollständig konfiguriert**.
    - Fall B: Link-Zähler = 0, Jingle = vorhanden, Kader = 6 Spieler -> **nicht vollständig**.
    - Fall C: Link-Zähler = 1, Jingle = leer/null, Kader = 6 Spieler -> **nicht vollständig**.
    - Fall D: Link-Zähler = 1, Jingle = vorhanden, Kader = 5 Spieler -> **nicht vollständig**.
  - **Dann**: Gibt `isTeamFullyConfigured` für Fall A `true`, für B, C, D `false` zurück.

- [x] **AC-3: Status-Tag in der Filterleiste**
  - **Gegeben sei**: 2 von 16 Teams erfüllen alle drei Bedingungen.
  - **Wenn**: Die Teamverwaltung geöffnet ist.
  - **Dann**: Zeigt das Status-Tag in der Filterleiste exakt `2 / 16 Teams konfiguriert`.

- [x] **AC-4: Grüner Rahmen auf der TeamCard**
  - **Gegeben sei**: Team X ist vollständig konfiguriert, Team Y nicht.
  - **Wenn**: Die Team-Kacheln gerendert werden.
  - **Dann**: Besitzt Team X einen gut erkennbaren grünen Rahmen um das gesamte Card-Element (`border-emerald-500 ring-1 ring-emerald-500`), während Team Y den dezenten grauen Standard-Rahmen (`border-slate-200`) besitzt.

### 4.2 Allgemeine Qualitätskriterien
- [x] Keine fest kodierten Parameter.
- [x] Vollständige TypeScript-Typisierung ohne `any`.
- [x] Fehlerfreier Build (`npm run build`) und sauberes Linting.

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Betroffene Ansichten & Komponenten
- `src/components/admin/TeamCard.tsx`:
  - Geschlechts-Tag (`wU14` / `mU14`) & Gruppen-Tag (`Gruppe A` / `Gruppe B`) mit Fuchsia/Blau-Farbgebung.
  - Entfernung von `uppercase`.
  - Bedingte CSS-Klasse für den grünen Card-Rahmen (`isConfigured ? "border-emerald-500 ring-1 ring-emerald-500" : "border-slate-200"`).
- `src/components/admin/TeamList.tsx`:
  - Ermittlung der Anzahl vollständig konfigurierter Teams über `isTeamFullyConfigured`.
  - Anzeige im Filterleisten-Badge: `{fullyConfiguredCount} / 16 Teams konfiguriert`.
  - Fuchsia-Farbanpassung beim wU14-Filter-Tab.
- `src/services/teamService.ts`:
  - Export von `isTeamFullyConfigured(team: Team): boolean`.

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Datenmodell (`DATABASE.md`)
- Keine Änderungen an Firestore-Dokumenten oder Collections nötig. Alle Felder (`linkGenerationCount`, `jingleUrl`, `players`) existieren bereits im Schema.

### 6.2 TypeScript Interfaces
- Keine Änderungen an `src/types/database.ts` notwendig.

---

## 7. Verifikations- & Testplan

### 7.1 Manuelle Tests
1. [x] Aufrufen von `/admin/teams`.
2. [x] Prüfen der Tags auf den Team-Cards: `wU14` in Fuchsia, `mU14` in Blau, Gruppe jeweils passend eingefärbt.
3. [x] Prüfen der Schreibweise: Keine verzerrende Großschreibung `WU14`/`MU14`, sondern sauberes `wU14` und `mU14`.
4. [x] Prüfen des Filterleisten-Tags: Zeigt z. B. `X / 16 Teams konfiguriert`.
5. [x] Prüfen eines vollständig konfigurierten Teams: Grüner Rahmen sichtbar.
6. [x] Prüfen eines unvollständigen Teams: Normaler grauer Rahmen.

### 7.2 Automatisierte Validierung
- [x] `npm run build` fehlerfrei.
- [x] `npm run lint` fehlerfrei.
