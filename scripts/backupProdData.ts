import { initializeApp } from "firebase/app"
import { getAuth, signInWithEmailAndPassword, signInAnonymously } from "firebase/auth"
import { getFirestore, collection, getDocs, doc, getDoc } from "firebase/firestore"
import * as fs from "fs"
import * as path from "path"
import { execSync } from "child_process"

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

function getFormattedTimestamp(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`
}

function getMimeExtension(mime: string): string {
  const cleanMime = mime.split(";")[0].trim().toLowerCase()
  switch (cleanMime) {
    case "image/png":
      return ".png"
    case "image/jpeg":
    case "image/jpg":
      return ".jpg"
    case "image/webp":
      return ".webp"
    case "image/svg+xml":
      return ".svg"
    case "image/gif":
      return ".gif"
    case "audio/mpeg":
    case "audio/mp3":
      return ".mp3"
    case "audio/mp4":
    case "audio/x-m4a":
    case "audio/m4a":
      return ".m4a"
    case "audio/wav":
    case "audio/wave":
    case "audio/x-wav":
      return ".wav"
    case "audio/ogg":
    case "audio/opus":
      return ".ogg"
    case "audio/aac":
      return ".aac"
    default:
      return ""
  }
}

async function downloadBinary(
  url: string,
  targetPrefix: string,
  defaultExt: string
): Promise<{ success: boolean; bytes: number; filePath?: string; error?: string }> {
  try {
    const res = await fetch(url)
    if (!res.ok) {
      return { success: false, bytes: 0, error: `HTTP ${res.status} ${res.statusText}` }
    }

    let ext = ""
    try {
      const u = new URL(url)
      const decodedPath = decodeURIComponent(u.pathname)
      const parsedExt = path.extname(decodedPath)
      if (parsedExt && parsedExt.length <= 5) {
        ext = parsedExt
      }
    } catch {
      // ignore url parse error
    }

    if (!ext) {
      const contentType = res.headers.get("content-type") || ""
      ext = getMimeExtension(contentType) || defaultExt
    }

    const fullPath = targetPrefix.endsWith(ext) ? targetPrefix : `${targetPrefix}${ext}`
    const buffer = Buffer.from(await res.arrayBuffer())
    fs.mkdirSync(path.dirname(fullPath), { recursive: true })
    fs.writeFileSync(fullPath, buffer)
    return { success: true, bytes: buffer.length, filePath: fullPath }
  } catch (err) {
    return { success: false, bytes: 0, error: (err as Error).message }
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
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
  const startTime = Date.now()
  const timestamp = getFormattedTimestamp()

  console.log("========================================================")
  console.log("💾 KBC Turnier - Vollständiges Online-Backup")
  console.log(`⏱️  Zeitstempel: ${timestamp}`)
  console.log("========================================================")

  const { firebaseConfig, adminEmail, adminPassword } = loadEnvConfig()

  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    throw new Error("VITE_FIREBASE_API_KEY oder VITE_FIREBASE_PROJECT_ID in .env fehlen.")
  }

  // Backup-Verzeichnisse initialisieren
  const backupBaseDir = path.resolve(process.cwd(), "backup")
  const archiveDir = path.join(backupBaseDir, "archive", `backup-${timestamp}`)
  const storageDir = path.join(archiveDir, "storage")
  const authDir = path.join(archiveDir, "auth")

  fs.mkdirSync(archiveDir, { recursive: true })
  fs.mkdirSync(storageDir, { recursive: true })
  fs.mkdirSync(authDir, { recursive: true })

  console.log(`📁 Zielordner: ${path.relative(process.cwd(), archiveDir)}`)
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
      console.warn("⚠️ Anonyme Authentifizierung nicht möglich:", (err as Error).message)
    }
  }

  // 1. Config Dokumente
  console.log("\n📦 [1/5] Lese 'config'-Dokumente...")
  const configDocs: Record<string, unknown>[] = []
  const knownConfigIds = ["tournament", "info"]
  for (const cid of knownConfigIds) {
    try {
      const snap = await getDoc(doc(db, "config", cid))
      if (snap.exists()) {
        configDocs.push({ id: snap.id, ...snap.data() })
        console.log(`  ✓ config/${cid}`)
      }
    } catch (err) {
      console.warn(`  ⚠️ Konnte config/${cid} nicht lesen:`, (err as Error).message)
    }
  }

  // 2. Teams
  console.log("\n📦 [2/5] Lese 'teams' (Stammdaten, Kader, Links)...")
  const teams = await exportCollection(db, "teams")
  let totalPlayers = 0
  for (const t of teams) {
    if (Array.isArray(t.players)) {
      totalPlayers += t.players.length
    }
  }
  console.log(`  ✓ ${teams.length} Teams exportiert (mit insgesamt ${totalPlayers} gemeldeten Spielern)`)

  // 3. Matches
  console.log("\n📦 [3/5] Lese 'matches' (Spielplan & Ergebnisse)...")
  const matches = await exportCollection(db, "matches")
  console.log(`  ✓ ${matches.length} Matches exportiert`)

  // 4. Corners
  console.log("\n📦 [4/5] Lese 'corners' (Ecken-Jingles)...")
  const corners = await exportCollection(db, "corners")
  console.log(`  ✓ ${corners.length} Ecken-Jingles exportiert`)

  // 5. AuditLogs
  console.log("\n📦 [5/5] Lese 'auditLogs'...")
  let auditLogs: Record<string, unknown>[] = []
  try {
    auditLogs = await exportCollection(db, "auditLogs")
    console.log(`  ✓ ${auditLogs.length} Audit-Logs exportiert`)
  } catch {
    console.log("  ℹ️ Keine auditLogs exportiert oder Zugriff eingeschränkt.")
  }

  // Speichere Firestore-Snapshot
  const snapshotData = {
    metadata: {
      exportedAt: new Date().toISOString(),
      projectId: firebaseConfig.projectId,
      timestamp,
      version: "2.0",
      counts: {
        config: configDocs.length,
        teams: teams.length,
        players: totalPlayers,
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

  const snapshotFile = path.join(archiveDir, "snapshot.json")
  fs.writeFileSync(snapshotFile, JSON.stringify(snapshotData, null, 2), "utf8")
  console.log(`  ✓ Snapshot gespeichert in: ${path.relative(process.cwd(), snapshotFile)}`)

  // Auch aktuellen Stand für den Emulator aktualisieren
  const defaultSnapshotPath = path.join(backupBaseDir, "production_snapshot.json")
  fs.writeFileSync(defaultSnapshotPath, JSON.stringify(snapshotData, null, 2), "utf8")
  console.log(`  ✓ Emulator-Snapshot aktualisiert: ${path.relative(process.cwd(), defaultSnapshotPath)}`)

  // ========================================================
  // MEDIEN-DOWNLOAD (Logos, Tor-Jingles, Ecken-Jingles)
  // ========================================================
  console.log("\n🎨 [6/7] Lade Mediendateien aus Firebase Storage herunter...")
  let downloadedLogos = 0
  let downloadedJingles = 0
  let downloadedCorners = 0
  let totalStorageBytes = 0
  const downloadErrors: string[] = []

  // Teams: Logos und Tor-Jingles
  for (const team of teams) {
    const teamId = String(team.id)
    const teamName = String(team.name || teamId)
    const teamDir = path.join(storageDir, "teams", teamId)

    // Logo
    if (typeof team.logoUrl === "string" && team.logoUrl.startsWith("http")) {
      const targetBase = path.join(teamDir, "logo")
      const result = await downloadBinary(team.logoUrl, targetBase, ".webp")
      if (result.success && result.filePath) {
        downloadedLogos++
        totalStorageBytes += result.bytes
        console.log(`  ✓ Logo [${teamName}]: ${path.basename(result.filePath)} (${formatBytes(result.bytes)})`)
      } else {
        const err = `Logo fehlgeschlagen [${teamName}]: ${result.error}`
        downloadErrors.push(err)
        console.warn(`  ⚠️ ${err}`)
      }
    }

    // Tor-Jingle
    if (typeof team.jingleUrl === "string" && team.jingleUrl.startsWith("http")) {
      const targetBase = path.join(teamDir, "jingle")
      const result = await downloadBinary(team.jingleUrl, targetBase, ".mp3")
      if (result.success && result.filePath) {
        downloadedJingles++
        totalStorageBytes += result.bytes
        console.log(`  ✓ Tor-Jingle [${teamName}]: ${path.basename(result.filePath)} (${formatBytes(result.bytes)})`)
      } else {
        const err = `Tor-Jingle fehlgeschlagen [${teamName}]: ${result.error}`
        downloadErrors.push(err)
        console.warn(`  ⚠️ ${err}`)
      }
    }
  }

  // Corners: Ecken-Jingles
  const cornersDir = path.join(storageDir, "corners")
  for (const corner of corners) {
    const cornerId = String(corner.id)
    const cornerName = String(corner.name || cornerId)
    if (typeof corner.audioUrl === "string" && corner.audioUrl.startsWith("http")) {
      const targetBase = path.join(cornersDir, cornerId)
      const result = await downloadBinary(corner.audioUrl, targetBase, ".mp3")
      if (result.success && result.filePath) {
        downloadedCorners++
        totalStorageBytes += result.bytes
        console.log(`  ✓ Ecken-Jingle [${cornerName}]: ${path.basename(result.filePath)} (${formatBytes(result.bytes)})`)
      } else {
        const err = `Ecken-Jingle fehlgeschlagen [${cornerName}]: ${result.error}`
        downloadErrors.push(err)
        console.warn(`  ⚠️ ${err}`)
      }
    }
  }

  console.log(`\n  📊 Medien-Download abgeschlossen:`)
  console.log(`     - Logos gesichert:        ${downloadedLogos}`)
  console.log(`     - Tor-Jingles gesichert:   ${downloadedJingles}`)
  console.log(`     - Ecken-Jingles gesichert: ${downloadedCorners}`)
  console.log(`     - Gesamtgröße Medien:     ${formatBytes(totalStorageBytes)}`)

  // ========================================================
  // BENUTZER (ADMINS) - FIREBASE AUTHENTICATION
  // ========================================================
  console.log("\n👥 [7/7] Sichere Benutzerkonten (Firebase Authentication)...")
  const authAccountsFile = path.join(authDir, "accounts.json")
  let authExportSuccess = false

  try {
    // Versuche npx firebase auth:export
    execSync(`npx firebase auth:export "${authAccountsFile}" --project "${firebaseConfig.projectId}"`, {
      stdio: "pipe",
      encoding: "utf8",
    })
    if (fs.existsSync(authAccountsFile)) {
      authExportSuccess = true
      console.log(`  ✓ Auth-Accounts erfolgreich gesichert: ${path.relative(process.cwd(), authAccountsFile)}`)
    }
  } catch (authErr) {
    const errorMsg = (authErr as Error).message || String(authErr)
    const authReadmeFile = path.join(authDir, "README.txt")
    const authInstructions = [
      "========================================================",
      "KBC Turnier - Firebase Authentication Export",
      "========================================================",
      "",
      "Der automatische Export via Firebase CLI konnte nicht abgeschlossen werden.",
      "Grund: Die lokale Firebase CLI ist aktuell nicht angemeldet oder hat keinen Zugriff.",
      "",
      "FEHLERDETAILS:",
      errorMsg.trim(),
      "",
      "SO SICHERST DU DIE ADMIN-BENUTZER MANUELL:",
      "1. Führe im Terminal aus:",
      "   npx firebase login",
      "",
      "2. Führe anschließend diesen Befehl aus:",
      `   npx firebase auth:export "${path.relative(process.cwd(), authAccountsFile)}" --project "${firebaseConfig.projectId}"`,
      "",
      "Die exportierte Datei 'accounts.json' enthält alle Benutzer-IDs, E-Mails und Passwort-Hashes.",
      "========================================================",
    ].join("\n")

    fs.writeFileSync(authReadmeFile, authInstructions, "utf8")
    console.log("  ⚠️ Firebase CLI nicht angemeldet (Hinweise in auth/README.txt abgelegt).")
  }

  // ========================================================
  // MANIFEST SCHREIBEN
  // ========================================================
  const durationMs = Date.now() - startTime
  const manifest = {
    backupName: `backup-${timestamp}`,
    exportedAt: new Date().toISOString(),
    durationSeconds: parseFloat((durationMs / 1000).toFixed(2)),
    projectId: firebaseConfig.projectId,
    counts: {
      configDocs: configDocs.length,
      teams: teams.length,
      players: totalPlayers,
      matches: matches.length,
      corners: corners.length,
      auditLogs: auditLogs.length,
      downloadedLogos,
      downloadedJingles,
      downloadedCorners,
      authExportSuccess,
    },
    totalMediaBytes: totalStorageBytes,
    totalMediaFormatted: formatBytes(totalStorageBytes),
    paths: {
      snapshot: path.relative(process.cwd(), snapshotFile),
      storage: path.relative(process.cwd(), storageDir),
      auth: path.relative(process.cwd(), authDir),
    },
    errors: downloadErrors,
  }

  const manifestPath = path.join(archiveDir, "manifest.json")
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8")

  console.log("\n========================================================")
  console.log("🎉 BACKUP ERFOLGREICH ABGESCHLOSSEN!")
  console.log("========================================================")
  console.log(`📁 Archiv-Verzeichnis: ${path.relative(process.cwd(), archiveDir)}`)
  console.log(`⏱️  Dauer:             ${manifest.durationSeconds}s`)
  console.log(`📊 Statistiken:`)
  console.log(`   - Teams & Kader:    ${teams.length} Teams (${totalPlayers} Spieler)`)
  console.log(`   - Spielplan:        ${matches.length} Matches`)
  console.log(`   - Ecken-Jingles:    ${corners.length} Einträge`)
  console.log(`   - Gesicherte Logos: ${downloadedLogos}`)
  console.log(`   - Gesicherte Musik: ${downloadedJingles + downloadedCorners} Dateien (${formatBytes(totalStorageBytes)})`)
  console.log(`   - Auth Accounts:    ${authExportSuccess ? "✓ Gesichert" : "⚠️ Siehe auth/README.txt"}`)
  if (downloadErrors.length > 0) {
    console.log(`\n⚠️ ${downloadErrors.length} Warnungen bei Mediendateien (siehe manifest.json)`)
  }
  console.log("========================================================")
  process.exit(0)
}

main().catch((err) => {
  console.error("\n❌ Kritischer Fehler beim Backup:", err?.message || err)
  process.exit(1)
})
