"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { answerSchema, questionSchema, reportSchema, reviewSchema, signUpSchema } from "@/lib/validation";

export type ActionState = { ok: boolean; message: string; fieldErrors?: Record<string, string[]> };
const setupError: ActionState = { ok: false, message: "Supabase is not configured yet. Add the environment variables to enable submissions." };

function fields(error: { flatten: () => { fieldErrors: Record<string, string[]> } }) { return error.flatten().fieldErrors; }
async function verifiedUser() {
  const supabase = await createClient(); if (!supabase) return { supabase: null, user: null, error: setupError };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, error: { ok: false, message: "Sign in with your verified college email to contribute." } as ActionState };
  if (!user.email_confirmed_at) return { supabase, user: null, error: { ok: false, message: "Verify your email before contributing." } as ActionState };
  const { data: profile } = await supabase.from("private_profiles").select("is_suspended").eq("user_id", user.id).single();
  if (profile?.is_suspended) return { supabase, user: null, error: { ok: false, message: "This account is suspended." } as ActionState };
  return { supabase, user, error: null };
}

export async function signUpAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signUpSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { ok: false, message: "Check the highlighted fields.", fieldErrors: fields(parsed.error) };
  const supabase = await createClient(); if (!supabase) return setupError;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.signUp({ email: parsed.data.email, password: parsed.data.password, options: { emailRedirectTo: `${siteUrl}/auth/callback` } });
  return error ? { ok: false, message: error.message } : { ok: true, message: "Check your college inbox to verify your account." };
}

export async function signInAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signUpSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { ok: false, message: "Enter a valid college email and password.", fieldErrors: fields(parsed.error) };
  const supabase = await createClient(); if (!supabase) return setupError;
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { ok: false, message: "Email or password is incorrect, or the account is not verified." };
  redirect("/dashboard");
}

export async function signOutAction() { const supabase = await createClient(); if (supabase) await supabase.auth.signOut(); redirect("/"); }

export async function submitReviewAction(raw: unknown): Promise<ActionState> {
  const parsed = reviewSchema.safeParse(raw); if (!parsed.success) return { ok:false, message:"Review the form fields.", fieldErrors: fields(parsed.error) };
  const auth = await verifiedUser(); if (auth.error || !auth.supabase || !auth.user) return auth.error!;
  const { data, error } = await auth.supabase.rpc("submit_review", { p_professor_id: parsed.data.professorId, p_course_id: parsed.data.courseId, p_offering_id: parsed.data.offeringId, p_semester: parsed.data.semester, p_year: parsed.data.year, p_teaching_quality: parsed.data.teachingQuality, p_workload: parsed.data.workload, p_grading_difficulty: parsed.data.gradingDifficulty, p_would_take_again: parsed.data.wouldTakeAgain, p_attendance_importance: parsed.data.attendanceImportance, p_body: parsed.data.body, p_advice: parsed.data.advice || null, p_wish_known: parsed.data.wishKnown || null });
  if (error) return { ok:false, message: error.code === "23505" ? "You already reviewed this professor-course-semester combination." : error.message };
  revalidatePath("/"); return { ok:true, message:`Review published anonymously${data ? "." : "."}` };
}

export async function submitQuestionAction(raw: unknown): Promise<ActionState> {
  const parsed = questionSchema.safeParse(raw); if(!parsed.success) return {ok:false,message:"Review the question fields.",fieldErrors:fields(parsed.error)};
  const auth=await verifiedUser(); if(auth.error||!auth.supabase||!auth.user) return auth.error!;
  const {error}=await auth.supabase.from("questions").insert({title:parsed.data.title,body:parsed.data.body,course_id:parsed.data.courseId||null,professor_id:parsed.data.professorId||null,review_id:parsed.data.reviewId||null,author_id:auth.user.id});
  if(error) return {ok:false,message:error.message}; revalidatePath("/questions"); return {ok:true,message:"Question posted."};
}

export async function submitAnswerAction(raw: unknown): Promise<ActionState> { const parsed=answerSchema.safeParse(raw); if(!parsed.success) return {ok:false,message:"Answer must be 10–2,000 characters.",fieldErrors:fields(parsed.error)}; const auth=await verifiedUser(); if(auth.error||!auth.supabase||!auth.user)return auth.error!; const {error}=await auth.supabase.from("answers").insert({question_id:parsed.data.questionId,body:parsed.data.body,parent_answer_id:parsed.data.parentAnswerId||null,author_id:auth.user.id}); if(error)return {ok:false,message:error.message}; revalidatePath(`/questions/${parsed.data.questionId}`); return {ok:true,message:"Answer posted."}; }

export async function voteAction(targetType:"review"|"question"|"answer",targetId:string):Promise<ActionState>{ const auth=await verifiedUser(); if(auth.error||!auth.supabase||!auth.user)return auth.error!; const {error}=await auth.supabase.from("votes").upsert({user_id:auth.user.id,target_type:targetType,target_id:targetId,value:1},{onConflict:"user_id,target_type,target_id"}); return error?{ok:false,message:error.message}:{ok:true,message:"Vote recorded."}; }
export async function reportAction(raw:unknown):Promise<ActionState>{const parsed=reportSchema.safeParse(raw);if(!parsed.success)return{ok:false,message:"Select a report reason."};const auth=await verifiedUser();if(auth.error||!auth.supabase||!auth.user)return auth.error!;const{error}=await auth.supabase.from("reports").insert({...parsed.data,reporter_id:auth.user.id});return error?{ok:false,message:error.message}:{ok:true,message:"Report sent to moderators."};}
export async function deleteReviewAction(id:string){const auth=await verifiedUser();if(auth.error||!auth.supabase)return;await auth.supabase.from("reviews").delete().eq("id",id);revalidatePath("/dashboard");}
export async function setInterestAction(courseId:string,status:"interested"|"planning",semester:string,year:number):Promise<ActionState>{const auth=await verifiedUser();if(auth.error||!auth.supabase||!auth.user)return auth.error!;const{error}=await auth.supabase.from("course_interests").upsert({user_id:auth.user.id,course_id:courseId,status,semester,year},{onConflict:"user_id,course_id,semester,year"});return error?{ok:false,message:error.message}:{ok:true,message:"Private interest saved."};}

export async function updateNotificationPreferences(enabled:boolean,emailEnabled:boolean):Promise<ActionState>{const auth=await verifiedUser();if(auth.error||!auth.supabase||!auth.user)return auth.error!;const{error}=await auth.supabase.from("private_profiles").update({notifications_enabled:enabled,email_notifications_enabled:emailEnabled,updated_at:new Date().toISOString()}).eq("user_id",auth.user.id);return error?{ok:false,message:error.message}:{ok:true,message:"Preferences saved."};}
export async function deleteAccountAction(){const auth=await verifiedUser();if(auth.error||!auth.user)return;const admin=createAdminClient();if(!admin)throw new Error("Server-side account deletion is not configured.");const{error}=await admin.auth.admin.deleteUser(auth.user.id);if(error)throw new Error(error.message);redirect("/");}
export async function updateReviewAction(id:string,formData:FormData){const auth=await verifiedUser();if(auth.error||!auth.supabase)return;const body=String(formData.get("body")??"").trim();const advice=String(formData.get("advice")??"").trim();if(body.length<80||body.length>3000)return;await auth.supabase.from("reviews").update({body,advice:advice||null,updated_at:new Date().toISOString()}).eq("id",id);revalidatePath("/dashboard");redirect("/dashboard");}
export async function moderateContentAction(targetType:"review"|"question"|"answer",targetId:string,decision:"hidden"|"visible"|"removed",reason:string){const supabase=await createClient();if(!supabase)return;const{data:{user}}=await supabase.auth.getUser();if(!user)return;const{data:role}=await supabase.from("user_roles").select("role").eq("user_id",user.id).single();if(!role||!["admin","moderator"].includes(role.role))return;const table=targetType==="review"?"reviews":targetType==="question"?"questions":"answers";await supabase.from(table).update({status:decision}).eq("id",targetId);await supabase.from("moderation_actions").insert({moderator_id:user.id,target_type:targetType,target_id:targetId,action:decision,reason});await supabase.from("reports").update({status:"resolved",resolved_at:new Date().toISOString(),assigned_to:user.id}).eq("target_type",targetType).eq("target_id",targetId);revalidatePath("/admin");}
export async function suspendContentAuthorAction(targetType:"review"|"question"|"answer",targetId:string){const supabase=await createClient();if(!supabase)return;const{data:{user}}=await supabase.auth.getUser();if(!user)return;const{data:role}=await supabase.from("user_roles").select("role").eq("user_id",user.id).single();if(!role||!["admin","moderator"].includes(role.role))return;const table=targetType==="review"?"reviews":targetType==="question"?"questions":"answers";const{data:content}=await supabase.from(table).select("author_id").eq("id",targetId).single();if(!content?.author_id)return;await supabase.from("private_profiles").update({is_suspended:true,updated_at:new Date().toISOString()}).eq("user_id",content.author_id);await supabase.from("moderation_actions").insert({moderator_id:user.id,target_type:targetType,target_id:targetId,account_id:content.author_id,action:"suspend_account",reason:"Account suspended from a reviewed report"});revalidatePath("/admin");}
