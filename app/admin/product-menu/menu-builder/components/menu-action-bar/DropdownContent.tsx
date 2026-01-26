import {
  CheckboxListContent,
  type CheckboxListSection,
} from "../shared/CheckboxListContent";

type DropdownContentProps = {
  searchable?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  sections: CheckboxListSection[];
  onItemToggle: (itemId: string, checked: boolean) => void | Promise<void>;
  emptyMessage?: string;
};

/**
 * Dropdown menu content with checkbox sections.
 * Wrapper around CheckboxListContent for dropdown menus.
 */
export function DropdownContent(props: DropdownContentProps) {
  return <CheckboxListContent variant="dropdown" {...props} />;
}
