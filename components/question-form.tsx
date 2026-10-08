"use client";
import {zodResolver} from "@hookform/resolvers/zod";
import {useForm} from "react-hook-form";
import {useState} from "react";
import {z} from "zod";
import {submitQuestionAction} from "@/app/actions";
import {questionSchema} from "@/lib/validation";
import {Button} from "./ui/button";import{Input}from"./ui/input";import{Label}from"./ui/label";import{Textarea}from"./ui/textarea";
type V=z.input<typeof questionSchema>;
export function QuestionForm({courseId="",professorId="",reviewId=""}:{courseId?:string;professorId?:string;reviewId?:string}){const[result,setResult]=useState<{ok:boolean;message:string}|null>(null);const{register,handleSubmit,formState:{errors,isSubmitting}}=useForm<V>({resolver:zodResolver(questionSchema),defaultValues:{courseId,professorId,reviewId,title:"",body:""}});return <form className="grid gap-5" onSubmit={handleSubmit(async v=>setResult(await submitQuestionAction(v)))}><input type="hidden" {...register("courseId")}/><input type="hidden" {...register("professorId")}/><input type="hidden" {...register("reviewId")}/><div><Label>Question</Label><Input {...register("title")} placeholder="Be specific enough that students can answer well."/><Err text={errors.title?.message}/></div><div><Label>Helpful context</Label><Textarea rows={7} {...register("body")} placeholder="What are you deciding, and what have you already found out?"/><Err text={errors.body?.message}/></div>{result&&<p className={`rounded-xl p-3 text-sm ${result.ok?"bg-green-50 text-green-800":"bg-red-50 text-red-700"}`}>{result.message}</p>}<Button disabled={isSubmitting}>{isSubmitting?"Posting…":"Post public question"}</Button></form>}
function Err({text}:{text?:string}){return text?<p className="mt-1 text-xs text-red-600">{text}</p>:null}
