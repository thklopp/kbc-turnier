# SPEC-047: Entfernung von "Samstag (Vorrunde)" aus dem Kiosk-Header

> **Status**: Abgeschlossen  
> **Typ**: UI-Optimierung / Textanpassung  
> **Branch**: `fix/SPEC-047-header-entfernung-samstag-vorrunde`  
> **Autor**: Antigravity  
> **Erstellt am**: 2026-10-19  
> **Letzte Änderung**: 2026-10-19  
> **Betroffene Bereiche**: Kiosk (`/kiosk`) – `KioskHeader.tsx`  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Im Header des Kiosk-Dashboards (`src/components/kiosk/KioskHeader.tsx`) wird unter dem Turniertitel ("20. Kurt-Becker-Cup") aktuell standardmäßig der Untertitel `Samstag (Vorrunde) • 16 Teams (wU14 & mU14)` angezeigt.
Da die Kiosk-Slides bereits über eigene Titelelemente und Badges für die jeweilige Turnierphase verfügen (z. B. "Vorrunde", "Finalrunde"), ist die statische Einblendung von "Samstag (Vorrunde)" im globalen Header redundant und soll entfernt werden.

### 1.2 Zielzustand & Mehrwert
- Der Text `"Samstag (Vorrunde)"` wird aus dem Header (`KioskHeader.tsx`) entfernt.
- Der Untertitel lautet am Samstag bzw. im Standardfall klar und prägnant: **`16 Teams (wU14 & mU14)`**.
- Falls `activeDay === "sunday"`, kann wahlweise `"Sonntag (Finaltag) • 16 Teams (wU14 & mU14)"` angezeigt werden, oder der Tag-Hinweis entfällt für ein einheitliches Bild an beiden Tagen vollständig (Untertitel immer `16 Teams (wU14 & mU14)`). Standard-Umsetzung: Nur `16 Teams (wU14 & mU14)` (oder `Sonntag (Finaltag) • 16 Teams (wU14 & mU14)` wenn Sonntag aktiv).
- Ein aufgeräumter, sauberer Header ohne überflüssige Datums-/Phasen-Dopplungen.

---

## 2. User Stories

- **US-1**: Als **Zuschauer am Kiosk-Display**, möchte ich im Haupt-Header eine aufgeräumte Anzeige des Turniertitels und der Teams sehen, ohne dass dort "Samstag (Vorrunde)" steht, da der aktuelle Kontext bereits durch die jeweiligen Folien angezeigt wird.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)
- [x] **FR-1: Entfernung des Texts in `KioskHeader.tsx`**:
  - Im linken Branding-Block wird der Text `"Samstag (Vorrunde)"` entfernt.
  - Wenn kein aktiver Sonntag-Zusatz gewünscht ist bzw. am Samstag, wird nur noch `16 Teams (wU14 & mU14)` gerendert.
  - Kein führender oder nachfolgender Trennpunkt (`&bull;`), wenn kein Tageslabel vorhanden ist.
- [x] **FR-2: Layout-Integrität**:
  - Keine optischen Verschiebungen der Header-Höhe oder der benachbarten Navigationselemente (Slide-Buttons, Uhrzeit, Vollbild-Button).

### 3.2 Explizit Out-of-Scope
- Keine Änderungen am Gast-Header (`GuestLayout.tsx`) oder Admin-Header (`AdminLayout.tsx`).
- Keine Änderungen an der Slide-Rotation oder den Kiosk-Inhaltsfolien.

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien
- [x] **AC-1: Samstag / Standard-Konfiguration**
  - **Gegeben sei**: Die Kiosk-Ansicht `/kiosk` ist geöffnet und `activeDay` ist `"saturday"` (oder `null`/`undefined`).
  - **Wenn**: Der Header betrachtet wird.
  - **Dann**: Steht unter dem Titel "20. Kurt-Becker-Cup" ausschließlich `16 Teams (wU14 & mU14)`. Der Text "Samstag (Vorrunde)" und der dazugehörige Bullet-Separator sind nicht mehr vorhanden.

- [x] **AC-2: Sonntag-Konfiguration**
  - **Gegeben sei**: Die Kiosk-Ansicht `/kiosk` ist geöffnet und `activeDay` ist `"sunday"`.
  - **Wenn**: Der Header betrachtet wird.
  - **Dann**: Wird entweder `Sonntag (Finaltag) • 16 Teams (wU14 & mU14)` angezeigt (oder bei genereller Tagesabwahl ebenfalls `16 Teams (wU14 & mU14)`).

### 4.2 Allgemeine Qualitätskriterien
- [x] Keine TypeScript-Fehler.
- [x] Fehlerfreier Build (`npm run build`).

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Betroffene Ansichten & Komponenten
- `src/components/kiosk/KioskHeader.tsx`
  - Vorher:
    ```tsx
    const dayLabel = config?.activeDay === "sunday" ? "Sonntag (Finaltag)" : "Samstag (Vorrunde)"
    ...
    <p className="text-xs font-semibold text-slate-500">
      {dayLabel} &bull; 16 Teams (wU14 &amp; mU14)
    </p>
    ```
  - Nachher:
    ```tsx
    const dayLabel = config?.activeDay === "sunday" ? "Sonntag (Finaltag)" : null
    ...
    <p className="text-xs font-semibold text-slate-500">
      {dayLabel ? `${dayLabel} • ` : ""}16 Teams (wU14 &amp; mU14)
    </p>
    ```
    *(Oder vollständige Entfernung des Tageslabels: `<p className="text-xs font-semibold text-slate-500">16 Teams (wU14 &amp; mU14)</p>`)*

---

## 6. Technische Auswirkungen & Architekturbezug

- Keine Datenbank- oder Schema-Änderungen.
- Reine UI-Textanpassung in `src/components/kiosk/KioskHeader.tsx`.
