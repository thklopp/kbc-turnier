# SPEC-069: Entfernung des Buttons „Vorlage laden“ aus dem Markdown-Bereich

> **Status**: Abgeschlossen  
> **Typ**: Optimierung  
> **Branch**: `fix/SPEC-069-entfernung-button-vorlage-laden`  
> **Autor**: Antigravity Agent  
> **Erstellt am**: 2026-10-26  
> **Letzte Änderung**: 2026-10-26  
> **Betroffene Bereiche**: Turnierleitung (`/admin`) – Komponente `AdminInfoEditor.tsx`

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Im Admin-Bereich der Turnierleitung (`/admin`) unter dem Reiter **„Markdown“** befindet sich im oberen Aktionsbereich der Button **„Vorlage laden“** (mit `RotateCcw`-Icon). Bei Klick öffnet sich ein Bestätigungsdialog, der bei Bestätigung den gesamten Editorinhalt mit dem statischen Standardtext (`DEFAULT_INFO_MARKDOWN` bzw. `DEFAULT_ESSEN_MARKDOWN`) überschreibt.

Im laufenden Turnierbetrieb birgt dieser Button das Risiko, dass gepflegte Inhalte (individuelle Turnier-Hinweise oder der ausgearbeitete Essensplan) versehentlich überschrieben werden. Da die Vorlagen primär zur Erstinitialisierung dienen und bereits in `infoService.ts` automatisch als Fallback greifen, wenn ein Dokument noch nicht existiert, wird der Button im Admin-Interface nicht mehr benötigt.

### 1.2 Zielzustand & Mehrwert
- Der Button **„Vorlage laden“** wird vollständig aus der Aktionsleiste von `AdminInfoEditor.tsx` entfernt.
- Die zugehörige Handler-Funktion `handleResetToDefault` und nicht mehr benötigte Imports (`RotateCcw`, `DEFAULT_INFO_MARKDOWN`, `DEFAULT_ESSEN_MARKDOWN`) werden aus der Komponente bereinigt.
- Die Header-Aktionsleiste im Markdown-Editor enthält nur noch die Buttons **„Live-Seite prüfen“** und **„Änderungen speichern“** (bzw. „Gespeichert“).
- Ein versehentliches Zurücksetzen/Überschreiben produktiver Markdown-Texte im Admin-Bereich wird damit ausgeschlossen.

---

## 2. User Stories

- **US-1 (Turnierleitung)**: Als Turnierleiter möchte ich im Reiter „Markdown“ eine aufgeräumte Aktionsleiste ohne riskanten „Vorlage laden“-Button vorfinden, um Fehleingaben und versehentlichen Datenverlust bei gepflegten Inhalten zu vermeiden.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)
- [x] **Entfernung des UI-Buttons**:
  - Button `<button type="button" onClick={handleResetToDefault}>...<span>Vorlage laden</span></button>` aus `AdminInfoEditor.tsx` entfernen.
- [x] **Code-Cleanup**:
  - Unbenutzte Funktion `handleResetToDefault` in `AdminInfoEditor.tsx` entfernen.
  - Unbenutzte Imports (`RotateCcw`, `DEFAULT_INFO_MARKDOWN`, `DEFAULT_ESSEN_MARKDOWN`) aus `AdminInfoEditor.tsx` entfernen.
- [x] **Unveränderte Fallback-Logik im Service**:
  - Die Initialisierung in `src/services/infoService.ts` (`DEFAULT_INFO_MARKDOWN` und `DEFAULT_ESSEN_MARKDOWN`) bleibt intakt, falls Dokumente in Firestore noch gar nicht existieren.

### 3.2 Explizit Out-of-Scope
- Keine Änderungen an der Markdown-Vorschau, an den Tabellen-Tools oder an der Variablen-Ersetzung.
- Keine Änderungen an der Gastansicht `/info` oder am Team-Bereich.

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien
- [x] **AC-1: Button nicht mehr vorhanden**
  - **Gegeben sei**: Die Turnierleitung ist auf `/admin` im Reiter „Markdown“.
  - **Wenn**: Die Aktionsleiste oberhalb des Editors betrachtet wird.
  - **Dann**: Gibt es dort nur die Buttons „Live-Seite prüfen“ und „Änderungen speichern“ / „Gespeichert“. Der Button „Vorlage laden“ existiert nicht mehr.

- [x] **AC-2: Speichern & Live-Vorschau unbeeinträchtigt**
  - **Gegeben sei**: Ein Markdown-Text („Allgemeines“ oder „Essensplan“) wird bearbeitet.
  - **Wenn**: Der Text geändert und gespeichert wird.
  - **Dann**: Funktionieren Bearbeitung, Variablenauflösung, Vorschau und das Speichern in Firestore weiterhin fehlerfrei.

### 4.2 Allgemeine Qualitätskriterien
- [x] Vollständige TypeScript-Typisierung ohne `any`.
- [x] Fehlerfreier Build (`npm run build`) und fehlerfreies Linting (`npm run lint`).
- [x] Keine toten Imports oder unbenutzten Variablen.

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Betroffene Ansichten & Komponenten
- **Komponente**: `src/components/admin/AdminInfoEditor.tsx`
- **Route**: `/admin` (Tab `markdown`)
- **Header-Aktionen vorher**: `[ Live-Seite prüfen ] [ Vorlage laden ] [ Änderungen speichern ]`
- **Header-Aktionen nachher**: `[ Live-Seite prüfen ] [ Änderungen speichern ]`

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Datenmodell (`DATABASE.md`)
- Keine Änderungen am Firestore-Datenmodell.

### 6.2 TypeScript Interfaces (`src/types/`)
- Keine Änderungen an den Interfaces.

### 6.3 Betroffene Dateien
- `src/components/admin/AdminInfoEditor.tsx`: Entfernung des Buttons, der Handler-Funktion und der ungenutzten Imports.
- `spec/SPEC-069-entfernung-button-vorlage-laden.md`: Diese Spezifikation.
