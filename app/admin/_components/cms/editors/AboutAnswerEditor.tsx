"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/app/InputGroup";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WizardAnswers } from "@/lib/api-schemas/generate-about";
import { ChevronDown, Pencil, Undo } from "lucide-react";

export const ABOUT_QUESTION_LABELS: Record<keyof WizardAnswers, string> = {
  businessName: "What's your business name?",
  foundingStory: "How did your coffee journey begin?",
  uniqueApproach: "What makes your approach unique?",
  coffeeSourcing: "How do you source your coffee?",
  roastingPhilosophy: "What's your roasting philosophy?",
  targetAudience: "Who do you roast for?",
  brandPersonality: "How would you describe your brand?",
  keyValues: "What are your core values?",
  communityRole: "What role do you play in your community?",
  futureVision: "Where do you see your roastery in 5 years?",
  heroImageUrl: "Hero image URL",
  heroImageDescription: "Hero image description",
  previousHeroImageUrl: "Previous hero image URL",
};

type AboutAnswerEditorProps = {
  answers: WizardAnswers;
  onAnswersChange: (next: WizardAnswers) => void;
  isRegenerating?: boolean;
  questionLabels?: Partial<Record<keyof WizardAnswers, string>>;
  excludeKeys?: (keyof WizardAnswers)[];
  onSelectedFieldChange?: (field: keyof WizardAnswers | "") => void;
};

export function AboutAnswerEditor({
  answers,
  onAnswersChange,
  isRegenerating = false,
  questionLabels,
  excludeKeys,
  onSelectedFieldChange,
}: AboutAnswerEditorProps) {
  const excluded = useMemo(() => {
    const defaults: (keyof WizardAnswers)[] = [
      "heroImageUrl",
      "heroImageDescription",
      "previousHeroImageUrl",
    ];
    return new Set<keyof WizardAnswers>([...(excludeKeys || []), ...defaults]);
  }, [excludeKeys]);

  const questions = useMemo(
    () =>
      Object.entries(answers).filter(
        ([key]) => !excluded.has(key as keyof WizardAnswers)
      ) as Array<[keyof WizardAnswers, string | null | undefined]>,
    [answers, excluded]
  );

  const selectFieldOptions = useMemo<
    Partial<Record<keyof WizardAnswers, { value: string; label: string }[]>>
  >(
    () => ({
      brandPersonality: [
        { value: "professional", label: "Professional & Expert" },
        { value: "friendly", label: "Friendly & Approachable" },
        { value: "passionate", label: "Passionate & Artisanal" },
        { value: "educational", label: "Educational & Informative" },
      ],
      roastingPhilosophy: [
        {
          value: "Light roasts to highlight origin characteristics",
          label: "Light roasts to highlight origin characteristics",
        },
        {
          value: "Medium roasts for balanced flavor",
          label: "Medium roasts for balanced flavor",
        },
        {
          value: "Dark roasts for bold intensity",
          label: "Dark roasts for bold intensity",
        },
        {
          value: "Variable by origin - we adapt to each bean",
          label: "Variable by origin - we adapt to each bean",
        },
      ],
    }),
    []
  );

  const [selectedField, setSelectedField] = useState<keyof WizardAnswers | "">(
    ""
  );
  const activeSelectedField = selectedField || (questions[0]?.[0] ?? "");
  const [baselineByField] = useState<Record<string, string>>(() => {
    return Object.fromEntries(
      Object.entries(answers).map(([key, value]) => [
        key,
        (value as string) || "",
      ])
    );
  });
  const baselineValue =
    (activeSelectedField ? baselineByField[activeSelectedField] : undefined) ||
    "";

  useEffect(() => {
    if (onSelectedFieldChange) {
      onSelectedFieldChange(activeSelectedField);
    }

    // If a select field has no value or a non-matching value, seed it with its first option
    if (
      activeSelectedField &&
      selectFieldOptions[activeSelectedField]?.length
    ) {
      const first = selectFieldOptions[activeSelectedField]?.[0]?.value;
      const current = (answers[activeSelectedField] as string) || "";
      const validOptions = new Set(
        (selectFieldOptions[activeSelectedField] || []).map((opt) => opt.value)
      );
      if (first && (!current || !validOptions.has(current))) {
        const next = {
          ...answers,
          [activeSelectedField]: first,
        } as WizardAnswers;
        onAnswersChange(next);
      }
    }
  }, [
    activeSelectedField,
    answers,
    onAnswersChange,
    onSelectedFieldChange,
    questions,
    selectFieldOptions,
  ]);

  const handleUndo = () => {
    if (!activeSelectedField) return;
    const baseline = baselineByField[activeSelectedField] ?? "";
    onAnswersChange({ ...answers, [activeSelectedField]: baseline });
  };

  const labels = { ...ABOUT_QUESTION_LABELS, ...(questionLabels || {}) };

  return (
    <div className="space-y-4">
      <InputGroup className="w-full">
        <InputGroupAddon align="block-start" className="border-b">
          <InputGroupText className="text-xs text-ellipsis overflow-hidden">
            {activeSelectedField && labels[activeSelectedField]
              ? `Q: ${labels[activeSelectedField]}`
              : "Select a question to edit your response"}
          </InputGroupText>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <InputGroupButton variant="ghost" size="xs" className="ml-auto">
                Questions
                <ChevronDown className="ml-1 h-3 w-3" />
              </InputGroupButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {questions.map(([key]) => (
                <DropdownMenuItem
                  key={key as string}
                  onClick={() => setSelectedField(key)}
                  className="capitalize"
                >
                  {labels[key] ||
                    (key as string).replace(/([A-Z])/g, " $1").trim()}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </InputGroupAddon>
        <InputGroupAddon align="block-start">
          <InputGroupText className="font-medium text-xs">
            <Pencil className="h-4 w-4 text-foreground" />
          </InputGroupText>
          <InputGroupButton
            onClick={handleUndo}
            disabled={
              !activeSelectedField ||
              answers[activeSelectedField] === baselineValue
            }
            size="icon-sm"
            variant="ghost"
            className="ml-auto"
          >
            <Undo className="h-4 w-4" />
            <span className="sr-only">Undo text changes</span>
          </InputGroupButton>
        </InputGroupAddon>
        {activeSelectedField && selectFieldOptions[activeSelectedField] ? (
          <div className="p-3 w-full flex items-start min-h-40">
            <Select
              value={(answers[activeSelectedField] as string) || ""}
              onValueChange={(val) =>
                onAnswersChange({ ...answers, [activeSelectedField]: val })
              }
              disabled={!activeSelectedField || isRegenerating}
            >
              <SelectTrigger className="w-full max-w-sm justify-start text-left h-10">
                <SelectValue placeholder="Choose an option" />
              </SelectTrigger>
              <SelectContent>
                {selectFieldOptions[activeSelectedField]?.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <InputGroupTextarea
            value={
              (activeSelectedField ? answers[activeSelectedField] : "") || ""
            }
            onChange={(e) =>
              activeSelectedField &&
              onAnswersChange({
                ...answers,
                [activeSelectedField]: e.target.value,
              })
            }
            placeholder={activeSelectedField ? "Edit your answer..." : ""}
            className="min-h-40 h-40 text-sm"
            disabled={!activeSelectedField || isRegenerating}
          />
        )}
      </InputGroup>
    </div>
  );
}
