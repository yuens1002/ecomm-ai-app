/** @jest-environment node */

jest.mock("@/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock("bcryptjs", () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

import { PATCH } from "../route";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const authMock = auth as jest.Mock;
const findUniqueMock = prisma.user.findUnique as jest.Mock;
const updateMock = prisma.user.update as jest.Mock;
const compareMock = bcrypt.compare as jest.Mock;
const hashMock = bcrypt.hash as jest.Mock;

function makeRequest(body: object) {
  return new Request("http://localhost/api/user/password", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/user/password", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    hashMock.mockResolvedValue("hashed_new_password");
  });

  it("returns 401 when not authenticated", async () => {
    authMock.mockResolvedValue(null);
    const res = await PATCH(makeRequest({ newPassword: "newpass123" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when new password is too short", async () => {
    authMock.mockResolvedValue({ user: { email: "admin@test.com" } });
    findUniqueMock.mockResolvedValue({ id: "u1", passwordHash: "existing_hash" });
    const res = await PATCH(makeRequest({ currentPassword: "old", newPassword: "short" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/8 characters/);
  });

  it("returns 404 when user not found", async () => {
    authMock.mockResolvedValue({ user: { email: "ghost@test.com" } });
    findUniqueMock.mockResolvedValue(null);
    const res = await PATCH(makeRequest({ newPassword: "validpassword" }));
    expect(res.status).toBe(404);
  });

  it("returns 400 when current password is missing but user has one", async () => {
    authMock.mockResolvedValue({ user: { email: "admin@test.com" } });
    findUniqueMock.mockResolvedValue({ id: "u1", passwordHash: "existing_hash" });
    const res = await PATCH(makeRequest({ newPassword: "validpassword" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/Current password is required/);
  });

  it("returns 400 when current password is wrong", async () => {
    authMock.mockResolvedValue({ user: { email: "admin@test.com" } });
    findUniqueMock.mockResolvedValue({ id: "u1", passwordHash: "existing_hash" });
    compareMock.mockResolvedValue(false);
    const res = await PATCH(makeRequest({ currentPassword: "wrong", newPassword: "validpassword" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/incorrect/);
  });

  it("changes password successfully with correct current password", async () => {
    authMock.mockResolvedValue({ user: { email: "admin@test.com" } });
    findUniqueMock.mockResolvedValue({ id: "u1", passwordHash: "existing_hash" });
    compareMock.mockResolvedValue(true);
    updateMock.mockResolvedValue({});
    const res = await PATCH(makeRequest({ currentPassword: "correct", newPassword: "newvalidpass" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { passwordHash: "hashed_new_password" },
    });
  });

  it("sets password for OAuth-only user (no current password required)", async () => {
    authMock.mockResolvedValue({ user: { email: "oauth@test.com" } });
    findUniqueMock.mockResolvedValue({ id: "u2", passwordHash: null });
    updateMock.mockResolvedValue({});
    const res = await PATCH(makeRequest({ newPassword: "newvalidpass" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(compareMock).not.toHaveBeenCalled();
  });
});
