# SPEC-035: Wischgesten-Navigation (Swipe) in der Gästeansicht

> **Status**: In Abnahme  
> **Typ**: Feature  
> **Branch**: `feat/SPEC-035-guest-swipe-navigation`  
> **Autor**: Antigravity  
> **Erstellt am**: 2026-10-13  
> **Letzte Änderung**: 2026-10-13  
> **Betroffene Bereiche**: Gast-Ansicht (`/`)  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
In der mobilen Gästeansicht (`/`) wechseln Nutzer aktuell zwischen den 4 Hauptansichten (**Live**, **Vorrunde**, **Finalrunde**, **Tabellen**) ausschließlich durch Antippen der Reiter in der oberen Navigationsleiste. Auf modernen Smartphones und Tablets erwarten Benutzer jedoch häufig die Möglichkeit, durch horizontales Wischen (Swipe-Gesten nach links oder rechts) flüssig zwischen benachbarten Reitern hin- und herzuwechseln.

### 1.2 Zielzustand & Mehrwert
Nutzer auf Touch-Geräten können durch horizontales Wischen auf dem Bildschirm intuitiv zwischen den Hauptreitern der Gästeansicht navigieren:
- **Wischen nach links** (Finger bewegt sich von rechts nach links): Wechsel zum nächsten Reiter.
- **Wischen nach rechts** (Finger bewegt sich von links nach rechts): Wechsel zum vorherigen Reiter.
- Die normale vertikale Scroll-Funktionalität (z. B. durch Spielpläne oder Tabellen) bleibt dabei vollständig unbeeinträchtigt.

---

## 2. User Stories

- **US-1**: Als mobiler **Gast/Zuschauer** möchte ich mit einer Wischbewegung nach links oder rechts zwischen Live, Vorrunde, Finalrunde und Tabellen wechseln können, um die App einhändig und intuitiv wie eine native App bedienen zu können.
- **US-2**: Als **Zuschauer** möchte ich beim normalen vertikalen Scrollen nicht versehentlich den Reiter wechseln, damit ich lange Spielpläne oder Tabellen flüssig lesen kann.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have / Should-Have)
- [ ] **Reihenfolge der Reiter**:
  1. `Live` (`/#live` bzw. Standard)
  2. `Vorrunde` (`/#schedule` / `/#vorrunde`)
  3. `Finalrunde` (`/#finals` / `/#finalrunde`)
  4. `Tabellen` (`/#standings`)
- [ ] **Gesten-Richtung & Logik**:
  - Wisch nach links $\rightarrow$ Nächster Reiter (z. B. Live $\rightarrow$ Vorrunde). Am rechten Ende (Tabellen) passiert beim Wischen nach links nichts (kein Endlos-Loop).
  - Wisch nach rechts $\rightarrow$ Vorheriger Reiter (z. B. Vorrunde $\rightarrow$ Live). Am linken Ende (Live) passiert beim Wischen nach rechts nichts.
- [ ] **Gesten-Toleranz & Scroll-Schutz**:
  - Mindest-Weg horizontal: z. B. $60\text{px}$ (`minSwipeDistance`).
  - Vertikaler Schutz: Die horizontale Bewegung $|\Delta X|$ muss deutlich größer sein als die vertikale $|\Delta Y|$ (z. B. $|\Delta X| > 1.5 \times |\Delta Y|$), damit vertikales Scrollen niemals fälschlicherweise als Tab-Wechsel interpretiert wird.
  - Optionale maximale Gesten-Dauer (z. B. $< 500\text{ms}$), um langes Schleifen/Ziehen von schnellen Wischern abzugrenzen.
- [ ] **URL-Synchronisation**:
  - Der Tab-Wechsel aktualisiert die URL-Hash-Navigation via React Router (`navigate(nextHash)`), sodass der Browserverlauf, das Teilen von Links und die Hervorhebung in der Header-Navigationsleiste synchron bleiben.

### 3.2 Explizit Out-of-Scope (Nicht Teil dieser Spec)
- Die Seite `/info` und `/impressum` bleiben separate Unterseiten und sind nicht Teil des 4-Tab-Swipe-Karussells.
- Keine native App-Karussell-Animation mit echten CSS-3D-Transform-Pages (reine, leichtgewichtige Gestenerkennung mit sofortigem Tab-Wechsel).
- Keine Swipe-Navigation in der Turnierleitung (`/admin`) oder im Kiosk (`/kiosk`).

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien
- [ ] **AC-1: Wischen nach links wechselt zum nächsten Tab**
  - **Gegeben sei**: Der Gast befindet sich auf der Ansicht `Live`.
  - **Wenn**: Der Gast auf dem Hauptinhaltsbereich nach links wischt ($|\Delta X| \ge 60\text{px}$ und $|\Delta X| > 1.5 \times |\Delta Y|$).
  - **Dann**: Wechselt die Ansicht zu `Vorrunde` (`/#schedule`) und der entsprechende Header-Tab wird aktiv markiert.
- [ ] **AC-2: Wischen nach rechts wechselt zum vorherigen Tab**
  - **Gegeben sei**: Der Gast befindet sich auf der Ansicht `Finalrunde`.
  - **Wenn**: Der Gast nach rechts wischt.
  - **Dann**: Wechselt die Ansicht zu `Vorrunde` (`/#schedule`).
- [ ] **AC-3: Grenzen der Reiter**
  - **Gegeben sei**: Der Gast befindet sich auf `Live` (erster Tab) oder `Tabellen` (letzter Tab).
  - **Wenn**: Auf `Live` nach rechts bzw. auf `Tabellen` nach links gewischt wird.
  - **Dann**: Bleibt der jeweilige Tab unverändert aktiv.
- [ ] **AC-4: Schutz vor versehentlichem Auslösen beim Scrollen**
  - **Gegeben sei**: Ein Gast scrollt vertikal durch den Spielplan oder die Tabelle.
  - **Wenn**: Die Bewegung überwiegend vertikal ist ($|\Delta Y| \ge |\Delta X| / 1.5$).
  - **Dann**: Wird kein Tab-Wechsel ausgelöst und das Scrollen läuft normal durch.

### 4.2 Allgemeine Qualitätskriterien
- [ ] Keine zusätzlichen externen Schwergewicht-Bibliotheken erforderlich (schlanke, native Touch-Events via React Hook `useSwipeGesture` oder direktem Touch-Handler).
- [ ] Vollständige TypeScript-Typisierung ohne `any`.
- [ ] `npm run build` und Linting laufen fehlerfrei durch.

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Betroffene Ansichten & Komponenten
- **Pfad / URL**: `/`
- **Komponenten**:
  - `src/pages/guest/HomePage.tsx` (oder ein Wrapper-Container um `<main>` in `GuestLayout.tsx` / `HomePage.tsx`)
  - Ggf. neuer Helper/Hook `src/hooks/useSwipeGesture.ts` für saubere Kapselung der Touch-Berechnung.

### 5.2 Interaktionsablauf
1. Nutzer berührt den Bildschirm (`onTouchStart`: Speicherung von `startX`, `startY`, `startTime`).
2. Nutzer bewegt und hebt den Finger (`onTouchEnd`: Auswertung von `endX`, `endY`, Zeitstempel).
3. Entspricht die Bewegung einem horizontalen Swipe:
   - Index des aktiven Tabs ermitteln (0: Live, 1: Vorrunde, 2: Finalrunde, 3: Tabellen).
   - Nach links: `index + 1` (sofern $< 3$).
   - Nach rechts: `index - 1` (sofern $> 0$).
   - Navigation via `navigate(targetHash)`.

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Datenmodell (`DATABASE.md`)
- Keine Änderungen an Firestore oder Datenbankstrukturen.

### 6.2 TypeScript Interfaces (`src/types/`)
- Keine neuen Datenbanktypen.

### 6.3 State & Hook
- Neuer Hook `useSwipeGesture`:
  ```typescript
  interface SwipeHandlers {
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
  }
  ```

---

## 7. Edge Cases & Fehlerbehandlung

- **Horizontale Scroll-Elemente**: Falls der Nutzer horizontal über die Kategorie-Filter-Pills (`wU14` / `mU14` / `Alle`) streicht, sollte das Scrollen der Pills nicht primär als Seitenwechsel missverstanden werden.
- **Multitouch**: Gesten mit mehr als einem Finger (`touches.length > 1`) werden ignoriert.

---

## 8. Verifikations- & Testplan

### 8.1 Manuelle Tests
1. [ ] Auf Mobilgerät / Chrome DevTools mit Touch-Emulation:
   - Auf `Live` nach links wischen $\rightarrow$ `Vorrunde` öffnet sich.
   - Auf `Vorrunde` nach links wischen $\rightarrow$ `Finalrunde` öffnet sich.
   - Auf `Finalrunde` nach links wischen $\rightarrow$ `Tabellen` öffnet sich.
   - Auf `Tabellen` nach links wischen $\rightarrow$ Nichts passiert.
   - Auf `Tabellen` nach rechts wischen $\rightarrow$ `Finalrunde` öffnet sich.
   - Auf `Live` nach rechts wischen $\rightarrow$ Nichts passiert.
2. [ ] Vertikales Scrollen in Vorrunde:
   - Von oben nach unten und unten nach oben durch die Spiele scrollen $\rightarrow$ Tab wechselt nicht.
3. [ ] Desktop-Verhalten prüfen:
   - Mausklicks und Maus-Bedienung funktionieren unverändert.

### 8.2 Automatisierte Tests / Validierung
- [ ] `npm run build` läuft fehlerfrei ohne Typfehler.

---

## 9. Offene Fragen & Klärungsbedarf
- Keine offenen Fragen.
