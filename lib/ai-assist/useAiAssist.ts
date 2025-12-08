import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
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
  initialAnswers?: WizardAnswers;
  fallbackAnswers?: WizardAnswers | (() => WizardAnswers);
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
  regenerate: (params: RegenerateParams) => Promise<void>;
  resetDraft: () => void;
};

const localStateKey = (pageId: string) => `ai-assist-state:${pageId}`;
const localCacheKey = (pageId: string) => `ai-assist-cache:${pageId}`;

type StoredState = {
  answers: WizardAnswers;
  selectedStyle: GeneratedVariation["style"];
  selectedField: keyof WizardAnswers | "";
};

type StoredCache = {
  fingerprint: string;
  variations: GeneratedVariation[];
  blockSnapshot?: string;
};

// Frontend logging enabled in dev; can force in prod with NEXT_PUBLIC_AI_LOGS=1.
const LOG_ENABLED =
  process.env.NODE_ENV !== "production" ||
  process.env.NEXT_PUBLIC_AI_LOGS === "1";
const logAi = (...args: unknown[]) => {
  if (!LOG_ENABLED) return;
  console.log("[AI Assist]", ...args);
};

const buildContentFingerprint = (
  answers: WizardAnswers,
  selectedField?: keyof WizardAnswers
) => {
  // Fingerprint should represent user inputs that drive generation, not the
  // AI output blocks (which would change after applying a variation).
  return JSON.stringify({
    answers,
    selectedField: selectedField || null,
  });
};

const buildBlockSnapshot = (
  blocks: Array<{
    type: string;
    order?: number;
    content?: unknown;
    isDeleted?: boolean;
  }>
) =>
  JSON.stringify(
    (blocks || [])
      .filter((b) => !b.isDeleted)
      .map((b) => ({
        type: b.type,
        order: b.order ?? 0,
        content: b.content,
      }))
      .sort((a, b) => a.order - b.order)
  );

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
  fallbackAnswers,
  onApplied,
}: UseAiAssistOptions): UseAiAssistState {
  const hasLoggedInitRef = useRef(false);
  if (LOG_ENABLED && !hasLoggedInitRef.current) {
    logAi("Hook init", { pageId });
    hasLoggedInitRef.current = true;
  }
  const resolveFallbackAnswers = useCallback(() => {
    if (typeof fallbackAnswers === "function") return fallbackAnswers();
    return fallbackAnswers || null;
  }, [fallbackAnswers]);

  const emptyAnswers: WizardAnswers = {
    businessName: "",
    foundingStory: "",
    uniqueApproach: "",
    coffeeSourcing: "",
    roastingPhilosophy: "",
    targetAudience: "",
    brandPersonality: "",
    keyValues: "",
    communityRole: "",
    futureVision: "",
    heroImageUrl: null,
    heroImageDescription: null,
    previousHeroImageUrl: null,
  };

  const [persistedState, setPersistedState] = useState<StoredState | null>(
    null
  );
  const [answers, setAnswers] = useState<WizardAnswers>(() => {
    return initialAnswers ?? resolveFallbackAnswers() ?? emptyAnswers;
  });
  const hasSeededInitialAnswersRef = useRef(false);
  const [selectedField, setSelectedField] = useState<keyof WizardAnswers | "">(
    ""
  );
  const [selectedStyle, setSelectedStyle] =
    useState<GeneratedVariation["style"]>("story");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [cachedVariations, setCachedVariations] = useState<
    GeneratedVariation[]
  >([]);
  const [cachedFingerprint, setCachedFingerprint] = useState<string | null>(
    null
  );
  const [cachedBlockSnapshot, setCachedBlockSnapshot] = useState<string | null>(
    null
  );
  const lastAppliedRef = useRef<{
    fingerprint: string | null;
    style: string | null;
    blockSnapshot: string | null;
  }>({ fingerprint: null, style: null, blockSnapshot: null });

  const persistCache = useCallback(
    (
      fingerprint: string,
      variations: GeneratedVariation[],
      blockSnapshot: string
    ) => {
      if (typeof window === "undefined") return;
      try {
        window.localStorage.setItem(
          localCacheKey(pageId),
          JSON.stringify({
            fingerprint,
            variations,
            blockSnapshot,
            updatedAt: Date.now(),
          })
        );
        logAi("Persisted cache", {
          pageId,
          fingerprintLength: fingerprint.length,
          variationCount: variations.length,
          blockSnapshotLength: blockSnapshot.length,
        });
      } catch (error) {
        console.error("Failed to persist AI cache", error);
      }
    },
    [pageId]
  );

  useEffect(() => {
    if (!initialAnswers) return;
    if (hasSeededInitialAnswersRef.current) return;
    setAnswers(initialAnswers);
    hasSeededInitialAnswersRef.current = true;
  }, [initialAnswers]);

  // Load persisted state (localStorage first, then API) once
  useEffect(() => {
    logAi("Load persisted state effect running", { pageId });
    const loadState = async () => {
      try {
        const localRaw =
          typeof window !== "undefined"
            ? window.localStorage.getItem(localStateKey(pageId))
            : null;
        if (localRaw) {
          const parsed: StoredState = JSON.parse(localRaw);
          setPersistedState(parsed);
          setAnswers(parsed.answers);
          setSelectedStyle(parsed.selectedStyle);
          setSelectedField(parsed.selectedField);
          logAi("Loaded local state", { pageId });
        }

        const res = await fetch(`/api/admin/pages/${pageId}/ai-state`, {
          method: "GET",
        });
        if (res.ok) {
          const data: StoredState = await res.json();
          if (data?.answers) {
            setPersistedState(data);
            setAnswers(data.answers);
            setSelectedStyle(data.selectedStyle || "story");
            setSelectedField(data.selectedField || "");
            if (typeof window !== "undefined") {
              window.localStorage.setItem(
                localStateKey(pageId),
                JSON.stringify(data)
              );
            }
            logAi("Loaded remote state and persisted locally", { pageId });
          }
        }
      } catch (error) {
        console.error("Failed to load AI state", error);
      }
    };

    loadState();
  }, [pageId]);

  const applyVariation = useCallback(
    async (
      variation: GeneratedVariation,
      heroImageUrl?: string | null,
      heroAltText?: string | null
    ): Promise<Block[]> => {
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

      const appliedBlocks =
        (resultJson.blocks as Block[] | undefined) ||
        (incomingBlocks as unknown as Block[]);

      onApplied?.({
        blocks: appliedBlocks,
        metaDescription: resultJson.metaDescription ?? null,
      });

      return appliedBlocks;
    },
    [onApplied, pageId]
  );

  // Load cached variations fingerprint from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const cachedRaw = window.localStorage.getItem(localCacheKey(pageId));
    if (!cachedRaw) return;
    try {
      const parsed: StoredCache = JSON.parse(cachedRaw);
      setCachedFingerprint(parsed.fingerprint);
      setCachedVariations(parsed.variations || []);
      setCachedBlockSnapshot(parsed.blockSnapshot || null);
      logAi("Hydrated cache from localStorage", {
        pageId,
        variationCount: parsed.variations?.length ?? 0,
        fingerprintLength: parsed.fingerprint?.length ?? 0,
        blockSnapshotLength: parsed.blockSnapshot?.length ?? 0,
      });
    } catch (error) {
      console.error("Failed to parse AI cache", error);
    }
  }, [pageId]);

  const regenerate = useCallback(
    async ({
      blocks,
      heroImageUrl,
      heroImageDescription,
      selectedField: field,
      preferredStyle,
    }: RegenerateParams) => {
      const resolvedField = field ?? (selectedField || undefined);
      const fingerprint = buildContentFingerprint(answers, resolvedField);
      const styleChoice = preferredStyle || selectedStyle;
      const blockSnapshot = buildBlockSnapshot(blocks);

      logAi("Regenerate invoked", {
        pageId,
        styleChoice,
        fingerprintLength: fingerprint.length,
        blocks: blocks.length,
        cachedFingerprintLength: cachedFingerprint?.length ?? 0,
        cachedVariations: cachedVariations.length,
        cachedBlockSnapshotLength: cachedBlockSnapshot?.length ?? 0,
        blockSnapshotLength: blockSnapshot.length,
        lastApplied: {
          fingerprintLength: lastAppliedRef.current.fingerprint?.length ?? 0,
          style: lastAppliedRef.current.style,
          blockSnapshotLength:
            lastAppliedRef.current.blockSnapshot?.length ?? 0,
        },
      });

      if (!blocks || blocks.length === 0) {
        logAi("Abort regenerate: no blocks provided", { pageId });
        return;
      }

      // If this exact content/style was just applied, skip regen/apply
      if (
        lastAppliedRef.current.fingerprint === fingerprint &&
        lastAppliedRef.current.style === styleChoice &&
        lastAppliedRef.current.blockSnapshot === blockSnapshot
      ) {
        logAi("Skip regenerate: matches last applied", { pageId, styleChoice });
        return;
      }

      setIsRegenerating(true);
      try {
        const saveState = async () => {
          const nextState: StoredState = {
            answers,
            selectedField: resolvedField || "",
            selectedStyle: preferredStyle || selectedStyle,
          };
          setPersistedState(nextState);
          if (typeof window !== "undefined") {
            window.localStorage.setItem(
              localStateKey(pageId),
              JSON.stringify(nextState)
            );
          }
          logAi("Persisted state to localStorage", {
            pageId,
            selectedStyle: nextState.selectedStyle,
            selectedField: nextState.selectedField,
          });

          try {
            await fetch(`/api/admin/pages/${pageId}/ai-state`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(nextState),
            });
            logAi("Persisted state to API", {
              pageId,
              selectedStyle: nextState.selectedStyle,
              selectedField: nextState.selectedField,
            });
          } catch (error) {
            console.error("Failed to persist AI state", error);
          }
        };

        const chooseAndApply = async (variations: GeneratedVariation[]) => {
          const chosen =
            variations.find((v) => v.style === styleChoice) || variations[0];
          if (!chosen) throw new Error("No variations returned from AI");
          const appliedBlocks = await applyVariation(
            chosen,
            heroImageUrl,
            heroImageDescription
          );
          const appliedBlockSnapshot = buildBlockSnapshot(appliedBlocks);
          logAi("Applying variation", {
            pageId,
            styleChoice,
            totalVariations: variations.length,
            appliedBlockSnapshotLength: appliedBlockSnapshot.length,
          });
          await saveState();
          persistCache(fingerprint, variations, appliedBlockSnapshot);
          setCachedFingerprint(fingerprint);
          setCachedVariations(variations);
          setCachedBlockSnapshot(appliedBlockSnapshot);
          lastAppliedRef.current = {
            fingerprint,
            style: styleChoice,
            blockSnapshot: appliedBlockSnapshot,
          };
          logAi("Applied variation and updated cache", {
            pageId,
            styleChoice,
            fingerprintLength: fingerprint.length,
            blockSnapshotLength: appliedBlockSnapshot.length,
          });
        };

        const cachedSnapshotMatches = cachedBlockSnapshot === blockSnapshot;
        const hasCached =
          cachedFingerprint === fingerprint &&
          cachedVariations.length > 0 &&
          cachedSnapshotMatches;
        if (hasCached) {
          const cachedChoice =
            cachedVariations.find((v) => v.style === styleChoice) ||
            cachedVariations[0];
          if (cachedChoice) {
            logAi("Using cached variations", {
              pageId,
              styleChoice,
              cachedVariations: cachedVariations.length,
              cachedBlockSnapshotMatches: cachedSnapshotMatches,
            });
            await chooseAndApply(cachedVariations);
            return;
          }
        }

        logAi("Cache miss or no matching style", {
          pageId,
          styleChoice,
          cachedFingerprintMatches: cachedFingerprint === fingerprint,
          cachedVariations: cachedVariations.length,
          cachedBlockSnapshotMatches: cachedSnapshotMatches,
        });

        const payload: GenerateAboutRequest & {
          preferredStyle?: GeneratedVariation["style"];
          selectedField?: keyof WizardAnswers;
        } = {
          answers,
          currentBlocks: blocks.map((block) => ({ type: block.type })),
          heroImageUrl: heroImageUrl || undefined,
          heroImageDescription,
          preferredStyle: styleChoice,
        };
        if (resolvedField) {
          payload.selectedField = resolvedField;
        }

        logAi("Calling generate-about", {
          pageId,
          preferredStyle: styleChoice,
          selectedField: resolvedField,
          answersPresent: !!answers,
        });

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
        logAi("Generated new variations", {
          pageId,
          styleChoice,
          variations: variations.length,
        });
        await chooseAndApply(variations);
      } finally {
        setIsRegenerating(false);
      }
    },
    [
      answers,
      applyVariation,
      cachedVariations,
      cachedFingerprint,
      cachedBlockSnapshot,
      selectedStyle,
      selectedField,
      pageId,
      persistCache,
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
    regenerate,
    resetDraft: () => {
      const baseState: StoredState = persistedState || {
        answers: initialAnswers || resolveFallbackAnswers() || emptyAnswers,
        selectedStyle: "story",
        selectedField: "",
      };
      setAnswers(baseState.answers);
      setSelectedStyle(baseState.selectedStyle || "story");
      setSelectedField(baseState.selectedField || "");
    },
  };
}
