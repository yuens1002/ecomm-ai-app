import { renderHook, act } from "@testing-library/react";
import { useAiAssist } from "@/lib/ai-assist/useAiAssist";
import { WizardAnswers } from "@/lib/api-schemas/generate-about";
import { Block } from "@/lib/blocks/schemas";

jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

type FetchArgs = Parameters<typeof fetch>;
const buildResponse = (body: unknown, ok = true): Response =>
  ({ ok, json: async () => body }) as unknown as Response;

const buildFingerprint = (
  answers: WizardAnswers,
  selectedField: string | null
) => JSON.stringify({ answers, selectedField });

const buildSnapshot = (blocks: Block[]) =>
  JSON.stringify(
    blocks
      .filter((b) => !b.isDeleted)
      .map((b) => ({ type: b.type, order: b.order ?? 0, content: b.content }))
      .sort((a, b) => a.order - b.order)
  );

describe("useAiAssist caching", () => {
  const initialAnswers: WizardAnswers = {
    businessName: "Test",
    foundingStory: "Story",
    uniqueApproach: "Unique",
    coffeeSourcing: "Sourcing",
    roastingPhilosophy: "Roast",
    targetAudience: "Audience",
    brandPersonality: "Personality",
    keyValues: "Values",
    communityRole: "Community",
    futureVision: "Vision",
    heroImageUrl: null,
    heroImageDescription: null,
    previousHeroImageUrl: null,
  };

  const blocks: Block[] = [
    {
      id: "1",
      type: "richText",
      order: 0,
      isDeleted: false,
      layoutColumn: "full",
      content: { html: "existing" },
    },
  ];

  let fetchMock: jest.Mock<Promise<Response>, FetchArgs>;
  let globalWithApis: typeof globalThis & {
    fetch: typeof fetch;
    localStorage: Storage;
  };
  let store: Record<string, string>;

  beforeEach(() => {
    store = {};
    fetchMock = jest.fn((url: RequestInfo | URL, _options?: RequestInit) => {
      const urlStr = typeof url === "string" ? url : url.toString();

      if (urlStr.includes("/ai-state")) {
        return Promise.resolve(buildResponse({}));
      }

      if (urlStr.includes("/replace-blocks")) {
        return Promise.resolve(
          buildResponse({ blocks: [], metaDescription: null })
        );
      }

      if (urlStr.includes("/generate-about")) {
        return Promise.resolve(
          buildResponse({
            variations: [
              {
                style: "story",
                blocks: [
                  {
                    type: "richText" as const,
                    content: { html: "generated" },
                  },
                ],
                metaDescription: "Generated",
              },
            ],
          })
        );
      }

      return Promise.resolve(buildResponse({}));
    });

    globalWithApis = global as typeof globalThis & {
      fetch: typeof fetch;
      localStorage: Storage;
    };
    globalWithApis.fetch = fetchMock as unknown as typeof fetch;

    globalWithApis.localStorage = {
      get length() {
        return Object.keys(store).length;
      },
      key: (index: number) => Object.keys(store)[index] ?? null,
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    } as Storage;
  });

  const hasGenerateCall = () =>
    fetchMock.mock.calls.some(
      ([url]) => typeof url === "string" && url.includes("/generate-about")
    );

  const replaceBlocksCalls = () =>
    fetchMock.mock.calls.filter(
      ([url]) => typeof url === "string" && url.includes("/replace-blocks")
    );

  it("uses cached variations when fingerprint and snapshot match", async () => {
    const fingerprint = buildFingerprint(initialAnswers, null);
    const snapshot = buildSnapshot(blocks);

    const cachedVariation = {
      style: "story" as const,
      blocks: [
        {
          type: "richText" as const,
          content: { html: "cached" },
        },
      ],
      metaDescription: "Cached",
    };

    globalThis.localStorage.setItem(
      "ai-assist-cache:page-1",
      JSON.stringify({
        fingerprint,
        variations: [cachedVariation],
        blockSnapshot: snapshot,
      })
    );

    const { result } = renderHook(() =>
      useAiAssist({ pageId: "page-1", initialAnswers })
    );

    await act(async () => {
      await result.current.regenerate({
        blocks,
        preferredStyle: "story",
      });
    });

    expect(hasGenerateCall()).toBe(false);
    expect(replaceBlocksCalls().length).toBe(1);
  });

  it("calls generate-about when cache misses", async () => {
    const { result } = renderHook(() =>
      useAiAssist({ pageId: "page-1", initialAnswers })
    );

    await act(async () => {
      await result.current.regenerate({
        blocks,
        preferredStyle: "story",
      });
    });

    expect(hasGenerateCall()).toBe(true);
    expect(replaceBlocksCalls().length).toBe(1);
  });
});
