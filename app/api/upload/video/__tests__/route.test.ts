/** @jest-environment node */

import { NextRequest } from "next/server";

// ── Mocks ──────────────────────────────────────────────────────────────────

const requireAdminApiMock = jest.fn();
jest.mock("@/lib/admin", () => ({
  requireAdminApi: () => requireAdminApiMock(),
}));

const uploadToBlobMock = jest.fn();
const deleteFromBlobMock = jest.fn();
const isBlobUrlMock = jest.fn();
jest.mock("@/lib/blob", () => ({
  uploadToBlob: (...args: unknown[]) => uploadToBlobMock(...args),
  deleteFromBlob: (...args: unknown[]) => deleteFromBlobMock(...args),
  isBlobUrl: (...args: unknown[]) => isBlobUrlMock(...args),
}));

// ── Helpers ────────────────────────────────────────────────────────────────

const BLOB_VIDEO_URL =
  "https://abc123.blob.vercel-storage.com/hero/demo-coffee.mp4";

function deleteRequest(path: string | null) {
  const url = path
    ? `http://localhost/api/upload/video?path=${encodeURIComponent(path)}`
    : "http://localhost/api/upload/video";
  return new NextRequest(url, { method: "DELETE" });
}

function postRequest(file: File, oldPath?: string) {
  const form = new FormData();
  form.append("file", file);
  if (oldPath) form.append("oldPath", oldPath);
  return new NextRequest("http://localhost/api/upload/video", {
    method: "POST",
    body: form,
  });
}

function makeVideoFile(name = "hero.mp4", sizeMB = 1) {
  return new File([new Uint8Array(sizeMB * 1024 * 1024)], name, {
    type: "video/mp4",
  });
}

// ── Module under test ──────────────────────────────────────────────────────

let POST: (req: NextRequest) => Promise<Response>;
let DELETE_HANDLER: (req: NextRequest) => Promise<Response>;

describe("Video upload route", () => {
  beforeAll(async () => {
    const mod = await import("../route");
    POST = mod.POST;
    DELETE_HANDLER = mod.DELETE;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    requireAdminApiMock.mockResolvedValue({ authorized: true });
    isBlobUrlMock.mockReturnValue(true);
    deleteFromBlobMock.mockResolvedValue(undefined);
    uploadToBlobMock.mockResolvedValue({ url: BLOB_VIDEO_URL });
  });

  // ── DELETE ──────────────────────────────────────────────────────────────

  describe("DELETE /api/upload/video", () => {
    it("deletes a blob video and returns { success: true }", async () => {
      const res = await DELETE_HANDLER(deleteRequest(BLOB_VIDEO_URL));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual({ success: true });
      expect(deleteFromBlobMock).toHaveBeenCalledWith(BLOB_VIDEO_URL);
    });

    it("returns 400 when path param is missing", async () => {
      const res = await DELETE_HANDLER(deleteRequest(null));
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toBeDefined();
      expect(deleteFromBlobMock).not.toHaveBeenCalled();
    });

    it("returns 400 when path is not a blob URL", async () => {
      isBlobUrlMock.mockReturnValue(false);

      const res = await DELETE_HANDLER(deleteRequest("/local/video.mp4"));
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toBeDefined();
      expect(deleteFromBlobMock).not.toHaveBeenCalled();
    });

    it("returns 401 when unauthenticated", async () => {
      requireAdminApiMock.mockResolvedValue({
        authorized: false,
        error: "Unauthorized",
      });

      const res = await DELETE_HANDLER(deleteRequest(BLOB_VIDEO_URL));

      expect(res.status).toBe(401);
      expect(deleteFromBlobMock).not.toHaveBeenCalled();
    });

    it("returns 500 when deleteFromBlob throws", async () => {
      deleteFromBlobMock.mockRejectedValue(new Error("Blob storage down"));

      const res = await DELETE_HANDLER(deleteRequest(BLOB_VIDEO_URL));

      expect(res.status).toBe(500);
    });
  });

  // ── POST ───────────────────────────────────────────────────────────────

  describe("POST /api/upload/video", () => {
    it("uploads a video and returns the blob URL", async () => {
      const res = await POST(postRequest(makeVideoFile()));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual({ success: true, path: BLOB_VIDEO_URL });
      expect(uploadToBlobMock).toHaveBeenCalledWith(
        expect.objectContaining({ folder: "hero" })
      );
    });

    it("deletes the old blob URL when oldPath is a blob URL", async () => {
      const oldUrl = "https://abc123.blob.vercel-storage.com/hero/old.mp4";
      const res = await POST(postRequest(makeVideoFile(), oldUrl));

      expect(res.status).toBe(200);
      expect(deleteFromBlobMock).toHaveBeenCalledWith(oldUrl);
    });

    it("does not call deleteFromBlob when oldPath is absent", async () => {
      const res = await POST(postRequest(makeVideoFile()));

      expect(res.status).toBe(200);
      expect(deleteFromBlobMock).not.toHaveBeenCalled();
    });

    it("does not call deleteFromBlob when oldPath is not a blob URL", async () => {
      isBlobUrlMock.mockReturnValue(false);
      const res = await POST(postRequest(makeVideoFile(), "/local/old.mp4"));

      expect(res.status).toBe(200);
      expect(deleteFromBlobMock).not.toHaveBeenCalled();
    });

    it("returns 400 for non-video file type", async () => {
      const imageFile = new File(["data"], "photo.jpg", { type: "image/jpeg" });
      const res = await POST(postRequest(imageFile));
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toMatch(/video/i);
    });

    it("returns 400 when file exceeds 100 MB", async () => {
      const bigFile = makeVideoFile("huge.mp4", 101);
      const res = await POST(postRequest(bigFile));
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toMatch(/100 MB/i);
    });

    it("returns 400 when no file is provided", async () => {
      const form = new FormData();
      const req = new NextRequest("http://localhost/api/upload/video", {
        method: "POST",
        body: form,
      });
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toBeDefined();
    });

    it("returns 401 when unauthenticated", async () => {
      requireAdminApiMock.mockResolvedValue({
        authorized: false,
        error: "Unauthorized",
      });

      const res = await POST(postRequest(makeVideoFile()));

      expect(res.status).toBe(401);
      expect(uploadToBlobMock).not.toHaveBeenCalled();
    });
  });
});
