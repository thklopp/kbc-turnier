# SPEC-054: Team-Link Self-Service (/team/get-link) & Linkzähler-Sperre

> **Status**: In Review  
> **Typ**: Feature  
> **Branch**: `feat/SPEC-054-team-link-self-service-get-link`  
> **Autor**: Antigravity (nach `/grill-me` Abstimmung mit Nutzer)  
> **Erstellt am**: 2026-10-21  
> **Letzte Änderung**: 2026-10-21  
> **Betroffene Bereiche**: Betreuer-Portal (`/team/get-link` & `/team/:token`) | Turnierleitung (`/admin`) | Routing (`AppRouter.tsx`) | Datenbank/Firestore (`Team`-Schema)  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Bislang muss die Turnierleitung Betreuer-Links manuell aus dem Admin-Bereich (`/admin` -> Teams -> Bearbeiten / Jingle-Übersicht) kopieren und per E-Mail oder WhatsApp an Trainer und Betreuer verteilen. Bei 16 Teams bedeutet dies vor dem Turnier einen organisatorischen Mehraufwand.
Zudem gibt es derzeit keine Zugriffskontrolle darüber, ob ein Betreuer-Link bereits aktiv freigegeben wurde oder ob für ein Team versehentlich alte/mehrfache Links im Umlauf sind. 

### 1.2 Zielzustand & Mehrwert
- **Self-Service-Erstellung (`/team/get-link`)**: Betreuer und Trainer können über die direkte URL `/team/get-link` ihren Team-Link selbstständig abrufen bzw. generieren.
- **Zweistufige Team-Auswahl**:
  1. Auswahl des Vereins (z. B. „Kreuznacher HC“, gruppiert ohne Geschlechtszusatz aus den Teamnamen).
  2. Auswahl der Altersklasse / des Geschlechts („Weibliche U14 (wU14)“ bzw. „Männliche U14 (mU14)“), gefiltert nach den für diesen Verein vorhandenen Mannschaften.
- **Linkzähler & Token-Generierung**:
  - Jedes Team besitzt ein numerisches Feld `linkGenerationCount` (Standard: `0`).
  - Wenn `linkGenerationCount === 0`: Die Betreuerseite (`/team/:token`) ist vollständig gesperrt und zeigt einen klaren Hinweistext. Auf `/team/get-link` kann der Betreuer mit einem Klick auf „Link erstellen & anzeigen“ den initialen Link erzeugen. Dabei wird ein kryptografisch zufälliger Token erzeugt (`<KURZNAME>-<MU14/WU14>-<HEX32>`) und der Zähler auf `1` gesetzt.
  - Wenn `linkGenerationCount > 0`: Auf `/team/get-link` erscheint eine Warnung, dass für diese Mannschaft bereits ein Link generiert wurde. Klickt der Nutzer auf „Neuen Link generieren“, fordert ein Bestätigungsdialog zur Verifikation auf, dass der bisherige Link sofort ungültig wird. Nach Bestätigung wird ein neuer Token erzeugt, der Zähler inkrementiert und der neue Link mit Copy-Button angezeigt.
- **Turnierleitungs-Kontrolle im Admin-Bereich (`/admin`)**:
  - Anzeige des aktuellen Linkzählers an den Team-Karten, im Bearbeiten-Dialog und in der Sammelübersicht.
  - Möglichkeit, den Linkzähler einzeln pro Team oder gesammelt für alle Teams auf `0` zurückzusetzen.
  - Ein Reset auf `0` sperrt sofort den Zugriff auf die jeweilige Betreuerseite, bis über `/team/get-link` ein neuer Link generiert wird.
- **Tag-Bezeichnung**: Der Tag oben rechts im Kopfbereich der Betreuer- und Jingle-Ansicht (`TeamJinglePage.tsx`) wird von „Betreuer-Bereich“ in **„Team-Bereich“** umbenannt.
- **Zugänglichkeit**:
  - Die Seite `/team/get-link` ist rein über die direkte URL aufrufbar (kein Button in der Hauptnavigation oder im öffentlichen Footer), sodass die Turnierleitung den Link gezielt an Trainer/Betreuer weitergeben kann.

---

## 2. User Stories

- **US-1**: Als **Betreuer/Trainer** möchte ich unter `/team/get-link` meinen Verein und mein Geschlecht auswählen können, um eigenständig den Link zu unserem Betreuerbereich zu generieren und zu kopieren.
- **US-2**: Als **Betreuer/Trainer** möchte ich vor dem Neugenerieren eines Links gewarnt werden, wenn bereits ein Link für mein Team existiert, damit ich nicht versehentlich den bestehenden Zugang anderer Betreuer meines Teams ungültig mache.
- **US-3**: Als **Turnierleiter** möchte ich sehen, wie oft für jedes Team ein Link generiert wurde, und den Zähler jederzeit einzeln oder für alle Teams auf `0` zurücksetzen können, um den Zugang vor dem Turnierstart oder bei Fehlern gezielt zu sperren bzw. neu zu initialisieren.
- **US-4**: Als **Betreuer**, der einen veralteten oder bei Zähler = 0 aufgerufenen Link öffnet, möchte ich eine verständliche Erklärung sehen, dass der Link gesperrt oder noch nicht aktiviert ist, inklusive Hinweis auf `/team/get-link`.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)

- [ ] **FR-1: Datenbank-Erweiterung (`Team`-Schema)**:
  - Neues Feld `linkGenerationCount?: number` in `Team` (Standard `0`).
  - Neues optionales Feld `linkLastGeneratedAt?: Timestamp | null`.
  - Anpassung von `DATABASE.md` und `src/types/database.ts`.

- [ ] **FR-2: Self-Service-Seite `/team/get-link` (`TeamGetLinkPage.tsx`)**:
  - Eigene mobilfreundliche Route `/team/get-link` in `AppRouter.tsx` (ohne Admin-Layout, im CI-Design analog zum Betreuerbereich).
  - Zweistufige Auswahl:
    - Schritt 1: Dropdown / Auswahlliste der Vereine (eindeutig extrahierte Vereinsnamen ohne Geschlechtszusatz `(w)` / `(m)`).
    - Schritt 2: Dropdown / Auswahl des Geschlechts („Weibliche U14 (wU14)“ bzw. „Männliche U14 (mU14)“), abhängig vom gewählten Verein.
  - Zustand A (wenn `linkGenerationCount === 0`):
    - Info-Hinweis: Noch kein Link generiert.
    - Primärer Button: „Link erstellen & anzeigen“.
    - Nach Klick: Generiert neuen Token, setzt `linkGenerationCount: 1`, zeigt Erfolgsmeldung mit dem vollständigen Link, einem Copy-Button („Link kopieren“) und einem Button „Direkt zum Betreuerbereich“.
  - Zustand B (wenn `linkGenerationCount > 0`):
    - Warn-Badge/Hinweis: *„Für diese Mannschaft wurde bereits ein Link generiert. Wenn du einen neuen Link erstellst, wird der alte Link sofort ungültig.“*
    - Button: „Neuen Link generieren“.
    - Bei Klick: Bestätigungs-Modal („Achtung: Der bisherige Link wird dadurch sofort ungültig. Fortfahren?“).
    - Nach Bestätigung: Erzeugt neuen Zufalls-Token, inkrementiert `linkGenerationCount`, speichert in Firestore und zeigt neuen Link inkl. Copy-Button.

- [ ] **FR-3: Sperrlogik in der Betreuerseite (`TeamJinglePage.tsx`)**:
  - Prüfung beim Aufruf von `/team/:token` bzw. `/jingle/:token`:
    - Wenn `(team.linkGenerationCount ?? 0) === 0`: Zugriff verweigern und Sperrbildschirm anzeigen:
      *„Dieser Betreuer-Link ist gesperrt oder noch nicht aktiviert. Bitte generiere einen Link unter /team/get-link.“* inkl. Link zu `/team/get-link`.
    - Wenn `linkGenerationCount > 0`: Regulärer Zugriff auf Jingle-Upload und Kader-Verwaltung.

- [ ] **FR-4: Turnierleitungs-Funktionen im Admin-Bereich (`/admin`)**:
  - In `TeamCard.tsx`:
    - Anzeige des Zählerstands (z. B. Badge `Link-Zähler: X` oder `Gesperrt (0)`).
    - Aktion: „Zähler zurücksetzen (auf 0)“ mit Bestätigung.
  - In `TeamEditModal.tsx`:
    - Anzeige des Zählerstands mit Button „Auf 0 zurücksetzen“.
  - In `TeamJingleOverviewModal.tsx`:
    - Zusätzliche Spalte für den Link-Zähler.
    - Globaler Aktions-Button „Alle Link-Zähler auf 0 zurücksetzen“ mit Sicherheitsabfrage.

- [ ] **FR-5: Service-Funktionen in `teamService.ts`**:
  - `generateTeamLink(teamId: string): Promise<{ team: Team; fullUrl: string }>`:
    - Generiert neuen Token via `formatTeamJingleToken(...)`, setzt `linkGenerationCount = (current || 0) + 1`, aktualisiert `jingleToken` und Zeitstempel.
  - `resetTeamLinkCount(teamId: string): Promise<void>`:
    - Setzt `linkGenerationCount = 0` für das Team.
  - `resetAllTeamLinkCounts(): Promise<void>`:
    - Setzt per Batch-Update `linkGenerationCount = 0` für alle Teams.

- [ ] **FR-6: Tag-Anpassung in `TeamJinglePage.tsx`**:
  - Der Badge im Header oben rechts wird von `Betreuer-Bereich` in `Team-Bereich` geändert.

### 3.2 Explizit Out-of-Scope
- Kein Passwort-/PIN-Schutz auf `/team/get-link` (die Zugriffskontrolle erfolgt über Vereins- und Geschlechtsauswahl sowie Token-Invalidierung).
- Keine Verlinkung von `/team/get-link` im öffentlichen Gast-Menü oder Gast-Footer.

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien

- [ ] **AC-1: Zweistufige Vereins- und Geschlechtsauswahl**
  - **Gegeben sei**: Ein Betreuer öffnet `/team/get-link`.
  - **Wenn**: Er die Seite sieht.
  - **Dann**: Sieht er zunächst ein Dropdown mit allen teilnehmenden Vereinen (ohne doppelte Einträge und ohne `(w)`/`(m)`-Zusatz).
  - **Wenn**: Ein Verein ausgewählt wird.
  - **Dann**: Werden im zweiten Dropdown nur die Altersklassen/Geschlechter angezeigt, die für diesen Verein existieren (z. B. `wU14` und `mU14`).

- [ ] **AC-2: Erstmalige Link-Generierung bei Zähler = 0**
  - **Gegeben sei**: Für ein Team steht `linkGenerationCount` auf `0`.
  - **Wenn**: Der Betreuer das Team auswählt und auf „Link erstellen & anzeigen“ klickt.
  - **Dann**: Wird ein neuer Token generiert, `linkGenerationCount` wird auf `1` gesetzt und der erzeugte Betreuerlink (`https://<domain>/team/<KURZNAME>-<GESCHLECHT>-<TOKEN>`) wird mit einem Copy-Button angezeigt.

- [ ] **AC-3: Warnung und Bestätigung bei bestehendem Link (Zähler > 0)**
  - **Gegeben sei**: Für ein ausgewähltes Team ist `linkGenerationCount >= 1`.
  - **Wenn**: Das Team auf `/team/get-link` ausgewählt ist.
  - **Dann**: Erscheint ein deutlicher Warnhinweis, dass bereits ein Link existiert.
  - **Wenn**: Der Nutzer auf „Neuen Link generieren“ klickt.
  - **Dann**: Öffnet sich ein Bestätigungsdialog mit der Warnung, dass der alte Link sofort ungültig wird.
  - **Wenn**: Der Dialog bestätigt wird.
  - **Dann**: Wird ein neuer Token generiert, der Zähler inkrementiert und der neue Link angezeigt. Der alte Link verliert sofort seine Gültigkeit.

- [ ] **AC-4: Zugriffssperre auf `/team/:token` bei Zähler = 0**
  - **Gegeben sei**: Der Linkzähler eines Teams steht auf `0`.
  - **Wenn**: Ein Betreuer die URL `/team/:token` aufruft.
  - **Dann**: Erscheint die Sperrmeldung („Dieser Betreuer-Link ist gesperrt oder noch nicht aktiviert. Bitte generiere einen Link unter /team/get-link“) und Upload- sowie Kaderfunktionen sind nicht zugänglich.

- [ ] **AC-5: Admin-Reset einzeln und gesammelt**
  - **Gegeben sei**: Der Turnierleiter ist im Admin-Bereich (`/admin`).
  - **Wenn**: Er bei einem Team auf „Zähler zurücksetzen“ klickt und bestätigt.
  - **Dann**: Wird `linkGenerationCount` dieses Teams auf `0` gesetzt und dessen Betreuerbereich sofort gesperrt.
  - **Wenn**: Er im Jingle-Übersichts-Modal auf „Alle Zähler auf 0 zurücksetzen“ klickt und bestätigt.
  - **Dann**: Werden alle Teams auf `linkGenerationCount = 0` gesetzt.

- [ ] **AC-6: Tag-Bezeichnung „Team-Bereich“**
  - **Gegeben sei**: Ein Team-Link wird aufgerufen (`/team/:token`).
  - **Wenn**: Die Seite geladen ist.
  - **Dann**: Zeigt das Badge oben rechts den Text „Team-Bereich“ an (statt zuvor „Betreuer-Bereich“).

### 4.2 Allgemeine Qualitätskriterien
- Keine fest kodierten Parameter.
- Vollständige TypeScript-Typisierung ohne `any`.
- Fehlerfreie Ausführung von `npm run build` und bestehende Tests laufen grün durch.
- Sauberes Aufräumen aller Firestore-Listener (`unsubscribe`).

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Betroffene Ansichten & Komponenten
- **`/team/get-link`**:
  - Saubere, zentrierte Card-Ansicht im KBC-Turnierdesign (Logo oben, klare Überschrift „Betreuer-Link anfordern“).
  - Auswahlelemente für Verein und Geschlecht.
  - Statushinweise (Info bei 0, Warnung bei > 0).
  - Link-Anzeige mit One-Click-Copy-Button und Direktlink.
- **`/team/:token` (`TeamJinglePage.tsx`)**:
  - Eigener gesperrter Zustand bei `linkGenerationCount === 0`.
- **`/admin` (`TeamCard.tsx`, `TeamEditModal.tsx`, `TeamJingleOverviewModal.tsx`)**:
  - Anzeige des Zählerstands `linkGenerationCount`.
  - Einzel-Reset- und Sammel-Reset-Buttons.

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Datenmodell (`DATABASE.md`)
In `teams/{teamId}`:
```typescript
interface TeamPatch {
  linkGenerationCount?: number;     // Anzahl der Link-Generierungen (0 = gesperrt / nicht aktiviert)
  linkLastGeneratedAt?: Timestamp;  // Zeitpunkt der letzten Link-Generierung
}
```

### 6.2 TypeScript Interfaces (`src/types/database.ts`)
Erweiterung des `Team`-Interfaces um `linkGenerationCount?: number` und `linkLastGeneratedAt?: Timestamp | null`.

---

## 7. Test- & Verifikationsplan

- Unit- / Service-Tests:
  - `generateTeamLink`: Prüft Inkrementierung von `linkGenerationCount` und Erzeugung eines gültigen Tokens.
  - `resetTeamLinkCount` & `resetAllTeamLinkCounts`: Prüft Setzen auf `0`.
- Manuelle Tests:
  - Fluss A: Aufruf `/team/get-link`, Auswahl Verein + Geschlecht bei Zähler 0 -> Link generieren -> Kopieren -> Betreuerbereich aufrufen -> funktioniert.
  - Fluss B: Erneuter Aufruf `/team/get-link` -> Warnung wird angezeigt -> Bestätigen -> Neuer Link generiert -> Alter Link ungültig, neuer Link funktioniert.
  - Fluss C: Im Admin Zähler auf 0 zurücksetzen -> Betreuerbereich aufrufen -> Sperrmeldung erscheint.
