import { describe, it } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"

describe("SPEC-047: Entfernung von 'Samstag (Vorrunde)' aus dem Kiosk-Header", () => {
  const headerPath = path.resolve(process.cwd(), "src/components/kiosk/KioskHeader.tsx")
  const fileContent = fs.readFileSync(headerPath, "utf-8")

  it("AC-1: Enthält nicht mehr den Text 'Samstag (Vorrunde)'", () => {
    assert.equal(
      fileContent.includes("Samstag (Vorrunde)"),
      false,
      "Der Text 'Samstag (Vorrunde)' darf nicht mehr im KioskHeader vorkommen"
    )
  })

  it("AC-1: dayLabel setzt Samstag nicht als statischen Text", () => {
    assert.equal(
      fileContent.includes('const dayLabel = config?.activeDay === "sunday" ? "Sonntag (Finaltag)" : null'),
      true,
      "dayLabel sollte null sein, wenn nicht Sonntag"
    )
  })

  it("AC-2: Subtitle rendert 16 Teams und schließt dayLabel nur konditional ein", () => {
    assert.equal(
      fileContent.includes("{dayLabel && <>{dayLabel} &bull; </>}16 Teams (wU14 &amp; mU14)"),
      true,
      "Der Untertitel muss dayLabel nur konditional mit Trenner rendern und ansonsten nur '16 Teams (wU14 & mU14)' ausgeben"
    )
  })
})
