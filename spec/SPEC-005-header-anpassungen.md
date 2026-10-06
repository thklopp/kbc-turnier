# SPEC-005: Header-, Footer- und Branding-Anpassungen (RRK-Logo, 20. Kurt-Becker-Cup, Icon-Buttons und Vereinheitlichung)

> **Status**: Abgeschlossen  
> **Typ**: UI-Optimierung / Branding  
> **Branch**: `feat/SPEC-005-header-anpassungen`  
> **Autor**: Antigravity Agent  
> **Erstellt am**: 2026-10-06  
> **Letzte Änderung**: 2026-10-06  
> **Betroffene Bereiche**: Gast-Ansicht (`/`), Turnierleitung (`/admin`, `/login`), Kiosk (`/kiosk`), HTML-Metadaten & Standardkonfiguration

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Die Anwendung verwendet an verschiedenen Stellen noch alte Platzhalter-Texte (`KBC Hallenhockey`, `KBC Hallenhockey Cup 2026`, `KBC Turnier-Administration`), generische Emoji-Grafiken (`🏑`) sowie das Icon `ShieldCheck`. Zudem nimmt die bisherige Kopfzeile mit Text-Buttons viel Platz ein, und der Footer enthält noch einen technischen/statischen Platzhaltertext.

Die Anforderungen umfassen:
1. **Header Gastansicht**:
   - Ersetzen von `KBC Hallenhockey` durch den offiziellen Turniertitel **`20. Kurt-Becker-Cup`**.
   - Ersetzen der bisherigen Emoji-Platzhalterbox (`🏑`) durch das offizielle Logo des Rüsselsheimer RK (**`RRK.webp`** aus `assets/images/`).
   - Entfernen der Textlabels der beiden Header-Buttons („Hallen-Display“ und „Turnierleitung“), sodass diese als reine Icon-Buttons fungieren.
   - Austausch des Icons für die Turnierleitung von `ShieldCheck` zu `UserRoundKey` (`user-round-key` aus `lucide-react`).
2. **Footer**:
   - Zentrierter Text: **`Made with ❤️ in Rüsselsheim`** (an Stelle der bisherigen zweispaltigen SDD-/Mannschaftsinformation).
3. **Umfassende Harmonisierung aller weiteren Stellen**:
   - Durchgängige Umstellung aller Vorkommen von `ShieldCheck` auf `UserRoundKey` (in `AdminLayout.tsx` und `LoginPage.tsx`).
   - Einbindung des RRK-Logos in `KioskHeader.tsx` und auf dem Ruhe-/Pause-Bildschirm des Kiosk-Scoreboards (`KioskScoreboardSlide.tsx`).
   - Aktualisierung aller Branding-Texte (`index.html`, `configService.ts`, `AdminLayout.tsx`, `LoginPage.tsx`, `KioskUpcomingSlide.tsx`) auf **`20. Kurt-Becker-Cup`**.

### 1.2 Zielzustand & Mehrwert
- Durchgängiges, einheitliches Branding mit dem offiziellen RRK-Vereinslogo und dem korrekten Turniertitel über alle Ansichten hinweg (Gast, Admin, Kiosk).
- Aufgeräumte, mobile-optimierte Kopfzeile mit kompakten Icon-Buttons bei voller Barrierefreiheit (`title`, `aria-label`).
- Schlichter, sympathischer Footer mit lokaler Verbundenheit („Made with ❤️ in Rüsselsheim“).

---

## 2. User Stories

- **US-1**: Als **Besucher und Fan des Turniers** möchte ich **auf allen Seiten das offizielle RRK-Logo und den Titel „20. Kurt-Becker-Cup“ sehen**, um **eine professionelle und club-identische Präsentation zu erleben**.
- **US-2**: Als **Smartphone-Nutzer** möchte ich **im Header kompakte Icon-Buttons ohne Textbeschriftung vorfinden**, um **auch auf kleinen Bildschirmen eine saubere, einzeilige Navigation ohne störende Umbrüche zu haben**.
- **US-3**: Als **Turnierleiter** möchte ich **sowohl im Header der Gastansicht als auch in der Admin-Leiste und auf der Login-Seite ein einheitliches Schlüsselsymbol (`UserRoundKey`) sehen**, um **den administrativen Zugang sofort intuitiv zu identifizieren**.
- **US-4**: Als **Zuschauer am Hallen-Display (Kiosk)** möchte ich **im Kopfbereich und in Spielpausen das RRK-Logo anstelle generischer Emojis sehen**, um **ein modernes, turniergerechtes Großbild-Design zu genießen**.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)

#### A. Asset-Verwaltung
- [x] Übernahme von `assets/images/RRK.webp` in das Frontend (`src/assets/images/RRK.webp` bzw. `public/images/RRK.webp`).

#### B. Header der Gastansicht (`GuestLayout.tsx`)
- [x] Ersetzen der Emoji-Box (`🏑`) durch `RRK.webp` mit sauberer Skalierung (`h-10 w-10 object-contain`).
- [x] Titel-Änderung von `KBC Hallenhockey` zu `20. Kurt-Becker-Cup`.
- [x] Text „Hallen-Display“ vom Kiosk-Button entfernen; nur Icon `Tv` anzeigen.
- [x] Text „Turnierleitung“ vom Admin-Button entfernen; nur Icon anzeigen.
- [x] Icon des Admin-Buttons von `ShieldCheck` auf `UserRoundKey` ändern.
- [x] Buttons als quadratische Icon-Buttons stylen (`h-9 w-9` / `p-2`) mit vollständigen Barrierefreiheitsattributen (`title` und `aria-label`).

#### C. Footer der Gastansicht (`GuestLayout.tsx`)
- [x] Footer auf eine zentrierte Textzeile umstellen: **`Made with ❤️ in Rüsselsheim`**.
- [x] Bisherige 2-spaltige Elemente (Trophy-Icon, SDD-Hinweis, 16 Teams/Zeiten) entfernen.

#### D. Harmonisierung aller weiteren Stellen im Projekt
- [x] **`src/components/layouts/AdminLayout.tsx`**:
  - Icon von `ShieldCheck` auf `UserRoundKey` umstellen.
  - Subtitle von `KBC Turnier-Administration` auf `20. Kurt-Becker-Cup Turnier-Administration` ändern.
- [x] **`src/pages/admin/LoginPage.tsx`**:
  - Icon in der Login-Kachel von `ShieldCheck` auf `UserRoundKey` umstellen.
  - Subtitle von `KBC Hallenhockey-Turnierverwaltung` auf `20. Kurt-Becker-Cup Turnierverwaltung` ändern.
- [x] **`src/components/kiosk/KioskHeader.tsx`**:
  - Emoji-Box (`🏑`) durch das RRK-Logo ersetzen (`h-11 w-11 object-contain`).
  - Fallback-Name von `KBC Hallenhockey Cup 2026` auf `20. Kurt-Becker-Cup` ändern.
- [x] **`src/components/kiosk/KioskScoreboardSlide.tsx`**:
  - Ruhe-/Pause-Bildschirm (wenn kein Match aktiv ist): Emoji-Box (`🏑`) durch RRK-Logo ersetzen.
- [x] **`src/components/kiosk/KioskUpcomingSlide.tsx`**:
  - Fußzeile von `KBC Kiosk System • Feld 1` auf `20. Kurt-Becker-Cup • Feld 1` anpassen.
- [x] **`src/services/configService.ts`**:
  - `DEFAULT_TOURNAMENT_CONFIG.tournamentName`: von `KBC Hallenhockey Cup 2026` auf `20. Kurt-Becker-Cup` setzen.
- [x] **`index.html`**:
  - `<title>` von `KBC Hallenhockey-Turnierverwaltung` auf `20. Kurt-Becker-Cup` anpassen.

### 3.2 Explizit Out-of-Scope
- Team-spezifische Hockey-Emojis in Ergebnislisten und Hero-Karten (diese dienen als Platzhalter für Clublogos der teilnehmenden Gast-Mannschaften, sofern keine Team-Wappen vorliegen).
- Änderungen an Routing, Timer-Logik oder Berechtigungen.
- Firestore-Datenbankschema-Änderungen.

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien

- [x] **AC-1: Header Gastansicht (Titel & Logo)**
  - **Gegeben sei (Given)**: Die Startseite `/` wird im Browser aufgerufen.
  - **Wenn (When)**: Der Header geladen wird.
  - **Dann (Then)**: Wird links das RRK-Logo (`RRK.webp`) unverzerrt gerendert und daneben steht als Haupttitel `20. Kurt-Becker-Cup`.

- [x] **AC-2: Header Gastansicht (Icon-only Buttons & UserRoundKey)**
  - **Gegeben sei**: Die Gastansicht `/`.
  - **Wenn**: Der rechte Navigationsbereich im Header betrachtet wird.
  - **Dann**:
    - Der Kiosk-Button zeigt nur das Icon `Tv` (kein Text „Hallen-Display“) mit `aria-label="Hallen-Display"` und `title="Hallen-Display Vollbild öffnen"`.
    - Der Admin-Button zeigt nur das Icon `UserRoundKey` (kein Text „Turnierleitung“) mit `aria-label="Turnierleitung"` und `title="Turnierleitung Anmeldung"`.
    - Beide Buttons besitzen konsistente quadratische Abmessungen (`h-9 w-9`).

- [x] **AC-3: Footer Gastansicht**
  - **Gegeben sei**: Die Gastansicht `/`.
  - **Wenn**: Bis ans Seitenende gescrollt wird.
  - **Dann**: Steht im Footer zentriert ausschließlich: `Made with ❤️ in Rüsselsheim`.

- [x] **AC-4: Turnierleitung Navigation & Login**
  - **Gegeben sei**: Ein Aufruf von `/admin` bzw. `/login`.
  - **Wenn**: Die jeweiligen Ansichten gerendert werden.
  - **Dann**:
    - In `AdminLayout.tsx` ist das Icon `UserRoundKey` zu sehen und die Unterzeile lautet `20. Kurt-Becker-Cup Turnier-Administration`.
    - In `LoginPage.tsx` ist in der Login-Box das Icon `UserRoundKey` zu sehen und der Untertitel lautet `20. Kurt-Becker-Cup Turnierverwaltung`.

- [x] **AC-5: Kiosk-Display Branding**
  - **Gegeben sei**: Die Ansicht `/kiosk`.
  - **Wenn**: Die Headerzeile und die Slides betrachtet werden.
  - **Dann**:
    - Im Kiosk-Header wird das RRK-Logo angezeigt und der Standardname lautet `20. Kurt-Becker-Cup`.
    - Im Slide `KioskUpcomingSlide` lautet der Text `20. Kurt-Becker-Cup • Feld 1`.
    - Im `KioskScoreboardSlide` (bei inaktivem Spiel) erscheint das RRK-Logo statt des Emojis `🏑`.

- [x] **AC-6: HTML Dokument-Titel**
  - **Gegeben sei**: Ein Tab im Browser mit beliebiger Route.
  - **Wenn**: Der Reiter im Browser betrachtet wird.
  - **Dann**: Lautet der Seitentitel `20. Kurt-Becker-Cup`.

### 4.2 Allgemeine Qualitätskriterien
- [x] Keine toten Imports (`ShieldCheck` aus `GuestLayout`, `AdminLayout` und `LoginPage` entfernt).
- [x] Vollständige TypeScript-Typisierung ohne `any`.
- [x] Fehlerfreier Build (`npm run build`) und Linting (`npm run lint`).

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Komponenten-Gegenüberstellung

#### Header Gastansicht (`GuestLayout.tsx`):
```tsx
// Vorher:
<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white font-bold ...">
  🏑
</div>
<span>KBC Hallenhockey</span>
<Link to="/kiosk">
  <Tv className="h-3.5 w-3.5 text-slate-500" />
  <span className="hidden sm:inline">Hallen-Display</span>
</Link>
<Link to="/admin">
  <ShieldCheck className="h-3.5 w-3.5 text-white" />
  <span>Turnierleitung</span>
</Link>

// Nachher:
<img
  src={rrkLogo}
  alt="RRK Logo"
  className="h-10 w-10 object-contain rounded-lg transition-transform group-hover:scale-105"
/>
<span>20. Kurt-Becker-Cup</span>
<Link
  to="/kiosk"
  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900"
  title="Hallen-Display Vollbild öffnen"
  aria-label="Hallen-Display"
>
  <Tv className="h-4 w-4" />
</Link>
<Link
  to="/admin"
  className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm transition-colors hover:bg-blue-500"
  title="Turnierleitung Anmeldung"
  aria-label="Turnierleitung"
>
  <UserRoundKey className="h-4 w-4" />
</Link>
```

#### Footer Gastansicht (`GuestLayout.tsx`):
```tsx
// Vorher:
<footer className="border-t border-slate-200 bg-white py-6">
  <div className="container mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-4 text-xs text-slate-500 sm:flex-row">
    <div className="flex items-center gap-2">
      <Trophy className="h-4 w-4 text-amber-500" />
      <span>KBC Hallenhockey-Turnierverwaltung &bull; Spec Driven Development</span>
    </div>
    <div>16 Mannschaften &bull; 1 Spielfeld &bull; Sa 10:00 Uhr / So 09:00 Uhr</div>
  </div>
</footer>

// Nachher:
<footer className="border-t border-slate-200 bg-white py-6">
  <div className="container mx-auto flex max-w-5xl items-center justify-center px-4 text-xs text-slate-500">
    <span>Made with ❤️ in Rüsselsheim</span>
  </div>
</footer>
```

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Asset-Management
- Das Originalbild liegt unter `assets/images/RRK.webp`.
- Es wird nach `src/assets/images/RRK.webp` kopiert, damit Vite es statisch importieren, hashen und optimieren kann:
  ```typescript
  import rrkLogo from "@/assets/images/RRK.webp"
  ```

### 6.2 Icons (`lucide-react`)
- Austausch aller Verwendungen von `ShieldCheck` durch `UserRoundKey`:
  - `src/components/layouts/GuestLayout.tsx`
  - `src/components/layouts/AdminLayout.tsx`
  - `src/pages/admin/LoginPage.tsx`

---

## 7. Verifikations- & Testplan

### 7.1 Manuelle Tests
1. [ ] Aufruf von `/`: RRK-Logo, Titel „20. Kurt-Becker-Cup“, Icon-Buttons `Tv` und `UserRoundKey` verifizieren.
2. [ ] Aufruf von `/`: Bis zum Footer scrollen und zentrierten Text „Made with ❤️ in Rüsselsheim“ prüfen.
3. [ ] Aufruf von `/admin`: Icon `UserRoundKey` und Text „20. Kurt-Becker-Cup Turnier-Administration“ prüfen.
4. [ ] Aufruf von `/login`: Icon `UserRoundKey` und Text „20. Kurt-Becker-Cup Turnierverwaltung“ prüfen.
5. [ ] Aufruf von `/kiosk`: RRK-Logo im Kiosk-Header und Titel „20. Kurt-Becker-Cup“ prüfen.
6. [ ] Browser-Tab-Titel in allen Ansichten prüfen (`index.html`).

### 7.2 Automatisierte Validierung
- [ ] `npm run lint` ohne Fehler.
- [ ] `npm run build` baut fehlerfrei.
