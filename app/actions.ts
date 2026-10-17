"use server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAnonymousContributorHash } from "@/lib/anonymous-session";
import { answerSchema, communityCatalogSchema, questionSchema, reportSchema, reviewEditSchema, reviewSchema } from "@/lib/validation";
import type { ReviewOption } from "@/lib/types";

export type ActionState = { ok: boolean; message: string; fieldErrors?: Record<string, string[]> };
const setupError: ActionState = { ok: false, message: "Anonymous submissions are not configured yet. Add the Supabase server credentials to enable them." };

function fields(error: { flatten: () => { fieldErrors: Record<string, string[]> } }) { return error.flatten().fieldErrors; }
async function anonymousContext() {
  const supabase = createAdminClient();
  if (!supabase) return { supabase: null, contributorHash: "", error: setupError };
  const contributorHash = await getAnonymousContributorHash(true);
  if (!contributorHash) return { supabase: null, contributorHash: "", error: setupError };
  return { supabase, contributorHash, error: null };
}

type CatalogActionState = ActionState & { option?: ReviewOption };
export async function createCommunityCatalogOptionAction(raw: unknown): Promise<CatalogActionState> {
  const parsed = communityCatalogSchema.safeParse(raw);
  if (!parsed.success) return { ok:false, message:"Check the course details and examples.", fieldErrors:fields(parsed.error) };
  const context = await anonymousContext(); if (context.error || !context.supabase) return context.error!;
  const { data, error } = await context.supabase.rpc("create_community_catalog_option", {
    p_contributor_hash:context.contributorHash, p_college_slug:parsed.data.collegeSlug,
    p_course_code:parsed.data.courseCode, p_course_title:parsed.data.courseTitle,
    p_professor_name:parsed.data.professorName, p_semester:parsed.data.semester, p_year:parsed.data.year,
  });
  if (error || !data?.[0]) return { ok:false, message:error?.message ?? "Could not add that class." };
  const row=data[0];
  const option:ReviewOption={offeringId:row.offering_id,professorId:row.professor_id,professorName:row.professor_name,courseId:row.course_id,courseCode:row.course_code,courseTitle:row.course_title,collegeName:row.college_name,semester:row.semester,year:row.year,catalogVerified:row.catalog_verified};
  revalidatePath("/");
  return { ok:true, message:"Added as a community entry. You can review it now.", option };
}

export async function markNotificationsReadAction():Promise<ActionState>{
  const contributorHash=await getAnonymousContributorHash(false);const supabase=createAdminClient();
  if(!contributorHash||!supabase)return{ok:false,message:"No browser activity found."};
  const{error}=await supabase.from("notifications").update({read_at:new Date().toISOString()}).eq("contributor_hash",contributorHash).is("read_at",null);
  if(error)return{ok:false,message:error.message};revalidatePath("/activity");return{ok:true,message:"Notifications marked as read."};
}

export async function submitReviewAction(raw: unknown): Promise<ActionState> {
  const parsed = reviewSchema.safeParse(raw); if (!parsed.success) { const fieldErrors=fields(parsed.error); return { ok:false, message:`Please check: ${Object.keys(fieldErrors).join(", ") || "the review form"}.`, fieldErrors }; }
  const context = await anonymousContext(); if (context.error || !context.supabase) return context.error!;
  const { error } = await context.supabase.rpc("submit_anonymous_review", { p_contributor_hash: context.contributorHash, p_professor_id: parsed.data.professorId, p_course_id: parsed.data.courseId, p_offering_id: parsed.data.offeringId, p_semester: parsed.data.semester, p_year: parsed.data.year, p_teaching_quality: parsed.data.teachingQuality, p_workload: parsed.data.workload, p_grading_difficulty: parsed.data.gradingDifficulty, p_would_take_again: parsed.data.wouldTakeAgain, p_attendance_importance: parsed.data.attendanceImportance, p_grade_status:parsed.data.gradeStatus, p_descriptors:parsed.data.descriptors, p_body: parsed.data.body, p_advice: parsed.data.advice || null, p_wish_known: parsed.data.wishKnown || null });
  if (error) return { ok:false, message: error.code === "23505" ? "This browser already reviewed that professor-course-semester combination." : error.message };
  revalidatePath("/"); return { ok:true, message:"Review published anonymously." };
}

export async function updateReviewAction(raw:unknown):Promise<ActionState>{
  const parsed=reviewEditSchema.safeParse(raw);if(!parsed.success){const fieldErrors=fields(parsed.error);return{ok:false,message:`Please check: ${Object.keys(fieldErrors).join(", ") || "the review form"}.`,fieldErrors};}
  const contributorHash=await getAnonymousContributorHash(false);const supabase=createAdminClient();if(!contributorHash||!supabase)return{ok:false,message:"This review is not connected to this browser."};
  const{reviewId,...values}=parsed.data;const{data,error}=await supabase.from("reviews").update({teaching_quality:values.teachingQuality,workload:values.workload,grading_difficulty:values.gradingDifficulty,would_take_again:values.wouldTakeAgain,attendance_importance:values.attendanceImportance,grade_status:values.gradeStatus,descriptors:values.descriptors,body:values.body,advice:values.advice||null,wish_known:values.wishKnown||null,updated_at:new Date().toISOString()}).eq("id",reviewId).eq("contributor_hash",contributorHash).select("id").maybeSingle();
  if(error)return{ok:false,message:error.message};if(!data)return{ok:false,message:"This review is not connected to this browser."};revalidatePath("/");revalidatePath("/dashboard");return{ok:true,message:"Review updated."};
}

export async function deleteReviewAction(reviewId:string):Promise<ActionState>{
  if(!/^[0-9a-f-]{36}$/i.test(reviewId))return{ok:false,message:"Invalid review."};
  const contributorHash=await getAnonymousContributorHash(false);const supabase=createAdminClient();if(!contributorHash||!supabase)return{ok:false,message:"This review is not connected to this browser."};
  const owned=await supabase.from("reviews").select("id").eq("id",reviewId).eq("contributor_hash",contributorHash).maybeSingle();if(!owned.data)return{ok:false,message:"This review is not connected to this browser."};
  await supabase.from("votes").delete().eq("target_type","review").eq("target_id",reviewId);await supabase.from("reports").delete().eq("target_type","review").eq("target_id",reviewId);
  const{error}=await supabase.from("reviews").delete().eq("id",reviewId).eq("contributor_hash",contributorHash);if(error)return{ok:false,message:error.message};revalidatePath("/");revalidatePath("/dashboard");return{ok:true,message:"Review deleted."};
}

export async function submitQuestionAction(raw: unknown): Promise<ActionState> {
  const parsed = questionSchema.safeParse(raw); if(!parsed.success) return {ok:false,message:"Review the question fields.",fieldErrors:fields(parsed.error)};
  const context=await anonymousContext(); if(context.error||!context.supabase) return context.error!;
  const rate=await context.supabase.rpc("check_anonymous_rate_limit",{p_contributor_hash:context.contributorHash,p_action:"question",p_max:8,p_window_seconds:86400}); if(rate.error)return{ok:false,message:rate.error.message};
  let courseId=parsed.data.courseId||null;let professorId=parsed.data.professorId||null;
  if(parsed.data.reviewId){const{data:review}=await context.supabase.from("reviews").select("course_id,professor_id").eq("id",parsed.data.reviewId).single();if(!review)return{ok:false,message:"That review could not be found."};courseId=review.course_id;professorId=review.professor_id;}
  const {error}=await context.supabase.from("questions").insert({title:parsed.data.title,body:parsed.data.body,course_id:courseId,professor_id:professorId,review_id:parsed.data.reviewId||null,contributor_hash:context.contributorHash});
  if(error) return {ok:false,message:error.message}; revalidatePath("/questions"); return {ok:true,message:"Question posted."};
}

export async function submitAnswerAction(raw: unknown): Promise<ActionState> { const parsed=answerSchema.safeParse(raw); if(!parsed.success) return {ok:false,message:"Answer must be 10–2,000 characters.",fieldErrors:fields(parsed.error)}; const context=await anonymousContext(); if(context.error||!context.supabase)return context.error!; const rate=await context.supabase.rpc("check_anonymous_rate_limit",{p_contributor_hash:context.contributorHash,p_action:"answer",p_max:20,p_window_seconds:86400});if(rate.error)return{ok:false,message:rate.error.message};const {error}=await context.supabase.from("answers").insert({question_id:parsed.data.questionId,body:parsed.data.body,parent_answer_id:parsed.data.parentAnswerId||null,contributor_hash:context.contributorHash}); if(error)return {ok:false,message:error.message}; revalidatePath(`/questions/${parsed.data.questionId}`); return {ok:true,message:"Answer posted anonymously."}; }

export async function voteAction(targetType:"review"|"question"|"answer",targetId:string):Promise<ActionState>{const context=await anonymousContext();if(context.error||!context.supabase)return context.error!;await context.supabase.from("votes").delete().eq("contributor_hash",context.contributorHash).eq("target_type",targetType).eq("target_id",targetId);const{error}=await context.supabase.from("votes").insert({contributor_hash:context.contributorHash,target_type:targetType,target_id:targetId,value:1});return error?{ok:false,message:error.message}:{ok:true,message:"Vote recorded."};}
export async function reportAction(raw:unknown):Promise<ActionState>{const parsed=reportSchema.safeParse(raw);if(!parsed.success)return{ok:false,message:"Select a report reason."};const context=await anonymousContext();if(context.error||!context.supabase)return context.error!;await context.supabase.from("reports").delete().eq("contributor_hash",context.contributorHash).eq("target_type",parsed.data.targetType).eq("target_id",parsed.data.targetId);const{error}=await context.supabase.from("reports").insert({target_type:parsed.data.targetType,target_id:parsed.data.targetId,reason:parsed.data.reason,details:parsed.data.details||null,contributor_hash:context.contributorHash});return error?{ok:false,message:error.message}:{ok:true,message:"Anonymous report recorded for operator review."};}
export async function setInterestAction(courseId:string,status:"interested"|"planning",semester:string,year:number):Promise<ActionState>{const context=await anonymousContext();if(context.error||!context.supabase)return context.error!;await context.supabase.from("course_interests").delete().eq("contributor_hash",context.contributorHash).eq("course_id",courseId).eq("semester",semester).eq("year",year);const{error}=await context.supabase.from("course_interests").insert({contributor_hash:context.contributorHash,course_id:courseId,status,semester,year});return error?{ok:false,message:error.message}:{ok:true,message:"Anonymous interest saved for this browser."};}
