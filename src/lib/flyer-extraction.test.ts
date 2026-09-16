import { describe, it, expect } from "vitest"
import {
  parseExtraction,
  EXTRACT_EVENT_TOOL,
  EXTRACT_EVENT_TOOL_NAME,
  buildExtractionPrompt,
} from "./flyer-extraction"

/** Referencia fija para tests deterministas de inferencia de año. */
const TODAY = new Date("2026-06-01T00:00:00.000Z")

describe("parseExtraction", () => {
  it("maps a well-formed tool input to an ExtractedEvent", () => {
    const raw = {
      title: { value: "Cumbia Night", inferred: false },
      description: { value: "Noche de cumbia en vivo.", inferred: true },
      venue: { value: "Sameheads", inferred: false },
      city: { value: "Berlín", inferred: false },
      address: { value: "Richardstr. 20", inferred: false },
      organizer: { value: "Colectivo Latino", inferred: true },
      genres: { value: ["cumbia", "tropical"], inferred: true },
      time: { value: "21:00", inferred: false },
      price: { value: "€10", inferred: false },
      dates: { value: ["2026-07-12"], inferred: false },
    }

    const out = parseExtraction(raw, { today: TODAY })

    expect(out.title).toEqual({ value: "Cumbia Night", inferred: false })
    expect(out.description).toEqual({
      value: "Noche de cumbia en vivo.",
      inferred: true,
    })
    expect(out.genres).toEqual({ value: ["cumbia", "tropical"], inferred: true })
    expect(out.time).toEqual({ value: "21:00", inferred: false })
    expect(out.dates).toEqual({ value: ["2026-07-12"], inferred: false })
  })

  it("defaults missing fields to empty values / [] and inferred=false", () => {
    const out = parseExtraction({ title: { value: "Solo Título", inferred: false } }, {
      today: TODAY,
    })

    expect(out.title).toEqual({ value: "Solo Título", inferred: false })
    expect(out.description).toEqual({ value: "", inferred: false })
    expect(out.venue).toEqual({ value: "", inferred: false })
    expect(out.city).toEqual({ value: "", inferred: false })
    expect(out.address).toEqual({ value: "", inferred: false })
    expect(out.organizer).toEqual({ value: "", inferred: false })
    expect(out.time).toEqual({ value: "", inferred: false })
    expect(out.price).toEqual({ value: "", inferred: false })
    expect(out.genres).toEqual({ value: [], inferred: false })
    expect(out.dates).toEqual({ value: [], inferred: false })
  })

  it("returns all-empty for an empty / non-object input", () => {
    for (const input of [{}, null, undefined, "garbage", 42]) {
      const out = parseExtraction(input, { today: TODAY })
      expect(out.title.value).toBe("")
      expect(out.dates.value).toEqual([])
      expect(out.genres.value).toEqual([])
    }
  })

  it("forces inferred=false when a value is empty even if the model said true", () => {
    const out = parseExtraction(
      {
        description: { value: "", inferred: true },
        genres: { value: [], inferred: true },
      },
      { today: TODAY }
    )
    expect(out.description).toEqual({ value: "", inferred: false })
    expect(out.genres).toEqual({ value: [], inferred: false })
  })

  it("infers the next FUTURE occurrence when the year is missing (before today this year)", () => {
    // 01-15 is before 2026-06-01 → next future occurrence is 2027.
    const out = parseExtraction(
      { dates: { value: ["01-15"], inferred: false } },
      { today: TODAY }
    )
    expect(out.dates.value).toEqual(["2027-01-15"])
    expect(out.dates.inferred).toBe(true)
  })

  it("infers the current year when the month/day is still ahead", () => {
    // 08-20 is after 2026-06-01 → this year (2026).
    const out = parseExtraction(
      { dates: { value: ["8-20"], inferred: false } },
      { today: TODAY }
    )
    expect(out.dates.value).toEqual(["2026-08-20"])
    expect(out.dates.inferred).toBe(true)
  })

  it("keeps a full YYYY-MM-DD date and does not force inferred", () => {
    const out = parseExtraction(
      { dates: { value: ["2026-12-31"], inferred: false } },
      { today: TODAY }
    )
    expect(out.dates.value).toEqual(["2026-12-31"])
    expect(out.dates.inferred).toBe(false)
  })

  it("normalizes and drops invalid date entries", () => {
    const out = parseExtraction(
      { dates: { value: ["2026-7-4", "nope", "13-40", 123], inferred: false } },
      { today: TODAY }
    )
    // "2026-7-4" → padded; "nope"/"13-40"(invalid month/day)/123 dropped.
    expect(out.dates.value).toEqual(["2026-07-04"])
  })

  it("tolerates bare (unwrapped) string/array values from the model", () => {
    const out = parseExtraction(
      { title: "Bare Title", genres: ["cumbia"] },
      { today: TODAY }
    )
    expect(out.title).toEqual({ value: "Bare Title", inferred: false })
    expect(out.genres.value).toEqual(["cumbia"])
  })
})

describe("EXTRACT_EVENT_TOOL", () => {
  it("declares the forced-tool name and an object schema with all fields", () => {
    expect(EXTRACT_EVENT_TOOL.name).toBe(EXTRACT_EVENT_TOOL_NAME)
    expect(EXTRACT_EVENT_TOOL.input_schema.type).toBe("object")
    const props = Object.keys(
      (EXTRACT_EVENT_TOOL.input_schema.properties ?? {}) as Record<string, unknown>
    )
    expect(props.sort()).toEqual(
      [
        "address",
        "city",
        "dates",
        "description",
        "genres",
        "organizer",
        "price",
        "time",
        "title",
        "venue",
      ].sort()
    )
  })
})

describe("buildExtractionPrompt", () => {
  it("names the target language for the description per locale", () => {
    expect(buildExtractionPrompt("es")).toContain("Spanish")
    expect(buildExtractionPrompt("en")).toContain("English")
    expect(buildExtractionPrompt("de")).toContain("German")
  })
})
