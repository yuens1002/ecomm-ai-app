"use client";
import { Loader2 } from "lucide-react";
import { AboutAnswerEditor } from "@/app/admin/_components/cms/editors/AboutAnswerEditor";
import {
  GeneratedVariation,
  WizardAnswers,
} from "@/lib/api-schemas/generate-about";
import { OptionCardGroup } from "@/app/admin/_components/forms/OptionCardGroup";

export type AiAssistContentProps = {
  answers: WizardAnswers;
  onAnswersChange: (next: WizardAnswers) => void;
  onSelectedFieldChange?: (field: keyof WizardAnswers | "") => void;
  selectedStyle: GeneratedVariation["style"];
  onSelectedStyleChange: (style: GeneratedVariation["style"]) => void;
  isRegenerating: boolean;
};

export function AiAssistContent({
  answers,
  onAnswersChange,
  onSelectedFieldChange,
  selectedStyle,
  onSelectedStyleChange,
  isRegenerating,
}: AiAssistContentProps) {
  return (
    <div className="relative grid grid-cols-1 md:grid-cols-[0.4fr_0.6fr] gap-6">
      {isRegenerating && (
        <div
          data-testid="ai-assist-overlay"
          className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <div className="flex items-center gap-3 rounded-md border px-4 py-3 shadow-sm bg-card/90">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm font-medium text-foreground">
              Generating content…
            </span>
          </div>
        </div>
      )}
      <div className="min-h-[140px]">
        <div className="flex items-center justify-between pb-4">
          <h4 className="text-sm font-semibold">Variations</h4>
        </div>

        <OptionCardGroup
          value={selectedStyle}
          onValueChange={(val) =>
            onSelectedStyleChange(val as GeneratedVariation["style"])
          }
          disabled={isRegenerating}
          options={["story", "values", "product"].map((style) => ({
            value: style,
            title:
              style === "story"
                ? "Story-first"
                : style === "values"
                  ? "Values-forward"
                  : "Product-first",
            description:
              style === "story"
                ? "Narrative, warm, founder journey focus"
                : style === "values"
                  ? "Principles-led, trustworthy, mission first"
                  : "Coffee-forward, educational, craft-driven",
          }))}
        />
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
