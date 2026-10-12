# SPEC-032: Korrektur der Stage-Badges für Halbfinals in Kiosk-Finalrunde

> **Status**: In Abnahme  
> **Typ**: Bugfix  
> **Branch**: fix/SPEC-032-kiosk-finalrunde-halbfinale-tags  
> **Autor**: Agent  
> **Erstellt am**: 2026-10-12  
> **Letzte Änderung**: 2026-10-12  
> **Betroffene Bereiche**: Kiosk (/kiosk)  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Auf der Kiosk-Folie „Finalrunde“ (`KioskFinalsSlide.tsx`) werden bei Halbfinalspielen fälschlicherweise der Tag „Finale“ und das Pokal-Icon (Trophy) angezeigt anstelle der vorgesehenen Kennzeichnung „HF 1“ bzw. „HF 2“.

Ursache im Code (`KioskFinalsSlide.tsx`, Zeile 94–98 und 122–129):
```typescript
const stageBadgeText = getCompactFinalName(match)
const isFinalGame =
  stageBadgeText === "Finale" ||
  match.finalType === "final" ||
  match.matchName?.toLowerCase().includes("finale")
```
Da der Spielname für Halbfinals `Halbfinale 1` bzw. `Halbfinale 2` lautet, liefert `match.matchName?.toLowerCase().includes("finale")` fälschlicherweise `true` zurück (da der Substring `"finale"` in `"halbfinale"` enthalten ist). In Verbindung mit der Bedingung `{isFinalGame ? <span>Finale</span> : stageBadgeText}` wurde der eigentliche Text `HF 1` / `HF 2` durch `Finale` ersetzt und als Endspiel hervorgehoben.

### 1.2 Zielzustand & Mehrwert
- Halbfinalspiele zeigen im Kiosk-Modus korrekt ihr kompaktes Stage-Badge an (`HF 1` bzw. `HF 2`) ohne Pokal-Icon und mit neutralem Styling (`bg-slate-50`).
- Ausschließlich die tatsächlichen Finalspiele (Endspiele / `finalType === "final"`) erhalten das goldene Hervorhebungs-Badge mit Pokal-Icon und der Beschriftung `Finale`.
- Besucher und Teams sehen auf der Kiosk-Großanzeige sofort und unverwechselbar, welche Spiele Halbfinals und welche die echten Endspiele sind.

---

## 2. User Stories

- **US-1**: Als **Kiosk-Zuschauer** möchte ich auf der Finalrunden-Übersicht klar erkennen können, ob ein Spiel ein Halbfinale (`HF 1`, `HF 2`) oder das große Finale (`Finale`) ist, damit der Turnierverlauf eindeutig visualisiert wird.
- **US-2**: Als **Turnierleiter** möchte ich, dass die Tags auf dem Kiosk-Monitor exakt der Spielphase und dem Spielnamen entsprechen, ohne irreführende „Finale“-Labels bei Vor- oder Halbfinalspielen.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)
- [x] **Korrektur der `isFinalGame`-Bedingung** in `KioskFinalsSlide.tsx`:
  - Keine Teilstringsuche `.includes("finale")`, die auch `"halbfinale"` matched.
  - Prüfung strikt auf: `match.finalType === "final" || stageBadgeText === "Finale" || match.matchName?.trim().toLowerCase() === "finale"`.
- [x] **Anzeige des korrekten Kurznamens**:
  - Halbfinals zeigen `HF 1` bzw. `HF 2` (aus `getCompactFinalName`).
  - Nur wenn `isFinalGame` zutrifft, wird das Pokal-Icon (`Trophy`) angezeigt.
  - Dynamische Ausgabe von `{stageBadgeText}` anstelle von fest verdrahtetem `<span>Finale</span>`.

### 3.2 Explizit Out-of-Scope
- Keine Änderung an der Spielplan-Generierung oder den Match-Dokumenten in Firestore.
- Keine Änderung an anderen Kiosk-Folien (Scoreboard, Tabellen etc.).

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien
- [x] **AC-1: Badge für Halbfinalspiele**
  - **Gegeben sei**: Ein Finalrunden-Spiel mit `matchName: "Halbfinale 1"` oder `finalType: "semi_final"`.
  - **Wenn**: Die Kiosk-Folie „Finalrunde“ angezeigt wird.
  - **Dann**: Steht im Stage-Badge `HF 1` bzw. `HF 2` im neutralen Stil (`bg-slate-50 text-slate-700 border-slate-200`) ohne Trophy-Icon.

- [x] **AC-2: Badge für das große Finale**
  - **Gegeben sei**: Das Endspiel mit `matchName: "Finale"` oder `finalType: "final"`.
  - **Wenn**: Die Kiosk-Folie „Finalrunde“ angezeigt wird.
  - **Dann**: Steht im Stage-Badge `Finale` mit vorangestelltem Pokal-Icon (`Trophy`) im goldenen Stil (`bg-amber-100 text-amber-800 border-amber-300 font-extrabold`).

- [x] **AC-3: Platzierungsspiele unverändert**
  - **Gegeben sei**: Platzierungsspiele (z. B. `Spiel um Platz 3`, `Spiel um Platz 5`, `Spiel um Platz 7`, `Platzierungsspiel 1`).
  - **Wenn**: Die Kiosk-Folie „Finalrunde“ angezeigt wird.
  - **Dann**: Werden die kompakten Bezeichnungen wie `Platz 3`, `Platz 5`, `Platz 7`, `Pl. 1`, `Pl. 2` im neutralen Stil angezeigt.

### 4.2 Allgemeine Qualitätskriterien
- [x] Keine fest kodierten Parameter.
- [x] Vollständige TypeScript-Typisierung ohne `any`.
- [x] Fehlerfreie Ausführung von `npm run build` und Linting.

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Betroffene Ansichten & Komponenten
- **Pfad**: `/kiosk` (Slide: `Finalrunde`, Komponente: `KioskFinalsSlide.tsx`)
- **Badge-Styling**:
  - Halbfinale: `bg-slate-50 text-slate-700 border-slate-200`, Text: `HF 1` bzw. `HF 2`
  - Finale: `bg-amber-100 text-amber-800 border-amber-300 font-extrabold`, Icon: `<Trophy />`, Text: `Finale`
  - Platzierungsspiele: `bg-slate-50 text-slate-700 border-slate-200`, Text: z. B. `Platz 3`, `Platz 5`, `Platz 7`

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Datenmodell (`DATABASE.md`)
- Keine Änderungen an Firestore oder Schemata erforderlich.

### 6.2 Betroffene Dateien
- `src/components/kiosk/KioskFinalsSlide.tsx`: Anpassung von `isFinalGame` und Rendering des Stage-Badges.

---

## 7. Verifikations- & Testplan

### 7.1 Manuelle Tests
1. [x] Aufrufen der Kiosk-Ansicht `/kiosk`.
2. [x] Navigieren zur Folie „Finalrunde“ (Slide 4).
3. [x] Verifizieren, dass Halbfinalspiele mit `HF 1` bzw. `HF 2` beschriftet sind (nicht mit „Finale“).
4. [x] Verifizieren, dass das Endspiel weiterhin mit dem Pokal-Icon und „Finale“ in Gold hervorgehoben ist.
5. [x] Verifizieren, dass Platzierungsspiele unverändert korrekt dargestellt werden.

### 7.2 Automatisierte Validierung
- [x] `npm run build` läuft fehlerfrei ohne TypeScript- oder Lint-Fehler durch.

---

## 8. Freigabe & Nächste Schritte
Gemäß `AGENTS.md` darf die Implementierung erst nach ausdrücklicher Freigabe mit **`APPROVED`** durch den Nutzer gestartet werden.
