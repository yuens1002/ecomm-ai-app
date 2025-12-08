import {
  Dispatch,
  SetStateAction,
  useCallback,
  useMemo,
  useState,
} from "react";
import { Block } from "@/lib/blocks/schemas";
import {
  GenerateAboutRequest,
  GenerateAboutResponse,
  GeneratedBlock,
  GeneratedVariation,
  WizardAnswers,
} from "@/lib/api-schemas/generate-about";

export type UseAiAssistOptions = {
  pageId: string;
  initialAnswers: WizardAnswers;
  onApplied?: (result: {
    blocks?: Block[];
    metaDescription?: string | null;
  }) => void;
};

export type RegenerateParams = {
  blocks: Block[];
  heroImageUrl?: string | null;
  heroImageDescription?: string | null;
  selectedField?: keyof WizardAnswers;
  preferredStyle?: GeneratedVariation["style"];
};

type ReplaceBlocksResponse = {
  success?: boolean;
  blocks?: Block[];
  metaDescription?: string | null;
  error?: string;
};

type UseAiAssistState = {
  answers: WizardAnswers;
  setAnswers: Dispatch<SetStateAction<WizardAnswers>>;
  selectedField: keyof WizardAnswers | "";
  setSelectedField: (field: keyof WizardAnswers | "") => void;
  selectedStyle: GeneratedVariation["style"];
  setSelectedStyle: (style: GeneratedVariation["style"]) => void;
  isRegenerating: boolean;
  cachedVariations: GeneratedVariation[];
  regenerate: (params: RegenerateParams) => Promise<void>;
};

const buildAnswersKey = (answers: WizardAnswers) => {
  const keys = Object.keys(answers).sort();
  return JSON.stringify(answers, keys as Array<keyof WizardAnswers>);
};

const ensureSingleRichText = (blocks: GeneratedBlock[]): GeneratedBlock[] => {
  let richTextSeen = false;
  return blocks.filter((block) => {
    if (block.type === "richText") {
      if (richTextSeen) return false;
      richTextSeen = true;
    }
    return true;
  });
};

export function useAiAssist({
  pageId,
  initialAnswers,
  onApplied,
}: UseAiAssistOptions): UseAiAssistState {
  const [answers, setAnswers] = useState<WizardAnswers>(initialAnswers);
  const [selectedField, setSelectedField] = useState<keyof WizardAnswers | "">(
    ""
  );
  const [selectedStyle, setSelectedStyle] =
    useState<GeneratedVariation["style"]>("story");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [cachedVariations, setCachedVariations] = useState<
    GeneratedVariation[]
  >([]);
  const [cachedAnswersKey, setCachedAnswersKey] = useState<string | null>(null);

  const sortedAnswersKey = useMemo(() => buildAnswersKey(answers), [answers]);

  const applyVariation = useCallback(
    async (
      variation: GeneratedVariation,
      heroImageUrl?: string | null,
      heroAltText?: string | null
    ) => {
      const incomingBlocks = ensureSingleRichText(variation.blocks || []);

      const response = await fetch(
        `/api/admin/pages/${pageId}/replace-blocks`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            blocks: incomingBlocks,
            metaDescription: variation.metaDescription,
            heroImageUrl,
            heroAltText,
          }),
        }
      );

      const resultJson: ReplaceBlocksResponse = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(resultJson.error || "Failed to apply variation");
      }

      onApplied?.({
        blocks: resultJson.blocks,
        metaDescription: resultJson.metaDescription ?? null,
      });
    },
    [onApplied, pageId]
  );

  const regenerate = useCallback(
    async ({
      blocks,
      heroImageUrl,
      heroImageDescription,
      selectedField: field,
      preferredStyle,
    }: RegenerateParams) => {
      setIsRegenerating(true);
      try {
        const answersKey = sortedAnswersKey;

        const chooseAndApply = async (variations: GeneratedVariation[]) => {
          const chosen =
            variations.find(
              (v) => v.style === (preferredStyle || selectedStyle)
            ) || variations[0];
          if (!chosen) throw new Error("No variations returned from AI");
          await applyVariation(chosen, heroImageUrl, heroImageDescription);
        };

        if (cachedAnswersKey === answersKey && cachedVariations.length > 0) {
          await chooseAndApply(cachedVariations);
          return;
        }

        const payload: GenerateAboutRequest & {
          preferredStyle?: GeneratedVariation["style"];
          selectedField?: keyof WizardAnswers;
        } = {
          answers,
          currentBlocks: blocks.map((block) => ({ type: block.type })),
          heroImageUrl: heroImageUrl || undefined,
          heroImageDescription,
          preferredStyle: preferredStyle || selectedStyle,
        };
        if (field) {
          payload.selectedField = field;
        }

        const response = await fetch("/api/admin/pages/about/generate-about", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to regenerate content");
        }

        const data: GenerateAboutResponse = await response.json();

        const variations = data.variations || [];
        setCachedVariations(variations);
        setCachedAnswersKey(answersKey);

        await chooseAndApply(variations);
      } finally {
        setIsRegenerating(false);
      }
    },
    [
      answers,
      applyVariation,
      cachedAnswersKey,
      cachedVariations,
      selectedStyle,
      sortedAnswersKey,
    ]
  );

  return {
    answers,
    setAnswers,
    selectedField,
    setSelectedField,
    selectedStyle,
    setSelectedStyle,
    isRegenerating,
    cachedVariations,
    regenerate,
  };
}
