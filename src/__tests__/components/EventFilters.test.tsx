import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EventFilters } from "@/app/events/ui/EventFilters";
import { ReactNode } from "react";

// Mock the Select component
vi.mock("@/components/ui/select", () => {
  return {
    Select: ({
      children,
      value,
      onValueChange,
    }: {
      children: ReactNode;
      value?: string;
      onValueChange: (value: string) => void;
    }) => (
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
          <option value="jazz">Jazz</option>
          <option value="electronica">Electrónica</option>
        </select>
        {children}
      </div>
    ),
    SelectContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    SelectTrigger: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    SelectValue: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    SelectItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  };
});

// Mock the EventCalendar component
vi.mock("@/app/events/ui/EventCalendar", () => ({
  EventCalendar: ({
    onSelect,
    selectedDate,
  }: {
    onSelect: (date: Date | undefined) => void;
    selectedDate?: Date;
  }) => (
    <div data-testid="event-calendar">
      <button onClick={() => onSelect(new Date("2023-12-01"))} data-testid="select-date">
        Select Date
      </button>
      <button onClick={() => onSelect(undefined)} data-testid="clear-date">
        Clear Date
      </button>
      {selectedDate && <div>Selected: {selectedDate.toISOString().split("T")[0]}</div>}
    </div>
  ),
}));

describe("EventFilters Component", () => {
  const mockEvents = [
    {
      dates: [{ date: "2023-12-01" }, { date: "2023-12-15" }],
    },
    {
      dates: [{ date: "2023-12-10" }],
    },
  ];

  const mockOnFilterChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all filter options correctly", () => {
    render(
      <EventFilters
        onFilterChange={mockOnFilterChange}
        selectedDate={undefined}
        events={mockEvents}
      />
    );

    // Check for filter titles
    expect(screen.getByText("Filtros")).toBeInTheDocument();
    expect(screen.getByText("Fecha")).toBeInTheDocument();
    expect(screen.getByText("Género")).toBeInTheDocument();
    expect(screen.getByText("Artista")).toBeInTheDocument();

    // Check for artist input
    expect(screen.getByPlaceholderText("Buscar artista...")).toBeInTheDocument();

    // Check for buttons
    expect(screen.getByText("Aplicar Filtros")).toBeInTheDocument();
    expect(screen.getByText("Mostrar Todos")).toBeInTheDocument();
  });

  it("calls onFilterChange when loaded with initial values", () => {
    const selectedDate = new Date("2023-12-01");

    render(
      <EventFilters
        onFilterChange={mockOnFilterChange}
        selectedDate={selectedDate}
        events={mockEvents}
      />
    );

    // No initial call to onFilterChange on first render
    expect(mockOnFilterChange).not.toHaveBeenCalled();
  });

  it("updates artist filter and applies filters", async () => {
    render(
      <EventFilters
        onFilterChange={mockOnFilterChange}
        selectedDate={undefined}
        events={mockEvents}
      />
    );

    // Type in the artist input
    const artistInput = screen.getByPlaceholderText("Buscar artista...");
    await userEvent.type(artistInput, "Test Artist");

    // Click apply filters button
    const applyButton = screen.getByText("Aplicar Filtros");
    await userEvent.click(applyButton);

    // Check if onFilterChange was called with the correct arguments
    expect(mockOnFilterChange).toHaveBeenCalledWith({
      date: undefined,
      genre: "all",
      artist: "Test Artist",
      organizer: "",
    });
  });

  it("updates genre filter and applies filters", async () => {
    render(
      <EventFilters
        onFilterChange={mockOnFilterChange}
        selectedDate={undefined}
        events={mockEvents}
      />
    );

    // Change the genre select
    const genreSelect = screen.getAllByTestId("genre-select")[0];
    fireEvent.change(genreSelect, { target: { value: "tango" } });

    // Click apply filters button
    const applyButton = screen.getByText("Aplicar Filtros");
    await userEvent.click(applyButton);

    // Check if onFilterChange was called with the correct arguments
    expect(mockOnFilterChange).toHaveBeenCalledWith({
      date: undefined,
      genre: "tango",
      artist: "",
      organizer: "",
    });
  });

  it("updates date filter and applies filters", async () => {
    render(
      <EventFilters
        onFilterChange={mockOnFilterChange}
        selectedDate={undefined}
        events={mockEvents}
      />
    );

    // Select a date
    const selectDateButton = screen.getByTestId("select-date");
    await userEvent.click(selectDateButton);

    // Click apply filters button
    const applyButton = screen.getByText("Aplicar Filtros");
    await userEvent.click(applyButton);

    // Check if onFilterChange was called with the correct arguments
    expect(mockOnFilterChange).toHaveBeenCalledWith({
      date: expect.any(Date),
      genre: "all",
      artist: "",
      organizer: "",
    });

    // The date should be December 1, 2023
    const calledWithDate = mockOnFilterChange.mock.calls[0][0].date;
    expect(calledWithDate.toISOString().split("T")[0]).toBe("2023-12-01");
  });

  it("resets all filters when Show All button is clicked", async () => {
    render(
      <EventFilters
        onFilterChange={mockOnFilterChange}
        selectedDate={new Date("2023-12-01")}
        events={mockEvents}
      />
    );

    // Set some values first
    const artistInput = screen.getByPlaceholderText("Buscar artista...");
    await userEvent.type(artistInput, "Test Artist");

    const genreSelect = screen.getAllByTestId("genre-select")[0];
    fireEvent.change(genreSelect, { target: { value: "tango" } });

    // Reset mocks to clearly see the reset call
    mockOnFilterChange.mockClear();

    // Click show all button
    const showAllButton = screen.getByText("Mostrar Todos");
    await userEvent.click(showAllButton);

    // Check if onFilterChange was called with reset values
    expect(mockOnFilterChange).toHaveBeenCalledWith({
      date: undefined,
      genre: "all",
      artist: "",
      organizer: "",
    });
  });
});
