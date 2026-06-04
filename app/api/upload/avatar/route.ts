import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

const MAX_SIZE = 3 * 1024 * 1024; // 3 MB
const ALLOWED = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]);

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Image upload is not configured on this server. Add BLOB_READ_WRITE_TOKEN to .env.local." },
      { status: 503 }
    );
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file") as File | null;

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file received." }, { status: 400 });
  }

  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "Only JPG, PNG, WebP and GIF images are accepted." }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Image must be under 3 MB." }, { status: 400 });
  }

  const ext = file.type.split("/")[1].replace("jpeg", "jpg");
  const filename = `avatars/${session.user.id}-${Date.now()}.${ext}`;

  const blob = await put(filename, file, { access: "public" });

  return NextResponse.json({ url: blob.url });
}
