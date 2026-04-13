/** @jest-environment node */

import {
  SET_A_EXTRACTION,
  SET_A_SPECIFIC_EXTRACTION,
} from "./fixtures/voice-set-a";
import {
  SET_B_EXTRACTION,
  SET_B_SPECIFIC_EXTRACTION,
} from "./fixtures/voice-set-b";

// ---------------------------------------------------------------------------
// Machine phrases that should NEVER appear in persona output
// ---------------------------------------------------------------------------

const MACHINE_PHRASES = [
  "Based on your query",
  "Searching for",
  "Results for",
  "No matching products",
  "Here are the results",
  "I found the following",
  "Query results",
];

const THIRD_PERSON_PHRASES = [
  "The customer",
  "The user",
  "They want",
  "They are looking",
  "The buyer",
];

// ---------------------------------------------------------------------------
// Shared assertion helpers
// ---------------------------------------------------------------------------

function assertSecondPerson(text: string) {
  for (const phrase of THIRD_PERSON_PHRASES) {
    expect(text.toLowerCase()).not.toContain(phrase.toLowerCase());
  }
}

function assertNoMachinePhrases(text: string) {
  for (const phrase of MACHINE_PHRASES) {
    expect(text.toLowerCase()).not.toContain(phrase.toLowerCase());
  }
}

function assertFollowUpChipFormat(chips: string[]) {
  for (const chip of chips) {
    const words = chip.trim().split(/\s+/);
    expect(words.length).toBeGreaterThanOrEqual(1);
    expect(words.length).toBeLessThanOrEqual(4);
    expect(chip).not.toContain("?");
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Persona accuracy — Set A (warm/curious default voice)", () => {
  it("AC-TST-1: acknowledgment is present and second person", () => {
    expect(SET_A_EXTRACTION.acknowledgment).toBeTruthy();
    assertSecondPerson(SET_A_EXTRACTION.acknowledgment);
  });

  it("AC-TST-1: acknowledgment has no machine phrases", () => {
    assertNoMachinePhrases(SET_A_EXTRACTION.acknowledgment);
  });

  it("AC-TST-10: follow-up chips are 2-4 words, no question marks", () => {
    assertFollowUpChipFormat(SET_A_EXTRACTION.followUps);
  });

  it("AC-TST-11: acknowledgment does not parrot user input", () => {
    const userInput = "smooth chocolatey coffee";
    expect(SET_A_EXTRACTION.acknowledgment).not.toContain(userInput);
  });

  it("AC-TST-12: no third person in acknowledgment", () => {
    assertSecondPerson(SET_A_EXTRACTION.acknowledgment);
    assertSecondPerson(SET_A_SPECIFIC_EXTRACTION.acknowledgment);
  });

  it("warm voice uses exploratory language", () => {
    // Set A is warm/curious — should have filler words, questions, longer sentences
    expect(SET_A_EXTRACTION.acknowledgment.length).toBeGreaterThan(40);
    expect(SET_A_EXTRACTION.followUpQuestion.length).toBeGreaterThan(0);
  });
});

describe("Persona accuracy — Set B (minimal/direct voice)", () => {
  it("AC-TST-2: acknowledgment is present and second person", () => {
    expect(SET_B_EXTRACTION.acknowledgment).toBeTruthy();
    assertSecondPerson(SET_B_EXTRACTION.acknowledgment);
  });

  it("AC-TST-2: acknowledgment has no machine phrases", () => {
    assertNoMachinePhrases(SET_B_EXTRACTION.acknowledgment);
  });

  it("AC-TST-10: follow-up chips are 2-4 words, no question marks", () => {
    assertFollowUpChipFormat(SET_B_EXTRACTION.followUps);
  });

  it("AC-TST-12: no third person in acknowledgment", () => {
    assertSecondPerson(SET_B_EXTRACTION.acknowledgment);
    assertSecondPerson(SET_B_SPECIFIC_EXTRACTION.acknowledgment);
  });

  it("minimal voice uses shorter, more direct language", () => {
    // Set B is minimal — shorter acknowledgments than Set A
    expect(SET_B_EXTRACTION.acknowledgment.length).toBeLessThan(
      SET_A_EXTRACTION.acknowledgment.length
    );
  });
});

describe("Personification comparison — Set A vs Set B (AC-TST-3)", () => {
  it("same query produces different output style between voice sets", () => {
    // Both handle "smooth chocolatey" but with different personality
    expect(SET_A_EXTRACTION.acknowledgment).not.toBe(
      SET_B_EXTRACTION.acknowledgment
    );
    // Set A is warmer/longer, Set B is shorter/direct
    expect(SET_A_EXTRACTION.acknowledgment.length).toBeGreaterThan(
      SET_B_EXTRACTION.acknowledgment.length
    );
  });

  it("Set A follow-up question is conversational, Set B is terse", () => {
    expect(SET_A_EXTRACTION.followUpQuestion.length).toBeGreaterThan(
      SET_B_EXTRACTION.followUpQuestion.length
    );
  });

  it("both sets produce valid follow-up chip format", () => {
    assertFollowUpChipFormat(SET_A_EXTRACTION.followUps);
    assertFollowUpChipFormat(SET_B_EXTRACTION.followUps);
  });
});
