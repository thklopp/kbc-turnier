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
      // Eingabe verbergen falls TTY
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
  // 1. Prüfe CLI Argumente
  const args = process.argv.slice(2)
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

  // 2. Prüfe .env / Umgebungsvariablen
  if (!email && envEmail) email = envEmail
  if (!password && envPassword) password = envPassword

  // 3. Frage interaktiv ab, falls nicht übergeben
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

// Typische Hockey-Vornamen wU14 (Mädchen)
const femaleFirstNames = [
  "Emma", "Mia", "Hannah", "Sophie", "Emilia", "Lina", "Marie", "Maya", "Clara", "Lea",
  "Ella", "Mila", "Leni", "Laura", "Sarah", "Nele", "Anna", "Johanna", "Lilly", "Charlotte",
  "Luisa", "Paulina", "Greta", "Marlene", "Frida", "Ida", "Helena", "Paula", "Carla", "Mathilda",
  "Jule", "Finja", "Romy", "Amelie", "Klara", "Elisa", "Thea", "Lotta", "Theresa", "Victoria"
]

// Typische Hockey-Vornamen mU14 (Jungs)
const maleFirstNames = [
  "Paul", "Leon", "Lukas", "Finn", "Jonas", "Noah", "Ben", "Felix", "Elias", "Luca",
  "Maximilian", "Moritz", "Tim", "Jan", "Anton", "David", "Julius", "Theo", "Mats", "Hannes",
  "Jakob", "Leo", "Philipp", "Simon", "Fabian", "Valentin", "Linus", "Oskar", "Henri", "Justus",
  "Leonard", "Vincent", "Kilian", "Niklas", "Carl", "Mika", "Florian", "Caspar", "Ferdinand", "Bjarne"
]

// Nachnamen-Pool
const lastNames = [
  "Müller", "Schmidt", "Schneider", "Fischer", "Weber", "Meyer", "Wagner", "Becker", "Schulz", "Hoffmann",
  "Schäfer", "Koch", "Bauer", "Richter", "Klein", "Wolf", "Schröder", "Neumann", "Schwarz", "Zimmermann",
  "Braun", "Krüger", "Hofmann", "Hartmann", "Lange", "Schmitt", "Werner", "Schmitz", "Krause", "Meier",
  "Lehmann", "Schmid", "Schulze", "Maier", "Köhler", "Herrmann", "König", "Walter", "Mayer", "Huber",
  "Kaiser", "Fuchs", "Peters", "Möller", "Scholz", "Weiß", "Jung", "Hahn", "Schubert", "Vogel",
  "Friedrich", "Günther", "Keller", "Winkler", "Frank", "Berger", "Roth", "Beck", "Lorenz", "Baumann",
  "Franke", "Albrecht", "Schuster", "Kraus", "Ludwig", "Böhm", "Otto", "Krämer", "Stein", "Vogt",
  "Groß", "Sommer", "Haas", "Heinrich", "Seidel", "Schreiber", "Graf", "Dietrich", "Ziegler", "Kuhn"
]

function generatePlayersForTeam(team: Team, teamIndex: number): Player[] {
  const isFemale = team.gender === "wU14"
  const firstNamePool = isFemale ? femaleFirstNames : maleFirstNames
  const players: Player[] = []

  // Verteile Namen deterministisch, aber abwechslungsreich über die Teams
  for (let num = 1; num <= 10; num++) {
    const fIdx = (teamIndex * 10 + num - 1) % firstNamePool.length
    const lIdx = (teamIndex * 13 + num * 3) % lastNames.length

    players.push({
      id: `p-${team.id}-${num}`,
      number: num,
      firstName: firstNamePool[fIdx],
      lastName: lastNames[lIdx],
    })
  }

  return players
}

async function main() {
  console.log("========================================================")
  console.log("🏑 KBC Turnier – 10 Test-Spieler pro Team anlegen")
  console.log("========================================================")

  const { firebaseConfig, envAdminEmail, envAdminPassword } = loadEnvConfig()
  const { email, password } = await getCredentials(envAdminEmail, envAdminPassword)

  console.log("🔑 Authentifiziere bei Firebase...")
  const app = initializeApp(firebaseConfig)
  const auth = getAuth(app)
  const userCredential = await signInWithEmailAndPassword(auth, email, password)
  console.log(`✓ Erfolgreich angemeldet als: ${userCredential.user.email} (${userCredential.user.uid})`)

  const db = getFirestore(app)

  console.log("\n📥 Lese vorhandene Teams aus Firestore...")
  const snapshot = await getDocs(collection(db, "teams"))
  if (snapshot.empty) {
    console.error("❌ Keine Teams in der Firestore-Collection 'teams' gefunden!")
    process.exit(1)
  }

  const teams: Team[] = []
  snapshot.forEach((d) => {
    teams.push({ ...(d.data() as Team), id: d.id })
  })

  // Sortiere Teams nach Geschlecht und Name für konsistente Vergabe
  teams.sort((a, b) => {
    if (a.gender !== b.gender) return a.gender.localeCompare(b.gender)
    return a.name.localeCompare(b.name)
  })

  console.log(`📋 ${teams.length} Teams gefunden.`)

  // 1. Backup der bisherigen Spieler anlegen
  const backupData = teams.map((t) => ({
    teamId: t.id,
    teamName: t.name,
    gender: t.gender,
    players: t.players || [],
  }))

  const backupDir = path.resolve(process.cwd(), "scripts")
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }
  const backupFile = path.join(backupDir, "players_backup.json")
  fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2), "utf8")
  console.log(`💾 Backup der vorherigen Spieler gesichert in:\n   ${backupFile}\n`)

  // 2. 10 Spieler pro Team erzeugen und in Firestore aktualisieren
  console.log("⚽ Erzeuge 10 Spieler für jedes Team...")
  let totalPlayersCreated = 0

  for (let i = 0; i < teams.length; i++) {
    const team = teams[i]
    const players = generatePlayersForTeam(team, i)
    totalPlayersCreated += players.length

    const teamRef = doc(db, "teams", team.id)
    await updateDoc(teamRef, {
      players,
      updatedAt: serverTimestamp(),
    })

    console.log(
      `  ✓ [${team.gender}] ${team.name.padEnd(26)}: 10 Spieler angelegt (#1 ${players[0].firstName} ${players[0].lastName} bis #${players[players.length - 1].number} ${players[players.length - 1].firstName} ${players[players.length - 1].lastName})`
    )
  }

  console.log("\n========================================================")
  console.log("🎉 ERFOLG! Alle Test-Spieler wurden gespeichert.")
  console.log(`Insgesamt: ${totalPlayersCreated} Spieler in ${teams.length} Teams.`)
  console.log("========================================================")
  console.log("💡 Zum späteren Entfernen aller Spieler:")
  console.log("   npm run clear:players")
  console.log("💡 Oder zur Wiederherstellung des Zustands vor diesem Lauf:")
  console.log("   npx tsx scripts/clearPlayers.ts --restore")
  console.log("========================================================")
  process.exit(0)
}

main().catch((err) => {
  console.error("\n❌ Fehler beim Anlegen der Spieler:", err?.message || err)
  process.exit(1)
})
