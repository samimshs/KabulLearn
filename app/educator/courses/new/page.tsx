import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CourseCreateForm } from "@/components/educator/CourseCreateForm";

export default async function NewEducatorCoursePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=%2Feducator%2Fcourses%2Fnew");
  }
  if (session.user.role === UserRole.ADMIN) {
    redirect("/admin");
  }
  if (session.user.role !== UserRole.EDUCATOR) {
    redirect("/dashboard");
  }

  return <CourseCreateForm />;
}
