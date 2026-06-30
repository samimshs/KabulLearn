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
    previousMonthExpensesUSD: finiteNumber.nullable(),
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

export const kabulWalletSystemPrompt = `You are a cautious personal finance insight assistant for KabulWallet. Analyze only the provided financial summary. Do not invent missing facts. Do not give investment, tax, legal, or religious rulings as authoritative advice. For Zakat, explain calculations based only on the app's configured assumptions and remind users to verify with a qualified scholar if needed. Keep insights practical, concise, and action-oriented.`;

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
