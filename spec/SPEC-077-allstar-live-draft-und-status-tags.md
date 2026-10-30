# SPEC-077: Allstar Live-Drafts, Fortschritts-Tags (X/6) und Team-Identifikation

> **Status**: Abgeschlossen  
> **Typ**: Feature / UX-Verbesserung  
> **Branch**: feat/SPEC-077-allstar-live-draft-und-status-tags  
> **Autor**: Antigravity  
> **Erstellt am**: 2026-10-30  
> **Letzte Änderung**: 2026-10-30  
> **Betroffene Bereiche**: Turnierleitung (`/admin#allstars`), Betreuerbereich (`/team/:token#allstars`), Services (`allstarService.ts`), Datenbank (`allstarVotes`, `DATABASE.md`)  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Bisher sieht die Turnierleitung im Admin-Bereich unter `/admin#allstars` nur diejenigen Teams, die ihren Stimmzettel bereits **vollständig (alle 6 Positionen) und offiziell abgeschickt** haben. Teams, die ihre Stimmen noch nicht eingereicht haben, werden pauschal als „fehlt“ dargestellt – selbst wenn Betreuer über den Turniertag hinweg bereits 3 oder 4 Spieler ausgewählt haben. 

Dadurch:
- Hat die Turnierleitung keine Transparenz darüber, welche Teams aktiv an ihrer Auswahl arbeiten und wer noch gar nicht angefangen hat.
- Können die bisher ausgewählten Stimmen im Adminbereich vor dem finalen Absenden nicht eingesehen werden.
- Gehen bei einem Neuladen oder Wechsel des Geräts im Betreuer-Link ungespeicherte Eingaben verloren, falls Betreuer noch nicht auf den finalen Speicherbutton geklickt haben.

### 1.2 Zielzustand & Mehrwert
1. **Live-Zwischenspeicherung (Auto-Save / Draft)**: Sobald ein Betreuer im geöffneten Wahlmodus eine Position (Torwart oder Feldspieler 1–5) auswählt oder ändert, wird dieser Stand als Entwurf (`status: "draft"`) in Firestore synchronisiert.
2. **Fortschritts-Tags für jedes Team**: Im Adminbereich wird jedes Team der jeweiligen Altersklasse mit einem aussagekräftigen Tag dargestellt:
   - **`0/6`**: Noch kein Spieler ausgewählt (grau/amber hinterlegt mit Status „noch nicht begonnen“).
   - **`1/6` bis `5/6`** (bzw. 6/6 unübermittelt): Zwischenstand in Bearbeitung (amber/blau hinterlegt, z. B. `4/6`).
   - **`6/6 Eingereicht`**: Sobald das Team den Stimmzettel offiziell abgeschickt hat, wird das Tag **vollständig grün** (mit weißem/dunkelgrünem Haken-Symbol `CheckCircle`).
3. **Sichere Team-Identifikation**: Jedes Team wird eindeutig über seine permanente `teamId` referenziert. In den Status-Tags und Stimmzetteln werden der Teamname und Kurzname präzise dargestellt.
4. **Vorab-Einsicht der Stimmen im Adminbereich**: In der aufklappbaren Detailsektion „Stimmzettel der Teams“ sind alle bisher gesetzten Stimmen der Teams sichtbar – mit klarer Kennzeichnung, ob es sich um einen Entwurf (`Entwurf (X/6)`) oder die offizielle Abgabe (`Abgegeben (6/6)`) handelt.

---

## 2. User Stories

- **US-1 (Turnierleitung - Live-Fortschritt)**: Als **Turnierleiter** möchte ich im Admin-Bereich auf den ersten Blick an den Tags aller Mannschaften sehen, wie viele Stimmen sie schon vergeben haben (z. B. `0/6`, `4/6`), um zu erkennen, wie weit die Teams mit ihrer Nominierung sind.
- **US-2 (Turnierleitung - Abgabe-Status)**: Als **Turnierleiter** möchte ich, dass das Tag einer Mannschaft sofort grün wird, sobald sie den Stimmzettel offiziell abgegeben hat, damit ich fehlerfrei zwischen Entwürfen und finalen Abgaben unterscheiden kann.
- **US-3 (Turnierleitung - Vorab-Einsicht)**: Als **Turnierleiter** möchte ich die bereits gesetzten Stimmen der Teams im Detailbereich auch schon vor der offiziellen Abgabe einsehen können, um den Trend und die Verteilung frühzeitig im Blick zu haben.
- **US-4 (Betreuer - Zwischenspeichern)**: Als **Team-Betreuer** möchte ich, dass meine bisher ausgewählten Spieler automatisch zwischengespeichert werden, damit bei Unterbrechungen oder Gerätewechseln nichts verloren geht und ich zu einem späteren Zeitpunkt die restlichen Positionen ergänzen und einreichen kann.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)

#### A. Datenmodell & Speicherung (`allstarVotes/{teamId}`)
- [x] Erweiterung des Dokuments in `allstarVotes`:
  - `status: "draft" | "submitted"` (Standard bei Neuanlage während der Bearbeitung: `"draft"`, bei Klick auf Einreichen: `"submitted"`).
  - `filledCount: number` (0 bis 6; Anzahl der gültig besetzten Positionen).
  - `submittedAt?: Timestamp` (wird ausschließlich gesetzt, wenn `status === "submitted"`).
  - `updatedAt: Timestamp` (wird bei jeder Änderung aktualisiert).
  - Optionale Slots in `votes`: Im Draft-Zustand können Slots leer sein (`null` oder unvollständig).
- [x] Rückwärtskompatibilität: Bestehende Dokumente ohne `status`, die ein `submittedAt` besitzen, werden als `status: "submitted"` und `filledCount: 6` gewertet.

#### B. Betreuerbereich (`/team/:token#allstars`)
- [x] **Automatisches Entwurfs-Speichern**:
  - Sobald eine Position geändert oder ausgewählt wird, wird der Entwurf im Hintergrund via `saveTeamAllstarDraftByToken` in Firestore gespeichert.
  - Eine unaufdringliche Statusanzeige zeigt den Speicherzustand an (*„Entwurf gespeichert“*).
- [x] **Offizielle Abgabe**:
  - Der Button „Allstar-Team einreichen“ prüft weiterhin strikt:
    - Alle 6 Positionen müssen ausgefüllt sein.
    - Kein Spieler darf doppelt ausgewählt sein.
  - Nach erfolgreichem Absenden setzt die Aktion `status = "submitted"` und `submittedAt = Timestamp.now()`.
  - Bei Änderungen nach der Abgabe (solange Abstimmung noch `open` ist) bleibt der Status `submitted` erhalten oder wird erneut bestätigt.

#### C. Turnierleitung (`/admin#allstars`)
- [x] **Einheitliche Team-Status-Tags für alle Mannschaften**:
  - Statt einer harten Trennung in zwei getrennte Listen werden alle Teams der Altersklasse übersichtlich dargestellt.
  - Jedes Team erhält ein Status-Tag:
    - **Nicht begonnen (`0/6`)**: Dezent neutral/gelblich, z. B. `BHC (0/6)` mit Uhr-Icon.
    - **In Bearbeitung (`1/6` bis `5/6`)**: Deutlich als Entwurf gekennzeichnet (z. B. Amber-Badge mit Stift-/Uhr-Icon, Text: `DTV (4/6)`).
    - **Offiziell abgegeben (`6/6`)**: Kräftiges Grün (Emerald-Badge mit Häkchen `CheckCircle`, Text: `HTCU (6/6 ✓)`).
  - Tooltip / Hover: Anzeige des exakten Status und Zeitstempels der letzten Aktualisierung bzw. Abgabe.
- [x] **Statistik-Zähler im Header**:
  - Fortschrittsbalken & Zähler im Kopfbereich zeigen sowohl die offiziell eingereichten Teams als auch Teams mit aktiven Entwürfen an (z. B. *„4 von 8 Teams abgegeben (2 weitere in Bearbeitung)“*).
- [x] **Detail-Einsicht der Stimmzettel**:
  - Im aufklappbaren Bereich „Stimmzettel der Teams“ werden alle Teams mit ihren bisher gesetzten Spielern angezeigt.
  - Jeder Stimmzettel erhält ein Badge:
    - Grün: `Offiziell eingereicht` (mit Datum/Uhrzeit).
    - Amber/Blau: `Entwurf (X/6 gesetzt)` (mit Datum/Uhrzeit der letzten Bearbeitung).
- [x] **Gewinner-Rangliste (Allstar-Kader)**:
  - Für die offizielle Ermittlung der Allstar-Gewinner (1x Torwart, 5x Feldspieler) zählen **ausschließlich offiziell eingereichte Stimmzettel (`status === "submitted"`)**, damit unfertige Entwürfe die Auszeichnung und Siegerehrung nicht verfälschen.

### 3.2 Explizit Out-of-Scope
- Keine Zählung unfertiger Entwürfe für die offizielle Siegerehrung (Transparenz ja, aber keine Verzerrung durch unvollständige 2/6-Zettel).
- Keine Veröffentlichung der Zwischenstände im Kiosk oder der Gastansicht vor der Siegerehrung.

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien

- [x] **AC-1: Anzeige des Fortschritts-Tags (0/6) für Teams ohne Eingabe**
  - **Gegeben sei**: Team A hat den Stimmzettel noch nicht geöffnet oder noch keinen Spieler gewählt.
  - **Wenn**: Die Turnierleitung `/admin#allstars` öffnet.
  - **Dann**: Wird Team A mit einem Tag `Team A (0/6)` und Status „noch keine Auswahl“ angezeigt.

- [x] **AC-2: Live-Aktualisierung des Fortschritts-Tags bei Entwürfen (z. B. 4/6)**
  - **Gegeben sei**: Der Betreuer von Team B wählt im Betreuerlink den Torwart und 3 Feldspieler aus (insgesamt 4 Positionen), klickt aber noch nicht auf Einreichen.
  - **Wenn**: Die Stimmen im Hintergrund gespeichert werden und der Adminbereich geöffnet ist.
  - **Dann**: Aktualisiert sich das Tag von Team B in Echtzeit auf `Team B (4/6)` mit Status „Entwurf / in Bearbeitung“ (amber/gelb hinterlegt).

- [x] **AC-3: Grünes Tag nach offizieller Stimmabgabe (6/6)**
  - **Gegeben sei**: Team B füllt alle 6 Positionen vollständig aus und klickt auf „Allstar-Team einreichen“.
  - **Wenn**: Die Speicherung erfolgreich ist.
  - **Dann**: Wechselt das Tag von Team B im Adminbereich sofort auf **Grün** mit Häkchen-Icon (`Team B (6/6)`).

- [x] **AC-4: Vorab-Einsicht im Detailbereich der Stimmzettel**
  - **Gegeben sei**: Team B hat 4 von 6 Spielern im Entwurf gesetzt.
  - **Wenn**: Der Turnierleiter den Bereich „Stimmzettel der Teams“ aufklappt.
  - **Dann**: Wird Team B dort mit der Kennzeichnung `Entwurf (4/6)` aufgeführt und die 4 bereits gewählten Spieler mit Position, Name und Verein werden angezeigt (leere Slots als `Noch nicht gewählt`).

- [x] **AC-5: Zuverlässige Identifikation der Mannschaften**
  - **Gegeben sei**: Teams der Altersklasse wU14 oder mU14 mit ähnlichen Namen oder verschiedenen Schreibweisen.
  - **Wenn**: Stimmzettel gespeichert und im Adminbereich geladen werden.
  - **Dann**: Werden die Daten strikt über die `teamId` verknüpft, sodass jedes Team exakt seinem Stimmzettel und seinen Vereinsangaben zugeordnet ist.

- [x] **AC-6: Trennung bei der offiziellen Auswertung**
  - **Gegeben sei**: Ein Spieler erhält 3 Stimmen aus offiziell eingereichten Stimmzetteln und 2 Stimmen aus Entwürfen.
  - **Wenn**: Das offizielle Allstar-Team und die Sieger-Rangliste berechnet werden.
  - **Dann**: Werden für die Platzierungen der Siegerehrung nur die 3 offiziell eingereichten Stimmen gewertet.

### 4.2 Allgemeine Qualitätskriterien
- [x] Keine fest kodierten Parameter (Verbot von Hardcoding gemäß `AGENTS.md`).
- [x] Strikte TypeScript-Typisierung ohne `any` in `src/types/allstars.ts` und `src/types/database.ts`.
- [x] Vollständige Konsistenz mit `DATABASE.md`.
- [x] Sauberes Aufräumen aller Firestore-Listener (`unsubscribe`).
- [x] Fehlerfreie Ausführung von `npm run build` und Linting.

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Admin-Status-Tags (`AdminAllstarsView.tsx`)
Statt separater Abschnitte mit „Eingereicht“ und „Fehlt“ wird eine zusammenhängende, übersichtliche Chip-Leiste aller Teams der Altersklasse gerendert:

```tsx
{/* Beispiel-Darstellung der Chips */}
<div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
  {teamsWithStatus.map((item) => (
    <span
      key={item.team.id}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
        item.status === "submitted"
          ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
          : item.filledCount > 0
          ? "bg-amber-50 border border-amber-300 text-amber-900"
          : "bg-slate-100 border border-slate-200 text-slate-600"
      }`}
    >
      {item.status === "submitted" ? (
        <CheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
      ) : item.filledCount > 0 ? (
        <PenLine className="h-3.5 w-3.5 text-amber-600 shrink-0" />
      ) : (
        <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
      )}
      <span className="truncate max-w-[130px]">{item.team.name}</span>
      <span className={`text-[10px] font-bold px-1 rounded ${
        item.status === "submitted"
          ? "bg-emerald-100 text-emerald-900"
          : item.filledCount > 0
          ? "bg-amber-100 text-amber-900"
          : "bg-slate-200 text-slate-700"
      }`}>
        {item.filledCount}/6
      </span>
    </span>
  ))}
</div>
```

### 5.2 Betreuer-Ansicht (`TeamAllstarVoting.tsx`)
- Beim Auswählen einer Position wird sofort der lokale Zustand aktualisiert und mit kurzem Debounce (z. B. 400ms) als Entwurf in Firestore gesichert.
- Ein dezenter Indikator neben der Überschrift signalisiert: `Entwurf gespeichert` bzw. `Speichere...`.
- Der grüne Button „Allstar-Team einreichen“ schließt die offizielle Abgabe ab und markiert den Stimmzettel als final.

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Datenmodell (`DATABASE.md`)
In `allstarVotes`:
```typescript
export interface AllstarVote {
  id: string;                                // Dokument-ID = teamId
  teamId: string;                            // Eindeutige Team-ID
  teamName: string;                          // Name des Teams
  gender: GenderCategory;                    // "wU14" | "mU14"
  status?: "draft" | "submitted";            // Neu: Entwurf oder offiziell abgegeben (Default: submitted bei Altdaten)
  filledCount?: number;                      // Neu: 0 bis 6 gesetzte Stimmen
  votes: {
    goalkeeper?: AllstarVotePosition;
    fieldPlayer1?: AllstarVotePosition;
    fieldPlayer2?: AllstarVotePosition;
    fieldPlayer3?: AllstarVotePosition;
    fieldPlayer4?: AllstarVotePosition;
    fieldPlayer5?: AllstarVotePosition;
  };
  submittedAt?: FirebaseFirestore.Timestamp; // Nur bei status === "submitted"
  updatedAt: FirebaseFirestore.Timestamp;
}
```

### 6.2 Services (`allstarService.ts`)
- Neue Funktion: `saveTeamAllstarDraftByToken(token: string, votes: Partial<AllstarVote["votes"]>): Promise<AllstarVote>`
- Angepasste Funktion: `saveTeamAllstarVoteByToken(token: string, votes: AllstarVote["votes"]): Promise<AllstarVote>` (setzt `status: "submitted"`, validiert 6/6 und Duplikatsfreiheit)
- Angepasste Funktion: `evaluateAllstars(...)`: Liefert für jedes Team den Status (`status`, `filledCount`) und aggregiert Gewinner aus offiziell eingereichten Stimmen.
