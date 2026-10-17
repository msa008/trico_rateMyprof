import Link from "next/link";
import{MessageCircle}from "lucide-react";
import type{Review}from "@/lib/types";
import{formatDate}from "@/lib/utils";
import{Button}from "./ui/button";
import{Card}from "./ui/card";
import{EngagementButtons}from "./engagement-buttons";
import{AnswerForm}from "./answer-form";

export function ReviewCard({review}:{review:Review}){const showGrade=review.grade_status&&review.grade_status!=="Prefer not to say";return <Card className="overflow-hidden border-[#d8dde6] bg-white p-0 shadow-none"><div className="p-5 sm:p-7">
  <div className="flex flex-wrap items-start justify-between gap-3"><div className="flex flex-wrap items-center gap-2"><Link href={`/courses/${review.course_slug}`} className="font-bold hover:text-[#a91d35] hover:underline">{review.course_code} · {review.semester} {review.year}</Link><span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${review.would_take_again?"border-emerald-300 bg-emerald-50 text-emerald-800":"border-rose-200 bg-rose-50 text-rose-700"}`}>{review.would_take_again?"✓ Would take again":"Would not take again"}</span>{showGrade&&<span className="rounded-full bg-[#f3f4f6] px-2.5 py-1 text-xs font-semibold">Grade: {review.grade_status}</span>}</div><span className="text-sm text-[#566174]">{formatDate(review.created_at)}</span></div>
  <div className="mt-4 flex flex-wrap gap-2"><MetricChip label="Teaching" value={review.teaching_quality}/><MetricChip label="Workload" value={review.workload}/><MetricChip label="Grading" value={review.grading_difficulty}/>{review.descriptors?.map(descriptor=><span key={descriptor} className="rounded-lg bg-[#f3f4f6] px-3 py-1.5 text-xs font-semibold">{descriptor}</span>)}</div>
  <p className="mt-5 text-[17px] leading-7 text-[#222936]">{review.body}</p>
  {review.advice&&<div className="mt-5 rounded-xl border-l-4 border-[#a91d35] bg-[#fbf0f2] p-4"><p className="text-sm font-bold text-[#a91d35]">Advice for future students</p><p className="mt-1 text-sm leading-6 text-[#323846]">{review.advice}</p></div>}
  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#d8dde6] pt-4"><EngagementButtons type="review" id={review.id} count={review.helpful_count}/><Button asChild variant="ghost" size="sm" className="font-bold !text-[#a91d35] hover:!bg-[#fbf0f2]"><Link href={`/questions/ask?review=${review.id}`}><MessageCircle className="size-4"/>Ask a question</Link></Button></div>
  <p className="mt-3 text-xs font-medium text-[#667085]">Posted by an anonymous student</p>
  {review.questions&&review.questions.length>0&&<div className="mt-5 grid gap-3">{review.questions.map(question=><div key={question.id} className="rounded-xl bg-[#f3f4f6] p-4 sm:p-5"><div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#667085]"><span>Question from an anonymous student</span><span>·</span><span>{formatDate(question.created_at)}</span></div><Link href={`/questions/${question.id}`} className="mt-2 block text-base font-bold hover:text-[#a91d35]">{question.title}</Link>{question.body&&<p className="mt-1 text-sm text-[#566174]">{question.body}</p>}{question.answers?.map(answer=><div key={answer.id} className="mt-3 rounded-lg border-l-3 border-[#a91d35] bg-white px-4 py-3"><p className="text-xs font-semibold text-[#667085]">Anonymous answer</p><p className="mt-1 text-sm">{answer.body}</p></div>)}<details className="mt-3"><summary className="cursor-pointer text-sm font-bold text-[#a91d35]">Answer this question</summary><div className="mt-3"><AnswerForm questionId={question.id}/></div></details></div>)}</div>}
</div></Card>}

function MetricChip({label,value}:{label:string;value:number}){return <span className="rounded-lg bg-[#f3f4f6] px-3 py-1.5 text-xs font-semibold">{label} {value.toFixed(1)}/5</span>}
