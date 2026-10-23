# SPEC-062: Behebung des Link-Erzeugungsfehlers auf Mobilgeräten (/team/get-link) & Anonymous Auth

> **Status**: In Abnahme  
> **Typ**: Bugfix  
> **Branch**: `fix/SPEC-062-mobile-team-get-link-anonymous-auth-fix`  
> **Autor**: Antigravity  
> **Erstellt am**: 2026-10-23  
> **Letzte Änderung**: 2026-10-23  
> **Betroffene Bereiche**: Team-Link Self-Service (`/team/get-link`) | Routing (`AppRouter.tsx`) | Firebase Auth (`ensureAnonymousAuth`) | Betreuer-Bereich (`/team/:token`)  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Auf der Seite zur Link-Anforderung (`/team/get-link`) schlägt das Erzeugen von Team-Zugangslinks auf Mobilgeräten fehl. Es erscheint stets die rote Fehlermeldung:  
*„Fehler beim Erzeugen des Links. Bitte versuche es erneut.“*  
Auf dem Desktop hingegen funktioniert die Link-Erstellung scheinbar normal.

**Ursachenanalyse:**
1. **Firebase Anonymous Authentication deaktiviert**: Die Firestore-Sicherheitsregeln in der Produktivdatenbank verlangen für Schreibzugriffe auf `teams/{teamId}` eine Authentifizierung (`allow write: if request.auth != null;`). Für unangemeldete Besucher (wie Betreuer auf Mobilgeräten) sieht die Architektur eine transparente anonyme Firebase-Anmeldung vor (`ensureAnonymousAuth()`). Im Firebase-Projekt war das Anmeldeverfahren **„Anonym“ (Anonymous Authentication) im Identity Toolkit / Firebase Console jedoch nicht aktiviert**.
2. **Fehlende Authorized Domain**: Die Custom Domain `kbc.rrk08.club` (sowie `rrk08.club` und `kbc-turnier.pages.dev`) war in Firebase Auth nicht in den `authorizedDomains` hinterlegt. Dadurch verweigerte Firebase Auth jegliche Authentifizierungsanfragen von dieser Domain mit `auth/unauthorized-domain`.
3. **Desktop vs. Mobilgerät**: Auf dem Desktop war im Browser zuvor eine Turniertleitungs-Sitzung (`/admin`) mit E-Mail/Passwort aktiv und im Browser-Speicher (IndexedDB) persistent hinterlegt. Daher war auf dem Desktop `auth.currentUser` vorhanden und der Schreibzugriff autorisiert. Auf Mobilgeräten (sowie in privaten/Inkognito-Fenstern auf Desktop) war kein Admin angemeldet. `signInAnonymously()` warf `auth/admin-restricted-operation`, `ensureAnonymousAuth()` fing dies stumm ab, und Firestore blockierte das Update mit `permission-denied`.
4. **Fehlender Route-Alias**: Einige Nutzer rufen direkt `/get-link` anstelle von `/team/get-link` auf, was aktuell auf `/404` umleitet.

### 1.2 Zielzustand & Mehrwert
- Mobilgeräte und alle unangemeldeten Besucher können unter `/team/get-link` problemlos und ohne vorherigen Login sofort Team-Links generieren.
- Anonymous Auth ist im Firebase-Projekt aktiviert und autorisiert für `localhost`, `kbc.rrk08.club`, `rrk08.club`, `kbc-turnier.pages.dev`, `kbc-turnier.web.app` und `kbc-turnier.firebaseapp.com`.
- `ensureAnonymousAuth()` wird bereits beim Betreten der Seite `/team/get-link` im Hintergrund initiiert, sodass der Nutzer nicht erst beim Button-Klick auf den Auth-Handshake warten muss.
- Klare, aussagekräftige Fehlerdiagnose im UI und in der Konsole, falls Verbindungsprobleme auftreten.
- `/get-link` leitet als Alias direkt auf `/team/get-link` weiter.

---

## 2. User Stories

- **US-1**: Als **Betreuer oder Trainer auf einem Mobilgerät** möchte ich auf `/team/get-link` (oder `/get-link`) meinen Verein und meine Altersklasse auswählen und auf Knopfdruck einen gültigen Zugangslink erhalten, ohne dass ein Berechtigungs- oder Erzeugungsfehler auftritt.
- **US-2**: Als **Nutzer**, der versehentlich `/get-link` statt `/team/get-link` in die Adresszeile eingibt, möchte ich automatisch auf die richtige Seite weitergeleitet werden.
- **US-3**: Als **Turnierleitung/Entwickler** möchte ich im Fehlerfall eine differenzierte Fehlermeldung sehen, statt einer undifferenzierten Pauschalmeldung.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)

- [x] **FR-1: Firebase-Infrastruktur-Aktivierung (Auth & Domains)**:
  - Anonymer Authentifizierungs-Provider (`signIn.anonymous.enabled: true`) in Firebase Auth / Identity Toolkit aktivieren.
  - `kbc.rrk08.club`, `rrk08.club` und `kbc-turnier.pages.dev` in `authorizedDomains` aufnehmen.
  *(Bereits über Identity Toolkit API verifiziert und aktiv).*

- [x] **FR-2: Early Anonymous Auth Initialisierung**:
  - `TeamGetLinkPage.tsx` initialisiert beim Komponenten-Mount (`useEffect`) via `ensureAnonymousAuth()` transparent die anonyme Sitzung.
  - Dadurch ist die Authentifizierung bereits etabliert, bevor der Nutzer den Generieren-Button klickt.

- [x] **FR-3: Robuste Fehlerbehandlung & Logging in `ensureAnonymousAuth`**:
  - In `src/lib/firebase.ts` protokolliert `ensureAnonymousAuth` bei Fehlschlägen den exakten Fehlercode und wirft bei Bedarf einen klaren Fehler oder signalisiert den Status an den Aufrufer.

- [x] **FR-4: Differenzierte Fehlermeldung in `TeamGetLinkPage.tsx`**:
  - Bei `permission-denied`: Hinweis auf Authentifizierungs-/Berechtigungsproblem.
  - Bei Netzwerk-/Offline-Fehlern: Hinweis auf Verbindungsunterbrechung.
  - Allgemeine Fehler: Fallback mit technischem Detail im Entwickler-Log.

- [x] **FR-5: Route-Alias `/get-link` in `AppRouter.tsx`**:
  - Route `<Route path="/get-link" element={<Navigate to="/team/get-link" replace />} />` hinzufügen.

### 3.2 Explizit Out-of-Scope
- Änderung der Firestore-Sicherheitsregeln für Admin-Collections (`config`, `matches`).
- Kein Zwang zu manuellem Login für Betreuer (das Konzept der Secret-Tokens bleibt unverändert).

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien

- [x] **AC-1: Link-Erzeugung ohne Admin-Login (Mobilgerät / Inkognito)**
  - **Gegeben sei**: Ein unangemeldeter Nutzer (ohne Admin-Session) öffnet `/team/get-link` auf einem Smartphone oder im Inkognito-Fenster.
  - **Wenn**: Er einen Verein und eine Altersklasse auswählt und auf „Link erstellen & anzeigen“ klickt.
  - **Dann**: Wird der Team-Link erfolgreich generiert und angezeigt; es erscheint KEIN Fehler „Fehler beim Erzeugen des Links“.

- [x] **AC-2: URL-Alias `/get-link`**
  - **Gegeben sei**: Ein Nutzer ruft `/get-link` im Browser auf.
  - **Wenn**: Die Route geladen wird.
  - **Dann**: Wird er nahtlos auf `/team/get-link` weitergeleitet.

- [x] **AC-3: Early Auth Handshake**
  - **Gegeben sei**: Ein Nutzer besucht `/team/get-link`.
  - **Wenn**: Die Seite lädt.
  - **Dann**: Wird `ensureAnonymousAuth()` im Hintergrund ausgeführt, sodass `auth.currentUser` existiert, bevor eine Interaktion stattfindet.

- [x] **AC-4: Rückwärtskompatibilität Betreuer-Bereich (`/team/:token`)**
  - **Gegeben sei**: Ein mit dem neuen Token generierter Link wird aufgerufen.
  - **Wenn**: Der Betreuer Jingles hochlädt oder Kaderdaten speichert.
  - **Dann**: Werden diese Daten mit der anonymen Sitzung fehlerfrei in Firestore und Storage gespeichert.

### 4.2 Allgemeine Qualitätskriterien
- [x] Keine fest kodierten Parameter.
- [x] Vollständige TypeScript-Typisierung ohne `any`.
- [x] `npm run build` und `npm test` laufen fehlerfrei durch.

---

## 5. UI/UX & Interaktionskonzept

- **`/team/get-link`**:
  - Unverändertes CI-Design.
  - Wenn ein Fehler auftritt, wird dieser verständlich formuliert (z. B. „Verbindung zum Server fehlgeschlagen. Bitte prüfe deine Internetverbindung und versuche es erneut.“).
- **`/get-link`**:
  - Direkte Weiterleitung ohne Flicker auf `/team/get-link`.

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Firebase Auth & Firestore
- Firebase Authentication akzeptiert Anfragen mit anonymer Authentifizierung von `kbc.rrk08.club`, `rrk08.club`, `kbc-turnier.pages.dev`, `localhost`, `kbc-turnier.web.app` und `kbc-turnier.firebaseapp.com`.
- Firestore Rules (`request.auth != null`) werden durch den anonymen Benutzer erfüllt.

### 6.2 Service & Komponenten-Anpassungen
- `src/lib/firebase.ts`: `ensureAnonymousAuth` gibt ein `Promise<User | null>` zurück.
- `src/pages/jingle/TeamGetLinkPage.tsx`: Aufruf von `ensureAnonymousAuth()` im Mount-`useEffect`.
- `src/routes/AppRouter.tsx`: Redirect-Route `/get-link`.

---

## 7. Edge Cases & Fehlerbehandlung

- **Offline / Schlechter Empfang in der Halle**: Tritt ein Offline-Fehler auf, wird dem Nutzer geraten, die Netzverbindung zu prüfen.
- **Bereits bestehende Admin-Session**: Hat ein Admin die Seite aufgerufen, bleibt dessen Admin-Identität unberührt (`if (!auth.currentUser)`).

---

## 8. Verifikations- & Testplan

### 8.1 Manuelle Tests
1. Desktop Normales Browser-Fenster: `/team/get-link` -> Link generieren -> Funktioniert.
2. Desktop Inkognito-Fenster (simuliert unangemeldetes Mobilgerät): `/team/get-link` -> Link generieren -> Funktioniert ohne Fehler.
3. Aufruf von `/get-link` im Browser -> Weiterleitung auf `/team/get-link`.

### 8.2 Automatisierte Tests
- Neuer Unit-Test `tests/spec062MobileTeamGetLinkAnonymousAuth.test.ts`:
  - Testet `ensureAnonymousAuth` Verhalten und Rückgabe.
  - Testet Link-Generierung im anonymen Zustand.
  - Testet Route-Alias.
- Bestehende Tests (`npm test`) müssen alle grün bleiben.
