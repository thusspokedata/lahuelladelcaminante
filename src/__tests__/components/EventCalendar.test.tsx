import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EventCalendar } from "@/app/[locale]/events/ui/EventCalendar";

// Mock the Calendar component
vi.mock("@/components/ui/calendar", () => ({
  Calendar: ({
    selected,
    onSelect,
    components,
  }: {
    selected?: Date | undefined;
    onSelect: (date: Date | undefined) => void;
    components?: { DayContent?: React.ComponentType<{ date: Date }> };
  }) => (
    <div data-testid="calendar-mock">
      <div>Selected: {selected ? selected.toISOString().split("T")[0] : "none"}</div>
      <button onClick={() => onSelect(new Date("2023-12-01"))} data-testid="select-date">
        Select Date
      </button>
      <button onClick={() => onSelect(undefined)} data-testid="clear-date">
        Clear Date
      </button>
      {/* Check if DayContent component is provided */}
      <div data-testid="has-day-content">
        {components && components.DayContent
          ? "Custom DayContent provided"
          : "No custom DayContent"}
      </div>
    </div>
  ),
}));

describe("EventCalendar Component", () => {
  const mockEvents = [
    {
      dates: [{ date: "2023-12-01" }, { date: "2023-12-15" }],
    },
    {
      dates: [{ date: "2023-12-10" }],
    },
  ];

  it("renders the calendar component", () => {
    render(<EventCalendar />);

    expect(screen.getByTestId("calendar-mock")).toBeInTheDocument();
  });

  it("displays the selected date when provided", () => {
    const selectedDate = new Date("2023-12-01");
    render(<EventCalendar selectedDate={selectedDate} />);

    expect(screen.getByText("Selected: 2023-12-01")).toBeInTheDocument();
  });

  it("calls onSelect when a date is selected", () => {
    const onSelectMock = vi.fn();
    render(<EventCalendar onSelect={onSelectMock} />);

    const selectDateButton = screen.getByTestId("select-date");
    fireEvent.click(selectDateButton);

    expect(onSelectMock).toHaveBeenCalledWith(expect.any(Date));
    const calledDate = onSelectMock.mock.calls[0][0];
    expect(calledDate.toISOString().split("T")[0]).toBe("2023-12-01");
  });

  it("calls onSelect with undefined when date is cleared", () => {
    const onSelectMock = vi.fn();
    const selectedDate = new Date("2023-12-01");
    render(<EventCalendar onSelect={onSelectMock} selectedDate={selectedDate} />);

    const clearDateButton = screen.getByTestId("clear-date");
    fireEvent.click(clearDateButton);

    expect(onSelectMock).toHaveBeenCalledWith(undefined);
  });

  it("provides custom DayContent component when events are provided", () => {
    render(<EventCalendar events={mockEvents} />);

    expect(screen.getByText("Custom DayContent provided")).toBeInTheDocument();
  });
});
