import { initializeApp } from "firebase/app"
import { getAuth, signInWithEmailAndPassword, signInAnonymously } from "firebase/auth"
import { getFirestore, collection, getDocs, doc, getDoc } from "firebase/firestore"
import * as fs from "fs"
import * as path from "path"

function loadEnvConfig() {
  const envPath = path.resolve(process.cwd(), ".env")
  if (!fs.existsSync(envPath)) {
    throw new Error(".env Datei nicht gefunden! Bitte stelle sicher, dass eine .env mit Firebase-Keys existiert.")
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
    adminEmail: envVars.ADMIN_EMAIL || process.env.ADMIN_EMAIL,
    adminPassword: envVars.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD,
  }
}

async function exportCollection(db: ReturnType<typeof getFirestore>, collectionName: string): Promise<Record<string, unknown>[]> {
  const snap = await getDocs(collection(db, collectionName))
  const items: Record<string, unknown>[] = []
  snap.forEach((d) => {
    items.push({ id: d.id, ...d.data() })
  })
  return items
}

async function main() {
  console.log("========================================================")
  console.log("📤 KBC Turnier - Export der Produktions-Daten")
  console.log("========================================================")

  const { firebaseConfig, adminEmail, adminPassword } = loadEnvConfig()

  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    throw new Error("VITE_FIREBASE_API_KEY oder VITE_FIREBASE_PROJECT_ID in .env fehlen.")
  }

  console.log(`🔌 Verbinde mit Firebase Projekt: ${firebaseConfig.projectId}...`)
  const app = initializeApp(firebaseConfig)
  const auth = getAuth(app)
  const db = getFirestore(app)

  // Auth: Entweder mit Admin-Credentials oder anonym
  if (adminEmail && adminPassword) {
    try {
      console.log(`🔐 Authentifiziere als Admin (${adminEmail})...`)
      await signInWithEmailAndPassword(auth, adminEmail, adminPassword)
      console.log("✓ Als Admin authentifiziert.")
    } catch (err) {
      console.warn("⚠️ Admin-Login fehlgeschlagen, versuche anonyme Authentifizierung...", (err as Error).message)
      await signInAnonymously(auth)
    }
  } else {
    try {
      await signInAnonymously(auth)
      console.log("✓ Anonym authentifiziert.")
    } catch (err) {
      console.warn("⚠️ Anonyme Authentifizierung nicht möglich (evtl. in Firebase Console deaktiviert):", (err as Error).message)
    }
  }

  // 1. Config Dokumente
  console.log("\n📦 Lese 'config'-Dokumente...")
  const configDocs: Record<string, unknown>[] = []
  const knownConfigIds = ["tournament", "info"]
  for (const cid of knownConfigIds) {
    try {
      const snap = await getDoc(doc(db, "config", cid))
      if (snap.exists()) {
        configDocs.push({ id: snap.id, ...snap.data() })
        console.log(`  ✓ config/${cid} exportiert`)
      }
    } catch (err) {
      console.warn(`  ⚠️ Konnte config/${cid} nicht lesen:`, (err as Error).message)
    }
  }

  // 2. Teams
  console.log("\n📦 Lese 'teams'...")
  const teams = await exportCollection(db, "teams")
  console.log(`  ✓ ${teams.length} Teams exportiert`)

  // 3. Matches
  console.log("\n📦 Lese 'matches'...")
  const matches = await exportCollection(db, "matches")
  console.log(`  ✓ ${matches.length} Matches exportiert`)

  // 4. Corners
  console.log("\n📦 Lese 'corners'...")
  const corners = await exportCollection(db, "corners")
  console.log(`  ✓ ${corners.length} Ecken-Jingles exportiert`)

  // 5. AuditLogs
  console.log("\n📦 Lese 'auditLogs'...")
  let auditLogs: Record<string, unknown>[] = []
  try {
    auditLogs = await exportCollection(db, "auditLogs")
    console.log(`  ✓ ${auditLogs.length} Audit-Logs exportiert`)
  } catch {
    console.log("  ℹ️ Keine auditLogs exportiert oder Zugriff eingeschränkt.")
  }

  const snapshot = {
    metadata: {
      exportedAt: new Date().toISOString(),
      projectId: firebaseConfig.projectId,
      version: "1.0",
      counts: {
        config: configDocs.length,
        teams: teams.length,
        matches: matches.length,
        corners: corners.length,
        auditLogs: auditLogs.length,
      },
    },
    data: {
      config: configDocs,
      teams,
      matches,
      corners,
      auditLogs,
    },
  }

  const backupDir = path.resolve(process.cwd(), "backup")
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }

  const targetFile = path.join(backupDir, "production_snapshot.json")
  fs.writeFileSync(targetFile, JSON.stringify(snapshot, null, 2), "utf8")

  console.log("\n========================================================")
  console.log("🎉 EXPORT ERFOLGREICH!")
  console.log(`📁 Gespeichert in: ${targetFile}`)
  console.log(`📊 Übersicht:`)
  console.log(`   - Configs: ${configDocs.length}`)
  console.log(`   - Teams:   ${teams.length}`)
  console.log(`   - Matches: ${matches.length}`)
  console.log(`   - Corners: ${corners.length}`)
  console.log(`   - Logs:    ${auditLogs.length}`)
  console.log("========================================================")
  console.log("💡 Du kannst diese Daten nun in den Emulator einspielen mit:")
  console.log("   npm run data:import")
  console.log("========================================================")
  process.exit(0)
}

main().catch((err) => {
  console.error("\n❌ Fehler beim Exportieren der Daten:", err?.message || err)
  process.exit(1)
})
