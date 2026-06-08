import { redirect } from "next/navigation";
import PDFDocument from "pdfkit";
import { auth } from "@/auth";
import { createCertificateIfEligible, getCourseCertificateStatus } from "@/lib/actions/certificate-actions";

export const runtime = "nodejs";

const BRAND = "#0057FF";
const GOLD = "#C9A84C";
const INK = "#0A0914";
const MUTED = "#6B6987";
const LIGHT = "#9896B8";

function buildPdf(opts: {
  studentName: string;
  courseTitle: string;
  grade: number;
  dateStr: string;
  verificationId: string;
  verificationUrl: string;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // A4 landscape
    const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 0 });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = doc.page.width;  // 842
    const H = doc.page.height; // 595

    // Outer background
    doc.rect(0, 0, W, H).fill("#FFFFFF");

    // Top & bottom brand stripes
    doc.rect(0, 0, W, 10).fill(BRAND);
    doc.rect(0, H - 10, W, 10).fill(BRAND);

    // Gold inner border
    const m = 34;
    doc.lineWidth(2).strokeColor(GOLD).rect(m, m, W - m * 2, H - m * 2).stroke();
    doc.lineWidth(0.8).strokeColor(GOLD).rect(m + 6, m + 6, W - (m + 6) * 2, H - (m + 6) * 2).stroke();

    // Header brand
    doc.fillColor(BRAND).font("Helvetica-Bold").fontSize(13)
      .text("KABULLEARN", 0, 70, { align: "center", characterSpacing: 4 });
    doc.fillColor(LIGHT).font("Helvetica").fontSize(9)
      .text("LEARN WITHOUT LIMITS", 0, 90, { align: "center", characterSpacing: 3 });

    // Title
    doc.fillColor(LIGHT).font("Helvetica-Bold").fontSize(12)
      .text("CERTIFICATE OF COMPLETION", 0, 132, { align: "center", characterSpacing: 3 });
    // underline accents
    doc.moveTo(W / 2 - 150, 156).lineTo(W / 2 - 30, 156).lineWidth(1).strokeColor(GOLD).stroke();
    doc.moveTo(W / 2 + 30, 156).lineTo(W / 2 + 150, 156).stroke();

    // Body
    doc.fillColor(MUTED).font("Helvetica").fontSize(13)
      .text("This certifies that", 0, 178, { align: "center" });

    doc.fillColor(INK).font("Helvetica-Bold").fontSize(40)
      .text(opts.studentName, 0, 200, { align: "center" });

    doc.fillColor(MUTED).font("Helvetica").fontSize(13)
      .text("has successfully completed", 0, 262, { align: "center" });

    doc.fillColor(INK).font("Helvetica-Bold").fontSize(24)
      .text(opts.courseTitle, 80, 286, { align: "center", width: W - 160 });

    // Grade badge
    const badgeY = 360;
    doc.fillColor("#966000").font("Helvetica-Bold").fontSize(11)
      .text(`FINAL GRADE   ${opts.grade}%`, 0, badgeY, { align: "center", characterSpacing: 1 });

    // Issued date
    doc.fillColor(MUTED).font("Helvetica").fontSize(12)
      .text(`Issued on ${opts.dateStr}`, 0, badgeY + 28, { align: "center" });

    // Footer — verification
    const footY = H - 96;
    doc.moveTo(m + 40, footY).lineTo(W - m - 40, footY).lineWidth(0.6).strokeColor("#E4E3F2").stroke();

    doc.fillColor(LIGHT).font("Helvetica-Bold").fontSize(9)
      .text("VERIFIED CREDENTIAL", 0, footY + 12, { align: "center", characterSpacing: 2 });
    doc.fillColor(MUTED).font("Helvetica").fontSize(9)
      .text(`Code: ${opts.verificationId}`, 0, footY + 28, { align: "center" });
    if (opts.verificationUrl) {
      doc.fillColor(LIGHT).font("Helvetica").fontSize(8)
        .text(opts.verificationUrl, 0, footY + 42, { align: "center" });
    }

    doc.end();
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const session = await auth();
  const { courseId: rawCourseId } = await params;
  const courseId = decodeURIComponent(rawCourseId);

  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/courses/${courseId}/certificate`)}`);
  }

  const status = await getCourseCertificateStatus(courseId, session.user.id);
  if (!status) {
    return new Response("Course not found", { status: 404 });
  }
  if (!status.eligible) {
    redirect(`/courses/${encodeURIComponent(courseId)}/certificate`);
  }

  // Ensure the certificate record exists (issues it if eligible)
  const issued = await createCertificateIfEligible(courseId, session.user.id);

  const verificationId = issued?.certificateUuid ?? status.certificateUuid ?? issued?.verificationCode ?? status.verificationCode ?? "";
  const origin = new URL(request.url).origin;
  const verificationUrl = verificationId ? `${origin}/verify/${verificationId}` : "";
  const dateStr = (issued?.issuedAt ?? status.issuedAt ?? new Date())
    .toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const pdf = await buildPdf({
    studentName: session.user.name ?? session.user.email ?? "Learner",
    courseTitle: status.courseTitleEn,
    grade: issued?.grade ?? status.grade,
    dateStr,
    verificationId,
    verificationUrl
  });

  const safeTitle = status.courseTitleEn.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="kabullearn-certificate-${safeTitle}.pdf"`,
      "Cache-Control": "no-store"
    }
  });
}
