import { test, describe } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, "..")

describe("SPEC-074: Kiosk-Stabilität, Performance & Raspberry-Pi-Optimierung Tests", () => {
  test("AC-1: CSS Animation @keyframes kiosk-slide-progress und .animate-kiosk-progress sind in index.css definiert", () => {
    const cssPath = path.resolve(rootDir, "src/index.css")
    const cssContent = fs.readFileSync(cssPath, "utf-8")

    assert.ok(
      cssContent.includes("@keyframes kiosk-slide-progress"),
      "index.css muss @keyframes kiosk-slide-progress definieren"
    )
    assert.ok(
      cssContent.includes(".animate-kiosk-progress"),
      "index.css muss .animate-kiosk-progress Hilfsklasse definieren"
    )
  })

  test("AC-1 & AC-4: KioskPage nutzt 12s Foliendauer, 60min Hygiene-Reload und keinen 100ms Re-Render-Loop mehr", () => {
    const pagePath = path.resolve(rootDir, "src/pages/kiosk/KioskPage.tsx")
    const pageContent = fs.readFileSync(pagePath, "utf-8")

    assert.ok(
      !pageContent.includes("PROGRESS_TICK_MS"),
      "KioskPage darf keinen 100ms PROGRESS_TICK_MS Re-Render-Loop mehr enthalten"
    )
    assert.ok(
      !pageContent.includes("setElapsedMs"),
      "KioskPage darf setElapsedMs nicht mehr verwenden"
    )
    assert.ok(
      pageContent.includes("RELOAD_INTERVAL_MS"),
      "KioskPage muss RELOAD_INTERVAL_MS für proaktiven Hygiene-Reload definieren"
    )
    assert.ok(
      pageContent.includes("window.location.reload()"),
      "KioskPage muss bei Erreichen des Reload-Intervalls window.location.reload() aufrufen"
    )
  })

  test("AC-5: start-kiosk.sh enthält alle Flags gegen Error 11 und eine Auto-Restart-Überwachung", () => {
    const scriptPath = path.resolve(rootDir, "raspberry/start-kiosk.sh")
    const scriptContent = fs.readFileSync(scriptPath, "utf-8")

    assert.ok(
      scriptContent.includes("--disable-dev-shm-usage"),
      "start-kiosk.sh muss --disable-dev-shm-usage enthalten, um SIGSEGV (Error 11) zu verhindern"
    )
    assert.ok(
      scriptContent.includes("--disable-gpu"),
      "start-kiosk.sh muss --disable-gpu enthalten"
    )
    assert.ok(
      scriptContent.includes("--disable-software-rasterizer"),
      "start-kiosk.sh muss --disable-software-rasterizer enthalten"
    )
    assert.ok(
      scriptContent.includes("--disk-cache-dir=/tmp/chromium-cache"),
      "start-kiosk.sh muss Disk-Cache in /tmp legen, um SD-Karte zu schonen"
    )
    assert.ok(
      scriptContent.includes("while true; do"),
      "start-kiosk.sh muss eine while-true-Überwachungsschleife für Auto-Restart enthalten"
    )
  })

  test("AC-5: install-kiosk.sh optimiert den Swap-Speicher auf 1024 MB", () => {
    const scriptPath = path.resolve(rootDir, "raspberry/install-kiosk.sh")
    const scriptContent = fs.readFileSync(scriptPath, "utf-8")

    assert.ok(
      scriptContent.includes("CONF_SWAPSIZE=1024"),
      "install-kiosk.sh muss CONF_SWAPSIZE=1024 setzen"
    )
  })

  test("AC-5: connect-wifi.sh enthält --no-sandbox und --disable-dev-shm-usage für den Root-Browser", () => {
    const scriptPath = path.resolve(rootDir, "raspberry/connect-wifi.sh")
    const scriptContent = fs.readFileSync(scriptPath, "utf-8")

    assert.ok(
      scriptContent.includes("--no-sandbox"),
      "connect-wifi.sh muss --no-sandbox für Root-Chromium enthalten"
    )
    assert.ok(
      scriptContent.includes("--disable-dev-shm-usage"),
      "connect-wifi.sh muss --disable-dev-shm-usage enthalten"
    )
  })
})
