# SPEC-050: Betreuerbereich – Tags, Hinweistext und strukturierter Linkaufbau

> **Status**: Abgeschlossen  
> **Typ**: Feature / UI- & Link-Optimierung  
> **Branch**: feat/SPEC-050-betreuerbereich-tags-hinweistext-und-linkformat  
> **Autor**: Antigravity  
> **Erstellt am**: 2026-10-20  
> **Letzte Änderung**: 2026-10-20  
> **Betroffene Bereiche**: Betreuer-Portal (`/jingle/:token` & `/team/:token`) | Turnierleitung (`/admin`) | Team-Service & Token-Generierung  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
1. **Einheitliche visuelle Tags**: Im Betreuer-Portal (`TeamJinglePage.tsx`) werden Altersklasse und Vorrundengruppe aktuell in einem gemeinsamen grauen Badge zusammengefasst (`Weibliche U14 • Gruppe A` auf `bg-slate-100 text-slate-600`). Im restlichen System (Scoreboard, Spielplan, Tabellen, Teamkarten) werden Geschlecht und Gruppe jedoch stets als zwei separate Tags in den etablierten CI-Farben dargestellt (wU14 in Lila, mU14 in Blau).
2. **Präziser Hinweistext**: Im Info-Kasten der Betreuerseite steht derzeit: *„Der Jingle wird bei einem Tor von der Turnierleitung für ca. 15 Sekunden eingespielt.“* Das Wort „ca.“ soll durch das verbindlichere „maximal“ ersetzt werden, um klarzustellen, dass die Einspielung höchstens 15 Sekunden dauert.
3. **Erkennbarkeit beim Link-Versand**: Betreuer-Links verwendeten bisher das Pfad-Präfix `/jingle/` und bestanden aus rein zufälligen 32-Zeichen-Hexwerten (z. B. `https://kbc-hallenhockey.web.app/jingle/4f8b919a3c7e42d...`). Der Link soll als Team-Link unter dem Pfad `/team/` geführt werden (da dort nicht nur Jingles, sondern auch der Kader gepflegt wird). Zudem ist in der reinen Hash-URL nicht ersichtlich, für welchen Verein und welche Altersklasse der Link bestimmt ist.

### 1.2 Zielzustand & Mehrwert
- **Getrennte Tags im bekannten CI-Farbschema**: Im oberen Teambanner der Betreuerseite werden zwei separate Tags angezeigt:
  - Geschlecht: `wU14` bzw. `mU14` (Lila für wU14: `bg-purple-50 text-purple-700 border-purple-200`; Blau für mU14: `bg-blue-50 text-blue-700 border-blue-200`)
  - Gruppe: `Gruppe {group}` im gleichen CI-Farbschema.
- **Klarer Hinweistext**: Der Text lautet nun verbindlich: *„Der Jingle wird bei einem Tor von der Turnierleitung für maximal 15 Sekunden eingespielt.“*
- **Selbsterklärender Linkaufbau unter `/team/`**: Der Betreuer-Link folgt dem Format:
  ```text
  https://<DOMAIN>/team/<KURZNAME>-<MU14/WU14>-<TOKEN>
  ```
  *(Beispiel: `https://.../team/KHC-WU14-4f8b919a3c7e42d887a...` oder `https://.../team/RRK-MU14-0e1b2c...`)*
- **Keine Altlasten / Keine Rückwärtskompatibilität erforderlich**: Da bisher noch keine Links an Betreuer verschickt wurden, werden die Tokens direkt und sauber im neuen Format `<KURZNAME>-<MU14/WU14>-<TOKEN>` als `jingleToken` in Firestore gespeichert und abgefragt.

---

## 2. User Stories

- **US-1**: Als **Betreuer eines Teams** möchte ich auf unserer Betreuerseite direkt getrennte Tags für unsere Altersklasse (`wU14`/`mU14`) und Gruppe (`Gruppe A`/`Gruppe B`) in den vertrauten Farben (Lila bzw. Blau) sehen, damit unsere Mannschaftszuordnung auf einen Blick visuell hervorgehoben ist.
- **US-2**: Als **Betreuer eines Teams** möchte ich im Hinweistext exakt lesen, dass der Torjingle für *maximal 15 Sekunden* eingespielt wird, damit Klarheit über die maximale Wiedergabedauer in der Halle besteht.
- **US-3**: Als **Turnierleiter** möchte ich beim Kopieren und Versenden der Betreuer-Links (über Team-Karten, Team-Edit-Modal oder Sammelübersicht) direkt in der URL das Format `<KURZNAME>-<MU14/WU14>-<TOKEN>` vorfinden, damit ich sofort fehlerfrei erkenne, an welches Team und welche Altersklasse der Link gesendet werden muss.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)
- [x] **FR-1: Getrennte Geschlechts- und Gruppen-Tags im Betreuerbereich (`TeamJinglePage.tsx`)**:
  - Trennung des kombinierten Badges in zwei eigenständige Badges.
  - Tag 1: `{team.gender}` (`wU14` bzw. `mU14`).
  - Tag 2: `Gruppe {team.group}`.
  - Farbgebung nach bekannten Farbklassen:
    - Wenn `team.gender === "wU14"`: `bg-purple-50 text-purple-700 border-purple-200`
    - Wenn `team.gender === "mU14"`: `bg-blue-50 text-blue-700 border-blue-200`
- [x] **FR-2: Hinweistext-Korrektur in `TeamJinglePage.tsx`**:
  - Änderung des Aufzählungspunkts von:
    *„Der Jingle wird bei einem Tor von der Turnierleitung für ca. 15 Sekunden eingespielt.“*  
    in:  
    *„Der Jingle wird bei einem Tor von der Turnierleitung für maximal 15 Sekunden eingespielt.“*
- [x] **FR-3: Strukturierter Link- und Tokenaufbau `/team/<KURZNAME>-<MU14/WU14>-<TOKEN>`**:
  - Betreuer-Links nutzen einheitlich den Pfad `/team/` (statt `/jingle/`).
  - Implementierung zentraler Formatierungs- und Generierungsfunktionen in `src/services/teamService.ts`:
    - `formatTeamJingleToken(shortName: string, gender: string, rawToken?: string): string`: Erzeugt `<KURZNAME>-<MU14/WU14>-<TOKEN>` mit bereinigtem Kurznamen (Großbuchstaben), standardisierter Altersklasse in Großbuchstaben (`WU14` oder `MU14`) und dem Secret-Token.
    - `generateJingleToken(shortName?: string, gender?: string): string`: Erzeugt direkt ein strukturiertes Token.
  - Aktualisierung aller Betreuerlink-Generierungsstellen in der Turnierleitung auf den Pfad `/team/`:
    - `TeamCard.tsx`: Einzel-Link kopieren (`/team/...`)
    - `TeamEditModal.tsx`: Link-Anzeige im Eingabefeld (`/team/...`), Kopieren-Button, Neugenerierung des Tokens
    - `TeamJingleOverviewModal.tsx`: Einzel-Link kopieren und „Alle Links kopieren“ (`/team/...`)
- [x] **FR-4: Token-Auflösung & automatische Strukturierung in `teamService.ts`**:
  - `getTeamByJingleToken(token: string)`:
    - Direkte Suche über das Feld `jingleToken` in Firestore.
  - `subscribeTeams`:
    - Alle Teams in Firestore, deren `jingleToken` noch nicht das Format `<KURZNAME>-<MU14/WU14>-<TOKEN>` aufweist, werden automatisch auf das neue Format aktualisiert.

### 3.2 Explizit Out-of-Scope
- Keine Änderungen an der Audio-Wiedergabelogik im Live-Desk oder der Einspieldauer-Steuerung.
- Keine Änderung der Routing-Pfade (`/jingle/:token` und `/team/:token` bleiben identisch bestehen).

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien
- [x] **AC-1: Farbige getrennte Tags im Teambanner der Betreuerseite**
  - **Gegeben sei**: Ein Betreuer öffnet den Betreuerbereich eines wU14-Teams (z. B. Kreuznacher HC, Gruppe A).
  - **Wenn**: Die Seite geladen ist.
  - **Dann**: Werden über dem Teamnamen zwei getrennte Badges in Lila (`bg-purple-50 text-purple-700 border-purple-200`) angezeigt: `wU14` und `Gruppe A`.
  - **Gegeben sei**: Ein Betreuer öffnet den Betreuerbereich eines mU14-Teams (z. B. Dürkheimer HC, Gruppe B).
  - **Dann**: Werden über dem Teamnamen zwei getrennte Badges in Blau (`bg-blue-50 text-blue-700 border-blue-200`) angezeigt: `mU14` und `Gruppe B`.

- [x] **AC-2: Hinweistext mit „maximal 15 Sekunden“**
  - **Gegeben sei**: Die Betreuerseite (`TeamJinglePage`) ist geöffnet und der Tab „Torjingle“ ist aktiv.
  - **Wenn**: Der Betreuer die Infobox am Seitenende liest.
  - **Dann**: Lautet der 3. Aufzählungspunkt: *„Der Jingle wird bei einem Tor von der Turnierleitung für maximal 15 Sekunden eingespielt.“*

- [x] **AC-3: Linkaufbau `/team/<KURZNAME>-<MU14/WU14>-<TOKEN>` in Admin-Ansichten**
  - **Gegeben sei**: Der Turnierleiter befindet sich im Admin-Bereich (`/admin`).
  - **Wenn**: Auf einer `TeamCard`, im `TeamEditModal` oder in der Sammelübersicht (`TeamJingleOverviewModal`) der Betreuerlink kopiert oder angezeigt wird.
  - **Dann**: Hat der Link das Format `https://<DOMAIN>/team/<KURZNAME>-<MU14/WU14>-<TOKEN>` (z. B. `https://.../team/KHC-WU14-3a7b...` oder `https://.../team/RRK-MU14-f91c...`).

- [x] **AC-4: Token-Auflösung und Auto-Migration**
  - **Gegeben sei**: Ein Betreuer ruft eine Betreuer-URL mit dem neuen Format auf (`/team/<KURZNAME>-<MU14/WU14>-<TOKEN>`).
  - **Wenn**: Die URL aufgerufen wird.
  - **Dann**: Wird das Team korrekt geladen, der Betreuer kann Jingle und Kader wie gewohnt pflegen und speichern.
  - **Und**: In `subscribeTeams` werden Teams in Firestore automatisch auf das neue Format aktualisiert.

### 4.2 Allgemeine Qualitätskriterien
- [x] Strikte TypeScript-Typisierung ohne `any`.
- [x] Fehlerfreier Build (`npm run build`) und sauberes Linting.
- [x] Beachtung der Firestore-Listener Lifecycle-Vorgaben.

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Betroffene Ansichten & Komponenten
- `src/pages/jingle/TeamJinglePage.tsx`: Teambanner-Tags und Hinweistext.
- `src/components/admin/TeamCard.tsx`: Betreuerlink-Generierung.
- `src/components/admin/TeamEditModal.tsx`: Betreuerlink-Feld & Regenerierung.
- `src/components/admin/TeamJingleOverviewModal.tsx`: Einzel- & Sammellinks.
- `src/services/teamService.ts`: Token-Formatierung, Migration und Auflösung.

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Datenmodell (`DATABASE.md`)
- Das Feld `jingleToken` in `teams/{teamId}` unterstützt nun standardmäßig das Format `${shortName}-${gender.toUpperCase()}-${secretHex}`.
- Das Schema bleibt abwärtskompatibel (Typ `string`).

### 6.2 TypeScript Interfaces (`src/types/database.ts`)
- Keine Breaking Changes; `jingleToken?: string` in `Team` bleibt unverändert.
