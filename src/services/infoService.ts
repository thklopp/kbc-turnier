import {
  doc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from "firebase/firestore"
import { db, isFirebaseConfigured } from "@/lib/firebase"
import type { TournamentInfoConfig } from "@/types/database"

const INFO_DOC_PATH = "config/info"

export const DEFAULT_INFO_MARKDOWN = `# Willkommen zum 20. Kurt-Becker-Cup! 🏑

Wir begrüßen alle Mannschaften, Betreuer, Eltern und Hockey-Fans ganz herzlich beim **Rüsselsheimer Ruder-Klub 08 e.V.** in der Sporthalle Dicker Busch zum traditionellen 20. Kurt-Becker-Cup der Altersklassen **mU14** und **wU14**!

---

## 📅 Turnierzeitraum & Spielzeiten

- **Samstag, 31. Oktober 2026**: Spielbeginn ab **10:00 Uhr**
- **Sonntag, 1. November 2026**: Spielbeginn ab **09:00 Uhr**

---

## 🏆 Spielablauf & Turniermodus

- **Teilnehmer**: 16 Mannschaften (8 Teams mU14, 8 Teams wU14)
- **Gruppenphase (Samstag)**: Jeweils Gruppe A und Gruppe B mit je 4 Mannschaften. Jedes Team absolviert 3 Gruppenspiele.
- **Finalphase (Sonntag)**: Halbfinals, Platzierungsspiele (um Platz 7, Platz 5, Platz 3) sowie die großen Finalspiele beider Konkurrenzen.
- **Spielzeit**: 20 Minuten pro Partie
- **Pausenzeit**: 5 Minuten Wechselpause zwischen den Partien

---

## ⚖️ Besondere Regeln & Schiedsrichter

### Penalty-Schießen in der Finalphase
Endet ein Spiel in der Finalphase (Sonntag) nach regulärer Spielzeit unentschieden, erfolgt zur Entscheidung sofort ein **Penalty-Schießen mit je 3 Schützen pro Mannschaft**. Steht es danach immer noch unentschieden, geht es im Sudden-Death-Modus mit abwechselnd einzelnen Schützen weiter.

### Schiedsrichterstellung
Die Schiedsrichter werden von den teilnehmenden Mannschaften gestellt. Die genaue Zuteilung entnehmt bitte dem offiziellen Spielplan. Bitte stellt pünktlich zu Spielbeginn unparteiische und regelkundige Schiedsrichter bereit.

---

## 🥨 Rund um das Turnier & Verpflegung

### 🍝 Mittagessen für Mannschaften (Samstag)
Für alle angemeldeten Teams steht am **Samstag zwischen 11:00 Uhr und 13:00 Uhr** ein gemeinsames warmes Mittagessen bereit. Bitte stimmt eure Essenszeiten mit eurem Spielplan ab.

### ☕ Hallen-Kiosk & Catering
An beiden Turniertagen sorgt unser Hallen-Kiosk für euer leibliches Wohl:
- Frischer Kaffee, kalte Getränke und Erfrischungen
- Selbstgebackener Kuchen und süße Snacks
- Warme Speisen, Brötchen und Brezeln

---

## 📜 Historie des Kurt-Becker-Cups

*Der Kurt-Becker-Cup blickt auf eine lange Tradition im Rüsselsheimer Hallenhockey zurück. Nähere Details und Anekdoten zur Geschichte unseres Turniers folgen hier in Kürze.*
`

const DEFAULT_INFO: TournamentInfoConfig = {
  id: "info",
  content: DEFAULT_INFO_MARKDOWN,
}

let localMockInfo: TournamentInfoConfig = { ...DEFAULT_INFO }
const infoListeners: Set<(info: TournamentInfoConfig) => void> = new Set()

export function getDefaultInfo(): TournamentInfoConfig {
  return { ...DEFAULT_INFO }
}

export function subscribeTournamentInfo(
  callback: (info: TournamentInfoConfig) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!isFirebaseConfigured) {
    infoListeners.add(callback)
    callback({ ...localMockInfo })
    return () => {
      infoListeners.delete(callback)
    }
  }

  const docRef = doc(db, INFO_DOC_PATH)
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as Partial<TournamentInfoConfig>
        callback({
          id: "info",
          content: data.content ?? DEFAULT_INFO_MARKDOWN,
          updatedAt: data.updatedAt,
          updatedBy: data.updatedBy,
        })
      } else {
        // Falls noch nicht vorhanden, initial mit Default befüllen
        setDoc(docRef, {
          content: DEFAULT_INFO_MARKDOWN,
          updatedAt: serverTimestamp(),
        })
        callback({ ...DEFAULT_INFO })
      }
    },
    (error) => {
      console.error("Fehler beim Abrufen der Turnier-Info:", error)
      if (onError) onError(error)
    }
  )
}

export async function updateTournamentInfo(
  content: string,
  userId?: string
): Promise<void> {
  if (!isFirebaseConfigured) {
    localMockInfo = {
      id: "info",
      content,
      updatedBy: userId,
    }
    const copy = { ...localMockInfo }
    infoListeners.forEach((l) => l(copy))
    return
  }

  const docRef = doc(db, INFO_DOC_PATH)
  await setDoc(
    docRef,
    {
      id: "info",
      content,
      updatedAt: serverTimestamp(),
      updatedBy: userId ?? null,
    },
    { merge: true }
  )
}
