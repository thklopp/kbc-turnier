# SPEC-056: PDF-Spielplan im neuen Tab öffnen und direkte Route /pdf

> **Status**: Abgeschlossen  
> **Typ**: Feature / UX-Optimierung  
> **Branch**: `feat/SPEC-056-pdf-spielplan-new-tab-und-route`  
> **Autor**: Antigravity  
> **Erstellt am**: 2026-10-21  
> **Letzte Änderung**: 2026-10-21  
> **Betroffene Bereiche**: Gast-Ansicht (`/`, `/pdf`), Routing (`src/routes/AppRouter.tsx`), PDF-Service (`src/services/pdfScheduleService.ts`)  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Bisher ist der PDF-Spielplan in der Gästeansicht (`GuestLayout.tsx`) im Footer als Schaltfläche eingebunden, die beim Klick die Daten lädt und direkt einen Dateidownload (`doc.save("kbc-spielplan.pdf")`) im selben Tab auslöst.
Dabei ergeben sich zwei Einschränkungen:
1. Viele Nutzer (insbesondere am Smartphone oder Tablet) möchten das PDF zunächst direkt im Browser ansehen, vergrößern und durchblättern, anstatt dass eine Datei im Download-Ordner landet.
2. Es gibt bisher keinen direkten, teilbaren Link (wie z. B. `/pdf`), über den der aktuelle PDF-Spielplan direkt im Browser aufgerufen, verlinkt oder als QR-Code geteilt werden kann.

### 1.2 Zielzustand & Mehrwert
- **Neuer Tab**: Ein Klick auf den Link „PDF-Spielplan“ in der Gästeansicht öffnet das Dokument in einem neuen Browser-Tab (`target="_blank"`), ohne die aktuelle Ansicht des Nutzers zu unterbrechen.
- **Direkte Route `/pdf`**: Über die URL `/pdf` (z. B. `turnier.kbc.de/pdf`) wird eine schlanke Viewer-Seite aufgerufen, die live die aktuellen Turnierdaten (Konfiguration, Teams, Spielplan inkl. aktueller Ergebnisse) abruft, das PDF generiert und im Browser anzeigt.
- **Viewer mit Aktionen**: Die Seite bietet die native PDF-Vorschau (via `iframe` / Blob) sowie im Header praktische Schnellaktionen (z. B. „Herunterladen“, „Drucken“, „Zurück zur Übersicht“), inklusive Ladeindikator während der Generierung und Fehlertoleranz bei Netzwerkproblemen.

---

## 2. User Stories

- **US-1**: Als **Turniergast oder Betreuer** möchte ich beim Klick auf „PDF-Spielplan“ im Footer, dass sich das PDF in einem neuen Tab öffnet, damit mein aktueller Kontext (z. B. Live-Ticker oder Vorrunden-Tabelle) nicht verloren geht.
- **US-2**: Als **Zuschauer oder Trainer** möchte ich über die einfache URL `/pdf` direkt auf den aktuellen PDF-Spielplan zugreifen können, um diesen schnell als Lesezeichen zu speichern oder auszudrucken.
- **US-3**: Als **mobiler Nutzer** möchte ich auf der `/pdf`-Seite neben der eingebetteten Ansicht auch einen klaren Download-Button haben, falls der native PDF-Viewer auf meinem mobilen Betriebssystem eingeschränkt ist.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)
- [x] **FR-1: Neuer Tab beim Klick im Footer**:
  - Der PDF-Button im Footer von `GuestLayout.tsx` wird zu einem Link auf `/pdf` umgestellt.
  - Der Link besitzt die Attribute `target="_blank"` und `rel="noopener noreferrer"`.
  - Icon und Beschriftung bleiben konsistent erhalten (`FileText` mit Text „PDF-Spielplan“).
- [x] **FR-2: Neue Route `/pdf` in AppRouter**:
  - In `src/routes/AppRouter.tsx` wird die Route `/pdf` registriert (außerhalb der Standard-GuestLayout-Navigation, um vollen Bildschirmplatz für die PDF-Anzeige zu bieten).
- [x] **FR-3: Dedizierte PDF-Viewer-Seite (`PdfSchedulePage.tsx`)**:
  - Ruft beim Laden parallel `getTournamentConfig()`, `getTeams()` und `getMatches()` ab.
  - Erzeugt das PDF mit der bewährten Logik aus `generateSchedulePdf(...)`.
  - Erstellt einen Blob-URL (`URL.createObjectURL(blob)`), der im Vollbild über ein responsives `<iframe />` gerendert wird.
  - Header-Leiste mit:
    - RRK-Logo und Titel „KBC Spielplan (PDF)“
    - Button „Zurück zur Übersicht“ (Link zu `/`)
    - Button „Herunterladen“ (stößt direkten Download des Blobs an)
    - Button „Drucken“
  - Sauberes Freigeben des Object-URLs (`URL.revokeObjectURL`) im Unmount-Cleanup.
- [x] **FR-4: Lade- und Fehlerzustände**:
  - Während der Generierung: Animierter Spinner mit dem Hinweis „PDF-Spielplan wird generiert...“.
  - Bei Netzwerk- oder Generierungsfehlern: Benutzerfreundliche Fehlermeldung mit „Erneut versuchen“-Button.

### 3.2 Explizit Out-of-Scope
- Keine Änderungen an der visuellen Gestaltung des PDF-Inhalts selbst (Farben, Tabellenlayout und Logos bleiben wie in SPEC-040/049 definiert).
- Kein serverseitiges PDF-Rendering (Rendering erfolgt weiterhin schnell und ressourcenschonend clientseitig via jsPDF).

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien
- [x] **AC-1: Klick im Gast-Footer öffnet neuen Tab**
  - **Gegeben sei**: Ein Nutzer befindet sich auf der Gästeansicht (`/`, `/info`, etc.).
  - **Wenn**: Der Nutzer im Footer auf „PDF-Spielplan“ klickt.
  - **Dann**: Öffnet der Browser einen neuen Tab mit der URL `/pdf`.
- [x] **AC-2: Direkter Aufruf von `/pdf`**
  - **Gegeben sei**: Ein Nutzer gibt in der Adresszeile direkt `/pdf` ein oder folgt einem Link.
  - **Wenn**: Die Seite lädt.
  - **Dann**: Werden die aktuellen Turnierdaten geladen, das PDF generiert und direkt im Browser-Viewer angezeigt.
- [x] **AC-3: Download & Druck-Aktion**
  - **Gegeben sei**: Die Seite `/pdf` wird angezeigt.
  - **Wenn**: Der Nutzer auf den Button „Herunterladen“ klickt.
  - **Dann**: Wird die Datei `kbc-spielplan.pdf` lokal gespeichert.
- [x] **AC-4: Mobilfreundlicher Fallback**
  - **Gegeben sei**: Die Seite `/pdf` wird auf einem mobilen Smartphone aufgerufen.
  - **Wenn**: Das `iframe` dargestellt wird.
  - **Dann**: Ist die Seite vollständig responsiv nutzbar und bietet direkten Zugriff auf den Download-Button.

### 4.2 Allgemeine Qualitätskriterien
- [x] Keine fest kodierten Parameter.
- [x] Vollständige TypeScript-Typisierung ohne `any`.
- [x] Fehlerfreier Build (`npm run build`).
- [x] Keine Memory Leaks durch Object-URLs (sauberes `URL.revokeObjectURL`).

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Betroffene Ansichten & Komponenten
- **Pfad**: `/pdf` (neue Route)
- **Komponente**: `src/pages/guest/PdfSchedulePage.tsx`
- **Layout**:
  - Oberer kompakter Header (`h-14`, weißer Hintergrund, dezenter Rand unten):
    - Links: Link zurück zu `/` mit Pfeil-Icon, RRK-Wappen und Titel „KBC Spielplan“
    - Rechts: Button „Herunterladen“ (`Download`-Icon) und optional „Drucken“ (`Printer`-Icon)
  - Hauptbereich: Ausfüllend (`flex-1`, `h-[calc(100vh-3.5rem)]`), in dem das PDF im `iframe` dargestellt wird.
- **Gast-Footer (`GuestLayout.tsx`)**:
  - Der bisherige `<button onClick={handleDownloadPdf}>` wird ersetzt durch einen semantischen Link:
    ```tsx
    <a
      href="/pdf"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 font-medium text-slate-600 hover:text-slate-900 transition-colors"
      title="PDF-Spielplan in neuem Tab öffnen"
    >
      <FileText className="h-4 w-4 text-blue-600" />
      <span>PDF-Spielplan</span>
      <ExternalLink className="h-3 w-3 text-slate-400" />
    </a>
    ```

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Datenmodell (`DATABASE.md`)
- Keine Änderungen an Firestore-Collections oder Schemas erforderlich.

### 6.2 Service-Erweiterung (`pdfScheduleService.ts`)
- Ergänzung einer Hilfsfunktion zur einfachen Erzeugung eines Blobs bzw. Data-URLs:
  ```typescript
  export async function generateSchedulePdfBlob(
    config: TournamentConfig,
    teams: Team[],
    matches: Match[],
    logoUrl?: string
  ): Promise<Blob> {
    const doc = await generateSchedulePdf(config, teams, matches, logoUrl)
    return doc.output("blob")
  }
  ```

---

## 7. Testplan & Validierung

- [ ] **Manueller Test 1 (Footer-Link)**:
  - Öffnen der Startseite `/`
  - Klick auf den Link „PDF-Spielplan“ im Footer
  - Überprüfen, ob sich `/pdf` in einem neuen Tab öffnet.
- [ ] **Manueller Test 2 (Direktaufruf `/pdf`)**:
  - Eingabe von `http://localhost:5173/pdf` im Browser
  - Überprüfen der Ladeanzeige und anschließenden Anzeige des PDFs.
- [ ] **Manueller Test 3 (Download-Button)**:
  - Klick auf den Button „Herunterladen“ im Header von `/pdf`
  - Überprüfen, ob `kbc-spielplan.pdf` heruntergeladen wird.
- [ ] **Manueller Test 4 (Responsive Darstellung)**:
  - Test im Mobile-Modus der Developer-Tools
  - Sicherstellen, dass die Bedienelemente gut erreichbar sind.
- [ ] **Automatisierter Build**:
  - `npm run build` muss ohne Fehler durchlaufen.
