import { fireEvent, render, screen, act } from "@testing-library/react";
import { TableRow } from "../TableRow";

// Mock motion/react to avoid animation issues in tests
jest.mock("motion/react", () => ({
  motion: {
    tr: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <tr {...props}>{children}</tr>
    ),
  },
}));

// Helper to render TableRow in a table context
function renderTableRow(props: React.ComponentProps<typeof TableRow>) {
  return render(
    <table>
      <tbody>
        <TableRow {...props} />
      </tbody>
    </table>
  );
}

// Jest's fake timers don't work with jest.useFakeTimers() for setTimeout in React
// So we need to advance timers manually
const CLICK_DELAY_MS = 200;

describe("TableRow", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("onRowClick with shiftKey", () => {
    it("passes shiftKey: true when shift is held during click", async () => {
      const onRowClick = jest.fn();

      renderTableRow({
        onRowClick,
        children: <td>Row content</td>,
      });

      const row = screen.getByRole("row");

      // Click with shift key held
      fireEvent.click(row, { shiftKey: true });

      // Advance timers to trigger the delayed click
      act(() => {
        jest.advanceTimersByTime(CLICK_DELAY_MS);
      });

      expect(onRowClick).toHaveBeenCalledTimes(1);
      expect(onRowClick).toHaveBeenCalledWith({ shiftKey: true });
    });

    it("passes shiftKey: false when shift is NOT held during click", async () => {
      const onRowClick = jest.fn();

      renderTableRow({
        onRowClick,
        children: <td>Row content</td>,
      });

      const row = screen.getByRole("row");

      // Click without shift key
      fireEvent.click(row, { shiftKey: false });

      // Advance timers
      act(() => {
        jest.advanceTimersByTime(CLICK_DELAY_MS);
      });

      expect(onRowClick).toHaveBeenCalledTimes(1);
      expect(onRowClick).toHaveBeenCalledWith({ shiftKey: false });
    });

    it("does not fire onRowClick when clicking interactive elements", async () => {
      const onRowClick = jest.fn();

      renderTableRow({
        onRowClick,
        children: (
          <td>
            <button>Click me</button>
          </td>
        ),
      });

      const button = screen.getByRole("button");

      // Click the button (interactive element)
      fireEvent.click(button, { shiftKey: true });

      // Advance timers
      act(() => {
        jest.advanceTimersByTime(CLICK_DELAY_MS);
      });

      // onRowClick should NOT be called for interactive elements
      expect(onRowClick).not.toHaveBeenCalled();
    });

    it("does not fire onRowClick when clicking elements with data-row-click-ignore", async () => {
      const onRowClick = jest.fn();

      renderTableRow({
        onRowClick,
        children: (
          <td>
            <div data-row-click-ignore>Ignore this area</div>
          </td>
        ),
      });

      const ignoreArea = screen.getByText("Ignore this area");

      // Click the ignored area
      fireEvent.click(ignoreArea, { shiftKey: true });

      // Advance timers
      act(() => {
        jest.advanceTimersByTime(CLICK_DELAY_MS);
      });

      // onRowClick should NOT be called for ignored elements
      expect(onRowClick).not.toHaveBeenCalled();
    });

    it("cancels pending click when double-click occurs", async () => {
      const onRowClick = jest.fn();
      const onRowDoubleClick = jest.fn();

      renderTableRow({
        onRowClick,
        onRowDoubleClick,
        children: <td>Row content</td>,
      });

      const row = screen.getByRole("row");

      // Single click
      fireEvent.click(row);

      // Double click before delay completes
      act(() => {
        jest.advanceTimersByTime(100); // Half the delay
      });
      fireEvent.doubleClick(row);

      // Advance past the delay
      act(() => {
        jest.advanceTimersByTime(CLICK_DELAY_MS);
      });

      // onRowClick should NOT be called (cancelled by double click)
      // onRowDoubleClick SHOULD be called
      expect(onRowClick).not.toHaveBeenCalled();
      expect(onRowDoubleClick).toHaveBeenCalledTimes(1);
    });
  });
});
