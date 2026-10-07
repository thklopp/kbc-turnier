# SPEC-011: Eigener Live-Reiter in der Gäste-Ansicht und UI-Bereinigung in Tabellen und Finalphase

> **Status**: Abgeschlossen  
> **Typ**: UX-Optimierung / Refactoring  
> **Branch**: `feat/SPEC-011-guest-live-tab-und-ui-cleanup`  
> **Autor**: Antigravity Agent  
> **Erstellt am**: 2026-10-07  
> **Letzte Änderung**: 2026-10-07  
> **Betroffene Bereiche**: Gast-Ansicht (`/`)  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
In der Gäste-Ansicht (`/`) für Zuschauer und Mannschaften gibt es derzeit folgende UX- und Strukturprobleme:
1. **Permanente Live-Hero-Card**: Das aktuell laufende Spiel (`LiveHeroCard`) wird bisher auf der Startseite (`HomePage.tsx`) oberhalb aller Reiter („Spielplan“, „Live-Tabellen“, „Finalphase“) fix angezeigt. Dadurch nimmt es insbesondere auf Smartphones einen großen Teil des sichtbaren Bildschirms ein, selbst wenn der Nutzer gezielt nur den gesamten Spielplan durchsuchen, Tabellen einsehen oder Finalansichten studieren möchte.
2. **Tab-Benennung „Live-Tabellen“**: Durch die Benennung mit „Live-“ entsteht Redundanz und Begriffsverwirrung, zumal die Tabellen reguläre Gruppenwertungen darstellen.
3. **Redundante Überschriften und Button-Texte**:
   - Im Reiter **Tabellen** steht neben dem Geschlechtsfilter eine Überschrift „Gruppentabellen“ und die Filter-Buttons lauten langatmig „wU14 Tabellen“ und „mU14 Tabellen“.
   - Im Reiter **Finalphase** steht neben den Filter-Buttons eine Überschrift „Finalphase Sonntag“ und die Buttons heißen „wU14 Finals“ / „mU14 Finals“.
   - Auf mobilen Geräten führen diese langen Texte und Titel zu unnötigen Zeilenumbrüchen und visueller Überladung.

### 1.2 Zielzustand & Mehrwert
- **Neuer eigenständiger Reiter „Live“**: Das aktuelle Live-Spiel (bzw. bei Spielpausen die nächste anstehende Partie) erhält einen eigenen Menüpunkt **Live** in der oberen Sub-Navigation (`GuestLayout.tsx`).
- **Befreiung der anderen Reiter**: In den Reitern **Spielplan**, **Tabellen** und **Finalphase** wird die `LiveHeroCard` oben vollständig entfernt. Die Nutzer sehen sofort ab Seitenanfang den jeweiligen Inhalt.
- **Kompakte Navigation**: Die Menü-Reiter lauten künftig:
  1. **Live** (`/#live`)
  2. **Spielplan** (`/#schedule` bzw. `/`)
  3. **Tabellen** (`/#standings`)
  4. **Finalphase** (`/#finals`)
- **Bereinigte Filterleisten**:
  - Im Tab **Tabellen**: Entfernung der Überschrift „Gruppentabellen“ neben dem Filter; Button-Beschriftungen werden auf **wU14** und **mU14** verkürzt.
  - Im Tab **Finalphase**: Entfernung der Überschrift „Finalphase Sonntag“ neben dem Filter; Button-Beschriftungen werden auf **wU14** und **mU14** verkürzt.

---

## 2. User Stories

- **US-1**: Als **Zuschauer in der Halle** möchte ich **einen dedizierten Tab „Live“ auswählen können**, um **das laufende Match samt Spielzeit, Toren und Teams im Großformat im Fokus zu haben**.
- **US-2**: Als **Trainer oder Spieler** möchte ich **beim Klick auf „Spielplan“, „Tabellen“ oder „Finalphase“ sofort die jeweilige Tabelle oder Liste sehen, ohne dass oben erst eine große Live-Spielkarte weggescrollt werden muss**.
- **US-3**: Als **Smartphone-Nutzer** möchte ich **aufgeräumte Filter-Buttons mit kurzen Labels („wU14“ / „mU14“) ohne redundante Wortwiederholungen („Tabellen“, „Finals“) sehen**, um **eine übersichtliche, einzeilige Bedienung ohne Zeilenumbrüche zu haben**.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)

1. **Neuer Reiter „Live“ in der Gast-Navigation (`GuestLayout.tsx`)**:
   - Einführung des Reiters **Live** mit passendem Icon (`Radio` aus `lucide-react`).
   - Reihenfolge in der oberen Sub-Navigation:
     1. `Live` (`/#live`)
     2. `Spielplan` (`/#schedule`)
     3. `Tabellen` (`/#standings`)
     4. `Finalphase` (`/#finals`)
   - Umbenennung des bisherigen Tabs „Live-Tabellen“ in **„Tabellen“** (URL-Hash bleibt zwecks Bookmark-Kompatibilität `/#standings`).
   - Visuelle Hervorhebung des jeweils aktiven Tabs wie bisher (`border-b-2 border-blue-600 text-blue-600 font-bold`).

2. **Entkopplung der `LiveHeroCard` in `HomePage.tsx`**:
   - Die `LiveHeroCard` wird **nur noch** angezeigt, wenn der Reiter **Live** aktiv ist.
   - Wenn der Reiter **Spielplan**, **Tabellen** oder **Finalphase** aktiv ist, wird die `LiveHeroCard` **nicht** gerendert.
   - Hash-Steuerung:
     - `hash === "#live"` -> Reiter `live`
     - `hash === "#schedule"` oder kein Hash -> Reiter `schedule` (Standard-Einstieg bleibt der Spielplan; alternativ kann beim Direktaufruf von `/` direkt Spielplan angezeigt werden)
     - `hash === "#standings"` -> Reiter `standings`
     - `hash === "#finals"` -> Reiter `finals`

3. **Bereinigung Tab „Tabellen“ (`StandingsView.tsx`)**:
   - Entfernung des Textes und Elements „Gruppentabellen“ (inklusive des Trophy-Icons im Header des Filters).
   - Ausrichtung des Geschlechtsfilters (rechtsbündig am oberen Rand der Sektion).
   - Die Umschalt-Buttons werden bereinigt:
     - Vorher: `wU14 Tabellen` & `mU14 Tabellen`
     - Nachher: `wU14` & `mU14`

4. **Bereinigung Tab „Finalphase“ (`FinalsBracketView.tsx`)**:
   - Entfernung des Textes und Elements „Finalphase Sonntag“ (inklusive des Trophy-Icons im Header des Filters).
   - Die Umschalt-Buttons werden bereinigt:
     - Vorher: `wU14 Finals` (bzw. Finale) & `mU14 Finals`
     - Nachher: `wU14` & `mU14`

### 3.2 Explizit Out-of-Scope
- Änderungen am Admin-Bereich (`/admin`) oder Kiosk-Modus (`/kiosk`).
- Änderungen an den Datenmodellen oder der Berechnungslogik von Punkten und Tabellen.

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien

- [x] **AC-1: Eigener Reiter „Live“ in der oberen Navigation**
  - **Gegeben sei**: Ein Gast öffnet die Gäste-Ansicht (`/`).
  - **Wenn**: Die Navigationsleiste gerendert wird.
  - **Dann**: Enthält die Leiste vier Reiter: „Live“, „Spielplan“, „Tabellen“ und „Finalphase“.

- [x] **AC-2: Exklusive Anzeige des Live-Spiels im Tab „Live“**
  - **Gegeben sei**: Ein Gast navigiert zu `/#live`.
  - **Wenn**: Der Tab aktiv ist.
  - **Dann**: Wird die `LiveHeroCard` mit dem laufenden Spiel (oder nächsten anstehenden Spiel) angezeigt.
  - **Wenn**: Der Gast auf „Spielplan“, „Tabellen“ oder „Finalphase“ wechselt.
  - **Dann**: Wird die `LiveHeroCard` auf diesen Seiten nicht mehr gerendert; die Inhaltskomponente startet direkt oben auf der Seite.

- [x] **AC-3: Tab „Tabellen“ umbenannt & Header bereinigt**
  - **Gegeben sei**: Der Gast ruft den Reiter `Tabellen` (`/#standings`) auf.
  - **Wenn**: Die Seite gerendert wird.
  - **Dann**: Heißt der Reiter im Navigationsmenü „Tabellen“ (nicht mehr „Live-Tabellen“).
  - **Dann**: Ist der Text „Gruppentabellen“ neben dem Filter entfernt.
  - **Dann**: Tragen die beiden Filter-Buttons die Aufschrift `wU14` und `mU14` (ohne den Zusatz „Tabellen“).

- [x] **AC-4: Tab „Finalphase“ Header & Buttons bereinigt**
  - **Gegeben sei**: Der Gast ruft den Reiter `Finalphase` (`/#finals`) auf.
  - **Wenn**: Die Seite gerendert wird.
  - **Dann**: Ist der Text „Finalphase Sonntag“ neben dem Filter entfernt.
  - **Dann**: Tragen die beiden Filter-Buttons die Aufschrift `wU14` und `mU14` (ohne den Zusatz „Finals“ bzw. „Finale“).

### 4.2 Allgemeine Qualitätskriterien
- [x] Keine fest kodierten Parameter.
- [x] Vollständige TypeScript-Typisierung ohne `any`.
- [x] Fehlerfreier Build (`npm run build`) und Linting (`npm run lint`).
- [x] Sauberes Responsive-Verhalten auf Smartphones (iPhone/Android) und Desktop.

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Betroffene Ansichten & Komponenten
- `src/components/layouts/GuestLayout.tsx`:
  - 4 Navigations-Tabs: Live (`Radio`), Spielplan (`Calendar`), Tabellen (`Trophy`), Finalphase (`Medal`).
- `src/pages/guest/HomePage.tsx`:
  - Bedingtes Rendering: `LiveHeroCard` nur bei `activeTab === "live"`.
- `src/components/guest/StandingsView.tsx`:
  - Schlanker Gender-Filter: Buttons `wU14` und `mU14`, Wegfall der linken Titelzeile.
- `src/components/guest/FinalsBracketView.tsx`:
  - Schlanker Gender-Filter: Buttons `wU14` und `mU14`, Wegfall der linken Titelzeile.

### 5.2 Interaktionsablauf
1. Nutzer klickt in der Header-Navigation auf **Live** ➔ URL wechselt auf `/#live`, `LiveHeroCard` wird zentriert angezeigt.
2. Nutzer klickt auf **Spielplan** ➔ URL wechselt auf `/#schedule`, Spielplan-Liste beginnt direkt oben ohne vorgelagertes Hero-Element.
3. Nutzer klickt auf **Tabellen** ➔ URL wechselt auf `/#standings`, Tabellen mit kompaktem `wU14`/`mU14`-Filter erscheinen.
4. Nutzer klickt auf **Finalphase** ➔ URL wechselt auf `/#finals`, Finalbaum mit kompaktem `wU14`/`mU14`-Filter erscheint.

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Datenmodell (`DATABASE.md`)
- Keine Änderungen an Collections oder Feldern notwendig.

### 6.2 TypeScript Interfaces (`src/types/`)
- Keine Änderungen notwendig.

### 6.3 State & Firestore Listener
- Bestehende Listener (`matches`, `teams`, `config`) in `HomePage.tsx` bleiben unverändert aktiv.

---

## 7. Edge Cases & Fehlerbehandlung
- **Kein laufendes Spiel im Tab „Live“**: Wenn kein Spiel live oder pausiert ist, zeigt `LiveHeroCard` wie gewohnt das nächste anstehende Spiel oder den Hinweis „Turnierpause oder alle Spiele beendet“.
- **Direktaufruf ohne Hash (`/`)**: Standardmäßig wird `Spielplan` angezeigt (wie bisher), oder falls gewünscht `Live`. In der Spezifikation ist `Spielplan` als Default vorgesehen, damit Erstbesucher die volle Turnierübersicht sehen; der `Live`-Tab ist über den ersten Menüpunkt mit einem Klick erreichbar.

---

## 8. Verifikations- & Testplan

### 8.1 Manuelle Tests
1. [x] Aufruf von `/` ➔ Spielplan wird angezeigt ohne obere Hero-Card.
2. [x] Klick auf „Live“ ➔ `/#live` wird angezeigt, Hero-Card ist sichtbar.
3. [x] Klick auf „Tabellen“ ➔ `/#standings` wird angezeigt, Reiter heißt „Tabellen“, Buttons lauten „wU14“ und „mU14“, Text „Gruppentabellen“ ist entfernt.
4. [x] Klick auf „Finalphase“ ➔ `/#finals` wird angezeigt, Buttons lauten „wU14“ und „mU14“, Text „Finalphase Sonntag“ ist entfernt.
5. [x] Responsiver Test auf mobiler Auflösung: Filterleisten brechen nicht unerwünscht um.

### 8.2 Automatisierte Validierung
- [x] `npm run build` läuft ohne Fehler durch.
- [x] `npm run lint` fehlerfrei (0 Fehler, 0 Warnungen).
- [x] `npm test` mit allen 18 Tests erfolgreich.

---

## 9. Offene Fragen & Klärungsbedarf
- Keine offenen Fragen. Alle Anforderungen sind vollständig umgesetzt.
