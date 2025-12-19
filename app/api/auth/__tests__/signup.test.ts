/** @jest-environment node */

import { POST } from "../signup/route";
import { NextRequest } from "next/server";

// Mock prisma before importing route
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

// Mock password utils to avoid bcrypt native dependency
jest.mock("@/lib/password", () => ({
  isStrongPassword: (p: string) =>
    /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*])(?!.*\s).{8,}$/.test(p),
  hashPassword: async (p: string) => `hashed_${p}`,
}));

import { prisma } from "@/lib/prisma";

describe("POST /api/auth/signup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const makeRequest = (body: unknown) =>
    new NextRequest("http://localhost:3000/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(body),
    });

  it("returns 400 for invalid email", async () => {
    const req = makeRequest({ email: "not-an-email", password: "Pass@1234" });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(String(data.error)).toContain("Invalid email format");
  });

  it("returns 400 for weak password", async () => {
    const req = makeRequest({ email: "user@example.com", password: "short" });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(String(data.error)).toContain(
      "Password must meet complexity requirements"
    );
  });

  it("returns 400 when email already exists", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({ id: "u1" });

    const req = makeRequest({
      email: "exists@example.com",
      password: "Pass@1234",
      name: "Test",
    });

    const res = await POST(req);
    const data = await res.json();

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "exists@example.com" },
    });
    expect(res.status).toBe(400);
    expect(String(data.error)).toContain("Email already registered");
  });

  it("returns 201 and user payload for success", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
    (prisma.user.create as jest.Mock).mockResolvedValueOnce({
      id: "new-user",
      email: "new@example.com",
      name: "New User",
    });

    const req = makeRequest({
      email: "new@example.com",
      password: "Pass@1234",
      name: "New User",
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data?.user?.id).toBe("new-user");
    expect(data?.user?.email).toBe("new@example.com");
  });
});
