"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BookOpen, Search, Star, Users } from "lucide-react";
import type { Course, Professor } from "@/lib/types";
import { initials } from "@/lib/utils";

const subjectNames: Record<string, string> = {
  AFST: "Africana Studies", ANCH: "Ancient History", ANTH: "Anthropology", ARAB: "Arabic",
  ARCH: "Archaeology", ARTD: "Art and Design", ARTH: "Art History", ARTS: "Studio Arts",
  ARTT: "Studio Art", ASAM: "Asian American Studies", ASIA: "Asian Studies", ASLG: "American Sign Language",
  ASTR: "Astronomy", BIOL: "Biology", BLST: "Black Studies", CHEM: "Chemistry", CHIN: "Chinese",
  CITY: "Cities", CLST: "Classics", CMSC: "Computer Science", CNSE: "Neuroscience",
  COGS: "Cognitive Science", COML: "Comparative Literature", CPLT: "Comparative Literature",
  CPSC: "Computer Science", CRWT: "Creative Writing", CSTS: "Classical Studies", DANC: "Dance",
  DSCI: "Data Science", EALC: "East Asian Languages and Cultures", ECON: "Economics", EDUC: "Education",
  ENGL: "English", ENGR: "Engineering", ENVS: "Environmental Studies", FMST: "Film and Media Studies",
  FREN: "French", GEOL: "Geology", GERM: "German", GLBL: "Global Studies", GMST: "German Studies",
  GNST: "General Studies", GREK: "Greek", GSEM: "General Studies Seminar",
  GSST: "Gender and Sexuality Studies", HART: "History of Art", HEBR: "Hebrew", HIST: "History",
  HLTH: "Health Studies", ISLM: "Islamic Studies", ITAL: "Italian", JPNS: "Japanese", KORN: "Korean",
  LALS: "Latin American and Latino Studies", LATN: "Latin", LING: "Linguistics", LITR: "Literature",
  MATH: "Mathematics", MDST: "Medieval Studies", MEST: "Middle Eastern Studies", MUSC: "Music",
  MUSI: "Music", NEUR: "Neuroscience", PE: "Physical Education", PEAC: "Peace and Conflict Studies",
  PEDANCE: "Physical Education and Dance", PHED: "Physical Education", PHIL: "Philosophy",
  PHYS: "Physics", POLS: "Political Science", PSYC: "Psychology", QUAN: "Quantitative Methods",
  RELG: "Religion", RUSS: "Russian", SOAN: "Sociology and Anthropology", SOCI: "Sociology",
  SOCL: "Sociology", SOWK: "Social Work", SPAN: "Spanish", STAT: "Statistics", THEA: "Theater",
  VIST: "Visual Studies", WB: "Wellness", WRIT: "Writing", WRPR: "Writing Program",
};

export function readableSubjectName(name: string, code: string) {
  const normalizedCode = code.trim().toUpperCase();
  const normalizedName = name.trim();
  return normalizedName.toUpperCase() === normalizedCode
    ? subjectNames[normalizedCode] ?? normalizedName
    : normalizedName;
}

export function DepartmentDirectory({
  college,
  department,
  professors,
  courses,
}: {
  college: { name: string; slug: string };
  department: { name: string; code: string };
  professors: Professor[];
  courses: Course[];
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("reviewed");
  const subjectName = readableSubjectName(department.name, department.code);
  const term = query.trim().toLowerCase();
  const visibleProfessors = useMemo(() => [...professors]
    .filter((professor) => !term || professor.display_name.toLowerCase().includes(term))
    .sort((a, b) => sort === "rated"
      ? (b.overall_rating ?? -1) - (a.overall_rating ?? -1)
      : sort === "az"
        ? a.display_name.localeCompare(b.display_name)
        : b.review_count - a.review_count), [professors, sort, term]);
  const visibleCourses = useMemo(() => courses.filter((course) => !term
    || `${course.code} ${course.title}`.toLowerCase().includes(term)), [courses, term]);

  return <div className="container py-10 sm:py-14">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <p className="text-sm text-[#667085]"><Link href={`/colleges/${college.slug}`} className="font-semibold hover:text-[#a91d35] hover:underline">{college.name}</Link><span className="mx-2">›</span>Subjects</p>
      <Link href="/reviews/new" className="rounded-xl bg-[#a91d35] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#8f182d]">Write a review</Link>
    </div>

    <header className="mt-8 border-b border-[#d8dde6] pb-9">
      <p className="text-sm font-black uppercase tracking-[.18em] text-[#a91d35]">{department.code}</p>
      <h1 className="display mt-2 text-5xl font-semibold leading-none sm:text-6xl">{subjectName}</h1>
      <p className="mt-4 text-lg text-[#566174]">Explore professors and courses in {subjectName} at {college.name}.</p>
      <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#fbf0f2] px-4 py-2 text-[#8f182d]"><Users className="size-4" />{professors.length} {professors.length === 1 ? "professor" : "professors"}</span>
        <span className="inline-flex items-center gap-2 rounded-full bg-[#fbf0f2] px-4 py-2 text-[#8f182d]"><BookOpen className="size-4" />{courses.length} {courses.length === 1 ? "course" : "courses"}</span>
      </div>
    </header>

    <div className="relative mt-8"><Search className="absolute left-5 top-1/2 size-5 -translate-y-1/2 text-[#667085]"/><input value={query} onChange={(event) => setQuery(event.target.value)} className="focus-ring h-16 w-full rounded-2xl border-2 border-[#d5a0aa] bg-white pl-13 pr-5 text-base shadow-sm placeholder:text-[#8a919f] focus:border-[#a91d35]" placeholder={`Search ${subjectName} professors or courses`} aria-label={`Search ${subjectName}`} /></div>

    <section className="mt-12">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#d8dde6] pb-3"><div><h2 className="display text-4xl font-semibold">Professors</h2><p className="mt-1 text-sm text-[#667085]">Open a professor to see ratings, courses, reviews, and student questions.</p></div><select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort professors" className="focus-ring h-11 rounded-xl border border-[#d8dde6] bg-white px-4 text-sm"><option value="reviewed">Most reviewed</option><option value="rated">Highest rated</option><option value="az">Name A–Z</option></select></div>
      {visibleProfessors.length ? <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visibleProfessors.map((professor) => <ProfessorBox key={professor.id} professor={professor}/>)}</div> : <Empty text="No professors match that search."/>}
    </section>

    <section className="mt-14">
      <div className="border-b border-[#d8dde6] pb-3"><h2 className="display text-4xl font-semibold">Courses</h2><p className="mt-1 text-sm text-[#667085]">Choose a course to read reviews, compare workload, and ask questions.</p></div>
      {visibleCourses.length ? <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visibleCourses.map((course) => <CourseBox key={course.id} course={course}/>)}</div> : <Empty text="No courses match that search."/>}
    </section>
  </div>;
}

function ProfessorBox({ professor }: { professor: Professor }) {
  return <Link href={`/professors/${professor.slug}`} className="group rounded-2xl border border-[#d8dde6] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#c47786] hover:shadow-md"><div className="flex items-start gap-4"><span className="grid size-12 shrink-0 place-items-center rounded-full bg-[#11182a] text-sm font-bold text-white">{initials(professor.display_name)}</span><div className="min-w-0 flex-1"><h3 className="font-bold group-hover:text-[#a91d35] group-hover:underline">{professor.display_name}</h3><p className="mt-0.5 text-sm text-[#667085]">{professor.department_name}</p><div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-[#eef0f3] pt-3"><div>{professor.overall_rating === null ? <span className="text-sm font-semibold text-[#667085]">Not yet rated</span> : <span className="flex items-center gap-1.5"><Star className="size-4 fill-amber-500 text-amber-500"/><strong className="text-xl">{professor.overall_rating.toFixed(1)}</strong><span className="text-xs text-[#667085]">/5</span></span>}<p className="text-xs text-[#667085]">{professor.review_count} {professor.review_count === 1 ? "review" : "reviews"}</p></div><span className="text-xs font-bold text-[#566174]">{professor.would_take_again_pct === null ? "New profile" : `${professor.would_take_again_pct}% take again`}</span></div></div></div></Link>;
}

function CourseBox({ course }: { course: Course }) {
  return <Link href={`/courses/${course.slug}`} className="group rounded-2xl border border-[#d8dde6] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#c47786] hover:shadow-md"><div className="flex items-start justify-between gap-4"><span className="rounded-lg bg-[#fbf0f2] px-2.5 py-1 text-xs font-black text-[#a91d35]">{course.code}</span><span className="flex items-center gap-1 text-xs font-semibold text-[#667085]"><BookOpen className="size-3.5"/>{course.review_count} {course.review_count === 1 ? "review" : "reviews"}</span></div><h3 className="mt-4 text-lg font-bold leading-snug group-hover:text-[#a91d35] group-hover:underline">{course.title}</h3>{course.workload !== null || course.difficulty !== null ? <p className="mt-3 text-xs font-semibold text-[#667085]">{course.workload !== null ? `Workload ${course.workload.toFixed(1)}/5` : ""}{course.workload !== null && course.difficulty !== null ? " · " : ""}{course.difficulty !== null ? `Difficulty ${course.difficulty.toFixed(1)}/5` : ""}</p> : <p className="mt-3 text-xs font-semibold text-[#667085]">Not yet rated</p>}</Link>;
}

function Empty({ text }: { text: string }) {
  return <div className="mt-5 rounded-2xl border border-dashed border-[#d8dde6] bg-white p-8 text-center text-sm text-[#667085]">{text}</div>;
}
