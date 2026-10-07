# NoSQL-Datenbankmodell & Storage-Spezifikation (Firestore & Firebase Storage)

Dieses Dokument definiert das vollständige Datenmodell der **KBC Hallenhockey-Turnierverwaltung**. Es dient als verbindliche Spezifikation für TypeScript-Typen, Firestore-Dokumente und Storage-Pfade.

---

## 📂 Firestore Collections Übersicht

```
firestore/
├── config/
│   └── tournament             # Globale Turnierkonfiguration (Zeiten, Pausen, Rhythmus)
├── teams/
│   └── {teamId}               # 16 Mannschaften (8x mU14, 8x wU14) mit Logos & Jingles
├── matches/
│   └── {matchId}              # 40 Spiele (24 Samstag Gruppenphase, 16 Sonntag Finalphase)
└── auditLogs/
    └── {logId}                # Protokollierung von Turnierleitungs-Aktionen (optional / audit)
```

---

## 1. Collection `config` ➔ Dokument `tournament`

Zentrales Konfigurationsdokument für alle zeitlichen und organisatorischen Rahmenbedingungen. Keine dieser Werte dürfen hardcodiert werden.

```typescript
export interface TournamentConfig {
  id: "tournament";
  tournamentName: string;            // z. B. "KBC Hallenhockey Cup 2026"
  gameDurationMinutes: number;       // Standard: 20
  breakDurationMinutes: number;      // Standard: 5
  saturdayStartTime: string;         // Standard: "10:00" (HH:mm)
  sundayStartTime: string;           // Standard: "09:00" (HH:mm)
  activeDay: "saturday" | "sunday";  // Aktueller Turniertag
  courtsCount: number;               // Standard: 1
  rotationPattern: "2w_2m";          // 2 Mädchenspiele, 2 Jungsspiele im Wechsel
  updatedAt: FirebaseFirestore.Timestamp;
  updatedBy?: string;                // User-ID des Admins
}
```

### Initialer Konfigurations-Datensatz:
```json
{
  "tournamentName": "KBC Hallenhockey Cup 2026",
  "gameDurationMinutes": 20,
  "breakDurationMinutes": 5,
  "saturdayStartTime": "10:00",
  "sundayStartTime": "09:00",
  "activeDay": "saturday",
  "courtsCount": 1,
  "rotationPattern": "2w_2m"
}
```

---

## 2. Collection `teams`

Enthält genau 16 Teams (8 männliche U14, 8 weibliche U14).

```typescript
export type GenderCategory = "mU14" | "wU14";
export type TournamentGroup = "A" | "B";

export interface Team {
  id: string;                        // Eindeutige Team-ID (z. B. "team-mu14-kbc")
  name: string;                      // Offizieller Vereinsname (z. B. "Kreuznacher HC")
  shortName: string;                 // Abkürzung für Ticker/Kiosk (z. B. "KHC", max. 5 Zeichen)
  gender: GenderCategory;            // "mU14" oder "wU14"
  group: TournamentGroup;            // Gruppe "A" oder "B" für die Samstags-Gruppenphase
  logoUrl: string | null;            // Firebase Storage Download-URL (PNG/SVG/WebP)
  jingleUrl: string | null;          // Firebase Storage Download-URL (MP3)
  jingleStartTimeMs?: number;        // Startzeitpunkt in Millisekunden (Standard: 0)
  contactPerson?: {
    name: string;
    phone: string;
    email: string;
  };
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}
```

---

## 3. Collection `matches`

Gesamtumfang: **40 Spiele** (24 Spiele am Samstag, 16 Spiele am Sonntag).

```typescript
export type MatchPhase = "group" | "final";
export type MatchStatus = "scheduled" | "live" | "paused" | "finished";

export type FinalMatchType =
  | "quarter_final"      // Viertelfinale (falls ausgespielt)
  | "semi_final"         // Halbfinale
  | "placement_7_8"      // Spiel um Platz 7
  | "placement_5_6"      // Spiel um Platz 5
  | "placement_3_4"      // Kleines Finale (Spiel um Platz 3)
  | "final";             // Großes Finale

export interface MatchEvent {
  id: string;
  type: "goal" | "card_green" | "card_yellow" | "card_red";
  teamId: string;                    // Team, das das Event ausgelöst hat
  playerNumber?: number;             // Torschütze / Verwarnter (optional)
  matchMinute: number;               // Spielminute (1 - gameDurationMinutes)
  timestamp: FirebaseFirestore.Timestamp;
}

export interface Match {
  id: string;                        // z. B. "match-01"
  matchNumber: number;               // 1 bis 40 (chronologische Reihenfolge)
  matchName?: string;                // Sprechender Spielname (z. B. "Gruppenspiel #1", "Finale")
  day: "saturday" | "sunday";
  gender: GenderCategory;            // "mU14" oder "wU14"
  phase: MatchPhase;                 // "group" oder "final"
  group?: TournamentGroup | null;    // "A" | "B" (nur bei phase === "group")
  finalType?: FinalMatchType | null; // Spezifikation bei phase === "final"
  
  // Teams
  teamHomeId: string;                // ID aus Collection 'teams'
  teamAwayId: string;                // ID aus Collection 'teams'
  teamHomePlaceholder?: string;      // z. B. "1. Gruppe A" (vor Finalbelegung)
  teamAwayPlaceholder?: string;      // z. B. "2. Gruppe B"

  // Zeitplan
  scheduledTime: string;             // Berechnete Anstoßzeit (z. B. "10:00")
  actualStartTime?: FirebaseFirestore.Timestamp | null;
  actualEndTime?: FirebaseFirestore.Timestamp | null;
  court: number;                     // 1 (da Ein-Platz-System)

  // Spielstand & Live-Daten
  status: MatchStatus;               // "scheduled" | "live" | "paused" | "finished"
  scoreHome: number;                 // Tore Heim
  scoreAway: number;                 // Tore Gast
  currentPeriodMinute?: number;      // Aktuelle Spielminute (vom Timer gesteuert)
  isTimerRunning?: boolean;
  timerSecondsRemaining?: number;    // Verbleibende Sekunden für Live-Sync

  // Ereignisse
  events: MatchEvent[];              // Liste aller Tore & Karten

  updatedAt: FirebaseFirestore.Timestamp;
}
```

---

## 4. Berechnete Tabellenlogik (Standings Selector)

Tabellen werden nicht zwingend persistent gespeichert, sondern direkt per Reactive Selector aus den beendeten `matches` (Status: `"finished"`) ermittelt:

```typescript
export interface TeamStanding {
  teamId: string;
  teamName: string;
  teamLogoUrl: string | null;
  group: TournamentGroup;
  gender: GenderCategory;
  played: number;                    // Anzahl Spiele
  won: number;                       // Siege (3 Punkte)
  drawn: number;                     // Unentschieden (1 Punkt)
  lost: number;                      // Niederlagen (0 Punkte)
  goalsFor: number;                  // Erzielte Tore
  goalsAgainst: number;              // Gegentore
  goalDifference: number;            // Tordifferenz
  points: number;                    // Punkte
}
```

### Kriterien für die Tabellen-Platzierung (Hallenhockey):
1. Höhere Punktzahl
2. Bessere Tordifferenz
3. Höhere Anzahl erzielter Tore
4. Direkter Vergleich
5. Penalty-Schießen (bzw. Münzwurf / Admin-Entscheidung)

---

## 💾 Firebase Storage Ordnerstruktur

```
storage/
└── teams/
    └── {teamId}/
        ├── logo.{png|jpg|webp|svg}   # Maximale Upload-Größe: 2 MB
        └── jingle.mp3                 # Maximale Upload-Größe: 5 MB (Bitrate 128-192 kbps)
```

---

## 🔒 Firestore Security Rules (Entwurf)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Öffentlicher Lesezugriff für Gäste und Hallen-Bildschirme
    match /config/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /teams/{teamId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /matches/{matchId} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    match /auditLogs/{logId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 🔒 Firebase Storage Rules (Entwurf)

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /teams/{teamId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null
                   && request.resource.size < 5 * 1024 * 1024; // Max 5 MB
    }
  }
}
```
