import { createClient } from "./supabase/server";
import { createAdminClient } from "./supabase/admin";
import { getAnonymousContributorHash } from "./anonymous-session";
import { demoCourses, demoDepartments, demoProfessors, demoQuestions, demoReviews } from "./demo-data";
import type { AnonymousNotification, Answer, Course, Professor, Question, Review, ReviewOption } from "./types";

export const isDemoMode = () => !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

async function attachReviewThreads(supabase:NonNullable<Awaited<ReturnType<typeof createClient>>>,reviews:Review[]){
  if(!reviews.length)return reviews;
  const questionResult=await supabase.from("public_questions").select("*").in("review_id",reviews.map(r=>r.id)).order("created_at");
  const questions=(questionResult.data??[]) as Question[];
  if(!questions.length)return reviews;
  const answerResult=await supabase.from("public_answers").select("*").in("question_id",questions.map(q=>q.id)).order("created_at");
  const answers=answerResult.data??[];
  return reviews.map(review=>({...review,questions:questions.filter(q=>q.review_id===review.id).map(q=>({...q,answers:answers.filter(a=>a.question_id===q.id)}))}));
}

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
  return { professor: result.data as Professor, reviews: await attachReviewThreads(supabase,reviews.data as Review[] ?? []), courses: courses.data as Course[] ?? [], questions: questions.data as Question[] ?? [], demo: false };
}

export async function getCourse(slug: string) {
  const supabase = await createClient();
  if (!supabase) { const course = demoCourses.find((c) => c.slug === slug); return course ? { course, reviews: demoReviews.filter((r) => r.course_slug === slug), professors: demoProfessors.slice(0, 2), questions: demoQuestions.filter((q) => q.course_slug === slug), similarCourses:demoCourses.filter(c=>c.slug!==slug&&c.department_name===course.department_name).slice(0,3), demo: true } : null; }
  const result = await supabase.from("course_rating_summaries").select("*").eq("slug", slug).single();
  if (!result.data) return null;
  const [reviews, professors, questions, similarCourses] = await Promise.all([
    supabase.from("public_reviews").select("*").eq("course_id", result.data.id).order("created_at", { ascending: false }),
    supabase.from("course_professors_public").select("*").eq("course_id", result.data.id),
    supabase.from("public_questions").select("*").eq("course_id", result.data.id).limit(20),
    supabase.from("course_rating_summaries").select("*").eq("college_slug",result.data.college_slug).eq("department_name",result.data.department_name).neq("id",result.data.id).limit(3),
  ]);
  return { course: result.data as Course, reviews: await attachReviewThreads(supabase,reviews.data as Review[] ?? []), professors: professors.data as Professor[] ?? [], questions: questions.data as Question[] ?? [], similarCourses:similarCourses.data as Course[]??[], demo: false };
}

export async function getDepartmentData(collegeSlug:string,code:string){
  const supabase=await createClient();
  if(!supabase){const professors=demoProfessors.filter(p=>p.college_slug===collegeSlug&&p.department_code.toLowerCase()===code.toLowerCase());const courses=demoCourses.filter(c=>c.college_slug===collegeSlug&&professors.some(p=>p.department_name===c.department_name));return professors.length||courses.length?{department:{name:professors[0]?.department_name??courses[0]?.department_name??code.toUpperCase(),code:code.toUpperCase()},college:{name:professors[0]?.college_name??courses[0]?.college_name??collegeSlug,slug:collegeSlug},professors,courses,demo:true}:null}
  const college=await supabase.from("colleges").select("id,name,slug").eq("slug",collegeSlug).single();if(!college.data)return null;
  const department=await supabase.from("departments").select("id,name,code").eq("college_id",college.data.id).ilike("code",code).single();if(!department.data)return null;
  const courseIds=await supabase.from("courses").select("id").eq("department_id",department.data.id);
  const[professors,courses]=await Promise.all([
    supabase.from("professor_rating_summaries").select("*").eq("college_slug",collegeSlug).eq("department_code",department.data.code).order("display_name").limit(100),
    courseIds.data?.length?supabase.from("course_rating_summaries").select("*").in("id",courseIds.data.map(row=>row.id)).order("code").limit(100):Promise.resolve({data:[]}),
  ]);
  return{department:department.data,college:college.data,professors:(professors.data??[]) as Professor[],courses:(courses.data??[]) as Course[],demo:false};
}

export async function getReviewContext(id:string){
  const supabase=await createClient();if(!supabase)return null;
  const{data}=await supabase.from("public_reviews").select("id,professor_name,course_code,semester,year,body").eq("id",id).single();
  return data;
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

export async function getMyActivity(){
  const contributorHash=await getAnonymousContributorHash(false);const supabase=createAdminClient();
  if(!contributorHash||!supabase)return{hasSession:false,reviews:[] as Review[],questions:[] as Question[],answers:[] as Answer[],notifications:[] as AnonymousNotification[]};
  const[ownedReviews,ownedQuestions,ownedAnswers,notificationResult]=await Promise.all([
    supabase.from("reviews").select("id").eq("contributor_hash",contributorHash).order("created_at",{ascending:false}).limit(50),
    supabase.from("questions").select("id").eq("contributor_hash",contributorHash).order("created_at",{ascending:false}).limit(50),
    supabase.from("answers").select("id").eq("contributor_hash",contributorHash).order("created_at",{ascending:false}).limit(50),
    supabase.from("notifications").select("id,type,title,body,target_path,read_at,created_at").eq("contributor_hash",contributorHash).order("created_at",{ascending:false}).limit(50),
  ]);
  const reviewIds=(ownedReviews.data??[]).map(row=>row.id);const questionIds=(ownedQuestions.data??[]).map(row=>row.id);const answerIds=(ownedAnswers.data??[]).map(row=>row.id);
  const[reviewResult,questionResult,answerResult]=await Promise.all([
    reviewIds.length?supabase.from("public_reviews").select("*").in("id",reviewIds):Promise.resolve({data:[]}),
    questionIds.length?supabase.from("public_questions").select("*").in("id",questionIds):Promise.resolve({data:[]}),
    answerIds.length?supabase.from("public_answers").select("*").in("id",answerIds):Promise.resolve({data:[]}),
  ]);
  return{hasSession:true,reviews:(reviewResult.data??[]) as Review[],questions:(questionResult.data??[]) as Question[],answers:(answerResult.data??[]) as Answer[],notifications:(notificationResult.data??[]) as AnonymousNotification[]};
}

export async function getOwnedReview(id:string){
  const contributorHash=await getAnonymousContributorHash(false);const supabase=createAdminClient();if(!contributorHash||!supabase)return null;
  const{data}=await supabase.from("reviews").select("id,semester,year,teaching_quality,workload,grading_difficulty,would_take_again,attendance_importance,grade_status,descriptors,body,advice,wish_known").eq("id",id).eq("contributor_hash",contributorHash).maybeSingle();if(!data)return null;
  const{data:context}=await supabase.from("public_reviews").select("professor_name,course_code,professor_slug").eq("id",id).maybeSingle();
  return{...data,professor_name:context?.professor_name??"Professor",course_code:context?.course_code??"Course",professor_slug:context?.professor_slug??""};
}

export async function getUnreadNotificationCount(){
  const contributorHash=await getAnonymousContributorHash(false);const supabase=createAdminClient();if(!contributorHash||!supabase)return 0;
  const{count}=await supabase.from("notifications").select("id",{count:"exact",head:true}).eq("contributor_hash",contributorHash).is("read_at",null);
  return count??0;
}

export async function getReviewOptions():Promise<{options:ReviewOption[];demo:boolean}>{
  const supabase=await createClient();
  if(!supabase)return{demo:true,options:[{offeringId:"99999999-9999-4999-8999-999999999999",professorId:demoProfessors[0].id,professorName:demoProfessors[0].display_name,courseId:demoCourses[0].id,courseCode:demoCourses[0].code,courseTitle:demoCourses[0].title,collegeName:demoCourses[0].college_name,semester:"Fall",year:2026}]};
  const{data}=await supabase.from("review_form_options").select("*").order("course_code");
  return{demo:false,options:(data??[]).map(o=>({offeringId:o.offering_id,professorId:o.professor_id,professorName:o.professor_name,courseId:o.course_id,courseCode:o.course_code,courseTitle:o.course_title,collegeName:o.college_name,semester:o.semester,year:o.year})) as ReviewOption[]};
}
