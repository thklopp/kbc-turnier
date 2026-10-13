# SPEC-033: Kompakter Einzeilen-Header für Smartphones im Querformat (GuestLayout)

> **Status**: Abgeschlossen  
> **Typ**: Optimierung / UI/UX  
> **Branch**: feat/SPEC-033-guest-landscape-compact-header  
> **Autor**: Antigravity  
> **Erstellt am**: 2026-10-13  
> **Letzte Änderung**: 2026-10-13  
> **Betroffene Bereiche**: Gast-Ansicht (`/`, `/info`) | Layout (`src/components/layouts/GuestLayout.tsx`)  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Auf Smartphones im Querformat (Landscape) steht bauartbedingt nur eine sehr geringe vertikale Bildschirmhöhe zur Verfügung (typischerweise 360–430 px abzüglich der System- und Browser-Adressleisten).  
In der Gästeansicht (`GuestLayout`) ist der Kopfbereich derzeit zweistöckig und dauerhaft fixiert (`sticky top-0`):
1. **Haupt-Header:** `h-16` (64 px) mit Vereinslogo, Turniertitel, Subtitel und Info-Button.
2. **Tab-Subnavigation:** zusätzliche Zeile (~40 px) mit den Reitern *Live*, *Vorrunde*, *Finalrunde* und *Tabellen*.

Zusammen belegen diese Elemente über 100–115 px und nehmen damit über 30–35 % der gesamten vertikalen Bildfläche ein. Spielpaarungen, Live-Spielstände oder Tabellenzeilen sind dadurch im Querformat stark beschnitten und erfordern unnötig viel Scrollen.

### 1.2 Zielzustand & Mehrwert
Im Querformat auf Smartphones (Bildschirmhöhe $\le$ 500 px) wird der Header auf eine einzige, schlanke Zeile (Höhe ca. 44 px / `h-11`) komprimiert:
- Das Logo wird kompakt dargestellt (`h-7 w-7`), der Turniertitel gekürzt/verkleinert und der Subtitel ausgeblendet.
- Die vier Haupt-Tabs (*Live*, *Vorrunde*, *Finalrunde*, *Tabellen*) rücken direkt in dieselbe Zeile neben das Logo bzw. den Info-Button.
- Die separate zweite Navigationszeile entfällt im Smartphone-Querformat vollständig.
- Auf normalen Hochformat-Geräten (Portrait) sowie auf Tablets und Desktop-Monitoren bleibt die bewährte zweizeilige Ansicht unverändert erhalten.

**Ergebnis:** Über 55 % Platzersparnis in der Vertikalen auf Smartphones im Querformat bei voller Beibehaltung der Navigation und Einhandbedienbarkeit.

---

## 2. User Stories

- **US-1**: Als **Zuschauer/Gast mit Smartphone im Querformat** möchte ich **einen flachen, einzeiligen Header haben**, um **möglichst viele Spiele, Tabellenplätze und Live-Details ohne übermäßiges Scrollen im Blick zu haben**.
- **US-2**: Als **Zuschauer/Gast mit Smartphone** möchte ich **auch im Querformat weiterhin mit nur einem Fingertipp zwischen Live, Vorrunde, Finalrunde, Tabellen und Info wechseln können**, um **die Navigation schnell und barrierefrei bedienen zu können**.
- **US-3**: Als **Nutzer auf einem Tablet oder Desktop-PC** möchte ich **weiterhin die gewohnte, großzügige zweizeilige Navigation sehen**, um **keine Einbußen auf großen Displays zu haben**.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)
- [x] **Kompakte Einzeilen-Darstellung im Landscape**:
  - Aktiviert bei Querformat auf Geräten mit geringer Höhe (`@media (orientation: landscape) and (max-height: 500px)`).
  - Maximale Header-Höhe: `h-11` (44 px) oder `h-12` (48 px).
- [x] **Inline-Reiter (Tabs)**:
  - Die Reiter (*Live*, *Vorrunde*, *Finalrunde*, *Tabellen*) werden im Smartphone-Querformat horizontal direkt im Haupt-Header platziert.
  - Aktiver Tab bleibt visuell hervorgehoben (blaue Textfarbe und dezenter Unterstrich oder Pill-Indikator).
- [x] **Kompaktes Branding**:
  - Logo verkleinert auf ca. 28 px (`h-7 w-7`).
  - Kurztitel "KBC" oder kompakter Text "20. Kurt-Becker-Cup" (text-xs/sm, font-bold).
  - Subtitel ("mU14 & wU14 Turnier") im Smartphone-Querformat ausgeblendet.
- [x] **Kompakter Info-Button**:
  - Info-Button platzsparend als Icon-Button (`h-8 w-8`) oder flacher Button integriert.
- [x] **Ausblenden der zweiten Tab-Leiste**:
  - Die separate Unterzeile (`border-t border-slate-100 bg-white`) wird im Smartphone-Querformat ausgeblendet.
- [x] **Konsistenz & Unverändertes Verhalten**:
  - Standard-Portrait (Hochformat auf Smartphones) bleibt zu 100 % unverändert zweizeilig.
  - Tablets (z. B. iPads $\ge$ 768 px Höhe) und Desktop-Displays bleiben unverändert zweizeilig.

### 3.2 Explizit Out-of-Scope
- Änderung der Seiteninhalte (`LiveView`, `ScheduleView`, `StandingsView`, `InfoView`).
- Änderungen an der Admin- oder Kiosk-Ansicht (diese sind primär für Tablets bzw. Großbildschirme ausgelegt).

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien

- [x] **AC-1: Einzeiliger Header im Smartphone-Querformat**
  - **Gegeben sei**: Ein Smartphone (z. B. iPhone oder Android, Höhe $\le$ 500 px im Querformat) öffnet `/`.
  - **Wenn**: Das Smartphone in die Queransicht (Landscape) gedreht wird.
  - **Dann**: Beträgt die Gesamthöhe des fixierten Headers maximal 48 px (`h-11` / `h-12`), Logo, Titel, die 4 Navigationstabs und der Info-Button befinden sich in einer einzigen horizontalen Zeile, und die zweite Navigationszeile ist nicht sichtbar.

- [x] **AC-2: Voll funktionsfähige Tab-Navigation im Querformat**
  - **Gegeben sei**: Das Gerät befindet sich im Smartphone-Querformat.
  - **Wenn**: Der Nutzer auf "Vorrunde", "Finalrunde", "Tabellen" oder "Live" tippt.
  - **Dann**: Wechselt die Ansicht wie gewohnt zum gewählten Abschnitt und der aktive Tab wird optisch hervorgehoben.

- [x] **AC-3: Info-Navigation im Querformat**
  - **Gegeben sei**: Das Gerät befindet sich im Smartphone-Querformat.
  - **Wenn**: Der Nutzer auf das Info-Element tippt.
  - **Dann**: Wird die Seite `/info` aufgerufen und der Info-Button signalisiert den aktiven Status.

- [x] **AC-4: Beibehaltung der Ansicht im Hochformat und auf Großgeräten**
  - **Gegeben sei**: Ein Smartphone im Hochformat (Portrait) oder ein Desktop-PC / Tablet (Höhe > 500 px).
  - **Wenn**: Die Seite `/` geladen wird.
  - **Dann**: Werden der Header (64 px) und die Tab-Leiste zweistöckig wie bisher dargestellt.

### 4.2 Allgemeine Qualitätskriterien
- [x] Strikte Einhaltung von Tailwind CSS ohne unsaubere CSS-Hacks.
- [x] Vollständige TypeScript-Typisierung ohne `any`.
- [x] Fehlerfreie Ausführung von `npm run build` und `npm run lint`.

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Responsive Breakpoints
Zur sauberen Abgrenzung nutzen wir entweder eine dedizierte Media-Query in Tailwind (`landscape-phone:` mit raw `(orientation: landscape) and (max-height: 500px)`) oder responsive Tailwind-Utility-Klassen:
```css
@media (orientation: landscape) and (max-height: 500px) {
  /* Kompakter Einzeilen-Header */
}
```

### 5.2 Layout-Skizze (Smartphone-Querformat)
```
+---------------------------------------------------------------------------------------+
| [Logo] KBC | [Live]  [Vorrunde]  [Finalrunde]  [Tabellen]                [Info-Icon]  |  ~44px
+---------------------------------------------------------------------------------------+
| Inhaltsbereich (Live-Ticker, Spielplan, Tabellen mit maximalem vertikalen Platz)      |
```

Im Hochformat (Portrait) bleibt die Struktur:
```
+---------------------------------------------------------------------------------------+
| [Logo] 20. Kurt-Becker-Cup (mU14 & wU14)                                       [Info] |  64px
+---------------------------------------------------------------------------------------+
| [Live]   [Vorrunde]   [Finalrunde]   [Tabellen]                                       |  ~40px
+---------------------------------------------------------------------------------------+
```

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Datenmodell (`DATABASE.md`)
- Keine Änderungen erforderlich (reine UI/Layout-Optimierung).

### 6.2 Komponenten & Styling
- **`tailwind.config.js`**: Ergänzung eines Screen-Breakpoints `landscape-phone`:
  ```javascript
  screens: {
    // ...
    'landscape-phone': { 'raw': '(orientation: landscape) and (max-height: 500px)' },
  }
  ```
- **`src/components/layouts/GuestLayout.tsx`**:
  - Im Header: Container erhält bedingte Höhen- und Flex-Klassen für `landscape-phone`.
  - Im Tab-Bereich: Einbindung der Tabs in die Hauptzeile für `landscape-phone` und Ausblenden der separaten zweiten Zeile via `landscape-phone:hidden`.

---

## 7. Edge Cases & Fehlerbehandlung

- **Sehr schmale Bildschirme im Querformat (< 600 px Breite)**:
  - Tabs bleiben horizontal scrollbar (`overflow-x-auto` mit unsichtbarer Scrollbar), falls die Bildschirmbreite wider Erwarten nicht ausreicht.
- **Drehen des Geräts während der Nutzung**:
  - Durch reine CSS-Media-Queries schaltet das Layout verzögerungsfrei und flüssig ohne Neuladen der Seite um.

---

## 8. Verifikations- & Testplan

### 8.1 Manuelle Tests
1. [ ] Aufruf von `/` in den Browser-DevTools mit Geräte-Emulation (z. B. iPhone 14 / Pixel 7 im Querformat, z. B. 844x390 oder 915x412).
2. [ ] Überprüfung, dass der Header nur eine Zeile hoch ist (~44 px) und alle Tabs bedienbar sind.
3. [ ] Umschalten in den Hochformat-Modus (Portrait, 390x844): Header und Tabs wieder zweistöckig.
4. [ ] Umschalten auf Desktop (1920x1080) und iPad (1024x768): Header und Tabs unverändert zweistöckig.
5. [ ] Durchklicken aller Tabs (*Live*, *Vorrunde*, *Finalrunde*, *Tabellen*, *Info*) im Querformat.

### 8.2 Automatisierte Validierung
- [ ] `npm run lint` ohne Fehler.
- [ ] `npm run build` erzeugt ein valides Produktions-Build.

---

## 9. Status & Freigabe
- **Status**: Bereit für Review durch den Nutzer.
- **Freigabe-Kriterium**: Implementierung startet erst nach Bestätigung mit **`APPROVED`**.
