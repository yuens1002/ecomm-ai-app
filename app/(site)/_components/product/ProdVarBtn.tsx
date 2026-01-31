import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProdVarBtnProps {
  selected?: boolean;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

export function ProdVarBtn({
  selected = false,
  className,
  children,
  onClick,
}: ProdVarBtnProps) {
  return (
    <Button
      className={cn(
        "p-6 text-sm font-medium border-3 rounded-md",
        selected
          ? "border-transparent pointer-events-none"
          : "bg-muted/50 border-border/50 text-muted-foreground hover:bg-muted/80 transition-colors",
        className
      )}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
