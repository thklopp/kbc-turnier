import { useState, useMemo, useEffect, useRef } from "react"
import type { Player } from "@/types/database"
import {
  Users,
  Trash2,
  AlertCircle,
  Save,
  Loader2,
  CheckCircle2,
  Plus,
  AlertTriangle,
} from "lucide-react"

interface TeamRosterManagerProps {
  players?: Player[]
  onSavePlayers: (players: Player[]) => Promise<void>
}

interface GridRow {
  key: string
  id?: string
  numberStr: string
  firstName: string
  lastName: string
}

const createEmptyRow = (): GridRow => ({
  key: `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  numberStr: "",
  firstName: "",
  lastName: "",
})

const initializeRows = (initialPlayers: Player[] = []): GridRow[] => {
  if (!initialPlayers || initialPlayers.length === 0) {
    // Wenn Kader leer: genau 10 leere Zeilen
    return Array.from({ length: 10 }, () => createEmptyRow())
  }
  const sorted = [...initialPlayers].sort((a, b) => a.number - b.number)
  const rows: GridRow[] = sorted.map((p) => ({
    key: p.id,
    id: p.id,
    numberStr: String(p.number),
    firstName: p.firstName,
    lastName: p.lastName,
  }))
  // Plus 1 leere Zeile am Ende
  rows.push(createEmptyRow())
  return rows
}

export function TeamRosterManager({
  players = [],
  onSavePlayers,
}: TeamRosterManagerProps) {
  const [rows, setRows] = useState<GridRow[]>(() => initializeRows(players))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorKeys, setErrorKeys] = useState<Set<string>>(new Set())

  // Referenz, um unnötiges Re-Initialisieren bei identischen Player-Objekten zu vermeiden
  const prevPlayersRef = useRef<string>("")
  useEffect(() => {
    const serialized = JSON.stringify(players || [])
    if (prevPlayersRef.current !== serialized) {
      prevPlayersRef.current = serialized
      setRows(initializeRows(players))
    }
  }, [players])

  // Zähle ausgefüllte Spieler
  const filledRowCount = useMemo(() => {
    return rows.filter(
      (r) =>
        r.numberStr.trim() !== "" ||
        r.firstName.trim() !== "" ||
        r.lastName.trim() !== ""
    ).length
  }, [rows])

  // Live-Erkennung doppelter Trikotnummern
  const duplicateNumbers = useMemo(() => {
    const counts = new Map<number, number>()
    rows.forEach((r) => {
      const raw = r.numberStr.trim()
      if (raw !== "") {
        const num = parseInt(raw, 10)
        if (!isNaN(num)) {
          counts.set(num, (counts.get(num) || 0) + 1)
        }
      }
    })
    const duplicates = new Set<number>()
    counts.forEach((count, num) => {
      if (count > 1) {
        duplicates.add(num)
      }
    })
    return duplicates
  }, [rows])

  const handleChange = (
    rowIndex: number,
    field: "numberStr" | "firstName" | "lastName",
    value: string
  ) => {
    if (formError) setFormError(null)
    if (errorKeys.size > 0) setErrorKeys(new Set())

    let sanitizedValue = value
    if (field === "numberStr") {
      // Nur Ziffern, max. 3 Zeichen
      sanitizedValue = value.replace(/[^0-9]/g, "").slice(0, 3)
    }

    setRows((prevRows) => {
      const updated = [...prevRows]
      const currentRow = { ...updated[rowIndex], [field]: sanitizedValue }
      updated[rowIndex] = currentRow

      // Sobald in der letzten Zeile etwas eingetippt wird, hänge automatisch eine leere Zeile an
      const isLastRow = rowIndex === prevRows.length - 1
      const isNonEmpty =
        currentRow.numberStr.trim() !== "" ||
        currentRow.firstName.trim() !== "" ||
        currentRow.lastName.trim() !== ""

      if (isLastRow && isNonEmpty) {
        updated.push(createEmptyRow())
      }

      return updated
    })
  }

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIndex: number,
    field: "numberStr" | "firstName" | "lastName"
  ) => {
    if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault()
      const isLastRow = rowIndex === rows.length - 1
      if (isLastRow) {
        const r = rows[rowIndex]
        const hasContent =
          r.numberStr.trim() !== "" ||
          r.firstName.trim() !== "" ||
          r.lastName.trim() !== ""
        if (hasContent) {
          setRows((prev) => [...prev, createEmptyRow()])
        }
      }
      setTimeout(() => {
        const nextEl = document.querySelector<HTMLInputElement>(
          `input[data-row="${rowIndex + 1}"][data-field="${field}"]`
        )
        if (nextEl) {
          nextEl.focus()
          nextEl.select()
        }
      }, 10)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      if (rowIndex > 0) {
        const prevEl = document.querySelector<HTMLInputElement>(
          `input[data-row="${rowIndex - 1}"][data-field="${field}"]`
        )
        if (prevEl) {
          prevEl.focus()
          prevEl.select()
        }
      }
    }
  }

  const handleDeleteRow = (indexToDelete: number) => {
    if (formError) setFormError(null)
    setRows((prevRows) => {
      if (prevRows.length <= 1) {
        return [createEmptyRow()]
      }
      const filtered = prevRows.filter((_, idx) => idx !== indexToDelete)
      const last = filtered[filtered.length - 1]
      if (
        last &&
        (last.numberStr.trim() !== "" ||
          last.firstName.trim() !== "" ||
          last.lastName.trim() !== "")
      ) {
        filtered.push(createEmptyRow())
      }
      return filtered
    })
  }

  const handleAddRow = () => {
    setRows((prev) => [...prev, createEmptyRow()])
  }

  const handleSave = async () => {
    setFormError(null)
    setSuccessMessage(null)

    const rowErrors = new Set<string>()
    const activeRows: { row: GridRow; num: number }[] = []

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      const numTrim = r.numberStr.trim()
      const fNameTrim = r.firstName.trim()
      const lNameTrim = r.lastName.trim()

      const isCompletelyEmpty = !numTrim && !fNameTrim && !lNameTrim
      if (isCompletelyEmpty) {
        continue // Leere Zeilen dazwischen oder am Ende werden ignoriert
      }

      // Unvollständige Zeile
      if (!numTrim || !fNameTrim || !lNameTrim) {
        rowErrors.add(r.key)
        continue
      }

      const num = parseInt(numTrim, 10)
      if (isNaN(num) || num < 0 || num > 99) {
        rowErrors.add(r.key)
        continue
      }

      activeRows.push({ row: r, num })
    }

    if (rowErrors.size > 0) {
      setErrorKeys(rowErrors)
      setFormError(
        "Bitte alle markierten Zeilen vollständig ausfüllen (Trikotnummer 0–99 sowie Vor- und Nachname)."
      )
      return
    }

    // Doppelte Trikotnummern prüfen
    const numberSeen = new Set<number>()
    const duplicates = new Set<number>()
    for (const item of activeRows) {
      if (numberSeen.has(item.num)) {
        duplicates.add(item.num)
        rowErrors.add(item.row.key)
      } else {
        numberSeen.add(item.num)
      }
    }

    if (duplicates.size > 0) {
      setErrorKeys(rowErrors)
      setFormError(
        `Folgende Trikotnummern sind mehrfach vergeben: #${Array.from(duplicates).join(
          ", #"
        )}. Jede Trikotnummer darf nur einmal vorkommen.`
      )
      return
    }

    // Spieler aufsteigend nach Trikotnummer sortieren
    const newPlayers: Player[] = activeRows
      .map(({ row, num }) => ({
        id:
          row.id ||
          `pl-${Date.now().toString(36)}-${Math.random()
            .toString(36)
            .substring(2, 7)}`,
        number: num,
        firstName: row.firstName.trim(),
        lastName: row.lastName.trim(),
      }))
      .sort((a, b) => a.number - b.number)

    try {
      setIsSubmitting(true)
      await onSavePlayers(newPlayers)
      setErrorKeys(new Set())
      setSuccessMessage("Kader erfolgreich gespeichert!")
      prevPlayersRef.current = JSON.stringify(newPlayers)
      setRows(initializeRows(newPlayers))
      setTimeout(() => {
        setSuccessMessage(null)
      }, 3000)
    } catch (err) {
      console.error("Fehler beim Speichern des Kaders:", err)
      setFormError("Fehler beim Speichern des Kaders. Bitte erneut versuchen.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header Info & Speichern Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shrink-0">
            <Users className="h-4.5 w-4.5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 leading-tight">
              Spielerkader
            </h4>
            <p className="text-xs text-slate-500">
              {filledRowCount === 0
                ? "Noch keine Spielerinnen/Spieler eingetragen."
                : `${filledRowCount} ${
                    filledRowCount === 1 ? "Spieler/in" : "Spieler/innen"
                  } erfasst`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            onClick={handleAddRow}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
            title="Leere Zeile am Ende anfügen"
          >
            <Plus className="h-3.5 w-3.5 text-slate-500" />
            <span>Zeile +</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-500 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Wird gespeichert...</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                <span>Kader speichern</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Hinweistext für Excel-Style Tastaturnavigation */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
        <span>
          💡 <strong>Tipp:</strong> Schnelleingabe mit <strong>Tab</strong>,{" "}
          <strong>Enter</strong> oder <strong>Pfeiltasten (↑/↓)</strong> wie in
          Excel. Leere Zeilen werden automatisch verworfen.
        </span>
      </div>

      {/* Warnung bei doppelten Trikotnummern */}
      {duplicateNumbers.size > 0 && (
        <div className="flex items-center gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          <span>
            Achtung: Trikotnummer{" "}
            <strong>#{Array.from(duplicateNumbers).join(", #")}</strong> ist
            mehrfach vorhanden. Bitte vor dem Speichern korrigieren.
          </span>
        </div>
      )}

      {/* Validierungsfehler Banner */}
      {formError && (
        <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2.5">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span className="font-medium">{formError}</span>
        </div>
      )}

      {/* Erfolgsmeldung Banner */}
      {successMessage && (
        <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {/* Excel-Style Roster Grid */}
      <div className="border border-slate-300 rounded-xl overflow-hidden bg-white shadow-xs">
        <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 z-10 bg-slate-100 text-slate-700 font-bold border-b border-slate-300 shadow-xs select-none">
              <tr>
                <th className="w-10 px-2 py-2 text-center border-r border-slate-300 text-slate-400 font-mono text-[11px]">
                  #
                </th>
                <th className="w-20 sm:w-24 px-2 py-2 text-center border-r border-slate-300 whitespace-nowrap">
                  Trikot-Nr.
                </th>
                <th className="min-w-[120px] px-3 py-2 border-r border-slate-300">
                  Vorname
                </th>
                <th className="min-w-[120px] px-3 py-2 border-r border-slate-300">
                  Nachname
                </th>
                <th className="w-10 px-1 py-2 text-center">
                  <span className="sr-only">Löschen</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.map((row, index) => {
                const parsedNum = parseInt(row.numberStr.trim(), 10)
                const isDuplicate =
                  !isNaN(parsedNum) &&
                  row.numberStr.trim() !== "" &&
                  duplicateNumbers.has(parsedNum)
                const isErrorRow = errorKeys.has(row.key)

                return (
                  <tr
                    key={row.key}
                    className={`transition-colors hover:bg-slate-50/70 ${
                      isErrorRow
                        ? "bg-rose-50/50"
                        : index % 2 === 1
                        ? "bg-slate-50/30"
                        : "bg-white"
                    }`}
                  >
                    {/* Zeilennummer (#) */}
                    <td className="w-10 text-center bg-slate-50/90 border-r border-slate-300 text-slate-400 font-mono text-[11px] font-medium py-1 select-none">
                      {index + 1}
                    </td>

                    {/* Trikotnummer */}
                    <td
                      className={`w-20 sm:w-24 p-0 border-r border-slate-300 ${
                        isDuplicate ? "bg-rose-100/60" : ""
                      }`}
                    >
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="–"
                        data-row={index}
                        data-field="numberStr"
                        value={row.numberStr}
                        onChange={(e) =>
                          handleChange(index, "numberStr", e.target.value)
                        }
                        onKeyDown={(e) =>
                          handleKeyDown(e, index, "numberStr")
                        }
                        className={`w-full h-8.5 px-2 text-center font-bold text-slate-900 bg-transparent focus:bg-blue-50/40 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-blue-500 border-0 m-0 ${
                          isDuplicate
                            ? "text-rose-700 font-black ring-1 ring-inset ring-rose-400"
                            : isErrorRow && !row.numberStr.trim()
                            ? "ring-1 ring-inset ring-rose-300"
                            : ""
                        }`}
                        title={
                          isDuplicate
                            ? "Trikotnummer ist mehrfach vergeben"
                            : undefined
                        }
                      />
                    </td>

                    {/* Vorname */}
                    <td
                      className={`p-0 border-r border-slate-300 ${
                        isErrorRow &&
                        !row.firstName.trim() &&
                        (row.numberStr.trim() || row.lastName.trim())
                          ? "bg-rose-50 ring-1 ring-inset ring-rose-300"
                          : ""
                      }`}
                    >
                      <input
                        type="text"
                        placeholder="Vorname"
                        data-row={index}
                        data-field="firstName"
                        value={row.firstName}
                        onChange={(e) =>
                          handleChange(index, "firstName", e.target.value)
                        }
                        onKeyDown={(e) =>
                          handleKeyDown(e, index, "firstName")
                        }
                        className="w-full h-8.5 px-3 text-slate-900 bg-transparent focus:bg-blue-50/40 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-blue-500 border-0 m-0"
                      />
                    </td>

                    {/* Nachname */}
                    <td
                      className={`p-0 border-r border-slate-300 ${
                        isErrorRow &&
                        !row.lastName.trim() &&
                        (row.numberStr.trim() || row.firstName.trim())
                          ? "bg-rose-50 ring-1 ring-inset ring-rose-300"
                          : ""
                      }`}
                    >
                      <input
                        type="text"
                        placeholder="Nachname"
                        data-row={index}
                        data-field="lastName"
                        value={row.lastName}
                        onChange={(e) =>
                          handleChange(index, "lastName", e.target.value)
                        }
                        onKeyDown={(e) =>
                          handleKeyDown(e, index, "lastName")
                        }
                        className="w-full h-8.5 px-3 text-slate-900 bg-transparent focus:bg-blue-50/40 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-blue-500 border-0 m-0"
                      />
                    </td>

                    {/* Aktionen (Löschen) */}
                    <td className="w-10 p-0 text-center">
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => handleDeleteRow(index)}
                        className="h-8.5 w-full flex items-center justify-center text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Zeile entfernen / leeren"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
