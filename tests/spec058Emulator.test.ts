import test from "node:test"
import assert from "node:assert/strict"
import * as fs from "node:fs"
import * as path from "node:path"

test("SPEC-058: Firebase Emulator Konfiguration und Skripte", async (t) => {
  await t.test("firebase.json existiert und enthält gültige Emulator-Ports", () => {
    const firebaseJsonPath = path.resolve(process.cwd(), "firebase.json")
    assert.ok(fs.existsSync(firebaseJsonPath), "firebase.json muss im Root existieren")

    const content = JSON.parse(fs.readFileSync(firebaseJsonPath, "utf8"))
    assert.ok(content.emulators, "emulators-Konfiguration muss vorhanden sein")
    assert.strictEqual(content.emulators.firestore.port, 8080)
    assert.strictEqual(content.emulators.auth.port, 9099)
    assert.strictEqual(content.emulators.storage.port, 9199)
    assert.strictEqual(content.emulators.ui.port, 4000)
    assert.strictEqual(content.firestore.rules, "firestore.rules")
    assert.strictEqual(content.storage.rules, "storage.rules")
  })

  await t.test("firestore.rules und storage.rules existieren", () => {
    assert.ok(fs.existsSync(path.resolve(process.cwd(), "firestore.rules")))
    assert.ok(fs.existsSync(path.resolve(process.cwd(), "storage.rules")))
  })

  await t.test("Export- und Import-Skripte sind vorhanden", () => {
    const exportScript = path.resolve(process.cwd(), "scripts", "exportProdData.ts")
    const importScript = path.resolve(process.cwd(), "scripts", "importEmulatorData.ts")
    assert.ok(fs.existsSync(exportScript), "scripts/exportProdData.ts muss existieren")
    assert.ok(fs.existsSync(importScript), "scripts/importEmulatorData.ts muss existieren")
  })

  await t.test("package.json enthält die neuen Emulator- und Daten-Skripte", () => {
    const packageJson = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "package.json"), "utf8"))
    assert.ok(packageJson.scripts["emulators"], "npm run emulators muss definiert sein")
    assert.ok(packageJson.scripts["data:export"], "npm run data:export muss definiert sein")
    assert.ok(packageJson.scripts["data:import"], "npm run data:import muss definiert sein")
    assert.ok(packageJson.devDependencies["firebase-tools"], "firebase-tools muss in devDependencies sein")
  })

  await t.test("firebase.ts exportiert isEmulatorActive", async () => {
    const firebaseModule = await import("../src/lib/firebase")
    assert.ok("isEmulatorActive" in firebaseModule, "isEmulatorActive muss exportiert werden")
  })
})
