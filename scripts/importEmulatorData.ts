import { initializeApp } from "firebase/app"
import { getFirestore, connectFirestoreEmulator, doc, setDoc, Timestamp } from "firebase/firestore"
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword } from "firebase/auth"
import * as fs from "fs"
import * as path from "path"

function loadEnvCredentials() {
  const envPath = path.resolve(process.cwd(), ".env")
  if (!fs.existsSync(envPath)) return {}
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
    adminEmail: envVars.ADMIN_EMAIL || process.env.ADMIN_EMAIL,
    adminPassword: envVars.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD,
  }
}

function restoreFirestoreTypes(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value
  if (Array.isArray(value)) return value.map(restoreFirestoreTypes)
  const obj = value as Record<string, unknown>
  if (
    typeof obj.seconds === "number" &&
    typeof obj.nanoseconds === "number" &&
    Object.keys(obj).length === 2
  ) {
    return new Timestamp(obj.seconds, obj.nanoseconds)
  }
  const res: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    res[k] = restoreFirestoreTypes(v)
  }
  return res
}

async function main() {
  console.log("========================================================")
  console.log("📥 KBC Turnier - Import in den Firebase Emulator")
  console.log("========================================================")

  const backupFile = path.resolve(process.cwd(), "backup", "production_snapshot.json")
  if (!fs.existsSync(backupFile)) {
    console.error("❌ Snapshot-Datei nicht gefunden:\n   " + backupFile)
    console.error("💡 Führe zuerst 'npm run data:export' aus, um Daten aus Production zu sichern.")
    process.exit(1)
  }

  const raw = fs.readFileSync(backupFile, "utf8")
  const snapshot = JSON.parse(raw)
  const data = snapshot.data || {}

  console.log(`📋 Snapshot geladen (Erstellt am: ${snapshot.metadata?.exportedAt || "unbekannt"})`)

  // Initialisiere Dummy-Firebase-App für lokalen Emulator
  const app = initializeApp({
    projectId: snapshot.metadata?.projectId || "kbc-turnier-mock",
    apiKey: "mock-api-key",
  })
  const db = getFirestore(app)
  const auth = getAuth(app)
  
  try {
    connectFirestoreEmulator(db, "127.0.0.1", 8080)
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true })
  } catch (err) {
    console.warn("⚠️ connectEmulator:", (err as Error).message)
  }

  // 1. Optional Admin-User im Auth-Emulator bereitstellen
  const { adminEmail, adminPassword } = loadEnvCredentials()
  if (adminEmail && adminPassword) {
    try {
      await createUserWithEmailAndPassword(auth, adminEmail, adminPassword)
      console.log(`👤 Admin-Benutzer '${adminEmail}' im Auth-Emulator angelegt.`)
    } catch (err: unknown) {
      const fbErr = err as { code?: string }
      if (fbErr?.code === "auth/email-already-in-use") {
        console.log(`👤 Admin-Benutzer '${adminEmail}' existiert bereits im Auth-Emulator.`)
      } else {
        console.warn(`⚠️ Konnte Admin-Benutzer nicht anlegen:`, (err as Error).message)
      }
    }
  }

  // 2. Collections importieren
  const collectionsToImport = ["config", "teams", "matches", "corners", "auditLogs"]
  let totalImported = 0

  for (const col of collectionsToImport) {
    const items = (data[col] || []) as Array<{ id: string; [key: string]: unknown }>
    if (!items.length) continue

    console.log(`\n📦 Importiere '${col}' (${items.length} Dokumente)...`)
    for (const item of items) {
      const { id, ...rawFields } = item
      if (!id) continue
      const docData = restoreFirestoreTypes(rawFields) as Record<string, unknown>

      try {
        await setDoc(doc(db, col, id), docData)
        totalImported++
      } catch (err) {
        console.error(`  ❌ Fehler beim Schreiben von ${col}/${id}:`, (err as Error).message)
        console.error("💡 Läuft der Firebase Emulator? Bitte starte ihn mit:\n   npm run emulators")
        process.exit(1)
      }
    }
    console.log(`  ✓ '${col}' erfolgreich importiert.`)
  }

  console.log("\n========================================================")
  console.log("🎉 ERFOLG! Alle Daten wurden in den Emulator importiert.")
  console.log(`Insgesamt: ${totalImported} Dokumente geschrieben.`)
  console.log("========================================================")
  console.log("🌐 Emulator UI öffnen:")
  console.log("   http://localhost:4000/firestore")
  console.log("========================================================")
  process.exit(0)
}

main().catch((err) => {
  console.error("\n❌ Unerwarteter Fehler beim Import:", err?.message || err)
  process.exit(1)
})
