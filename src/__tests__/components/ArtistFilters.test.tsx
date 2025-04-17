import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ArtistFilters } from "@/app/artists/ui/ArtistFilters";

// Mock the Select component since it's difficult to test with jsdom
vi.mock("@/components/ui/select", () => {
  // Return a simplified select component that we can interact with in tests
  return {
    Select: ({ children, value, onValueChange }: any) => (
      <div data-testid="select-mock">
        <select
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          data-testid="genre-select"
        >
          <option value="all">Todos los géneros</option>
          <option value="tango">Tango</option>
          <option value="folklore">Folklore</option>
          <option value="rock">Rock</option>
          <option value="cumbia">Cumbia</option>
          <option value="jazz">Jazz</option>
        </select>
        {children}
      </div>
    ),
    SelectContent: ({ children }: any) => <div>{children}</div>,
    SelectTrigger: ({ children }: any) => <div>{children}</div>,
    SelectValue: ({ children }: any) => <div>{children}</div>,
    SelectItem: ({ children }: any) => <div>{children}</div>,
  };
});

describe("ArtistFilters Component", () => {
  const mockOnFilterChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all filter options correctly", () => {
    render(<ArtistFilters onFilterChange={mockOnFilterChange} />);

    // Check for filter titles
    expect(screen.getByText("Filtros")).toBeInTheDocument();
    expect(screen.getByText("Género")).toBeInTheDocument();
    expect(screen.getByText("Nombre")).toBeInTheDocument();

    // Check for name input
    expect(screen.getByPlaceholderText("Buscar por nombre...")).toBeInTheDocument();

    // Check for reset button
    expect(screen.getByText("Limpiar filtros")).toBeInTheDocument();
  });

  it("calls onFilterChange when loaded with default values", () => {
    render(<ArtistFilters onFilterChange={mockOnFilterChange} />);

    // Should be called once on load with default values
    expect(mockOnFilterChange).toHaveBeenCalledTimes(1);
    expect(mockOnFilterChange).toHaveBeenCalledWith({
      genre: undefined,
      name: "",
    });
  });

  it("updates name filter and calls onFilterChange", async () => {
    render(<ArtistFilters onFilterChange={mockOnFilterChange} />);

    // Clear previous calls after initial render
    mockOnFilterChange.mockClear();

    // Find the name input
    const nameInput = screen.getByPlaceholderText("Buscar por nombre...");

    // Type in the input
    await userEvent.type(nameInput, "Test Artist");

    // Check if onFilterChange was called with the correct arguments
    expect(mockOnFilterChange).toHaveBeenCalledWith({
      genre: undefined,
      name: "Test Artist",
    });
  });

  it("updates genre filter and calls onFilterChange", async () => {
    render(<ArtistFilters onFilterChange={mockOnFilterChange} />);

    // Clear previous calls after initial render
    mockOnFilterChange.mockClear();

    // Find and change the mocked select
    const genreSelect = screen.getByTestId("genre-select");
    fireEvent.change(genreSelect, { target: { value: "tango" } });

    // Check if onFilterChange was called with the correct arguments
    expect(mockOnFilterChange).toHaveBeenCalledWith({
      genre: "tango",
      name: "",
    });
  });

  it("resets filters when reset button is clicked", async () => {
    render(<ArtistFilters onFilterChange={mockOnFilterChange} />);

    // Set some filter values first
    const nameInput = screen.getByPlaceholderText("Buscar por nombre...");
    await userEvent.type(nameInput, "Test Artist");

    const genreSelect = screen.getByTestId("genre-select");
    fireEvent.change(genreSelect, { target: { value: "tango" } });

    // Clear previous calls
    mockOnFilterChange.mockClear();

    // Click the reset button
    const resetButton = screen.getByText("Limpiar filtros");
    await userEvent.click(resetButton);

    // Check if inputs were reset
    expect(nameInput).toHaveValue("");

    // Check if onFilterChange was called with reset values
    expect(mockOnFilterChange).toHaveBeenCalledWith({
      genre: undefined,
      name: "",
    });
  });
});
