"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { updateReviewAction } from "@/app/actions";
import { gradeStatuses, reviewDescriptors, reviewEditSchema } from "@/lib/validation";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

type Values=z.input<typeof reviewEditSchema>;type Parsed=z.output<typeof reviewEditSchema>;
type OwnedReview={id:string;teaching_quality:number;workload:number;grading_difficulty:number;would_take_again:boolean;attendance_importance:string;grade_status:string;descriptors:string[];body:string;advice:string|null;wish_known:string|null};

export function ReviewEditor({review}:{review:OwnedReview}){
  const router=useRouter();
  const{register,handleSubmit,formState:{errors,isSubmitting}}=useForm<Values,unknown,Parsed>({resolver:zodResolver(reviewEditSchema),defaultValues:{reviewId:review.id,teachingQuality:review.teaching_quality,workload:review.workload,gradingDifficulty:review.grading_difficulty,wouldTakeAgain:review.would_take_again?"yes":"no",attendanceImportance:review.attendance_importance as Values["attendanceImportance"],gradeStatus:review.grade_status as Values["gradeStatus"],descriptors:review.descriptors as Values["descriptors"],body:review.body,advice:review.advice??"",wishKnown:review.wish_known??""}});
  return <form className="mt-8 grid gap-6" onSubmit={handleSubmit(async values=>{const result=await updateReviewAction(values);if(result.ok){router.push("/dashboard");router.refresh()}else window.alert(result.message)})}>
    <input type="hidden" {...register("reviewId")}/>
    <section className="rounded-2xl border border-[#e5e8ef] bg-white p-5 sm:p-7">
      <h2 className="text-lg font-bold">Ratings and details</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-3"><Rating label="Teaching quality" name="teachingQuality" register={register}/><Rating label="Workload" name="workload" register={register}/><Rating label="Grading difficulty" name="gradingDifficulty" register={register}/></div>
      <div className="mt-5 grid gap-4 sm:grid-cols-3"><Field label="Would you take this professor again?"><select {...register("wouldTakeAgain")} className="focus-ring h-11 w-full rounded-xl border border-[#dfe3ec] bg-white px-3"><option value="yes">Yes</option><option value="no">No</option></select></Field><Field label="Attendance"><select {...register("attendanceImportance")} className="focus-ring h-11 w-full rounded-xl border border-[#dfe3ec] bg-white px-3"><option>Not important</option><option>Somewhat important</option><option>Very important</option><option>Required</option></select></Field><Field label="Grade received"><select {...register("gradeStatus")} className="focus-ring h-11 w-full rounded-xl border border-[#dfe3ec] bg-white px-3">{gradeStatuses.map(grade=><option key={grade}>{grade}</option>)}</select></Field></div>
      <div className="mt-6"><Label>Describe the professor and class <span className="font-normal text-[#667085]">(choose up to five)</span></Label><div className="mt-2 flex flex-wrap gap-2">{reviewDescriptors.map(descriptor=><label key={descriptor} className="cursor-pointer"><input type="checkbox" value={descriptor} {...register("descriptors")} className="peer sr-only"/><span className="inline-flex rounded-full border border-[#dfe3ec] bg-white px-3 py-1.5 text-sm font-medium text-[#475467] peer-checked:border-[#a91d35] peer-checked:bg-[#fbf0f2] peer-checked:text-[#8f182d]">{descriptor}</span></label>)}</div>{errors.descriptors&&<p className="mt-2 text-xs text-red-600">{errors.descriptors.message}</p>}</div>
    </section>
    <section className="rounded-2xl border border-[#e5e8ef] bg-white p-5 sm:p-7"><Field label="How was your experience with this professor and class?" error={errors.body?.message}><Textarea {...register("body")} maxLength={3000} rows={8}/></Field><div className="mt-5"><Field label="Advice for future students (optional)" error={errors.advice?.message}><Textarea {...register("advice")} maxLength={1000}/></Field></div></section>
    <div className="flex flex-wrap gap-3"><Button disabled={isSubmitting}>{isSubmitting?"Saving…":"Save changes"}</Button><Button type="button" variant="secondary" onClick={()=>router.push("/dashboard")}>Cancel</Button></div>
  </form>
}

function Field({label,error,children}:{label:string;error?:string;children:React.ReactNode}){return <div><Label>{label}</Label>{children}{error&&<p className="mt-1 text-xs text-red-600">{error}</p>}</div>}
function Rating({label,name,register}:{label:string;name:"teachingQuality"|"workload"|"gradingDifficulty";register:ReturnType<typeof useForm<Values,unknown,Parsed>>["register"]}){return <Field label={label}><div className="flex gap-1">{[1,2,3,4,5].map(value=><label key={value} className="flex-1 cursor-pointer"><input className="peer sr-only" type="radio" value={value} {...register(name)}/><span className="grid h-10 place-items-center rounded-lg border border-[#dfe3ec] text-sm font-bold peer-checked:border-[#a91d35] peer-checked:bg-[#fbf0f2] peer-checked:text-[#a91d35]">{value}</span></label>)}</div></Field>}
