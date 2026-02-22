import { renderHook, act } from "@testing-library/react";
import { useFormHistory } from "../useFormHistory";

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

const STORAGE_KEY = "test-product";

describe("useFormHistory", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("pushSnapshot", () => {
    it("stores snapshot in localStorage under correct key", () => {
      const { result } = renderHook(() =>
        useFormHistory<TestFormState>({ storageKey: STORAGE_KEY })
      );

      act(() => result.current.pushSnapshot(stateA));

      const raw = localStorage.getItem(`form-history:${STORAGE_KEY}:undo`);
      expect(raw).not.toBeNull();
      const entries = JSON.parse(raw!);
      expect(entries).toHaveLength(1);
      expect(entries[0].state).toEqual(stateA);
      expect(typeof entries[0].timestamp).toBe("number");
    });

    it("clears redo stack when new snapshot pushed", () => {
      const { result } = renderHook(() =>
        useFormHistory<TestFormState>({ storageKey: STORAGE_KEY })
      );

      // Build a redo stack: push A, push B, then undo
      act(() => result.current.pushSnapshot(stateA));
      act(() => result.current.pushSnapshot(stateB));
      act(() => {
        result.current.undo(stateC);
      });
      expect(result.current.getRedoCount()).toBe(1);

      // Push new snapshot — redo should be cleared
      act(() => result.current.pushSnapshot(stateC));
      expect(result.current.getRedoCount()).toBe(0);
    });

    it("trims to maxEntries (FIFO) when exceeded", () => {
      const { result } = renderHook(() =>
        useFormHistory<TestFormState>({ storageKey: STORAGE_KEY, maxEntries: 2 })
      );

      act(() => result.current.pushSnapshot(stateA));
      act(() => result.current.pushSnapshot(stateB));
      act(() => result.current.pushSnapshot(stateC));

      expect(result.current.getUndoCount()).toBe(2);

      // The oldest entry (stateA) should have been trimmed — undo twice to verify
      let undone1: TestFormState | null = null;
      act(() => {
        undone1 = result.current.undo(stateA);
      });
      expect(undone1).toEqual(stateC);

      let undone2: TestFormState | null = null;
      act(() => {
        undone2 = result.current.undo(stateA);
      });
      expect(undone2).toEqual(stateB);

      // No more undos left
      let undone3: TestFormState | null = null;
      act(() => {
        undone3 = result.current.undo(stateA);
      });
      expect(undone3).toBeNull();
    });
  });

  describe("undo / redo", () => {
    it("returns null when undo stack is empty", () => {
      const { result } = renderHook(() =>
        useFormHistory<TestFormState>({ storageKey: STORAGE_KEY })
      );

      let restored: TestFormState | null = null;
      act(() => {
        restored = result.current.undo(stateA);
      });
      expect(restored).toBeNull();
    });

    it("returns null when redo stack is empty", () => {
      const { result } = renderHook(() =>
        useFormHistory<TestFormState>({ storageKey: STORAGE_KEY })
      );

      let restored: TestFormState | null = null;
      act(() => {
        restored = result.current.redo(stateA);
      });
      expect(restored).toBeNull();
    });

    it("undo returns previous state and moves current to redo", () => {
      const { result } = renderHook(() =>
        useFormHistory<TestFormState>({ storageKey: STORAGE_KEY })
      );

      act(() => result.current.pushSnapshot(stateA));

      let restored: TestFormState | null = null;
      act(() => {
        restored = result.current.undo(stateB);
      });
      expect(restored).toEqual(stateA);
      expect(result.current.getUndoCount()).toBe(0);
      expect(result.current.getRedoCount()).toBe(1);
    });

    it("redo returns next state and moves current to undo", () => {
      const { result } = renderHook(() =>
        useFormHistory<TestFormState>({ storageKey: STORAGE_KEY })
      );

      act(() => result.current.pushSnapshot(stateA));
      act(() => {
        result.current.undo(stateB);
      });

      let restored: TestFormState | null = null;
      act(() => {
        restored = result.current.redo(stateA);
      });
      expect(restored).toEqual(stateB);
      expect(result.current.getUndoCount()).toBe(1);
      expect(result.current.getRedoCount()).toBe(0);
    });

    it("full cycle: push → push → undo → redo preserves states", () => {
      const { result } = renderHook(() =>
        useFormHistory<TestFormState>({ storageKey: STORAGE_KEY })
      );

      act(() => result.current.pushSnapshot(stateA));
      act(() => result.current.pushSnapshot(stateB));

      // Undo from stateC (current) — should get stateB back
      let undone: TestFormState | null = null;
      act(() => {
        undone = result.current.undo(stateC);
      });
      expect(undone).toEqual(stateB);

      // Redo from stateB (current after undo) — should get stateC back
      let redone: TestFormState | null = null;
      act(() => {
        redone = result.current.redo(stateB);
      });
      expect(redone).toEqual(stateC);
    });
  });

  describe("edge cases", () => {
    it("recovers gracefully from corrupt localStorage JSON", () => {
      localStorage.setItem(`form-history:${STORAGE_KEY}:undo`, "not-json{{{");

      const { result } = renderHook(() =>
        useFormHistory<TestFormState>({ storageKey: STORAGE_KEY })
      );

      // Should not throw — readStack catches parse errors
      expect(result.current.getUndoCount()).toBe(0);

      // Should still work after recovery
      act(() => result.current.pushSnapshot(stateA));
      expect(result.current.getUndoCount()).toBe(1);
    });

    it("handles localStorage quota exceeded with fallback trim", () => {
      const original = Storage.prototype.setItem;
      let callCount = 0;

      Storage.prototype.setItem = function (key: string, value: string) {
        callCount++;
        if (callCount === 1) {
          throw new DOMException("quota exceeded", "QuotaExceededError");
        }
        original.call(this, key, value);
      };

      const { result } = renderHook(() =>
        useFormHistory<TestFormState>({ storageKey: STORAGE_KEY, maxEntries: 4 })
      );

      // Should not throw
      act(() => result.current.pushSnapshot(stateA));

      Storage.prototype.setItem = original;
    });
  });

  describe("clear", () => {
    it("empties both stacks", () => {
      const { result } = renderHook(() =>
        useFormHistory<TestFormState>({ storageKey: STORAGE_KEY })
      );

      act(() => result.current.pushSnapshot(stateA));
      act(() => result.current.pushSnapshot(stateB));
      act(() => {
        result.current.undo(stateC);
      });

      expect(result.current.getUndoCount()).toBe(1);
      expect(result.current.getRedoCount()).toBe(1);

      act(() => result.current.clear());

      expect(result.current.getUndoCount()).toBe(0);
      expect(result.current.getRedoCount()).toBe(0);
    });
  });
});
