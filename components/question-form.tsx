"use client";
import {zodResolver} from "@hookform/resolvers/zod";
import {useRouter} from "next/navigation";
import {useForm} from "react-hook-form";
import {useState} from "react";
import {z} from "zod";
import {ShieldCheck} from "lucide-react";
import {submitQuestionAction} from "@/app/actions";
import {questionSchema} from "@/lib/validation";
import {Button} from "./ui/button";
import {Input} from "./ui/input";
import {Label} from "./ui/label";
import {Textarea} from "./ui/textarea";

type V=z.input<typeof questionSchema>;
export function QuestionForm({courseId="",professorId="",reviewId=""}:{courseId?:string;professorId?:string;reviewId?:string}){
  const router=useRouter();const[result,setResult]=useState<{ok:boolean;message:string}|null>(null);
  const{register,handleSubmit,formState:{errors,isSubmitting}}=useForm<V>({resolver:zodResolver(questionSchema),defaultValues:{courseId,professorId,reviewId,title:"",body:""}});
  return <form className="grid gap-5" onSubmit={handleSubmit(async values=>{const response=await submitQuestionAction(values);if(response.ok&&response.redirectTo){router.push(response.redirectTo);return}setResult(response)})}>
    <input type="hidden" {...register("courseId")}/><input type="hidden" {...register("professorId")}/><input type="hidden" {...register("reviewId")}/>
    <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><ShieldCheck className="mt-0.5 size-5 shrink-0"/><p><strong>Ask about the academic experience.</strong><br/>Do not include insults, harassment, rumors, threats, names of other students, or anyone’s private contact information.</p></div>
    <div><Label>Question</Label><Input {...register("title")} placeholder="Example: How much math is used on the exams?"/><Err text={errors.title?.message}/></div>
    <div><Label>More details <span className="font-normal text-[#667085]">(optional)</span></Label><p className="mb-2 text-xs text-[#667085]">Add background only if it helps others understand what you are asking.</p><Textarea rows={5} {...register("body")} placeholder="Example: I’m deciding whether to take this alongside two lab courses."/><Err text={errors.body?.message}/></div>
    {result&&<p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{result.message}</p>}
    <Button disabled={isSubmitting}>{isSubmitting?"Posting…":"Post anonymous question"}</Button>
  </form>
}
function Err({text}:{text?:string}){return text?<p className="mt-1 text-xs text-red-600">{text}</p>:null}
