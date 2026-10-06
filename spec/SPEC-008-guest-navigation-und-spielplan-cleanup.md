# SPEC-008: Optimierung der Gast-Navigation, einklappbare Spielplan-Filter und Bereinigung der Spielkarten

> **Status**: In Review  
> **Typ**: UX-Optimierung / Refactoring  
> **Branch**: `feat/SPEC-008-guest-navigation-und-spielplan-cleanup`  
> **Autor**: Antigravity Agent  
> **Erstellt am**: 2026-10-06  
> **Letzte Änderung**: 2026-10-06  
> **Betroffene Bereiche**: Gast-Ansicht (`/`)  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
In der mobilen Gast-Ansicht (`/`) für Zuschauer und Mannschaften gibt es aktuell mehrere Usability- und Layout-Schwächen:
1. **Redundante Navigation**: In der oberen Sub-Navigationsleiste des Headers (`GuestLayout.tsx`) existiert ein einzelner Link namens „Übersicht & Live“. Die eigentlichen Inhalts-Reiter („Spielplan“, „Live-Tabellen“, „Finalphase“) befinden sich hingegen erst weiter unten im Inhaltsbereich (`HomePage.tsx`). Dadurch geht auf mobilen Bildschirmen wertvolle Bildschirmhöhe verloren und es existieren zwei Navigationsabschnitte übereinander.
2. **Großer Filter-Bereich im Spielplan**: In `GuestScheduleView.tsx` nimmt der Filter-Block für Turniertage (Sa/So), Altersklassen (`wU14`/`mU14`) und Gruppen (A/B) permanent viel vertikalen Platz ein. Zuschauer müssen auf dem Smartphone zunächst scrollen, um die ersten Spiele zu sehen.
3. **Überflüssige Feldangabe („Feld 1“)**: Da das Turnier in einer Einzelhalle auf nur einem Spielfeld ausgetragen wird, hat die Angabe „Feld 1“ in der `LiveHeroCard` keinen Informationswert und überfrachtet das Header-Layout der Karte.
4. **Technische Status-Badges**: Auf jeder einzelnen Spielkarte im Spielplan wird aktuell der Rohstatus aus der Datenbank (z. B. `SCHEDULED`, `PAUSED`, `WARMUP`) in englischer Großschrift als Badge dargestellt. Dies wirkt unaufgeräumt und technisch, da Anstoßzeit, Spielminuten und Spielstand den Status für Zuschauer bereits selbsterklärend vermitteln.

### 1.2 Zielzustand & Mehrwert
- **Kompakte obere Navigation**: Das Menü mit den Reitern **Spielplan**, **Live-Tabellen** und **Finalphase** wird direkt in die obere Sub-Navigationsleiste im Header (`GuestLayout.tsx`) integriert und ersetzt „Übersicht & Live“. Die untere Reiter-Leiste in `HomePage.tsx` entfällt.
- **Einklappbare Filter**: Der Filterabschnitt im Spielplan ist standardmäßig eingeklappt (`collapsed = true`). Über einen dezenten Toggle-Button (z. B. „Filter anzeigen“ / „Filter ausblenden“ mit Icon) kann er bei Bedarf geöffnet werden. Aktive Filter werden durch einen kompakten visuellen Indikator (z. B. Badge / Badge-Counter) signalisiert.
- **Entfernung von „Feld 1“**: Das Badge „Feld {court}“ wird aus der `LiveHeroCard` entfernt.
- **Entfernung technischer Status-Tags**: Die englischen Status-Pills (`SCHEDULED`, `PAUSED` etc.) werden von den Spielkarten in `GuestScheduleView.tsx` entfernt. Laufende Partien bleiben weiterhin durch die rote Rahmenhervorhebung, das Pulsieren und die Spielminutenanzeige eindeutig und intuitiv erkennbar.

---

## 2. User Stories

- **US-1**: Als **Gast auf dem Smartphone** möchte ich **direkt oben im Header zwischen Spielplan, Live-Tabellen und Finalphase wechseln können**, um **ohne langes Scrollen schnell die gewünschte Übersicht zu finden**.
- **US-2**: Als **Zuschauer in der Halle** möchte ich **beim Öffnen des Spielplans sofort die Spiele sehen, ohne dass ein riesiger Filterblock den Bildschirm blockiert**, um **eine kompakte, übersichtliche Liste der Partien zu haben**.
- **US-3**: Als **Zuschauer mit speziellem Interesse (z. B. nur wU14)** möchte ich **den Filterblock mit einem Klick aufklappen und anpassen können**, um **gezielte Spiele herauszufiltern**.
- **US-4**: Als **Gast** möchte ich **saubere und aufgeräumte Spielkarten ohne überflüssige Angaben wie „Feld 1“ oder technische Status-Kürzel („SCHEDULED“, „PAUSED“) sehen**, um **mich voll auf die Mannschaften, Zeiten und Spielstände zu konzentrieren**.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)
- [ ] **1. Obere Navigation im Header (`GuestLayout.tsx`)**:
  - Ersetzen des Eintrags „Übersicht & Live“ durch die drei Reiter:
    - **Spielplan** (URL: `/#schedule` bzw. Standard `/`)
    - **Live-Tabellen** (URL: `/#standings`)
    - **Finalphase** (URL: `/#finals`)
  - Aktiver Reiter wird optisch klar hervorgehoben (`border-b-2 border-blue-600 text-blue-600 font-semibold`).
  - Inaktive Reiter besitzen das Standard-Styling (`text-slate-600 hover:text-slate-900`).
- [ ] **2. Zustandssynchronisation & Bereinigung in `HomePage.tsx`**:
  - Entfernung der redundanten zweiten Reiterleiste aus dem Inhaltsbereich von `HomePage.tsx`.
  - Erkennung des aktiven Reiters anhand des URL-Hashes (`useLocation().hash`):
    - Standard / leerer Hash / `#schedule` -> Spielplan (`activeTab = "schedule"`)
    - `#standings` -> Live-Tabellen (`activeTab = "standings"`)
    - `#finals` -> Finalphase (`activeTab = "finals"`)
  - Die `LiveHeroCard` bleibt oberhalb der Reiterinhalte auf der Startseite erhalten, sodass laufende/anstehende Partien stets prominent sichtbar sind.
- [ ] **3. Einklappbarer Filter-Bereich in `GuestScheduleView.tsx`**:
  - Neuer lokaler Zustand `isFilterOpen` (Initialwert: `false`, standardmäßig zugeklappt).
  - Kompakter Toggle-Button im Header des Spielplans (z. B. mit `Filter`-Icon, Text „Filter anzeigen“ / „Filter ausblenden“ sowie `ChevronDown` / `ChevronUp`).
  - Ein Indikator (z. B. Punkt oder Zähler aktiver Filter), wenn Filter von der Standardeinstellung („Alle Tage“, „Alle Teams“, „Alle Gr.“) abweichen.
  - Beim Klick auf den Toggle-Button klappt der Filterblock auf bzw. zu (animiert oder sauber ein-/ausgeblendet).
  - Ein optionaler Schnell-Reset-Button („Filter zurücksetzen“), wenn Filter aktiv sind.
- [ ] **4. Entfernung von „Feld 1“ in `LiveHeroCard.tsx`**:
  - Entfernung des Badges `<span ...>Feld {currentMatch.court}</span>` aus dem Header der `LiveHeroCard`.
- [ ] **5. Entfernung der Status-Tags (`SCHEDULED`, `PAUSED` etc.) in `GuestScheduleView.tsx`**:
  - Entfernung des Badges mit `{match.status}` aus den Spielkarten.
  - Das Styling für Live-Spiele (pulsierender roter Indikator, Live-Spielminute, rote Rahmenakzentuierung) bleibt unverändert erhalten.

### 3.2 Explizit Out-of-Scope
- Änderungen am Kiosk-Modus (`/kiosk`) oder an der Turnierleitung (`/admin`).
- Änderungen an den Berechnungsmethoden für Tabellen oder Finalspiele.
- Einführung neuer Sub-Routen (die Navigation erfolgt schlank und reaktiv über URL-Hashes im Einklang mit SPEC-001).

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien
- [ ] **AC-1: Header-Subnavigation mit drei Reitern**
  - **Gegeben sei**: Ein Gast öffnet die Seite `/`.
  - **Wenn**: Der Header geladen wird.
  - **Dann**: Enthält die Sub-Navigationsleiste exakt die drei Menüpunkte „Spielplan“, „Live-Tabellen“ und „Finalphase“. Der Eintrag „Übersicht & Live“ existiert nicht mehr.

- [ ] **AC-2: Hash-basierte Navigation & Synchronisation**
  - **Gegeben sei**: Ein Gast klickt in der oberen Leiste auf „Live-Tabellen“.
  - **Wenn**: Der Link aktiviert wird.
  - **Dann**: Wechselt die URL auf `/#standings`, der Reiter „Live-Tabellen“ wird als aktiv hervorgehoben und darunter wird die Tabellenansicht (`StandingsView`) angezeigt.
  - **Wenn**: Der Nutzer im Browser auf „Zurück“ klickt.
  - **Dann**: Wechselt die Ansicht synchron zurück zum Spielplan (`/#schedule` bzw. `/`).

- [ ] **AC-3: Keine redundante Reiterleiste im Inhaltsbereich**
  - **Gegeben sei**: Die Startseite `/` wird angezeigt.
  - **Wenn**: Der Nutzer unter die `LiveHeroCard` blickt.
  - **Dann**: Wird direkt der jeweilige Inhalt (Spielplan, Tabellen oder Finalphase) gerendert, ohne dass eine zweite Tab-Leiste dazwischengeschaltet ist.

- [ ] **AC-4: Einklappbare Filter (Standard: zugeklappt)**
  - **Gegeben sei**: Der Reiter „Spielplan“ ist aktiv.
  - **Wenn**: Die Seite initial aufgerufen wird.
  - **Dann**: Ist der Filterbereich eingeklappt. Sichtbar ist eine kompakte Leiste mit dem Toggle-Button „Filter anzeigen“ (und der Gesamtzahl der Spiele).
  - **Wenn**: Der Nutzer auf „Filter anzeigen“ klickt.
  - **Dann**: Klappen die Filteroptionen (Tage, Geschlecht, Gruppen) auf und der Button wechselt zu „Filter ausblenden“.

- [ ] **AC-5: Aktiver Filterindikator**
  - **Gegeben sei**: Die Filter sind aufgeklappt und der Nutzer filtert nach „wU14“.
  - **Wenn**: Der Nutzer die Filter wieder zuklappt.
  - **Dann**: Zeigt der Filter-Button optisch an, dass mindestens ein Filter aktiv ist (z. B. farbiger Badge / Punkt „1 Filter aktiv“), sodass für den Gast nachvollziehbar bleibt, warum die Liste gefiltert ist.

- [ ] **AC-6: Entfernung von „Feld 1“**
  - **Gegeben sei**: In der `LiveHeroCard` wird das aktuelle oder nächste Spiel angezeigt.
  - **Wenn**: Die Karte gerendert wird.
  - **Dann**: Ist kein Badge mit der Aufschrift „Feld 1“ (oder „Feld {court}“) sichtbar.

- [ ] **AC-7: Entfernung der technischen Status-Badges**
  - **Gegeben sei**: Die Liste der Spiele im Spielplan wird angezeigt.
  - **Wenn**: Geplante (`scheduled`), pausierte (`paused`) oder beendete (`finished`) Partien gerendert werden.
  - **Dann**: Erscheint kein Badge mehr mit den Texten `SCHEDULED`, `PAUSED` oder `FINISHED`. Anstoßzeit, Altersklasse, Gruppe/Phase und Spielstand bleiben intakt.

### 4.2 Allgemeine Qualitätskriterien
- [ ] Keine fest kodierten Parameter gemäß `AGENTS.md`.
- [ ] Vollständige TypeScript-Typisierung ohne `any`.
- [ ] Fehlerfreier Build (`npm run build`) und Linter (`npm run lint`).
- [ ] Responsiv und nahtlos auf Smartphones bedienbar.

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Betroffene Ansichten & Komponenten
- `src/components/layouts/GuestLayout.tsx`: Anpassung der oberen Sub-Navigation (`Spielplan`, `Live-Tabellen`, `Finalphase`).
- `src/pages/guest/HomePage.tsx`: Auswertung von `useLocation().hash`, Entfernung der doppelten Reiterleiste.
- `src/components/guest/GuestScheduleView.tsx`: Filterbereich einklappbar gestalten (`isFilterOpen`), Toggle-Button, Entfernung von `match.status`-Badges.
- `src/components/guest/LiveHeroCard.tsx`: Entfernung des „Feld {court}“-Badges.

### 5.2 Skizze der überarbeiteten UI

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ [RRK Logo] 20. Kurt-Becker-Cup                              [TV] [Admin]│
├─────────────────────────────────────────────────────────────────────────┤
│ [ Spielplan ]   [ Live-Tabellen ]   [ Finalphase ]                      │  <-- Obere Navigation
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ 🔴 LIVE • 7. Minute                                   wU14 • Gruppe A   │
│                                                                         │
│   [RRK] RRK 1            2 : 1            [SC80] SC 80                  │
│                                                                         │
│   (kein "Feld 1" Badge mehr)                                            │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ Spielplan (32 Partien)           [ 🔽 Filter anzeigen (1 aktiv) ]       │  <-- Kompakte Filter-Leiste
└─────────────────────────────────────────────────────────────────────────┘
  (Bei Klick auf Filter anzeigen klappt der Filterblock auf:)
  ┌─────────────────────────────────────────────────────────────────────┐
  │ Tage: [Alle] [Sa] [So]  |  Teams: [Alle] [wU14] [mU14]  |  Gr: [A] [B]│
  └─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ 10:00 Uhr • Spiel #1                     [wU14] [Gruppe A]              │  <-- Keine Tags wie "SCHEDULED"
│ [Logo] RRK                   vs                     [Logo] BHC          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Datenmodell (`DATABASE.md`)
- Keine Änderungen. Die Datenstrukturen in Firestore bleiben zu 100 % unberührt.

### 6.2 TypeScript Interfaces (`src/types/`)
- Keine neuen Schemata oder Interfaces erforderlich.

### 6.3 State & Navigation
- URL-Hash Navigation via `react-router-dom`:
  - `/#schedule` -> Tab `schedule`
  - `/#standings` -> Tab `standings`
  - `/#finals` -> Tab `finals`
- Zustand in `GuestScheduleView`:
  - `isFilterOpen: boolean` (default: `false`).
  - Berechnete Eigenschaft `hasActiveFilters = dayFilter !== "all" || genderFilter !== "all" || groupFilter !== "all"`.

---

## 7. Edge Cases & Fehlerbehandlung

- **Unbekannter oder leerer URL-Hash**: Fallback auf `schedule` (Spielplan), sodass Direktaufrufe von `/` stets zuverlässig den Spielplan zeigen.
- **Filter zugeklappt, aber Filterkriterien aktiv**: Wenn ein Nutzer Filter auswählt und den Bereich zuklappt, wird über einen optischen Zähler/Indikator signalisiert, dass Filter aktiv sind, damit sich der Nutzer nicht über eine scheinbar unvollständige Spielliste wundert.
- **Mobile Viewport**: Die obere Leiste bleibt horizontal scrollbar (`overflow-x-auto`), damit auch auf kleinsten Displays kein Text umbricht oder abgeschnitten wird.

---

## 8. Verifikations- & Testplan

### 8.1 Manuelle Tests
1. [ ] Aufruf von `http://localhost:5173/`:
   - Prüfen, dass oben „Spielplan“, „Live-Tabellen“ und „Finalphase“ sichtbar sind und „Übersicht & Live“ entfernt ist.
   - Prüfen, dass Spielplan standardmäßig aktiv ist.
2. [ ] Klick auf „Live-Tabellen“ und „Finalphase“:
   - Prüfen, dass der aktive Unterstrich mitwandert und die jeweilige Komponente geladen wird.
   - Prüfen der URL-Hashes (`/#standings`, `/#finals`).
   - Browser-Zurück-Taste testen: Springt zur vorherigen Ansicht zurück.
3. [ ] `LiveHeroCard`:
   - Prüfen, dass kein „Feld 1“-Badge mehr angezeigt wird.
4. [ ] Spielplan Filter:
   - Prüfen, dass die Filterleiste initial zugeklappt ist.
   - Aufklappen testen -> Filteroptionen erscheinen.
   - Filter setzen (z. B. nur wU14) -> Liste filtert.
   - Zuklappen testen -> Indikator für aktiven Filter sichtbar.
5. [ ] Spielplan Karten:
   - Prüfen, dass keine Badges mit `SCHEDULED`, `PAUSED`, `FINISHED` etc. gerendert werden.

### 8.2 Automatisierte Validierung
- [ ] `npm run build` fehlerfrei.
- [ ] `npm run lint` fehlerfrei.

---

## 9. Offene Fragen & Klärungsbedarf
- Keine. Alle Anforderungen sind durch die Aufgabenstellung präzise und vollständig definiert.
