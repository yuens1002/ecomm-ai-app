"use client";

import { Loader2 } from "lucide-react";
import { AboutAnswerEditor } from "@/components/app-components/AboutAnswerEditor";
import { cn } from "@/lib/utils";
import {
  GeneratedVariation,
  WizardAnswers,
} from "@/lib/api-schemas/generate-about";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export type AiAssistContentProps = {
  answers: WizardAnswers;
  onAnswersChange: (next: WizardAnswers) => void;
  onSelectedFieldChange?: (field: keyof WizardAnswers | "") => void;
  selectedStyle: GeneratedVariation["style"];
  onSelectedStyleChange: (style: GeneratedVariation["style"]) => void;
  cachedVariations: GeneratedVariation[];
  isRegenerating: boolean;
};

export function AiAssistContent({
  answers,
  onAnswersChange,
  onSelectedFieldChange,
  selectedStyle,
  onSelectedStyleChange,
  cachedVariations,
  isRegenerating,
}: AiAssistContentProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[0.4fr_0.6fr] gap-6">
      <div className="min-h-[140px]">
        <div className="flex items-center justify-between pb-4">
          <h4 className="text-sm font-semibold">Variations</h4>
          <span className="text-xs text-muted-foreground">
            {isRegenerating ? "Generating new options..." : ""}
          </span>
        </div>

        <div className="space-y-3">
          {isRegenerating ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Crafting fresh options…</span>
            </div>
          ) : (
            <RadioGroup
              value={selectedStyle}
              onValueChange={(val) =>
                onSelectedStyleChange(val as GeneratedVariation["style"])
              }
              className="space-y-3"
            >
              {["story", "values", "product"].map((style) => (
                <label
                  key={style}
                  className={cn(
                    "flex gap-3 rounded-lg border p-3 hover:border-primary/50",
                    selectedStyle === style
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  )}
                >
                  <RadioGroupItem value={style} />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase tracking-wide text-muted-foreground">
                        {style}
                      </span>
                      <span className="text-sm font-semibold">
                        {style === "story"
                          ? "Story-first"
                          : style === "values"
                            ? "Values-forward"
                            : "Product-first"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {style === "story"
                        ? "Narrative, warm, founder journey focus"
                        : style === "values"
                          ? "Principles-led, trustworthy, mission first"
                          : "Coffee-forward, educational, craft-driven"}
                    </p>
                  </div>
                </label>
              ))}
            </RadioGroup>
          )}

          {cachedVariations.length > 0 && !isRegenerating && (
            <div className="rounded-lg border p-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Cached variations (titles)
              </p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {cachedVariations.map((v, idx) => (
                  <li key={`${v.style}-${idx}`} className="line-clamp-1">
                    {v.title}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold pb-4">Questions & Answers</h4>
        <AboutAnswerEditor
          answers={answers}
          onAnswersChange={onAnswersChange}
          onSelectedFieldChange={onSelectedFieldChange}
          isRegenerating={isRegenerating}
        />
      </div>
    </div>
  );
}
