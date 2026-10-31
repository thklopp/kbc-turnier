# Projekt-Roadmap & Meilensteine (TASKS)

Dieses Dokument erfasst alle Aufgaben, Meilensteine und den Entwicklungsfortschritt der **KBC Hallenhockey-Turnierverwaltung**. Änderungen an den Spezifikationen müssen hier und in den zugehörigen SDD-Dateien nachgeführt werden.

---

## 📌 Meilenstein-Übersicht

- [x] **Meilenstein 0: Initiales Projekt-Setup & SDD-Dokumentation**
- [x] **Meilenstein 1: Basis-Infrastruktur, Routing & Firebase-Anbindung**
- [x] **Meilenstein 2: Admin-Bereich – Teamverwaltung & Medien-Upload (Logo + MP3)**
- [x] **Meilenstein 3: Admin-Bereich – Zeitkonfiguration & Spielplan-Generierung**
- [x] **Meilenstein 4: Admin-Bereich – Turnierleitung Live-Desk & Torjingle-Playback**
- [x] **Meilenstein 5: Öffentliche Gast-Ansicht – Spielplan, Live-Ticker & Tabellen**
- [x] **Meilenstein 6: Hallen-Kiosk – TV-Display & automatisierte Rotation**
- [x] **Meilenstein 7: End-to-End Tests, Optimierung & Railway Deployment**

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
- [x] Authentication Context (`AuthContext`) für Turnierleitungs-Login via Firebase Auth.
- [x] Responsive Navigation / Header mit Turnierstatus und Datumsanzeige.
- [x] Theme & Styling Konsistenz sicherstellen (Hockey-Branding, Kontraste).

---

### Meilenstein 2: Admin-Bereich – Teamverwaltung & Medien-Upload (Logo + MP3)
- [x] UI-Übersicht aller 16 Teams (Filter nach `mU14` / `wU14` und Gruppe A/B).
- [x] Team-Editor-Modal: Name, Kürzel, Gruppe, Geschlecht bearbeiten.
- [x] Logo-Upload nach Firebase Storage (`/teams/{teamId}/logo.*`) mit Bildvorschau.
- [x] Torjingle-Upload nach Firebase Storage (`/teams/{teamId}/jingle.mp3`).
- [x] Integrierter Audio-Player zum Probehören des Torjingles direkt in der Team-Tabelle.
- [x] Validierung: Max. Dateigrößen (Logo: 2MB, Jingle: 10MB) und MIME-Types.
- [x] Teams & Spielplan-Plätze tauschen (SPEC-038): Atomarer Tausch zweier Teams innerhalb einer Altersklasse (gruppenintern und gruppenübergreifend) mit automatischer Spielplan- und Tabellensynchronisation.
- [x] [SPEC-059] Erhöhung des Jingle-Upload-Limits auf 10 MB (Tor- & Ecken-Jingles): Erhöhung der maximalen Dateigröße für Tor-Jingles (Admin & Self-Service) und Ecken-Jingles von 5 MB auf 10 MB (`10 * 1024 * 1024` Bytes), Aktualisierung aller Validierungen, Hinweistexte und Tests.

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
- [x] [SPEC-025] Automatische Zuordnung der Finalrunden-Paarungen aus Tabellen (HF 1, HF 2, Quali 5-8) und K.o.-Ergebnissen (Finale, Platz 3, 5, 7) mit manuellem Synchronisations-Button & Schutz vor vorzeitiger Belegung.
- [x] [SPEC-029] Tausch der Halbfinals mit den Platzierungsspielen am Sonntag (Spiele 25–28: Platzierungsspiele 1 & 2; Spiele 29–32: Halbfinale 1 & 2) für optimale Regenerationspausen (4er-Block Pause vor den Endspielen) inklusive präziser Spielnamen und Platzhaltertexte.
- [x] [SPEC-037] Admin Spielplan Action-Buttons & Filter Redesign: Eigene Zeile für Aktionsbuttons (Finalpaarungen aktualisieren, Zeiten verschieben, Spielplan zurücksetzen, Spielplan generieren) mit Beschreibungen und Sicherheitsabfragen, zerstörungsfreier Spielplan-Reset, Gruppenfilter (Alle Gruppen, Gruppe A, Gruppe B) & Entfernung des 40/40 Status-Tags.
- [x] [SPEC-039] Vorrunden-Spielplan Reihenfolge (2er-Blöcke nach Gruppe & Geschlecht) & Button-Akzente: Generierung der 24 Vorrundenspiele in geschlossenen Gruppenblöcken (2x wU14 A, 2x mU14 A, 2x wU14 B, 2x mU14 B) mit je 6 Spielen Pause je Team und dezenten Button-Akzenten (Spielplan generieren in Blau, Finalpaarungen aktualisieren in Grün).
- [x] [SPEC-043] Gruppenunabhängige Zuordnung der Finalrunden-Paarungen & Einheitliche matchName-Anzeige: Separate Auswertung von Gruppe A und Gruppe B (Zuordnung der 4 Teams sofort nach Abschluss der eigenen Gruppe, gegnerischer Slot bleibt mit Platzhalter bis Gruppenabschluss frei); einheitliche Verwendung des ungekürzten matchName auf allen Bildschirmen (Spiele 25–28: „Platzierungsspiel“, 29–32: „Halbfinale“, Medaillenspiele ausgeschrieben); Formatierung der Spielphasen-Tags im Kiosk und Spielplan analog zu den Geschlechts-Tags (Lila wU14 / Blau mU14).

---

### Meilenstein 4: Admin-Bereich – Turnierleitung Live-Desk & Torjingle-Playback
- [x] Turnierleitungs-Steuerkonsole für das aktuell laufende Spiel:
  - Spieluhr (Start, Stopp, Reset, Restzeit-Anzeige)
  - Tor-Eingabe (Heim / Gast) mit Erfassung der Spielminute
  - Schneller Torjingle-Auslöser: Beim Torerfolg spielt der Jingle des Teams unmittelbar ab
  - Manueller Soundboard-Button für Schlusshorn & Hallenjingles
  - [SPEC-006] Redesign Live-Desk: Full-Width 4-Zeilen Stack (Spielauswahl, Spieluhr, Spielstand, Soundboard), Entfernung Strafkarten, sanftes Jingle-Fade-Out & sichere Tor-Korrektur
  - [SPEC-014] Unique-Links für Teams zum eigenständigen Tor-Jingle Upload & Startzeit-Konfiguration ohne Login
  - [SPEC-016] Spieler- und Torschützen-Verwaltung: Kaderpflege (Betreuer & Admin), Live-Desk Sofort-Torerfassung mit Dropdown-Schützenzuordnung & 2-Spalten-Anzeige (Gast & Kiosk)
  - [SPEC-019] Kader-Grid Schnelleingabe (Excel-Style Roster Input): Schnelle Erfassung mit 10 Startzeilen, Tab/Enter/Pfeiltasten-Navigation, automatischer Zeilenerweiterung, Live-Duplikatwarnung & Bereinigung leerer Zeilen
  - [SPEC-042] Live-Desk Geschlechts- und Gruppen-Tags über dem Ergebnis: Dezent gestaltete Badges für Altersklasse (wU14 in Lila, mU14 in Blau) und Gruppe (z. B. „Gruppe A“, „Gruppe B“) bzw. Finalbezeichnung (z. B. „Halbfinale 1“, „Finale“) mit großzügigem Abstand zentriert über der zentralen Ergebnisanzeige im Live-Desk.
- [x] Spiel beenden und automatischer Übergang zum nächsten Spiel.

---

### Meilenstein 5: Öffentliche Gast-Ansicht – Spielplan, Live-Ticker & Tabellen
- [x] Mobil-optimierter Live-Hero für die aktuell laufende Partie (Echtzeit-Score & Spielminute via `onSnapshot`).
- [x] Filterbarer Spielplan (nach Tag, Geschlecht `mU14`/`wU14`, Gruppe A/B).
- [x] Live-Tabellen: Automatische Berechnung von Punkten, Toren, Gegentoren und Tordifferenz.
- [x] Team-Detailansichten mit Logo, Kader und bisherigen Spielergebnissen.
- [x] [SPEC-012] Spielplan-Kompaktierung (Gr. A/B, No-Wrap Score, Teamnamen-Tausch), konfigurierbare Spielnamen & Statusanzeigen.
- [x] [SPEC-026] Gästeansicht Live-Scoreboard UI-Anpassungen: Farbige Badges für Startzeit, Geschlecht und Gruppe/Spielname (Lila für wU14, Blau für mU14, Amber für Finale), Ergebnis vertikal mittig auf Logohöhe zentriert, Torchronik ohne Header, Minutenanzeige im Format '1''.
- [x] [SPEC-027] Gästeansicht Tabellen-Redesign & Navigationsreihenfolge: Tabellen ans Ende der Navigation (Live ➔ Spielplan ➔ Finalphase ➔ Tabellen), vollflächige Umschalter mit Lila (wU14) & Blau (mU14), zentrierte Tags für Geschlecht & Gruppe, Entfernung grüner Header-Badges, neutrale Ränge, Spaltentausch Tore & Punkte (SP ➔ Tore ➔ PKT), farbliche Punkte-Hervorhebung & Entfernung Wertungs-Infotext.
- [x] [SPEC-028] Gästeansicht Vorrunde & Finalrunde Umbenennung & 3-Segment Filterbuttons: Umbenennung von 'Spielplan' in 'Vorrunde' und 'Finalphase' in 'Finalrunde', Entfernung alter aufklappbarer Filterleiste und 2er-Umschalter, neue vollflächige 3-Segment-Buttons (Alle, wU14, mU14) auf Vorrunde, Finalrunde und Tabellen; Vorrunden-Kartenlayout (Kurznamen, Logos und Ergebnisbox '- : -' auf gleicher Höhe, Vereinsnamen in Zeile darunter, ausgeschriebene Gruppen-Tags, Minute im Live-Badge 'LIVE 1''); Finalrunden-Karten im selben Vorrunden-Layout mit Spielname-Tags in Geschlechtsfarbe bzw. Bernstein/Amber für das große Finale; Minute im Live-Badge auf der Live-Seite.
- [x] [SPEC-030] Gästeansicht Finalrunde nach Spielnummer sortieren & Entfernung der Überschriften/Spielanzahlen: Strikte chronologische Sortierung der Finalspiele (#25–#40) nach Spielnummer in Finalrunde, vollständige Entfernung der Zwischenüberschriften (Halbfinals, Medaillenspiele) und Entfernung der oberen Infozeilen (Titel & Spielanzahl-Badge) auf Vorrunde und Finalrunde für direkten Übergang zu den Spielkarten.
- [x] [SPEC-040] Gast-Footer Cleanup & PDF-Spielplan Download: Entfernung interner Links zu /kiosk und /admin aus dem Gast-Footer; Links 'PDF-Spielplan', Mitte 'Made with ❤️ in Rüsselsheim', Rechts 'Impressum'; Generierung und direkter Download eines 3-seitigen A4-PDF-Spielplans (Seite 1: Gruppenübersicht mit Feldern für Spiele, Tore, Punkte; Seite 2: Vorrundenspiele chronologisch; Seite 3: Finalspiele mit neutralen Vorlagen-Paarungen; einheitlicher Kopfbereich mit Vereinswappen, Turniertitel & Durchführungsbestimmungen).
- [x] [SPEC-041] Aktives Spiel & Live-Tag in Grün, Pause in Gelb-Orange, Kiosk-Next Cleanup, Tabellen-Team-Highlight & dynamische Live-Desk Buttons: Einheitlich grüne Hervorhebung für laufende Partien (Kiosk-Spielplan, Gast-Spielplan, Live-Tags), Gelb-Orange bei Pause, Entfernung der blauen Kiosk-Next-Einfärbung, Zeilen-Highlighting aktiver/pausierter Teams in den Gruppentabellen, Korrektur der Tabellenberechnung bei pausierten Spielen und dynamische Farb-/Text-Zustände der Buttons im Live-Desk (Blau/Start, Grün/Pause, Gelb/Weiter, Rot/Stop).
- [x] [SPEC-046] Endplatzierungen nach Turnierende auf Live- und Kiosk-Seite: Automatische Erkennung des Turnierendestatus (`isTournamentFinished`), deterministische Berechnung der Endplatzierungen 1 bis 8 (`calculateFinalRankings`) aus den Final- und Platzierungsspielen; Gäste-Ansicht schaltet nach dem letzten Spiel von der Pause-Meldung auf die Endplatzierungen um (3-Segment-Filter Alle/wU14/mU14, mobil untereinander, ab Tablet nebeneinander, einheitliche Rangpositions-Tags); Kiosk Slide 0 zeigt nach Turnierende wU14 und mU14 nebeneinander; Navigationsreiter bleibt 'Live' mit dynamischem Trophy-Icon nach Turnierende; neues 'Table'-Icon für die Seite Tabellen.
- [x] [SPEC-048] Vergrößerung des Abstands zwischen den Tabellen der Endplatzierungen: Gäste-Ansicht vergrößert den Abstand zwischen den beiden Geschlechtertabellen von `gap-6` auf `gap-10` (Mobil, vertikal) und `md:gap-12` (Desktop, horizontal); Kiosk-Slide 0 vergrößert den Spaltenabstand von `gap-8` auf `gap-12`.
- [x] [SPEC-049] PDF-Spielplan mit Live-/Endergebnissen und aktuellem Tabellenstand: Dynamische Ausgabe der aktuellen Gruppentabellen (Rang, Spiele, Tore mit Differenz, Punkte) auf Seite 1 über `calculateGroupStandings` bei vorhandenen Ergebnissen; Ausgabe ermittelter Ergebnisse (`${scoreHome} : ${scoreAway}`) auf Seite 2 (Vorrunde) und Seite 3 (Finalrunde); reale Teamnamen auf Seite 3 bei bereits ermittelten Finalpaarungen; Beibehaltung des Blanko-Modus vor Turnierbeginn zum handschriftlichen Eintragen.
- [x] [SPEC-050] Betreuerbereich – Tags, Hinweistext und strukturierter Linkaufbau: Getrennte Geschlechts- (`wU14`/`mU14`) und Gruppen-Tags (`Gruppe A`/`Gruppe B`) im Teambanner der Betreuerseite in den vertrauten CI-Farben (Lila für wU14, Blau für mU14); Korrektur des Hinweistextes auf verbindlich „für maximal 15 Sekunden eingespielt“; strukturierter Betreuerlink im Format `https://<DOMAIN>/team/<KURZNAME>-<MU14/WU14>-<TOKEN>` an allen Admin-Stellen (`TeamCard`, `TeamEditModal`, `TeamJingleOverviewModal`).
- [x] [SPEC-051] Live-Desk Layout-Optimierungen: Rahmenlose weiße Teambereiche; Scoreboard auf oberste Position horizontal bündig zu den Teamlogos (`sm:h-[148px]`); Tags unter das Scoreboard verschoben; Text „Live-Ergebnis“ entfernt; Ecken-Jingle-Platzhalterbutton mittig exakt auf Höhe der beiden Tor-Buttons; Integration der Torschützenlisten mit permanenter Trennlinie und Überschrift „Torschützen (0)“ direkt unter den jeweiligen Mannschaften; vollständige Entfernung des obsoleten Soundboards (`SoundboardPanel`).
- [x] [SPEC-052] Unterstützung erweiterter Audio-Formate für Torjingles: Freischaltung von `.mp3`, `.m4a`, `.aac` (inkl. `.acc`), `.wav` und `.ogg` im Admin-Bereich (`TeamEditModal`) und Betreuerbereich (`TeamJinglePage`), dynamische Dateiendung und Content-Type Metadaten im Firebase Storage (`teamService`), Beibehaltung des 5-MB-Dateilimits und nahtloses HTML5-Playback.
- [x] [SPEC-053] Umami Web Analytics Integration: DSGVO- und cookie-freies Tracking für die Gästeansicht (`/`, `/info`, `/impressum`) und Betreuerbereiche (`/team`, `/jingle`); automatische Maskierung von Secret-Tokens (`/team/:token` -> `/team`); strikter Ausschluss von `/admin` und `/kiosk`; Steuerung über `VITE_UMAMI_WEBSITE_ID`.
- [x] [SPEC-055] Info-Seite: Entfernung des blauen Headers & RRK-Logo vor dem Titel: Vollständige Entfernung des statischen blauen Gradient-Banners (Titel, Badges, Beschreibung) aus der Info-Seite (`/info`); direkte Darstellung des dynamisch im Adminbereich pflegbaren Markdown-Inhalts; Einbindung des offiziellen RRK-Vereinswappens direkt vor der H1-Hauptüberschrift (auf `/info` und in der Admin-Editor-Vorschau).
- [x] [SPEC-056] PDF-Spielplan im neuen Tab öffnen & direkte Route `/pdf`: Umstellung des Footer-Links in der Gästeansicht auf `target="_blank"` zur unterbrechungsfreien Öffnung in einem neuen Tab; Bereitstellung der eigenständigen Route `/pdf` (`PdfSchedulePage.tsx`) mit nativer Browser-PDF-Vorschau im Vollbild, Lade-Indikator, Header mit RRK-Logo, Buttons für Herunterladen, Drucken und Rückkehr zur Übersicht.
- [x] [SPEC-057] Ecken-Jingles Verwaltung und Live-Desk Playback: Neuer Administrations-Tab „Ecken-Jingles“ (`/admin#corners`) zum Upload (MP3, M4A, AAC, WAV, OGG bis 5 MB), Verwalten, Vorhören und Definieren eines Standard-Jingles; interaktiver Live-Desk Split-Button mit Dropdown zur Schnellauswahl, 15-Sekunden-Limit mit 1-Sekunden-Fade-Out und manuellem Fade-Out bei erneutem Tastendruck; Deaktivierungs-Fallback bei leeren Jingles.
- [x] [SPEC-058] Firebase Local Emulator Suite & Testdaten-Synchronisation: Einrichtung der lokalen Emulator Suite (`firebase.json`, `firestore.rules`, `storage.rules`) für Firestore (Port 8080), Auth (Port 9099), Storage (Port 9199) und Emulator-Web-UI (Port 4000); Umschaltung über `VITE_USE_FIREBASE_EMULATOR=true`; Export-Skript `scripts/exportProdData.ts` (`npm run data:export`) zum Sichern der aktuellen Produktionsdaten (`config`, `teams`, `matches`, `corners`, `players`, `auditLogs`) in `backup/production_snapshot.json`; Import-Skript `scripts/importEmulatorData.ts` (`npm run data:import`) zum Befüllen des Emulators; persistente Datenablage beim Beenden des Emulators.
- [x] [SPEC-064] Vollständiges Online-Backup mit Zeitstempel & Mediendateien (Teams, Kader, Spielplan, Jingles, Logos, Admins): Neuer Befehl `npm run backup:prod` (Alias `npm run backup`) über `scripts/backupProdData.ts`; Sicherung aller Firestore-Collections in `snapshot.json`; physischer Download aller Team-Logos, Tor-Jingles und Ecken-Jingles nach `storage/`; Export der Firebase-Auth-Benutzerkonten (Admins) via Firebase CLI nach `auth/accounts.json`; Erstellung einer `manifest.json` mit Zählern und Zeitstempel; revisionssichere Archivierung unter `backup/archive/backup-YYYY-MM-DD_HH-mm-ss/` und automatische Aktualisierung von `backup/production_snapshot.json`.
- [x] [SPEC-065] Admin Turnier-Statistiken (Top-10 Torschützen & Kennzahlen): Neuer Administrations-Tab „Statistiken“ (`/admin#stats`) mit Echtzeit-KPI-Karten (Tore Gesamt, Torschnitt pro Spiel für beendete Partien, Spieler Gesamt, Ø Kadergröße für konfigurierte Teams jeweils mit wU14/mU14 Aufteilung) sowie zwei nebeneinanderliegenden Top-10-Torschützenlisten für wU14 und mU14 mit erweiterter Sport-Rangwertung bei Torgleichstand.
- [x] [SPEC-066] Allstars-Abstimmung (Team-Wahl & Admin-Auswertung): Neuer Tab „⭐ Allstar-Wahl“ im Betreuerbereich (`/team/:token`) zur kaskadierenden Nominierung von 6 Positionen (1x TW, 2x DEF, 1x MID, 2x FWD) mit altersklassengerechter Filterung (wU14/mU14) und Duplikatsprüfung; neuer Admin-Bereich „Allstars“ (`/admin#allstars`) mit Status-Schalter (Abstimmung öffnen/sperren), Abgabematrix, Pool-Aggregation der Gewinner, Gleichstands-Warnung am Cutoff und 1-Klick-Export für Hallensprecher und Siegerehrung.
- [x] [SPEC-067] Allstar-Abstimmung: 3 Modi-Steuerung und Cleanup: Einführung der 3 Betriebsmodi (`upcoming`, `open`, `closed`) mit Segmented Control Steuerung im Admin-Header (`/admin#allstars`); vollständige Entfernung des „Kader kopieren“-Buttons; Team-Ansicht (`TeamAllstarVoting.tsx`) mit dauerhaftem Zeitplan-Hinweis („ab erstem Spiel bis 10 Min. nach Finalspiel“), reiner Info-Vorschaukarte bei `upcoming`, aktivem Formular bei `open` und gesperrten Feldern bei `closed`; serverseitige Validierung im Service.
- [x] [SPEC-068] Markdown-Seiten (Allgemeines & Essensplan), GFM-Tabellen, Spiel-Variablen & Team-Essenszeiten: Umbenennung des Admin-Reiters in „Markdown“ mit Dropdown zur Auswahl von „Allgemeines“ (`config/info`) und „Essensplan“ (`config/essen`); Unterstützung von GFM-Tabellen via `remark-gfm` inklusive responsivem Überlauf-Container; Spielvariablen-Ersetzung (`{{spiel:X:heim}}`, `{{spiel:X:gast}}`, `:kurz`) mit automatischer Auflösung im Admin-Editor und auf der Info-Seite; Sub-Navigation auf `/info` zwischen „Allgemeines“ und „Essensplan“ mit URL-Hash-Synchronisation; automatische Erkennung und prominente Anzeige der Team-Essenszeiten für Samstag und Sonntag im Betreuerbereich (`/team/:token`).
- [x] [SPEC-070] Schiedsrichter-Erfassung und -Anzeige: Zwei Eingabefelder im Bearbeiten-Dialog (`MatchEditModal`) für Schiedsrichter mit Unterstützung von Spielvariablen (`{{spiel:X:heim}}`, `{{spiel:X:gast}}`) und Freitext; Validierung (beide befüllt oder beide leer); einheitliche Darstellung mit Trennstrich, Zeile „Schiedsrichter“ und Langnamen beider Teams mit Schrägstrich im Live-Desk (`ScoreboardDisplay`), in der Gäste-Live-Hero-Karte (`LiveHeroCard`), im Kiosk-Live-Scoreboard (`KioskScoreboardSlide` auf Hauptfolie und Vorschau-Bar) sowie im Spielplan bei offenen Partien (`GuestScheduleView`, `FinalsBracketView` und `ScheduleManager`).
- [x] [SPEC-071] Spielnummer-Badge vor Altersklasse im Gäste- und Kinomodus & kompakte Finalspiel-Platzhalter: Kompaktes Badge mit `#{matchNumber}` unmittelbar vor der Altersklasse (`wU14`/`mU14`) in den Vorrunden-, Finalrunden- und Live-Ansichten des Gäste- und Kinomodus (`GuestScheduleView`, `FinalsBracketView`, `LiveHeroCard`, `KioskGroupStageSlide`, `KioskFinalsSlide`, `KioskScoreboardSlide`); Bereinigung des redundanten Subtexts in der Hero-Kachel; kompakte Platzhalter für alle Finalrunden-Spiele (`Sieger #29`, `Verlierer #31` etc.) statt `HF 1` / `HF 2` / `Spiel 29`.
- [x] [SPEC-072] Schiedsrichter-Einsätze (5 Spiele pro Team), Essenszeiten-Status, Reiter-Steuerung und Kiosk-Layout: Dauerhafte Anzeige der Essenszeit für Sonntag im Betreuerbereich (`/team/:token`) mit Status „wird ermittelt“ vor Feststehen der Platzierungen; neue Schiedsrichter-Übersichtskarte für alle 5 Schiedsrichterdienste des Teams (3 Spiele am Samstag terminiert, 2 Spiele am Sonntag mit Status „wird nach der Vorrunde ermittelt“ bzw. automatischer Auflösung nach Gruppenabschluss, Anzeige von Spielnummer, Anstoßzeit, Begegnung, Partner-Schiedsrichterteam und Spielstatus); Bündelung von Essens- und Schiedsrichterzeiten im vorangestellten Reiter „Zeiten“; globale Sichtbarkeitsumschaltung im Adminbereich für „Zeiten“ und „Allstar-Wahl“; Suche nach Kurzname + Altersklasse; optimierter unterer Kachel-Abstand im Kiosk-Live-Scoreboard und Verschiebung der Vorschau-Schiedsrichter ans Ende der 1. Zeile (zweizeilig).
- [x] [SPEC-073] Präziser Schiedsrichter- und Essenszeiten-Abgleich für Teams mit ähnlichen Kurznamen (z. B. HTC vs. NHTC): Exakte und verwechslungsfreie Zuweisung von Schiedsrichter-Einsätzen und Essenszeiten; Behebung von False-Positives durch Token-Boundary-Regex auf aufgelöste Langnamen fremder Mannschaften; strikte ID-Auflösung bei Match-Variablen; Absicherung von `getRefereeGender` und `extractTeamMealTimes` in `src/services/infoService.ts`.
- [x] [SPEC-077] Allstar Live-Drafts, Fortschritts-Tags (X/6) und Team-Identifikation: Automatischer Entwurfs-Sync (`saveTeamAllstarDraftByToken`) bei Änderungen im Betreuer-Link (`/team/:token#allstars`); Live-Fortschritts-Tags (`0/6` grau/fehlt, `1/6` bis `5/6` amber/in Bearbeitung, `6/6` grün/abgegeben) für alle Teams im Adminbereich (`/admin#allstars`); transparente Vorab-Einsicht aller Stimmen und Entwürfe im aufklappbaren Detailbereich; strikte Team-Zuordnung über permanente `teamId`; Trennung bei der offiziellen Siegerehrung (nur offiziell eingereichte Stimmzettel zählen für Allstar-Gewinner).
- [x] [SPEC-078] Vollständige Spielernamen ohne Vornamen-Abkürzung: Torschützen-Dropdown im Live-Desk (`ScoreboardDisplay`), Event-Persistierung (`matchService`) sowie reaktive Namensauflösung in Gast-Ansicht (`LiveHeroCard`) und Hallen-Kiosk (`KioskScoreboardSlide`) zeigen durchgängig den vollständigen Vor- und Nachnamen wie im Spielkader der Team-Seiten eingetragen (keine Abkürzung der Vornamen mit Initialen mehr).
- [x] [SPEC-079] Ecken-Jingle Maximallaufzeit konfigurierbar machen und Standard auf 25s anheben: Erhöhung der Standard-Maximallaufzeit von Ecken-Jingles im Live-Desk von 15s auf 25s (mit 1s Fade-Out vor Schluss); neue zentrale Konfigurationskarte in der Ecken-Jingle-Verwaltung (`/admin#corners` in `CornerJingleManager`) zur allgemeinen Einstellung der Laufzeit in Sekunden (5–120s); Persistierung im globalen Konfigurationsdokument `config/tournament` (`cornerJingleDurationSeconds`) ohne Hardcoding.
- [x] [SPEC-080] PDF-Export für Mannschaftskader (DIN A4): Druckfertiger PDF-Export der Spielkader für das Kampfgericht, Schiedsrichter und Hallensprecher; garantiert genau 1 DIN-A4-Seite im Hochformat pro Team mit großzügiger Schrift (11–12 pt), zentrierter Trikotnummer, Vor- und Nachname, Bemerkungsspalte, Unterschriftsbereich und Leerzeilen für Nachmeldungen vor Ort; Kopfbereich mit Vereinslogo (proportional skaliert, Zero-CORS über lokale Base64-Assets und Same-Origin Fallback) sowie RRK-Turnierwappen; Admin-Sammel-Download (`TeamRosterPdfModal`) für alle 16 Teams, nur wU14 oder nur mU14 sowie Einzel-Download auf jeder `TeamCard` und im `TeamEditModal`; exklusiv im Adminbereich ohne Link auf Betreuerseiten.

---

### Meilenstein 6: Hallen-Kiosk – TV-Display & automatisierte Rotation
- [x] Vollbild-Layout optimiert für 1080p / 4K Monitore ohne störende Scrollbalken.
- [x] Live-Scoreboard mit Teamlogos, aktuellem Spielstand und Spieluhr.
- [x] Automatische Bildlauf- oder Ticker-Rotation (Live-Spiel -> Nächste Spiele -> Tabellenstand).
- [x] Wiederverbindungssicherheit bei instabilem Hallen-WLAN (Offline-Hinweis, automatischer Reconnect).
- [x] [SPEC-021] Einheitlicher Monospace-Font 'Chivo Mono' (offline/lokal gebündelt) für Spielstände, Timer und Tabellen auf allen Endgeräten; Kiosk-Score auf 'font-medium' (500) abgestimmt.
- [x] [SPEC-022] Globale Harmonisierung des Font-Weights: Ersetzung aller 56 Vorkommen von 'font-black' (900) durch 'font-medium' (500) applikationsweit.
- [x] [SPEC-023] Kiosk Live-Scoreboard UI-Feinschliff & Tor-Chronik Bereinigung: Genügend Zeilenabstand für Vereinsnamen gegen abgeschnittene Buchstaben, Angleichung Badge 'Spiel #X', Entfernung Tor-Chronik Header & Entfettung Torschützen, Bereinigung Kiosk-Footer.
- [x] [SPEC-024] Kiosk-Modus Seiten-Redesign & 4-Folien-Struktur: Live-Seite mit Startzeit & zentrierten Logos/Namen ohne Trennlinien; 24-Spiele Gruppenphase & 16-Spiele Finalphase in 2 Spalten tabellarisch ausgerichtet mit Rot/Blau-Hervorhebung; 2x2 Tabellen-Matrix für alle 4 Gruppen; zentrierter Footer ohne Synchronisierungs-Text.
- [x] [SPEC-034] Kiosk Fit-to-Screen Skalierung (Virtual 1080p Stage): Feste 1920x1080 Leinwand mit responsiver CSS-Scale-Anpassung an beliebige Fenster- und Bildschirmformate (MacBook Pro, iPad Air), garantierte 1:1 Pixelidentität auf 1080p TVs.
- [x] [SPEC-044] Kiosk-Modus: Zentrierte Seitentitel (Vorrunde, Finalrunde, Tabellen) & Ausrichtung der Finalrunde auf Vorrunden-Höhe: Prominente zentrierte Überschriften auf Vorrunde, Finalrunde und Tabellen; obere Ausrichtung ('justify-start') mit einheitlichem Padding ('pt-3 pb-2') für identische vertikale Starthöhe des Spielplans bei Vorrunde und Finalrunde.
- [x] [SPEC-046] Kiosk Endplatzierungen auf Slide 0 nach Turnierende: Sobald alle Spiele beendet sind, zeigt Slide 0 des Kiosks die Endplatzierungen von wU14 und mU14 bildschirmfüllend nebeneinander mit einheitlichen Rangpositions-Tags.


---

### Meilenstein 7: End-to-End Tests, Optimierung & Railway Deployment
- [x] End-to-End Test des gesamten Turnierablaufs (Simulieren aller 40 Spiele).
- [x] Audio-Latenz- und Kompatibilitätstest auf Mobilgeräten und Desktop.
- [x] Multi-Stage Dockerfile verifizieren (`docker build`).
- [x] Nginx SPA-Routing auf Railway testen (Deep Links wie `/admin` oder `/kiosk` dürfen keinen 404 erzeugen).
- [x] Finale Abnahme und Übergabe an den Nutzer.
