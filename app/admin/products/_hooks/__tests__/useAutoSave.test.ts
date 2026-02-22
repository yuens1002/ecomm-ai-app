import { renderHook, act } from "@testing-library/react";
import { useAutoSave } from "../useAutoSave";

interface TestFormState {
  productInfo: { name: string; slug: string };
  categoryIds: string[];
}

const stateA: TestFormState = {
  productInfo: { name: "Ethiopia Yirgacheffe", slug: "ethiopia-yirgacheffe" },
  categoryIds: ["cat-1"],
};

const stateB: TestFormState = {
  productInfo: { name: "Colombia Huila", slug: "colombia-huila" },
  categoryIds: ["cat-1", "cat-2"],
};

const stateC: TestFormState = {
  productInfo: { name: "Brazil Santos", slug: "brazil-santos" },
  categoryIds: ["cat-3"],
};

const HISTORY_KEY = "test-autosave";
const DEBOUNCE_MS = 800;

function createProps(overrides: Partial<Parameters<typeof useAutoSave<TestFormState>>[0]> = {}) {
  return {
    saveFn: jest.fn().mockResolvedValue(undefined),
    debounceMs: DEBOUNCE_MS,
    isValid: true,
    deps: [0] as unknown[],
    formState: stateA,
    historyKey: HISTORY_KEY,
    onRestore: jest.fn(),
    ...overrides,
  };
}

describe("useAutoSave", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("mount behavior", () => {
    it("does not call saveFn on initial render", () => {
      const props = createProps();
      renderHook(() => useAutoSave<TestFormState>(props));

      jest.advanceTimersByTime(DEBOUNCE_MS + 100);
      expect(props.saveFn).not.toHaveBeenCalled();
    });

    it("initial status is 'saved'", () => {
      const props = createProps();
      const { result } = renderHook(() => useAutoSave<TestFormState>(props));

      expect(result.current.status).toBe("saved");
    });
  });

  describe("debounced save", () => {
    it("calls saveFn after debounce when deps change", async () => {
      const props = createProps();
      const { rerender } = renderHook(
        ({ deps, ...rest }) => useAutoSave<TestFormState>({ deps, ...rest }),
        { initialProps: { ...props, deps: [0] } }
      );

      // Change deps to trigger save
      rerender({ ...props, deps: [1] });

      // saveFn should not be called yet (still debouncing)
      expect(props.saveFn).not.toHaveBeenCalled();

      // Advance past debounce
      await act(async () => {
        jest.advanceTimersByTime(DEBOUNCE_MS + 100);
      });

      expect(props.saveFn).toHaveBeenCalledTimes(1);
    });

    it("sets status to 'error' when isValid is false", () => {
      const props = createProps({ isValid: true });
      const { result, rerender } = renderHook(
        ({ deps, isValid, ...rest }) => useAutoSave<TestFormState>({ deps, isValid, ...rest }),
        { initialProps: { ...props, deps: [0], isValid: true } }
      );

      // Change deps with isValid=false
      rerender({ ...props, deps: [1], isValid: false });

      expect(result.current.status).toBe("error");
      // saveFn should not have been called
      jest.advanceTimersByTime(DEBOUNCE_MS + 100);
      expect(props.saveFn).not.toHaveBeenCalled();
    });
  });

  describe("save errors", () => {
    it("sets status to 'error' when saveFn throws", async () => {
      const failingSaveFn = jest.fn().mockRejectedValue(new Error("Network error"));
      const props = createProps({ saveFn: failingSaveFn });
      const { result, rerender } = renderHook(
        ({ deps, ...rest }) => useAutoSave<TestFormState>({ deps, ...rest }),
        { initialProps: { ...props, deps: [0] } }
      );

      rerender({ ...props, deps: [1] });

      await act(async () => {
        jest.advanceTimersByTime(DEBOUNCE_MS + 100);
      });

      expect(result.current.status).toBe("error");
    });
  });

  describe("undo/redo integration", () => {
    it("undo calls onRestore with previous state", async () => {
      const onRestore = jest.fn();
      const props = createProps({ formState: stateA, onRestore });
      const { result, rerender } = renderHook(
        ({ deps, formState, ...rest }) =>
          useAutoSave<TestFormState>({ deps, formState, ...rest }),
        { initialProps: { ...props, deps: [0], formState: stateA } }
      );

      // Trigger a save to create a snapshot (stateA → stateB)
      rerender({ ...props, deps: [1], formState: stateB, onRestore });
      await act(async () => {
        jest.advanceTimersByTime(DEBOUNCE_MS + 100);
      });

      expect(props.saveFn).toHaveBeenCalledTimes(1);

      // Now undo — should restore stateA
      act(() => result.current.undo());

      expect(onRestore).toHaveBeenCalledWith(stateA);
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(true);
    });

    it("redo calls onRestore with next state", async () => {
      const onRestore = jest.fn();
      const props = createProps({ formState: stateA, onRestore });
      const { result, rerender } = renderHook(
        ({ deps, formState, ...rest }) =>
          useAutoSave<TestFormState>({ deps, formState, ...rest }),
        { initialProps: { ...props, deps: [0], formState: stateA } }
      );

      // Trigger a save (stateA → stateB)
      rerender({ ...props, deps: [1], formState: stateB, onRestore });
      await act(async () => {
        jest.advanceTimersByTime(DEBOUNCE_MS + 100);
      });

      // Undo
      act(() => result.current.undo());
      expect(onRestore).toHaveBeenCalledWith(stateA);

      // Redo — should restore stateB (the state that was current when undo was called)
      act(() => result.current.redo());
      expect(onRestore).toHaveBeenCalledWith(stateB);
      expect(result.current.canRedo).toBe(false);
    });
  });

  describe("restore persistence (isRestoringRef fix)", () => {
    it("restore-triggered save calls saveFn but does not push snapshot", async () => {
      const onRestore = jest.fn();
      const saveFn = jest.fn().mockResolvedValue(undefined);
      const props = createProps({ saveFn, formState: stateA, onRestore });
      const { result, rerender } = renderHook(
        ({ deps, formState, ...rest }) =>
          useAutoSave<TestFormState>({ deps, formState, ...rest }),
        { initialProps: { ...props, deps: [0], formState: stateA } }
      );

      // Save 1: stateA → stateB
      rerender({ ...props, deps: [1], formState: stateB, onRestore });
      await act(async () => {
        jest.advanceTimersByTime(DEBOUNCE_MS + 100);
      });

      // Save 2: stateB → stateC
      rerender({ ...props, deps: [2], formState: stateC, onRestore });
      await act(async () => {
        jest.advanceTimersByTime(DEBOUNCE_MS + 100);
      });

      expect(saveFn).toHaveBeenCalledTimes(2);
      expect(result.current.canUndo).toBe(true);

      // Undo — triggers restore
      act(() => result.current.undo());
      expect(onRestore).toHaveBeenCalled();

      const undoCountBefore = result.current.canUndo;

      // The restore triggers deps change → debounced save
      // Simulate the deps change that onRestore would cause
      rerender({ ...props, deps: [3], formState: stateB, onRestore });
      await act(async () => {
        jest.advanceTimersByTime(DEBOUNCE_MS + 100);
      });

      // saveFn called for the restore save
      expect(saveFn).toHaveBeenCalledTimes(3);

      // The undo count should NOT have increased — restore save must not push snapshot
      // Before the isRestoringRef fix, this would have pushed a circular undo entry
      expect(result.current.canUndo).toBe(undoCountBefore);
    });
  });

  describe("markExternalSave", () => {
    it("records snapshot without calling saveFn", async () => {
      const saveFn = jest.fn().mockResolvedValue(undefined);
      const props = createProps({ saveFn, formState: stateA });
      const { result, rerender } = renderHook(
        ({ deps, formState, ...rest }) =>
          useAutoSave<TestFormState>({ deps, formState, ...rest }),
        { initialProps: { ...props, deps: [0], formState: stateA } }
      );

      // Trigger a normal save first to establish lastSavedState
      rerender({ ...props, deps: [1], formState: stateB });
      await act(async () => {
        jest.advanceTimersByTime(DEBOUNCE_MS + 100);
      });

      expect(saveFn).toHaveBeenCalledTimes(1);
      const callCountBefore = saveFn.mock.calls.length;

      // Mark an external save with new state
      act(() => result.current.markExternalSave(stateC));

      // saveFn should NOT have been called again
      expect(saveFn).toHaveBeenCalledTimes(callCountBefore);

      // But undo should now be possible (snapshot was recorded)
      expect(result.current.canUndo).toBe(true);
    });
  });
});
