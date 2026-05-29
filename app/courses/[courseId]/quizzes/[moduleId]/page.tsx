import { QuizView } from "@/components/QuizView";

type QuizPageProps = {
  params: Promise<{
    courseId: string;
    moduleId: string;
  }>;
};

export default async function QuizPage({ params }: QuizPageProps) {
  const { courseId, moduleId } = await params;
  return <QuizView courseId={courseId} moduleId={moduleId} />;
}
