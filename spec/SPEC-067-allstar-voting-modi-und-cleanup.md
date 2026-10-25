# SPEC-067: Allstar-Abstimmung: 3 Modi-Steuerung und Cleanup

> **Status**: In Abnahme  
> **Typ**: Feature / Refactoring  
> **Branch**: feat/SPEC-067-allstar-voting-modi-und-cleanup  
> **Autor**: Antigravity  
> **Erstellt am**: 2026-10-25  
> **Letzte Änderung**: 2026-10-25  
> **Betroffene Bereiche**: Turnierleitung (/admin#allstars), Team-Ansicht (/team/:token#allstars), Services (`allstarService.ts`, `configService.ts`), Datenbank/Firestore (`config/tournament`)  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Bisher konnte die Allstar-Abstimmung in der Turnierverwaltung lediglich binär ein- oder ausgeschaltet werden (`allstarVotingOpen: boolean`). Für einen reibungslosen Turnierablauf sind jedoch drei klar getrennte Betriebsphasen erforderlich:
1. **Vor dem Start / In Kürze**: Teams haben Zugriff auf ihren Team-Link, aber die Abstimmung soll noch nicht gestartet sein. Es soll ein klarer Hinweis auf den Abstimmungszeitraum zu sehen sein, ohne dass verfrühte Eingaben möglich sind.
2. **Offen zur Abstimmung**: Teams können ihre Stimmen abgeben und editieren.
3. **Geschlossen**: Die Abstimmung ist beendet. Bereits abgegebene Stimmen der Teams sind gesichert und im Formular schreibgeschützt (geblockt) sichtbar; neue Eingaben oder Änderungen sind nicht mehr möglich.

Zudem existiert in der Adminoberfläche unter `/admin#allstars` ein Button „Kader kopieren“, der in der Praxis nicht benötigt wird und entfernt werden soll.

### 1.2 Zielzustand & Mehrwert
- **Drei eindeutige Modi**: `upcoming` („In Kürze“), `open` („Geöffnet“), `closed` („Geschlossen“), zentral gesteuert in der Turnierleitung via Segmented Control / Button-Gruppe.
- **Konsistente Team-Ansicht**: 
  - Hinweistext zum Abstimmungszeitraum („Die Abstimmung ist ab dem Start des ersten Spiels bis 10 Minuten nach dem letzten Finalspiel geöffnet.“) in allen Modi.
  - Modus 1 (`upcoming`): Keine Eingabefelder sichtbar, stattdessen ansprechende Info-Karte mit Erläuterungen und Status-Badge „In Kürze verfügbar“.
  - Modus 2 (`open`): Interaktives Wahlformular aktiv mit Status-Badge „Abstimmung geöffnet“.
  - Modus 3 (`closed`): Wahlfelder gesperrt (`disabled`). Bei vorliegenden Stimmen bleiben diese zur Einsicht sichtbar; ohne Stimmen bleiben leere gesperrte Felder mit Schlusshinweis erhalten.
- **Backend-Schutz**: Stimmabgabe per Service (`saveTeamAllstarVoteByToken`) ist nur zulässig, wenn der Modus `open` ist.
- **UI-Cleanup**: Entfernung des nicht benötigten Buttons „Kader kopieren“ in der Admin-Allstars-Ansicht.

---

## 2. User Stories

- **US-1**: Als **Turnierleiter** möchte ich in der Allstars-Verwaltung mit einem Klick zwischen den drei Modi „In Kürze“, „Geöffnet“ und „Geschlossen“ umschalten können, um den Zeitplan der Abstimmung flexibel und transparent an das reale Turniergeschehen anzupassen.
- **US-2**: Als **Turnierleiter** möchte ich eine aufgeräumte Allstars-Ansicht ohne den überflüssigen Button „Kader kopieren“, um Verwirrung zu vermeiden.
- **US-3**: Als **Team-Betreuer** möchte ich vor dem offiziellen Start der Abstimmung bereits sehen, dass die Wahl in Kürze startet und wie die Fristen geregelt sind, ohne leere oder verwirrende Formulare ausfüllen zu müssen.
- **US-4**: Als **Team-Betreuer** möchte ich nach Schließung der Abstimmung meine zuvor abgegebenen Nominierungen schreibgeschützt einsehen können, mit der Gewissheit, dass sie sicher erfasst wurden.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope
- **Konfiguration & Datenmodell**:
  - Einführung von `allstarVotingStatus: "upcoming" | "open" | "closed"` in `TournamentConfig` (`config/tournament`).
  - Abwärtskompatibilität: Falls `allstarVotingStatus` noch nicht existiert, wird aus dem bisherigen `allstarVotingOpen` abgeleitet (`false` -> `closed`, sonst `open`).
- **Turnierleitung (`AdminAllstarsView.tsx`)**:
  - Segmented Control / 3er-Button-Gruppe im Header:
    - „In Kürze“ (Status `upcoming`, Amber/Gelb)
    - „Geöffnet“ (Status `open`, Emerald/Grün)
    - „Geschlossen“ (Status `closed`, Slate/Grau)
  - Entfernung des Buttons „Kader kopieren“ samt zugehöriger Logik (`handleCopyForCeremony`, `copySuccess` State).
- **Team-Ansicht (`TeamAllstarVoting.tsx`)**:
  - Globaler Hinweis in allen drei Modi: *„Die Abstimmung ist ab dem Start des ersten Spiels bis 10 Minuten nach dem letzten Finalspiel geöffnet.“*
  - **Modus `upcoming`**:
    - Status-Badge: *In Kürze verfügbar* (Gelb/Amber)
    - Ansprechende Info-Karte: *„Die Abstimmung startet in Kürze“* mit Erklärung der Wahlmodalitäten (1x Torwart, 5x Feldspieler).
    - Keine interaktiven Formularfelder/Dropdowns sichtbar.
  - **Modus `open`**:
    - Status-Badge: *Abstimmung geöffnet* (Grün/Emerald mit aktivem Pulsieren)
    - Vollständiges Wahlformular aktiv und bearbeitbar.
  - **Modus `closed`**:
    - Status-Badge: *Abstimmung geschlossen* (Slate/Grau mit Schloss-Icon)
    - Info-Banner: *„Die Stimmabgabe ist beendet“*
    - Formularfelder sind deaktiviert/gesperrt (`disabled`). Falls Stimmen vorliegen, werden die zuvor ausgewählten Spieler angezeigt; falls keine Stimmen abgegeben wurden, bleiben die Felder leer und gesperrt.
- **Services (`allstarService.ts`, `configService.ts`)**:
  - Funktion `setAllstarVotingStatus(status: AllstarVotingStatus): Promise<void>`.
  - Anpassung von `saveTeamAllstarVoteByToken`: Wirft einen Fehler, wenn `allstarVotingStatus !== "open"`.

### 3.2 Explizit Out-of-Scope
- Automatisiertes zeitgesteuertes Umschalten (die Steuerung erfolgt manuell durch die Turnierleitung).
- Änderungen am Tab-Design in `TeamJinglePage` (bleibt unverändert „⭐ Allstar-Team“).
- Änderungen am mathematischen Auswertungsalgorithmus (`evaluateAllstars`).

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien
- [x] **AC-1: Umschalten der Modi in der Adminoberfläche**
  - **Gegeben sei**: Die Turnierleitung befindet sich auf `/admin#allstars`.
  - **Wenn**: Der Turnierleiter auf einen der drei Buttons („In Kürze“, „Geöffnet“, „Geschlossen“) klickt.
  - **Dann**: Wird `allstarVotingStatus` in Firestore sofort aktualisiert und der aktivierte Button farblich hervorgehoben.
- [x] **AC-2: Entfernung des „Kader kopieren“-Buttons**
  - **Gegeben sei**: Die Ansicht `/admin#allstars`.
  - **Dann**: Ist der Button „Kader kopieren“ nicht mehr in der Kopfzeile oder anderswo vorhanden.
- [x] **AC-3: Hinweistext zum Abstimmungszeitraum**
  - **Gegeben sei**: Ein Team öffnet den Tab Allstar-Team unter `/team/:token#allstars`.
  - **Dann**: Ist in jedem Modus der Text *„Die Abstimmung ist ab dem Start des ersten Spiels bis 10 Minuten nach dem letzten Finalspiel geöffnet.“* deutlich lesbar.
- [x] **AC-4: Team-Ansicht im Modus „In Kürze“ (`upcoming`)**
  - **Gegeben sei**: `allstarVotingStatus` steht auf `upcoming`.
  - **Wenn**: Ein Team den Allstar-Tab aufruft.
  - **Dann**: Erscheint das Badge „In Kürze verfügbar“, eine informative Vorschau-Box und **keine** Formularfelder oder Speicher-Buttons.
- [x] **AC-5: Team-Ansicht im Modus „Geöffnet“ (`open`)**
  - **Gegeben sei**: `allstarVotingStatus` steht auf `open`.
  - **Wenn**: Ein Team den Allstar-Tab aufruft.
  - **Dann**: Erscheint das Badge „Abstimmung geöffnet“, alle 6 Positionen können per Dropdown gewählt werden und der Stimmzettel kann gespeichert werden.
- [x] **AC-6: Team-Ansicht im Modus „Geschlossen“ (`closed`)**
  - **Gegeben sei**: `allstarVotingStatus` steht auf `closed`.
  - **Wenn**: Ein Team den Allstar-Tab aufruft.
  - **Dann**: Erscheint das Badge „Abstimmung geschlossen“, die Formularfelder sind deaktiviert (`disabled`) und zeigen bei bereits abgegebenen Stimmen die getroffene Wahl an. Der Absende-Button ist ausgeblendet oder deaktiviert.
- [x] **AC-7: Schutz gegen unberechtigte Stimmabgabe im Backend**
  - **Gegeben sei**: Der Modus ist `upcoming` oder `closed`.
  - **Wenn**: Ein Aufruf an `saveTeamAllstarVoteByToken` erfolgt.
  - **Dann**: Wird der Aufruf mit einer aussagekräftigen Fehlermeldung abgelehnt und kein Dokument gespeichert.

### 4.2 Allgemeine Qualitätskriterien
- [x] Verbot von Hardcoding: Statuswerte werden über das Typsystem (`AllstarVotingStatus`) typisiert und aus Firestore bezogen.
- [x] Sauberes Aufräumen aller Listener (`unsubscribe`).
- [x] Fehlerfreier TypeScript-Build (`npm run build`) und kein Lint-Fehler.

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Adminoberfläche (`AdminAllstarsView.tsx`)
In der Header-Zeile wird der bisherige einzelne Toggle-Button durch eine zusammenhängende Segmented-Control-Leiste ersetzt:
```tsx
<div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
  {/* In Kürze */}
  <button className={status === "upcoming" ? "bg-amber-500 text-white font-bold" : "text-slate-600 hover:text-slate-900"}>
    <Clock className="h-4 w-4" /> In Kürze
  </button>
  {/* Geöffnet */}
  <button className={status === "open" ? "bg-emerald-600 text-white font-bold" : "text-slate-600 hover:text-slate-900"}>
    <Unlock className="h-4 w-4" /> Geöffnet
  </button>
  {/* Geschlossen */}
  <button className={status === "closed" ? "bg-slate-700 text-white font-bold" : "text-slate-600 hover:text-slate-900"}>
    <Lock className="h-4 w-4" /> Geschlossen
  </button>
</div>
```

### 5.2 Team-Ansicht (`TeamAllstarVoting.tsx`)
- Oberhalb des Inhalts steht die Infobox mit dem Abstimmungszeitraum.
- Nach Status unterteilt:
  - Bei `upcoming`: Informationskarte mit Icon, Vorankündigung und kurzer Spielerklärung (1x Torwart, 5x Feldspieler; freie Wahl aller teilnehmenden Mannschaften).
  - Bei `open`: Vollwertiges Formular mit Positions-Karten und Team/Spieler-Dropdowns.
  - Bei `closed`: Vorwarn-Banner „Abstimmung geschlossen“, Formularfelder mit `disabled={true}`, Absende-Button deaktiviert.

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Datenmodell (`DATABASE.md`)
Dokument: `config/tournament`
```typescript
export type AllstarVotingStatus = "upcoming" | "open" | "closed"

export interface TournamentConfig {
  // ...
  allstarVotingStatus?: AllstarVotingStatus // Neu: 3 Modi
  allstarVotingOpen?: boolean             // Veraltet / Fallback für ältere Builds
}
```

### 6.2 Services & Logik
- `configService.ts`:
  - `DEFAULT_TOURNAMENT_CONFIG.allstarVotingStatus = "upcoming"` (oder `"open"` je nach Standard)
- `allstarService.ts`:
  - `setAllstarVotingStatus(status: AllstarVotingStatus): Promise<void>` aktualisiert sowohl `allstarVotingStatus` als auch `allstarVotingOpen` (`status === "open"`).
  - `saveTeamAllstarVoteByToken` prüft den Status.

---

## 7. Verifikationsplan & Testfälle

1. **Testfall 1 (Admin Umschalten)**:
   - Modus auf `upcoming` setzen -> Prüfen, ob Firestore aktualisiert wird.
   - Modus auf `open` setzen.
   - Modus auf `closed` setzen.
2. **Testfall 2 (Team-Ansicht Modus `upcoming`)**:
   - Team-Link öffnen -> Prüfen, ob „In Kürze verfügbar“ angezeigt wird und keine Dropdowns sichtbar sind.
3. **Testfall 3 (Team-Ansicht Modus `open`)**:
   - Team-Link öffnen -> Spieler auswählen und speichern -> Erfolgsmeldung prüfen.
4. **Testfall 4 (Team-Ansicht Modus `closed`)**:
   - Team-Link öffnen -> Zuvor gespeicherte Auswahl prüfen -> Sicherstellen, dass Dropdowns blockiert sind.
5. **Testfall 5 (Button Entfernung)**:
   - Prüfen, dass „Kader kopieren“ nirgendwo mehr angezeigt wird.
