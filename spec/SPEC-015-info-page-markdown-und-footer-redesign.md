# SPEC-015: Info-Seite mit Markdown-Editor, Footer-Redesign und Impressum-Link

> **Status**: Abgeschlossen  
> **Typ**: Feature  
> **Branch**: `feat/SPEC-015-info-page-markdown-und-footer-redesign`  
> **Autor**: Agent / Antigravity  
> **Erstellt am**: 2026-10-07  
> **Letzte Änderung**: 2026-10-07  
> **Betroffene Bereiche**: Gast-Ansicht (`/`, `/info`, `/impressum`) | Turnierleitung (`/admin#info`) | Layouts (`GuestLayout`, `AdminLayout`) | Datenbank/Firestore (`config/info`)  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
In der aktuellen Gast-Ansicht befinden sich die Links/Buttons für den Kiosk-Modus (Hallen-Display) und den Admin-Zugang oben rechts im Header (`GuestLayout`). Für normale Besucher, Eltern und Fans auf Mobilgeräten sind diese administrativen Verknüpfungen im Header zu prominent platziert und nehmen wertvollen Platz ein. Gleichzeitig fehlen allgemeine Turnierinformationen (z. B. Spielregeln, Penalty-Regelung, Schiedsrichter-Ansetzungen, Verpflegung/Mittagessen und Historie) sowie ein rechtlich erforderlicher Impressum-Link.

### 1.2 Zielzustand & Mehrwert
1. **Header-Verschlankung & Info-Zugang**:
   - Die Buttons für Kiosk (`/kiosk`) und Admin (`/admin`) wandern aus dem oberen Header nach unten in den Footer auf die rechte Seite.
   - Oben rechts im Header wird ein prominenter Info-Button platziert, der zur Info-Seite (`/info`) führt.
2. **Dynamische Info-Seite aus Markdown**:
   - Die Seite `/info` rendert den Turnier-Leitfaden vollständig und barrierefrei aus Markdown.
   - Der Inhalt ist mobil-optimiert und übersichtlich gegliedert (Begrüßung, Zeiten, Spielablauf, Penalty-Regeln, Schiedsrichter, Catering/Mittagessen und KBC-Historie).
3. **Markdown-Editor in der Turnierleitung**:
   - Im Admin-Bereich (`/admin`) entsteht ein neuer Tab **„Info“** (`/admin#info`).
   - Die Turnierleitung kann dort den Markdown-Text live bearbeiten, formatieren, in einer Vorschau prüfen und in Firestore speichern.
4. **Footer & Impressum**:
   - Auf der linken Seite des Footers befindet sich der Link zum Impressum (`/impressum`).
   - Mittig bleibt der dezente Gruß („Made with ❤️ in Rüsselsheim“) erhalten.
   - Rechts im Footer sitzen die Kiosk- und Admin-Buttons.
   - Für das Impressum wird eine saubere Platzhalter-Seite aufgesetzt, deren finale Inhalte später ergänzt werden können.

---

## 2. User Stories

- **US-1**: Als **Gast/Zuschauer auf dem Smartphone** möchte ich oben im Header direkt einen Info-Button vorfinden, um schnell alle wichtigen Rahmendaten (Zeiten, Ablauf, Schiedsrichter, Mittagessen, Kiosk) nachlesen zu können.
- **US-2**: Als **Turnierleiter** möchte ich im Admin-Bereich in einem eigenen Reiter „Info“ die Turnierinformationen in einem Markdown-Editor pflegen und mit Live-Vorschau speichern können, ohne Code ändern oder neu deployen zu müssen.
- **US-3**: Als **Zuschauer oder Hallen-Beauftragter** möchte ich weiterhin auf Kiosk- und Admin-Modus zugreifen können, ohne dass sie im Header den Blick auf die Turnierergebnisse dominieren.
- **US-4**: Als **Webseiten-Besucher** möchte ich im Footer einen Link zum Impressum finden, um die Verantwortlichen und Kontaktdaten des Turniers einsehen zu können.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)

#### A. Header- & Footer-Anpassung in `GuestLayout`
- [x] **Header oben rechts**:
  - Entfernung der Buttons für Kiosk (`/kiosk`) und Admin (`/admin`) aus dem Header.
  - Hinzufügen eines Info-Buttons (`<Link to="/info">` mit Info-Icon aus `lucide-react`, Tooltip/Aria-Label „Turnierinformationen“).
  - Befindet sich der Nutzer bereits auf `/info`, wird der Button optisch aktiv hervorgehoben oder bietet eine klare Navigation zurück zur Hauptansicht.
- [x] **Footer-Redesign**:
  - Links: Link „Impressum“ (`<Link to="/impressum">`).
  - Mitte: „Made with ❤️ in Rüsselsheim“ (auf mobilen Geräten zentriert oder flexibel gestapelt).
  - Rechts: Buttons für Kiosk (`/kiosk`) und Admin-Login (`/admin`) als dezente Icons/Buttons.

#### B. Info-Seite (`/info`)
- [x] Eigenständige Gast-Unterseite im `GuestLayout`, nahtlos in das KBC-Design integriert.
- [x] Kopfbereich mit Zurück-Button zur Turnierübersicht (`/`) und Titel „Turnierinformationen“.
- [x] Vollständiges Rendering des Markdown-Inhalts mit Formatierungen (Überschriften h1-h3, Absätze, Bullet-Lists, Fettung, Hinweiskästen).
- [x] Responsives Styling mittels Tailwind Typography (`prose prose-slate max-w-none`) oder Tailwind-Klassen.
- [x] Initiale Standard-Inhalte (Fallback), falls in Firestore noch kein Datensatz existiert:
  1. **Begrüßung**: Willkommen aller Mannschaften, Betreuer und Fans zum 20. Kurt-Becker-Cup des Rüsselsheimer RK.
  2. **Zeitraum & Startzeiten**:
     - Samstag, 31.10.2026 ab 10:00 Uhr
     - Sonntag, 01.11.2026 ab 09:00 Uhr
  3. **Spielablauf & Turniermodus**:
     - Altersklassen: mU14 und wU14
     - Gruppenphase am Samstag (Gruppen A und B je Altersklasse)
     - Finalphase am Sonntag (Halbfinals, Platzierungsspiele, Finale)
     - Spielzeit: 20 Minuten je Spiel, 5 Minuten Pause zwischen den Spielen
  4. **Besondere Spielregeln & Schiedsrichter**:
     - **Penalty-Schießen**: Bei Gleichstand in den Spielen der Finalphase erfolgt sofort ein Penalty-Schießen mit je 3 Schützen pro Team.
     - **Schiedsrichter**: Die Schiedsrichter werden gemäß Spielplan von den teilnehmenden Mannschaften gestellt.
  5. **Abseits des Spielfelds (Catering & Verpflegung)**:
     - **Mittagessen für Mannschaften**: Samstag von 11:00 Uhr bis 13:00 Uhr.
     - **Kiosk-Verkauf**: Durchgehender Verkauf von warmen und kalten Speisen, Kuchen, Kaffee und Erfrischungsgetränken.
  6. **Historie des Kurt-Becker-Cups**:
     - Platzhalter-Abschnitt zur Tradition und Historie des traditionsreichen Jugendturniers des RRK.

#### C. Admin Markdown-Editor (`/admin#info`)
- [x] Neuer Navigationstab „Info-Seite“ in `AdminLayout` (Icon z. B. `FileText` oder `Info`).
- [x] Anzeige des Editors im `AdminPage`-Routing bei Hash `#info`.
- [x] Editor-Features:
  - Textarea / Markdown-Eingabe mit Monospace-Schriftart und komfortabler Zeilenhöhe.
  - Schnelle Formatierungs-Hilfen / Toolbar (Überschrift, Fett, Kursiv, Liste, Tabelle, Zitat).
  - Umschaltbare Vorschau (Preview) oder Side-by-Side-Ansicht auf Desktop / Split-Screen.
  - Button „Speichern & Veröffentlichen“ mit Ladezustand und Erfolgs-Toast/Feedback.
  - Button „Auf Standard zurücksetzen“ (mit Sicherheitsabfrage).
- [x] Echtzeit-Synchronisation bzw. sofortige Verfügbarkeit nach dem Speichern für alle Gäste.

#### D. Impressum-Seite (`/impressum`)
- [x] Routing `/impressum` im `GuestLayout`.
- [x] Klare Platzhalter-Struktur für Anbieterkennzeichnung gemäß § 5 TMG (Rüsselsheimer Ruder-Klub 08 e.V., Anschrift, Vertretungsberechtigte, Kontakt-E-Mail, Haftungshinweis).
- [x] Zurück-Button zur Turnierübersicht (`/`).

---

### 3.2 Explizit Out-of-Scope
- WYSIWYG-Rich-Text-Editor mit externen Cloud-Abhängigkeiten (wir nutzen reines, leichtgewichtiges Markdown).
- Bild-Upload direkt im Markdown-Editor (Bilder können per Markdown-URL eingebunden werden; Datei-Uploads für Bilder sind nicht Teil dieser Spec).
- Detaillierter juristischer Text des Impressums (wird laut Vorgabe später mit dem Nutzer finalisiert).

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien

- [x] **AC-1: Header- und Footer-Navigation in der Gast-Ansicht**
  - **Gegeben sei**: Ein Besucher ruft die Hauptseite `/` auf.
  - **Wenn**: Der Header betrachtet wird.
  - **Dann**: Sind die Kiosk- und Admin-Buttons NICHT mehr im oberen Header sichtbar; stattdessen befindet sich oben rechts ein Info-Button (`/info`).
  - **Wenn**: Der Footer betrachtet wird.
  - **Dann**: Befindet sich auf der linken Seite ein klickbarer Link „Impressum“ (`/impressum`) und auf der rechten Seite die beiden Buttons für Kiosk (`/kiosk`) und Admin (`/admin`).

- [x] **AC-2: Aufruf der Info-Seite (`/info`)**
  - **Gegeben sei**: Ein Gast klickt auf den Info-Button im Header.
  - **Wenn**: Die Route `/info` geladen wird.
  - **Dann**: Wird der strukturierte Text der Turnierinformationen vollständig als formatierter Markdown-Inhalt angezeigt.
  - **Dann**: Sind alle Pflichtbereiche enthalten: Begrüßung, Zeitraum (31.10.26 ab 10:00 Uhr, 01.11.26 ab 9:00 Uhr), Jugend/Gruppen/Spielzeiten/Pausen, Finalphase mit Penalty (3 Schützen), Schiedsrichterstellung durch Teams, Mannschafts-Mittagessen Samstag (11:00 - 13:00 Uhr), Kiosk-Verkauf und KBC-Historie.
  - **Dann**: Existiert ein Zurück-Link zur Startseite.

- [x] **AC-3: Info-Tab & Markdown-Editor im Admin-Bereich**
  - **Gegeben sei**: Ein angemeldeter Turnierleiter öffnet `/admin`.
  - **Wenn**: Er auf den Tab „Info“ klickt (Hash: `#info`).
  - **Dann**: Wird der Markdown-Editor mit dem aktuell hinterlegten Text aus Firestore geladen.
  - **Wenn**: Der Turnierleiter Änderungen am Text vornimmt und auf „Speichern“ klickt.
  - **Dann**: Wird der geänderte Inhalt in Firestore (`config/info`) gespeichert, eine Erfolgsmeldung erscheint und die Seite `/info` zeigt unmittelbar den neuen Text an.

- [x] **AC-4: Vorschau-Modus im Editor**
  - **Gegeben sei**: Die Turnierleitung editiert den Text im Admin-Tab „Info“.
  - **Wenn**: Die Vorschau aktiviert wird (oder in der Side-by-Side-Ansicht).
  - **Dann**: Sieht der Admin exakt die gerenderte Markdown-Darstellung, wie sie auch Gäste auf `/info` sehen.

- [x] **AC-5: Aufruf des Impressums (`/impressum`)**
  - **Gegeben sei**: Ein Nutzer klickt im Footer auf „Impressum“.
  - **Wenn**: Die Seite `/impressum` aufgerufen wird.
  - **Dann**: Wird die strukturierte Impressums-Seite mit Vorlage für Verein, Anschrift, Kontakt und Haftungsausschluss angezeigt.

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Komponenten & Routen

| Pfad | Komponente / Datei | Beschreibung |
| :--- | :--- | :--- |
| `/` | `GuestLayout.tsx` | Neuer Info-Button im Header, verschobene Admin/Kiosk-Buttons im Footer, Impressum-Link links |
| `/info` | `InfoPage.tsx` | Gast-Ansicht der Markdown-Turnierinformationen mit Leseführung und Zurück-Button |
| `/impressum` | `ImpressumPage.tsx` | Impressums-Platzhalter im KBC-Design |
| `/admin#info` | `AdminInfoEditor.tsx` | Admin-Editor für Markdown mit Syntax-Toolbar, Vorschau und Speichern-Logik |
| Layout | `AdminLayout.tsx` | Ergänzung des 4. Tabs „Info“ (`FileText`-Icon) |

### 5.2 Header- & Footer-Layout (Mobile & Desktop)

```
[HEADER]
[ Logo + 20. Kurt-Becker-Cup ] ------------------------ [ ℹ️ Info-Button ]
[ Sub-Nav: Live | Spielplan | Tabellen | Finalphase ]

[MAIN CONTENT]
... Gast-Inhalte / Info-Inhalt / Impressum ...

[FOOTER]
[ Impressum ] ---------- [ Made with ❤️ in Rüsselsheim ] ---------- [ 📺 Kiosk | 🔑 Admin ]
```

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Datenmodell (`DATABASE.md`)

Für die Entkopplung von Spielzeiten und großen Textinhalten wird in der Collection `config` ein eigenes Dokument `info` definiert:

```typescript
// Collection: config, Dokument: info
export interface TournamentInfoConfig {
  id: "info";
  content: string;                   // Markdown-Rohtext der Info-Seite
  updatedAt: FirebaseFirestore.Timestamp;
  updatedBy?: string;                // User-ID des bearbeitenden Admins
}
```

*Sicherheitsregeln (`firestore.rules`):*
- `match /config/info`: Lesbar für alle (`allow read: if true;`), schreibbar nur für authentifizierte Admins (`allow write: if request.auth != null;`).

### 6.2 Markdown Rendering Bibliothek
- Einsatz von `react-markdown` (Version ^10.x oder ^9.x kompatibel mit React 19) zur sicheren Umwandlung von Markdown in React-Elemente.
- Styling über Tailwind CSS mit sauberen Typografie-Klassen (`prose` oder expliziten Tailwind-Element-Klassen).

### 6.3 State & Firestore Service (`src/services/infoService.ts`)
- `subscribeTournamentInfo(callback: (info: TournamentInfoConfig) => void): Unsubscribe`
- `updateTournamentInfo(content: string, userId?: string): Promise<void>`
- Offline/Mock-Fallback mit dem vorgegebenen Standardtext, falls Firebase noch nicht konfiguriert oder das Dokument unbefüllt ist.

---

## 7. Edge Cases & Fehlerbehandlung

- **Leeres Dokument in Firestore**: Falls das Dokument `config/info` noch nicht existiert, liefert der Service automatisch den vollständigen Default-Initialtext aus (mit allen Eckdaten: 31.10. / 01.11., Penalty, Essen etc.).
- **Fehlerhaftes Markdown**: `react-markdown` fängt Syntaxfehler sicher ab und rendert fehlerhaften Code als unformatierten Text, ohne dass die Anwendung abstürzt.
- **Offline / Verbindungsunterbrechung beim Speichern**: Deutliche Fehlermeldung im Admin-Editor („Speichern fehlgeschlagen. Bitte Internetverbindung prüfen.“), damit keine ungespeicherten Änderungen verloren gehen.
- **Lange Texte auf mobilen Geräten**: Die Info-Seite erhält eine komfortable Lesebreite (`max-w-3xl mx-auto`) mit sticky Header oder eindeutigem Zurück-Sprung.

---

## 8. Verifikations- & Testplan

### 8.1 Manuelle Tests
1. [ ] **Header-Test**: Öffnen von `/` auf Smartphone-Breite und Desktop. Sicherstellen, dass oben rechts ausschließlich der Info-Button sitzt.
2. [ ] **Footer-Test**: Überprüfen, ob links „Impressum“ verlinkt ist, mittig der Gruß steht und rechts Kiosk & Admin aufrufbar sind.
3. [ ] **Info-Seite Test**: Klick auf den Info-Button öffnet `/info`. Vollständigkeit der vorgegebenen Standardtexte prüfen.
4. [ ] **Admin-Editor Test**: Öffnen von `/admin#info`. Text bearbeiten (z. B. Überschrift hinzufügen), Vorschau prüfen und Speichern klicken.
5. [ ] **Synchronisations-Test**: `/info` im Gast-Tab aktualisieren und prüfen, ob die gespeicherte Änderung sofort sichtbar ist.
6. [ ] **Impressum Test**: Klick auf „Impressum“ im Footer öffnet `/impressum` mit Vorlage.

### 8.2 Automatisierte Tests / Validierung
- [ ] `npm run lint` (oxlint) läuft fehlerfrei ohne Warnungen durch.
- [ ] `npm run build` kompiliert ohne TypeScript-Fehler.

---

## 9. Offene Fragen & Klärungsbedarf
- Keine Blocker. Der genaue Wortlaut des Impressums wird zu einem späteren Zeitpunkt vom Nutzer bereitgestellt; für die aktuelle Implementierung wird ein solider Standard-Platzhalter verwendet.
