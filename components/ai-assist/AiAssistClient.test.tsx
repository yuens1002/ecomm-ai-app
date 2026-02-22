import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AiAssistClient } from "@/components/ai-assist/AiAssistClient";
import { useAiAssist } from "@/lib/ai-assist/useAiAssist";
import { WizardAnswers } from "@/lib/api-schemas/generate-about";
import { Block } from "@/lib/blocks/schemas";

const mockToast = jest.fn();

jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Simplify the dialog and content to focus on client logic
jest.mock("@/app/admin/_components/dialogs/AiAssistDialog", () => ({
  AiAssistDialog: ({
    children,
    footer,
  }: {
    children: React.ReactNode;
    footer?: React.ReactNode;
  }) => (
    <div>
      <div>{children}</div>
      <div>{footer}</div>
    </div>
  ),
}));

jest.mock("@/components/ai-assist/AiAssistContent", () => ({
  AiAssistContent: () => <div data-testid="ai-assist-content" />,
}));

jest.mock("@/lib/ai-assist/useAiAssist");

const baseAnswers: WizardAnswers = {
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

const buildBlocks = (): Block[] => [
  {
    id: "hero",
    type: "hero",
    order: 0,
    isDeleted: false,
    layoutColumn: "full",
    content: {
      imageUrl: "/hero.jpg",
      imageAlt: "Alt text",
      caption: "Hero caption",
    },
  },
  {
    id: "rich-1",
    type: "richText",
    order: 1,
    isDeleted: false,
    layoutColumn: "full",
    content: {
      html: "<p>Hello there</p><style>.x{}</style><script>alert(1)</script>",
    },
  },
  {
    id: "rich-2",
    type: "richText",
    order: 2,
    isDeleted: false,
    layoutColumn: "full",
    content: {
      html: "<p>Second block</p>",
    },
  },
  {
    id: "rich-deleted",
    type: "richText",
    order: 3,
    isDeleted: true,
    layoutColumn: "full",
    content: {
      html: "<p>Should be ignored</p>",
    },
  },
];

const buildHookReturn = (
  overrides: Partial<ReturnType<typeof useAiAssist>> = {}
): ReturnType<typeof useAiAssist> => ({
  answers: baseAnswers,
  setAnswers: jest.fn(),
  selectedField: "",
  setSelectedField: jest.fn(),
  selectedStyle: "story",
  setSelectedStyle: jest.fn(),
  isRegenerating: false,
  regenerate: jest.fn().mockResolvedValue(undefined),
  resetDraft: jest.fn(),
  ...overrides,
});

describe("AiAssistClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("seeds wizard answers from page title, hero, and rich text content", async () => {
    const setAnswers = jest.fn();
    (useAiAssist as jest.Mock).mockReturnValue(buildHookReturn({ setAnswers }));

    render(
      <AiAssistClient
        open
        onOpenChange={jest.fn()}
        pageId="page-1"
        pageTitle="About Us"
        blocks={buildBlocks()}
        onApplied={jest.fn()}
      />
    );

    await waitFor(() => expect(setAnswers).toHaveBeenCalled());

    const updater = setAnswers.mock.calls[0][0] as (
      prev: WizardAnswers
    ) => WizardAnswers;
    const seeded = updater(baseAnswers);

    expect(seeded.businessName).toBe("About Us");
    expect(seeded.foundingStory).toBe("Hello there");
    expect(seeded.uniqueApproach).toBe("Second block");
    expect(seeded.heroImageUrl).toBe("/hero.jpg");
    expect(seeded.heroImageDescription).toBe("Alt text");
    expect(seeded.previousHeroImageUrl).toBe("/hero.jpg");
  });

  it("regenerates content, filters deleted blocks, and closes the dialog", async () => {
    const onOpenChange = jest.fn();
    const regenerate = jest.fn().mockResolvedValue(undefined);

    (useAiAssist as jest.Mock).mockReturnValue(
      buildHookReturn({ selectedStyle: "values", regenerate })
    );

    render(
      <AiAssistClient
        open
        onOpenChange={onOpenChange}
        pageId="page-1"
        pageTitle="About Us"
        blocks={buildBlocks()}
        onApplied={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /regenerate/i }));

    await waitFor(() => expect(regenerate).toHaveBeenCalled());

    const regenerateArgs = regenerate.mock.calls[0][0];
    expect(regenerateArgs.blocks).toHaveLength(3); // deleted block removed
    expect(regenerateArgs.heroImageUrl).toBe("/hero.jpg");
    expect(regenerateArgs.preferredStyle).toBe("values");

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Variation applied" })
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows loading state while regenerating", () => {
    (useAiAssist as jest.Mock).mockReturnValue(
      buildHookReturn({ isRegenerating: true })
    );

    render(
      <AiAssistClient
        open
        onOpenChange={jest.fn()}
        pageId="page-1"
        pageTitle="About Us"
        blocks={buildBlocks()}
        onApplied={jest.fn()}
      />
    );

    const regenerateButton = screen.getByRole("button", {
      name: /regenerating/i,
    });
    expect(regenerateButton).toHaveAttribute("aria-disabled", "true");

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    expect(cancelButton).toHaveAttribute("aria-disabled", "true");
  });

  it("displays error toast on regeneration failure", async () => {
    const regenerate = jest
      .fn()
      .mockRejectedValue(new Error("API rate limit exceeded"));

    (useAiAssist as jest.Mock).mockReturnValue(buildHookReturn({ regenerate }));

    render(
      <AiAssistClient
        open
        onOpenChange={jest.fn()}
        pageId="page-1"
        pageTitle="About Us"
        blocks={buildBlocks()}
        onApplied={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /regenerate/i }));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Generation error",
          description: "API rate limit exceeded",
          variant: "destructive",
        })
      );
    });
  });

  it("calls resetDraft when dialog is closed via cancel", () => {
    const resetDraft = jest.fn();
    const onOpenChange = jest.fn();

    (useAiAssist as jest.Mock).mockReturnValue(buildHookReturn({ resetDraft }));

    render(
      <AiAssistClient
        open
        onOpenChange={onOpenChange}
        pageId="page-1"
        pageTitle="About Us"
        blocks={buildBlocks()}
        onApplied={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(resetDraft).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("passes selected field to regenerate when specified", async () => {
    const regenerate = jest.fn().mockResolvedValue(undefined);

    (useAiAssist as jest.Mock).mockReturnValue(
      buildHookReturn({
        regenerate,
        selectedField: "foundingStory",
      })
    );

    render(
      <AiAssistClient
        open
        onOpenChange={jest.fn()}
        pageId="page-1"
        pageTitle="About Us"
        blocks={buildBlocks()}
        onApplied={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /regenerate/i }));

    await waitFor(() => expect(regenerate).toHaveBeenCalled());

    const regenerateArgs = regenerate.mock.calls[0][0];
    expect(regenerateArgs.selectedField).toBe("foundingStory");
  });
});
