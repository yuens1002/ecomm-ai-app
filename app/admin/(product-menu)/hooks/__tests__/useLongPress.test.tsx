import { act, renderHook } from "@testing-library/react";
import { useLongPress } from "../useLongPress";

describe("useLongPress", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("calls onLongPress after duration", () => {
    const onLongPress = jest.fn();

    const { result } = renderHook(() =>
      useLongPress({
        duration: 500,
        visualDelay: 0, // Disable visual delay for testing core logic
        onLongPress,
      })
    );

    // Start press
    act(() => {
      result.current.handlers.onPointerDown({
        button: 0,
        clientX: 100,
        clientY: 100,
      } as React.PointerEvent);
    });

    expect(result.current.isPressed).toBe(true);
    expect(onLongPress).not.toHaveBeenCalled();

    // Advance time past duration
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(onLongPress).toHaveBeenCalledTimes(1);
    expect(result.current.isPressed).toBe(false);
  });

  it("does not call onLongPress if released before duration", () => {
    const onLongPress = jest.fn();

    const { result } = renderHook(() =>
      useLongPress({
        duration: 500,
        visualDelay: 0,
        onLongPress,
      })
    );

    // Start press
    act(() => {
      result.current.handlers.onPointerDown({
        button: 0,
        clientX: 100,
        clientY: 100,
      } as React.PointerEvent);
    });

    expect(result.current.isPressed).toBe(true);

    // Release before duration
    act(() => {
      jest.advanceTimersByTime(200);
      result.current.handlers.onPointerUp({} as React.PointerEvent);
    });

    expect(onLongPress).not.toHaveBeenCalled();
    expect(result.current.isPressed).toBe(false);

    // Advance past original duration - should not trigger
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(onLongPress).not.toHaveBeenCalled();
  });

  it("cancels long-press if pointer moves beyond threshold (scroll safety)", () => {
    const onLongPress = jest.fn();
    const onCancel = jest.fn();

    const { result } = renderHook(() =>
      useLongPress({
        duration: 500,
        visualDelay: 0,
        movementThreshold: 10,
        onLongPress,
        onCancel,
      })
    );

    // Start press at (100, 100)
    act(() => {
      result.current.handlers.onPointerDown({
        button: 0,
        clientX: 100,
        clientY: 100,
      } as React.PointerEvent);
    });

    expect(result.current.isPressed).toBe(true);

    // Move beyond threshold (> 10px)
    act(() => {
      result.current.handlers.onPointerMove({
        clientX: 100,
        clientY: 115, // 15px movement
      } as React.PointerEvent);
    });

    expect(result.current.isPressed).toBe(false);
    expect(onCancel).toHaveBeenCalledTimes(1);

    // Advance time - should not trigger long press
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(onLongPress).not.toHaveBeenCalled();
  });

  it("does not cancel if movement is within threshold", () => {
    const onLongPress = jest.fn();
    const onCancel = jest.fn();

    const { result } = renderHook(() =>
      useLongPress({
        duration: 500,
        visualDelay: 0,
        movementThreshold: 10,
        onLongPress,
        onCancel,
      })
    );

    // Start press at (100, 100)
    act(() => {
      result.current.handlers.onPointerDown({
        button: 0,
        clientX: 100,
        clientY: 100,
      } as React.PointerEvent);
    });

    // Move within threshold (< 10px)
    act(() => {
      result.current.handlers.onPointerMove({
        clientX: 105,
        clientY: 105, // ~7px diagonal movement
      } as React.PointerEvent);
    });

    expect(result.current.isPressed).toBe(true);
    expect(onCancel).not.toHaveBeenCalled();

    // Complete the long press
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(onLongPress).toHaveBeenCalledTimes(1);
  });

  it("cancels on pointer leave", () => {
    const onLongPress = jest.fn();
    const onCancel = jest.fn();

    const { result } = renderHook(() =>
      useLongPress({
        duration: 500,
        visualDelay: 0,
        onLongPress,
        onCancel,
      })
    );

    act(() => {
      result.current.handlers.onPointerDown({
        button: 0,
        clientX: 100,
        clientY: 100,
      } as React.PointerEvent);
    });

    expect(result.current.isPressed).toBe(true);

    act(() => {
      result.current.handlers.onPointerLeave({} as React.PointerEvent);
    });

    expect(result.current.isPressed).toBe(false);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("ignores non-primary button presses", () => {
    const onLongPress = jest.fn();

    const { result } = renderHook(() =>
      useLongPress({
        duration: 500,
        visualDelay: 0,
        onLongPress,
      })
    );

    // Right-click (button = 2)
    act(() => {
      result.current.handlers.onPointerDown({
        button: 2,
        clientX: 100,
        clientY: 100,
      } as React.PointerEvent);
    });

    expect(result.current.isPressed).toBe(false);

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(onLongPress).not.toHaveBeenCalled();
  });

  it("tracks progress during long-press", () => {
    const onLongPress = jest.fn();

    const { result } = renderHook(() =>
      useLongPress({
        duration: 500,
        visualDelay: 0,
        onLongPress,
      })
    );

    act(() => {
      result.current.handlers.onPointerDown({
        button: 0,
        clientX: 100,
        clientY: 100,
      } as React.PointerEvent);
    });

    expect(result.current.progress).toBe(0);

    // Advance to 50%
    act(() => {
      jest.advanceTimersByTime(250);
    });

    expect(result.current.progress).toBeGreaterThan(0.4);
    expect(result.current.progress).toBeLessThan(0.6);

    // Complete
    act(() => {
      jest.advanceTimersByTime(250);
    });

    expect(result.current.progress).toBe(0); // Reset after completion
  });

  it("calls onStart when press begins (with no visual delay)", () => {
    const onLongPress = jest.fn();
    const onStart = jest.fn();

    const { result } = renderHook(() =>
      useLongPress({
        duration: 500,
        visualDelay: 0,
        onLongPress,
        onStart,
      })
    );

    act(() => {
      result.current.handlers.onPointerDown({
        button: 0,
        clientX: 100,
        clientY: 100,
      } as React.PointerEvent);
    });

    expect(onStart).toHaveBeenCalledTimes(1);
  });

  describe("visual delay", () => {
    it("delays isPressed and onStart until visualDelay elapses", () => {
      const onLongPress = jest.fn();
      const onStart = jest.fn();

      const { result } = renderHook(() =>
        useLongPress({
          duration: 500,
          visualDelay: 150,
          onLongPress,
          onStart,
        })
      );

      act(() => {
        result.current.handlers.onPointerDown({
          button: 0,
          clientX: 100,
          clientY: 100,
        } as React.PointerEvent);
      });

      // Before visual delay
      expect(result.current.isPressed).toBe(false);
      expect(onStart).not.toHaveBeenCalled();

      // After visual delay
      act(() => {
        jest.advanceTimersByTime(150);
      });

      expect(result.current.isPressed).toBe(true);
      expect(onStart).toHaveBeenCalledTimes(1);
    });

    it("does not show visual feedback for quick taps", () => {
      const onLongPress = jest.fn();
      const onStart = jest.fn();

      const { result } = renderHook(() =>
        useLongPress({
          duration: 500,
          visualDelay: 150,
          onLongPress,
          onStart,
        })
      );

      act(() => {
        result.current.handlers.onPointerDown({
          button: 0,
          clientX: 100,
          clientY: 100,
        } as React.PointerEvent);
      });

      // Quick release before visual delay
      act(() => {
        jest.advanceTimersByTime(100);
        result.current.handlers.onPointerUp({} as React.PointerEvent);
      });

      // Visual feedback should never have shown
      expect(result.current.isPressed).toBe(false);
      expect(onStart).not.toHaveBeenCalled();
    });

    it("progress runs for remaining duration after visual delay", () => {
      const onLongPress = jest.fn();

      const { result } = renderHook(() =>
        useLongPress({
          duration: 500,
          visualDelay: 100,
          onLongPress,
        })
      );

      act(() => {
        result.current.handlers.onPointerDown({
          button: 0,
          clientX: 100,
          clientY: 100,
        } as React.PointerEvent);
      });

      // Advance past visual delay
      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(result.current.isPressed).toBe(true);
      expect(result.current.progress).toBe(0);

      // Advance to ~50% of remaining duration (400ms total, so 200ms more)
      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(result.current.progress).toBeGreaterThan(0.4);
      expect(result.current.progress).toBeLessThan(0.6);

      // Complete the long press (200ms more to reach 500ms total)
      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(onLongPress).toHaveBeenCalledTimes(1);
      expect(result.current.progress).toBe(0);
    });
  });
});
