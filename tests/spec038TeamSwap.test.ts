import { test, describe } from "node:test"
import assert from "node:assert/strict"
import { seedDefaultTeams, swapTeams, subscribeTeams, saveTeam } from "../src/services/teamService"
import { generateTournamentSchedule } from "../src/services/matchService"
import { getDefaultConfig } from "../src/services/configService"
import type { Team, Match } from "../src/types/database"
import fs from "node:fs"
import path from "node:path"

describe("SPEC-038: Teams tauschen in der Admin-Teamverwaltung", () => {
  test("AC-1: Tausch zweier Teams zwischen den Gruppen (A ⇄ B)", async () => {
    // 1. Initialisiere Standardteams
    await seedDefaultTeams()

    let currentTeams: Team[] = []
    const unsub = subscribeTeams((teams) => {
      currentTeams = teams
    })

    const team1Before = currentTeams.find((t) => t.id === "team-wu14-1")!
    const team6Before = currentTeams.find((t) => t.id === "team-wu14-6")!

    assert.equal(team1Before.group, "A")
    assert.equal(team1Before.name, "Kreuznacher HC (w)")
    assert.equal(team6Before.group, "B")
    assert.equal(team6Before.name, "SC Frankfurt 1880 (w)")

    // Fügen wir Test-Spieler und individuelle Tokens hinzu
    await saveTeam({
      id: "team-wu14-1",
      players: [{ id: "p1", number: 10, firstName: "Anna", lastName: "Schmidt" }],
      jingleToken: "khc-secret-token-1234567890",
    })
    await saveTeam({
      id: "team-wu14-6",
      players: [{ id: "p2", number: 7, firstName: "Mia", lastName: "Müller" }],
      jingleToken: "scf-secret-token-1234567890",
    })

    // 2. Führe den Tausch aus
    await swapTeams("team-wu14-1", "team-wu14-6")

    const team1After = currentTeams.find((t) => t.id === "team-wu14-1")!
    const team6After = currentTeams.find((t) => t.id === "team-wu14-6")!

    // Slot 1 (ID team-wu14-1) ist weiterhin in Gruppe A, hat aber nun die Identität von SC Frankfurt 1880
    assert.equal(team1After.group, "A")
    assert.equal(team1After.name, "SC Frankfurt 1880 (w)")
    assert.equal(team1After.shortName, "SCF")
    assert.equal(team1After.jingleToken, "scf-secret-token-1234567890")
    assert.equal(team1After.players?.length, 1)
    assert.equal(team1After.players?.[0].firstName, "Mia")

    // Slot 6 (ID team-wu14-6) ist weiterhin in Gruppe B, hat aber nun die Identität von Kreuznacher HC
    assert.equal(team6After.group, "B")
    assert.equal(team6After.name, "Kreuznacher HC (w)")
    assert.equal(team6After.shortName, "KHC")
    assert.equal(team6After.jingleToken, "khc-secret-token-1234567890")
    assert.equal(team6After.players?.length, 1)
    assert.equal(team6After.players?.[0].firstName, "Anna")

    unsub()
  })

  test("AC-2: Tausch zweier Teams innerhalb derselben Gruppe (A ⇄ A)", async () => {
    await seedDefaultTeams()

    let currentTeams: Team[] = []
    const unsub = subscribeTeams((teams) => {
      currentTeams = teams
    })

    const t1Before = currentTeams.find((t) => t.id === "team-mu14-1")!
    const t2Before = currentTeams.find((t) => t.id === "team-mu14-2")!

    assert.equal(t1Before.group, "A")
    assert.equal(t2Before.group, "A")

    await swapTeams("team-mu14-1", "team-mu14-2")

    const t1After = currentTeams.find((t) => t.id === "team-mu14-1")!
    const t2After = currentTeams.find((t) => t.id === "team-mu14-2")!

    // Beide verbleiben in Gruppe A
    assert.equal(t1After.group, "A")
    assert.equal(t2After.group, "A")

    // Aber die Vereinsnamen sind getauscht
    assert.equal(t1After.name, t2Before.name)
    assert.equal(t2After.name, t1Before.name)

    unsub()
  })

  test("AC-3: Strikte Trennung nach Geschlechtern & Fehlerbehandlung", async () => {
    await seedDefaultTeams()

    // Versuch: wU14 mit mU14 zu tauschen
    await assert.rejects(
      async () => {
        await swapTeams("team-wu14-1", "team-mu14-1")
      },
      {
        message: /Teams können nur innerhalb derselben Altersklasse.*getauscht werden/,
      }
    )

    // Versuch: Ein Team mit sich selbst zu tauschen
    await assert.rejects(
      async () => {
        await swapTeams("team-wu14-1", "team-wu14-1")
      },
      {
        message: /Ein Team kann nicht mit sich selbst getauscht werden/,
      }
    )

    // Versuch: Nicht existierendes Team
    await assert.rejects(
      async () => {
        await swapTeams("team-wu14-1", "team-non-existent")
      },
      {
        message: /Mindestens eines der ausgewählten Teams wurde nicht gefunden/,
      }
    )
  })

  test("AC-4: Spielplan-Konsistenz nach Tausch", async () => {
    await seedDefaultTeams()

    let currentTeams: Team[] = []
    const unsub = subscribeTeams((teams) => {
      currentTeams = teams
    })

    const config = getDefaultConfig()
    const schedule: Match[] = await generateTournamentSchedule(currentTeams, config)

    // Vor dem Tausch: Spiel #1 hat teamHomeId: "team-wu14-1"
    const match1 = schedule.find((m) => m.matchNumber === 1)!
    assert.equal(match1.teamHomeId, "team-wu14-1")

    // Kreuznacher HC ist aktuell auf Slot team-wu14-1
    assert.equal(
      currentTeams.find((t) => t.id === match1.teamHomeId)?.name,
      "Kreuznacher HC (w)"
    )

    // Tausche team-wu14-1 mit team-wu14-5 (Mannheimer HC)
    await swapTeams("team-wu14-1", "team-wu14-5")

    // Jetzt entspricht team-wu14-1 dem Mannheimer HC
    assert.equal(
      currentTeams.find((t) => t.id === match1.teamHomeId)?.name,
      "Mannheimer HC (w)"
    )

    unsub()
  })

  test("AC-5: UI-Komponenten (TeamSwapModal, TeamCard, TeamList)", () => {
    // 1. TeamSwapModal existiert
    const modalPath = path.resolve(process.cwd(), "src/components/admin/TeamSwapModal.tsx")
    assert.ok(fs.existsSync(modalPath), "TeamSwapModal.tsx muss existieren")
    const modalContent = fs.readFileSync(modalPath, "utf-8")
    assert.ok(modalContent.includes("export function TeamSwapModal"), "TeamSwapModal Komponente exportiert")
    assert.ok(modalContent.includes("hasStartedMatches"), "Prüfung auf bereits gestartete Spiele vorhanden")
    assert.ok(modalContent.includes("Teams & Spielplan-Plätze tauschen"), "Klarer Titel vorhanden")

    // 2. TeamCard besitzt onSwap
    const cardPath = path.resolve(process.cwd(), "src/components/admin/TeamCard.tsx")
    const cardContent = fs.readFileSync(cardPath, "utf-8")
    assert.ok(cardContent.includes("onSwap?:"), "TeamCardProps definiert onSwap")
    assert.ok(cardContent.includes("onSwap(team)"), "TeamCard ruft onSwap auf")

    // 3. TeamList integriert Teams tauschen
    const listPath = path.resolve(process.cwd(), "src/components/admin/TeamList.tsx")
    const listContent = fs.readFileSync(listPath, "utf-8")
    assert.ok(listContent.includes("<TeamSwapModal"), "TeamList rendert TeamSwapModal")
    assert.ok(listContent.includes("Teams tauschen"), "TeamList hat 'Teams tauschen' Button")
  })
})
