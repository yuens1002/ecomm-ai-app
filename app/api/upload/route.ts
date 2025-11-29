import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const oldPath = formData.get("oldPath") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filename = `${timestamp}-${sanitizedName}`;
    const filepath = path.join(process.cwd(), "public", "images", filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Delete old file if it exists and is in our images directory
    if (oldPath && oldPath.startsWith("/images/")) {
      const oldFilepath = path.join(process.cwd(), "public", oldPath);
      if (existsSync(oldFilepath)) {
        try {
          await unlink(oldFilepath);
        } catch (error) {
          console.error("Failed to delete old file:", error);
          // Don't fail the upload if cleanup fails
        }
      }
    }

    return NextResponse.json({
      success: true,
      path: `/images/${filename}`,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imagePath = searchParams.get("path");

    if (!imagePath || !imagePath.startsWith("/images/")) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    const filepath = path.join(process.cwd(), "public", imagePath);

    if (existsSync(filepath)) {
      await unlink(filepath);
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
