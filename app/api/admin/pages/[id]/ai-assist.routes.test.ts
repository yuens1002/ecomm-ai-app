import { NextRequest } from "next/server";
import { PATCH as replaceBlocksHandler } from "@/app/api/admin/pages/[id]/replace-blocks/route";
import {
  GET as aiStateGetHandler,
  PUT as aiStatePutHandler,
} from "@/app/api/admin/pages/[id]/ai-state/route";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type TxOp = () => unknown | Promise<unknown>;

jest.mock("@/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    block: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    page: {
      update: jest.fn(),
    },
    siteSettings: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    $transaction: jest.fn((ops: TxOp[]) => Promise.all(ops.map((op) => op()))),
  },
}));

describe("AI Assist API routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("replace-blocks", () => {
    // Valid blocks that match normalizeBlock requirements
    const validBlocks = [
      {
        type: "hero",
        order: 0,
        content: {
          imageUrl: "https://example.com/hero.jpg",
          heading: "Our Story",
        },
      },
      {
        type: "richText",
        order: 1,
        content: { html: "<p>Hello world</p>" },
      },
    ];

    const routeParams = {
      params: Promise.resolve({ id: "page-123" }),
    } satisfies {
      params: Promise<{ id: string }>;
    };

    it("returns 401 when unauthenticated", async () => {
      (auth as jest.Mock).mockResolvedValue({ user: null });

      const req = new NextRequest("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ blocks: validBlocks }),
      });

      const res = await replaceBlocksHandler(req, routeParams);

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe("Unauthorized");
    });

    it("returns 403 for non-admin users", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { email: "user@example.com" },
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        isAdmin: false,
      });

      const req = new NextRequest("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ blocks: validBlocks }),
      });

      const res = await replaceBlocksHandler(req, routeParams);

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toBe("Forbidden");
    });

    it("replaces blocks when authenticated as admin", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { email: "admin@example.com" },
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        isAdmin: true,
      });
      (prisma.block.deleteMany as jest.Mock).mockResolvedValue({ count: 2 });
      (prisma.block.createMany as jest.Mock).mockResolvedValue({ count: 2 });
      (prisma.page.update as jest.Mock).mockResolvedValue({ id: "page-123" });
      (prisma.$transaction as jest.Mock).mockImplementation(
        async (ops: TxOp[]) => {
          for (const op of ops) {
            await op();
          }
        }
      );

      const payload = {
        blocks: validBlocks,
        metaDescription: "Test description",
        heroImageUrl: "https://example.com/hero.jpg",
        heroAltText: "Alt text",
      };

      const req = new NextRequest("http://localhost", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      const res = await replaceBlocksHandler(req, routeParams);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.blocksApplied).toBe(2);
      expect(json.blocks).toHaveLength(2);
      expect(prisma.block.deleteMany).toHaveBeenCalledWith({
        where: { pageId: "page-123" },
      });
      expect(prisma.block.createMany).toHaveBeenCalled();
      expect(prisma.page.update).toHaveBeenCalled();
    });

    it("returns 400 when no valid blocks to apply", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { email: "admin@example.com" },
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        isAdmin: true,
      });

      // Hero without imageUrl will be filtered out by normalizeBlock
      const invalidBlocks = [
        { type: "hero", order: 0, content: {} },
        { type: "unknownType", order: 1, content: {} },
      ];

      const req = new NextRequest("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ blocks: invalidBlocks }),
      });

      const res = await replaceBlocksHandler(req, routeParams);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("No valid blocks to apply");
    });

    it("returns 400 on empty blocks array", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { email: "admin@example.com" },
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        isAdmin: true,
      });

      const req = new NextRequest("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ blocks: [] }),
      });

      const res = await replaceBlocksHandler(req, routeParams);

      expect(res.status).toBe(400);
    });

    it("normalizes different block types correctly", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { email: "admin@example.com" },
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        isAdmin: true,
      });
      (prisma.$transaction as jest.Mock).mockImplementation(
        async (ops: TxOp[]) => {
          for (const op of ops) {
            await op();
          }
        }
      );

      const mixedBlocks = [
        { type: "hero", order: 0, content: { imageUrl: "/hero.jpg" } },
        { type: "richText", order: 1, content: { html: "<p>Text</p>" } },
        { type: "stat", order: 2, content: { label: "Years", value: "10" } },
        {
          type: "pullQuote",
          order: 3,
          content: { text: "Quote", author: "Author" },
        },
      ];

      const req = new NextRequest("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ blocks: mixedBlocks }),
      });

      const res = await replaceBlocksHandler(req, routeParams);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.blocksApplied).toBe(4);
    });
  });

  describe("ai-state GET", () => {
    const routeParams = {
      params: Promise.resolve({ id: "page-123" }),
    } satisfies {
      params: Promise<{ id: string }>;
    };

    it("returns 401 when unauthenticated", async () => {
      (auth as jest.Mock).mockResolvedValue({ user: null });

      const req = new NextRequest("http://localhost", { method: "GET" });
      const res = await aiStateGetHandler(req, routeParams);

      expect(res.status).toBe(401);
    });

    it("returns empty object when no state exists", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { email: "admin@example.com" },
      });
      (prisma.siteSettings.findUnique as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest("http://localhost", { method: "GET" });
      const res = await aiStateGetHandler(req, routeParams);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual({});
    });

    it("returns parsed state when it exists", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { email: "admin@example.com" },
      });

      const storedState = {
        answers: { businessName: "Test Coffee" },
        selectedStyle: "values",
        selectedField: "foundingStory",
      };

      (prisma.siteSettings.findUnique as jest.Mock).mockResolvedValue({
        key: "ai_assist_state_page-123",
        value: JSON.stringify(storedState),
      });

      const req = new NextRequest("http://localhost", { method: "GET" });
      const res = await aiStateGetHandler(req, routeParams);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.answers.businessName).toBe("Test Coffee");
      expect(json.selectedStyle).toBe("values");
    });

    it("returns empty object on malformed JSON", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { email: "admin@example.com" },
      });
      (prisma.siteSettings.findUnique as jest.Mock).mockResolvedValue({
        key: "ai_assist_state_page-123",
        value: "not-valid-json",
      });

      const req = new NextRequest("http://localhost", { method: "GET" });
      const res = await aiStateGetHandler(req, routeParams);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual({});
    });
  });

  describe("ai-state PUT", () => {
    const routeParams = {
      params: Promise.resolve({ id: "page-123" }),
    } satisfies {
      params: Promise<{ id: string }>;
    };

    it("returns 401 when unauthenticated", async () => {
      (auth as jest.Mock).mockResolvedValue({ user: null });

      const req = new NextRequest("http://localhost", {
        method: "PUT",
        body: JSON.stringify({ answers: {} }),
      });

      const res = await aiStatePutHandler(req, routeParams);

      expect(res.status).toBe(401);
    });

    it("saves state successfully", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { email: "admin@example.com" },
      });
      (prisma.siteSettings.upsert as jest.Mock).mockResolvedValue({
        key: "ai_assist_state_page-123",
      });

      const payload = {
        answers: {
          businessName: "Test Coffee",
          foundingStory: "Founded in 2020",
          uniqueApproach: "Quality beans",
          coffeeSourcing: "Direct trade",
          roastingPhilosophy: "Small batch",
          targetAudience: "Coffee lovers",
          brandPersonality: "Friendly",
          keyValues: "Sustainability",
          communityRole: "Local partner",
          futureVision: "Expand globally",
          heroImageUrl: null,
          heroImageDescription: null,
          previousHeroImageUrl: null,
        },
        selectedStyle: "story",
        selectedField: "",
      };

      const req = new NextRequest("http://localhost", {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      const res = await aiStatePutHandler(req, routeParams);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(prisma.siteSettings.upsert).toHaveBeenCalledWith({
        where: { key: "ai_assist_state_page-123" },
        update: { value: expect.any(String) },
        create: { key: "ai_assist_state_page-123", value: expect.any(String) },
      });
    });

    it("returns 400 on invalid payload schema", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { email: "admin@example.com" },
      });

      // Missing required answers fields
      const req = new NextRequest("http://localhost", {
        method: "PUT",
        body: JSON.stringify({ answers: "not-an-object" }),
      });

      const res = await aiStatePutHandler(req, routeParams);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Invalid payload");
    });

    it("validates selectedStyle enum", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { email: "admin@example.com" },
      });

      const payload = {
        answers: {
          businessName: "Test",
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
        },
        selectedStyle: "invalid-style",
      };

      const req = new NextRequest("http://localhost", {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      const res = await aiStatePutHandler(req, routeParams);

      expect(res.status).toBe(400);
    });
  });
});
