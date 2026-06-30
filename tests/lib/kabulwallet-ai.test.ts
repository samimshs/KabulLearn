import { describe, expect, it } from "vitest";
import {
  hasValidKabulWalletToken,
  kabulWalletInsightRequestSchema,
  kabulWalletLanguageDirective,
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
