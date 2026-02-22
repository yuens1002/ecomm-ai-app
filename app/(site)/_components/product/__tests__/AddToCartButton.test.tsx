import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { AddToCartButton } from "../AddToCartButton";
import type { ButtonState } from "@/hooks/useAddToCartWithFeedback";

describe("AddToCartButton", () => {
  const defaultProps = {
    buttonState: "idle" as ButtonState,
    onAddToCart: jest.fn(),
    onActionClick: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering States", () => {
    it("renders idle state correctly", () => {
      render(<AddToCartButton {...defaultProps} buttonState="idle" />);

      expect(screen.getByRole("button")).toHaveTextContent("Add to Cart");
      expect(screen.getByRole("button")).not.toBeDisabled();
    });

    it("renders adding state correctly", () => {
      render(<AddToCartButton {...defaultProps} buttonState="adding" />);

      expect(screen.getByRole("button")).toHaveTextContent("Adding...");
      expect(screen.getByRole("button")).toHaveAttribute("aria-disabled", "true");
    });

    it("renders added state correctly", () => {
      render(<AddToCartButton {...defaultProps} buttonState="added" />);

      expect(screen.getByRole("button")).toHaveTextContent("Added!");
      expect(screen.getByRole("button")).toHaveClass("bg-green-600");
    });

    it("renders buy-now state correctly", () => {
      render(<AddToCartButton {...defaultProps} buttonState="buy-now" />);

      expect(screen.getByRole("button")).toHaveTextContent("Buy Now");
      expect(screen.getByRole("button")).toHaveClass("bg-amber-500");
      expect(screen.getByRole("button")).toHaveClass("animate-pulse");
    });

    it("renders checkout-now state correctly", () => {
      render(<AddToCartButton {...defaultProps} buttonState="checkout-now" />);

      expect(screen.getByRole("button")).toHaveTextContent("View Cart");
      expect(screen.getByRole("button")).toHaveClass("bg-amber-500");
    });
  });

  describe("Click Handlers", () => {
    it("calls onAddToCart when in idle state", () => {
      const onAddToCart = jest.fn();
      render(
        <AddToCartButton {...defaultProps} buttonState="idle" onAddToCart={onAddToCart} />
      );

      fireEvent.click(screen.getByRole("button"));
      expect(onAddToCart).toHaveBeenCalledTimes(1);
    });

    it("does not call any handler when in adding state", () => {
      const onAddToCart = jest.fn();
      const onActionClick = jest.fn();
      render(
        <AddToCartButton
          {...defaultProps}
          buttonState="adding"
          onAddToCart={onAddToCart}
          onActionClick={onActionClick}
        />
      );

      fireEvent.click(screen.getByRole("button"));
      expect(onAddToCart).not.toHaveBeenCalled();
      expect(onActionClick).not.toHaveBeenCalled();
    });

    it("does not call any handler when in added state", () => {
      const onAddToCart = jest.fn();
      const onActionClick = jest.fn();
      render(
        <AddToCartButton
          {...defaultProps}
          buttonState="added"
          onAddToCart={onAddToCart}
          onActionClick={onActionClick}
        />
      );

      fireEvent.click(screen.getByRole("button"));
      expect(onAddToCart).not.toHaveBeenCalled();
      expect(onActionClick).not.toHaveBeenCalled();
    });

    it("calls onActionClick when in buy-now state", () => {
      const onActionClick = jest.fn();
      render(
        <AddToCartButton
          {...defaultProps}
          buttonState="buy-now"
          onActionClick={onActionClick}
        />
      );

      fireEvent.click(screen.getByRole("button"));
      expect(onActionClick).toHaveBeenCalledTimes(1);
    });

    it("calls onActionClick when in checkout-now state", () => {
      const onActionClick = jest.fn();
      render(
        <AddToCartButton
          {...defaultProps}
          buttonState="checkout-now"
          onActionClick={onActionClick}
        />
      );

      fireEvent.click(screen.getByRole("button"));
      expect(onActionClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("Disabled State", () => {
    it("respects disabled prop", () => {
      render(<AddToCartButton {...defaultProps} disabled />);

      expect(screen.getByRole("button")).toHaveAttribute("aria-disabled", "true");
    });

    it("is disabled when isProcessing is true", () => {
      render(<AddToCartButton {...defaultProps} isProcessing />);

      expect(screen.getByRole("button")).toHaveAttribute("aria-disabled", "true");
    });
  });

  describe("Styling", () => {
    it("applies custom className", () => {
      render(<AddToCartButton {...defaultProps} className="w-full" />);

      expect(screen.getByRole("button")).toHaveClass("w-full");
    });

    it("applies size variant", () => {
      const { rerender } = render(<AddToCartButton {...defaultProps} size="lg" />);

      // Just verify it renders without error with lg size
      expect(screen.getByRole("button")).toBeInTheDocument();

      rerender(<AddToCartButton {...defaultProps} size="default" />);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });
});
