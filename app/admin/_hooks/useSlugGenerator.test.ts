import { generateSlug } from "./useSlugGenerator";

describe("generateSlug", () => {
  describe("basic transformations", () => {
    it("converts text to lowercase", () => {
      expect(generateSlug("Hello World")).toBe("hello-world");
      expect(generateSlug("UPPERCASE")).toBe("uppercase");
    });

    it("replaces spaces with hyphens", () => {
      expect(generateSlug("multiple word phrase")).toBe("multiple-word-phrase");
      expect(generateSlug("single")).toBe("single");
    });

    it("replaces multiple consecutive spaces with single hyphen", () => {
      expect(generateSlug("too    many     spaces")).toBe("too-many-spaces");
    });

    it("trims leading and trailing whitespace", () => {
      expect(generateSlug("  padded text  ")).toBe("padded-text");
      expect(generateSlug("\tleading tab")).toBe("leading-tab");
    });
  });

  describe("unicode normalization", () => {
    it("removes diacritics from accented characters", () => {
      expect(generateSlug("Café")).toBe("cafe");
      expect(generateSlug("naïve")).toBe("naive");
      expect(generateSlug("résumé")).toBe("resume");
    });

    it("handles various accented characters", () => {
      expect(generateSlug("Crème Brûlée")).toBe("creme-brulee");
      expect(generateSlug("São Paulo")).toBe("sao-paulo");
      expect(generateSlug("Zürich")).toBe("zurich");
    });
  });

  describe("special character handling", () => {
    it("removes special characters", () => {
      expect(generateSlug("hello@world!")).toBe("helloworld");
      expect(generateSlug("test#123$")).toBe("test123");
      expect(generateSlug("foo&bar*baz")).toBe("foobarbaz");
    });

    it("preserves alphanumeric characters", () => {
      expect(generateSlug("Product123")).toBe("product123");
      expect(generateSlug("version2024")).toBe("version2024");
    });

    it("converts underscores to hyphens", () => {
      expect(generateSlug("snake_case_text")).toBe("snake-case-text");
      expect(generateSlug("mixed_snake case")).toBe("mixed-snake-case");
    });

    it("consolidates multiple hyphens", () => {
      expect(generateSlug("already-has--hyphens")).toBe("already-has-hyphens");
      expect(generateSlug("too---many----hyphens")).toBe("too-many-hyphens");
    });

    it("removes leading and trailing hyphens", () => {
      expect(generateSlug("-leading")).toBe("leading");
      expect(generateSlug("trailing-")).toBe("trailing");
      expect(generateSlug("-both-")).toBe("both");
      expect(generateSlug("---multiple---")).toBe("multiple");
    });
  });

  describe("edge cases", () => {
    it("handles empty string", () => {
      expect(generateSlug("")).toBe("");
    });

    it("handles string with only special characters", () => {
      expect(generateSlug("@#$%^&*")).toBe("");
    });

    it("handles string with only spaces", () => {
      expect(generateSlug("     ")).toBe("");
    });

    it("handles string with only hyphens", () => {
      expect(generateSlug("-----")).toBe("");
    });

    it("handles mixed valid and invalid characters", () => {
      expect(generateSlug("a!b@c#d")).toBe("abcd");
    });
  });

  describe("real-world examples", () => {
    it("handles product names", () => {
      expect(generateSlug("Ethiopian Yirgacheffe")).toBe(
        "ethiopian-yirgacheffe"
      );
      expect(generateSlug("Dark Roast #1")).toBe("dark-roast-1");
    });

    it("handles category names", () => {
      expect(generateSlug("Single Origin")).toBe("single-origin");
      expect(generateSlug("Fair Trade & Organic")).toBe("fair-trade-organic");
    });

    it("handles names with apostrophes", () => {
      expect(generateSlug("Farmer's Choice")).toBe("farmers-choice");
      expect(generateSlug("It's Amazing!")).toBe("its-amazing");
    });

    it("handles parentheses and brackets", () => {
      expect(generateSlug("Coffee (12 oz)")).toBe("coffee-12-oz");
      expect(generateSlug("Blend [Premium]")).toBe("blend-premium");
    });
  });

  describe("consistency", () => {
    it("produces same result for equivalent inputs", () => {
      const input1 = "  Test  Product  ";
      const input2 = "Test Product";
      expect(generateSlug(input1)).toBe(generateSlug(input2));
    });

    it("produces idempotent results", () => {
      const input = "Complex! Test@ String#";
      const firstPass = generateSlug(input);
      const secondPass = generateSlug(firstPass);
      expect(firstPass).toBe(secondPass);
    });
  });
});
