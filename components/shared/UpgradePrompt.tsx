import { Sparkles } from "lucide-react";
import Link from "next/link";

interface UpgradePromptProps {
  featureName: string;
  description?: string;
}

/**
 * Dashed-border card prompting the user to upgrade to Pro.
 * Used to gate Pro-exclusive features in the admin UI.
 */
export function UpgradePrompt({ featureName, description }: UpgradePromptProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center">
      <Sparkles className="h-8 w-8 text-muted-foreground/50" />
      <div className="space-y-1">
        <p className="text-sm font-medium">{featureName}</p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <Link
        href="/admin/support"
        className="text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        View Plans
      </Link>
    </div>
  );
}
