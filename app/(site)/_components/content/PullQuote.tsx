import { Quote } from "lucide-react";
import { ReactNode } from "react";

interface PullQuoteProps {
  text: string;
  author?: string;
  className?: string;
  isEditing?: boolean;
  onClick?: () => void;
  actionButtons?: ReactNode;
}

export function PullQuote({
  text,
  author,
  className = "",
  isEditing = false,
  onClick,
  actionButtons,
}: PullQuoteProps) {
  const editingClasses = isEditing
    ? "group cursor-pointer transition-all hover:ring-1 hover:ring-[#00d4ff] hover:ring-offset-2"
    : "";

  return (
    <div
      onClick={onClick}
      className={`relative border-l-4 border-primary pl-6 py-4 my-8 ${editingClasses} ${className}`}
    >
      <Quote className="absolute -left-2 -top-2 h-8 w-8 text-primary/20" />
      <blockquote className="text-2xl font-serif italic text-foreground leading-relaxed">
        &ldquo;{text}&rdquo;
      </blockquote>
      {author && (
        <cite className="block mt-4 text-sm text-muted-foreground not-italic">
          — {author}
        </cite>
      )}

      {/* Action Buttons (e.g., delete) */}
      {isEditing && actionButtons && (
        <div className="absolute top-2 right-2 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          {actionButtons}
        </div>
      )}
    </div>
  );
}
