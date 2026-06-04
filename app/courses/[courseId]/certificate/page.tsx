import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { createCertificateIfEligible, getCourseCertificateStatus } from "@/lib/actions/certificate-actions";
import { CertificateView } from "@/components/CertificateView";

export default async function CourseCertificatePage({
  params,
  searchParams
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ print?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { courseId: rawCourseId } = await params;
  const { print } = await searchParams;
  const courseId = decodeURIComponent(rawCourseId);

  const status = await getCourseCertificateStatus(courseId, session.user.id);
  if (!status) return notFound();

  // Issue/refresh the certificate record when eligible
  const issued = status.eligible
    ? await createCertificateIfEligible(courseId, session.user.id)
    : null;

  const userName = session.user.name ?? session.user.email ?? "Learner";

  return (
    <CertificateView
      courseId={courseId}
      courseTitleEn={status.courseTitleEn}
      courseTitlePs={status.courseTitlePs}
      eligible={status.eligible}
      completedQuizzes={status.completedQuizzes}
      requiredQuizzes={status.requiredQuizzes}
      grade={issued?.grade ?? status.grade}
      issuedAt={issued?.issuedAt ?? status.issuedAt}
      verificationCode={issued?.verificationCode ?? status.verificationCode}
      certificateUuid={issued?.certificateUuid ?? status.certificateUuid}
      studentName={userName}
      autoPrint={print === "1"}
    />
  );
}
