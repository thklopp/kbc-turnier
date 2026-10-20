# SPEC-051: Live-Desk Layout-Optimierungen (Weißer Hintergrund, Score-Ausrichtung, Ecken-Jingle-Platzhalter & Torschützen-Integration)

> **Status**: Abgeschlossen  
> **Typ**: Optimierung / UI-Redesign  
> **Branch**: feat/SPEC-051-live-desk-layout-optimierungen  
> **Autor**: Antigravity  
> **Erstellt am**: 2026-10-20  
> **Letzte Änderung**: 2026-10-20  
> **Betroffene Bereiche**: Turnierleitung (/admin -> Live-Desk)  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Im Live-Desk der Turnierleitung (`/admin`) wirkt der zentrale Spielbereich aktuell in mehreren Aspekten noch nicht optimal ausbalanciert:
1. **Hintergrundfarbe der Teamboxen**: Die Mannschaften (Heim und Gast) besitzen derzeit einen leichten grauen Hintergrund (`bg-slate-50/60`), der vom Hauptkarten-Design abweicht und visuell unruhig wirkt.
2. **Vertikale Ausrichtung des Live-Ergebnisses**: Die Ergebnisanzeige (Scoreboard) sitzt zwischen den Mannschaften durch größere vertikale Abstände (`mb-6 sm:mb-8` unter den Metadaten-Tags) tiefer als die Teamlogos. Dadurch wirkt das Zentrum abgesackt und nicht auf einer klaren Sichtachse mit den Vereinswappen.
3. **Fehlender Aktionsbutton für Ecken**: Im Hallenhockey sind Strafecken ein wichtiges Spielereignis, für das künftig ein Ecken-Jingle abgespielt werden soll. Aktuell existiert im Bedienbereich hierfür noch kein Element.
4. **Getrennte Torschützen-Verwaltung**: Die Torschützen-Zuordnung befindet sich derzeit in einer separaten Box unterhalb des Scoreboards als chronologische Gesamttabelle. Dies zwingt die Turnierleitung zum Scrollen und trennt die Schützen visuell von der Mannschaft, die das Tor erzielt hat.

### 1.2 Zielzustand & Mehrwert
- Der Spielbereich der Mannschaften erhält einen sauberen, rahmenlosen weißen Hintergrund (ohne störende Umrandungsboxen), wodurch das Gesamtbild flüssiger und offener wirkt. Die dezente Trennlinie zwischen dem Mannschafts-Aktionsbereich und der Torschützenliste bleibt erhalten.
- Die Ergebnisanzeige (Scoreboard) rückt an die oberste Position des Mittelbereichs auf direkte horizontale Höhe der Teamlogos.
- Der Text „Live-Ergebnis“ wird entfernt, um vertikalen Raum freizugeben und visuelles Rauschen zu reduzieren.
- Die Meta-Tags (Uhrzeit, Geschlecht, Gruppe/Phase) wandern direkt unter die Ergebnisanzeige.
- Unterhalb der Meta-Tags wird zentral zwischen den beiden Tor-Buttons („Tor Heim (+1)“ und „Tor Gast (+1)“) der Platzhalter-Button für den „Ecken-Jingle“ platziert.
- Die Erfassung und Anzeige der Torschützen wandert direkt in den Spielbereich unter die jeweilige Mannschaft (Heim-Torschützen unter Team Heim, Gast-Torschützen unter Team Gast). Die Trennlinie und die Kopfzeile „🥅 Torschützen (0)“ sind permanent sichtbar, um von Beginn an ein symmetrisches Layout zu bieten. Der separate Torschützen-Block darunter entfällt, wodurch der Live-Desk deutlich kompakter, aufgeräumter und ohne vertikales Scrollen bedienbar wird.
- Das bisherige Soundboard-Panel (`SoundboardPanel`) wird vollständig aus dem Live-Desk entfernt, da es nicht mehr benötigt wird.

---

## 2. User Stories

- **US-1**: Als **Turnierleiter am Live-Desk** möchte ich **eine bündige, auf einer horizontalen Achse ausgerichtete Ansicht von Teamlogos und Spielstand sehen**, um **den Spielstand sofort intuitiv und ermüdungsfrei erfassen zu können**.
- **US-2**: Als **Turnierleiter** möchte ich **einen sauberen weißen Hintergrund im Spielbereich der Mannschaften haben**, um **ein klares, modernes und kontrastreiches Interface zu bedienen**.
- **US-3**: Als **Turnierleiter** möchte ich **zentral zwischen den Tor-Buttons einen Button für Ecken-Jingles vorfinden**, um **auf künftige Soundeffekte bei kurzen Ecken vorbereitet zu sein**.
- **US-4**: Als **Turnierleiter** möchte ich **die Torschützen direkt unter der jeweiligen Mannschaft auswählen und sehen**, um **Tore sofort der richtigen Mannschaft zuzuordnen, ohne nach unten scrollen zu müssen**.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)
- [ ] **Rahmenlose Mannschaftsbereiche**: Entfernung von Rahmen (`border border-slate-200`) und Schatten um die Teambereiche; Beibehaltung der Trennlinie (`border-t`) zwischen Mannschaftsbereich und Torschützenliste.
- [ ] **Ergebnisanzeige auf Logo-Höhe**:
  - Horizontale Ausrichtung der großen Spielstandsziffern (`0 : 0`) an oberster Stelle des Mittelbereichs auf exakter Höhe der Teamlogos.
  - Verschiebung der Meta-Tags (Uhrzeit, Geschlecht, Gruppe/Phase) unter die Ergebnisanzeige.
  - Entfernung der Beschriftung „Live-Ergebnis“.
- [ ] **Ecken-Jingle Button (Platzhalter) auf Höhe der Tor-Buttons**:
  - Platzierung unterhalb der Meta-Tags exakt auf gleicher vertikaler Höhe wie die beiden Tor-Buttons („Tor Heim (+1)“ und „Tor Gast (+1)“) über einheitlich dimensionierte Top-Bereiche (`sm:h-[148px]`).
  - Beschriftung „Ecken-Jingle“ mit Music-Icon.
  - Vorerst als Platzhalter ohne Audioauslösung (styling-konform vorbereitet).
- [ ] **Torschützen direkt unter den jeweiligen Mannschaften**:
  - Aufteilung der gefallenen Tore (`goalEvents`) nach `teamHomeId` und `teamAwayId`.
  - Permanente Anzeige der Trennlinie und Überschrift „Torschützen (0)“ bei beiden Mannschaften.
  - Direkte Anzeige der Torschützenliste mit Minute und Spieler-Dropdown unterhalb der jeweiligen Mannschaftsbox bei gefallenen Toren.
  - Entfernung des separaten unteren Chronik-Blocks `Tore-Chronik & Schützen` in `LiveMatchDesk.tsx`.
- [ ] **Entfernung des Soundboards**:
  - Vollständiges Entfernen der Komponente `SoundboardPanel` aus `LiveMatchDesk.tsx`.

### 3.2 Explizit Out-of-Scope
- Konfiguration oder Upload von spezifischen Ecken-Audiodateien (wird in einer späteren Spec spezifiziert).
- Änderungen an den Datenmodellen oder Firestore-Datenstrukturen (bestehende Event-Struktur `MatchEvent` mit `type: 'goal'` bleibt 1:1 erhalten).

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien
- [ ] **AC-1: Weißer Hintergrund im Teambereich**
  - **Gegeben sei**: Die Turnierleitung öffnet den Live-Desk (`/admin`).
  - **Wenn**: Der zentrale Spielbereich geladen ist.
  - **Dann**: Haben die Boxen der Heim- und Gastmannschaft einen rein weißen Hintergrund (`bg-white`) statt des bisherigen Grautons.

- [ ] **AC-2: Horizontale Ausrichtung von Logos und Spielstand**
  - **Gegeben sei**: Ein Spiel wird im Live-Desk angezeigt.
  - **Wenn**: Die Kopfzeile des Spielbereichs betrachtet wird.
  - **Dann**: Befindet sich die Ergebnisanzeige (`scoreHome : scoreAway`) auf exakt gleicher vertikaler Höhe wie die Vereinslogos links und rechts.
  - **Und**: Die Meta-Tags (Uhrzeit, Altersklasse, Gruppe/Phase) sitzen kompakt darüber mit minimiertem Abstand.

- [ ] **AC-3: Ecken-Jingle Button als Platzhalter**
  - **Gegeben sei**: Der Aktionsbereich für Spielaktionen unterhalb von Logos und Spielstand wird angezeigt.
  - **Wenn**: Die Buttons betrachtet werden.
  - **Dann**: Befindet sich links der Torbutton Heim, rechts der Torbutton Gast und exakt mittig unter der Ergebnisanzeige der Button „Ecken-Jingle“.
  - **Und**: Ein Klick löst keinen Fehler aus und stört das laufende Spiel nicht (Platzhalter-Status).

- [ ] **AC-4: Torschützen-Integration unter den Teams**
  - **Gegeben sei**: Im laufenden oder beendeten Spiel wurden Tore für Team Heim und/oder Team Gast erzielt.
  - **Wenn**: Der Spielbereich betrachtet wird.
  - **Dann**: Werden die Tore von Team Heim direkt unterhalb des Heim-Bereichs dargestellt und die Tore von Team Gast direkt unterhalb des Gast-Bereichs.
  - **Und**: Die Turnierleitung kann den Schützen pro Tor direkt in der jeweiligen Mannschaftsliste über das Dropdown zuweisen.
  - **Und**: Die separate untere Sammelbox „Tore-Chronik & Schützen“ entfällt.

### 4.2 Allgemeine Qualitätskriterien
- [ ] Keine `any`-Typen in TypeScript.
- [ ] Vollständige Einhaltung aller Vorgaben aus `AGENTS.md`.
- [ ] Fehlerfreier Build (`npm run build`) und sauberes Linting.

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Komponenten-Struktur im Spielbereich
```text
+-----------------------------------------------------------------------------------+
| Header: Aktuelles Spiel | Zeitsteuerung (Start/Pause/Reset) | Spiel beenden & weiter|
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  [Team Heim Logo]                     [  0  :  0  ]                 [Team Gast Logo]|
|  Teamname Heim                 [Uhrzeit] [Geschlecht] [Gruppe]       Teamname Gast|
|  Kürzel                                                                     Kürzel|
|                                                                                   |
|  [ + Tor Heim (+1) ]                [ Ecken-Jingle ]             [ + Tor Gast (+1) ]|
|  [ - Tor abziehen  ]                                             [ - Tor abziehen  ]|
|                                                                                   |
|  --- Torschützen Heim ---                               --- Torschützen Gast ---  |
|  12' #7 M. Muster                                       18' #10 L. Schmidt        |
|  [Schütze wählen... v]                                  [Schütze wählen... v]     |
|                                                                                   |
+-----------------------------------------------------------------------------------+
```

### 5.2 Responsive Verhalten
- **Desktop & Tablet (primär)**: 3-spaltige Anordnung (Heim | Center/Score/Ecke | Gast). Die Buttons und Torschützen ordnen sich symmetrisch an.
- **Mobile / schmale Screens**: Bei kleineren Bildschirmen flüssiger Umbruch, sodass Aktionen klar bedienbar bleiben.

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Datenmodell (`DATABASE.md`)
- Keine Änderungen erforderlich. Alle Daten (`Match`, `MatchEvent`, `Team`, `Player`) existieren bereits in `src/types/database.ts`.

### 6.2 Komponenten & Props
- **`ScoreboardDisplay.tsx`**:
  - Erhält Props für `events: MatchEvent[]`, `onUpdateGoalScorer` (oder entsprechende Delegates).
  - Teamboxen erhalten `bg-white`.
  - Tags erhalten reduzierten Margin Bottom (z. B. `mb-2`).
  - Scoreboard wird bündig zu den Logos platziert.
  - Zwischen den Tor-Aktionen wird der Button für Ecken-Jingle integriert.
  - Unter den jeweiligen Team-Aktionen werden die Torschützenlisten für Heim bzw. Gast gerendert.
- **`LiveMatchDesk.tsx`**:
  - Übergabe von `events` und `updateGoalScorer` an `ScoreboardDisplay`.
  - Entfernung des redundanten unteren Containers `goalEvents.length > 0 && (...)`.

---

## 7. Edge Cases & Fehlerbehandlung

- **Keine Tore erzielt**: Es werden keine leeren Schützenboxen aufgedrängt; eine dezente leere Ansicht oder Nichterscheinen hält das Layout aufgeräumt.
- **Mehrere Tore pro Team**: Die Torschützenliste unter der jeweiligen Mannschaft wächst kompakt an (z. B. mit Scrollbereich oder kompakter Stapelung), ohne das Layout zu sprengen.
- **Kein Kader hinterlegt**: Dropdown zeigt weiterhin „(Kein Kader hinterlegt)“ bzw. „Schütze unbekannt“ wie bisher.
- **Klick auf Ecken-Jingle**: Führt keine unerwünschten Seiteneffekte aus.

---

## 8. Verifikations- & Testplan

### 8.1 Manuelle Tests
1. [ ] Live-Desk in `/admin` aufrufen.
2. [ ] Prüfen: Teambereiche besitzen sauberen weißen Hintergrund.
3. [ ] Prüfen: Das Live-Ergebnis steht horizontal auf gleicher Höhe wie die Logos der Teams.
4. [ ] Prüfen: Mittig zwischen Tor-Heim und Tor-Gast befindet sich der Ecken-Jingle-Button.
5. [ ] Tore für Heim und Gast erfassen:
   - Prüfen: Torschützenliste erscheint direkt unter Team Heim für Heim-Tore.
   - Prüfen: Torschützenliste erscheint direkt unter Team Gast für Gast-Tore.
   - Prüfen: Schützenauswahl im Dropdown speichert den Schützen zuverlässig ab.
6. [ ] Prüfen: Der separate Bereich „Tore-Chronik & Schützen“ am unteren Ende ist entfernt.

### 8.2 Automatisierte Validierung
- [ ] `npm run build` kompiliert fehlerfrei ohne Typfehler.
- [ ] `npm run lint` verläuft ohne Warnungen oder Fehler.

---

## 9. Offene Fragen & Klärungsbedarf
- Keine offenen Fragen. Alle Anforderungen sind eindeutig.
