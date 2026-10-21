# SPEC-055: Entfernung des blauen Headers von der Info-Seite

> **Status**: In Abnahme  
> **Typ**: UI-Optimierung / Redesign  
> **Branch**: `feat/SPEC-055-entfernung-blauer-header-info-seite`  
> **Autor**: Antigravity  
> **Erstellt am**: 2026-10-21  
> **Letzte Änderung**: 2026-10-21  
> **Betroffene Bereiche**: Gast-Ansicht (`/info`) – `src/pages/guest/InfoPage.tsx`  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Auf der Info-Seite (`/info`) wird innerhalb der Informationskarte oberhalb des dynamischen Textes ein auffälliger blauer Header-Banner gerendert (`bg-gradient-to-r from-blue-900 via-blue-800 to-slate-900 px-6 py-8 text-white`). Dieser enthält:
- Vereinsname („Rüsselsheimer Ruder-Klub 08 e.V.“)
- Feste Überschrift („20. Kurt-Becker-Cup“)
- Fest verdrahteten Einleitungstext
- Vier statische Info-Badges (Datum, Altersklassen, Verpflegung, Schiedsrichter)

Diese Kopfzeile ist aus mehreren Gründen redundant und unvorteilhaft:
1. **Redundanz**: Die übergeordnete Anwendungsleiste (`GuestLayout`) enthält bereits das Vereinswappen und den Turniertitel. Zudem beginnt der im Adminbereich pflegbare Markdown-Inhalt standardmäßig selbst mit `# Willkommen zum 20. Kurt-Becker-Cup! 🏑` und führt alle relevanten Punkte auf.
2. **Keine Dynamik**: Die Angaben im Header sind statisch im Code hinterlegt und lassen sich nicht über den Markdown-Editor im Adminbereich bearbeiten.
3. **Platzbedarf**: Auf Smartphones und kleineren Displays nimmt der Banner viel Platz ein, bevor der eigentliche Inhalt sichtbar wird.

### 1.2 Zielzustand & Mehrwert
- Der blaue Header-Banner wird vollständig aus `InfoPage.tsx` entfernt.
- Die weiße Informationskarte rendert direkt den Markdown-Inhalt (bzw. den animierten Ladezustand), gefolgt vom bestehenden dezenten Footer-Abschluss (`Bei Fragen wendet euch jederzeit an die Turnierleitung...`).
- Nicht mehr benötigte Icon-Imports (`Calendar`, `Utensils`, `Award`, `BookOpen`) in `InfoPage.tsx` werden entfernt.
- Die Info-Seite wirkt aufgeräumt, responsiv und stellt die redaktionell gepflegten Inhalte ohne redundante Titeldopplungen in den Fokus.

---

## 2. User Stories

- **US-1**: Als **Besucher der Info-Seite**, möchte ich direkt die gepflegten Turnierinformationen sehen können, ohne vorher an einem redundanten, statischen blauen Header vorbeiscrollen zu müssen.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)
- [x] **FR-1: Entfernung des blauen Banners**:
  - Der gesamte Container `<div className="border-b border-slate-100 bg-gradient-to-r from-blue-900 via-blue-800 to-slate-900 px-6 py-8 text-white">...</div>` inklusive Titel, Subtitel und Badges wird aus `src/pages/guest/InfoPage.tsx` entfernt.
- [x] **FR-2: Clean Code & Bereinigung von Imports**:
  - Nicht mehr verwendete Icons (`Calendar`, `Utensils`, `Award`, `BookOpen`) werden aus den Imports in `src/pages/guest/InfoPage.tsx` entfernt.
- [x] **FR-3: Beibehaltung der übrigen Elemente**:
  - Die obere Breadcrumb- / Zurück-Leiste (`Zurück zur Übersicht` und Badge `Turnier-Info`) bleibt unverändert.
  - Das Markdown-Rendering und der untere Footer-Hinweis bleiben unverändert erhalten.

### 3.2 Explizit Out-of-Scope
- Keine Änderungen an der Markdown-Verwaltung (`infoService.ts`, `DEFAULT_INFO_MARKDOWN`).
- Keine Änderungen am Admin-Info-Editor (`AdminInfoEditor.tsx`).
- Keine Änderungen an anderen Seiten oder Layouts (`GuestLayout.tsx`).

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien
- [x] **AC-1: Header-Entfernung auf `/info`**
  - **Gegeben sei**: Ein Gast ruft die Seite `/info` auf.
  - **Wenn**: Die Seite gerendert wird.
  - **Dann**: Ist kein dunkelblauer Header-Banner mit Farbverlauf, Badges oder statischem Untertitel mehr sichtbar. Die Inhaltskarte beginnt direkt mit dem Markdown-Inhalt (z. B. der H1-Überschrift des Editors).
- [x] **AC-2: Footer & Navigation intakt**
  - **Gegeben sei**: Die Seite `/info` ist geöffnet.
  - **Wenn**: Der obere und untere Bereich betrachtet wird.
  - **Dann**: Ist oben die Zurück-Navigation zur Übersicht vorhanden und unten der dezente Hinweisbalken zur Turnierleitung mit Link zum Spielplan sichtbar.
- [x] **AC-3: Build & Linting**
  - **Gegeben sei**: Der Code wurde angepasst.
  - **Wenn**: `npm run build` und `npm run lint` ausgeführt werden.
  - **Dann**: Gibt es keine TypeScript-, Syntax- oder Lint-Fehler.

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Betroffene Ansichten & Komponenten
- `src/pages/guest/InfoPage.tsx`

#### Vorher:
```tsx
{/* Main Info Card */}
<div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
  {/* Header Banner (Dunkelblauer Gradient mit Badges) */}
  <div className="border-b border-slate-100 bg-gradient-to-r from-blue-900 via-blue-800 to-slate-900 px-6 py-8 text-white">
    ...
  </div>

  {/* Markdown Rendered Content */}
  <div className="p-6 sm:p-8">
    ...
  </div>
...
```

#### Nachher:
```tsx
{/* Main Info Card */}
<div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
  {/* Markdown Rendered Content */}
  <div className="p-6 sm:p-8">
    ...
  </div>
...
```

---

## 6. Technische Auswirkungen & Architekturbezug

- **Datenbank/Firestore**: Keine Änderungen.
- **TypeScript-Typen**: Keine Änderungen.
- **Abhängigkeiten**: Keine neuen Pakete erforderlich.
