/** @jest-environment node */

import { Prisma } from "@prisma/client";
import {
  stripCopySuffix,
  makeCloneName,
  makeNewItemName,
  isUniqueConstraintError,
  retryWithUniqueConstraint,
} from "../utils";

describe("actions/utils", () => {
  describe("stripCopySuffix", () => {
    it("should strip 'copy' suffix from name", () => {
      expect(stripCopySuffix("Blends copy")).toBe("Blends");
    });

    it("should strip 'copy (n)' suffix from name", () => {
      expect(stripCopySuffix("Blends copy (2)")).toBe("Blends");
      expect(stripCopySuffix("Blends copy (10)")).toBe("Blends");
      expect(stripCopySuffix("Blends copy (999)")).toBe("Blends");
    });

    it("should handle case-insensitive matching", () => {
      expect(stripCopySuffix("Blends Copy")).toBe("Blends");
      expect(stripCopySuffix("Blends COPY (2)")).toBe("Blends");
    });

    it("should return original name if no copy suffix", () => {
      expect(stripCopySuffix("Blends")).toBe("Blends");
      expect(stripCopySuffix("Some Name")).toBe("Some Name");
    });

    it("should handle names that contain 'copy' in the middle", () => {
      expect(stripCopySuffix("Copy Machine")).toBe("Copy Machine");
      expect(stripCopySuffix("My copy of data")).toBe("My copy of data");
    });

    it("should trim whitespace", () => {
      expect(stripCopySuffix("  Blends copy  ")).toBe("Blends");
      expect(stripCopySuffix("  Blends  ")).toBe("Blends");
    });
  });

  describe("makeCloneName", () => {
    it("should generate 'copy' for first attempt (attempt=0)", () => {
      expect(makeCloneName("Blends", 0)).toBe("Blends copy");
    });

    it("should generate 'copy (n)' for subsequent attempts", () => {
      expect(makeCloneName("Blends", 1)).toBe("Blends copy (2)");
      expect(makeCloneName("Blends", 2)).toBe("Blends copy (3)");
      expect(makeCloneName("Blends", 9)).toBe("Blends copy (10)");
    });

    it("should work with different base names", () => {
      expect(makeCloneName("Coffee Beans", 0)).toBe("Coffee Beans copy");
      expect(makeCloneName("Coffee Beans", 1)).toBe("Coffee Beans copy (2)");
    });
  });

  describe("makeNewItemName", () => {
    it("should generate 'New [Type]' for first attempt (attempt=0)", () => {
      expect(makeNewItemName("Label", 0)).toBe("New Label");
      expect(makeNewItemName("Category", 0)).toBe("New Category");
    });

    it("should generate 'New [Type] (n)' for subsequent attempts", () => {
      expect(makeNewItemName("Label", 1)).toBe("New Label (2)");
      expect(makeNewItemName("Label", 2)).toBe("New Label (3)");
      expect(makeNewItemName("Category", 1)).toBe("New Category (2)");
    });
  });

  describe("isUniqueConstraintError", () => {
    it("should return true for Prisma P2002 error", () => {
      const error = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "5.0.0",
      });
      expect(isUniqueConstraintError(error)).toBe(true);
    });

    it("should return false for other Prisma errors", () => {
      const error = new Prisma.PrismaClientKnownRequestError("Not found", {
        code: "P2025",
        clientVersion: "5.0.0",
      });
      expect(isUniqueConstraintError(error)).toBe(false);
    });

    it("should return false for non-Prisma errors", () => {
      expect(isUniqueConstraintError(new Error("Generic error"))).toBe(false);
      expect(isUniqueConstraintError("string error")).toBe(false);
      expect(isUniqueConstraintError(null)).toBe(false);
      expect(isUniqueConstraintError(undefined)).toBe(false);
    });
  });

  describe("retryWithUniqueConstraint", () => {
    it("should succeed on first attempt if no error", async () => {
      const mockCreate = jest.fn().mockResolvedValue({ id: "123", name: "Test" });
      const mockMakeName = jest.fn((attempt) => `Name ${attempt}`);

      const result = await retryWithUniqueConstraint({
        makeName: mockMakeName,
        create: mockCreate,
      });

      expect(result).toEqual({ ok: true, data: { id: "123", name: "Test" } });
      expect(mockMakeName).toHaveBeenCalledTimes(1);
      expect(mockMakeName).toHaveBeenCalledWith(0);
      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(mockCreate).toHaveBeenCalledWith("Name 0");
    });

    it("should retry on unique constraint error", async () => {
      const p2002Error = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "5.0.0",
      });

      const mockCreate = jest
        .fn()
        .mockRejectedValueOnce(p2002Error) // First attempt fails
        .mockRejectedValueOnce(p2002Error) // Second attempt fails
        .mockResolvedValue({ id: "123", name: "Test copy (3)" }); // Third succeeds

      const mockMakeName = jest.fn((attempt) => `Test copy ${attempt > 0 ? `(${attempt + 1})` : ""}`);

      const result = await retryWithUniqueConstraint({
        makeName: mockMakeName,
        create: mockCreate,
      });

      expect(result).toEqual({ ok: true, data: { id: "123", name: "Test copy (3)" } });
      expect(mockMakeName).toHaveBeenCalledTimes(3);
      expect(mockCreate).toHaveBeenCalledTimes(3);
    });

    it("should return error after max attempts", async () => {
      const p2002Error = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "5.0.0",
      });

      const mockCreate = jest.fn().mockRejectedValue(p2002Error);
      const mockMakeName = jest.fn((attempt) => `Name ${attempt}`);

      const result = await retryWithUniqueConstraint({
        makeName: mockMakeName,
        create: mockCreate,
        maxAttempts: 3,
        errorMessage: "Custom error message",
      });

      expect(result).toEqual({ ok: false, error: "Custom error message" });
      expect(mockMakeName).toHaveBeenCalledTimes(3);
      expect(mockCreate).toHaveBeenCalledTimes(3);
    });

    it("should use default max attempts (50) if not specified", async () => {
      const p2002Error = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "5.0.0",
      });

      const mockCreate = jest.fn().mockRejectedValue(p2002Error);
      const mockMakeName = jest.fn((attempt) => `Name ${attempt}`);

      const result = await retryWithUniqueConstraint({
        makeName: mockMakeName,
        create: mockCreate,
      });

      expect(result).toEqual({ ok: false, error: "Could not generate unique name" });
      expect(mockMakeName).toHaveBeenCalledTimes(50);
      expect(mockCreate).toHaveBeenCalledTimes(50);
    });

    it("should throw non-unique-constraint errors immediately", async () => {
      const genericError = new Error("Database connection failed");
      const mockCreate = jest.fn().mockRejectedValue(genericError);
      const mockMakeName = jest.fn((attempt) => `Name ${attempt}`);

      await expect(
        retryWithUniqueConstraint({
          makeName: mockMakeName,
          create: mockCreate,
        })
      ).rejects.toThrow("Database connection failed");

      expect(mockMakeName).toHaveBeenCalledTimes(1);
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it("should use custom error message", async () => {
      const p2002Error = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "5.0.0",
      });

      const mockCreate = jest.fn().mockRejectedValue(p2002Error);
      const mockMakeName = jest.fn((attempt) => `Name ${attempt}`);

      const result = await retryWithUniqueConstraint({
        makeName: mockMakeName,
        create: mockCreate,
        maxAttempts: 2,
        errorMessage: "Failed to generate unique label name",
      });

      expect(result).toEqual({ ok: false, error: "Failed to generate unique label name" });
    });
  });
});
