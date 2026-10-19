import { initializeApp } from "firebase/app"
import { getAuth, signInWithEmailAndPassword } from "firebase/auth"
import { getFirestore, collection, getDocs, doc, updateDoc, serverTimestamp } from "firebase/firestore"
import * as fs from "fs"
import * as path from "path"
import * as readline from "readline"
import type { Player, Team } from "../src/types/database"

function loadEnvConfig() {
  const envPath = path.resolve(process.cwd(), ".env")
  if (!fs.existsSync(envPath)) {
    throw new Error(".env Datei nicht gefunden!")
  }
  const content = fs.readFileSync(envPath, "utf8")
  const envVars: Record<string, string> = {}
  for (const line of content.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const idx = trimmed.indexOf("=")
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim()
      const val = trimmed.slice(idx + 1).trim().replace(/^["\x27]|["\x27]$/g, "")
      envVars[key] = val
    }
  }
  return {
    firebaseConfig: {
      apiKey: envVars.VITE_FIREBASE_API_KEY,
      authDomain: envVars.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: envVars.VITE_FIREBASE_PROJECT_ID,
      storageBucket: envVars.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: envVars.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: envVars.VITE_FIREBASE_APP_ID,
    },
    envAdminEmail: envVars.ADMIN_EMAIL || process.env.ADMIN_EMAIL,
    envAdminPassword: envVars.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD,
  }
}

async function promptInput(question: string, hidden = false): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    if (hidden && process.stdin.isTTY) {
      process.stdout.write(question)
      let input = ""
      const onData = (char: Buffer) => {
        const str = char.toString("utf8")
        if (str === "\n" || str === "\r" || str === "\u0004") {
          process.stdin.removeListener("data", onData)
          process.stdout.write("\n")
          rl.close()
          resolve(input.trim())
        } else if (str === "\u0003") {
          process.exit(1)
        } else if (str === "\b" || str === "\x7f") {
          if (input.length > 0) {
            input = input.slice(0, -1)
          }
        } else {
          input += str
        }
      }
      process.stdin.setRawMode?.(true)
      process.stdin.resume()
      process.stdin.on("data", onData)
    } else {
      rl.question(question, (answer) => {
        rl.close()
        resolve(answer.trim())
      })
    }
  })
}

async function getCredentials(envEmail?: string, envPassword?: string) {
  const args = process.argv.slice(2).filter((a) => !a.startsWith("--restore"))
  let email = ""
  let password = ""

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--email=")) {
      email = args[i].split("=")[1]
    } else if (args[i].startsWith("--password=")) {
      password = args[i].split("=")[1]
    } else if (!email && !args[i].startsWith("--")) {
      email = args[i]
    } else if (email && !password && !args[i].startsWith("--")) {
      password = args[i]
    }
  }

  if (!email && envEmail) email = envEmail
  if (!password && envPassword) password = envPassword

  if (!email) {
    email = await promptInput("Admin E-Mail: ")
  }
  if (!password) {
    password = await promptInput("Admin Passwort: ", true)
  }

  if (!email || !password) {
    throw new Error("E-Mail und Passwort sind zwingend erforderlich für den Firestore-Schreibzugriff.")
  }

  return { email, password }
}

async function main() {
  const isRestoreMode = process.argv.includes("--restore")
  const backupFile = path.resolve(process.cwd(), "scripts", "players_backup.json")

  console.log("========================================================")
  console.log(
    isRestoreMode
      ? "🔄 KBC Turnier – Spieler aus Backup wiederherstellen"
      : "🧹 KBC Turnier – Alle Spieler aus allen Teams entfernen"
  )
  console.log("========================================================")

  const { firebaseConfig, envAdminEmail, envAdminPassword } = loadEnvConfig()
  const { email, password } = await getCredentials(envAdminEmail, envAdminPassword)

  console.log("🔑 Authentifiziere bei Firebase...")
  const app = initializeApp(firebaseConfig)
  const auth = getAuth(app)
  const userCredential = await signInWithEmailAndPassword(auth, email, password)
  console.log(`✓ Erfolgreich angemeldet als: ${userCredential.user.email} (${userCredential.user.uid})`)

  const db = getFirestore(app)

  if (isRestoreMode) {
    if (!fs.existsSync(backupFile)) {
      console.error(`❌ Kein Backup unter ${backupFile} gefunden. Wiederherstellung abgebrochen.`)
      process.exit(1)
    }

    const backupContent = fs.readFileSync(backupFile, "utf8")
    const backupList: { teamId: string; teamName: string; players: Player[] }[] = JSON.parse(backupContent)

    console.log(`\n🔄 Stelle ${backupList.length} Teams aus dem Backup wieder her...`)
    for (const item of backupList) {
      const teamRef = doc(db, "teams", item.teamId)
      await updateDoc(teamRef, {
        players: item.players,
        updatedAt: serverTimestamp(),
      })
      console.log(`  ✓ ${item.teamName.padEnd(26)}: ${item.players.length} Spieler wiederhergestellt.`)
    }
    console.log("\n========================================================")
    console.log("✅ Backup erfolgreich wiederhergestellt!")
    console.log("========================================================")
    process.exit(0)
  }

  // Normaler Löschmodus: Alle Spieler aus allen Teams entfernen
  console.log("\n📥 Lese Teams aus Firestore...")
  const snapshot = await getDocs(collection(db, "teams"))
  if (snapshot.empty) {
    console.log("⚠️ Keine Teams gefunden.")
    process.exit(0)
  }

  const teams: Team[] = []
  snapshot.forEach((d) => {
    teams.push({ ...(d.data() as Team), id: d.id })
  })

  console.log(`🧹 Entferne Spieler aus ${teams.length} Teams...`)
  let totalCleared = 0

  for (const team of teams) {
    const currentCount = team.players?.length || 0
    totalCleared += currentCount

    const teamRef = doc(db, "teams", team.id)
    await updateDoc(teamRef, {
      players: [],
      updatedAt: serverTimestamp(),
    })
    console.log(`  ✓ ${team.name.padEnd(26)}: ${currentCount} Spieler entfernt.`)
  }

  console.log("\n========================================================")
  console.log("✅ Alle Spieler wurden erfolgreich entfernt!")
  console.log(`Gesamt: ${totalCleared} Spieler gelöscht. Alle Teams haben nun leere Kader.`)
  if (fs.existsSync(backupFile)) {
    console.log("💡 Hinweis: Mit 'npm run clear:players -- --restore' kannst du den vorherigen Zustand wiederherstellen.")
  }
  console.log("========================================================")
  process.exit(0)
}

main().catch((err) => {
  console.error("\n❌ Fehler beim Entfernen der Spieler:", err?.message || err)
  process.exit(1)
})
