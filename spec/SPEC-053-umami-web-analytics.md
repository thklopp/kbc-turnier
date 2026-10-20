# SPEC-053: Umami Web Analytics Integration

> **Status**: In Abnahme  
> **Typ**: Feature  
> **Branch**: `feat/SPEC-053-umami-web-analytics`  
> **Autor**: Antigravity  
> **Erstellt am**: 2026-10-20  
> **Letzte Änderung**: 2026-10-20  
> **Betroffene Bereiche**: Gast-Ansicht (`/`), Betreuer-Bereich (`/team`, `/jingle`), Infrastruktur (`nginx.conf`, `.env`)  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Für das KBC Hallenhockey-Turnier existieren aktuell vier Hauptbereiche:
1. Mobile Gäste- & Zuschaueransicht (`/`, `/info`, `/impressum`)
2. Kiosk-Modus für Großbildschirme (`/kiosk`)
3. Turnierleitungs-Adminbereich (`/admin`)
4. Betreuer-Links (`/team/:token`, `/jingle/:token`)

Aktuell gibt es keinerlei Einblick in die tatsächliche Nutzung: Wie viele Zuschauer rufen den Spielplan auf? Werden die Turnier-Infos gelesen? Wie viele Betreuer öffnen ihren Mannschaftslink?
Ein herkömmliches Tracking (z. B. Google Analytics) erfordert jedoch Cookies, Zustimmungsbanner (Consent-Banner) und speichert personenbezogene Daten, was für ein Jugendturnier unpassend und störend auf mobilen Endgeräten ist.

### 1.2 Zielzustand & Mehrwert
Integration von **Umami Web Analytics** als privacy-freundliche, DSGVO-konforme und cookie-freie Analyselösung:
- **Kein Cookie-Banner**: Umami setzt weder Cookies noch speichert es IP-Adressen oder persönliche Nutzerprofile.
- **Echtzeit- und Verlaufsdaten**: Erfassung von Pageviews, eindeutigen Geräten (Unique Visitors), Verweildauer und Endgeräten (Mobile/Desktop, iOS/Android).
- **Gezielter Scope**: Nur die Gästeansicht und Betreuerlinks werden erfasst; der Hallen-Kiosk und der Adminbereich bleiben trackingfrei.
- **Sicherheit & Token-Schutz**: Geheime Betreuer-Tokens in der URL (`/team/<SECRET_TOKEN>`) werden vor der Übertragung automatisch maskiert (`/team`), sodass keine Zugangsdaten in Analytics auftauchen.

---

## 2. User Stories

- **US-1**: Als **Turnierleitung** möchte ich sehen, wie viele Besucher die Gästeansicht am Turniertag nutzen und welche Seiten am beliebtesten sind, um das Interesse der Zuschauer zu verstehen.
- **US-2**: Als **Turnierleitung** möchte ich sehen, ob und wie intensiv die Betreuer-Links aufgerufen werden, um zu wissen, ob Teams ihre Kader/Jingles pflegen.
- **US-3**: Als **Zuschauer / Gast** möchte ich die Turnierwebseite ohne störende Cookie-Banner oder Datenschutzbedenken auf meinem Smartphone nutzen können.
- **US-4**: Als **Entwickler / Admin** möchte ich, dass sensible Betreuer-Tokens niemals unmaskiert an Drittanbieter-Services übertragen werden.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)
- [x] **Konfigurierbare Einbindung**: Das Tracking-Skript wird über die Umgebungsvariable `VITE_UMAMI_WEBSITE_ID` und optional `VITE_UMAMI_HOST_URL` (Standard: `https://cloud.umami.is`) gesteuert. Ist die Variable leer (z. B. in lokalen Tests), wird kein Skript geladen.
- [x] **Single-Page-Application (SPA) Tracking**: Dynamische Erkennung von internen React-Router-Routenwechseln (`/`, `/info`, `/impressum`).
- [x] **Ausschluss von Admin und Kiosk**: Routen unter `/admin` und `/kiosk` werden explizit **nicht** getrackt.
- [x] **Token-Maskierung für Betreuer-Links**: Aufrufe von `/team/:token` und `/jingle/:token` werden vor dem Absenden an Umami zu `/team` bzw. `/jingle` normalisiert.
- [x] **Content-Security-Policy (CSP)**: Standardmäßig keine Restriktionen, Dokumentation vorhanden.
- [x] **Konfigurations-Dokumentation**: Aufnahme von `VITE_UMAMI_WEBSITE_ID` in `.env.example` und `README.md`.

### 3.2 Explizit Out-of-Scope (Nicht Teil dieser Spec)
- Sportliche Turnier-Kennzahlen (Torschützen, Gesamttore, Kadergrößen): Diese werden in einer separaten Spezifikation (`/stats` Dashboard) behandelt.
- Self-Hosting von Umami: Es wird der offizielle, kostenlose Cloud-Dienst von Umami (`cloud.umami.is`) verwendet.
- Tracking von Admin-Aktionen oder Kiosk-Zyklen.

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien
- [x] **AC-1: Gästeansicht wird getrackt**
  - **Gegeben sei**: `VITE_UMAMI_WEBSITE_ID` ist konfiguriert und ein Gast öffnet `/`.
  - **Wenn**: Der Gast zwischen Spielplan (`/`) und Info (`/info`) wechselt.
  - **Dann**: Wird für jede aufgerufene Seite ein Pageview an Umami gesendet.

- [x] **AC-2: Kiosk und Admin werden ignoriert**
  - **Gegeben sei**: Ein Hallen-Display lädt `/kiosk` oder ein Admin arbeitet unter `/admin`.
  - **Wenn**: Die Seite geladen oder navigiert wird.
  - **Dann**: Wird kein Pageview-Event an Umami übermittelt.

- [x] **AC-3: Betreuer-Token wird maskiert**
  - **Gegeben sei**: Ein Betreuer klickt auf seinen Link `/team/KHC-MU14-3a9f82bc71de...`.
  - **Wenn**: Die Seite geladen wird.
  - **Dann**: Registriert Umami den Aufruf als URL `/team` (oder `/team/kader`), der geheime Token wird zu keinem Zeitpunkt im Umami-Dashboard sichtbar.

- [x] **AC-4: Deaktivierung bei fehlender ID**
  - **Gegeben sei**: `VITE_UMAMI_WEBSITE_ID` ist in `.env` nicht gesetzt oder leer.
  - **Wenn**: Die Anwendung gestartet und genutzt wird.
  - **Dann**: Wird kein externes Umami-Skript nachgeladen und es entstehen keine Netzwerkfehler in der Browser-Konsole.

### 4.2 Allgemeine Qualitätskriterien
- [x] Keine Hardcodierung von Website-IDs im Quellcode (`AGENTS.md`).
- [x] 100 % TypeScript-Typisierung ohne `any`.
- [x] `npm run build` und Linting laufen fehlerfrei durch.
- [x] Keine Einbußen bei der Ladezeit auf Smartphones.

---

## 5. UI/UX & Interaktionskonzept

- **Sichtbarkeit**: Für den Endnutzer vollkommen unsichtbar. Kein Cookie-Banner, keine Popups, keine Zustimmungsdialoge.
- **Performance**: Das Skript lädt asynchron (`defer`) und blockiert das Rendern der Turnierdaten zu keinem Zeitpunkt.
- **Analytics-Einsicht**: Das Betrachten der Statistiken erfolgt im Umami Cloud Dashboard (oder über einen geteilten Share-Link für das Turnierleitungsteam).

---

## 6. Technische Umsetzung

### 6.1 Umgebungsvariablen
In `.env.example` und Railway:
```env
# Umami Web Analytics (optional, leer lassen zum Deaktivieren)
VITE_UMAMI_WEBSITE_ID=
VITE_UMAMI_HOST_URL=https://cloud.umami.is
```

### 6.2 Tracking-Komponente / Hook (`src/components/common/UmamiAnalytics.tsx` oder `useAnalytics.ts`)
Ein kleiner Listener oder React-Hook auf den Router (`useLocation`):
```typescript
// Prüft Pfad, filtert /admin und /kiosk, maskiert /team/:token -> /team
// und sendet saubere Pageviews via window.umami.track(pageViewUrl)
```

### 6.3 Nginx Content-Security-Policy (`nginx.conf`)
Erweiterung der Direktiven:
* `script-src ... https://cloud.umami.is;`
* `connect-src ... https://cloud.umami.is https://api-gateway.umami.dev;`

---

## 7. Verifikation & Testplan

1. **Lokal-Test (Ohne ID)**:
   - App starten, Konsole prüfen: Keine Umami-Requests, keine Fehler.
2. **Lokal-Test (Mit Test-ID)**:
   - Dummy-ID setzen, `/` aufrufen: Network-Tab zeigt Aufruf an `cloud.umami.is/script.js`.
   - `/team/ABC-123` aufrufen: Payload im Network-Tab verifizieren (URL muss `/team` lauten, nicht `/team/ABC-123`).
   - `/admin` und `/kiosk` aufrufen: Keine Tracking-Requests.
3. **Build-Verifikation**:
   - `npm run build` muss fehlerfrei durchlaufen.
