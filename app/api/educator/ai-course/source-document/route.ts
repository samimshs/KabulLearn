import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { auth } from "@/auth";
import { storeAiSourceText } from "@/lib/ai-source-document-store";
import { assertRateLimit } from "@/lib/security";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_EXTRACTED_TEXT_LENGTH = 30000;
const MIN_USEFUL_TEXT_LENGTH = 600;
const PREVIEW_LENGTH = 600;

const PDF_TYPES = new Set(["application/pdf"]);
const PPTX_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/octet-stream"
]);

function extensionFromName(filename: string) {
  return filename.toLowerCase().split(".").pop() ?? "";
}

function cleanExtractedText(text: string) {
  return text
    .replace(/\u0000/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

async function extractPdfText(buffer: Buffer) {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    return result.text ?? "";
  } finally {
    await parser.destroy();
  }
}

async function extractDocxText(buffer: Buffer) {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value ?? "";
}

async function extractPptxText(buffer: Buffer) {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(buffer);

  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
    .sort((a, b) => {
      const aNum = parseInt(a.match(/slide(\d+)/i)?.[1] ?? "0", 10);
      const bNum = parseInt(b.match(/slide(\d+)/i)?.[1] ?? "0", 10);
      return aNum - bNum;
    });

  const slideTexts: string[] = [];
  for (const filename of slideFiles) {
    const xml = await zip.files[filename].async("text");
    const texts: string[] = [];
    const re = /<a:t[^>]*>([^<]*)<\/a:t>/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(xml)) !== null) {
      const t = match[1]
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .trim();
      if (t) texts.push(t);
    }
    if (texts.length) slideTexts.push(texts.join(" "));
  }

  return slideTexts.join("\n\n");
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== UserRole.EDUCATOR) {
    return NextResponse.json({ ok: false, error: "Only educators can upload source material." }, { status: 403 });
  }

  try {
    await assertRateLimit(`ai-source-document:${session.user.id}`, 12);
  } catch {
    return NextResponse.json({ ok: false, error: "Too many document uploads. Please wait a moment and try again." }, { status: 429 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file") as File | null;
  if (!file || typeof file === "string") {
    return NextResponse.json({ ok: false, error: "No source document received." }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ ok: false, error: "Source document must be 10 MB or smaller." }, { status: 400 });
  }

  const ext = extensionFromName(file.name);
  const isPdf = PDF_TYPES.has(file.type) || ext === "pdf";
  const isDocx = ext === "docx";
  const isPptx = (PPTX_TYPES.has(file.type) && ext === "pptx") || ext === "pptx";
  if (!isPdf && !isDocx && !isPptx) {
    return NextResponse.json({ ok: false, error: "Only PDF, DOCX, and PPTX source documents are accepted." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let extracted = "";
  try {
    if (isPdf) {
      extracted = cleanExtractedText(await extractPdfText(buffer));
    } else if (isPptx) {
      extracted = cleanExtractedText(await extractPptxText(buffer));
    } else {
      extracted = cleanExtractedText(await extractDocxText(buffer));
    }
  } catch (error) {
    console.error("Source document extraction error:", error);
    return NextResponse.json({ ok: false, error: "Could not read this document. Try a cleaner PDF, DOCX, or PPTX file." }, { status: 400 });
  }

  if (!extracted) {
    return NextResponse.json(
      { ok: false, error: isPptx ? "No readable text was found in the slides. Make sure the PPTX contains text boxes, not just images." : "No readable text was found in this document." },
      { status: 400 }
    );
  }

  const text = extracted.slice(0, MAX_EXTRACTED_TEXT_LENGTH);
  const preview = text.slice(0, PREVIEW_LENGTH);
  const warnings: string[] = [];

  if (extracted.length > MAX_EXTRACTED_TEXT_LENGTH) {
    warnings.push("The document was long, so only the first portion will be used for generation.");
  }
  if (text.length < MIN_USEFUL_TEXT_LENGTH) {
    warnings.push("This document has limited readable text. Add more topic details before generation for better results.");
  }

  const documentId = crypto.randomUUID();
  try {
    await storeAiSourceText({
      userId: session.user.id,
      documentId,
      text
    });
  } catch (error) {
    console.error("Source document temporary store error:", error);
    return NextResponse.json({ ok: false, error: "Could not prepare this source document for generation. Please try again." }, { status: 503 });
  }

  return NextResponse.json({
    ok: true,
    data: {
      sourceType: "upload",
      documentId,
      filename: file.name,
      uploadedAt: new Date().toISOString(),
      preview,
      characterCount: text.length,
      warning: warnings.join(" ") || undefined
    }
  });
}
