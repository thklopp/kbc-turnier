# SPEC-004: Vollständige Entfernung des Darkmodes und dunkler Hintergründe

> **Status**: In Abnahme  
> **Typ**: Refactoring / UI-Optimierung  
> **Branch**: `refactor/SPEC-004-entfernung-darkmode-und-dunkle-hintergruende`  
> **Autor**: Antigravity Agent  
> **Erstellt am**: 2026-10-05  
> **Letzte Änderung**: 2026-10-05  
> **Betroffene Bereiche**: Gast-Ansicht (/) | Turnierleitung (/admin & /login) | Kiosk (/kiosk) | Styles & Tailwind-Konfiguration  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Die Applikation weist derzeit ein uneinheitliches Theme- und Farbschema auf:
1. **Kiosk-Modus (`/kiosk`)**: Das Hallen-Display ist aktuell vollständig im Dark-Design umgesetzt (`bg-slate-950`, `bg-slate-900`, dunkle Kacheln, weiße/graue Schriftarten). In gut beleuchteten Sporthallen führt ein dunkler Modus auf Fernsehern/Beamern häufig zu Spiegelungen und schlechter Lesbarkeit aus größerer Entfernung.
2. **Turnierleitung Navigation & Login (`/admin`, `/login`)**:
   - Die Kopfzeile und Subnavigation in `AdminLayout.tsx` verwendet dunkle Hintergründe (`bg-slate-900`, `bg-slate-800`), während der Inhaltsbereich darunter hell ist (`bg-slate-100`).
   - Die Login-Seite (`LoginPage.tsx`) ist komplett dunkel gehalten (`bg-slate-900`, `bg-slate-950`).
   - Mehrere Schaltflächen im Live-Desk (`MatchTimerControl.tsx`, `PenaltyCardManager.tsx`, `LiveMatchDesk.tsx`) verwenden dunkle `bg-slate-900`-Klassen.
3. **Gäste-Ansicht (`/`)**:
   - Die `LiveHeroCard.tsx` nutzt einen dunklen Farbverlauf (`from-slate-900 via-slate-950 to-blue-950`) mit dunklen Team-Logo-Boxen und dunklen Ticker-Pills.
   - Der Button zur Turnierleitung in `GuestLayout.tsx` ist mit `bg-slate-900` dunkel hinterlegt.
4. **CSS- und Tailwind-Konfiguration**:
   - In `src/index.css` existiert noch eine `.dark`-CSS-Klasse mit Variablen für ein dunkles Farbschema.
   - In `tailwind.config.js` ist `darkMode: ["class"]` deklariert.
   - In `src/routes/AppRouter.tsx` wird im Code-Kommentar noch von `(Fullscreen, Dark Mode)` gesprochen.

Gemäß Nutzeranforderung soll die gesamte Applikation geprüft und **nirgends ein Darkmode oder dunkle Hintergründe** verwendet werden.

### 1.2 Zielzustand & Mehrwert
- **Einheitliches, modernes Light-Theme**: Die gesamte App (Gast, Admin, Login und Kiosk) präsentiert sich in einem sauberen, hellen, kontrastreichen Design (`bg-white`, `bg-slate-50`, `bg-slate-100`) mit dunkler Typografie (`text-slate-900`, `text-slate-700`).
- **Optimale Hallentauglichkeit**: Das Hallen-Display (`/kiosk`) wird auf einen hochkontrastierenden, reflexionsarmen Light-Look umgestellt, der auch bei schwierigen Lichtverhältnissen in der Halle optimal ablesbar ist.
- **Konsistente UI-Sprache**: Schaltflächen, Badges, Modals und Navigationsleisten folgen in allen Modulen einheitlich den Primärfarben (Blau, Weiß, Slate-Graustufen).
- **Bereinigte Konfiguration**: Beseitigung toter Darkmode-Konfigurationen in Tailwind und CSS.

---

## 2. User Stories

- **US-1**: Als **Zuschauer in der Sporthalle** möchte ich **das Kiosk-Display auf einem hellen, blendfreien Hintergrund mit gestochen scharfem Kontrast sehen**, um **auch aus 20 Metern Entfernung bei Hallenbeleuchtung Spielstände und Tabellen mühelos ablesen zu können**.
- **US-2**: Als **Turnierleiter am Kampfgericht** möchte ich **eine durchgängig helle Benutzeroberfläche ohne störenden Bruch zwischen dunkler Kopfzeile und hellem Arbeitsbereich nutzen**, um **eine ruhige, augenfreundliche Arbeitsumgebung auf meinem Laptop/Tablet zu haben**.
- **US-3**: Als **Nutzer auf der Login-Seite** möchte ich **ein freundliches, einladendes und helles Design vorfinden**, das **nahtlos zur restlichen KBC-Turnierplattform passt**.
- **US-4**: Als **Gast auf dem Smartphone** möchte ich **die Live-Hero-Karte im einheitlich hellen Design sehen**, damit **sie sich harmonisch in die restliche Gäste-Ansicht einfügt**.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)

#### A. Kiosk-Display (`/kiosk`)
- [x] **KioskLayout (`KioskLayout.tsx`)**: Umstellung des Hauptcontainers von `bg-slate-950 text-slate-100` auf `bg-slate-100 text-slate-900`. Umstellung des „Beenden“-Buttons auf ein dezentes helles Styling (`bg-white/90 border border-slate-300 text-slate-700 hover:text-slate-900 shadow-sm`).
- [x] **KioskHeader (`KioskHeader.tsx`)**:
  - Kopfzeilen-Container: Umstellung von `border-slate-800 bg-slate-900/90` auf `border-slate-200 bg-white/95 shadow-md text-slate-900`.
  - Folien-Umschalter-Pill: Umstellung des Hintergrunds von `bg-slate-950/80 border-slate-800` auf `bg-slate-100 border border-slate-200`. Inaktive Buttons: `text-slate-600 hover:text-slate-900 hover:bg-slate-200/60`.
  - Pause-Schaltfläche: Helle Hover-Zustände (`text-slate-600 hover:text-slate-900 hover:bg-slate-200`).
  - Fortschrittsbalken-Hintergrund: `bg-slate-200` statt `bg-slate-800`.
  - Online/Offline-Badges: Helle Tönungen (`bg-emerald-50 text-emerald-700 border-emerald-200` bzw. `bg-rose-50 text-rose-700 border-rose-200`).
  - Echtzeituhr-Container: `bg-slate-50 border border-slate-200 text-slate-900` statt dunkler Kasten.
  - Vollbild-Button: `bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-xs`.
- [x] **Live-Scoreboard-Folie (`KioskScoreboardSlide.tsx`)**:
  - Scoreboard-Hauptkarte: Ersetzen des dunklen Verlaufs (`from-slate-900/95 to-slate-950/95`) durch eine strahlend weiße Karte mit dezentem Schatten (`bg-white border-2 border-slate-200 shadow-xl text-slate-900`).
  - Team-Logo-Kacheln: Helle Hintergründe (`bg-slate-50 border-2 border-slate-200 shadow-sm`) statt `bg-slate-800/90`.
  - Spielstands-Anzeige: `text-slate-900` in ultra-fetter Typografie auf hellem Untergrund.
  - Meta-Badges oben (Spielnummer, Phase): Helle Badges (`bg-white border border-slate-200 text-slate-700 shadow-xs`) statt dunkler `bg-slate-800/90`-Pills.
  - Zeit- und Statuskarten: Hell gestaltet mit gestochen scharfen Statusfarben.
  - Pausen-Zustand („Keine weiteren Spiele“): Weiße Karte auf hellem Grund.
- [x] **Kommende Partien (`KioskUpcomingSlide.tsx`)**:
  - Spielkarten: Helle Karten (`bg-white border border-slate-200 shadow-md`), hervorgehobene nächste Partie mit dezentem blauen Rahmen (`border-blue-500 bg-blue-50/40 ring-1 ring-blue-500/20`), Live-Spiel mit grünem Rahmen (`border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500/20`).
  - Spielzeit-Pill oben rechts: `bg-white border border-slate-200 text-slate-700` statt `bg-slate-900`.
  - Team-Logos & Badges: Heller Hintergrund (`bg-slate-50 border border-slate-200`).
- [x] **Tabellen-Folien (`KioskStandingsSlide.tsx`)**:
  - Gruppenkarten: `bg-white border-2 border-slate-200 shadow-xl text-slate-900`.
  - Header: `bg-slate-50 border-b border-slate-200`.
  - Tabellenzeilen: Helle Kontraste, Playoff-Zeilen in sanftem Hellgrün (`bg-emerald-50/60 hover:bg-emerald-50`), Standard-Zeilen `hover:bg-slate-50`.
  - Team-Logo-Container: `bg-slate-50 border border-slate-200`.
- [x] **Kiosk Ticker-Footer (`KioskPage.tsx`)**:
  - Footer-Bar: Umstellung von `border-slate-800 bg-slate-900/90` auf `border-slate-200 bg-white/95 shadow-lg text-slate-900`.
  - Ticker-Pill (Turnier-Ticker): `bg-slate-100 border border-slate-200 text-slate-700`.

#### B. Turnierleitung & Authentifizierung (`/admin`, `/login`)
- [x] **AdminLayout (`AdminLayout.tsx`)**:
  - Header: Umstellung von `border-slate-800 bg-slate-900 text-white` auf `border-slate-200 bg-white text-slate-900 shadow-sm`.
  - Button „Gäste-Ansicht“: `border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900`.
  - E-Mail-Badge: `bg-slate-100 text-slate-600 border border-slate-200`.
  - Abmelde-Button: `border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:border-rose-300`.
  - Subnavigation: `border-t border-slate-100 bg-slate-50/60`. Inaktive Tabs: `text-slate-500 hover:text-slate-900 hover:border-slate-300`, aktive Tabs: `border-blue-600 text-blue-600 font-bold`.
- [x] **LoginPage (`LoginPage.tsx`)**:
  - Seiten-Hintergrund: Umstellung von `bg-slate-900 text-slate-100` auf `bg-slate-50 text-slate-900`.
  - Formular-Kachel: `border border-slate-200 bg-white p-8 shadow-xl text-slate-900`.
  - Formular-Eingabefelder (E-Mail, Passwort): `border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500`.
  - Hinweiskästen: Helle Tönungen (`border-amber-200 bg-amber-50 text-amber-800` bzw. `border-rose-200 bg-rose-50 text-rose-800`).
  - Zurück-Link: `text-slate-600 hover:text-slate-900`.
- [x] **Admin Live-Desk Komponenten**:
  - `MatchTimerControl.tsx`: Umstellung der Reset-Schaltfläche und der +/- 1 Min Feinabstimmungsknöpfe von `bg-slate-900 border-slate-800 text-slate-300` auf helle sekundäre Schaltflächen (`bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-xs`).
  - `PenaltyCardManager.tsx`: Umstellung des Buttons „Karte erteilen“ von `bg-slate-900 text-white` auf Primär-Button `bg-blue-600 text-white hover:bg-blue-500`.
  - `LiveMatchDesk.tsx`: Umstellung des Buttons „Spiel hinzufügen“ von `bg-slate-900 text-white` auf `bg-blue-600 text-white hover:bg-blue-500`.
  - Modal-Backdrops (`MatchEditModal.tsx`, `TeamEditModal.tsx`, `DelayShiftModal.tsx`): Vereinheitlichung auf ein dezentes, helles / neutrales Backdrop (`bg-slate-900/30 backdrop-blur-xs`), sodass die Modalkarten selbst klar im Fokus stehen.

#### C. Gäste-Ansicht (`/`)
- [x] **LiveHeroCard (`LiveHeroCard.tsx`)**:
  - Umstellung des Hauptcontainers von dunklem Verlauf (`from-slate-900 via-slate-950 to-blue-950`) auf eine helle Karte mit dezentem Blau-Schimmer (`border border-blue-100 bg-gradient-to-br from-blue-50/60 via-white to-indigo-50/40 p-6 sm:p-8 text-slate-900 shadow-md`).
  - Team-Logo-Boxen: `border-2 border-slate-100 bg-white shadow-sm`.
  - Meta-Badges (Feld-Angabe, Phase): `bg-white/90 border border-slate-200 text-slate-700`.
  - Live-Ticker-Ereignisse: `border border-slate-200 bg-white text-slate-800 shadow-xs`.
- [x] **GuestLayout (`GuestLayout.tsx`)**:
  - Button „Turnierleitung“: Umstellung von `bg-slate-900 text-white hover:bg-slate-800` auf Primär-Styling (`bg-blue-600 text-white hover:bg-blue-500`).

#### D. Tailwind & CSS-Bereinigung
- [x] **`src/index.css`**: Entfernung des ungenutzten `.dark`-Blocks.
- [x] **`tailwind.config.js`**: Entfernung der Konfigurationszeile `darkMode: ["class"]`.
- [x] **`src/routes/AppRouter.tsx`**: Aktualisierung des Kiosk-Routen-Kommentars von `(Fullscreen, Dark Mode)` auf `(Fullscreen, Heller Kiosk-Modus)`.

### 3.2 Explizit Out-of-Scope (Nicht Teil dieser Spec)
- Änderung von Fachlogiken, Match-Regeln, Tabellenberechnungen oder Firestore-Datenstrukturen.
- Veränderung von Routenpfaden oder Navigations-Strukturen.

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien

- [x] **AC-1: Kiosk-Display im vollflächigen, kontrastreichen Light-Theme**
  - **Gegeben sei (Given)**: Der Hallenmonitor öffnet `/kiosk`.
  - **Wenn (When)**: Die Folien (Scoreboard, Nächste Partien, Tabellen wU14/mU14) gerendert oder rotiert werden.
  - **Dann (Then)**:
    - Verwendet der gesamte Bildschirm einen hellen Hintergrund (`bg-slate-100` bzw. `bg-white`).
    - Existieren keinerlei Kacheln mit `bg-slate-950`, `bg-slate-900` oder `bg-slate-800`.
    - Alle Texte und Zahlen (Spielstände, Teamnamen, Spielzeiten) sind in tiefem Schwarz/Dunkelgrau (`text-slate-900`) klar ablesbar.
    - Status-Farben (Live-Rot, Führende Teams in Grün, Pausen/Pässe in Blau/Amber) stechen kontrastreich auf hellem Untergrund hervor.

- [x] **AC-2: Admin-Header und Navigation in durchgängigem Light-Design**
  - **Gegeben sei**: Ein angemeldeter Benutzer befindet sich auf `/admin`.
  - **Wenn**: Der Header und die Subnavigation gerendert werden.
  - **Dann**:
    - Besitzt der Header einen weißen Hintergrund (`bg-white border-b border-slate-200`) und dunklen Text (`text-slate-900`).
    - Sind alle Buttons („Gäste-Ansicht“, „Abmelden“, Tabs) hell gestaltet und besitzen keine dunklen Hintergründe.
    - Gibt es keinen visuellen Bruch zwischen Navigation und dem Inhaltsbereich.

- [x] **AC-3: Login-Maske im Light-Theme**
  - **Gegeben sei**: Ein nicht angemeldeter Benutzer ruft `/login` auf.
  - **Wenn**: Die Seite geladen wird.
  - **Dann**:
    - Ist der Hintergrund der Seite `bg-slate-50`.
    - Ist die Anmeldekarte weiß mit hellem Rand (`bg-white border-slate-200 shadow-xl`).
    - Sind die Eingabefelder für E-Mail und Passwort weiß mit sauberem dunklem Text und hellem Rand.

- [x] **AC-4: LiveHeroCard der Gäste-Ansicht im Light-Design**
  - **Gegeben sei**: Ein Gast ruft `/` auf dem Smartphone oder Desktop auf.
  - **Wenn**: Ein Live-Spiel oder nächstes Spiel aktiv ist.
  - **Dann**:
    - Wird die `LiveHeroCard` mit hellem Grund und dunklem Text dargestellt.
    - Sind die Logo-Container und Ticker-Badges weiß mit dezenten Rahmen.

- [x] **AC-5: Vollständige Abwesenheit von Darkmode-Rückständen**
  - **Gegeben sei**: Eine statische Analyse des Quellcodes über `src/`.
  - **Wenn**: Nach `dark:`, `.dark`, `bg-slate-900`, `bg-slate-950`, `bg-slate-800` (in Hintergründen/Karten) gesucht wird.
  - **Dann**: Gibt es keine Kacheln, Screens oder Hintergründe mehr, die dunkle Farbtöne verwenden.

### 4.2 Allgemeine Qualitätskriterien
- [x] TypeScript-Typisierung bleibt zu 100 % strikt ohne `any`.
- [x] Erfolgreicher Build ohne Fehler (`npm run build`).
- [x] Sauberes Linting ohne Warnungen (`npm run lint`).
- [x] Keine Funktionsverluste bei Reaktivität, Ticker, Jingles oder Timern.

---

## 5. UI/UX & Farbkonzept (Vorher ➔ Nachher)

| Bereich / Komponente | Vorher (Dunkel) | Nachher (Hell / High-Contrast) |
| :--- | :--- | :--- |
| **Kiosk Hintergrund (`KioskLayout`)** | `bg-slate-950 text-slate-100` | `bg-slate-100 text-slate-900` |
| **Kiosk Header (`KioskHeader`)** | `border-slate-800 bg-slate-900/90 text-white` | `border-slate-200 bg-white/95 text-slate-900 shadow-md` |
| **Kiosk Scoreboard Card** | `border-2 border-slate-800 bg-gradient-to-b from-slate-900/95 to-slate-950/95` | `border-2 border-slate-200 bg-white shadow-xl text-slate-900` |
| **Kiosk Logo Container** | `bg-slate-800/90 border-2 border-slate-700` | `bg-slate-50 border-2 border-slate-200 shadow-sm` |
| **Kiosk Tabellen-Karten** | `border-2 border-slate-800 bg-slate-900/90` | `border-2 border-slate-200 bg-white shadow-xl` |
| **Kiosk Nächste Partien** | `border-slate-800 bg-slate-900/70` | `border-slate-200 bg-white shadow-md text-slate-900` |
| **Kiosk Footer Bar** | `border-slate-800 bg-slate-900/90 text-white` | `border-slate-200 bg-white/95 text-slate-900 shadow-lg` |
| **Admin Header & Subnav** | `border-slate-800 bg-slate-900 text-white` | `border-slate-200 bg-white text-slate-900 shadow-sm` |
| **Login Seite & Box** | `bg-slate-900` / Kachel: `bg-slate-950` | `bg-slate-50` / Kachel: `bg-white border-slate-200 shadow-xl` |
| **Login Input Fields** | `border-slate-800 bg-slate-900 text-white` | `border-slate-300 bg-white text-slate-900` |
| **Guest LiveHeroCard** | `bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950` | `border-blue-100 bg-gradient-to-br from-blue-50/60 via-white to-indigo-50/40 text-slate-900` |
| **Guest Admin-Button** | `bg-slate-900 text-white` | `bg-blue-600 text-white hover:bg-blue-500` |
| **Admin Timer Secondary Buttons** | `bg-slate-900 border-slate-800 text-slate-300` | `bg-white border border-slate-300 text-slate-700 hover:bg-slate-100` |

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Datenmodell (`DATABASE.md`)
- Keine Änderungen erforderlich. Alle Datenstrukturen bleiben unverändert.

### 6.2 TypeScript Interfaces (`src/types/`)
- Keine Änderungen erforderlich.

### 6.3 State & Firestore Listener
- Unverändert. Alle Subscriptions bleiben intakt.

### 6.4 CSS & Tailwind
- In `src/index.css` wird der Block `.dark { ... }` vollständig entfernt.
- In `tailwind.config.js` wird die Eigenschaft `darkMode: ["class"]` entfernt.

---

## 7. Edge Cases & Fehlerbehandlung

- **Lesbarkeit von Team-Logos**:
  - Logos mit weißem Hintergrund oder transparenter PNG-Grafik: Auf weißem/hellgrauem Hintergrund (`bg-slate-50`, `bg-white`) heben sich transparente und farbige Club-Logos natürlich ab.
  - Reine weiße Logos ohne Kontur: Bei Teams mit rein weißem Logo sorgt die dezent getönte Logo-Box (`bg-slate-100/80` oder `border-slate-200`) für ausreichenden Kontrast.
- **TV-Darstellung im Kiosk**:
  - Große TV-Panels mit automatischer Helligkeitsregelung: Helle Oberflächen verhindern störende Spiegelungen des Hallenlichts im Vergleich zu tiefschwarzen Flächen.

---

## 8. Verifikations- & Testplan

### 8.1 Manuelle Tests
1. [ ] **Kiosk (`/kiosk`)**:
   - Folie 1 (Live-Scoreboard): Prüfen, ob Karte weiß, Spielstand tiefschwarz und Logos sauber sichtbar sind.
   - Folie 2 (Nächste Partien): Prüfen aller 4 Spielkarten auf hellem Hintergrund mit klaren Farbkodierungen für Live/Next.
   - Folien 3 & 4 (Tabellen): Prüfen der Tabellenkarten auf weißem Grund mit lesbaren Playoff-Markierungen.
   - Footer: Prüfen des Tickers auf weißem Hintergrund.
2. [ ] **Turnierleitung (`/admin`)**:
   - Header und Subnavigation auf weißem/hellgrauem Hintergrund prüfen.
   - Reiter Live-Desk, Teams und Spielplan aufrufen.
   - Buttons im Live-Desk (Reset, +/- 1 Min, Karte erteilen, Spiel anlegen) auf sauberes helles/blaues Design prüfen.
3. [ ] **Login (`/login`)**:
   - Abmelden und `/login` aufrufen.
   - Prüfen, ob Seite und Eingabefelder hell und einwandfrei lesbar sind.
4. [ ] **Gast-Ansicht (`/`)**:
   - Prüfen der LiveHeroCard oben auf der Startseite: Sauberer heller Verlauf, schwarze Spielstände, helle Ticker-Pills.
   - Button „Turnierleitung“ im Header prüfen.

### 8.2 Automatisierte Validierung
- [ ] `npm run lint`: Keine Linter-Fehler.
- [ ] `npm run build`: Erfolgreicher TypeScript- und Vite-Build.

---

## 9. Offene Fragen & Klärungsbedarf
- Keine. Die Vorgabe ist eindeutig: Nirgends in der App Darkmode oder dunkle Hintergründe verwenden.
