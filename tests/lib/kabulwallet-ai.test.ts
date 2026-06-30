import { describe, expect, it } from "vitest";
import {
  hasValidKabulWalletToken,
  kabulWalletImportItemSchema,
  kabulWalletImportResponseSchema,
  kabulWalletInsightRequestSchema,
  kabulWalletLanguageDirective,
  kabulWalletRowsToTableText,
  kabulWalletSystemPrompt,
} from "@/lib/kabulwallet-ai";

const validRequest = {
  language: "English",
  financialSummary: {
    totalNetWorthUSD: 5_200,
    totalAssetsUSD: 6_000,
    banksTotalUSD: 3_000,
    cashTotalUSD: 1_500,
    investmentsTotalUSD: 1_500,
    receivablesUSD: 0,
    payablesUSD: 800,
    monthlyExpensesUSD: 900,
    previousMonthExpensesUSD: 700,
    topExpenseCategories: [],
    budgetStatus: [],
    zakatDueUSD: 130,
    zakatPaidUSD: 0,
    upcomingLedgerDueItems: [],
    overdueLedgerItems: [],
    recentLargeExpenses: [],
    preferredCurrency: "USD",
    exchangeRate: 70,
    availableMonthsOfHistory: 3,
  },
};

describe("KabulWallet AI endpoint helpers", () => {
  it("accepts the summarized iOS request shape", () => {
    expect(kabulWalletInsightRequestSchema.safeParse(validRequest).success).toBe(true);
  });

  it("accepts an omitted previousMonthExpensesUSD (Swift sends no key for nil)", () => {
    const summary: Record<string, unknown> = { ...validRequest.financialSummary };
    delete summary.previousMonthExpensesUSD;
    expect(kabulWalletInsightRequestSchema.safeParse({ ...validRequest, financialSummary: summary }).success).toBe(true);
  });

  it("explains ledger direction so the model never reverses who owes whom", () => {
    expect(kabulWalletSystemPrompt).toContain("owed_to_me");
    expect(kabulWalletSystemPrompt).toContain("i_owe");
    expect(kabulWalletSystemPrompt).toContain("owes you");
    expect(kabulWalletSystemPrompt).toContain("you owe");
  });

  it("rejects private or unexpected financial fields", () => {
    const requestWithNotes = {
      ...validRequest,
      financialSummary: { ...validRequest.financialSummary, notes: "private" },
    };
    expect(kabulWalletInsightRequestSchema.safeParse(requestWithNotes).success).toBe(false);
  });

  it("requires the exact configured bearer token", () => {
    expect(hasValidKabulWalletToken(new Headers({ authorization: "Bearer correct-token" }), "correct-token")).toBe(true);
    expect(hasValidKabulWalletToken(new Headers({ authorization: "Bearer wrong-token" }), "correct-token")).toBe(false);
    expect(hasValidKabulWalletToken(new Headers(), "correct-token")).toBe(false);
    expect(hasValidKabulWalletToken(new Headers({ authorization: "Bearer correct-token" }), undefined)).toBe(false);
  });

  it("adds a strict language instruction for Dari and Pashto", () => {
    expect(kabulWalletLanguageDirective("English")).toBe("");
    expect(kabulWalletLanguageDirective("Dari (Afghan Persian)")).toContain("Dari (Afghan Persian)");
    expect(kabulWalletLanguageDirective("Pashto")).toContain("Pashto only");
  });
});

describe("KabulWallet AI import helpers", () => {
  const validItem = {
    kind: "expense",
    date: "2026-06-01",
    name: "Kabul Market",
    category: "Groceries",
    amount: 1200,
    currency: "AFN",
    notes: "",
    confidence: 0.8,
  };

  it("accepts a valid import item and response shape", () => {
    expect(kabulWalletImportItemSchema.safeParse(validItem).success).toBe(true);
    expect(kabulWalletImportResponseSchema.safeParse({ items: [validItem] }).success).toBe(true);
  });

  it("rejects unknown kinds, currencies, non-positive amounts, and extra fields", () => {
    expect(kabulWalletImportItemSchema.safeParse({ ...validItem, kind: "income" }).success).toBe(false);
    expect(kabulWalletImportItemSchema.safeParse({ ...validItem, currency: "EUR" }).success).toBe(false);
    expect(kabulWalletImportItemSchema.safeParse({ ...validItem, amount: 0 }).success).toBe(false);
    expect(kabulWalletImportItemSchema.safeParse({ ...validItem, account: "secret" }).success).toBe(false);
  });

  it("flattens rows to a tab table, formats dates, and skips blank rows", () => {
    const text = kabulWalletRowsToTableText([
      ["Date", "Description", "Amount"],
      [new Date(Date.UTC(2026, 5, 3)), "Salary", 800],
      ["", "", ""],
    ]);
    const lines = text.split("\n");
    expect(lines).toHaveLength(2); // blank row dropped
    expect(lines[0]).toBe("Date\tDescription\tAmount");
    expect(lines[1]).toBe("2026-06-03\tSalary\t800");
  });

  it("caps the number of rows", () => {
    const rows = Array.from({ length: 1000 }, (_, i) => [`row${i}`, i]);
    const text = kabulWalletRowsToTableText(rows, 50);
    expect(text.split("\n")).toHaveLength(50);
  });
});
