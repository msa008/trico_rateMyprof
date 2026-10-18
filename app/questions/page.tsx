import { DemoBanner } from "@/components/demo-banner";
import { QuestionBank } from "@/components/question-bank";
import { getMyActivity, getQuestions } from "@/lib/data";

export default async function QuestionsPage() {
  const [data, activity] = await Promise.all([getQuestions(), getMyActivity()]);
  return <><DemoBanner show={data.demo}/><QuestionBank questions={data.questions} myQuestions={activity.questions} myAnswers={activity.answers} hasSession={activity.hasSession}/></>;
}
