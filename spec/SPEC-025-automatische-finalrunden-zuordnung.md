# SPEC-025: Automatische Zuordnung der Finalrunden-Paarungen aus Tabellen & Vorrundenspielen

> **Status**: In Abnahme  
> **Typ**: Feature  
> **Branch**: feat/SPEC-025-automatische-finalrunden-zuordnung  
> **Autor**: Antigravity Agent  
> **Erstellt am**: 2026-10-12  
> **Letzte Änderung**: 2026-10-12  
> **Betroffene Bereiche**: Turnierleitung (/admin) | Datenbank/Firestore | Spielplan-Services (`matchService.ts`, `standingsService.ts`)  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Bisher werden beim Generieren des Spielplans (40 Spiele) für die Sonntags-Finalspiele (16 Partien) lediglich textuelle Platzhalter angelegt (z. B. *„1. Gruppe A“*, *„2. Gruppe B“*, *„Sieger HF 1“*). Die konkreten Mannschaften (`teamHomeId`, `teamAwayId`) müssen anschließend von der Turnierleitung für jedes der 16 Finalspiele einzeln und manuell über Dropdowns im Bearbeiten-Dialog (`MatchEditModal`) ausgewählt werden.

Dies ist fehleranfällig, zeitaufwendig und birgt das Risiko, dass Teams bei Hektik im Turnierbetrieb falsch zugeordnet werden oder Spiele im Live-Desk/Kiosk ohne echte Vereinsdaten, Logos und Tormusik starten.

### 1.2 Zielzustand & Mehrwert
Die Zuweisung der Mannschaften in die Finalphase soll automatisiert erfolgen:
1. **Stufe 1 (Gruppenphase ➔ Halbfinals & Platzierungsqualifikation):**  
   Sobald die Gruppenspiele einer Altersklasse (`wU14` bzw. `mU14`) abgeschlossen sind, werden die Platzierungen (Platz 1 bis 4 der Gruppen A und B) automatisch anhand der offiziellen Tabellenkriterien ermittelt und den Halbfinals sowie den Qualifikationsspielen 5–8 zugewiesen.
2. **Stufe 2 (Halbfinals & Quali ➔ Endspiele & Platzierungsspiele):**  
   Sobald die Halbfinals bzw. Qualifikationsspiele beendet sind, rücken die Sieger und Verlierer automatisch in das Große Finale, das Spiel um Platz 3, das Spiel um Platz 5 und das Spiel um Platz 7 nach.
3. **Turnierleitungs-Kontrolle & Manuelle Übersteuerung:**  
   Im Admin-Bereich (`ScheduleManager`) steht zusätzlich ein Aktions-Button *„Finalpaarungen aktualisieren“* bereit. Die manuellen Dropdowns im `MatchEditModal` bleiben als Sicherheits-Fallback uneingeschränkt erhalten.

---

## 2. User Stories

- **US-1 (Turnierleitung)**: Als **Turnierleiter** möchte ich, dass sich die Halbfinal- und Platzierungsspiele am Sonntag nach Abschluss der Vorrunde automatisch mit den qualifizierten Teams füllen, damit ich nicht alle 16 Spiele manuell zusammensuchen und zuweisen muss.
- **US-2 (Turnierleitung)**: Als **Turnierleiter** möchte ich, dass nach Beendigung eines Halbfinals der Sieger automatisch ins Finale und der Verlierer ins Spiel um Platz 3 eingetragen wird, damit der Spielbetrieb ohne Verzögerung nahtlos weiterläuft.
- **US-3 (Turnierleitung)**: Als **Turnierleiter** möchte ich im Ausnahmefall (z. B. Punkt-/Torgleichstand mit manuellem Losentscheid oder nachträglicher Reglements-Entscheidung) weiterhin jedes Spiel über das Bearbeiten-Modal manuell anpassen können, um die volle Kontrolle über den Turnierablauf zu behalten.
- **US-4 (Zuschauer & Gast)**: Als **Zuschauer vor dem Kiosk oder am Smartphone** möchte ich im Spielplan und im Turnierbaum sofort sehen, welche Teams gegeneinander antreten, sobald die vorherigen Entscheidungen sportlich gefallen sind.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)
- [x] **Turnierbaum-Logik & Paarungs-Definition für Sonntag (16 Spiele):**
  - **Halbfinals (Spiele 25–28):**
    - HF 1 (wU14, Spiel 25): 1. Gruppe A vs. 2. Gruppe B
    - HF 2 (wU14, Spiel 26): 1. Gruppe B vs. 2. Gruppe A
    - HF 1 (mU14, Spiel 27): 1. Gruppe A vs. 2. Gruppe B
    - HF 2 (mU14, Spiel 28): 1. Gruppe B vs. 2. Gruppe A
  - **Qualifikation 5–8 (Spiele 29–32):**
    - Q 5-8 (wU14, Spiel 29): 3. Gruppe A vs. 4. Gruppe B
    - Q 5-8 (wU14, Spiel 30): 3. Gruppe B vs. 4. Gruppe A
    - Q 5-8 (mU14, Spiel 31): 3. Gruppe A vs. 4. Gruppe B
    - Q 5-8 (mU14, Spiel 32): 3. Gruppe B vs. 4. Gruppe A
  - **Platzierungsspiele (Spiele 33–36):**
    - Platz 7 (wU14, Spiel 33): Verlierer Spiel 29 vs. Verlierer Spiel 30
    - Platz 5 (wU14, Spiel 34): Gewinner Spiel 29 vs. Gewinner Spiel 30
    - Platz 7 (mU14, Spiel 35): Verlierer Spiel 31 vs. Verlierer Spiel 32
    - Platz 5 (mU14, Spiel 36): Gewinner Spiel 31 vs. Gewinner Spiel 32
  - **Medaillenspiele (Spiele 37–40):**
    - Platz 3 (wU14, Spiel 37): Verlierer Spiel 25 vs. Verlierer Spiel 26
    - Finale (wU14, Spiel 38): Gewinner Spiel 25 vs. Gewinner Spiel 26
    - Platz 3 (mU14, Spiel 39): Verlierer Spiel 27 vs. Verlierer Spiel 28
    - Finale (mU14, Spiel 40): Gewinner Spiel 27 vs. Gewinner Spiel 28
- [x] **Automatischer Progression-Service (`matchProgressionService.ts`):**
  - Funktion `syncFinalRoundMatches(matches: Match[], teams: Team[])`: Berechnet die Zuordnungen deterministisch und aktualisiert in Firestore per `writeBatch` nur die Felder `teamHomeId` und `teamAwayId` (sofern sich diese geändert haben).
- [x] **Event-Trigger im Live-Desk (`useLiveMatchDesk.ts`):**
  - Sobald ein Spiel offiziell auf `status === "finished"` gesetzt wird, wird im Hintergrund die automatische Zuordnung der Folgepartien ausgelöst.
- [x] **Manueller Synchronisations-Button im Admin-Spielplan (`ScheduleManager.tsx`):**
  - Ein Button *„Finalpaarungen aktualisieren“* (z. B. mit Zauberstab-/Refresh-Icon), der den Abgleich jederzeit manuell anstößt und ein visuelles Feedback gibt (z. B. *„X Finalspiele aktualisiert“*).
- [x] **Erhalt der manuellen Editiermöglichkeit:**
  - Die Dropdowns und Freitext-Platzhalter in `MatchEditModal.tsx` bleiben erhalten. Eine manuelle Zuordnung wird durch die Automatik nur dann überschrieben, wenn die Automatik neue sportliche Fakten vorfindet oder der manuelle Abgleich bewusst getriggert wird.

### 3.2 Explizit Out-of-Scope
- Keine Änderung an der Spielzeit, den Pausenzeiten oder dem Wechselrhythmus (2w_2m).
- Kein Eingriff in die bestehende Punkte- und Tordifferenz-Berechnung (`standingsService.ts`).
- Keine automatische Wertung bei unentschiedenen K.o.-Spielen (falls ein Spiel 2:2 endet und noch kein Sieger feststeht, fordert das System den Penalty-Entscheid ein oder belässt das Folgespiel unbesetzt, bis ein Sieger ermittelt ist).

---

## 4. Akzeptanzkriterien

- [x] **AC-1: Automatische Bestückung der Halbfinals und Quali-Spiele nach Vorrundenabschluss**
  - **Gegeben sei**: Alle 6 Gruppenspiele von Gruppe A und Gruppe B (wU14) sind beendet (`status: "finished"`).
  - **Wenn**: Das letzte Gruppenspiel beendet wird oder der Admin auf *„Finalpaarungen aktualisieren“* klickt.
  - **Dann**: Werden in Spiel 25, 26, 29 und 30 die exakten `teamHomeId` und `teamAwayId` gemäß Tabellenplatz 1 bis 4 gesetzt.
  - **Dann**: Zeigt der Spielplan und Kiosk die echten Vereinsnamen und Logos für diese Spiele an.

- [x] **AC-2: Automatische Bestückung von Finale und Spiel um Platz 3 nach Halbfinal-Ende**
  - **Gegeben sei**: Beide Halbfinals (Spiel 25 & 26) sind beendet (`status: "finished"`) und weisen jeweils einen eindeutigen Sieger auf (`scoreHome != scoreAway`).
  - **Wenn**: Spiel 26 beendet wird.
  - **Dann**: Wird in Spiel 38 (Finale) das Siegerteam aus Spiel 25 und das Siegerteam aus Spiel 26 als Heim-/Gast-Team eingetragen.
  - **Dann**: Wird in Spiel 37 (Spiel um Platz 3) das Verliererteam aus Spiel 25 und das Verliererteam aus Spiel 26 eingetragen.

- [x] **AC-3: Automatische Bestückung von Platz 5 und Platz 7 nach Qualifikationsspielen**
  - **Gegeben sei**: Beide Qualifikationsspiele (Spiel 29 & 30) sind beendet und weisen eindeutige Sieger auf.
  - **Wenn**: Die Spiele abgeschlossen sind.
  - **Dann**: Werden in Spiel 34 (Platz 5) die beiden Gewinner und in Spiel 33 (Platz 7) die beiden Verlierer eingetragen.

- [x] **AC-4: Analoge Funktionalität für die männliche Jugend (mU14)**
  - **Gegeben sei**: Die Spiele der mU14 erreichen denselben Status.
  - **Dann**: Werden Spiele 27, 28, 31, 32, 35, 36, 39 und 40 identisch nach derselben Logik automatisch besetzt.

- [x] **AC-5: Schutz vor unvollständigen Vorrundenständen**
  - **Gegeben sei**: In einer Gruppe sind erst 4 von 6 Spielen beendet.
  - **Wenn**: Die Automatik läuft.
  - **Dann**: Bleiben die Halbfinal-Plätze für diese Gruppe unbesetzt (`teamHomeId: ""` bzw. bestehender Platzhalter bleibt erhalten), und es wird kein unvollständiger Tabellenstand voreilig festgeschrieben.

- [x] **AC-6: Manueller Auslöser & Feedback im Adminbereich**
  - **Gegeben sei**: Die Turnierleitung befindet sich im Tab *Spielplan* (`/admin`).
  - **Wenn**: Auf *„Finalpaarungen aktualisieren“* geklickt wird.
  - **Dann**: Führt das System die Prüfung durch, speichert die Daten in Firestore und zeigt ein klares Feedback (z. B. Toast/Hinweis: *„Finalpaarungen erfolgreich mit den Tabellenständen synchronisiert“*).

- [x] **AC-7: Manuelle Korrekturmöglichkeit bleibt erhalten**
  - **Gegeben sei**: Ein Finalspiel wurde automatisch besetzt.
  - **Wenn**: Der Turnierleiter auf das Stift-Icon klickt und im Dropdown ein anderes Team auswählt und speichert.
  - **Dann**: Wird dieses Team im Spiel gespeichert und nicht sofort wieder ungewollt überschrieben.

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Admin-Bereich (`ScheduleManager.tsx`)
In der oberen Aktionsleiste (neben *„Zeiten verschieben“* und *„Spielplan automatisch generieren“*) wird ein neuer Button platziert:
```tsx
<button
  onClick={handleSyncFinals}
  className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors shadow-sm cursor-pointer"
>
  <RefreshCw className="h-3.5 w-3.5" />
  <span>Finalpaarungen aktualisieren</span>
</button>
```

### 5.2 Verhalten bei K.o.-Gleichstand
Falls ein Finalspiel mit unentschiedenem Spielstand beendet wird (vor Penalty-Eingabe), meldet die Automatik:
*„Spiel #X endete unentschieden. Bitte Penalty-Ergebnis erfassen oder Sieger manuell im Spiel eintragen.“*

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Datenmodell (`DATABASE.md`)
Das bestehende Datenmodell unterstützt diese Funktionalität bereits vollständig:
- `teamHomeId: string`
- `teamAwayId: string`
- `teamHomePlaceholder?: string`
- `teamAwayPlaceholder?: string`
- `finalType?: FinalMatchType`
Es ist keine Migration oder Schemaänderung in Firestore notwendig.

### 6.2 Neuer Service / Modul
- Datei: `src/services/matchProgressionService.ts`
  - `determineFinalRoundAssignments(matches: Match[], teams: Team[]): MatchAssignmentUpdate[]`
  - `syncFinalRoundMatches(matches: Match[], teams: Team[]): Promise<{ updatedCount: number }>`

### 6.3 Performance & Firestore-Kosten
- Batch-Writes: Aktualisierungen werden gebündelt in einem Firestore `writeBatch` ausgeführt.
- No-Op-Schutz: Es werden nur Matches geschrieben, bei denen sich `teamHomeId` oder `teamAwayId` tatsächlich geändert hat.

---

## 7. Verifikations- & Testplan

### 7.1 Manuelle Tests
1. [ ] **Test 1: Vorrunden-Abschluss wU14 simulieren**:
   - Alle 12 wU14-Gruppenspiele auf `finished` mit repräsentativen Ergebnissen setzen.
   - Prüfen, ob Spiele 25, 26, 29, 30 die Teams exakt gemäß Tabellenplätzen 1–4 erhalten.
2. [ ] **Test 2: Halbfinal-Abschluss wU14 simulieren**:
   - Spiel 25 und 26 mit Ergebnissen beenden.
   - Prüfen, ob Spiel 38 (Finale) die beiden Sieger und Spiel 37 (Platz 3) die beiden Verlierer enthält.
3. [ ] **Test 3: Kiosk- & Gast-Ansicht**:
   - Verifizieren, dass im Turnierbaum (`FinalsBracketView`), Spielplan (`GuestScheduleView`) und auf der TV-Kiosk-Folie (`KioskFinalsSlide`) die echten Teamnamen und Logos nahtlos erscheinen.
4. [ ] **Test 4: Manueller Fallback**:
   - Team in Spiel 38 manuell per Dropdown ändern ➔ Änderung bleibt bestehen.

### 7.2 Automatisierte Validierung
- [ ] `npm run lint` & `npm run build` ohne Fehler.
- [ ] Unit-Test für `determineFinalRoundAssignments` mit Beispieldaten.

---

## 8. Offene Fragen & Klärungsbedarf
- Keine. Die Zuordnungsregeln (HF 1: 1.A vs 2.B; HF 2: 1.B vs 2.A etc.) sind bereits in `matchService.ts` und den Platzhalter-Texten fest definiert.
