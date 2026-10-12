# SPEC-031: Synchronisierung der Filterbuttons (Alle, wU14, mU14) in der Gäste-Ansicht

> **Status**: In Abnahme  
> **Typ**: Optimierung / UI/UX  
> **Branch**: `feat/SPEC-031-sync-guest-filter-buttons`  
> **Autor**: Antigravity  
> **Erstellt am**: 2026-10-12  
> **Letzte Änderung**: 2026-10-12  
> **Betroffene Bereiche**: Gast-Ansicht (`src/pages/guest/HomePage.tsx`, `src/components/guest/GuestScheduleView.tsx`, `src/components/guest/FinalsBracketView.tsx`, `src/components/guest/StandingsView.tsx`)

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
In der Gäste-Ansicht (`/`) gibt es auf den drei Seiten **Vorrunde**, **Finalrunde** und **Tabellen** jeweils identische 3-Segment-Filterbuttons: **[Alle]**, **[wU14]** und **[mU14]**.
Bislang verwalten diese drei Komponenten ihren Filterzustand jedoch unabhängig voneinander in einem lokalen Komponenten-`useState`.

Wenn ein Gast (z. B. ein Elternteil oder Fan eines wU14-Teams):
1. auf der Seite **Vorrunde** den Filter auf **wU14** setzt,
2. danach auf **Finalrunde** oder **Tabellen** wechselt,
ist dort wieder der Standardfilter **Alle** aktiv und der Nutzer muss den Filter erneut auf **wU14** umstellen.

### 1.2 Zielzustand & Mehrwert
- Der Filterzustand (`"all" | "wU14" | "mU14"`) wird seitenübergreifend zwischen **Vorrunde**, **Finalrunde** und **Tabellen** synchronisiert.
- Wird auf einer beliebigen dieser drei Seiten der Filter geändert, übernehmen die anderen beiden Seiten sofort dieselbe Filterauswahl.
- Der Filter bleibt auch beim Navigieren zu anderen Seiten (wie `/info` oder `/impressum`) und bei einem Neuladen der Seite innerhalb der Nutzersitzung (`sessionStorage`) erhalten.

---

## 2. User Stories

- **US-1**: Als **Zuschauer oder Betreuer eines wU14- bzw. mU14-Teams** möchte ich **den Altersklassen-Filter nur einmal auswählen müssen**, damit **ich beim Wechseln zwischen Vorrunde, Finalrunde und Tabellen automatisch dieselbe gefilterte Ansicht sehe**.
- **US-2**: Als **Turnierbesucher** möchte ich **jederzeit auf einer der drei Seiten auf „Alle“ zurückstellen können**, damit **alle drei Seiten wieder den kompletten Turnierüberblick anzeigen**.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)
- [x] **State Lifting & Synchronisation**:
  - Der Zustand `selectedCategory` (`"all" | GenderCategory`) wird zentral in `HomePage.tsx` verwaltet.
  - `GuestScheduleView`, `FinalsBracketView` und `StandingsView` erhalten `selectedCategory` sowie einen Callback `onSelectCategory` über Props.
  - Das lokale `useState` in den drei Unterkomponenten wird durch die übergebenen Props abgelöst.
- [x] **Sitzungs-Persistenz**:
  - Speicherung des gewählten Filters in `sessionStorage` (Key: `kbc_guest_filter`).
  - Beim ersten Aufruf ist der Default `"all"`, sofern kein gespeicherter Wert in der Session vorliegt.
- [x] **Identisches Look & Feel**:
  - Die visuelle Darstellung und das Styling der 3-Segment-Buttons (Farben für Alle, wU14, mU14) bleiben unverändert erhalten.

### 3.2 Explizit Out-of-Scope
- Änderungen an der Admin- oder Kiosk-Ansicht.
- Änderungen am Live-Hero (`LiveHeroCard`).
- Änderungen an Datenbank- oder Backend-Strukturen.

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien
- [x] **AC-1: Filterwechsel in Vorrunde synchronisiert Finalrunde und Tabellen**
  - **Gegeben sei**: Der Nutzer befindet sich auf der Seite **Vorrunde** (`/#vorrunde`).
  - **Wenn**: Der Nutzer auf den Button **wU14** klickt.
  - **Dann**:
    - Zeigt die Vorrunde nur Spiele der wU14 an.
    - Klickt der Nutzer auf **Finalrunde**, ist dort der Filterbutton **wU14** aktiv und es werden nur wU14-Finalspiele angezeigt.
    - Klickt der Nutzer auf **Tabellen**, ist dort der Filterbutton **wU14** aktiv und es werden nur wU14-Tabellen angezeigt.

- [x] **AC-2: Filterwechsel in Finalrunde synchronisiert Vorrunde und Tabellen**
  - **Gegeben sei**: Der Nutzer befindet sich auf der Seite **Finalrunde** (`/#finalrunde`).
  - **Wenn**: Der Nutzer auf den Button **mU14** klickt.
  - **Dann**:
    - Zeigt die Finalrunde nur Spiele der mU14 an.
    - Klickt der Nutzer auf **Vorrunde** oder **Tabellen**, ist dort ebenfalls **mU14** aktiv und gefiltert.

- [x] **AC-3: Zurücksetzen auf „Alle“ synchronisiert alle Ansichten**
  - **Gegeben sei**: Ein Filter (`wU14` oder `mU14`) ist aktiv.
  - **Wenn**: Der Nutzer auf einer der drei Seiten auf **Alle** klickt.
  - **Dann**: Wechseln alle drei Seiten wieder zur Gesamtanzeige („Alle“ aktiv).

- [x] **AC-4: Beibehaltung nach Navigation zu Info und zurück**
  - **Gegeben sei**: Der Nutzer hat den Filter auf **wU14** gesetzt.
  - **Wenn**: Der Nutzer auf die Seite **Info** (`/info`) wechselt und anschließend zur Startseite zurückkehrt.
  - **Dann**: Ist auf Vorrunde, Finalrunde und Tabellen weiterhin **wU14** ausgewählt.

---

## 5. Technische Architektur & Umsetzungsdetails

### 5.1 Komponenten-Schnittstellen
In `src/pages/guest/HomePage.tsx`:
```tsx
const [selectedCategory, setSelectedCategory] = useState<"all" | GenderCategory>(() => {
  const saved = sessionStorage.getItem("kbc_guest_filter")
  if (saved === "wU14" || saved === "mU14") return saved
  return "all"
})

const handleCategoryChange = (category: "all" | GenderCategory) => {
  setSelectedCategory(category)
  sessionStorage.setItem("kbc_guest_filter", category)
}
```

Props in `GuestScheduleView`, `FinalsBracketView`, `StandingsView`:
```tsx
interface FilterProps {
  selectedCategory: "all" | GenderCategory
  onSelectCategory: (category: "all" | GenderCategory) => void
}
```

---

## 6. Risiken & Abhängigkeiten

- Keine Risiken bezüglich Datenkonsistenz, da rein clientseitiger UI-Zustand.
- Keine Breaking Changes für Routing oder URLs.
