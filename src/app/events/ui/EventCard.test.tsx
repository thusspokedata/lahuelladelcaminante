import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EventCard } from "./EventCard";

describe("EventCard", () => {
  it("renders event information correctly", () => {
    // Arrange
    const props = {
      id: "test-id-1",
      title: "Test Event",
      slug: "test-event",
      date: "lunes, 15 de mayo de 2023",
      artist: "Test Artist",
      genre: "Rock",
      location: "Berlin",
      time: "20:00",
      price: 25,
      images: [{ url: "/test-image.jpg", alt: "Test Image" }],
    };

    // Act
    render(<EventCard {...props} />);

    // Assert
    expect(screen.getByText("Test Event")).toBeInTheDocument();
    expect(screen.getByText("lunes, 15 de mayo de 2023")).toBeInTheDocument();
    expect(screen.getByText("Test Artist")).toBeInTheDocument();
    expect(screen.getByText("Género: Rock")).toBeInTheDocument();
    expect(screen.getByText("Lugar: Berlin")).toBeInTheDocument();
    expect(screen.getByText("Hora: 20:00")).toBeInTheDocument();
    expect(screen.getByText("Precio: €25")).toBeInTheDocument();
    expect(screen.getByText("Ver Detalles")).toBeInTheDocument();
  });

  it("handles event without images", () => {
    // Arrange
    const props = {
      id: "test-id-2",
      title: "Test Event",
      slug: "test-event",
      date: "lunes, 15 de mayo de 2023",
      artist: "Test Artist",
      genre: "Rock",
      location: "Berlin",
      time: "20:00",
      price: 25,
      images: [],
    };

    // Act
    render(<EventCard {...props} />);

    // Assert
    expect(screen.getByText("Test Event")).toBeInTheDocument();
    // Image placeholder would be rendered instead
  });

  it("handles event without price", () => {
    // Arrange
    const props = {
      id: "test-id-3",
      title: "Free Event",
      slug: "free-event",
      date: "lunes, 15 de mayo de 2023",
      artist: "Test Artist",
      genre: "Rock",
      location: "Berlin",
      time: "20:00",
      images: [],
    };

    // Act
    render(<EventCard {...props} />);

    // Assert
    expect(screen.getByText("Free Event")).toBeInTheDocument();
    expect(screen.queryByText(/Precio/)).not.toBeInTheDocument();
  });
});
