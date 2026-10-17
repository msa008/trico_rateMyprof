import Link from "next/link";
import { MessageCircle } from "lucide-react";
import type { Review } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { EngagementButtons } from "./engagement-buttons";
import { AnswerForm } from "./answer-form";

export function ReviewCard({ review }: { review: Review }) {
  const showGrade = review.grade_status && review.grade_status !== "Prefer not to say";

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row">
        <div className="flex gap-3 sm:w-32 sm:shrink-0 sm:flex-col">
          <Score label="Teaching" value={review.teaching_quality} />
          <Score label="Workload" value={review.workload} />
          <Score label="Grading" value={review.grading_difficulty} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{review.course_code}</Badge>
            <span className="text-xs font-medium text-[#667085]">{review.semester} {review.year}</span>
            {showGrade && <Badge className="bg-[#edf1ff] text-[#2447b6]">Grade: {review.grade_status}</Badge>}
            <span className="text-xs text-[#98a2b3]">·</span>
            <span className="text-xs font-medium text-[#667085]">{formatDate(review.created_at)}</span>
          </div>
          {review.descriptors && review.descriptors.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {review.descriptors.map((descriptor) => (
                <span key={descriptor} className="rounded-full border border-[#dce3fb] bg-[#f7f9ff] px-2.5 py-1 text-xs font-semibold text-[#3159d7]">
                  {descriptor}
                </span>
              ))}
            </div>
          )}
          <p className="mt-4 leading-relaxed text-[#344054]">{review.body}</p>
          {review.advice && (
            <div className="mt-4 rounded-xl bg-[#f7f8fb] p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-[#667085]">Advice for future students</p>
              <p className="mt-1 text-sm text-[#344054]">{review.advice}</p>
            </div>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-[#eef0f4] pt-4">
            <EngagementButtons type="review" id={review.id} count={review.helpful_count} />
            <Button asChild variant="ghost" size="sm">
              <Link href={`/questions/ask?review=${review.id}`}><MessageCircle className="size-4" />Ask about this review</Link>
            </Button>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-[#667085]">
            <span className="size-2 rounded-full bg-[#3159d7]" />
            <span>Posted as <strong>@{review.alias}</strong></span>
            <span>·</span>
            <span>{review.would_take_again ? "Would take again" : "Would not take again"}</span>
          </div>
          {review.questions && review.questions.length > 0 && (
            <div className="mt-5 rounded-2xl border border-[#dce3fb] bg-[#fafbff] p-4">
              <p className="text-xs font-bold uppercase tracking-[.14em] text-[#3159d7]">Questions about this review</p>
              <div className="mt-3 grid gap-4">
                {review.questions.map((question) => (
                  <div key={question.id} className="rounded-xl bg-white p-4 ring-1 ring-[#e5e8ef]">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#667085]">
                      <strong>@{question.alias}</strong><span>·</span><span>{formatDate(question.created_at)}</span>
                    </div>
                    <Link href={`/questions/${question.id}`} className="mt-2 block font-semibold hover:text-[#3159d7]">{question.title}</Link>
                    <p className="mt-1 text-sm leading-relaxed text-[#475467]">{question.body}</p>
                    {question.answers?.map((answer) => (
                      <div key={answer.id} className="mt-3 border-l-2 border-[#cfd9ff] pl-3 text-sm">
                        <p className="text-xs font-semibold text-[#667085]">@{answer.alias}</p>
                        <p className="mt-1 text-[#344054]">{answer.body}</p>
                      </div>
                    ))}
                    <details className="mt-3">
                      <summary className="cursor-pointer text-sm font-semibold text-[#3159d7]">Answer this question</summary>
                      <div className="mt-3"><AnswerForm questionId={question.id} /></div>
                    </details>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function Score({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-22 rounded-xl bg-[#f2f4f7] px-3 py-2 text-center sm:px-2">
      <strong className="block text-xl leading-none">{value.toFixed(1)}</strong>
      <span className="mt-1 block text-[11px] font-semibold uppercase tracking-wide text-[#667085]">{label}</span>
    </div>
  );
}
