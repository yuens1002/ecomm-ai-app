import { act, renderHook } from "@testing-library/react";
import { useMenuBuilderState } from "../useMenuBuilderState";

const pushMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
  useSearchParams: () => ({
    get: (key: string) => {
      if (key === "view") return "all-categories";
      return null;
    },
  }),
}));

describe("useMenuBuilderState - undo/redo", () => {
  beforeEach(() => {
    pushMock.mockClear();
  });

  it("pushes undo entries and moves them between undo/redo stacks", async () => {
    const undoFn = jest.fn(async () => {});
    const redoFn = jest.fn(async () => {});

    const { result } = renderHook(() => useMenuBuilderState());

    act(() => {
      result.current.pushUndoAction({
        action: "test-action",
        timestamp: new Date(),
        data: { undo: undoFn, redo: redoFn },
      });
    });

    expect(result.current.undoStack).toHaveLength(1);
    expect(result.current.redoStack).toHaveLength(0);

    await act(async () => {
      await result.current.undo();
    });

    expect(undoFn).toHaveBeenCalledTimes(1);
    expect(result.current.undoStack).toHaveLength(0);
    expect(result.current.redoStack).toHaveLength(1);

    await act(async () => {
      await result.current.redo();
    });

    expect(redoFn).toHaveBeenCalledTimes(1);
    expect(result.current.undoStack).toHaveLength(1);
    expect(result.current.redoStack).toHaveLength(0);
  });
});
