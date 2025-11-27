import { Quote } from "lucide-react";

interface PullQuoteProps {
  text: string;
  className?: string;
}

export function PullQuote({ text, className = "" }: PullQuoteProps) {
  return (
    <div
      className={`relative border-l-4 border-primary pl-6 py-4 my-8 ${className}`}
    >
      <Quote className="absolute -left-2 -top-2 h-8 w-8 text-primary/20" />
      <blockquote className="text-2xl font-serif italic text-foreground leading-relaxed">
        &ldquo;{text}&rdquo;
      </blockquote>
    </div>
  );
}
