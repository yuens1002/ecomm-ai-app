import { NextRequest, NextResponse } from "next/server";
import { uploadToBlob, deleteFromBlob, isBlobUrl } from "@/lib/blob";
import { requireAdminApi } from "@/lib/admin";

const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminApi();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const oldPath = formData.get("oldPath") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.type.startsWith("video/")) {
      return NextResponse.json(
        { error: "File must be a video" },
        { status: 400 }
      );
    }

    if (file.size > MAX_VIDEO_SIZE) {
      return NextResponse.json(
        { error: "File size must be under 100 MB" },
        { status: 400 }
      );
    }

    const { url } = await uploadToBlob({
      file,
      filename: file.name,
      folder: "hero",
    });

    if (oldPath && isBlobUrl(oldPath)) {
      await deleteFromBlob(oldPath);
    }

    return NextResponse.json({ success: true, path: url });
  } catch (error) {
    console.error("Video upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload video" },
      { status: 500 }
    );
  }
}
