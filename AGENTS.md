# Richtlinien für KI-Projekt-Agenten (AGENTS.md)

Dieses Dokument definiert die Verhaltensregeln, Architekturprinzipien und Qualitätsstandards für alle autonomen Entwicklungs- und Pair-Programming-Agenten, die an der **KBC Hallenhockey-Turnierverwaltung** arbeiten.

---

## 🧭 Leitprinzip: Spec Driven Development (SDD)

1. **Dokumentation als Single Source of Truth**:
   - Die Dateien `DATABASE.md`, `ARCHITECTURE.md`, `TASKS.md` und `README.md` bilden das unveränderliche Fundament.
   - **Feature- & Fix-Spezifikationen**: Vor jeder Implementierung eines neuen Features oder Fixes muss zwingend eine Spezifikation im Ordner `spec/` nach der Vorlage [`spec/TEMPLATE.md`](spec/TEMPLATE.md) erstellt und gemäß [`spec/README.md`](spec/README.md) freigegeben werden.
   - **Branching & Freigabe-Gates**: Jede Spec wird auf einem eigenen Branch umgesetzt (`feat/SPEC-...` oder `fix/SPEC-...`). Die Implementierung darf erst nach ausdrücklicher Freigabe der Spec durch den Nutzer mit **`APPROVED`** beginnen. Der Merge in `main` darf erst nach erfolgreichem Nutzertest und Freigabe mit **`MERGE`** erfolgen.
   - Bevor Code geschrieben wird, muss geprüft werden, ob die geplante Änderung durch die Spezifikation gedeckt ist.
   - Falls sich Anforderungen während der Entwicklung ändern, muss **zuerst** die entsprechende Spezifikationsdatei aktualisiert werden, bevor die Codeänderung erfolgt.

2. **Keine ungetesteten Code-Sprünge**:
   - Jede Komponente und jeder Service wird inkrementell entwickelt und verifiziert.
   - Es werden keine "Annahmen" getroffen oder Features hinzugefügt, die nicht explizit in den Meilensteinen vorgesehen sind.
   - Nach Abschluss jedes Meilensteins wird dem Nutzer der aktuelle Status präsentiert und auf explizite Freigabe gewartet.

3. **Verbot von Hardcoding**:
   - Spielzeiten, Pausenzeiten, Startzeiten, Teamanzahl, Geschlechter und Gruppenaufteilungen dürfen **unter keinen Umständen** fest im Quellcode verankert werden.
   - Alle Turnierparameter müssen dynamisch aus der `config/tournament`-Collection bzw. den Firestore-Daten bezogen werden.

---

## 🛠️ Technische und Architektonische Vorgaben

1. **TypeScript Strenge**:
   - `any` ist verboten. Alle Entitäten müssen gegen die Typen aus `src/types/` validiert sein.
   - Interfaces für Firebase-Dokumente müssen strikt den Schemas in `DATABASE.md` entsprechen.

2. **Firestore Listener Lifecycle**:
   - Jeder `onSnapshot`-Listener muss in einem `useEffect` aufgeräumt werden (`return () => unsubscribe()`), um Memory Leaks und übermäßige Firestore-Lesekosten zu verhindern.
   - Fehlerbehandlung (`onError` Callback) muss bei jedem Listener implementiert werden.

3. **UI & Design mit Tailwind und shadcn/ui**:
   - Verwendung bestehender shadcn/ui Primitives statt Neuerfindung von Dialogen, Buttons oder Tabellen.
   - Responsives Design: Die Gast-Ansicht (`/`) muss uneingeschränkt mobil bedienbar sein. Die Turnierleitung (`/admin`) ist primär für Tablets/Laptops optimiert. Der Kiosk (`/kiosk`) ist für Großbildschirme ausgelegt.

4. **Audio Playback Best Practices**:
   - Torjingles müssen für den Bereich der Turnierleitung gepuffert werden.
   - Saubere Fehlerbehandlung, falls Audio durch Browser-Autoplay-Richtlinien blockiert wird (Benutzerinteraktion sicherstellen).

---

## 🔄 Checkliste vor dem Abschluss eines Meilensteins

- [ ] Entspricht der Code zu 100 % den Vorgaben in `ARCHITECTURE.md` und `DATABASE.md`?
- [ ] Wurden alle neuen Abhängigkeiten in `package.json` deklariert?
- [ ] Baut das Projekt fehlerfrei (`npm run build`) ohne TypeScript- oder Lint-Fehler?
- [ ] Wurde der Fortschritt in `TASKS.md` aktualisiert?
- [ ] Wartet der Agent auf die ausdrückliche Freigabe des Nutzers, bevor der nächste Meilenstein begonnen wird?
