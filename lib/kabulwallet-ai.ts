import { timingSafeEqual } from "node:crypto";
import { z } from "zod";

const finiteNumber = z.number().finite();

const categoryAmountSchema = z.object({
  category: z.string().min(1).max(80),
  amountUSD: finiteNumber,
}).strict();

const ledgerItemSchema = z.object({
  name: z.string().min(1).max(160),
  amountUSD: finiteNumber,
  dueDate: z.string().max(32),
  type: z.string().max(40),
}).strict();

const largeExpenseSchema = z.object({
  category: z.string().min(1).max(80),
  amountUSD: finiteNumber,
  date: z.string().max(32),
}).strict();

export const kabulWalletInsightRequestSchema = z.object({
  financialSummary: z.object({
    totalNetWorthUSD: finiteNumber,
    totalAssetsUSD: finiteNumber,
    banksTotalUSD: finiteNumber,
    cashTotalUSD: finiteNumber,
    investmentsTotalUSD: finiteNumber,
    receivablesUSD: finiteNumber,
    payablesUSD: finiteNumber,
    monthlyExpensesUSD: finiteNumber,
    // `.nullish()` (not `.nullable()`): Swift's JSONEncoder OMITS this key when the
    // value is nil (no prior-month data), so it can be a number, null, or absent.
    previousMonthExpensesUSD: finiteNumber.nullish(),
    topExpenseCategories: z.array(categoryAmountSchema).max(30),
    budgetStatus: z.array(categoryAmountSchema).max(30),
    zakatDueUSD: finiteNumber,
    zakatPaidUSD: finiteNumber,
    upcomingLedgerDueItems: z.array(ledgerItemSchema).max(30),
    overdueLedgerItems: z.array(ledgerItemSchema).max(30),
    recentLargeExpenses: z.array(largeExpenseSchema).max(30),
    preferredCurrency: z.enum(["USD", "AFN"]),
    exchangeRate: finiteNumber.positive(),
    availableMonthsOfHistory: z.number().int().min(0).max(1_200),
  }).strict(),
  language: z.string().trim().min(1).max(60).default("English"),
}).strict();

const insightSchema = z.object({
  title: z.string().max(100),
  message: z.string().max(300),
  severity: z.enum(["info", "warning", "positive", "urgent"]),
  relatedArea: z.enum(["dashboard", "expenses", "assets", "ledger", "zakat", "budget"]),
  recommendedAction: z.string().max(200),
}).strict();

const recommendedActionSchema = z.object({
  title: z.string().max(100),
  description: z.string().max(250),
  priority: z.enum(["low", "medium", "high"]),
  targetScreen: z.enum(["dashboard", "expenses", "assets", "ledger", "zakat", "settings"]),
}).strict();

const riskFlagSchema = z.object({
  title: z.string().max(100),
  explanation: z.string().max(250),
}).strict();

export const kabulWalletInsightResponseSchema = z.object({
  summary: z.string().min(1).max(500),
  healthLabel: z.string().min(1).max(80),
  insights: z.array(insightSchema).max(8),
  recommendedActions: z.array(recommendedActionSchema).max(8),
  zakatCommentary: z.string().max(400),
  spendingCommentary: z.string().max(400),
  netWorthCommentary: z.string().max(400),
  ledgerCommentary: z.string().max(400),
  riskFlags: z.array(riskFlagSchema).max(6),
}).strict();

export const kabulWalletSystemPrompt = `You are a cautious personal finance insight assistant for KabulWallet. Analyze only the provided financial summary. Do not invent missing facts. Do not give investment, tax, legal, or religious rulings as authoritative advice. For Zakat, explain calculations based only on the app's configured assumptions and remind users to verify with a qualified scholar if needed. Keep insights practical, concise, and action-oriented.

Field meanings you MUST follow exactly — never reverse who owes whom:
- "receivablesUSD" is the total amount OTHER people owe TO the user (money the user is owed and should collect). It is an asset to the user, never a debt.
- "payablesUSD" is the total amount the USER owes to other people (the user's own debts to pay).
- In "upcomingLedgerDueItems" and "overdueLedgerItems", each item's "type" field gives the direction for that named person:
  - type "owed_to_me" → that named person owes money TO the user. Always phrase this as "<name> owes you <amount>" / the user should collect it. Never say the user owes them.
  - type "i_owe" → the USER owes money to that named person. Always phrase this as "you owe <name> <amount>" / the user should pay it.
Double-check the direction of every ledger statement against the item's "type" before writing it.`;

export function kabulWalletLanguageDirective(language: string) {
  const clean = language.trim().slice(0, 60) || "English";
  if (/^english/i.test(clean)) return "";
  return `\n\nThe user's app language is ${clean}. Write every human-readable string value entirely in ${clean}, using simple, natural language common in Afghanistan. If the language is Pashto, use Pashto only; if it is Dari, use Dari only. Keep JSON keys, enum values, currency codes, and numeric digits unchanged.`;
}

export function hasValidKabulWalletToken(headers: Headers, configuredToken: string | undefined) {
  const expected = configuredToken?.trim();
  const authorization = headers.get("authorization") ?? "";
  const provided = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!expected || !provided) return false;

  const expectedBytes = Buffer.from(expected);
  const providedBytes = Buffer.from(provided);
  return expectedBytes.length === providedBytes.length && timingSafeEqual(expectedBytes, providedBytes);
}

export type KabulWalletInsightRequest = z.infer<typeof kabulWalletInsightRequestSchema>;
export type KabulWalletInsightResponse = z.infer<typeof kabulWalletInsightResponseSchema>;

// --- AI Excel/CSV import (POST /api/ai/import) -----------------------------
// The iOS app uploads a CSV or .xlsx file and expects { items: [...] } matching
// FinancialImportItem in the app. Kinds/currencies are fixed enums the app applies.

export const kabulWalletImportItemSchema = z
  .object({
    kind: z.enum(["expense", "asset", "receivable", "payable"]),
    date: z.string().max(32),
    name: z.string().min(1).max(160),
    category: z.string().min(1).max(80),
    amount: finiteNumber.positive(),
    currency: z.enum(["USD", "AFN"]),
    notes: z.string().max(200),
    confidence: z.number().min(0).max(1),
  })
  .strict();

export const kabulWalletImportResponseSchema = z
  .object({
    items: z.array(kabulWalletImportItemSchema).max(500),
  })
  .strict();

export const kabulWalletImportSystemPrompt = `You extract financial transactions from a user's uploaded bank or bookkeeping spreadsheet for the KabulWallet app.
Use ONLY rows that are present in the provided table; never invent, estimate, or duplicate transactions that are not shown.
Skip header rows, totals, subtotals, running balances, and blank rows.
For every real transaction, output one item:
- kind: "expense" for money spent or paid out, "asset" for an owned balance/account, "receivable" for money owed TO the user, "payable" for money the user owes. When unsure, use "expense".
- amount: a positive number. Strip currency symbols, thousands separators, and signs; use the absolute value.
- currency: "AFN" if the row clearly indicates Afghanis (AFN, ؋, افغانی); otherwise "USD".
- date: the transaction date formatted as YYYY-MM-DD. If the row has no clear date, use an empty string.
- name: a short human-readable description from the row (merchant, person, or memo).
- category: a concise category such as Rent, Groceries, Fuel, Utilities, Transportation, Healthcare, Dining Out, Internet & Phone, School Fees, Salary, or Other.
- notes: brief optional context, otherwise an empty string.
- confidence: a number from 0 to 1 reflecting how confident you are in this item.
Return at most 500 items. If the table contains no recognizable transactions, return an empty items array.`;

/// Flattens parsed spreadsheet/CSV rows into a compact tab-separated table for the
/// model. Caps rows and total characters so the prompt stays bounded.
export function kabulWalletRowsToTableText(
  rows: ReadonlyArray<ReadonlyArray<unknown>>,
  maxRows = 400,
  maxChars = 40_000,
): string {
  const lines: string[] = [];
  for (const row of rows.slice(0, maxRows)) {
    const cells = row.map((cell) => {
      if (cell == null) return "";
      if (cell instanceof Date) return cell.toISOString().slice(0, 10);
      return String(cell).replace(/[\t\r\n]+/g, " ").trim();
    });
    if (cells.every((c) => c === "")) continue;
    lines.push(cells.join("\t"));
    if (lines.join("\n").length >= maxChars) break;
  }
  return lines.join("\n").slice(0, maxChars);
}

export type KabulWalletImportItem = z.infer<typeof kabulWalletImportItemSchema>;
export type KabulWalletImportResponse = z.infer<typeof kabulWalletImportResponseSchema>;

// --- AI receipt total extraction (POST /api/ai/receipt) --------------------
// Fallback for the iOS receipt scanner: the app does on-device OCR, and when its
// heuristic can't confidently find the paid total it sends the recognized TEXT
// (never the image) here for the model to pull out the grand total.

export const kabulWalletReceiptRequestSchema = z
  .object({
    text: z.string().min(1).max(20_000),
  })
  .strict();

export const kabulWalletReceiptResponseSchema = z
  .object({
    amount: finiteNumber.positive().nullable(),
    currency: z.enum(["USD", "AFN"]).nullable(),
    merchant: z.string().max(120).nullable(),
    date: z.string().max(32).nullable(),
    category: z.string().max(60).nullable(),
  })
  .strict();

export const kabulWalletReceiptSystemPrompt = `You read raw OCR text from a single shopping or payment receipt and extract what the customer actually paid.
Return the FINAL grand total (the amount paid, after tax and discounts) — never a subtotal, an individual item price, a tax line, change given, or a phone/invoice number. Common total labels include: Total, Grand Total, Amount Due, Balance Due, Total Due, مجموع, جمع, ټول, قابل پرداخت.
- amount: the paid total as a positive number with any currency symbols and thousands separators removed; null only if you truly cannot find it.
- currency: "AFN" if the receipt indicates Afghanis (AFN, ؋, افغانی), otherwise "USD"; null if genuinely unclear.
- merchant: the store or business name if present, otherwise null.
- date: the receipt date formatted as YYYY-MM-DD, otherwise null.
- category: your best single guess from exactly this list — Groceries, Fuel, Dining Out, Healthcare, Transportation, Utilities, Clothing, Rent, Internet & Phone, School Fees, Other — otherwise null.
Use only what appears in the text; never invent values.`;

export type KabulWalletReceiptResponse = z.infer<typeof kabulWalletReceiptResponseSchema>;
