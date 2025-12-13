import React from "react";
import { render, screen } from "@testing-library/react";
import { ScrollCarousel } from "../ScrollCarousel";

// Mock framer-motion to avoid animation complexity in tests
jest.mock("framer-motion", () => ({
  motion: {
    button: React.forwardRef<
      HTMLButtonElement,
      React.ComponentPropsWithoutRef<"button">
    >(function MotionButton({ children, className, onClick, ...props }, ref) {
      return (
        <button ref={ref} className={className} onClick={onClick} {...props}>
          {children}
        </button>
      );
    }),
  },
}));

describe("ScrollCarousel", () => {
  // Mock scrollTo to avoid errors in tests
  beforeAll(() => {
    Element.prototype.scrollTo = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  describe("Rendering", () => {
    it("renders all children with keys", () => {
      render(
        <ScrollCarousel>
          <div key="slide-1">Slide 1</div>
          <div key="slide-2">Slide 2</div>
          <div key="slide-3">Slide 3</div>
        </ScrollCarousel>
      );

      expect(screen.getByText("Slide 1")).toBeInTheDocument();
      expect(screen.getByText("Slide 2")).toBeInTheDocument();
      expect(screen.getByText("Slide 3")).toBeInTheDocument();
    });

    it("renders nothing when no children provided", () => {
      const { container } = render(<ScrollCarousel>{[]}</ScrollCarousel>);
      expect(container.firstChild).toBeNull();
    });

    it("shows correct number of dots for slides", () => {
      render(
        <ScrollCarousel>
          <div key="1">Slide 1</div>
          <div key="2">Slide 2</div>
        </ScrollCarousel>
      );

      const dots = screen.getAllByRole("button", {
        name: /Go to slide \d+/,
      });
      expect(dots).toHaveLength(2);
    });

    it("hides dots when showDots is false", () => {
      render(
        <ScrollCarousel showDots={false}>
          <div key="1">Slide 1</div>
          <div key="2">Slide 2</div>
        </ScrollCarousel>
      );

      const dots = screen.queryAllByRole("button", {
        name: /Go to slide \d+/,
      });
      expect(dots).toHaveLength(0);
    });
  });

  describe("Slide styling", () => {
    it("applies gap-0 class for single slide view", () => {
      const { container } = render(
        <ScrollCarousel slidesPerView={1}>
          <div key="1">Slide 1</div>
          <div key="2">Slide 2</div>
        </ScrollCarousel>
      );

      const scrollContainer = container.querySelector(".overflow-x-auto");
      expect(scrollContainer).toHaveClass("gap-0");
      expect(scrollContainer).not.toHaveClass("gap-4");
    });

    it("applies gap-4 px-4 for multi-slide view", () => {
      const { container } = render(
        <ScrollCarousel slidesPerView={2.5}>
          <div key="1">Slide 1</div>
          <div key="2">Slide 2</div>
          <div key="3">Slide 3</div>
        </ScrollCarousel>
      );

      const scrollContainer = container.querySelector(".overflow-x-auto");
      expect(scrollContainer).toHaveClass("gap-4");
      expect(scrollContainer).toHaveClass("px-4");
    });
  });

  describe("Props validation", () => {
    it("accepts custom gap", () => {
      const { container } = render(
        <ScrollCarousel slidesPerView={2.5} gap="gap-8">
          <div key="1">Slide 1</div>
          <div key="2">Slide 2</div>
        </ScrollCarousel>
      );

      const scrollContainer = container.querySelector(".flex");
      expect(scrollContainer).toHaveClass("gap-8");
    });

    it("accepts custom minWidth", () => {
      const { container } = render(
        <ScrollCarousel minWidth="200px">
          <div key="1">Slide 1</div>
          <div key="2">Slide 2</div>
        </ScrollCarousel>
      );

      const slide = container.querySelector('[style*="min-width"]');
      expect(slide).toBeInTheDocument();
    });

    it("accepts noBorder prop", () => {
      render(
        <ScrollCarousel noBorder={true}>
          <div key="1">Slide 1</div>
          <div key="2">Slide 2</div>
        </ScrollCarousel>
      );

      // Verify component renders (noBorder is passed to CarouselDots)
      expect(screen.getByText("Slide 1")).toBeInTheDocument();
    });

    it("accepts autoScroll and intervalSeconds props", () => {
      render(
        <ScrollCarousel autoplay={true} autoplayDelay={5000}>
          <div key="1">Slide 1</div>
          <div key="2">Slide 2</div>
        </ScrollCarousel>
      );

      // Verify component renders with auto-scroll props
      expect(screen.getByText("Slide 1")).toBeInTheDocument();
    });
  });
});
