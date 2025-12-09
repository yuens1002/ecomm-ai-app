import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { AiAssistContent } from "@/components/ai-assist/AiAssistContent";
import { WizardAnswers } from "@/lib/api-schemas/generate-about";

const baseAnswers: WizardAnswers = {
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

describe("AiAssistContent", () => {
  it("shows overlay when regenerating", () => {
    render(
      <AiAssistContent
        answers={baseAnswers}
        onAnswersChange={jest.fn()}
        onSelectedFieldChange={jest.fn()}
        selectedStyle="story"
        onSelectedStyleChange={jest.fn()}
        isRegenerating
      />
    );

    expect(screen.getByTestId("ai-assist-overlay")).toBeInTheDocument();
  });

  it("switches selected style", () => {
    const handleStyle = jest.fn();

    render(
      <AiAssistContent
        answers={baseAnswers}
        onAnswersChange={jest.fn()}
        onSelectedFieldChange={jest.fn()}
        selectedStyle="story"
        onSelectedStyleChange={handleStyle}
        isRegenerating={false}
      />
    );

    fireEvent.click(screen.getByRole("radio", { name: /values/i }));

    expect(handleStyle).toHaveBeenCalledWith("values");
  });
});
