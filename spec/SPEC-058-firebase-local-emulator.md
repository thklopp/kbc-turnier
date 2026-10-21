# SPEC-058: Firebase Local Emulator Suite & Testdaten-Synchronisation

> **Status**: Abgeschlossen  
> **Typ**: Feature / Tooling  
> **Branch**: `feat/SPEC-058-firebase-local-emulator`  
> **Autor**: Antigravity  
> **Erstellt am**: 2026-10-21  
> **Letzte Änderung**: 2026-10-21  
> **Betroffene Bereiche**: Datenbank/Firestore | Audio/Storage | Entwicklungs- & Testumgebung  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Bislang verbindet sich die lokale Entwicklungsumgebung (`npm run dev`) direkt mit der produktiven Firebase-Instanz (`config`, `teams`, `matches`, `corners`, `auditLogs`). Zwar gibt es in `src/lib/firebase.ts` eine statische Fallback-Mock-Konfiguration, diese bietet jedoch keine funktionierende Firestore- oder Storage-Verbindung. 

Werden im Leitstand, bei Schiedsrichter-Aktionen oder Spielplanänderungen Tests durchgeführt, besteht die Gefahr:
1. Versehentlich echte Turnierdaten, Spielstände oder Kader in der Production-Datenbank zu verfälschen oder zu löschen.
2. Unnötige Cloud-Read/Write-Kosten und Quotas bei intensiven Tests oder Entwicklungen zu verbrauchen.
3. Offline oder ohne stabile Internetverbindung nicht testen zu können.

### 1.2 Zielzustand & Mehrwert
- Vollwertige **Firebase Local Emulator Suite** (Firestore, Storage, Authentication) mit integriertem Web-UI (`http://localhost:4000`).
- **Gefahrloses Testen**: Alle Lese- und Schreibzugriffe der App landen im lokalen Speicher des Emulators.
- **Testdaten-Synchronisation**: Ein schlankes Skript zieht auf Knopfdruck einen Snapshot der aktuellen Production-Daten (`config`, `teams`, `matches`, `corners`, `players`, `auditLogs`) und ein zweites Skript (bzw. `--import`) befüllt den Emulator damit.
- **Einfache Umschaltung**: Ein Flag `VITE_USE_FIREBASE_EMULATOR=true` in `.env` steuert, ob die App lokal mit dem Emulator oder mit Firebase Cloud kommuniziert.

---

## 2. User Stories

- **US-1**: Als **Entwickler / Tester** möchte ich die App lokal gegen einen Firebase-Emulator ausführen können, um neue Features, Zeitabläufe oder Ergebniseingaben ohne Risiko für die echten Daten durchzuspielen.
- **US-2**: Als **Entwickler** möchte ich die aktuellen Daten aus der Produktions-Datenbank mit einem einfachen CLI-Befehl exportieren können, um eine realistische Testumgebung zur Verfügung zu haben.
- **US-3**: Als **Entwickler** möchte ich den lokalen Emulator mit den exportierten Testdaten initialisieren können, sodass nach dem Start alle Teams, Spielpläne und Einstellungen sofort verfügbar sind.
- **US-4**: Als **Entwickler** möchte ich über die Emulator-UI (Browser) Dokumente und Storage-Einträge inspizieren und modifizieren können.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)
- [x] **Firebase Emulator Konfiguration (`firebase.json`)**:
  - Konfiguration für Firestore (Port 8080), Auth (Port 9099), Storage (Port 9199) und Emulator UI (Port 4000).
- [x] **Anpassung `src/lib/firebase.ts`**:
  - Automatische Verbindung zu den Emulatoren (`connectFirestoreEmulator`, `connectAuthEmulator`, `connectStorageEmulator`), wenn `VITE_USE_FIREBASE_EMULATOR === "true"`.
- [x] **Export-Skript (`scripts/exportProdData.ts`)**:
  - Exportiert alle relevanten Collections (`config`, `teams` inkl. `players`, `matches`, `corners`, `auditLogs`) in eine lokale JSON-Datei (`backup/production_snapshot.json`).
- [x] **Import-Skript (`scripts/importEmulatorData.ts`)**:
  - Liest `backup/production_snapshot.json` ein und schreibt die Daten in den lokalen Emulator mit automatischer Timestamp-Wiederherstellung.
- [x] **NPM Skripte in `package.json`**:
  - `npm run emulators`: Startet die Emulator Suite mit persistenter Datenablage (`backup/emulator_data`).
  - `npm run data:export`: Führt den Export aus der Production-DB durch.
  - `npm run data:import`: Spielt den Export in den lokalen Emulator ein.
- [x] **Dokumentation in `README.md`**:
  - Kurzanleitung zur Einrichtung und Nutzung des Emulators und der Testdaten.

### 3.2 Explizit Out-of-Scope
- Download von Gigabytes an Audio-Jingles auf die lokale Festplatte (Audio-URLs in Firestore verweisen weiterhin auf die bestehenden URLs oder Mock-Jingles).
- Automatischer Cronjob für Backups in der Cloud (das Skript dient der gezielten Testdaten-Initialisierung).

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien
- [x] **AC-1: Start des Emulators**
  - **Gegeben sei**: Die Firebase-Tools sind installiert und `firebase.json` ist vorhanden.
  - **Wenn**: `npm run emulators` ausgeführt wird.
  - **Dann**: Starten Firestore (8080), Auth (9099), Storage (9199) und das UI (4000) ohne Fehler.

- [x] **AC-2: Verbindungsaufbau der Vite-App zum Emulator**
  - **Gegeben sei**: In `.env` ist `VITE_USE_FIREBASE_EMULATOR=true` gesetzt und der Emulator läuft.
  - **Wenn**: Die App mit `npm run dev` gestartet und aufgerufen wird.
  - **Dann**: Greift die App auf `localhost:8080` (Firestore) zu, in der Browser-Konsole erscheint ein Hinweis ("Verbunden mit Firebase Emulatoren"), und Änderungen in der App betreffen ausschließlich die Emulator-Daten.

- [x] **AC-3: Daten-Export aus Production**
  - **Gegeben sei**: Gültige Firebase-Credentials in `.env`.
  - **Wenn**: `npm run data:export` ausgeführt wird.
  - **Dann**: Werden alle Collections (`config`, `teams`, `matches`, `corners`, `auditLogs`) gelesen und in `backup/production_snapshot.json` gespeichert.

- [x] **AC-4: Daten-Import in den Emulator**
  - **Gegeben sei**: Eine erstellte `backup/production_snapshot.json` und ein laufender Emulator.
  - **Wenn**: `npm run data:import` ausgeführt wird.
  - **Dann**: Werden alle Dokumente und Collections im Firestore-Emulator angelegt und sind in der Emulator-UI (`http://localhost:4000/firestore`) sowie in der App sichtbar.

- [x] **AC-5: Schutz der Produktionsdaten**
  - **Gegeben sei**: `VITE_USE_FIREBASE_EMULATOR=true`.
  - **Wenn**: In `/admin` ein Spiel manipuliert, ein Team geändert oder gelöscht wird.
  - **Dann**: Bleibt die echte Produktions-Datenbank in Firebase unverändert.

### 4.2 Allgemeine Qualitätskriterien
- [x] Keine hardcodierten Pfade oder IDs.
- [x] Vollständige TypeScript-Typisierung ohne `any`.
- [x] Build (`npm run build`) und Linter (`npm run lint`) laufen fehlerfrei durch.

---

## 5. Technische Architektur & Änderungen

### 5.1 Dateien & Komponenten
- `firebase.json`: Emulator-Ports und Regeln-Pfade definieren.
- `firestore.rules` & `storage.rules`: Lokale Regel-Dateien für den Emulator (erlauben Lese-/Schreibzugriffe im Emulator).
- `src/lib/firebase.ts`: Prüfung von `import.meta.env.VITE_USE_FIREBASE_EMULATOR`.
- `scripts/exportProdData.ts`: Snapshot-Extraktion via Firebase Client SDK.
- `scripts/importEmulatorData.ts`: Batch-Schreiben in den lokalen Emulator.
- `.env.example`: Ergänzung um `VITE_USE_FIREBASE_EMULATOR=false`.
- `package.json`: Hinzufügen von `firebase-tools` (als DevDependency) und npm-Scripts.

---

## 6. Risiken & Abhängigkeiten

- **Java-Laufzeitumgebung**: Die Firebase Emulator Suite benötigt lokal Java (JRE ab Version 11 oder höher). Falls Java nicht installiert ist, meldet die Firebase CLI dies beim ersten Start. Wir dokumentieren dies klar in der `README.md`.
- **Port-Kollisionen**: Standard-Ports (8080, 9099, 9199, 4000) müssen frei sein; alternativ in `firebase.json` anpassbar.
