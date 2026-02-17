import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export type SearchSlot = {
  type: "search";
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export type ButtonSlot = {
  type: "button";
  label: string;
  icon?: LucideIcon;
  href?: string;
  onClick?: () => void;
  variant?: "default" | "outline" | "ghost" | "secondary" | "destructive";
  disabled?: boolean;
};

export type CustomSlot = {
  type: "custom";
  content: ReactNode;
};

export type DataTableSlot = SearchSlot | ButtonSlot | CustomSlot;

export type ActionBarConfig = {
  left: DataTableSlot[];
  right: DataTableSlot[];
};
