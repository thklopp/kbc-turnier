# KBC Hallenhockey-Turnierverwaltung 🏑

Eine moderne, echtzeitfähige Web-Applikation zur Durchführung und Begleitung von Hallenhockey-Turnieren (speziell ausgelegt für mU14 & wU14 Turniere). Entwickelt nach den Prinzipien des **Spec Driven Development (SDD)**.

---

## 🎯 Überblick & Kernfeatures

- **16 Teams & 2 Wettbewerbe**: 8x mU14 (männliche U14) und 8x wU14 (weibliche U14).
- **Medienverwaltung**: Für jedes Team wird ein Wappen/Logo und ein individueller Torjingle (MP3) gepflegt.
- **Dynamische Zeitsteuerung**: Spielzeit (Standard: 20 Min.), Pausen (Standard: 5 Min.) sowie Startzeiten (Sa: 10:00 Uhr, So: 09:00 Uhr) sind über die Turnierleitung konfigurierbar und bei Turnierverzögerungen flexibel verschiebbar.
- **1-Platz-System mit festem Wechselrhythmus**: Strikt 2 Mädchenspiele gefolgt von 2 Jungsspielen.
- **Echtzeit-Aktualisierung (Firestore `onSnapshot`)**: Alle Spielstände, Zeiten und Tabellen aktualisieren sich sekundenschnell ohne manuelles Neuladen.
- **Torjingle-Player in der Turnierleitung**: Bei Tor-Eingabe kann der Audio-Jingle des jeweiligen Teams sofort per Klick abgespielt werden.

---

## 🗺️ Rollen & Routen

| Pfad | Zielgruppe | Beschreibung |
| :--- | :--- | :--- |
| `/` | **Gäste / Zuschauer** | Übersichtlicher Spielplan, Live-Ticker des aktuellen Spiels, Gruppen- und Finaltabellen, Teamübersichten. Für Smartphones optimiert. |
| `/admin` | **Turnierleitung** | Geschützter Bereich (Firebase Auth). Teamverwaltung (Logos, Jingles), globale Zeitkonfiguration, Live-Spielsteuerung (Tore, Karten, Timer, Jingle-Playback). |
| `/kiosk` | **Hallen-Monitore (TV-Modus)** | Großformatige Vollbild-Ansicht für Bildschirme in der Halle. Automatisches Umschalten zwischen aktuellem Live-Spiel, nächster Partie und Live-Tabellen. |

---

## 🛠️ Tech-Stack

- **Frontend**: React 18/19, TypeScript, Vite
- **Styling**: Tailwind CSS & [shadcn/ui](https://ui.shadcn.com/)
- **Routing**: React Router DOM (v6+)
- **Backend & Cloud Services**: Firebase
  - **Cloud Firestore**: Dokumenten-Datenbank für Live-Spielstände, Spielpläne, Tabellen & Konfiguration
  - **Firebase Storage**: Speicherung von Team-Logos (Bilder) und Torjingles (MP3-Dateien)
  - **Firebase Authentication**: Authentifizierung der Turnierleitung
- **Hosting & Deployment**: Railway via Multi-Stage Dockerfile (Node Build + Nginx Alpine)

---

## 🚀 Firebase Setup Schritt-für-Schritt

Um das Projekt mit einem eigenen Firebase-Projekt zu verbinden, führe die folgenden Schritte durch:

### 1. Firebase-Projekt erstellen
1. Öffne die [Firebase Console](https://console.firebase.google.com/).
2. Klicke auf **"Projekt hinzufügen"** (z. B. Projektname: `kbc-turnier`).
3. Google Analytics kann optional deaktiviert oder aktiviert werden. Klicke auf **"Projekt erstellen"**.

### 2. Web-App registrieren & Config-Keys abrufen
1. Klicke in der Projektübersicht auf das **Web-Symbol** (`</>`), um eine Web-App anzulegen.
2. Gib einen Spitznamen ein (z. B. `kbc-turnier-web`) und klicke auf **"App registrieren"**.
3. Kopiere die Werte aus dem Objekt `firebaseConfig`:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`
4. Erstelle im Projekt-Hauptverzeichnis eine `.env` Datei (Kopie von `.env.example`) und trage diese Werte dort ein:
   ```env
   VITE_FIREBASE_API_KEY=dein_api_key
   VITE_FIREBASE_AUTH_DOMAIN=dein_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=dein_project_id
   VITE_FIREBASE_STORAGE_BUCKET=dein_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=deine_sender_id
   VITE_FIREBASE_APP_ID=deine_app_id
   ```

### 3. Cloud Firestore aktivieren
1. Wähle im linken Menü **Erstellen** > **Firestore-Datenbank**.
2. Klicke auf **"Datenbank erstellen"**.
3. Wähle einen Standort nahe an deinem Veranstaltungsort (z. B. `europe-west3` für Frankfurt oder `europe-west1` für Belgien).
4. Starte für die Entwicklung im **Testmodus** (oder siehe [DATABASE.md](./DATABASE.md) für produktive Security Rules).

### 4. Firebase Storage aktivieren
1. Wähle im linken Menü **Erstellen** > **Storage**.
2. Klicke auf **"Jetzt starten"**.
3. Bestätige die Sicherheitsregeln und den Bucket-Standort (identisch mit Firestore).

### 5. Firebase Authentication aktivieren
1. Wähle im linken Menü **Erstellen** > **Authentication**.
2. Klicke auf **"Jetzt starten"**.
3. Aktiviere unter **Anmeldemethode** den Provider **E-Mail/Passwort**.
4. Lege unter **Nutzer** mindestens einen Account für die Turnierleitung an.

---

## 💻 Lokale Entwicklung

```bash
# 1. Abhängigkeiten installieren
npm install

# 2. Umgebungsvariablen prüfen
cp .env.example .env
# Trage deine Firebase-Werte in .env ein

# 3. Entwicklungsserver starten
npm run dev

# 4. Production Build testen
npm run build
npm run preview
```

---

## 🚢 Deployment (Railway)

Das Projekt enthält ein für Railway optimiertes Multi-Stage `Dockerfile`:
1. **GitHub Repository verbinden**: Erstelle ein neues Projekt auf [Railway](https://railway.app) und verbinde dieses GitHub-Repository.
2. **Umgebungsvariablen**: Hinterlege in den Railway Project Settings die `VITE_FIREBASE_*` Umgebungsvariablen, damit sie beim Docker-Build zur Verfügung stehen.
3. **Automatischer Build**: Railway baut das Dockerfile (Node-Build) und hostet das Ergebnis über einen schlanken Nginx-Container auf Port `80` (bzw. `$PORT`).

---

## 📖 Dokumentation (Spec Driven Development)

- [spec/README.md](./spec/README.md) – Spezifikations-Richtlinien, Vorlage & Lifecycle für neue Features und Bugfixes.
- [ARCHITECTURE.md](./ARCHITECTURE.md) – Detaillierte Systemarchitektur, Datenfluss und Docker/Railway-Setup.
- [DATABASE.md](./DATABASE.md) – NoSQL-Datenmodell (Collections, Schemas & Security Rules).
- [TASKS.md](./TASKS.md) – Roadmap, Meilensteine und Backlog.
- [AGENTS.md](./AGENTS.md) – Rolle, Verhaltensrichtlinien und Qualitätsstandards für AI-Agenten.
- [CONTRIBUTING.md](./CONTRIBUTING.md) – Git-Workflow, Branching-Strategie und Commit-Konventionen.
- [VERSIONING.md](./VERSIONING.md) – Semantic Versioning und Release-Prozess.
