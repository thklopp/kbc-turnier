import { describe, it } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe("SPEC-033: Kompakter Einzeilen-Header für Smartphones im Querformat (GuestLayout)", () => {
  const guestLayoutPath = path.resolve(__dirname, "../src/components/layouts/GuestLayout.tsx")
  const tailwindConfigPath = path.resolve(__dirname, "../tailwind.config.js")

  const guestLayoutContent = fs.readFileSync(guestLayoutPath, "utf-8")
  const tailwindConfigContent = fs.readFileSync(tailwindConfigPath, "utf-8")

  it("AC-1: tailwind.config.js defines 'landscape-phone' screen breakpoint", () => {
    assert.ok(
      tailwindConfigContent.includes("landscape-phone"),
      "tailwind.config.js defines landscape-phone breakpoint"
    )
    assert.ok(
      tailwindConfigContent.includes("(orientation: landscape) and (max-height: 500px)"),
      "landscape-phone uses raw query matching landscape and max-height 500px"
    )
  })

  it("AC-2: Main header container has compact height and padding on landscape-phone", () => {
    assert.ok(
      guestLayoutContent.includes("landscape-phone:h-11"),
      "Header row shrinks to h-11 (44px) on landscape-phone"
    )
    assert.ok(
      guestLayoutContent.includes("landscape-phone:px-3"),
      "Header row has tighter horizontal padding on landscape-phone"
    )
  })

  it("AC-3: Brand logo, title and subtitle adapt to compact landscape", () => {
    assert.ok(
      guestLayoutContent.includes("landscape-phone:h-7 landscape-phone:w-7"),
      "Logo scales down to 28px on landscape-phone"
    )
    assert.ok(
      guestLayoutContent.includes("landscape-phone:text-xs"),
      "Title scales down on landscape-phone"
    )
    assert.ok(
      guestLayoutContent.includes("landscape-phone:hidden"),
      "Subtitle is hidden on landscape-phone"
    )
  })

  it("AC-4: Inline tab navigation exists in the header for landscape-phone", () => {
    assert.ok(
      guestLayoutContent.includes("hidden landscape-phone:flex"),
      "Inline tabs container is hidden by default and flex on landscape-phone"
    )
    // Check all 4 tabs exist in inline nav
    assert.ok(guestLayoutContent.includes('to="/#live"'), "Live tab exists")
    assert.ok(guestLayoutContent.includes('to="/#schedule"'), "Vorrunde tab exists")
    assert.ok(guestLayoutContent.includes('to="/#finals"'), "Finalrunde tab exists")
    assert.ok(guestLayoutContent.includes('to="/#standings"'), "Tabellen tab exists")
  })

  it("AC-5: Sub-navigation row is hidden on landscape-phone", () => {
    assert.ok(
      guestLayoutContent.includes('landscape-phone:hidden">') ||
      guestLayoutContent.includes('bg-white landscape-phone:hidden'),
      "Sub-navigation container is hidden on landscape-phone"
    )
  })

  it("AC-6: Info button and main content area adapt to landscape-phone", () => {
    assert.ok(
      guestLayoutContent.includes("landscape-phone:h-7"),
      "Info button height shrinks on landscape-phone"
    )
    assert.ok(
      guestLayoutContent.includes("landscape-phone:py-3"),
      "Main content vertical padding shrinks to py-3 on landscape-phone"
    )
  })
})
