import { notFound, redirect } from "next/navigation";
import { getQuestion } from "@/lib/data";

export default async function QuestionDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getQuestion(id);
  if (!data) notFound();
  const question = data.question;
  if (question.review_id && question.course_slug) redirect(`/courses/${question.course_slug}#question-${question.id}`);
  redirect("/questions");
}
