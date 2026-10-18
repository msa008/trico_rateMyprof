"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Answer, Question } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { readableSubjectName } from "@/components/department-directory";

type Tab = "unanswered" | "recent" | "popular" | "activity";

export function QuestionBank({ questions, myQuestions, myAnswers, hasSession }: { questions: Question[]; myQuestions: Question[]; myAnswers: Answer[]; hasSession: boolean }) {
  const [tab, setTab] = useState<Tab>("unanswered");
  const [query, setQuery] = useState("");
  const [college, setCollege] = useState("");
  const [department, setDepartment] = useState("");
  const [page, setPage] = useState(1);
  const term = query.trim().toLowerCase();
  const colleges = [...new Set(questions.map((item) => item.college_name).filter(Boolean))] as string[];
  const departments = [...new Set(questions.map((item) => item.department_code).filter(Boolean))] as string[];
  const visible = useMemo(() => {
    const filtered = questions.filter((item) => {
      const matchesText = !term || `${item.title} ${item.body} ${item.course_code} ${item.professor_name}`.toLowerCase().includes(term);
      return matchesText && (!college || item.college_name === college) && (!department || item.department_code === department);
    });
    if (tab === "unanswered") return filtered.filter((item) => item.answer_count === 0);
    if (tab === "popular") return [...filtered].sort((a, b) => (b.helpful_count + b.answer_count) - (a.helpful_count + a.answer_count));
    return [...filtered].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  }, [college, department, questions, tab, term]);
  const pageSize = 20;
  const totalPages = Math.ceil(visible.length / pageSize);
  const pageItems = visible.slice((page - 1) * pageSize, page * pageSize);
  const questionById = new Map(questions.map((item) => [item.id, item]));

  return <div className="container py-10 sm:py-14">
    <header className="max-w-4xl"><h1 className="display text-5xl font-semibold leading-none sm:text-6xl">Question bank</h1><p className="mt-5 text-lg leading-8 text-[#566174]">Questions students asked under reviews. Open one to see it in the review and answer it there. To ask your own, use “Ask a question” under any review.</p></header>
    <div className="mt-9 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_240px]">
      <label className="relative"><span className="sr-only">Search questions</span><Search className="absolute left-5 top-1/2 size-5 -translate-y-1/2 text-[#667085]"/><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} className="focus-ring h-14 w-full rounded-2xl border border-[#d8dde6] bg-white pl-13 pr-5 text-base shadow-sm placeholder:text-[#8a919f] focus:border-[#a91d35]" placeholder="Search questions"/></label>
      <select value={college} onChange={(event) => { setCollege(event.target.value); setPage(1); }} className="focus-ring h-14 rounded-2xl border border-[#d8dde6] bg-white px-4 text-sm font-semibold"><option value="">All colleges</option>{colleges.map((item) => <option key={item}>{item}</option>)}</select>
      <select value={department} onChange={(event) => { setDepartment(event.target.value); setPage(1); }} className="focus-ring h-14 rounded-2xl border border-[#d8dde6] bg-white px-4 text-sm font-semibold"><option value="">All departments</option>{departments.map((code) => <option key={code} value={code}>{readableSubjectName(code, code)}</option>)}</select>
    </div>
    <div className="mt-6 flex gap-1 overflow-x-auto border-b border-[#d8dde6]" role="tablist" aria-label="Question bank views"><TabButton active={tab === "unanswered"} onClick={() => { setTab("unanswered"); setPage(1); }}>Unanswered</TabButton><TabButton active={tab === "recent"} onClick={() => { setTab("recent"); setPage(1); }}>Recent</TabButton><TabButton active={tab === "popular"} onClick={() => { setTab("popular"); setPage(1); }}>Popular</TabButton><span className="mx-3 my-2 w-px shrink-0 bg-[#d8dde6]" aria-hidden="true"/><TabButton active={tab === "activity"} onClick={() => { setTab("activity"); setPage(1); }}>Your activity</TabButton></div>
    {tab === "activity" ? <ActivityView hasSession={hasSession} questions={myQuestions} answers={myAnswers} questionById={questionById}/> : <section aria-live="polite">{pageItems.length ? <div>{pageItems.map((question) => <QuestionRow key={question.id} question={question}/>)}</div> : <Empty title="No questions found" body={tab === "unanswered" ? "There are no unanswered questions matching these filters." : "Try a different search or filter."}/>} {totalPages > 1 && <nav className="mt-8 flex items-center justify-center gap-3" aria-label="Question pages"><button type="button" disabled={page === 1} onClick={() => setPage((value) => value - 1)} className="rounded-xl border border-[#d8dde6] bg-white px-4 py-2 text-sm font-bold disabled:opacity-40">Previous</button><span className="text-sm text-[#667085]">Page {page} of {totalPages}</span><button type="button" disabled={page === totalPages} onClick={() => setPage((value) => value + 1)} className="rounded-xl border border-[#d8dde6] bg-white px-4 py-2 text-sm font-bold disabled:opacity-40">Next</button></nav>}</section>}
  </div>;
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) { return <button type="button" role="tab" aria-selected={active} onClick={onClick} className={`shrink-0 border-b-4 px-4 py-3 text-sm font-bold transition ${active ? "border-[#a91d35] text-[#11182a]" : "border-transparent text-[#667085] hover:text-[#a91d35]"}`}>{children}</button>; }
function reviewHref(question: Question) { return question.course_slug ? `/courses/${question.course_slug}#question-${question.id}` : `/questions/${question.id}`; }
function QuestionRow({ question }: { question: Question }) { return <article className="grid gap-4 border-b border-[#d8dde6] py-7 md:grid-cols-[150px_minmax(0,1fr)_150px] md:items-center"><Link href={question.course_slug ? `/courses/${question.course_slug}` : reviewHref(question)} className="font-black text-[#a91d35] hover:underline">{question.course_code ?? question.department_code ?? "Course"}</Link><div><Link href={reviewHref(question)} className="text-lg font-bold leading-snug hover:text-[#a91d35] hover:underline">{question.title}</Link><p className="mt-1 text-sm text-[#667085]">{question.professor_name ? `Under a review of ${question.professor_name} · ` : ""}{formatDate(question.created_at)}</p></div><div className="md:text-right"><p className="text-sm text-[#667085]">{question.answer_count === 0 ? "No answers yet" : `${question.answer_count} ${question.answer_count === 1 ? "answer" : "answers"}`}</p><Link href={reviewHref(question)} className="mt-2 inline-block text-sm font-bold text-[#a91d35] hover:underline">{question.answer_count === 0 ? "Answer in review" : "View in review"}</Link></div></article>; }
function ActivityView({ hasSession, questions, answers, questionById }: { hasSession: boolean; questions: Question[]; answers: Answer[]; questionById: Map<string, Question> }) { return <div className="pt-7"><p className="text-sm text-[#667085]">Saved on this device only. If you clear your browser data or switch devices, it won’t appear here.</p>{!hasSession && <div className="mt-7"><Empty title="No activity on this device yet" body="Questions you ask and answers you write under reviews will appear here."/></div>}{hasSession && <><section className="mt-10"><h2 className="display text-3xl font-semibold">Your questions <span className="ml-2 font-sans text-xl text-[#667085]">{questions.length}</span></h2>{questions.length ? <div className="mt-3">{questions.map((question) => <QuestionRow key={question.id} question={question}/>)}</div> : <Empty title="You haven’t asked anything yet" body="Use “Ask a question” under a review to start a public thread."/>}</section><section className="mt-12"><h2 className="display text-3xl font-semibold">Your answers <span className="ml-2 font-sans text-xl text-[#667085]">{answers.length}</span></h2>{answers.length ? <div className="mt-3">{answers.map((answer) => { const question = questionById.get(answer.question_id); return <article key={answer.id} className="grid gap-4 border-b border-[#d8dde6] py-6 md:grid-cols-[minmax(0,1fr)_150px] md:items-center"><div>{question && <p className="mb-1 text-sm font-bold text-[#a91d35]">Answer to: {question.title}</p>}<p className="line-clamp-3 leading-7">{answer.body}</p><p className="mt-2 text-sm text-[#667085]">Posted {formatDate(answer.created_at)} · {answer.helpful_count} helpful</p></div><Link href={question ? reviewHref(question) : `/questions/${answer.question_id}`} className="text-sm font-bold text-[#a91d35] hover:underline md:text-right">View in review</Link></article>; })}</div> : <Empty title="You haven’t answered anything yet" body="Answers you write under reviews will be collected here, so you can find them again."/>}</section></>}</div>; }
function Empty({ title, body }: { title: string; body: string }) { return <div className="mt-5 rounded-2xl border border-dashed border-[#d8dde6] bg-white p-8"><p className="font-bold">{title}</p><p className="mt-2 text-sm text-[#667085]">{body}</p></div>; }
