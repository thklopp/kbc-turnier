# SPEC-028: Umbenennung zu Vorrunde/Finalrunde & Einheitliche Filterbuttons (Alle, wU14, mU14) in der Gäste-Ansicht

> **Status**: In Abnahme  
> **Typ**: Optimierung / UI/UX  
> **Branch**: `feat/SPEC-028-guest-vorrunde-finalrunde-filter-tabs`  
> **Autor**: Antigravity  
> **Erstellt am**: 2026-10-12  
> **Letzte Änderung**: 2026-10-12  
> **Betroffene Bereiche**: Gast-Ansicht (`/`, `src/components/layouts/GuestLayout.tsx`, `src/components/guest/GuestScheduleView.tsx`, `src/components/guest/FinalsBracketView.tsx`, `src/pages/guest/HomePage.tsx`)

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
In der mobilen und Desktop-Gäste-Ansicht (`/`) existieren derzeit folgende Inkonsistenzen und Optimierungspotenziale:
1. **Benennung der Phasen**:
   - Die Tabs und Seiten heißen aktuell „Spielplan“ und „Finalphase“. Im Turnierkontext des Kurt-Becker-Cups ist die klare Trennung in **„Vorrunde“** (Samstag) und **„Finalrunde“** (Sonntag) fachlich präziser und für die Zuschauer intuitiver.
2. **Inkonsistente Filter-Bedienung**:
   - Auf der Seite „Spielplan“ gibt es eine aufklappbare, komplexe Filterleiste (Tage, Geschlecht, Gruppen, Filter-Reset etc.), die viel vertikalen Platz beansprucht und auf mobilen Geräten unübersichtlich ist.
   - Auf der Seite „Finalphase“ existiert ein rechtsbündiger Umschalter mit nur zwei Optionen (`wU14` / `mU14`), der kein „Alle“ anbietet und sich optisch von den neuen Tabellen-Buttons (SPEC-027) unterscheidet.
   - Auf der Seite „Tabellen“ wurde in SPEC-027 ein moderner, vollflächiger Filterbutton-Balken eingeführt, der sich mobil hervorragend bedienen lässt.
3. **Fehlende Gesamtsicht ("Alle")**:
   - Fans und Zuschauer, die den gesamten Verlauf beider Altersklassen chronologisch überblicken möchten, benötigen eine Option „Alle“, um nicht ständig hin- und herwechseln zu müssen.

### 1.2 Zielzustand & Mehrwert
- **Einheitliche Nomenklatur**:
  - Der Tab „Spielplan“ wird in **„Vorrunde“** umbenannt.
  - Der Tab „Finalphase“ wird in **„Finalrunde“** umbenannt.
  - Die Tab-Reihenfolge bleibt: **Live ➔ Vorrunde ➔ Finalrunde ➔ Tabellen**.
- **Aufgeräumte, einheitliche Filter**:
  - Die alten Filter (aufklappbare Filterleiste in Vorrunde sowie der alte 2er-Umschalter in Finalrunde) werden vollständig entfernt.
  - Beide Seiten erhalten oben einen vollflächigen 3-Segment-Filter im Stil der Tabellen-Ansicht: **[Alle]**, **[wU14]**, **[mU14]**.
  - Aktive Farbakzente:
    - **Alle**: Dunkles Schiefergrau (`bg-slate-800 text-white shadow-sm`)
    - **wU14**: Lila (`bg-purple-600 text-white shadow-sm`)
    - **mU14**: Blau (`bg-blue-600 text-white shadow-sm`)
    - Inaktiv: Neutrale Schrift (`text-slate-600 hover:text-slate-900`)
- **Vorrunden-Fokus**:
  - Die Seite „Vorrunde“ zeigt gezielt die 24 Gruppenspiele des Turniers.
- **Konsistente Farbsprache**:
  - Tags für wU14 auf Spielkarten durchgängig in Lila (statt Pink/Rosa).

---

## 2. User Stories

- **US-1**: Als **Zuschauer oder Elternteil in der Halle** möchte ich **über die Tabs „Vorrunde“ und „Finalrunde“ sofort verstehen, wo ich Gruppenspiele und wo ich K.o.- bzw. Platzierungsspiele finde**.
- **US-2**: Als **Mobilnutzer mit dem Smartphone** möchte ich **auf den Seiten „Vorrunde“ und „Finalrunde“ oben breite, leicht bedienbare Filterbuttons für „Alle“, „wU14“ und „mU14“ vorfinden**, um **schnell zwischen den Spielklassen zu filtern oder alle Spiele im Überblick zu behalten**.
- **US-3**: Als **Gast** möchte ich **auf der Seite Vorrunde keine überladenen Aufklappfilter bedienen müssen**, sondern **einen schnellen, sauberen Überblick über die Vorrundenspiele erhalten**.
- **US-4**: Als **Fan auf der Seite Finalrunde** möchte ich **auch die Option „Alle“ wählen können**, um **alle Final- und Platzierungsspiele des Sonntags chronologisch oder gruppiert einzusehen**.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)
- [x] **Tab-Umbenennung im Guest-Layout**:
  - `Spielplan` ➔ `Vorrunde`
  - `Finalphase` ➔ `Finalrunde`
  - Hash-Unterstützung für Abwärtskompatibilität (`#schedule` / `#vorrunde` sowie `#finals` / `#finalrunde`).
- [x] **Entfernung alter Filterkomponenten**:
  - Komplette Entfernung der aufklappbaren Filterleiste aus `GuestScheduleView` (DayFilter, GroupFilter, Toggle-Button, Filter-Badges).
  - Entfernung des alten 2er-Genderswitchers aus `FinalsBracketView`.
- [x] **Einheitliche 3-Segment-Filterbuttons oben**:
  - Integration eines Balkens mit `Alle`, `wU14` und `mU14` auf voller Breite:
    - `w-full rounded-xl bg-slate-100 p-1 border border-slate-200`
    - Segment `Alle`: aktiv `bg-slate-800 text-white shadow-sm`
    - Segment `wU14`: aktiv `bg-purple-600 text-white shadow-sm`
    - Segment `mU14`: aktiv `bg-blue-600 text-white shadow-sm`
    - Segmente inaktiv: `text-slate-600 hover:text-slate-900`
- [x] **Filterlogik in Vorrunde (`GuestScheduleView`)**:
  - Darstellung ausschließlich von Vorrundenspielen (`phase === "group"` bzw. Matches 1 bis 24).
  - Filter `"all"`: Alle 24 Vorrundenspiele.
  - Filter `"wU14"`: 12 Vorrundenspiele der wU14.
  - Filter `"mU14"`: 12 Vorrundenspiele der mU14.
  - Header/Zähler aktualisiert auf „Vorrunde“ (z. B. „Vorrunde • X Spiele“).
- [x] **Filterlogik & Darstellung in Finalrunde (`FinalsBracketView`)**:
  - Filter `"all"`: Anzeige beider Konkurrenzen (wU14 und mU14) mit klaren Bereichsüberschriften und Badges.
  - Filter `"wU14"`: Nur Finalspiele der wU14 (Halbfinals, Platzierungs- und Medaillenspiele).
  - Filter `"mU14"`: Nur Finalspiele der mU14 (Halbfinals, Platzierungs- und Medaillenspiele).
  - Ergänzung von Geschlechter-Badges auf den Match-Karten in der Finalrunde (Lila für wU14, Blau für mU14).
- [x] **Farb-Harmonisierung**:
  - Ablösung von verbliebenen `pink-*`-Klassen durch `purple-*` für wU14 in den betroffenen Komponenten.

### 3.2 Explizit Out-of-Scope
- Änderungen an der Tabellen-Ansicht (`StandingsView`) – diese behält ihre 2 Umschalter `wU14` und `mU14` gemäß SPEC-027 (da Tabellen getrennt nach Geschlecht berechnet werden).
- Änderungen an der Kiosk- oder Admin-Ansicht.
- Änderungen an der Firestore-Datenstruktur.

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien
- [x] **AC-1: Tab-Bezeichnungen im Navigationsmenü**
  - **Gegeben sei**: Ein Nutzer ruft die Gast-Ansicht (`/`) auf.
  - **Wenn**: Die Navigationsleiste unterhalb des Headers betrachtet wird.
  - **Dann**: Lauten die vier Tabs: `Live`, `Vorrunde`, `Finalrunde`, `Tabellen`.
  - **Und**: Das Anklicken von `Vorrunde` öffnet den Vorrunden-Tab (Hash `#vorrunde` bzw. `#schedule`).
  - **Und**: Das Anklicken von `Finalrunde` öffnet den Finalrunden-Tab (Hash `#finalrunde` bzw. `#finals`).

- [x] **AC-2: Vorrunde Filterbuttons & Entfall alter Filter**
  - **Gegeben sei**: Der Nutzer befindet sich auf der Seite `Vorrunde`.
  - **Wenn**: Die Seite geladen wird.
  - **Dann**: Gibt es keine aufklappbare Filterleiste mehr mit Tages- und Gruppenfiltern.
  - **Und**: Ganz oben wird ein vollflächiger Filter mit den drei Optionen `Alle`, `wU14`, `mU14` angezeigt.
  - **Und**: Standardmäßig ist `Alle` aktiv (`bg-slate-800 text-white`).
  - **Und**: Beim Klick auf `wU14` wird der Button lila (`bg-purple-600 text-white`) und es werden nur die Vorrundenspiele der Mädchen angezeigt.
  - **Und**: Beim Klick auf `mU14` wird der Button blau (`bg-blue-600 text-white`) und es werden nur die Vorrundenspiele der Jungen angezeigt.

- [x] **AC-3: Finalrunde Filterbuttons & Entfall alter Umschalter**
  - **Gegeben sei**: Der Nutzer befindet sich auf der Seite `Finalrunde`.
  - **Wenn**: Die Seite geladen wird.
  - **Dann**: Gibt es keinen rechtsbündigen 2er-Umschalter mehr.
  - **Und**: Oben ist der einheitliche 3er-Filterbalken mit `Alle`, `wU14`, `mU14` vorhanden.
  - **Und**: Standardmäßig ist `Alle` aktiv und zeigt die Finalspiele beider Klassen.
  - **Und**: Beim Umschalten auf `wU14` bzw. `mU14` werden nur die K.o.-Spiele der gewählten Altersklasse dargestellt.

- [x] **AC-4: Vorrunden-Scope der Spiele**
  - **Gegeben sei**: Die Seite `Vorrunde`.
  - **Wenn**: Spiele angezeigt werden.
  - **Dann**: Werden ausschließlich Gruppenspiele (`phase === "group"`) aufgeführt (keine Finalspiele wie Platzierungsspiele oder Halbfinals).

- [x] **AC-5: Einheitliche Geschlechter-Farben**
  - **Gegeben sei**: Beliebige Match-Karten auf den Seiten Vorrunde oder Finalrunde.
  - **Wenn**: Ein Spiel der wU14 gerendert wird.
  - **Dann**: Werden Badges oder Akzente in Lila (`purple-50`/`purple-700`) dargestellt, nicht in Pink/Rosa.

### 4.2 Allgemeine Qualitätskriterien
- [x] TypeScript strikt ohne `any`.
- [x] Build (`npm run build`) und Linter (`npm run lint`) laufen ohne Fehler durch.
- [x] Vollständige mobile Reaktionsfähigkeit und Touch-Bedienbarkeit.

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Komponenten & Design
1. **`src/components/layouts/GuestLayout.tsx`**:
   - Tab 2: Text `Vorrunde`, Link `/#vorrunde` (oder `/#schedule`), Icon `Calendar`.
   - Tab 3: Text `Finalrunde`, Link `/#finals`, Icon `Medal`.
2. **`src/components/guest/GuestScheduleView.tsx`**:
   - Neuer Filterbalken:
     ```tsx
     <div className="flex w-full rounded-xl bg-slate-100 p-1 border border-slate-200">
       <button onClick={() => setSelectedCategory("all")} className={...}>Alle</button>
       <button onClick={() => setSelectedCategory("wU14")} className={...}>wU14</button>
       <button onClick={() => setSelectedCategory("mU14")} className={...}>mU14</button>
     </div>
     ```
   - Kompakte Titelzeile: z. B. `Vorrunde` mit Badge der Spielanzahl (z. B. `24 Spiele` bzw. `12 Spiele`).
   - Entfernung von `isFilterOpen`, `dayFilter`, `groupFilter`, etc.
   - Matchkarten filtern auf `m.phase === "group"` (bzw. `m.matchNumber <= 24`).
3. **`src/components/guest/FinalsBracketView.tsx`**:
   - Identischer Filterbalken mit `Alle`, `wU14`, `mU14`.
   - Bei `Alle`: Übersichtliche Unterteilung in Abschnitte wU14 & mU14 oder Halbfinals / Platzierungsspiele mit klaren Geschlechter-Badges.
   - Auf den Finalspiel-Karten wird das jeweilige Geschlecht (`wU14` lila, `mU14` blau) als Badge mitgeführt.

---

## 6. Technische Auswirkungen & Architekturbezug

- **Datenmodell**: Keine Änderungen an Firestore erforderlich.
- **TypeScript**:
  - Filterzustand: `type GenderFilter = "all" | GenderCategory`.
- **Performance**:
  - Geringere Komplexität und kleineres Bundle durch Entfall überflüssiger Filter-States und Icons.

---

## 7. Verifikations- & Testplan

### 7.1 Manuelle Tests
1. **Navigation**:
   - Desktop & Mobile: Prüfen der Bezeichnungen `Live`, `Vorrunde`, `Finalrunde`, `Tabellen`.
   - Direkte URL-Aufrufe mit Hash `#schedule`, `#vorrunde`, `#finals`, `#standings` prüfen.
2. **Vorrunde**:
   - Aufruf von `Vorrunde`: 3 Buttons sichtbar (Alle, wU14, mU14).
   - "Alle": Alle 24 Vorrundenspiele chronologisch aufgelistet.
   - "wU14": 12 Mädchenspiele angezeigt, Button lila aktiv.
   - "mU14": 12 Jungenspiele angezeigt, Button blau aktiv.
3. **Finalrunde**:
   - Aufruf von `Finalrunde`: 3 Buttons sichtbar (Alle, wU14, mU14).
   - "Alle": Alle K.o.-Spiele beider Klassen sichtbar.
   - "wU14": Halbfinals und Platzierungsspiele wU14 sichtbar.
   - "mU14": Halbfinals und Platzierungsspiele mU14 sichtbar.
4. **Design & Farben**:
   - Lila Akzente für wU14, blaue Akzente für mU14.

### 7.2 Automatisierte Validierung
- `npm run lint`
- `npm run build`
