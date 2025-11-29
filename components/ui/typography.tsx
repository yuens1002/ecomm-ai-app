import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface TypographyProps {
  children: React.ReactNode;
  className?: string;
  isEditing?: boolean;
  onClick?: () => void;
  actionButtons?: ReactNode;
}

export function Typography({
  children,
  className,
  isEditing = false,
  onClick,
  actionButtons,
}: TypographyProps) {
  const editingClasses = isEditing
    ? "relative group cursor-pointer transition-all hover:ring-1 hover:ring-[#00d4ff]"
    : "";

  return (
    <div
      onClick={onClick}
      className={cn(
        // Base styles
        "text-foreground",
        editingClasses,

        // Headings
        "[&_h1]:text-4xl [&_h1]:font-bold [&_h1]:tracking-tight [&_h1]:mb-6 [&_h1]:mt-8 first:[&_h1]:mt-0",
        "[&_h2]:text-3xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:mb-4 [&_h2]:mt-8 first:[&_h2]:mt-0",
        "[&_h3]:text-2xl [&_h3]:font-semibold [&_h3]:tracking-tight [&_h3]:mb-3 [&_h3]:mt-6",
        "[&_h4]:text-xl [&_h4]:font-semibold [&_h4]:mb-2 [&_h4]:mt-4",
        "[&_h5]:text-lg [&_h5]:font-semibold [&_h5]:mb-2 [&_h5]:mt-4",
        "[&_h6]:text-base [&_h6]:font-semibold [&_h6]:mb-2 [&_h6]:mt-4",

        // Paragraphs
        "[&_p]:text-base [&_p]:leading-7 [&_p]:mb-4",
        "[&_p:last-of-type]:mb-0",
        "[&_p]:text-muted-foreground",

        // Lists
        "[&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-4 [&_ul]:space-y-2",
        "[&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-4 [&_ol]:space-y-2",
        "[&_li]:text-muted-foreground [&_li]:leading-7",

        // Links
        "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4",
        "[&_a:hover]:text-primary/80",

        // Blockquotes
        "[&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4",
        "[&_blockquote]:italic [&_blockquote]:my-4 [&_blockquote]:text-muted-foreground",

        // Code
        "[&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded",
        "[&_code]:text-sm [&_code]:font-mono",

        // Strong and emphasis
        "[&_strong]:font-semibold [&_strong]:text-foreground",
        "[&_em]:italic",

        // Horizontal rule
        "[&_hr]:border-t [&_hr]:border-border [&_hr]:my-8",

        className
      )}
    >
      {children}

      {/* Action Buttons (e.g., delete) */}
      {isEditing && actionButtons && (
        <div className="absolute top-2 right-2 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          {actionButtons}
        </div>
      )}
    </div>
  );
}
