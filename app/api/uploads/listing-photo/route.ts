import { put } from "@vercel/blob";
import { type NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";

const maxPhotoSizeMb = 8;
const maxPhotoSizeBytes = maxPhotoSizeMb * 1024 * 1024;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function fileExtension(file: File) {
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

export async function POST(request: NextRequest) {
  const authUser = await getCurrentUser();

  if (!authUser) {
    return NextResponse.json(
      { error: "Sign in before uploading listing photos" },
      { status: 401 },
    );
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Image storage is not configured" },
      { status: 503 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Choose an item photo to upload" },
        { status: 400 },
      );
    }

    if (!allowedTypes.has(file.type)) {
      return NextResponse.json(
        { error: "Use a JPG, PNG, or WebP image" },
        { status: 400 },
      );
    }

    if (file.size > maxPhotoSizeBytes) {
      return NextResponse.json(
        { error: `Each photo must be ${maxPhotoSizeMb} MB or less` },
        { status: 400 },
      );
    }

    const blob = await put(
      `listing-photos/${authUser.userId}/${crypto.randomUUID()}.${fileExtension(file)}`,
      file,
      {
        access: "public",
        addRandomSuffix: false,
      },
    );

    return NextResponse.json({
      url: blob.url,
      pathname: blob.pathname,
      contentType: blob.contentType,
      size: file.size,
    });
  } catch (error) {
    console.error("Listing photo upload failed:", error);
    return NextResponse.json(
      { error: "Listing photo upload failed" },
      { status: 500 },
    );
  }
}
