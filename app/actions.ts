"use server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createHmac, randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { answerSchema, questionSchema, reportSchema, reviewSchema } from "@/lib/validation";

export type ActionState = { ok: boolean; message: string; fieldErrors?: Record<string, string[]> };
const setupError: ActionState = { ok: false, message: "Anonymous submissions are not configured yet. Add the Supabase server credentials to enable them." };

function fields(error: { flatten: () => { fieldErrors: Record<string, string[]> } }) { return error.flatten().fieldErrors; }
async function anonymousContext() {
  const supabase = createAdminClient();
  if (!supabase) return { supabase: null, contributorHash: "", error: setupError };
  const jar = await cookies();
  let sessionId = jar.get("trico_anonymous_session")?.value;
  if (!sessionId) {
    sessionId = randomUUID();
    jar.set("trico_anonymous_session", sessionId, { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 365, path: "/" });
  }
  const secret = process.env.RATE_LIMIT_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const contributorHash = createHmac("sha256", secret).update(sessionId).digest("hex");
  return { supabase, contributorHash, error: null };
}

export async function submitReviewAction(raw: unknown): Promise<ActionState> {
  const parsed = reviewSchema.safeParse(raw); if (!parsed.success) return { ok:false, message:"Review the form fields.", fieldErrors: fields(parsed.error) };
  const context = await anonymousContext(); if (context.error || !context.supabase) return context.error!;
  const { error } = await context.supabase.rpc("submit_anonymous_review", { p_contributor_hash: context.contributorHash, p_professor_id: parsed.data.professorId, p_course_id: parsed.data.courseId, p_offering_id: parsed.data.offeringId, p_semester: parsed.data.semester, p_year: parsed.data.year, p_teaching_quality: parsed.data.teachingQuality, p_workload: parsed.data.workload, p_grading_difficulty: parsed.data.gradingDifficulty, p_would_take_again: parsed.data.wouldTakeAgain, p_attendance_importance: parsed.data.attendanceImportance, p_body: parsed.data.body, p_advice: parsed.data.advice || null, p_wish_known: parsed.data.wishKnown || null });
  if (error) return { ok:false, message: error.code === "23505" ? "This browser already reviewed that professor-course-semester combination." : error.message };
  revalidatePath("/"); return { ok:true, message:"Review published anonymously." };
}

export async function submitQuestionAction(raw: unknown): Promise<ActionState> {
  const parsed = questionSchema.safeParse(raw); if(!parsed.success) return {ok:false,message:"Review the question fields.",fieldErrors:fields(parsed.error)};
  const context=await anonymousContext(); if(context.error||!context.supabase) return context.error!;
  const rate=await context.supabase.rpc("check_anonymous_rate_limit",{p_contributor_hash:context.contributorHash,p_action:"question",p_max:8,p_window_seconds:86400}); if(rate.error)return{ok:false,message:rate.error.message};
  const {error}=await context.supabase.from("questions").insert({title:parsed.data.title,body:parsed.data.body,course_id:parsed.data.courseId||null,professor_id:parsed.data.professorId||null,review_id:parsed.data.reviewId||null,contributor_hash:context.contributorHash});
  if(error) return {ok:false,message:error.message}; revalidatePath("/questions"); return {ok:true,message:"Question posted."};
}

export async function submitAnswerAction(raw: unknown): Promise<ActionState> { const parsed=answerSchema.safeParse(raw); if(!parsed.success) return {ok:false,message:"Answer must be 10–2,000 characters.",fieldErrors:fields(parsed.error)}; const context=await anonymousContext(); if(context.error||!context.supabase)return context.error!; const rate=await context.supabase.rpc("check_anonymous_rate_limit",{p_contributor_hash:context.contributorHash,p_action:"answer",p_max:20,p_window_seconds:86400});if(rate.error)return{ok:false,message:rate.error.message};const {error}=await context.supabase.from("answers").insert({question_id:parsed.data.questionId,body:parsed.data.body,parent_answer_id:parsed.data.parentAnswerId||null,contributor_hash:context.contributorHash}); if(error)return {ok:false,message:error.message}; revalidatePath(`/questions/${parsed.data.questionId}`); return {ok:true,message:"Answer posted anonymously."}; }

export async function voteAction(targetType:"review"|"question"|"answer",targetId:string):Promise<ActionState>{const context=await anonymousContext();if(context.error||!context.supabase)return context.error!;await context.supabase.from("votes").delete().eq("contributor_hash",context.contributorHash).eq("target_type",targetType).eq("target_id",targetId);const{error}=await context.supabase.from("votes").insert({contributor_hash:context.contributorHash,target_type:targetType,target_id:targetId,value:1});return error?{ok:false,message:error.message}:{ok:true,message:"Vote recorded."};}
export async function reportAction(raw:unknown):Promise<ActionState>{const parsed=reportSchema.safeParse(raw);if(!parsed.success)return{ok:false,message:"Select a report reason."};const context=await anonymousContext();if(context.error||!context.supabase)return context.error!;await context.supabase.from("reports").delete().eq("contributor_hash",context.contributorHash).eq("target_type",parsed.data.targetType).eq("target_id",parsed.data.targetId);const{error}=await context.supabase.from("reports").insert({target_type:parsed.data.targetType,target_id:parsed.data.targetId,reason:parsed.data.reason,details:parsed.data.details||null,contributor_hash:context.contributorHash});return error?{ok:false,message:error.message}:{ok:true,message:"Anonymous report recorded for operator review."};}
export async function setInterestAction(courseId:string,status:"interested"|"planning",semester:string,year:number):Promise<ActionState>{const context=await anonymousContext();if(context.error||!context.supabase)return context.error!;await context.supabase.from("course_interests").delete().eq("contributor_hash",context.contributorHash).eq("course_id",courseId).eq("semester",semester).eq("year",year);const{error}=await context.supabase.from("course_interests").insert({contributor_hash:context.contributorHash,course_id:courseId,status,semester,year});return error?{ok:false,message:error.message}:{ok:true,message:"Anonymous interest saved for this browser."};}
