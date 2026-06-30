import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { NextRequest, NextResponse } from "next/server";
import {
  hasValidKabulWalletToken,
  kabulWalletInsightRequestSchema,
  kabulWalletInsightResponseSchema,
  kabulWalletLanguageDirective,
  kabulWalletSystemPrompt,
} from "@/lib/kabulwallet-ai";
import { assertRateLimit, getClientIpFromHeaders } from "@/lib/security";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_BODY_BYTES = 64 * 1024;

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
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
    await assertRateLimit(`kabulwallet-ai:${clientIp}`, 10);
  } catch {
    return json({ error: "Too many requests. Please wait a moment." }, 429);
  }

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
    return json({ error: "Payload is too large." }, 413);
  }

  let input: unknown;
  try {
    input = JSON.parse(rawBody);
  } catch {
    return json({ error: "Invalid JSON." }, 400);
  }

  const parsedRequest = kabulWalletInsightRequestSchema.safeParse(input);
  if (!parsedRequest.success) {
    return json({ error: "Invalid financial summary." }, 400);
  }

  const openAIKey = process.env.OPENAI_API_KEY;
  if (!openAIKey) {
    return json({ error: "AI Insights are not configured yet." }, 503);
  }

  try {
    const client = new OpenAI({ apiKey: openAIKey });
    const response = await client.responses.parse({
      model: process.env.KABULWALLET_OPENAI_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini",
      instructions: kabulWalletSystemPrompt + kabulWalletLanguageDirective(parsedRequest.data.language),
      input: JSON.stringify(parsedRequest.data.financialSummary),
      max_output_tokens: 2_200,
      text: {
        format: zodTextFormat(kabulWalletInsightResponseSchema, "kabulwallet_financial_insight"),
      },
    });

    if (!response.output_parsed) {
      return json({ error: "The AI response did not contain usable output." }, 502);
    }
    return json(response.output_parsed);
  } catch (error) {
    console.error("KabulWallet AI insight generation failed", error);
    if (error instanceof OpenAI.APIError && error.status === 429) {
      return json({ error: "AI Insights are busy. Please try again shortly." }, 429);
    }
    return json({ error: "AI Insights are temporarily unavailable." }, 502);
  }
}
