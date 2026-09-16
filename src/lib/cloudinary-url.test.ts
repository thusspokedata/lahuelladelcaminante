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
