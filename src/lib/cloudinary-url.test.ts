import { describe, it, expect } from "vitest"
import { isAllowedCloudinaryUrl } from "./cloudinary-url"

const CLOUD = "lahuella"

describe("isAllowedCloudinaryUrl", () => {
  it("accepts an https delivery URL on our cloud", () => {
    expect(
      isAllowedCloudinaryUrl(
        `https://res.cloudinary.com/${CLOUD}/image/upload/v1/flyer.jpg`,
        CLOUD
      )
    ).toBe(true)
  })

  it("accepts our cloud regardless of the transformation path", () => {
    expect(
      isAllowedCloudinaryUrl(
        `https://res.cloudinary.com/${CLOUD}/image/upload/w_800,q_auto/events/abc123.png`,
        CLOUD
      )
    ).toBe(true)
  })

  it("rejects an image/fetch URL on our own cloud (remote fetch abuse)", () => {
    // `image/fetch` haría que Cloudinary descargue una imagen remota
    // arbitraria que luego mandaríamos a Anthropic. Debe rechazarse aunque
    // el cloud name sea el nuestro.
    expect(
      isAllowedCloudinaryUrl(
        `https://res.cloudinary.com/${CLOUD}/image/fetch/https://example.com/flyer.jpg`,
        CLOUD
      )
    ).toBe(false)
  })

  it("accepts a normal image/upload delivery URL", () => {
    expect(
      isAllowedCloudinaryUrl(
        `https://res.cloudinary.com/${CLOUD}/image/upload/v1/events/flyer.jpg`,
        CLOUD
      )
    ).toBe(true)
  })

  it("rejects a foreign Cloudinary cloud", () => {
    expect(
      isAllowedCloudinaryUrl(
        "https://res.cloudinary.com/attacker/image/upload/v1/evil.jpg",
        CLOUD
      )
    ).toBe(false)
  })

  it("rejects a non-Cloudinary host", () => {
    expect(
      isAllowedCloudinaryUrl("https://evil.example.com/x.jpg", CLOUD)
    ).toBe(false)
  })

  it("rejects a lookalike host that only contains res.cloudinary.com", () => {
    expect(
      isAllowedCloudinaryUrl(
        `https://res.cloudinary.com.evil.com/${CLOUD}/x.jpg`,
        CLOUD
      )
    ).toBe(false)
  })

  it("rejects http (non-https)", () => {
    expect(
      isAllowedCloudinaryUrl(
        `http://res.cloudinary.com/${CLOUD}/image/upload/v1/flyer.jpg`,
        CLOUD
      )
    ).toBe(false)
  })

  it("rejects a malformed URL", () => {
    expect(isAllowedCloudinaryUrl("not a url", CLOUD)).toBe(false)
  })

  it("rejects when cloud name is undefined/empty", () => {
    expect(
      isAllowedCloudinaryUrl(
        `https://res.cloudinary.com/${CLOUD}/image/upload/v1/flyer.jpg`,
        undefined
      )
    ).toBe(false)
    expect(
      isAllowedCloudinaryUrl(
        `https://res.cloudinary.com/${CLOUD}/image/upload/v1/flyer.jpg`,
        ""
      )
    ).toBe(false)
  })
})
