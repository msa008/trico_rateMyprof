import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourse } from "@/lib/data";
import { DemoBanner } from "@/components/demo-banner";
import { CourseCard, ProfessorCard } from "@/components/entity-cards";
import { PageHeading } from "@/components/page-heading";
import { ReviewCard } from "@/components/review-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CourseInterest } from "@/components/course-interest";

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getCourse(slug);
  if (!data) notFound();
  const course = data.course;
  const departmentCode = course.code.split(" ")[0].toLowerCase();
  const departmentHref = `/departments/${course.college_slug}/${departmentCode}`;

  return <><DemoBanner show={data.demo}/><div className="container py-12">
    <PageHeading eyebrow={<Link className="hover:underline" href={departmentHref}>{course.department_name} · {course.college_name}</Link>} title={`${course.code}: ${course.title}`} description={course.description} actions={<Button asChild><Link href={`/reviews/new?course=${course.id}`}>Review this course</Link></Button>}/>
    <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_1.5fr]">
      <Card className="border-[#11182a] bg-[#11182a] p-6 text-white"><div className="grid grid-cols-2 gap-6"><Metric label="Workload" value={course.workload}/><Metric label="Difficulty" value={course.difficulty}/></div><div className="mt-6 border-t border-white/15 pt-5 text-sm text-[#c7d2fe]">Based on {course.review_count} submitted {course.review_count === 1 ? "review" : "reviews"}.</div></Card>
      <Card className="border-[#dce3fb] p-6"><p className="font-bold text-[#172554]">Considering this course?</p><p className="mt-1 text-sm text-[#667085]">Interest is private. Only aggregate counts are shown.</p><CourseInterest courseId={course.id} interested={course.interested_count ?? 0} planning={course.planning_count ?? 0}/></Card>
    </div>
    {data.professors.length > 0 && <section className="mt-14"><div className="flex items-end justify-between"><h2 className="display text-3xl font-medium">Professors who have taught it</h2><Link className="text-sm font-semibold text-[#a91d35] hover:underline" href={departmentHref}>All {course.department_name}</Link></div><div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{data.professors.map((professor) => <ProfessorCard key={professor.id} professor={professor}/>)}</div></section>}
    {data.similarCourses.length > 0 && <section className="mt-14"><h2 className="display text-3xl font-medium">Similar {course.department_name} courses</h2><div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{data.similarCourses.map((item) => <CourseCard key={item.id} course={item}/>)}</div></section>}
    <section className="mt-14"><div className="flex items-end justify-between"><h2 className="display text-3xl font-medium">Course reviews</h2><div className="flex gap-2"><Badge className="bg-white text-[#667085] ring-1 ring-[#e5e8ef]">All professors</Badge><Badge className="bg-white text-[#667085] ring-1 ring-[#e5e8ef]">All semesters</Badge></div></div><div className="mt-5 grid gap-4">{data.reviews.length ? data.reviews.map((review) => <ReviewCard key={review.id} review={review}/>) : <p className="rounded-2xl border border-dashed border-[#d9deea] bg-white p-10 text-center text-[#667085]">No course reviews yet.</p>}</div></section>
  </div></>;
}

function Metric({ label, value }: { label: string; value: number | null }) {
  return <div><p className="text-sm font-semibold text-[#c7d2fe]">{label}</p><p className="mt-2 text-4xl font-black text-white">{value === null ? "—" : value.toFixed(1)}</p><p className="text-xs text-[#c7d2fe]">out of 5</p></div>;
}
