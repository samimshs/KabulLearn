"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useLanguage } from "@/components/LanguageProvider";

type CertificateViewProps = {
  courseId: string;
  courseTitleEn: string;
  courseTitlePs: string;
  eligible: boolean;
  completedQuizzes: number;
  requiredQuizzes: number;
  grade: number;
  issuedAt?: Date | string;
  verificationCode?: string;
  certificateUuid?: string;
  studentName: string;
  autoPrint?: boolean;
};

const issuedDateStr = (d?: Date | string) => {
  if (!d) return new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
};

export function CertificateView({
  courseId,
  courseTitleEn,
  eligible,
  completedQuizzes,
  requiredQuizzes,
  grade,
  issuedAt,
  verificationCode,
  certificateUuid,
  studentName,
  autoPrint = false
}: CertificateViewProps) {
  const { t } = useLanguage();
  const [qrUrl, setQrUrl] = useState("");

  const verificationId = certificateUuid ?? verificationCode;
  const verificationUrl = verificationId
    ? `https://kabullearn.com/verify/${encodeURIComponent(verificationId)}`
    : "";

  useEffect(() => {
    if (autoPrint && eligible) {
      const t = setTimeout(() => window.print(), 600);
      return () => clearTimeout(t);
    }
  }, [autoPrint, eligible]);

  // QR generated locally — no third-party service, works offline and in print
  useEffect(() => {
    if (!verificationUrl || !eligible) return;
    QRCode.toDataURL(verificationUrl, { width: 264, margin: 1, errorCorrectionLevel: "M" })
      .then(setQrUrl)
      .catch(() => setQrUrl(""));
  }, [verificationUrl, eligible]);

  if (!eligible) {
    return (
      <main className="pr-page grid max-w-3xl gap-8">
        <section className="pr-panel p-8">
          <p className="pr-eyebrow">{t.certificateLabel}</p>
          <h1 className="pr-h1 mt-4">{t.notQuiteThere}</h1>
          <p className="pr-copy mt-5">
            {t.completeAllToEarn}{" "}
            {t.youveCompletedXofY} <strong>{completedQuizzes}</strong> / <strong>{requiredQuizzes}</strong>.
          </p>

          {/* Progress toward certificate */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-[13px] font-[700] mb-2 text-[var(--muted)]">
              <span>{t.courseProgressLabel}</span>
              <span className="text-[var(--brand)]">{completedQuizzes}/{requiredQuizzes}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-[var(--surface)]">
              <div
                className="h-2.5 rounded-full bg-[var(--brand)] transition-all"
                style={{ width: `${requiredQuizzes > 0 ? Math.round((completedQuizzes / requiredQuizzes) * 100) : 0}%` }}
              />
            </div>
          </div>

          <Link href={`/courses/${courseId}`} className="pr-btn-primary mt-8 inline-flex">
            {t.returnToCourse}
          </Link>
        </section>
      </main>
    );
  }

  const dateStr = issuedDateStr(issuedAt);
  const issuedDate = issuedAt ? (typeof issuedAt === "string" ? new Date(issuedAt) : issuedAt) : new Date();
  const linkedInUrl = (() => {
    const params = new URLSearchParams({
      startTask: "CERTIFICATION_NAME",
      name: courseTitleEn,
      issueYear: String(issuedDate.getFullYear()),
      issueMonth: String(issuedDate.getMonth() + 1)
    });
    if (verificationUrl) params.set("certUrl", verificationUrl);
    if (verificationId) params.set("certId", verificationId);
    return `https://www.linkedin.com/profile/add?${params.toString()}`;
  })();

  return (
    <>
      {/* Print-only styles */}
      <style>{`
        @media print {
          html, body { background: white !important; }
          .no-print { display: none !important; }
          .cert-page { padding: 0 !important; }
          .cert-card {
            box-shadow: none !important;
            border: none !important;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <main className="cert-page pr-page grid gap-8">
        {/* Action bar — hidden when printing */}
        <div className="no-print flex flex-wrap items-center justify-between gap-4">
          <Link href={`/courses/${courseId}`} className="text-sm font-[800] text-[var(--brand)] hover:underline">
            ← {t.backToCourse}
          </Link>
          <div className="flex flex-wrap gap-3">
            <a
              href={`/courses/${encodeURIComponent(courseId)}/certificate/download`}
              className="pr-btn-primary"
            >
              <svg viewBox="0 0 20 20" className="me-2 h-4 w-4" fill="none" aria-hidden="true">
                <path d="M10 3v9m0 0 3.5-3.5M10 12 6.5 8.5M4 15.5h12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {t.downloadPdf}
            </a>
            <a
              href={linkedInUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="pr-btn-ghost inline-flex items-center gap-2"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="currentColor" aria-hidden="true">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              {t.shareOnLinkedIn}
            </a>
          </div>
        </div>

        {/* Certificate card */}
        <div className="cert-card relative overflow-hidden rounded-[20px] border-2 border-[#C9A84C] bg-white shadow-[0_24px_80px_rgba(10,9,20,0.14)]">
          {/* Decorative top stripe */}
          <div className="h-2 bg-gradient-to-r from-[#0057FF] via-[#3379FF] to-[#0057FF]" />

          <div className="px-10 py-12 text-center lg:px-16 lg:py-16">
            {/* Header */}
            <div className="flex justify-center">
              <img src="/poharana-icon-v3.svg" alt="KabulLearn" className="h-14 w-14" />
            </div>
            <p className="mt-4 text-[11px] font-[800] uppercase tracking-[4px] text-[#0057FF]">
              KabulLearn · Learn Without Limits
            </p>

            {/* Title */}
            <div className="mt-8 border-y border-[#E4E3F2] py-6">
              <h1 className="text-[13px] font-[700] uppercase tracking-[3px] text-[#9896B8]">
                Certificate of Completion
              </h1>
            </div>

            {/* Body */}
            <p className="mt-8 text-[14px] font-[500] text-[#6B6987]">This certifies that</p>
            <p className="mt-3 text-[36px] font-[800] leading-tight tracking-[-0.8px] text-[#0A0914] lg:text-[44px]">
              {studentName}
            </p>
            <p className="mt-4 text-[14px] font-[500] text-[#6B6987]">has successfully completed</p>
            <p className="mt-3 text-[22px] font-[800] leading-snug tracking-[-0.4px] text-[#0A0914] lg:text-[28px]">
              {courseTitleEn}
            </p>

            {/* Grade badge */}
            <div className="mt-8 flex justify-center">
              <div className="rounded-full border-2 border-[#C9A84C] bg-[#FFFBF0] px-8 py-3">
                <p className="text-[11px] font-[800] uppercase tracking-[2px] text-[#966000]">Final grade</p>
                <p className="mt-1 text-[32px] font-[800] leading-none text-[#966000]">{grade}%</p>
              </div>
            </div>

            {/* Issued date */}
            <p className="mt-8 text-[14px] font-[600] text-[#6B6987]">
              Issued on <span className="font-[800] text-[#0A0914]">{dateStr}</span>
            </p>

            {/* Divider */}
            <div className="mt-10 border-t border-[#E4E3F2] pt-8">
              <div className="flex items-center justify-center gap-3">
                <div className="h-px flex-1 bg-[#E4E3F2]" />
                <p className="text-[11px] font-[700] uppercase tracking-[2px] text-[#9896B8]">Verified credential</p>
                <div className="h-px flex-1 bg-[#E4E3F2]" />
              </div>
              {verificationId ? (
                <div className="mt-3 grid gap-1">
                  {qrUrl ? (
                    <img src={qrUrl} alt="Verified credential" className="mx-auto h-[132px] w-[132px] rounded-lg border border-[#E4E3F2] bg-white p-2" />
                  ) : null}
                  <p className="font-mono text-[12px] text-[#9896B8]">
                    Code: <span className="font-[700] text-[#6B6987]">{verificationId}</span>
                  </p>
                  <Link href={`/verify/${encodeURIComponent(verificationId)}`} className="no-print text-[12px] font-[800] text-[#0057FF]">
                    Verify online
                  </Link>
                </div>
              ) : null}
            </div>
          </div>

          {/* Decorative bottom stripe */}
          <div className="h-2 bg-gradient-to-r from-[#0057FF] via-[#3379FF] to-[#0057FF]" />
        </div>

        {/* Congratulations note — hidden when printing */}
        <div className="no-print grid gap-4 rounded-[var(--radius-xl)] border border-[rgba(24,130,92,0.2)] bg-[var(--success-50)] p-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="pr-eyebrow text-[var(--success)]">{t.congratulationsExcl}</p>
            <p className="mt-2 text-[16px] font-[700] text-[#0A0914]">
              {t.youFinishedWithGrade} {grade}%.
            </p>
            <p className="mt-1 text-sm font-[500] text-[var(--muted)]">
              {t.downloadPdfHint}
            </p>
          </div>
          <Link href="/" className="pr-btn-ghost no-print shrink-0">
            {t.browseAllCourses}
          </Link>
        </div>
      </main>
    </>
  );
}
