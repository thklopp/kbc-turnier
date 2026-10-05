# SPEC-[NUMMER]: [Titel des Features oder Fixes]

> **Status**: [Entwurf | In Review | Approved | In Umsetzung | In Abnahme | Abgeschlossen | Verworfen]  
> **Typ**: [Feature | Bugfix | Refactoring | Optimierung]  
> **Branch**: [z. B. feat/SPEC-XXX-kurztitel oder fix/SPEC-XXX-kurztitel]  
> **Autor**: [Name / Agent]  
> **Erstellt am**: [YYYY-MM-DD]  
> **Letzte Änderung**: [YYYY-MM-DD]  
> **Betroffene Bereiche**: [Gast-Ansicht (/) | Turnierleitung (/admin) | Kiosk (/kiosk) | Datenbank/Firestore | Audio/Storage]  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
*Beschreibe das aktuelle Problem, den Engpass oder den Hintergrund, warum diese Spezifikation notwendig ist.*

### 1.2 Zielzustand & Mehrwert
*Was soll nach erfolgreicher Umsetzung möglich sein? Welcher konkrete Nutzen entsteht für Turnierleitung, Teams oder Zuschauer?*

---

## 2. User Stories

*Formuliere Anforderungen aus Sicht der verschiedenen Nutzergruppen im klassischen Format:*  
*„Als [Rolle] möchte ich [Funktion/Aktion], um [Nutzen/Ziel].“*

- **US-1**: Als **[Turnierleiter / Gast / Kiosk-Zuschauer]** möchte ich **[...]**, um **[...]**.
- **US-2**: Als **[...]** möchte ich **[...]**, um **[...]**.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have / Should-Have)
- [ ] **Anforderung 1**: Beschreibung der Funktionalität.
- [ ] **Anforderung 2**: Beschreibung der Funktionalität.

### 3.2 Explizit Out-of-Scope (Nicht Teil dieser Spec)
- Was wird bewusst **nicht** in diesem Ticket/dieser Phase implementiert?

---

## 4. Akzeptanzkriterien

*Die Akzeptanzkriterien definieren eindeutig und prüfbar, wann das Feature oder der Fix als erfolgreich abgenommen gilt.*

### 4.1 Szenarien / Kriterien
- [ ] **AC-1: [Titel des Kriteriums]**
  - **Gegeben sei (Given)**: [Ausgangssituation, z. B. Spiel läuft und Team A erzielt ein Tor]
  - **Wenn (When)**: [Aktion des Nutzers, z. B. Turnierleiter klickt auf "+1 Tor"]
  - **Dann (Then)**: [Erwartetes Verhalten, z. B. Spielstand erhöht sich sofort und Torjingle-Button ist aktiv]

- [ ] **AC-2: [Titel des Kriteriums]**
  - **Gegeben sei**: [...]
  - **Wenn**: [...]
  - **Dann**: [...]

### 4.2 Allgemeine Qualitätskriterien
- [ ] Keine fest kodierten Parameter (Verbot von Hardcoding gemäß `AGENTS.md`).
- [ ] Vollständige TypeScript-Typisierung ohne `any`.
- [ ] Fehlerfreie Ausführung von `npm run build` und Linting.
- [ ] Sauberes Aufräumen aller Firestore-Listener (`unsubscribe`).

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Betroffene Ansichten & Komponenten
- **Pfad / URL**: `[z. B. /admin, / oder /kiosk]`
- **shadcn/ui Primitives**: `[z. B. Button, Dialog, Sheet, Table, Badge, Form]`
- **Responsives Verhalten**:
  - *Mobile (Gast)*: [...]
  - *Tablet / Desktop (Admin)*: [...]
  - *TV / Großbild (Kiosk)*: [...]

### 5.2 Interaktionsablauf
1. Schritt 1: ...
2. Schritt 2: ...
3. Schritt 3: ...

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Datenmodell (`DATABASE.md`)
*Muss das Firestore-Schema erweitert oder angepasst werden?*
- **Collection / Dokument**: `[z. B. matches/{matchId}]`
- **Neue / geänderte Felder**:
  ```typescript
  // Beispielhafte Felderweiterung
  interface ExamplePatch {
    newField: string;
  }
  ```
- **Hinweis**: Falls Schemata geändert werden, muss `DATABASE.md` vorab synchronisiert werden!

### 6.2 TypeScript Interfaces (`src/types/`)
- Welche Interfaces in `src/types/` müssen angelegt oder erweitert werden?

### 6.3 State & Firestore Listener
- Werden neue `onSnapshot`-Subscriptions benötigt?
- Wie wird das Caching / Unsubscribing gehandhabt?

### 6.4 Audio & Storage (falls relevant)
- Werden neue Assets, Jingles oder Mediadateien verarbeitet?
- Wie wird mit Autoplay-Restriktionen umgegangen?

---

## 7. Edge Cases & Fehlerbehandlung

- **Offline / Verbindungsabbruch**: Was passiert bei Instabilität der Verbindung?
- **Parallele Bearbeitung**: Was passiert, wenn zwei Admins gleichzeitig Eingaben tätigen?
- **Ungültige Eingaben**: Wie reagiert das System auf Falscheingaben (z. B. negative Tore, ungültige Dateiformate)?

---

## 8. Verifikations- & Testplan

### 8.1 Manuelle Tests
1. [ ] Testschritt 1: ...
2. [ ] Testschritt 2: ...

### 8.2 Automatisierte Tests / Validierung
- [ ] `npm run lint` bzw. `npm run build` läuft ohne Warnungen/Fehler durch.
- [ ] Relevante Unit-/Integrationstests (`npm test` falls vorhanden) erfolgreich.

---

## 9. Offene Fragen & Klärungsbedarf
- [ ] Frage 1: ...
- [ ] Frage 2: ...
