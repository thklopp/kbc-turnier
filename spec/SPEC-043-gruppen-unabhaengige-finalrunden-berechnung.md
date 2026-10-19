# SPEC-043: Gruppenunabhängige Zuordnung der Finalrunden-Paarungen

> **Status**: In Abnahme  
> **Typ**: Optimierung  
> **Branch**: feat/SPEC-043-gruppen-unabhaengige-finalrunden-berechnung  
> **Autor**: Antigravity Agent  
> **Erstellt am**: 2026-10-19  
> **Letzte Änderung**: 2026-10-19  
> **Betroffene Bereiche**: Turnierleitung (/admin) | Datenbank/Firestore | Spielplan-Services (`matchProgressionService.ts`, `ScheduleManager.tsx`)  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
In der bisherigen Implementierung ([`matchProgressionService.ts`](file:///Users/thorsten/Code/kbc-turnier/src/services/matchProgressionService.ts#L89-L92)) wird die Zuweisung der Teams aus der Vorrunde in die Halbfinals und Qualifikationsspiele 5–8 (Stufe 1) erst dann ausgeführt, wenn **beide** Gruppen (Gruppe A **und** Gruppe B) der jeweiligen Altersklasse (`wU14` bzw. `mU14`) vollständig beendet sind:
```typescript
const groupAComplete = isGroupComplete(matches, gender, "A")
const groupBComplete = isGroupComplete(matches, gender, "B")

if (groupAComplete && groupBComplete) { ... }
```
Wenn beispielsweise in Gruppe A alle 4 Teams ihre 3 Vorrundenspiele (insgesamt 6 Partien) absolviert haben, die Spiele der Gruppe B aber noch laufen (oder zeitlich versetzt enden), stehen die Platzierungen 1 bis 4 von Gruppe A sportlich und rechnerisch bereits endgültig fest. Bisher werden sie jedoch noch nicht in die Finalpaarungen eingetragen, sodass Betreuer, Teams und Zuschauer unnötig lange warten müssen, um zu sehen, in welches Halbfinale oder Qualifikationsspiel sich ein Team qualifiziert hat.

### 1.2 Zielzustand & Mehrwert
- Die Zuordnung soll **pro Gruppe unabhängig** erfolgen, sobald alle Teams dieser Gruppe ihre 3 Vorrundenspiele beendet haben (`isGroupComplete(matches, gender, group)`).
- Die Teams der bereits abgeschlossenen Gruppe werden sofort in die jeweiligen Slots der Halbfinals und Qualifikationsspiele eingetragen:
  - Bei Abschluss von Gruppe A: Platz 1.A, 2.A, 3.A und 4.A werden in ihren jeweiligen Heim- bzw. Gast-Slot der Zielpartien eingetragen. Der Partnerslot (für das Team aus Gruppe B) bleibt unbesetzt und zeigt weiterhin den Platzhalter (z. B. *"2. Gruppe B"*).
  - Bei Abschluss von Gruppe B: Platz 1.B, 2.B, 3.B und 4.B werden analog sofort eingetragen.
- Sobald beide Gruppen abgeschlossen sind, sind alle Paarungen vollständig bestückt.
- Zuschauer auf der Website, am Kiosk und die Turnierleitung sehen die feststehenden Teilnehmer sofort live, ohne auf den Abschluss der Parallelgruppe warten zu müssen.

---

## 2. User Stories

- **US-1 (Turnierleitung & Kampfgericht)**: Als **Turnierleiter** möchte ich, dass nach dem Abpfiff des letzten Spiels von Gruppe A die qualifizierten Teams sofort in die Halbfinals und Platzierungsspiele eingetragen werden, damit der Fortschritt sichtbar ist und keine manuelle Pflege nötig wird.
- **US-2 (Teams & Trainer)**: Als **Trainer eines Vorrundenteams** möchte ich sofort nach Beendigung unserer Gruppe im Spielplan sehen, welches Halbfinale (bzw. welches Spiel um Platz 5–8) wir spielen und wann unser Folgespiel stattfindet, selbst wenn die andere Gruppe noch ihr letztes Spiel austrägt.
- **US-3 (Zuschauer & Fans)**: Als **Zuschauer** möchte ich auf der Live-Seite und am Kiosk direkt nach Abschluss einer Gruppe das qualifizierte Team neben dem Platzhalter der noch offenen Gruppe (z. B. *„Rot-Weiss Köln vs. 2. Gruppe B“*) sehen.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)
- [x] **Entkopplung der Gruppen in Stufe 1 (`calculateFinalRoundAssignments` in `matchProgressionService.ts`)**:
  - `groupAComplete` und `groupBComplete` werden separat geprüft.
  - Wenn `groupAComplete === true`:
    - Berechnung der Tabelle von Gruppe A (`calculateGroupStandings(teams, matches, gender, "A")`).
    - Zuweisung von Platz 1.A, 2.A, 3.A, 4.A in die jeweiligen Match-Slots:
      - **wU14**:
        - 1.A ➔ Spiel 29 (HF 1, `teamHomeId`)
        - 2.A ➔ Spiel 30 (HF 2, `teamAwayId`)
        - 3.A ➔ Spiel 25 (Quali 5-8 #1, `teamHomeId`)
        - 4.A ➔ Spiel 26 (Quali 5-8 #2, `teamAwayId`)
      - **mU14**:
        - 1.A ➔ Spiel 31 (HF 1, `teamHomeId`)
        - 2.A ➔ Spiel 32 (HF 2, `teamAwayId`)
        - 3.A ➔ Spiel 27 (Quali 5-8 #1, `teamHomeId`)
        - 4.A ➔ Spiel 28 (Quali 5-8 #2, `teamAwayId`)
  - Wenn `groupBComplete === true`:
    - Berechnung der Tabelle von Gruppe B (`calculateGroupStandings(teams, matches, gender, "B")`).
    - Zuweisung von Platz 1.B, 2.B, 3.B, 4.B in die jeweiligen Match-Slots:
      - **wU14**:
        - 1.B ➔ Spiel 30 (HF 2, `teamHomeId`)
        - 2.B ➔ Spiel 29 (HF 1, `teamAwayId`)
        - 3.B ➔ Spiel 26 (Quali 5-8 #2, `teamHomeId`)
        - 4.B ➔ Spiel 25 (Quali 5-8 #1, `teamAwayId`)
      - **mU14**:
        - 1.B ➔ Spiel 32 (HF 2, `teamHomeId`)
        - 2.B ➔ Spiel 31 (HF 1, `teamAwayId`)
        - 3.B ➔ Spiel 28 (Quali 5-8 #2, `teamHomeId`)
        - 4.B ➔ Spiel 27 (Quali 5-8 #1, `teamAwayId`)
- [x] **Erhalt der Stufe 2 (K.o.-Folgespiele)**:
  - Bleibt unverändert: Sobald ein Zubringerspiel (Halbfinale oder Quali 5–8) beendet ist und einen Sieger hat, wird der Sieger/Verlierer in das Finale bzw. das Platzierungsspiel eingetragen.
- [x] **Feedback-Meldung im `ScheduleManager` anpassen**:
  - Der Hinweistext bei Nicht-Aktualisierung wird präzisiert, damit deutlich wird, dass Gruppen auch einzeln synchronisiert werden können.

### 3.2 Explizit Out-of-Scope
- Keine Änderung an den Paarungsdefinitionen (die Zuweisungs-Matrix 1.A vs 2.B etc. bleibt identisch).
- Keine Änderung an der Tabellenkriterien-Berechnung (`standingsService.ts`).
- Keine Änderung am Datenmodell (`DATABASE.md`), da `teamHomeId` und `teamAwayId` bereits optional/leer sein können und Fallbacks auf `teamHomePlaceholder`/`teamAwayPlaceholder` in allen UI-Komponenten existieren.

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien

- [x] **AC-1: Gruppe A beendet, Gruppe B noch offen**
  - **Gegeben sei**: Alle 6 Spiele von wU14 Gruppe A sind `finished`. Gruppe B hat noch offene Spiele.
  - **Wenn**: Das letzte Spiel von Gruppe A beendet wird oder im Admin-Bereich *„Finalpaarungen jetzt synchronisieren“* geklickt wird.
  - **Dann**: Werden in Spiel 25 (`teamHomeId`), Spiel 26 (`teamAwayId`), Spiel 29 (`teamHomeId`) und Spiel 30 (`teamAwayId`) die Team-IDs der Plätze 3.A, 4.A, 1.A und 2.A eingetragen.
  - **Dann**: Die jeweils anderen Slots dieser Spiele bleiben unberührt (`teamAwayId` bzw. `teamHomeId` leer) und die UI zeigt dort weiterhin den Platzhalter an (z. B. *"2. Gruppe B"*).

- [x] **AC-2: Gruppe B beendet, Gruppe A noch offen**
  - **Gegeben sei**: Alle 6 Spiele von mU14 Gruppe B sind `finished`. Gruppe A hat noch offene Spiele.
  - **Wenn**: Das letzte Spiel von Gruppe B beendet wird oder synchronisiert wird.
  - **Dann**: Werden in Spiel 27 (`teamAwayId`), Spiel 28 (`teamHomeId`), Spiel 31 (`teamAwayId`) und Spiel 32 (`teamHomeId`) die Team-IDs der Plätze 4.B, 3.B, 2.B und 1.B eingetragen.
  - **Dann**: Die jeweils anderen Slots bleiben frei für Gruppe A.

- [x] **AC-3: Beide Gruppen beendet**
  - **Gegeben sei**: Sowohl Gruppe A als auch Gruppe B sind vollständig beendet.
  - **Wenn**: Die Synchronisation läuft.
  - **Dann**: Sind alle 4 Halbfinals und alle 4 Qualifikationsspiele (sowohl wU14 als auch mU14) mit beiden Teams vollständig besetzt.

### 4.2 Allgemeine Qualitätskriterien
- [x] Keine fest kodierten Parameter.
- [x] Vollständige TypeScript-Typisierung ohne `any`.
- [x] Fehlerfreie Ausführung von `npm run build` und Linting.

---

## 5. UI/UX & Interaktionskonzept

- **Spielplan / Kiosk / Live-Desk**: Wenn ein Match nur eine gesetzte Team-ID hat (z. B. Heim-Team gesetzt, Auswärts-Team noch leer), rendert das Frontend:
  - Heim: Echter Vereinsname + Logo (z. B. *„Düsseldorfer HC“*)
  - Gast: Platzhalter-Text (z. B. *„2. Gruppe B“*)
  - Dies ist in `GuestScheduleView`, `FinalsBracketView`, `KioskFinalsSlide`, `LiveMatchDesk` und `ScheduleManager` bereits durch den Fallback `team?.name || match.teamAwayPlaceholder || "TBD"` vollflächig unterstützt.

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Datenmodell (`DATABASE.md`)
- Keine Änderungen am Schema erforderlich.

### 6.2 TypeScript & Services
- Anpassung in [`src/services/matchProgressionService.ts`](file:///Users/thorsten/Code/kbc-turnier/src/services/matchProgressionService.ts):
  - Aufteilung der Gruppenabfrage:
    ```typescript
    if (groupAComplete) {
      const standingsA = calculateGroupStandings(teams, matches, gender, "A")
      // Zuweisung 1A, 2A, 3A, 4A
    }
    if (groupBComplete) {
      const standingsB = calculateGroupStandings(teams, matches, gender, "B")
      // Zuweisung 1B, 2B, 3B, 4B
    }
    ```
