# SPEC-055: Entfernung des blauen Headers von der Info-Seite & RRK-Logo vor dem Titel

> **Status**: Abgeschlossen  
> **Typ**: UI-Optimierung / Redesign  
> **Branch**: `feat/SPEC-055-entfernung-blauer-header-info-seite`  
> **Autor**: Antigravity  
> **Erstellt am**: 2026-10-21  
> **Letzte Änderung**: 2026-10-21  
> **Betroffene Bereiche**: Gast-Ansicht (`/info`) – `src/pages/guest/InfoPage.tsx` | Admin-Vorschau (`src/components/admin/AdminInfoEditor.tsx`)  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Auf der Info-Seite (`/info`) wurde innerhalb der Informationskarte oberhalb des dynamischen Textes ein auffälliger blauer Header-Banner gerendert (`bg-gradient-to-r from-blue-900 via-blue-800 to-slate-900 px-6 py-8 text-white`). Dieser enthielt:
- Vereinsname („Rüsselsheimer Ruder-Klub 08 e.V.“)
- Feste Überschrift („20. Kurt-Becker-Cup“)
- Fest verdrahteten Einleitungstext
- Vier statische Info-Badges (Datum, Altersklassen, Verpflegung, Schiedsrichter)

Diese Kopfzeile war redundant und nahm viel Platz ein. Nach der Entfernung des blauen Banners beginnt die Inhaltskarte nun direkt mit der H1-Überschrift des Inhalts (z. B. `# Willkommen zum 20. Kurt-Becker-Cup! 🏑`).
Zur visuellen Markenidentität und optischen Aufwertung soll direkt vor diesen Haupttitel das offizielle RRK-Vereinswappen (`rrkLogo`) platziert werden.

### 1.2 Zielzustand & Mehrwert
- Der blaue Header-Banner ist vollständig aus `InfoPage.tsx` entfernt.
- Vor dem Haupttitel (H1) der Info-Seite wird das RRK-Logo (`RRK.webp`) sauber formatiert und responsiv eingebunden.
- In der Admin-Editor-Vorschau (`AdminInfoEditor.tsx`) wird das RRK-Logo vor dem H1-Titel synchron dargestellt.
- Die weiße Informationskarte rendert direkt den Markdown-Inhalt, gefolgt vom bestehenden dezenten Footer-Abschluss (`Bei Fragen wendet euch jederzeit an die Turnierleitung...`).
- Die Seite wirkt aufgeräumt, professionell und präsentiert das RRK-Branding harmonisch direkt am Titel.

---

## 2. User Stories

- **US-1**: Als **Besucher der Info-Seite**, möchte ich direkt die gepflegten Turnierinformationen sehen können, ohne vorher an einem redundanten blauen Header vorbeiscrollen zu müssen, wobei der Titel durch das RRK-Logo optisch klar als Vereinsseite gekennzeichnet ist.

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
- [x] **FR-4: RRK-Logo vor dem Titel (H1)**:
  - Vor der H1-Überschrift wird das RRK-Logo (`@/assets/images/RRK.webp`) mit passender Höhe/Breite (`h-8 w-8 sm:h-9 sm:w-9 shrink-0`) und abgerundeten Ecken integriert.
  - In der Admin-Vorschau (`AdminInfoEditor.tsx`) wird das Logo ebenfalls vor H1 gerendert, damit die Vorschau 1:1 dem Gast-Erlebnis entspricht.

### 3.2 Explizit Out-of-Scope
- Keine Änderungen an der Markdown-Verwaltung (`infoService.ts`, `DEFAULT_INFO_MARKDOWN`).
- Keine Änderungen an anderen Seiten oder Layouts (`GuestLayout.tsx`).

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien
- [x] **AC-1: Header-Entfernung auf `/info`**
  - **Gegeben sei**: Ein Gast ruft die Seite `/info` auf.
  - **Wenn**: Die Seite gerendert wird.
  - **Dann**: Ist kein dunkelblauer Header-Banner mit Farbverlauf mehr sichtbar.
- [x] **AC-2: RRK-Logo vor dem Haupttitel**
  - **Gegeben sei**: Die Info-Seite `/info` wird aufgerufen.
  - **Wenn**: Die H1-Hauptüberschrift betrachtet wird.
  - **Dann**: Befindet sich unmittelbar vor dem Text das RRK-Vereinswappen mit sauberem Abstand (`gap-2.5`) und stimmiger Höhe.
- [x] **AC-3: Footer & Navigation intakt**
  - **Gegeben sei**: Die Seite `/info` ist geöffnet.
  - **Wenn**: Der obere und untere Bereich betrachtet wird.
  - **Dann**: Ist oben die Zurück-Navigation zur Übersicht vorhanden und unten der dezente Hinweisbalken zur Turnierleitung mit Link zum Spielplan sichtbar.
- [x] **AC-4: Build & Linting**
  - **Gegeben sei**: Der Code wurde angepasst.
  - **Wenn**: `npm run build` und `npm run lint` ausgeführt werden.
  - **Dann**: Gibt es keine TypeScript-, Syntax- oder Lint-Fehler.

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Betroffene Ansichten & Komponenten
- `src/pages/guest/InfoPage.tsx`
- `src/components/admin/AdminInfoEditor.tsx`

---

## 6. Technische Auswirkungen & Architekturbezug

- **Datenbank/Firestore**: Keine Änderungen.
- **TypeScript-Typen**: Keine Änderungen.
- **Abhängigkeiten**: Keine neuen Pakete erforderlich.
