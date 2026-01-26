import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RowContextMenu } from "../RowContextMenu";
import type { SelectedEntityKind, ViewType } from "@/app/admin/product-menu/types/builder-state";

// Mock the Switch component
jest.mock("@/components/ui/switch", () => ({
  Switch: ({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (v: boolean) => void }) => (
    <button
      data-testid="visibility-switch"
      data-checked={checked}
      onClick={() => onCheckedChange(!checked)}
    >
      Switch
    </button>
  ),
}));

describe("RowContextMenu", () => {
  const defaultProps = {
    entityId: "test-id",
    isVisible: true,
    isFirst: false,
    isLast: false,
    children: <div data-testid="trigger">Row Content</div>,
  };

  // Helper to render and open context menu
  const renderAndOpen = async (
    viewType: ViewType,
    entityKind: SelectedEntityKind,
    extraProps = {}
  ) => {
    render(
      <RowContextMenu
        {...defaultProps}
        viewType={viewType}
        entityKind={entityKind}
        {...extraProps}
      />
    );

    const trigger = screen.getByTestId("trigger");
    fireEvent.contextMenu(trigger);

    // Wait for menu to appear
    await waitFor(() => {
      expect(screen.getByRole("menu")).toBeInTheDocument();
    });
  };

  describe("Action visibility by view and entity", () => {
    describe("Label entity", () => {
      it("shows correct actions in menu view", async () => {
        await renderAndOpen("menu", "label");

        expect(screen.getByText("Clone")).toBeInTheDocument();
        expect(screen.getByText("Remove")).toBeInTheDocument();
        expect(screen.getByText("Delete")).toBeInTheDocument();
        expect(screen.getByText("Move Up")).toBeInTheDocument();
        expect(screen.getByText("Move Down")).toBeInTheDocument();
        expect(screen.queryByText("Visibility")).not.toBeInTheDocument();
      });

      it("shows correct actions in all-labels view", async () => {
        await renderAndOpen("all-labels", "label");

        expect(screen.getByText("Categories")).toBeInTheDocument(); // manage-categories submenu
        expect(screen.getByText("Clone")).toBeInTheDocument();
        expect(screen.getByText("Visibility")).toBeInTheDocument();
        expect(screen.getByText("Delete")).toBeInTheDocument();
        expect(screen.getByText("Move Up")).toBeInTheDocument();
        expect(screen.getByText("Move Down")).toBeInTheDocument();
        expect(screen.queryByText("Remove")).not.toBeInTheDocument();
      });

      it("renders no context menu for label in category view", () => {
        render(
          <RowContextMenu
            {...defaultProps}
            viewType="category"
            entityKind="label"
          />
        );

        // Should just render children without context menu wrapper
        expect(screen.getByTestId("trigger")).toBeInTheDocument();
      });
    });

    describe("Category entity", () => {
      it("shows correct actions in menu view (no delete)", async () => {
        await renderAndOpen("menu", "category");

        expect(screen.getByText("Clone")).toBeInTheDocument();
        expect(screen.getByText("Visibility")).toBeInTheDocument();
        expect(screen.getByText("Move Up")).toBeInTheDocument();
        expect(screen.getByText("Move Down")).toBeInTheDocument();
        expect(screen.getByText("Move To")).toBeInTheDocument();
        expect(screen.queryByText("Delete")).not.toBeInTheDocument();
        expect(screen.queryByText("Remove")).not.toBeInTheDocument();
      });

      it("shows correct actions in label view (no delete)", async () => {
        await renderAndOpen("label", "category");

        expect(screen.getByText("Clone")).toBeInTheDocument();
        expect(screen.getByText("Remove")).toBeInTheDocument();
        expect(screen.getByText("Visibility")).toBeInTheDocument();
        expect(screen.getByText("Move Up")).toBeInTheDocument();
        expect(screen.getByText("Move Down")).toBeInTheDocument();
        expect(screen.getByText("Move To")).toBeInTheDocument();
        expect(screen.queryByText("Delete")).not.toBeInTheDocument();
      });

      it("shows correct actions in all-categories view", async () => {
        await renderAndOpen("all-categories", "category");

        expect(screen.getByText("Labels")).toBeInTheDocument(); // manage-labels submenu
        expect(screen.getByText("Clone")).toBeInTheDocument();
        expect(screen.getByText("Visibility")).toBeInTheDocument();
        expect(screen.getByText("Delete")).toBeInTheDocument();
        expect(screen.queryByText("Remove")).not.toBeInTheDocument();
        expect(screen.queryByText("Move To")).not.toBeInTheDocument();
      });
    });

    describe("Product entity", () => {
      it("shows correct actions in category view", async () => {
        await renderAndOpen("category", "product");

        expect(screen.getByText("Categories")).toBeInTheDocument(); // manage-categories submenu
        expect(screen.getByText("Remove")).toBeInTheDocument();
        expect(screen.getByText("Move Up")).toBeInTheDocument();
        expect(screen.getByText("Move Down")).toBeInTheDocument();
        expect(screen.queryByText("Move To")).not.toBeInTheDocument();
        expect(screen.queryByText("Visibility")).not.toBeInTheDocument();
        expect(screen.queryByText("Clone")).not.toBeInTheDocument();
        expect(screen.queryByText("Delete")).not.toBeInTheDocument();
      });

      it("renders no context menu for product in menu view", () => {
        render(
          <RowContextMenu
            {...defaultProps}
            viewType="menu"
            entityKind="product"
          />
        );

        expect(screen.getByTestId("trigger")).toBeInTheDocument();
      });
    });
  });

  describe("Disabled states", () => {
    it("disables Move Up when isFirst is true", async () => {
      const onMoveUp = jest.fn();
      const onMoveDown = jest.fn();
      await renderAndOpen("all-labels", "label", { isFirst: true, onMoveUp, onMoveDown });

      const moveUp = screen.getByText("Move Up").closest("[data-slot='context-menu-item']");
      expect(moveUp).toHaveAttribute("data-disabled");
    });

    it("disables Move Down when isLast is true", async () => {
      const onMoveUp = jest.fn();
      const onMoveDown = jest.fn();
      await renderAndOpen("all-labels", "label", { isLast: true, onMoveUp, onMoveDown });

      const moveDown = screen.getByText("Move Down").closest("[data-slot='context-menu-item']");
      expect(moveDown).toHaveAttribute("data-disabled");
    });

    it("enables Move Up and Move Down when callbacks provided and not at boundaries", async () => {
      const onMoveUp = jest.fn();
      const onMoveDown = jest.fn();
      await renderAndOpen("all-labels", "label", { isFirst: false, isLast: false, onMoveUp, onMoveDown });

      const moveUp = screen.getByText("Move Up").closest("[data-slot='context-menu-item']");
      const moveDown = screen.getByText("Move Down").closest("[data-slot='context-menu-item']");

      expect(moveUp).not.toHaveAttribute("data-disabled");
      expect(moveDown).not.toHaveAttribute("data-disabled");
    });
  });

  describe("Action callbacks", () => {
    it("calls onClone when Clone is clicked", async () => {
      const onClone = jest.fn();
      await renderAndOpen("all-labels", "label", { onClone });

      fireEvent.click(screen.getByText("Clone"));

      expect(onClone).toHaveBeenCalledTimes(1);
    });

    it("calls onDelete when Delete is clicked", async () => {
      const onDelete = jest.fn();
      await renderAndOpen("all-labels", "label", { onDelete });

      fireEvent.click(screen.getByText("Delete"));

      expect(onDelete).toHaveBeenCalledTimes(1);
    });

    it("calls onMoveUp when Move Up is clicked", async () => {
      const onMoveUp = jest.fn();
      await renderAndOpen("all-labels", "label", { onMoveUp });

      fireEvent.click(screen.getByText("Move Up"));

      expect(onMoveUp).toHaveBeenCalledTimes(1);
    });

    it("calls onMoveDown when Move Down is clicked", async () => {
      const onMoveDown = jest.fn();
      await renderAndOpen("all-labels", "label", { onMoveDown });

      fireEvent.click(screen.getByText("Move Down"));

      expect(onMoveDown).toHaveBeenCalledTimes(1);
    });

    it("calls onRemove when Remove is clicked", async () => {
      const onRemove = jest.fn();
      await renderAndOpen("menu", "label", { onRemove });

      fireEvent.click(screen.getByText("Remove"));

      expect(onRemove).toHaveBeenCalledTimes(1);
    });
  });

  describe("Move To submenu", () => {
    it("renders Move To as a submenu trigger when targets provided", async () => {
      const moveToTargets = [
        { id: "label-1", name: "Label One" },
        { id: "label-2", name: "Label Two" },
      ];
      await renderAndOpen("menu", "category", { moveToTargets });

      // Move To should be rendered as a submenu trigger
      const moveToTrigger = screen.getByText("Move To");
      expect(moveToTrigger).toBeInTheDocument();

      // Should have the submenu trigger slot
      const triggerElement = moveToTrigger.closest("[data-slot='context-menu-sub-trigger']");
      expect(triggerElement).toBeInTheDocument();
    });

    it("disables Move To when no targets available", async () => {
      await renderAndOpen("menu", "category", { moveToTargets: [] });

      const moveToItem = screen.getByText("Move To").closest("[data-slot='context-menu-item']");
      expect(moveToItem).toHaveAttribute("data-disabled");
    });

    it("disables Move To when all targets filtered by currentParentId", async () => {
      const moveToTargets = [{ id: "label-1", name: "Label One" }];
      await renderAndOpen("menu", "category", {
        moveToTargets,
        currentParentId: "label-1",
      });

      const moveToItem = screen.getByText("Move To").closest("[data-slot='context-menu-item']");
      expect(moveToItem).toHaveAttribute("data-disabled");
    });
  });

  describe("Disabled prop", () => {
    it("renders only children when disabled is true", () => {
      render(
        <RowContextMenu
          {...defaultProps}
          viewType="all-labels"
          entityKind="label"
          disabled
        />
      );

      expect(screen.getByTestId("trigger")).toBeInTheDocument();
      // No context menu should be attached
    });
  });
});
