# Contributing Guidelines & Git Workflow

Dieses Dokument definiert die Richtlinien für die Zusammenarbeit, Branching-Strategie und Commit-Konventionen im Projekt **KBC Hallenhockey-Turnierverwaltung**.

---

## 🌳 Branching-Strategie

Wir nutzen ein an GitHub Flow angelehntes Modell mit klaren Namenskonventionen:

- `main`: Produktionsreifer Code. Jeder Commit auf `main` triggert automatisch ein Deployment auf Railway.
- `feat/<kurzbeschreibung>`: Neue Features und Meilensteine (z. B. `feat/admin-jingle-player`).
- `fix/<kurzbeschreibung>`: Fehlerbehebungen (z. B. `fix/timer-seconds-drift`).
- `docs/<kurzbeschreibung>`: Dokumentationsänderungen und SDD-Updates (z. B. `docs/update-database-schema`).
- `refactor/<kurzbeschreibung>`: Code-Umstrukturierung ohne funktionale Änderung.

---

## 📝 Commit-Konventionen (Conventional Commits)

Alle Commit-Nachrichten müssen dem Standard [Conventional Commits](https://www.conventionalcommits.org/) folgen:

```
<typ>(<bereich>): <kurze beschreibung im präsens>

[optionaler textkörper]

[optionale fußzeile(n)]
```

### Typen:
- `feat`: Ein neues Feature für den Endnutzer (z. B. `feat(admin): add audio jingle upload modal`).
- `fix`: Eine Fehlerbehebung (z. B. `fix(kiosk): prevent screen flicker during match rotation`).
- `docs`: Dokumentationsanpassungen (z. B. `docs(sdd): define firestore security rules`).
- `style`: Formatierungsänderungen, Leerzeichen, Semikolons (keine Codeänderung).
- `refactor`: Refactoring von Produktionscode (z. B. `refactor(standings): optimize sorting algorithm`).
- `chore`: Wartungsarbeiten, Abhängigkeiten aktualisieren, Build-Skripte (z. B. `chore(docker): update nginx base image`).
- `test`: Hinzufügen oder Anpassen von Tests.

---

## 🚀 Workflow für Änderungen (Spec Driven Development)

1. **Spec & Branch erstellen**:
   - Für jede Änderung wird ein eigener Branch angelegt:
     ```bash
     git checkout -b feat/SPEC-001-team-logo-upload
     ```
   - Kopiere [`spec/TEMPLATE.md`](spec/TEMPLATE.md) nach `spec/SPEC-[NUMMER]-[name].md` und fülle die Spezifikation vollständig aus (siehe [`spec/README.md`](spec/README.md)).
2. **Freigabe einholen (`APPROVED`)**:
   - Die Spec dem Product Owner / Nutzer vorlegen.
   - **Erst nach Freigabe mit dem Signalwort `APPROVED`** beginnt die Code-Implementierung!
3. **Inkrementell committen**:
   - Kleine, in sich geschlossene Commits mit aussagekräftigen Conventional Commits erstellen.
4. **Vor der Abnahme prüfen**:
   - `npm run lint` (keine Linter-Fehler)
   - `npm run build` (erfolgreicher TypeScript- und Vite-Build)
5. **Nutzertest & Merge (`MERGE`)**:
   - Der Stand wird dem Nutzer zur manuellen Abnahme vorgelegt.
   - **Erst nach ausdrücklicher Freigabe mit dem Signalwort `MERGE`** wird der Branch in `main` gemergt.
