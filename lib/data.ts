import { createClient } from "./supabase/server";
import { demoCourses, demoDepartments, demoProfessors, demoQuestions, demoReviews } from "./demo-data";
import type { Course, Professor, Question, Review, ReviewOption } from "./types";

export const isDemoMode = () => !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export async function getHomeData() {
  const supabase = await createClient();
  if (!supabase) return { professors: demoProfessors, courses: demoCourses, questions: demoQuestions, demo: true };
  const [professors, courses, questions] = await Promise.all([
    supabase.from("professor_rating_summaries").select("*").order("updated_at", { ascending: false }).limit(3),
    supabase.from("course_rating_summaries").select("*").order("review_count", { ascending: false }).limit(3),
    supabase.from("public_questions").select("*").order("created_at", { ascending: false }).limit(4),
  ]);
  return { professors: (professors.data ?? []) as Professor[], courses: (courses.data ?? []) as Course[], questions: (questions.data ?? []) as Question[], demo: false };
}

export async function getCollegeData(slug: string) {
  const supabase = await createClient();
  if (!supabase) return { professors: demoProfessors.filter((p) => p.college_slug === slug), courses: demoCourses.filter((c) => c.college_slug === slug), departments: demoDepartments, reviews: demoReviews, demo: true };
  const college = await supabase.from("colleges").select("id").eq("slug", slug).single();
  if (!college.data) return null;
  const [professors, courses, departments, reviews] = await Promise.all([
    supabase.from("professor_rating_summaries").select("*").eq("college_slug", slug).limit(24),
    supabase.from("course_rating_summaries").select("*").eq("college_slug", slug).limit(24),
    supabase.from("departments").select("id,name,code").eq("college_id", college.data.id).order("name"),
    supabase.from("public_reviews").select("*").eq("college_slug", slug).order("created_at", { ascending: false }).limit(6),
  ]);
  return { professors: professors.data as Professor[] ?? [], courses: courses.data as Course[] ?? [], departments: departments.data ?? [], reviews: reviews.data as Review[] ?? [], demo: false };
}

export async function getProfessor(slug: string) {
  const supabase = await createClient();
  if (!supabase) { const professor = demoProfessors.find((p) => p.slug === slug); return professor ? { professor, reviews: demoReviews.filter((r) => r.professor_slug === slug), courses: demoCourses.slice(0, 2), questions: demoQuestions.slice(0, 1), demo: true } : null; }
  const result = await supabase.from("professor_rating_summaries").select("*").eq("slug", slug).single();
  if (!result.data) return null;
  const [reviews, courses, questions] = await Promise.all([
    supabase.from("public_reviews").select("*").eq("professor_id", result.data.id).order("created_at", { ascending: false }),
    supabase.from("professor_courses_public").select("*").eq("professor_id", result.data.id),
    supabase.from("public_questions").select("*").eq("professor_id", result.data.id).limit(10),
  ]);
  return { professor: result.data as Professor, reviews: reviews.data as Review[] ?? [], courses: courses.data as Course[] ?? [], questions: questions.data as Question[] ?? [], demo: false };
}

export async function getCourse(slug: string) {
  const supabase = await createClient();
  if (!supabase) { const course = demoCourses.find((c) => c.slug === slug); return course ? { course, reviews: demoReviews.filter((r) => r.course_slug === slug), professors: demoProfessors.slice(0, 2), questions: demoQuestions.filter((q) => q.course_slug === slug), demo: true } : null; }
  const result = await supabase.from("course_rating_summaries").select("*").eq("slug", slug).single();
  if (!result.data) return null;
  const [reviews, professors, questions] = await Promise.all([
    supabase.from("public_reviews").select("*").eq("course_id", result.data.id).order("created_at", { ascending: false }),
    supabase.from("course_professors_public").select("*").eq("course_id", result.data.id),
    supabase.from("public_questions").select("*").eq("course_id", result.data.id).limit(20),
  ]);
  return { course: result.data as Course, reviews: reviews.data as Review[] ?? [], professors: professors.data as Professor[] ?? [], questions: questions.data as Question[] ?? [], demo: false };
}

export async function getQuestions() {
  const supabase = await createClient();
  if (!supabase) return { questions: demoQuestions, demo: true };
  const result = await supabase.from("public_questions").select("*").order("created_at", { ascending: false }).range(0, 24);
  return { questions: result.data as Question[] ?? [], demo: false };
}

export async function getQuestion(id: string) {
  const supabase = await createClient();
  if (!supabase) { const question = demoQuestions.find((q) => q.id === id); return question ? { question, answers: question.answer_count ? [{ id: "abababab-abab-4bab-8bab-abababababab", alias: "studybadger204", body: "Demonstration answer: basic algebra is enough for most of the course. The harder part is translating word problems into a model, so practicing that step is more useful than reviewing advanced math.", helpful_count: 12, created_at: "2026-10-06T10:00:00Z", parent_answer_id: null }] : [], demo: true } : null; }
  const question = await supabase.from("public_questions").select("*").eq("id", id).single();
  if (!question.data) return null;
  const answers = await supabase.from("public_answers").select("*").eq("question_id", id).order("created_at");
  return { question: question.data as Question, answers: answers.data ?? [], demo: false };
}

export async function getReviewOptions():Promise<{options:ReviewOption[];demo:boolean}>{
  const supabase=await createClient();
  if(!supabase)return{demo:true,options:[{offeringId:"99999999-9999-4999-8999-999999999999",professorId:demoProfessors[0].id,professorName:demoProfessors[0].display_name,courseId:demoCourses[0].id,courseCode:demoCourses[0].code,courseTitle:demoCourses[0].title,collegeName:demoCourses[0].college_name,semester:"Fall",year:2026}]};
  const{data}=await supabase.from("review_form_options").select("*").order("course_code");
  return{demo:false,options:(data??[]).map(o=>({offeringId:o.offering_id,professorId:o.professor_id,professorName:o.professor_name,courseId:o.course_id,courseCode:o.course_code,courseTitle:o.course_title,collegeName:o.college_name,semester:o.semester,year:o.year})) as ReviewOption[]};
}
