# SPEC-018: Standard-Ansicht Live & Entfernung Footer-Info-Element in Gast-Ansicht

> **Status**: In Abnahme  
> **Typ**: Feature / UI-Bereinigung  
> **Branch**: feat/SPEC-018-standardansicht-live-und-footer-cleanup  
> **Autor**: Antigravity  
> **Erstellt am**: 2026-10-09  
> **Letzte Änderung**: 2026-10-09  
> **Betroffene Bereiche**: Gast-Ansicht (/)  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
1. **Standard-Tab der Startseite**: Bislang fungiert der "Spielplan" (`#schedule`) als Standardansicht, wenn Besucher die Gast-Startseite (`/`) ohne spezifisches Fragment aufrufen. Während des Turniers interessieren sich Gäste, Spieler und Betreuer jedoch vorrangig für das aktuelle Spielgeschehen, den Live-Score und die nächste anstehende Begegnung (Hero-Card).
2. **Überflüssiges Info-Element**: Direkt unterhalb der Hauptansicht in der `HomePage` befindet sich aktuell eine weiße Infobox mit folgendem Inhalt:
   - *"Aktiver Turniertag: Samstag • 12 Teams"*
   - *"Live Sync via Firestore onSnapshot"*  
   Diese Information stellt ein technisches Überbleibsel aus früheren Entwicklungs- und Testphasen dar und bietet für Gäste keinen relevanten Mehrwert. Zudem verbraucht sie wertvollen vertikalen Platz auf mobilen Endgeräten.

### 1.2 Zielzustand & Mehrwert
- Beim Aufruf der Startseite (`/`) oder mit dem Fragment `#live` ist sofort und standardmäßig die **Live-Ansicht** (`LiveHeroCard`) aktiv und der Tab "Live" in der Sub-Navigation hervorgehoben.
- Der Spielplan bleibt weiterhin wie gewohnt über den Tab-Klick bzw. die URL `/#schedule` erreichbar.
- Das Footer-Info-Element mit dem aktiven Spieltag und dem Text *"Live Sync via Firestore onSnapshot"* wird vollständig entfernt.
- Durch die Entfernung der Infobox entfällt die Notwendigkeit der Tournament-Config-Subscription in `HomePage.tsx`, wodurch unnötige Firestore-Listener eingespart werden.

---

## 2. User Stories

- **US-1**: Als **Turniergast oder Spieler auf dem Smartphone** möchte ich **beim Aufrufen der Turnier-Webseite sofort das aktuelle Spielgeschehen und den Live-Score sehen**, um **ohne Umwege den aktuellen Spielstand zu erfahren**.
- **US-2**: Als **Zuschauer** möchte ich **unterhalb des Live-Spiels eine aufgeräumte Ansicht ohne störende technische Debug-Meldungen wie "Live Sync via Firestore onSnapshot" haben**, um **ein modernes, professionelles Nutzererlebnis zu erhalten**.
- **US-3**: Als **Turniergast** möchte ich **weiterhin jederzeit mit einem Fingertipp auf den Tab „Spielplan“ alle Begegnungen des Tages einsehen können**, um **kommende Spiele meines Teams zu planen**.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)
- [x] **Standard-Tab auf Live setzen (`HomePage.tsx`)**:
  - Wenn kein URL-Hash vorliegt oder der Hash weder `#schedule`, `#standings` noch `#finals` ist, ist der `activeTab` automatisch `"live"`.
- [x] **Tab-Aktivierung im Layout (`GuestLayout.tsx`)**:
  - Der Tab "Live" wird als aktiv markiert, wenn die Startseite aufgerufen wird und kein anderer Tab explizit angewählt ist (`isLive = isHome && !isSchedule && !isStandings && !isFinals`).
  - Der Tab "Spielplan" wird aktiv markiert, wenn der Hash explizit `#schedule` lautet.
- [x] **Entfernung des Footer-Info-Elements (`HomePage.tsx`)**:
  - Vollständiges Entfernen des Containers mit `Aktiver Turniertag:` und `Live Sync via Firestore onSnapshot`.
  - Bereinigung nicht mehr benötigter Imports und Subscriptions (`subscribeTournamentConfig`, `TournamentConfig`, `getDefaultConfig`).

### 3.2 Explizit Out-of-Scope
- Änderungen am Kiosk-Modus (`/kiosk`) oder an der Turnierleitung (`/admin`).
- Änderungen an den Inhalten der `LiveHeroCard` selbst (Team-Logos, Spielzeit, Tore, Karten etc.).
- Änderungen am Datenmodell in Firestore.

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien

- [x] **AC-1: Standardansicht beim Startseitenaufruf ist Live**
  - **Gegeben sei (Given)**: Ein Nutzer öffnet die Gast-Ansicht über die URL `/` ohne Hash.
  - **Wenn (When)**: Die Seite lädt.
  - **Dann (Then)**: Wird die Live-Ansicht (`LiveHeroCard`) gerendert und in der Header-Subnavigation ist der Tab **Live** aktiv (blau unterstrichen).

- [x] **AC-2: Klick auf Spielplan öffnet weiterhin den Spielplan**
  - **Gegeben sei**: Der Nutzer befindet sich auf `/` (Live-Ansicht).
  - **Wenn**: Der Nutzer in der Subnavigation auf „Spielplan“ klickt (URL wechselt zu `/#schedule`).
  - **Dann**: Wird der Spielplan (`GuestScheduleView`) gerendert und der Tab **Spielplan** ist aktiv.

- [x] **AC-3: Entfernung des Debug-/Sync-Infobox-Elements**
  - **Gegeben sei**: Der Nutzer betrachtet die Live-Ansicht (`/` oder `/#live`).
  - **Wenn**: Die Ansicht gerendert wird.
  - **Dann**: Ist unterhalb der Spielkarte (`LiveHeroCard`) kein Banner/Kasten mehr mit dem Text „Aktiver Turniertag: Samstag • ...“ und „Live Sync via Firestore onSnapshot“ sichtbar.
  - **Und**: Dies gilt gleichermaßen auch für die Tabs Spielplan, Tabellen und Finalphase.

- [x] **AC-4: Sauberer Listener-Lifecycle**
  - **Gegeben sei**: Die Gast-Startseite lädt.
  - **Wenn**: Die Seite gerendert wird.
  - **Dann**: Gibt es keinen ungenutzten Firestore-Listener für `tournamentConfig` in `HomePage.tsx`.

### 4.2 Allgemeine Qualitätskriterien
- [x] Keine TypeScript-Fehler und kein `any`.
- [x] Erfolgreicher Build via `npm run build` und sauberes Linting.
- [x] Keine optischen Regressionen auf Mobilgeräten oder Desktop.

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Betroffene Ansichten & Komponenten
- `src/pages/guest/HomePage.tsx`:
  - `activeTab`: Default-Logik umkehren (Fallback von `"schedule"` auf `"live"`).
  - Footer-Info-Box entfernen.
- `src/components/layouts/GuestLayout.tsx`:
  - Bestimmung von `isLive` und `isSchedule` anpassen:
    - `isSchedule = isHome && hash === "#schedule"`
    - `isStandings = isHome && hash === "#standings"`
    - `isFinals = isHome && hash === "#finals"`
    - `isLive = isHome && !isSchedule && !isStandings && !isFinals`

### 5.2 Interaktionsablauf
1. Besucher surft auf `https://<domain>/`.
2. Besucher sieht direkt die Live-Karte mit der aktuellen bzw. nächsten Partie sowie den Tabs `Live`, `Spielplan`, `Tabellen`, `Finalphase`.
3. Kein störender grauer/weißer Info-Kasten mehr am Fuß der Seite.
4. Klick auf `Spielplan` wechselt die Ansicht reibungslos zum gesamten Spielplan (`/#schedule`).

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Datenmodell (`DATABASE.md`)
- Keine Änderungen erforderlich.

### 6.2 TypeScript Interfaces (`src/types/`)
- Keine Änderungen erforderlich.

### 6.3 State & Firestore Listener
- In `src/pages/guest/HomePage.tsx` wird `subscribeTournamentConfig` sowie der State `config` entfernt.
- `subscribeMatches` und `subscribeTeams` bleiben unberührt.

---

## 7. Edge Cases & Fehlerbehandlung
- **Direktaufruf mit veraltetem oder ungültigem Hash (z. B. `/#unknown`)**: Fallback greift sicher auf `"live"`.
- **Aktualisierung / Reload (F5)**: Bei Reload auf `/` bleibt "Live" aktiv; bei Reload auf `/#schedule` bleibt "Spielplan" aktiv.

---

## 8. Verifikations- & Testplan

### 8.1 Manuelle Tests
1. [x] Aufruf von `/` im Browser: Live-Tab aktiv, LiveHeroCard wird angezeigt.
2. [x] Prüfung: Kein Element "Aktiver Turniertag" / "Firebase Sync" sichtbar.
3. [x] Klick auf Tab "Spielplan": URL wird `/#schedule`, Spielplan-Liste wird angezeigt.
4. [x] Klick auf Tab "Tabellen" / "Finalphase": Navigation funktioniert einwandfrei.
5. [x] Klick auf Tab "Live": Kehrt zur Live-Ansicht zurück.

### 8.2 Automatisierte Validierung
- [x] `npm run build` führt fehlerfrei aus.

---

## 9. Offene Fragen & Klärungsbedarf
- Keine offenen Fragen. Anforderungen sind eindeutig spezifiziert.
