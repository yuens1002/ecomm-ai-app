import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { PageEditor } from "@/app/admin/_components/cms/editors/PageEditor";
import { PageType } from "@prisma/client";
import { LayoutRenderer } from "@/lib/page-layouts";
import { Block } from "@/lib/blocks/schemas";

jest.mock("@/components/ai-assist/AiAssistClient", () => ({
  AiAssistClient: () => null,
}));

jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

jest.mock("@/lib/blocks/actions", () => ({
  addBlock: jest.fn(),
  updateBlock: jest.fn(),
  deleteBlock: jest.fn(),
}));

const noopLayoutRenderer: LayoutRenderer = () => null;

function buildBlocks(): Block[] {
  return [
    {
      id: "hero-1",
      type: "hero",
      order: 0,
      isDeleted: false,
      layoutColumn: "full",
      content: {
        imageUrl: "/hero.jpg",
        imageAlt: "hero",
        caption: "",
      },
    },
    {
      id: "pull-1",
      type: "pullQuote",
      order: 1,
      isDeleted: false,
      layoutColumn: "full",
      content: {
        text: "Quote",
        author: "Author",
      },
    },
    {
      id: "rich-1",
      type: "richText",
      order: 2,
      isDeleted: false,
      layoutColumn: "full",
      content: {
        html: "<p>About us</p>",
      },
    },
  ];
}

describe("PageEditor AI Assist button", () => {
  it("disables AI Assist when settings panel is open", () => {
    render(
      <PageEditor
        pageId="page-1"
        pageType={PageType.ABOUT}
        pageSlug="about"
        pageTitle="About"
        initialBlocks={buildBlocks()}
        layoutRenderer={noopLayoutRenderer}
        isPublished
        metaDescription=""
        onMetadataUpdate={async () => {}}
      />
    );

    const aiButton = screen.getByRole("button", { name: /ai assist/i });
    expect(aiButton).toBeEnabled();

    const settingsButton = screen.getByRole("button", { name: /settings/i });
    fireEvent.click(settingsButton);

    expect(screen.getByRole("button", { name: /ai assist/i })).toBeDisabled();
  });
});
