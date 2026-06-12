import { describe, it, expect } from "vitest"
import { normalizeGenre, dedupeGenres, mergeGenreSuggestions, BASE_GENRES } from "./genres"

describe("normalizeGenre", () => {
  it("lowercases", () => {
    expect(normalizeGenre("REGGAE")).toBe("reggae")
  })

  it("strips diacritics", () => {
    expect(normalizeGenre("Réggae")).toBe("reggae")
    expect(normalizeGenre("Folclóre")).toBe("folclore")
  })

  it("collapses internal whitespace and trims", () => {
    expect(normalizeGenre("  Latin   Jazz  ")).toBe("latin jazz")
  })

  it("treats case/accent variants as equal", () => {
    expect(normalizeGenre("Reggae")).toBe(normalizeGenre("réggae"))
  })
})

describe("dedupeGenres", () => {
  it("trims each value", () => {
    expect(dedupeGenres(["  Blues  "])).toEqual(["Blues"])
  })

  it("drops empty / whitespace-only entries", () => {
    expect(dedupeGenres(["", "   ", "Blues"])).toEqual(["Blues"])
  })

  it("dedupes case/accent-insensitive keeping the first spelling", () => {
    expect(dedupeGenres(["Reggae", "reggae", "RÉGGAE"])).toEqual(["Reggae"])
  })

  it("preserves order of survivors", () => {
    expect(dedupeGenres(["Latin Pop", "Blues", "Reggae"])).toEqual([
      "Latin Pop",
      "Blues",
      "Reggae",
    ])
  })

  it("returns empty array for all-empty input", () => {
    expect(dedupeGenres(["", "  "])).toEqual([])
  })
})

describe("mergeGenreSuggestions", () => {
  it("includes the curated base list", () => {
    const result = mergeGenreSuggestions([])
    for (const g of BASE_GENRES) {
      expect(result).toContain(g)
    }
  })

  it("adds used genres not present in the base", () => {
    expect(mergeGenreSuggestions(["Blues"])).toContain("Blues")
  })

  it("does not duplicate a used genre that matches the base (case/accent-insensitive)", () => {
    const result = mergeGenreSuggestions(["tango", "TANGO"])
    expect(result.filter((g) => normalizeGenre(g) === "tango")).toEqual(["Tango"])
  })

  it("sorts alphabetically (accent-insensitive)", () => {
    const result = mergeGenreSuggestions(["Ámbar", "zamba"])
    const sorted = [...result].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    )
    expect(result).toEqual(sorted)
  })
})
