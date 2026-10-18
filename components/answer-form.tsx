"use client";
import{useState}from"react";
import{useRouter}from"next/navigation";
import{submitAnswerAction}from"@/app/actions";
import{Button}from"./ui/button";
import{Textarea}from"./ui/textarea";
export function AnswerForm({questionId,parentAnswerId=""}:{questionId:string;parentAnswerId?:string}){const router=useRouter();const[body,setBody]=useState("");const[result,setResult]=useState<{ok:boolean;message:string}|null>(null);const[loading,setLoading]=useState(false);return <form onSubmit={async e=>{e.preventDefault();setLoading(true);const response=await submitAnswerAction({questionId,body,parentAnswerId});setResult(response);if(response.ok){setBody("");router.refresh()}setLoading(false)}}>{parentAnswerId&&<p className="mb-3 rounded-lg bg-[#fbf0f2] p-2 text-xs font-medium text-[#a91d35]">Replying in this answer thread</p>}<p className="mb-2 text-xs text-[#667085]">Answer from experience. Do not include harassment, rumors, student names, or private information.</p><Textarea value={body} onChange={e=>setBody(e.target.value)} placeholder="Share a clear, respectful, experience-based answer." rows={5}/>{result&&<p className={`mt-2 rounded-lg p-2 text-sm ${result.ok?"bg-green-50 text-green-800":"bg-red-50 text-red-700"}`}>{result.message}</p>}<Button className="mt-3" disabled={loading}>{loading?"Posting…":parentAnswerId?"Post reply":"Post answer"}</Button></form>}
