import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Footer } from "@/components/Footer";

// Mock window.location
const mockLocation = {
  href: "",
};

Object.defineProperty(window, "location", {
  value: mockLocation,
  writable: true,
});

describe("Footer Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.href = "";
  });

  it("renders the footer with correct branding", () => {
    render(<Footer />);

    // Check for branding elements
    expect(screen.getByText("La Huella del Caminante")).toBeInTheDocument();
    expect(screen.getByText("Música argentina en Berlín")).toBeInTheDocument();
  });

  it("renders social media links with icons", () => {
    render(<Footer />);

    // Check for social media links
    expect(screen.getByText("Instagram")).toBeInTheDocument();
    expect(screen.getByText("Facebook")).toBeInTheDocument();
    expect(screen.getByText("TikTok")).toBeInTheDocument();

    const instagramLink = screen.getByText("Instagram").closest("a");
    const facebookLink = screen.getByText("Facebook").closest("a");
    const tiktokLink = screen.getByText("TikTok").closest("a");

    expect(instagramLink).toHaveAttribute("href", "https://instagram.com/lahuelladelcaminante.de");
    expect(facebookLink).toHaveAttribute("href", "https://facebook.com/lahuelladelcaminante.de");
    expect(tiktokLink).toHaveAttribute("href", "https://tiktok.com/@lahuelladelcaminante.de");
  });

  it("renders current year in copyright notice", () => {
    render(<Footer />);

    const currentYear = new Date().getFullYear().toString();
    const copyrightText = screen.getByText(
      (content) => content.includes(currentYear) && content.includes("All rights reserved")
    );

    expect(copyrightText).toBeInTheDocument();
  });

  it("generates email address after component mounts", async () => {
    render(<Footer />);

    // Get the contact button
    const contactButton = screen.getByText("Contact Us").closest("button");
    expect(contactButton).toBeInTheDocument();

    // Trigger email click
    await userEvent.click(contactButton!);

    // Check if mailTo link was created with the correct email
    expect(mockLocation.href).toBe("mailto:info@lahuelladelcaminante.de");
  });

  it("has accessible names for all interactive elements", () => {
    render(<Footer />);

    // Check for accessibility
    expect(screen.getByText("Instagram").closest("a")).toHaveAttribute("target", "_blank");
    expect(screen.getByText("Instagram").closest("a")).toHaveAttribute(
      "rel",
      "noopener noreferrer"
    );

    expect(screen.getByText("Facebook").closest("a")).toHaveAttribute("target", "_blank");
    expect(screen.getByText("Facebook").closest("a")).toHaveAttribute("rel", "noopener noreferrer");

    expect(screen.getByText("TikTok").closest("a")).toHaveAttribute("target", "_blank");
    expect(screen.getByText("TikTok").closest("a")).toHaveAttribute("rel", "noopener noreferrer");

    const emailButton = screen.getByLabelText("Send email");
    expect(emailButton).toBeInTheDocument();
  });
});
