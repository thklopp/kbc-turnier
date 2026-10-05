# Projekt-Roadmap & Meilensteine (TASKS)

Dieses Dokument erfasst alle Aufgaben, Meilensteine und den Entwicklungsfortschritt der **KBC Hallenhockey-Turnierverwaltung**. Änderungen an den Spezifikationen müssen hier und in den zugehörigen SDD-Dateien nachgeführt werden.

---

## 📌 Meilenstein-Übersicht

- [x] **Meilenstein 0: Initiales Projekt-Setup & SDD-Dokumentation**
- [x] **Meilenstein 1: Basis-Infrastruktur, Routing & Firebase-Anbindung**
- [x] **Meilenstein 2: Admin-Bereich – Teamverwaltung & Medien-Upload (Logo + MP3)**
- [x] **Meilenstein 3: Admin-Bereich – Zeitkonfiguration & Spielplan-Generierung**
- [ ] **Meilenstein 4: Admin-Bereich – Kampfgericht Live-Desk & Torjingle-Playback**
- [ ] **Meilenstein 5: Öffentliche Gast-Ansicht – Spielplan, Live-Ticker & Tabellen**
- [ ] **Meilenstein 6: Hallen-Kiosk – TV-Display & automatisierte Rotation**
- [ ] **Meilenstein 7: End-to-End Tests, Optimierung & Railway Deployment**

---

## 📋 Detaillierte Meilenstein-Planung

### Meilenstein 0: Initiales Projekt-Setup & SDD-Dokumentation
- [x] Erstellung aller SDD-Dokumente (`README.md`, `ARCHITECTURE.md`, `DATABASE.md`, `TASKS.md`, `AGENTS.md`, `CONTRIBUTING.md`, `VERSIONING.md`).
- [x] Initialisierung des Vite-Projekts mit React 18/19 & TypeScript.
- [x] Git-Repository initialisieren und saubere `.gitignore` konfigurieren.
- [x] Installation und Konfiguration von Tailwind CSS & PostCSS.
- [x] Initialisierung von `shadcn/ui` (Design-Tokens, Utility-Funktionen, Theme).
- [x] Installation von `react-router-dom` und `firebase`.
- [x] Bereitstellung der `.env.example` Datei für alle Firebase-Konfigurationskeys.
- [x] Erstellung des Multi-Stage `Dockerfile` und `nginx.conf` für Railway.

---

### Meilenstein 1: Basis-Infrastruktur, Routing & Firebase-Anbindung
- [x] Firebase SDK Client initialisieren (`src/lib/firebase.ts`).
- [x] React Router einrichten mit Routen:
  - `/` -> Guest Layout & Hauptansicht
  - `/admin` -> Admin Layout & Login-Guard
  - `/kiosk` -> Minimales Fullscreen Kiosk Layout
- [x] Authentication Context (`AuthContext`) für Kampfgericht-Login via Firebase Auth.
- [x] Responsive Navigation / Header mit Turnierstatus und Datumsanzeige.
- [x] Theme & Styling Konsistenz sicherstellen (Hockey-Branding, Kontraste).

---

### Meilenstein 2: Admin-Bereich – Teamverwaltung & Medien-Upload (Logo + MP3)
- [x] UI-Übersicht aller 16 Teams (Filter nach `mU14` / `wU14` und Gruppe A/B).
- [x] Team-Editor-Modal: Name, Kürzel, Gruppe, Geschlecht bearbeiten.
- [x] Logo-Upload nach Firebase Storage (`/teams/{teamId}/logo.*`) mit Bildvorschau.
- [x] Torjingle-Upload nach Firebase Storage (`/teams/{teamId}/jingle.mp3`).
- [x] Integrierter Audio-Player zum Probehören des Torjingles direkt in der Team-Tabelle.
- [x] Validierung: Max. Dateigrößen (Logo: 2MB, Jingle: 5MB MP3) und MIME-Types.

---

### Meilenstein 3: Admin-Bereich – Zeitkonfiguration & Spielplan-Generierung
- [x] Konfigurationsmaske für globale Turnierzeiten:
  - Spielzeit (Minuten)
  - Pausendauer (Minuten)
  - Startzeit Samstag (Standard 10:00 Uhr)
  - Startzeit Sonntag (Standard 09:00 Uhr)
- [x] Automatisierter Spielplan-Generator:
  - Samstag: 24 Gruppenspiele (2 Gruppen à 4 Teams pro Geschlecht)
  - Einhaltung der Vorgabe: Strikt 2 Mädchenspiele (`wU14`), gefolgt von 2 Jungsspielen (`mU14`)
  - Sonntag: 16 Finalspiele (Platzierungsspiele & Halbfinals/Finals)
- [x] Zeit-Kaskadierung: Möglichkeit, den gesamten Spielplan bei Verzögerungen um X Minuten nach hinten zu verschieben.
- [x] Manuelle Editiermöglichkeit einzelner Spiele (Verschieben, Paarungsänderung).

---

### Meilenstein 4: Admin-Bereich – Kampfgericht Live-Desk & Torjingle-Playback
- [ ] Kampfgericht-Steuerkonsole für das aktuell laufende Spiel:
  - Spieluhr (Start, Stopp, Reset, Restzeit-Anzeige)
  - Tor-Eingabe (Heim / Gast) mit Erfassung der Spielminute
  - Schneller Torjingle-Auslöser: Beim Torerfolg spielt der Jingle des Teams unmittelbar ab
  - Manueller Soundboard-Button für Schlusshorn & Hallenjingles
  - Verwarnungen & Zeitstrafen (Grüne Karte, Gelbe Karte) mit automatischem Strafzeit-Countdown
- [ ] Spiel beenden und automatischer Übergang zum nächsten Spiel.

---

### Meilenstein 5: Öffentliche Gast-Ansicht – Spielplan, Live-Ticker & Tabellen
- [ ] Mobil-optimierter Live-Hero für die aktuell laufende Partie (Echtzeit-Score & Spielminute via `onSnapshot`).
- [ ] Filterbarer Spielplan (nach Tag, Geschlecht `mU14`/`wU14`, Gruppe A/B).
- [ ] Live-Tabellen: Automatische Berechnung von Punkten, Toren, Gegentoren und Tordifferenz.
- [ ] Team-Detailansichten mit Logo, Kader und bisherigen Spielergebnissen.

---

### Meilenstein 6: Hallen-Kiosk – TV-Display & automatisierte Rotation
- [ ] Vollbild-Layout optimiert für 1080p / 4K Monitore ohne störende Scrollbalken.
- [ ] Live-Scoreboard mit Teamlogos, aktuellem Spielstand und Spieluhr.
- [ ] Automatische Bildlauf- oder Ticker-Rotation (Live-Spiel -> Nächste Spiele -> Tabellenstand).
- [ ] Wiederverbindungssicherheit bei instabilem Hallen-WLAN (Offline-Hinweis, automatischer Reconnect).

---

### Meilenstein 7: End-to-End Tests, Optimierung & Railway Deployment
- [ ] End-to-End Test des gesamten Turnierablaufs (Simulieren aller 40 Spiele).
- [ ] Audio-Latenz- und Kompatibilitätstest auf Mobilgeräten und Desktop.
- [ ] Multi-Stage Dockerfile verifizieren (`docker build`).
- [ ] Nginx SPA-Routing auf Railway testen (Deep Links wie `/admin` oder `/kiosk` dürfen keinen 404 erzeugen).
- [ ] Finale Abnahme und Übergabe an den Nutzer.
