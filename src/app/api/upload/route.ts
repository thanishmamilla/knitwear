import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string | null; // "photo" | "voice"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const mime = file.type || (type === "voice" ? "audio/webm" : "image/jpeg");
    const base64 = `data:${mime};base64,${buffer.toString("base64")}`;

    // Return the base64 data URI (compatible anywhere with zero 3rd party config required)
    return NextResponse.json({
      success: true,
      url: base64,
      filename: file.name,
      size: file.size,
      mimeType: mime,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to process upload" }, { status: 500 });
  }
}

