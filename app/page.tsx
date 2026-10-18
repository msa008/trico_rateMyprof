import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BookOpen, Check, CheckCircle2, EyeOff, MessageCircle, Search, Sparkles, Star } from "lucide-react";
import { getHomeData } from "@/lib/data";
import { colleges } from "@/lib/config";
import { SearchBox } from "@/components/search-box";
import { CollegeCard, CourseCard, ProfessorCard, QuestionCard } from "@/components/entity-cards";
import { DemoBanner } from "@/components/demo-banner";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const data = await getHomeData();
  const featuredProfessor = data.professors[0];
  const featuredCourse = data.courses[0];

  return <><DemoBanner show={data.demo}/>
    <section className="relative flex min-h-[calc(100svh-4rem)] items-center overflow-hidden border-b border-[#eadde0] bg-[#fbf7f5]">
      <CampusBackdrop/>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(251,247,245,.99)_0%,rgba(251,247,245,.96)_38%,rgba(251,247,245,.7)_70%,rgba(251,247,245,.58)_100%)]"/>
      <div className="subtle-grid pointer-events-none absolute inset-0 opacity-60"/>
      <div className="container relative grid items-center gap-12 py-12 lg:grid-cols-[1.08fr_.92fr] lg:py-16">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#d9a8b2] bg-white/80 px-3.5 py-1.5 text-xs font-bold text-[#8f182d] shadow-sm"><Sparkles className="size-3.5"/>Made for Haverford, Bryn Mawr, and Swarthmore</div>
          <h1 className="display mt-7 text-[clamp(3.5rem,8vw,7.2rem)] font-semibold leading-[.86] tracking-[-.065em]">Know Before<br/><span className="text-[#a91d35]">You Enroll.</span></h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-[#566174] sm:text-xl">Honest course reviews, professor insights, and real answers from students across the Tri-College Consortium.</p>
          <div className="mt-9 max-w-3xl"><SearchBox/></div>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-[#667085]"><span className="flex items-center gap-1.5"><Search className="size-3.5 text-[#a91d35]"/>Search the real catalog</span><span className="flex items-center gap-1.5"><EyeOff className="size-3.5 text-[#a91d35]"/>No public identity</span><span className="flex items-center gap-1.5"><CheckCircle2 className="size-3.5 text-[#a91d35]"/>Free to browse</span></div>
        </div>

        <div className="relative mx-auto w-full max-w-[520px] lg:mx-0 lg:justify-self-end" aria-label="A preview of professor, course, and question insights">
          <div className="absolute -left-5 top-20 hidden w-44 -rotate-6 rounded-2xl border border-[#eadde0] bg-white p-4 shadow-[0_20px_60px_rgba(94,28,43,.14)] sm:block"><div className="flex items-center gap-2 text-xs font-bold text-[#8f182d]"><MessageCircle className="size-4"/>Student question</div><p className="mt-2 text-sm font-semibold leading-5">“What should I know before taking this class?”</p></div>
          <div className="rounded-[2rem] border border-[#dfc5ca] bg-white/90 p-4 shadow-[0_35px_90px_rgba(94,28,43,.16)] backdrop-blur sm:p-6">
            <div className="flex items-center justify-between border-b border-[#eee2e4] pb-4"><div><p className="text-xs font-black uppercase tracking-[.16em] text-[#a91d35]">Registration snapshot</p><p className="mt-1 text-sm font-semibold text-[#667085]">Live from the Tri-Co directory</p></div><span className="grid size-10 place-items-center rounded-full bg-[#fbf0f2] text-[#a91d35]"><BookOpen className="size-5"/></span></div>
            <div className="py-6"><p className="text-xs font-bold uppercase tracking-[.12em] text-[#8b5360]">Professor</p><div className="mt-2 flex items-start justify-between gap-4"><div><p className="text-xl font-bold">{featuredProfessor?.display_name ?? "Find a professor"}</p><p className="mt-1 text-sm text-[#667085]">{featuredProfessor ? `${featuredProfessor.department_name} · ${featuredProfessor.college_name.replace(" College", "")}` : "Across all three colleges"}</p></div>{featuredProfessor?.overall_rating == null ? <span className="rounded-full bg-[#f3f4f6] px-3 py-1 text-xs font-bold text-[#667085]">Not yet rated</span> : <span className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-sm font-black"><Star className="size-4 fill-amber-500 text-amber-500"/>{featuredProfessor.overall_rating.toFixed(1)}</span>}</div></div>
            <div className="rounded-2xl bg-[#fbf0f2] p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.12em] text-[#8f182d]">Course</p><p className="mt-2 font-bold">{featuredCourse ? `${featuredCourse.code} · ${featuredCourse.title}` : "Search thousands of course listings"}</p></div><span className="rounded-lg bg-white px-2.5 py-1 text-xs font-black text-[#a91d35]">TRI-CO</span></div><div className="mt-4 grid grid-cols-2 gap-3"><Insight label="Workload" value={featuredCourse?.workload}/><Insight label="Difficulty" value={featuredCourse?.difficulty}/></div></div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2"><div className="flex items-center gap-2 rounded-xl border border-[#eadde0] px-3 py-3 text-sm font-semibold"><Check className="size-4 text-emerald-600"/>Experience-based reviews</div><div className="flex items-center gap-2 rounded-xl border border-[#eadde0] px-3 py-3 text-sm font-semibold"><Check className="size-4 text-emerald-600"/>Public questions & answers</div></div>
          </div>
          <div className="absolute -bottom-5 -right-3 hidden rotate-3 rounded-2xl bg-[#a91d35] px-5 py-4 text-white shadow-xl sm:block"><p className="text-xs font-bold text-[#f7dfe4]">Across the consortium</p><p className="mt-1 text-lg font-black">3 colleges · 1 community</p></div>
        </div>
      </div>
    </section>

    <section className="container py-16 sm:py-20"><SectionHead eyebrow="Three campuses, one community" title="Start with your college"/><div className="mt-7 grid gap-4 md:grid-cols-3">{colleges.map((college) => <CollegeCard key={college.slug} {...college}/>)}</div></section>
    <section className="border-y border-[#eadde0] bg-white"><div className="container py-16 sm:py-20"><SectionHead eyebrow="What students are reviewing" title="Recently reviewed professors" link="/colleges/haverford"/><div className="mt-7 grid gap-4 md:grid-cols-3">{data.professors.map((professor) => <ProfessorCard key={professor.id} professor={professor}/>)}</div></div></section>
    <section className="container py-16 sm:py-20"><SectionHead eyebrow="Plan with context" title="Popular courses"/><div className="mt-7 grid gap-4 md:grid-cols-3">{data.courses.map((course) => <CourseCard key={course.id} course={course}/>)}</div></section>

    <section className="border-y border-[#eadde0] bg-[#f7e9ec]"><div className="container grid items-center gap-10 py-16 sm:py-20 lg:grid-cols-[.75fr_1.25fr]">
      <div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#a91d35]">Question bank</p><h2 className="display mt-3 text-4xl font-semibold leading-tight sm:text-5xl">Answers that do not disappear into a group chat.</h2><p className="mt-4 max-w-md text-[#566174]">Browse questions students asked under reviews, then jump directly into the review thread to read or contribute an answer.</p><Button asChild className="mt-7"><Link href="/questions">Browse the Question Bank <ArrowRight className="size-4"/></Link></Button></div>
      <div className="grid gap-3">{data.questions.slice(0, 3).map((question) => <QuestionCard key={question.id} question={question}/>)}</div>
    </div></section>

    <section className="container py-16 sm:py-20"><SectionHead eyebrow="How it works" title="Better decisions in three steps"/><div className="mt-8 grid gap-4 md:grid-cols-3">{[["01","Search before registration","Find a professor, course, or department across all three colleges."],["02","Read the full picture","Compare teaching, workload, grading, advice, and public follow-up questions."],["03","Contribute anonymously","Share an experience without creating a public username or profile."]].map(([number,title,description]) => <div key={number} className="group rounded-2xl border border-[#e5d7da] bg-white p-6 transition hover:-translate-y-1 hover:border-[#c47786] hover:shadow-lg"><span className="grid size-10 place-items-center rounded-full bg-[#fbf0f2] text-sm font-black text-[#a91d35]">{number}</span><h3 className="mt-8 text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-[#667085]">{description}</p></div>)}</div></section>

    <section className="container pb-10"><div className="relative overflow-hidden rounded-[2rem] bg-[#a91d35] px-6 py-14 text-center text-white sm:px-12"><div className="absolute -right-10 -top-16 size-52 rounded-full border-[32px] border-white/10"/><div className="absolute -bottom-24 -left-12 size-48 rounded-full border-[28px] border-white/10"/><h2 className="display relative text-4xl font-semibold sm:text-5xl">Taken a course worth talking about?</h2><p className="relative mx-auto mt-4 max-w-xl text-[#f7dfe4]">Your experience can make someone else’s registration week a little less uncertain.</p><Button asChild className="relative mt-7 !bg-white !text-[#8f182d] hover:!bg-[#fff6f7]"><Link href="/reviews/new">Write an anonymous review <ArrowRight className="size-4"/></Link></Button></div></section>
  </>;
}

function Insight({ label, value }: { label: string; value?: number | null }) { return <div className="rounded-xl bg-white p-3"><p className="text-xs font-semibold text-[#667085]">{label}</p><p className="mt-1 text-lg font-black">{value == null ? "—" : `${value.toFixed(1)}/5`}</p></div>; }
function SectionHead({ eyebrow, title, link }: { eyebrow: string; title: string; link?: string }) { return <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#a91d35]">{eyebrow}</p><h2 className="display mt-2 text-3xl font-semibold sm:text-4xl">{title}</h2></div>{link && <Link href={link} className="hidden items-center gap-1 text-sm font-bold text-[#a91d35] hover:underline sm:flex">View directory <ArrowRight className="size-4"/></Link>}</div>; }
function CampusBackdrop() { const campuses=[{name:"Haverford College",src:"/campuses/haverford.jpg"},{name:"Bryn Mawr College",src:"/campuses/bryn-mawr.jpg"},{name:"Swarthmore College",src:"/campuses/swarthmore.webp"}];return <div className="pointer-events-none absolute inset-0 grid grid-cols-3" aria-hidden="true">{campuses.map((campus)=><div key={campus.name} className="relative overflow-hidden"><Image src={campus.src} alt="" fill priority sizes="33vw" className="object-cover"/></div>)}</div>; }
