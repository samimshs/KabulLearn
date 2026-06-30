import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { NextRequest, NextResponse } from "next/server";
import readXlsxFile from "read-excel-file/node";
import {
  hasValidKabulWalletToken,
  kabulWalletImportResponseSchema,
  kabulWalletImportSystemPrompt,
  kabulWalletRowsToTableText,
} from "@/lib/kabulwallet-ai";
import { assertRateLimit, getClientIpFromHeaders } from "@/lib/security";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB, matches the iOS client cap

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/// Reads the uploaded file into a compact tab-separated table the model can parse.
async function extractTableText(filename: string, bytes: Buffer): Promise<string> {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".xlsx")) {
    const parsed = (await readXlsxFile(bytes)) as unknown;
    // read-excel-file/node returns either Row[] or [{ sheet, data: Row[] }].
    let rows: unknown[][] = [];
    if (Array.isArray(parsed)) {
      const first = parsed[0] as unknown;
      if (first && typeof first === "object" && !Array.isArray(first) && "data" in first) {
        rows = ((first as { data?: unknown[][] }).data ?? []) as unknown[][];
      } else {
        rows = parsed as unknown[][];
      }
    }
    return kabulWalletRowsToTableText(rows);
  }
  // CSV (and other plain-text tables): pass through, length-capped.
  return bytes.toString("utf8").slice(0, 40_000);
}

export async function POST(request: NextRequest) {
  const apiToken = process.env.KABULWALLET_API_TOKEN;
  if (!apiToken?.trim()) {
    return json({ error: "KabulWallet AI is not configured." }, 503);
  }
  if (!hasValidKabulWalletToken(request.headers, apiToken)) {
    return json({ error: "Unauthorized." }, 401);
  }

  try {
    const clientIp = getClientIpFromHeaders(request.headers);
    await assertRateLimit(`kabulwallet-import:${clientIp}`, 10);
  } catch {
    return json({ error: "Too many requests. Please wait a moment." }, 429);
  }

  let file: File | null = null;
  try {
    const form = await request.formData();
    const value = form.get("file");
    if (value instanceof File) file = value;
  } catch {
    return json({ error: "Invalid upload." }, 400);
  }
  if (!file) {
    return json({ error: "No file was provided." }, 400);
  }
  if (file.size > MAX_FILE_BYTES) {
    return json({ error: "The file is larger than 10 MB." }, 413);
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const filename = file.name || "upload";
  const lower = filename.toLowerCase();
  if (!lower.endsWith(".xlsx") && !lower.endsWith(".csv")) {
    return json({ error: "Choose a CSV or .xlsx Excel workbook." }, 415);
  }

  let tableText: string;
  try {
    tableText = await extractTableText(filename, bytes);
  } catch {
    return json({ error: "The file could not be read as a transaction table." }, 422);
  }
  if (!tableText.trim()) {
    return json({ error: "No rows were found in the file." }, 422);
  }

  const openAIKey = process.env.OPENAI_API_KEY;
  if (!openAIKey) {
    return json({ error: "AI Insights are not configured yet." }, 503);
  }

  try {
    const client = new OpenAI({ apiKey: openAIKey });
    const response = await client.responses.parse({
      model: process.env.KABULWALLET_OPENAI_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini",
      instructions: kabulWalletImportSystemPrompt,
      input: `Spreadsheet contents (tab-separated rows):\n${tableText}`,
      max_output_tokens: 8_000,
      text: {
        format: zodTextFormat(kabulWalletImportResponseSchema, "kabulwallet_financial_import"),
      },
    });

    if (!response.output_parsed) {
      return json({ error: "The AI response did not contain usable output." }, 502);
    }

    // Default any missing dates to today so the app can file the record immediately.
    const items = response.output_parsed.items.map((item) => ({
      ...item,
      date: /^\d{4}-\d{2}-\d{2}$/.test(item.date) ? item.date : todayISO(),
    }));

    return json({ items });
  } catch (error) {
    console.error("KabulWallet AI import failed", error);
    if (error instanceof OpenAI.APIError && error.status === 429) {
      return json({ error: "AI is busy. Please try again shortly." }, 429);
    }
    return json({ error: "AI could not analyze this file." }, 502);
  }
}
