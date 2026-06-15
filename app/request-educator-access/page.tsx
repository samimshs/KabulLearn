import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { EducatorRequestForm } from "@/components/EducatorRequestForm";
import { getServerLocale } from "@/lib/server-locale";
import { dictionaries } from "@/lib/i18n";

export const metadata = { title: "Request Educator Access — KabulLearn" };

export default async function RequestEducatorAccessPage() {
  const session = await auth();
  const t = dictionaries[await getServerLocale()];

  // Not logged in → send to register first
  if (!session?.user?.id) {
    redirect("/register?callbackUrl=%2Frequest-educator-access");
  }

  // Already an educator or admin → redirect to their portal
  if (session.user.role === UserRole.EDUCATOR) redirect("/educator");
  if (session.user.role === UserRole.ADMIN) redirect("/admin");

  // Check if they already have a request
  let existing: { status: string; adminNote: string | null; createdAt: Date } | null = null;
  try {
    existing = await db.educatorRequest.findUnique({
      where: { userId: session.user.id },
      select: { status: true, adminNote: true, createdAt: true }
    });
  } catch { /* DB unavailable */ }

  return (
    <main className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <div className="mb-8">
        <p className="pr-eyebrow">{t.becomeEducator}</p>
        <h1 className="pr-h1 mt-2">{t.requestEducatorAccess}</h1>
        <p className="pr-copy mt-3">
          {t.requestEducatorIntro}
        </p>
      </div>

      {/* Status banner if request already exists */}
      {existing?.status === "PENDING" && (
        <div className="mb-6 rounded-[var(--radius-lg)] border border-[rgba(150,96,0,0.2)] bg-[var(--warning-50)] px-5 py-4">
          <p className="text-[14px] font-[800] text-[var(--warning)]">{t.requestPendingReview}</p>
          <p className="mt-1 text-[13px] font-[600] text-[var(--warning)]">
            {t.requestSubmittedOn} {new Date(existing.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}. {t.requestPendingHint2}
          </p>
        </div>
      )}

      {existing?.status === "REJECTED" && (
        <div className="mb-6 rounded-[var(--radius-lg)] border border-[rgba(220,38,38,0.18)] bg-red-50 px-5 py-4">
          <p className="text-[14px] font-[800] text-red-700">{t.previousRequestRejected}</p>
          {existing.adminNote && (
            <p className="mt-1 text-[13px] font-[600] text-red-600">{t.adminNoteLabel}: {existing.adminNote}</p>
          )}
          <p className="mt-2 text-[13px] font-[600] text-red-700">{t.resubmitHint}</p>
        </div>
      )}

      {/* How it works */}
      <div className="mb-6 rounded-[var(--radius-lg)] border border-[rgba(0,87,255,0.1)] bg-[var(--brand-50)] px-5 py-4">
        <p className="text-[12px] font-[800] uppercase tracking-[1px] text-[var(--brand)]">{t.howItWorks}</p>
        <ol className="mt-3 grid gap-2">
          {[
            t.educatorStep1,
            t.educatorStep2,
            t.educatorStep3,
            t.educatorStep4,
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-[13px] font-[600] text-[var(--ink-2)]">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--card)] text-[10px] font-[900] text-[var(--brand)] shadow-sm ring-1 ring-[rgba(0,87,255,0.15)]">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      <EducatorRequestForm existingMessage={existing?.status === "APPROVED" ? null : undefined} />
    </main>
  );
}
