# Versionierungsrichtlinien (VERSIONING.md)

Dieses Projekt folgt strikt den Vorgaben von **Semantic Versioning 2.0.0** (`MAJOR.MINOR.PATCH`).

---

## 🔢 Schema

Format: `vX.Y.Z` (z. B. `v1.0.0`)

- **MAJOR (X)**: Inkompatible API- oder Datenmodell-Änderungen (z. B. Breaking Changes im Firestore-Schema, die Migrationen erfordern).
- **MINOR (Y)**: Neue Funktionalitäten und Meilensteine, die abwärtskompatibel sind (z. B. Einführung des Kiosk-Modus oder neue Admin-Funktionen).
- **PATCH (Z)**: Abwärtskompatible Fehlerbehebungen und kleinere UI-Fixes.

---

## 📅 Release-Zyklen & Meilenstein-Mapping

| Version | Meilenstein | Beschreibung |
| :--- | :--- | :--- |
| `v0.1.0` | **M0: Initial Setup** | Scaffolding, SDD-Dokumentation, Docker- & Railway-Vorbereitung |
| `v0.2.0` | **M1: Foundation** | Firebase Client, Layouts & Basis-Routing |
| `v0.3.0` | **M2: Team & Media** | Team-Verwaltung mit Logo- & Jingle-Upload |
| `v0.4.0` | **M3: Schedule & Config** | Zeit-Konfiguration & Spielplan-Generator |
| `v0.5.0` | **M4: Live Score Desk** | Kampfgericht Live-Modus & Torjingle-Playback |
| `v0.6.0` | **M5: Public Guest View** | Mobile Gast-Ansicht, Spielplan & Live-Tabellen |
| `v0.7.0` | **M6: Kiosk Hallen-Display**| Großbildschirm-Ansicht mit automatischer Rotation |
| `v1.0.0` | **M7: Production Release** | Finale Abnahme, End-to-End getestet, Railway Live-Betrieb |

---

## 📜 Changelog-Führung

Alle nennenswerten Änderungen werden in der `CHANGELOG.md` gemäß den Richtlinien von [Keep a Changelog](https://keepachangelog.com/) dokumentiert, unterteilt in:
- `Added` für neue Features.
- `Changed` für geänderte Funktionalität.
- `Fixed` für Bugfixes.
- `Security` für sicherheitsrelevante Aktualisierungen.
