import { NextRequest } from "next/server";
import { PATCH as replaceBlocksHandler } from "@/app/api/admin/pages/[id]/replace-blocks/route";
import { PUT as aiStateHandler } from "@/app/api/admin/pages/[id]/ai-state/route";
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
    const baseBlocks = [
      {
        id: "1",
        type: "hero",
        order: 0,
        isDeleted: false,
        layoutColumn: "full",
        content: {},
      },
      {
        id: "2",
        type: "richText",
        order: 1,
        isDeleted: false,
        layoutColumn: "full",
        content: {},
      },
    ];

    const routeParams = { params: Promise.resolve({ id: "123" }) } satisfies {
      params: Promise<{ id: string }>;
    };

    it("returns 401 when unauthenticated", async () => {
      (auth as jest.Mock).mockResolvedValue({ user: null });

      const res = await replaceBlocksHandler(
        new NextRequest("http://localhost"),
        routeParams
      );

      expect(res.status).toBe(401);
    });

    it("replaces blocks when authenticated", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { email: "admin@example.com" },
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        isAdmin: true,
      });
      (prisma.block.deleteMany as jest.Mock).mockResolvedValue(undefined);
      (prisma.block.createMany as jest.Mock).mockResolvedValue(undefined);
      (prisma.page.update as jest.Mock).mockResolvedValue(undefined);
      (prisma.$transaction as jest.Mock).mockImplementation(
        async (ops: TxOp[]) => {
          for (const op of ops) {
            await op();
          }
        }
      );

      const payload = {
        blocks: baseBlocks,
        aiState: { contentId: "ai-123" },
        heroImageUrl: "https://example.com/hero.jpg",
        heroImageDescription: "Alt text",
        previousHeroImageUrl: "https://example.com/hero.jpg",
      };

      const req = new NextRequest("http://localhost", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      const res = await replaceBlocksHandler(req, routeParams);

      expect(res.status).toBe(200);
      expect(prisma.block.deleteMany).toHaveBeenCalled();
      expect(prisma.block.createMany).toHaveBeenCalled();
      expect(prisma.page.update).toHaveBeenCalled();
    });

    it("returns 400 on invalid payload", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { email: "admin@example.com" },
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        isAdmin: true,
      });

      const req = new NextRequest("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ blocks: "invalid" }),
      });

      const res = await replaceBlocksHandler(req, routeParams);

      expect(res.status).toBe(400);
    });
  });

  describe("ai-state", () => {
    const routeParams = { params: Promise.resolve({ id: "123" }) } satisfies {
      params: Promise<{ id: string }>;
    };

    it("returns 401 when unauthenticated", async () => {
      (auth as jest.Mock).mockResolvedValue({ user: null });

      const res = await aiStateHandler(
        new NextRequest("http://localhost"),
        routeParams
      );

      expect(res.status).toBe(401);
    });

    it("returns page content when authenticated", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { email: "admin@example.com" },
      });
      (prisma.siteSettings.findUnique as jest.Mock).mockResolvedValue({
        value: JSON.stringify({
          answers: {},
          selectedStyle: "story",
          selectedField: "",
        }),
      });

      const res = await aiStateHandler(
        new NextRequest("http://localhost"),
        routeParams
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toBeDefined();
    });
  });
});
