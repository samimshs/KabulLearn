import { redirect } from "next/navigation";

// Redirect /download to the certificate page — browser prints to PDF from there
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  redirect(`/courses/${encodeURIComponent(courseId)}/certificate?print=1`);
}
