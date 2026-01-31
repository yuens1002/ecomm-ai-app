"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Edit2,
  Plus,
  Trash2,
  Link2,
  Unlink,
  MoveUp,
  MoveDown,
  Info,
} from "lucide-react";

interface ContextMenuAction {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: "default" | "destructive";
  separator?: boolean;
}

interface TreeContextMenuProps {
  trigger: React.ReactNode;
  actions: ContextMenuAction[];
}

export function TreeContextMenu({ trigger, actions }: TreeContextMenuProps) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {actions.map((action, i) => (
          <div key={i}>
            {action.separator && i > 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem
              onClick={action.onClick}
              className={
                action.variant === "destructive"
                  ? "text-destructive focus:text-destructive"
                  : ""
              }
            >
              <span className="mr-2">{action.icon}</span>
              {action.label}
            </DropdownMenuItem>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Preset action configs for different tree levels
export const menuContextActions = (handlers: {
  onEditIcon: () => void;
  onRename: () => void;
  onNewLabel: () => void;
  onNewCategory: () => void;
}): ContextMenuAction[] => [
  {
    icon: <Edit2 className="w-4 h-4" />,
    label: "Edit Icon",
    onClick: handlers.onEditIcon,
  },
  {
    icon: <Edit2 className="w-4 h-4" />,
    label: "Rename",
    onClick: handlers.onRename,
  },
  {
    icon: <Plus className="w-4 h-4" />,
    label: "New Label",
    onClick: handlers.onNewLabel,
    separator: true,
  },
  {
    icon: <Plus className="w-4 h-4" />,
    label: "New Category",
    onClick: handlers.onNewCategory,
  },
];

export const labelContextActions = (handlers: {
  onEditIcon: () => void;
  onRename: () => void;
  onAttachCategories: () => void;
  onDelete: () => void;
}): ContextMenuAction[] => [
  {
    icon: <Edit2 className="w-4 h-4" />,
    label: "Edit Icon",
    onClick: handlers.onEditIcon,
  },
  {
    icon: <Edit2 className="w-4 h-4" />,
    label: "Rename",
    onClick: handlers.onRename,
  },
  {
    icon: <Link2 className="w-4 h-4" />,
    label: "Attach Categories",
    onClick: handlers.onAttachCategories,
    separator: true,
  },
  {
    icon: <Trash2 className="w-4 h-4" />,
    label: "Delete Label",
    onClick: handlers.onDelete,
    variant: "destructive",
    separator: true,
  },
];

export const categoryContextActions = (handlers: {
  onEditIcon: () => void;
  onRename: () => void;
  onAttachProducts: () => void;
  onDetach: () => void;
}): ContextMenuAction[] => [
  {
    icon: <Edit2 className="w-4 h-4" />,
    label: "Edit Icon",
    onClick: handlers.onEditIcon,
  },
  {
    icon: <Edit2 className="w-4 h-4" />,
    label: "Rename",
    onClick: handlers.onRename,
  },
  {
    icon: <Link2 className="w-4 h-4" />,
    label: "Attach Products",
    onClick: handlers.onAttachProducts,
    separator: true,
  },
  {
    icon: <Unlink className="w-4 h-4" />,
    label: "Detach from Label",
    onClick: handlers.onDetach,
    variant: "destructive",
    separator: true,
  },
];

export const productContextActions = (handlers: {
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDetail: () => void;
  onDetach: () => void;
}): ContextMenuAction[] => [
  {
    icon: <MoveUp className="w-4 h-4" />,
    label: "Move Up",
    onClick: handlers.onMoveUp,
  },
  {
    icon: <MoveDown className="w-4 h-4" />,
    label: "Move Down",
    onClick: handlers.onMoveDown,
  },
  {
    icon: <Info className="w-4 h-4" />,
    label: "View Detail",
    onClick: handlers.onDetail,
    separator: true,
  },
  {
    icon: <Unlink className="w-4 h-4" />,
    label: "Detach",
    onClick: handlers.onDetach,
    variant: "destructive",
    separator: true,
  },
];
