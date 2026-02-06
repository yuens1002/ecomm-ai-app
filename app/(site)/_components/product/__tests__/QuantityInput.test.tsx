import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuantityInput } from "../QuantityInput";

describe("QuantityInput", () => {
  const defaultProps = {
    value: 1,
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders with default label", () => {
      render(<QuantityInput {...defaultProps} />);

      expect(screen.getByText("Qty")).toBeInTheDocument();
      expect(screen.getByRole("textbox")).toHaveValue("1");
    });

    it("renders with custom label", () => {
      render(<QuantityInput {...defaultProps} label="Quantity" />);

      expect(screen.getByText("Quantity")).toBeInTheDocument();
    });

    it("hides label when showLabel is false", () => {
      render(<QuantityInput {...defaultProps} showLabel={false} />);

      expect(screen.queryByText("Qty")).not.toBeInTheDocument();
    });

    it("shows correct value", () => {
      render(<QuantityInput {...defaultProps} value={5} />);

      expect(screen.getByRole("textbox")).toHaveValue("5");
    });

    it("applies custom className", () => {
      const { container } = render(
        <QuantityInput {...defaultProps} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass("custom-class");
    });

    it("shows disabled state", () => {
      render(<QuantityInput {...defaultProps} disabled />);

      expect(screen.getByRole("textbox")).toBeDisabled();
    });
  });

  describe("Value Changes", () => {
    it("calls onChange with valid value", () => {
      const onChange = jest.fn();
      render(<QuantityInput {...defaultProps} onChange={onChange} value={1} />);

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "5" } });

      expect(onChange).toHaveBeenCalledWith(5);
    });

    it("does not call onChange with value below min", () => {
      const onChange = jest.fn();
      render(
        <QuantityInput {...defaultProps} onChange={onChange} min={1} value={1} />
      );

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "0" } });

      // Should not call onChange with 0 (below min)
      expect(onChange).not.toHaveBeenCalledWith(0);
    });

    it("does not call onChange with value above max", () => {
      const onChange = jest.fn();
      render(
        <QuantityInput {...defaultProps} onChange={onChange} max={10} value={5} />
      );

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "15" } });

      // Should not call onChange with 15 (above max)
      expect(onChange).not.toHaveBeenCalledWith(15);
    });

    it("rejects non-numeric input", () => {
      const onChange = jest.fn();
      render(<QuantityInput {...defaultProps} onChange={onChange} />);

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "abc" } });

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe("Blur Behavior", () => {
    it("clamps value to min on blur", () => {
      const onChange = jest.fn();
      render(
        <QuantityInput {...defaultProps} onChange={onChange} min={1} value={1} />
      );

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "0" } });
      fireEvent.blur(input);

      // Should clamp to min (1)
      expect(input).toHaveValue("1");
    });

    it("clamps value to max on blur", () => {
      const onChange = jest.fn();
      render(
        <QuantityInput {...defaultProps} onChange={onChange} max={10} value={5} />
      );

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "99" } });
      fireEvent.blur(input);

      // Should clamp to max (10)
      expect(input).toHaveValue("10");
      expect(onChange).toHaveBeenCalledWith(10);
    });

    it("restores previous value on empty blur", () => {
      render(<QuantityInput {...defaultProps} value={5} />);

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "" } });
      fireEvent.blur(input);

      expect(input).toHaveValue("5");
    });
  });

  describe("Keyboard Navigation", () => {
    it("increments value with ArrowUp", () => {
      const onChange = jest.fn();
      render(<QuantityInput {...defaultProps} onChange={onChange} value={5} />);

      const input = screen.getByRole("textbox");
      fireEvent.keyDown(input, { key: "ArrowUp" });

      expect(onChange).toHaveBeenCalledWith(6);
    });

    it("decrements value with ArrowDown", () => {
      const onChange = jest.fn();
      render(<QuantityInput {...defaultProps} onChange={onChange} value={5} />);

      const input = screen.getByRole("textbox");
      fireEvent.keyDown(input, { key: "ArrowDown" });

      expect(onChange).toHaveBeenCalledWith(4);
    });

    it("does not decrement below min", () => {
      const onChange = jest.fn();
      render(
        <QuantityInput {...defaultProps} onChange={onChange} min={1} value={1} />
      );

      const input = screen.getByRole("textbox");
      fireEvent.keyDown(input, { key: "ArrowDown" });

      expect(onChange).not.toHaveBeenCalled();
    });

    it("does not increment above max", () => {
      const onChange = jest.fn();
      render(
        <QuantityInput {...defaultProps} onChange={onChange} max={5} value={5} />
      );

      const input = screen.getByRole("textbox");
      fireEvent.keyDown(input, { key: "ArrowUp" });

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("has accessible label", () => {
      render(<QuantityInput {...defaultProps} min={1} max={10} />);

      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute(
        "aria-label",
        "Quantity, minimum 1, maximum 10"
      );
    });

    it("has correct input mode for mobile keyboards", () => {
      render(<QuantityInput {...defaultProps} />);

      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("inputMode", "numeric");
    });
  });

  describe("Value Sync", () => {
    it("updates display when prop value changes", () => {
      const { rerender } = render(<QuantityInput {...defaultProps} value={1} />);

      expect(screen.getByRole("textbox")).toHaveValue("1");

      rerender(<QuantityInput {...defaultProps} value={10} />);

      expect(screen.getByRole("textbox")).toHaveValue("10");
    });
  });
});
