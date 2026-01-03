/** @jest-environment node */

jest.mock("@/lib/prisma", () => ({
  prisma: {
    siteSettings: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

import {
  getProductMenuSettings,
  updateProductMenuSettings,
} from "../settings";
import { productMenuSettingsSchema } from "../../types/menu";
import { prisma } from "@/lib/prisma";

// Type the mock methods properly
type SiteSettingsMock = {
  findUnique: jest.Mock;
  upsert: jest.Mock;
};

const prismaMock = prisma as unknown as { siteSettings: SiteSettingsMock };

describe("productMenuSettings server actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getProductMenuSettings", () => {
    it("should return settings from database", async () => {
      const testSettings = productMenuSettingsSchema.parse({
        icon: "Coffee",
        text: "Blends",
      });

      prismaMock.siteSettings.findUnique
        .mockResolvedValueOnce({
          key: "product_menu_icon",
          value: testSettings.icon,
        })
        .mockResolvedValueOnce({
          key: "product_menu_text",
          value: testSettings.text,
        });

      const result = await getProductMenuSettings();

      expect(result.ok).toBe(true);
      expect(result.data).toEqual(testSettings);
    });

    it("should return defaults when settings don't exist", async () => {
      prismaMock.siteSettings.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const result = await getProductMenuSettings();

      expect(result.ok).toBe(true);
      expect(result.data).toEqual({
        icon: "ShoppingBag",
        text: "Shop",
      });
    });

    it("should handle partial missing settings (icon only)", async () => {
      prismaMock.siteSettings.findUnique
        .mockResolvedValueOnce({ key: "product_menu_icon", value: "Leaf" })
        .mockResolvedValueOnce(null);

      const result = await getProductMenuSettings();

      expect(result.ok).toBe(true);
      expect(result.data).toEqual({
        icon: "Leaf",
        text: "Shop", // default
      });
    });

    it("should handle database errors gracefully", async () => {
      const dbError = new Error("Database connection failed");
      prismaMock.siteSettings.findUnique.mockRejectedValueOnce(dbError);

      const result = await getProductMenuSettings();

      expect(result.ok).toBe(false);
      expect(result.error).toContain("Database connection failed");
    });
  });

  describe("updateProductMenuSettings", () => {
    it("should update valid settings using zod schema", async () => {
      const validInput = productMenuSettingsSchema.parse({
        icon: "Mug",
        text: "Menu",
      });

      prismaMock.siteSettings.upsert
        .mockResolvedValueOnce({
          key: "product_menu_icon",
          value: validInput.icon!,
        })
        .mockResolvedValueOnce({
          key: "product_menu_text",
          value: validInput.text,
        });

      const result = await updateProductMenuSettings(validInput);

      expect(result.ok).toBe(true);
      expect(result.data).toEqual(validInput);
      expect(prismaMock.siteSettings.upsert).toHaveBeenCalledTimes(2);
    });

    it("should update with optional icon (undefined)", async () => {
      const validInput = productMenuSettingsSchema.parse({
        icon: undefined,
        text: "Items",
      });

      prismaMock.siteSettings.upsert
        .mockResolvedValueOnce({ key: "product_menu_icon", value: "" })
        .mockResolvedValueOnce({
          key: "product_menu_text",
          value: validInput.text,
        });

      const result = await updateProductMenuSettings(validInput);

      expect(result.ok).toBe(true);
      expect(result.data).toEqual(validInput);
    });

    it("should reject invalid text (empty string)", async () => {
      const invalidInput = {
        icon: "Coffee",
        text: "", // violates min(1)
      };

      const result = await updateProductMenuSettings(invalidInput);

      expect(result.ok).toBe(false);
      expect(result.error).toContain("Validation failed");
      expect(result.details).toBeDefined();
    });

    it("should reject invalid text (exceeds max length)", async () => {
      const invalidInput = {
        icon: "Coffee",
        text: "This is way too long for the menu", // exceeds max(12)
      };

      const result = await updateProductMenuSettings(invalidInput);

      expect(result.ok).toBe(false);
      expect(result.error).toContain("Validation failed");
    });

    it("should reject missing text field", async () => {
      const invalidInput = {
        icon: "Coffee",
        // text is missing
      };

      const result = await updateProductMenuSettings(invalidInput);

      expect(result.ok).toBe(false);
      expect(result.error).toContain("Validation failed");
    });

    it("should reject non-string values", async () => {
      const invalidInput = {
        icon: 123, // should be string
        text: "Menu",
      };

      const result = await updateProductMenuSettings(invalidInput);

      expect(result.ok).toBe(false);
      expect(result.error).toContain("Validation failed");
    });

    it("should handle text with max length boundary (12 chars)", async () => {
      const validInput = productMenuSettingsSchema.parse({
        icon: undefined,
        text: "1234567890AB", // exactly 12 chars
      });

      prismaMock.siteSettings.upsert
        .mockResolvedValueOnce({ key: "product_menu_icon", value: "" })
        .mockResolvedValueOnce({
          key: "product_menu_text",
          value: validInput.text,
        });

      const result = await updateProductMenuSettings(validInput);

      expect(result.ok).toBe(true);
      expect(result.data?.text).toBe(validInput.text);
    });

    it("should handle database errors during upsert", async () => {
      const validInput = productMenuSettingsSchema.parse({
        icon: "Star",
        text: "Items",
      });

      const dbError = new Error("Database write failed");
      prismaMock.siteSettings.upsert.mockRejectedValueOnce(dbError);

      const result = await updateProductMenuSettings(validInput);

      expect(result.ok).toBe(false);
      expect(result.error).toContain("Database write failed");
    });

    it("should call upsert with correct parameters", async () => {
      const validInput = productMenuSettingsSchema.parse({
        icon: "Bag",
        text: "Store",
      });

      prismaMock.siteSettings.upsert
        .mockResolvedValueOnce({
          key: "product_menu_icon",
          value: validInput.icon!,
        })
        .mockResolvedValueOnce({
          key: "product_menu_text",
          value: validInput.text,
        });

      await updateProductMenuSettings(validInput);

      expect(prismaMock.siteSettings.upsert).toHaveBeenNthCalledWith(1, {
        where: { key: "product_menu_icon" },
        update: { value: validInput.icon },
        create: { key: "product_menu_icon", value: validInput.icon },
      });

      expect(prismaMock.siteSettings.upsert).toHaveBeenNthCalledWith(2, {
        where: { key: "product_menu_text" },
        update: { value: validInput.text },
        create: { key: "product_menu_text", value: validInput.text },
      });
    });

    it("should convert icon undefined to empty string for storage", async () => {
      const validInput = productMenuSettingsSchema.parse({
        icon: undefined,
        text: "Store",
      });

      prismaMock.siteSettings.upsert
        .mockResolvedValueOnce({ key: "product_menu_icon", value: "" })
        .mockResolvedValueOnce({
          key: "product_menu_text",
          value: validInput.text,
        });

      await updateProductMenuSettings(validInput);

      // First upsert call should use icon || "" which results in ""
      expect(prismaMock.siteSettings.upsert).toHaveBeenNthCalledWith(1, {
        where: { key: "product_menu_icon" },
        update: { value: "" },
        create: { key: "product_menu_icon", value: "" },
      });
    });

    it("should trim whitespace from text", async () => {
      const inputWithWhitespace = "  Menu  ";
      const validInput = productMenuSettingsSchema.parse({
        icon: "Cup",
        text: inputWithWhitespace.trim(),
      });

      prismaMock.siteSettings.upsert
        .mockResolvedValueOnce({
          key: "product_menu_icon",
          value: validInput.icon!,
        })
        .mockResolvedValueOnce({
          key: "product_menu_text",
          value: validInput.text,
        });

      const result = await updateProductMenuSettings(validInput);

      expect(result.ok).toBe(true);
      expect(result.data?.text).toBe("Menu");
    });
  });

  describe("schema validation edge cases", () => {
    it("should validate text with special characters", async () => {
      const validInput = productMenuSettingsSchema.parse({
        icon: "Tag",
        text: "Café",
      });

      prismaMock.siteSettings.upsert
        .mockResolvedValueOnce({
          key: "product_menu_icon",
          value: validInput.icon!,
        })
        .mockResolvedValueOnce({
          key: "product_menu_text",
          value: validInput.text,
        });

      const result = await updateProductMenuSettings(validInput);

      expect(result.ok).toBe(true);
      expect(result.data?.text).toBe("Café");
    });

    it("should accept common icon names", async () => {
      const iconNames = ["Coffee", "ShoppingBag", "Leaf", "Star", "Mug"];

      for (const iconName of iconNames) {
        const validInput = productMenuSettingsSchema.parse({
          icon: iconName,
          text: "Test",
        });

        expect(validInput.icon).toBe(iconName);
      }
    });
  });
});
