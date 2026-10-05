# SPEC-001: Konsolidierung der Admin-Navigation & Reaktivierung der oberen Reiterleiste

> **Status**: In Review  
> **Typ**: UX-Optimierung / Refactoring  
> **Branch**: `feat/SPEC-001-admin-navigation`  
> **Autor**: Antigravity Agent  
> **Erstellt am**: 2026-10-05  
> **Letzte Änderung**: 2026-10-05  
> **Betroffene Bereiche**: Turnierleitung (`/admin`)  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Auf der Admin-Seite (`/admin`, Turnierleitung) existieren aktuell zwei redundante Reiter-Leisten zur Navigation zwischen den Kernbereichen:
1. **Obere Sub-Navigationsleiste im Header (`AdminLayout.tsx`)**:
   - Reiter: `Live-Desk (Turnierleitung)` (`/admin`), `Teams & Torjingles (M2)` (`/admin#teams`), `Zeiten & Spielplan (M3)` (`/admin#schedule`).
   - **Problem**: Diese Links haben gegenwärtig keine Funktion für den Inhaltswechsel, da `AdminPage.tsx` seinen aktiven Zustand ausschließlich in einem isolierten React-State (`useState`) verwaltet und nicht auf URL-Hash-Änderungen reagiert. Zudem ist das Aktiv-Styling in `AdminLayout` statisch an `pathname === "/admin"` gekoppelt, wodurch stets der erste Reiter optisch aktiv bleibt.
2. **Mittlere Reiterleiste im Inhaltsbereich (`AdminPage.tsx`)**:
   - Buttons: `Mannschaften & Torjingles (M2)`, `Zeitsteuerung & Spielplan (M3)`, `Turnierleitung Live-Desk (M4)`.
   - **Problem**: Doppelte Bedienelemente verwirren den Nutzer, verbrauchen wertvollen vertikalen Platz auf Tablets/Laptops und weisen inkonsistente Bezeichnungen/Reihenfolgen auf.

### 1.2 Zielzustand & Mehrwert
- Die redundante mittlere Reiterleiste in `AdminPage.tsx` wird vollständig entfernt.
- Die obere Sub-Navigationsleiste in `AdminLayout.tsx` wird die **alleinige Single Source of Truth** für die Bereichsnavigation im Admin-Bereich.
- Die Navigation wird URL-hash-basiert (Deep-Link-fähig) gestaltet:
  - `/admin` bzw. `/admin#desk` -> Live-Desk (Turnierleitung)
  - `/admin#teams` -> Mannschaften & Torjingles
  - `/admin#schedule` -> Zeitsteuerung & Spielplan
- Durch das hash-basierte Routing funktionieren Lesezeichen, Deep Links und die Browser-Historie (Vor/Zurück-Button) ohne Seiten-Reloads.
- Der vertikale Arbeitsbereich für die Turnierleitung am Kampfgericht wird vergrößert und aufgeräumter.

---

## 2. User Stories

- **US-1**: Als **Turnierleiter am Kampfgericht** möchte ich **über die obere Leiste mit einem Klick zwischen Live-Desk, Teamverwaltung und Spielplan wechseln können**, um **eine intuitive, platzsparende und schnelle Navigation ohne verwirrende Doppel-Reiter zu haben**.
- **US-2**: Als **Turnierleiter** möchte ich **eine direkte URL wie `https://kbc.rrk08.club/admin#teams` aufrufen oder teilen können**, um **sofort im gewünschten Verwaltungsbereich zu landen**.
- **US-3**: Als **Turnierleiter** möchte ich **an der oberen Leiste jederzeit klar erkennen, welcher Reiter gerade aktiv ist**, um **visuelle Orientierung zu behalten**.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)
- [ ] **Entfernung der redundanten Button-Leiste**: Löschen des Abschnitts `/* Mode Switcher Tabs */` aus `AdminPage.tsx`.
- [ ] **Hash-basierte Zustandssynchronisation**:
  - `AdminPage.tsx` liest den aktuellen Hash aus der URL (`useLocation().hash`).
  - Standard (Fallback bei leerem Hash `""` oder unbekanntem Hash): Anzeige des `LiveMatchDesk` (Reiter `desk`).
  - `#teams`: Anzeige von `TeamList`.
  - `#schedule`: Anzeige von `ScheduleManager`.
- [ ] **Aktive Anzeige in der oberen Navigationsleiste (`AdminLayout.tsx`)**:
  - Dynamische Hervorhebung des tatsächlich aktiven Reiters anhand des URL-Hashes (`border-b-2 border-blue-400 text-blue-400`).
  - Nicht-aktive Reiter besitzen das dezente Hover-Styling (`text-slate-400 hover:text-white`).
- [ ] **Browser History & Deep Linking**:
  - Wechsel per Klick auf die Links aktualisiert den Hash ohne Voll-Reload (`<Link to="/admin#...">`).
  - Vor-/Zurück-Navigation im Browser wechselt den angezeigten Tab synchron mit.
- [ ] **Bereinigung der Bezeichnungen**:
  - Entfernen der temporären Meilenstein-Kürzel `(M2)`, `(M3)`, `(M4)` für eine professionelle Produktiv-UI (siehe Abschnitt 5 und 9).

### 3.2 Explizit Out-of-Scope
- Änderung der Inhalte oder Logik innerhalb der Teilkomponenten (`LiveMatchDesk`, `TeamList`, `ScheduleManager`).
- Änderung der globalen Header-Elemente (Gäste-Ansicht-Link, Admin-Status-Badge, Abmelde-Button).
- Änderungen an den Firestore-Datenstrukturen oder Backend-Regeln.

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien

- [ ] **AC-1: Umschalten per oberer Navigationsleiste**
  - **Gegeben sei (Given)**: Der Turnierleiter ist unter `/admin` eingeloggt.
  - **Wenn (When)**: Der Nutzer in der oberen Navigationsleiste auf „Teams & Torjingles“ klickt.
  - **Dann (Then)**: Wechselt die URL zu `/admin#teams`, der Reiter „Teams & Torjingles“ wird optisch als aktiv hervorgehoben und die Team-Verwaltungskomponente (`TeamList`) wird angezeigt.

- [ ] **AC-2: Umschalten auf Zeiten & Spielplan**
  - **Gegeben sei**: Der Nutzer befindet sich auf `/admin#teams`.
  - **Wenn**: Der Nutzer auf „Zeiten & Spielplan“ klickt.
  - **Dann**: Wechselt die URL zu `/admin#schedule`, der Reiter „Zeiten & Spielplan“ wird aktiv markiert und `ScheduleManager` wird angezeigt.

- [ ] **AC-3: Deep Linking / Direktaufruf mit Hash**
  - **Gegeben sei**: Ein Browser öffnet direkt die URL `https://kbc.rrk08.club/admin#teams`.
  - **Wenn**: Die Seite lädt und der Auth-Guard passiert ist.
  - **Dann**: Wird sofort der Tab `Teams & Torjingles` geöffnet und der entsprechende Reiter oben ist markiert.

- [ ] **AC-4: Standardansicht ohne Hash**
  - **Gegeben sei**: Der Nutzer ruft `/admin` ohne Hash auf.
  - **Wenn**: Die Seite gerendert wird.
  - **Dann**: Wird standardmäßig der `Live-Desk (Turnierleitung)` angezeigt und der erste Reiter ist als aktiv markiert.

- [ ] **AC-5: Keine redundanten Reiter im Seiteninhalt**
  - **Gegeben sei**: Der Nutzer befindet sich auf einer beliebigen Admin-Ansicht (`/admin`, `/admin#teams`, `/admin#schedule`).
  - **Wenn**: Die Seite betrachtet wird.
  - **Dann**: Gibt es in der Seitenmitte keine zweite Leiste mit Buttons („Mannschaften & Torjingles“, „Zeitsteuerung & Spielplan“, „Turnierleitung Live-Desk“) mehr.

- [ ] **AC-6: Browser-Historie (Vor / Zurück)**
  - **Gegeben sei**: Der Nutzer navigiert von `/admin` zu `/admin#teams` und dann zu `/admin#schedule`.
  - **Wenn**: Der Nutzer den Browser-Zurück-Button betätigt.
  - **Dann**: Wechselt die URL zu `/admin#teams` und der Inhalt wechselt automatisch zu `TeamList`.

### 4.2 Allgemeine Qualitätskriterien
- [ ] Keine fest kodierten Parameter.
- [ ] Vollständige TypeScript-Typisierung ohne `any`.
- [ ] Fehlerfreie Ausführung von `npm run build` und `npm run lint`.
- [ ] Keine React-Warnungen bezüglich unkontrollierter Komponenten oder fehlender Keys.

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Betroffene Ansichten & Komponenten
- **Pfad / URL**: `/admin`, `/admin#teams`, `/admin#schedule`, `/admin#desk`
- **Komponenten**:
  - `src/components/layouts/AdminLayout.tsx`: Navigationsleiste mit aktiver Hash-Erkennung.
  - `src/pages/admin/AdminPage.tsx`: Hash-Auswertung und Entfernung der redundanten Buttons.
- **Geplante Reiter-Beschriftung (aufgeräumt)**:
  1. `Live-Desk (Turnierleitung)` (Icon: `PlayCircle`, Ziel: `/admin#desk` bzw. `/admin`)
  2. `Teams & Torjingles` (Icon: `Users`, Ziel: `/admin#teams`)
  3. `Zeiten & Spielplan` (Icon: `Calendar`, Ziel: `/admin#schedule`)

### 5.2 Layout-Vergleich
- **Vorher**:
  - Oben: Dunkle Leiste mit 3 inaktiven Links.
  - Kacheln: 3 Info-Kacheln (Turniertag, Rhythmus, Audio Engine).
  - Mitte: 3 blaue/graue Switcher-Buttons.
  - Unten: Inhaltskomponente.
- **Nachher**:
  - Oben: Dunkle Leiste mit 3 voll funktionalen Reitern und aktivem Unterstrich.
  - Kacheln: 3 Info-Kacheln bleiben erhalten.
  - Mitte: Keine störenden Doppel-Reiter mehr.
  - Unten: Direkt die gewählte Inhaltskomponente (`LiveMatchDesk`, `TeamList` oder `ScheduleManager`).

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Datenmodell (`DATABASE.md`)
- Keine Änderungen an Firestore-Dokumenten oder Collections erforderlich.

### 6.2 TypeScript Interfaces (`src/types/`)
- Keine Änderungen an TypeScript-Typdefinitionen erforderlich.

### 6.3 State & Navigation
- In `AdminLayout.tsx`:
  - Nutzung von `useLocation()` aus `react-router-dom`.
  - Auswertung von `location.hash`:
    ```typescript
    const currentHash = location.hash || "#desk"
    const isLiveDesk = currentHash === "#desk" || currentHash === "" || currentHash === "#live"
    const isTeams = currentHash === "#teams"
    const isSchedule = currentHash === "#schedule"
    ```
- In `AdminPage.tsx`:
  - Ersetzen des internen `useState<"teams" | "desk" | "schedule">("teams")` durch eine abgeleitete Variable aus `useLocation().hash`:
    ```typescript
    const { hash } = useLocation()
    const activeTab = hash === "#teams" ? "teams" : hash === "#schedule" ? "schedule" : "desk"
    ```
  - Dadurch bleibt kein asynchroner Zwischenstate hängen; URL und View sind strikt gekoppelt.

### 6.4 Audio & Storage
- Keine Auswirkungen auf Torjingle-Playback oder File-Uploads.

---

## 7. Edge Cases & Fehlerbehandlung

- **Unbekannter Hash (z. B. `/admin#unbekannt`)**:
  - Automatischer Fallback auf den Standard-Tab `desk` (`LiveMatchDesk`).
- **Verlust von Formular-Eingaben beim Tab-Wechsel**:
  - Das Bearbeiten von Teams oder Spielplan erfolgt bereits in modalen Dialogen (`TeamEditModal`, `MatchEditModal`, `DelayShiftModal`), sodass ein versehentlicher Klick auf die obere Leiste laufende modale Editiervorgänge nicht unbemerkt zerstört.
- **Direktlink `/admin` ohne Hash**:
  - Wird als Standard-Ansicht interpretiert und zeigt den `Live-Desk` an; der Reiter `Live-Desk (Turnierleitung)` ist aktiv markiert.

---

## 8. Verifikations- & Testplan

### 8.1 Manuelle Tests
1. [ ] Aufruf von `/admin` -> Prüfen, ob `Live-Desk` geöffnet ist und der Reiter `Live-Desk (Turnierleitung)` aktiv unterstrichen ist.
2. [ ] Klick auf `Teams & Torjingles` -> Prüfen, ob URL auf `/admin#teams` springt, der zweite Reiter aktiv ist und `TeamList` angezeigt wird.
3. [ ] Klick auf `Zeiten & Spielplan` -> Prüfen, ob URL auf `/admin#schedule` springt, der dritte Reiter aktiv ist und `ScheduleManager` angezeigt wird.
4. [ ] Browser-Reload auf `/admin#schedule` -> Prüfen, ob `ScheduleManager` nach Reload geöffnet bleibt.
5. [ ] Betätigen des Browser-Zurück-Buttons -> Prüfen, ob die Ansicht zurück zu `#teams` springt.
6. [ ] Sichtprüfung: Sicherstellen, dass keine doppelten Reiter mehr in der Seitenmitte zu sehen sind.

### 8.2 Automatisierte Tests / Validierung
- [ ] `npm run build` wird ohne Fehler und Warnungen ausgeführt.
- [ ] `npm run lint` validiert fehlerfrei.

---

## 9. Offene Fragen & Klärungsbedarf
- Keine weiteren offenen Fragen: Die Vereinheitlichung auf die obere Navigationsleiste entspricht exakt der Benutzeranforderung. Bereinigung der Bezeichnungen um Meilenstein-Kürzel wie `(M2)` wird zur Freigabe vorgeschlagen.
