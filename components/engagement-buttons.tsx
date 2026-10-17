"use client";
import{useState,useTransition}from"react";
import{Flag,ThumbsUp,X}from"lucide-react";
import{reportAction,voteAction}from"@/app/actions";
import{Button}from"./ui/button";

const reasons=[
  ["harassment","Harassment or threats"],["spam","Spam"],["personal_information","Personal information"],
  ["misleading","Fake or misleading content"],["inappropriate","Inappropriate language"],["other","Other"],
] as const;

export function EngagementButtons({type,id,count=0}:{type:"review"|"question"|"answer";id:string;count?:number}){
  const[pending,start]=useTransition();const[message,setMessage]=useState("");const[reporting,setReporting]=useState(false);const[reason,setReason]=useState<(typeof reasons)[number][0]>("harassment");const[details,setDetails]=useState("");
  return <div>
    <div className="flex flex-wrap items-center gap-2"><Button variant="ghost" size="sm" disabled={pending} onClick={()=>start(async()=>setMessage((await voteAction(type,id)).message))}><ThumbsUp className="size-4"/>Helpful · {count}</Button><Button variant="ghost" size="sm" disabled={pending} onClick={()=>setReporting(value=>!value)}><Flag className="size-4"/>Report</Button>{message&&<span role="status" className="text-xs text-[#667085]">{message}</span>}</div>
    {reporting&&<div className="mt-3 max-w-lg rounded-xl border border-red-200 bg-red-50 p-4 text-sm"><div className="flex items-center justify-between"><strong className="text-red-950">Why are you reporting this?</strong><button type="button" onClick={()=>setReporting(false)} aria-label="Close report form"><X className="size-4"/></button></div><select value={reason} onChange={event=>setReason(event.target.value as typeof reason)} className="focus-ring mt-3 h-10 w-full rounded-lg border border-red-200 bg-white px-3">{reasons.map(([value,label])=><option value={value} key={value}>{label}</option>)}</select><textarea value={details} onChange={event=>setDetails(event.target.value)} maxLength={500} rows={2} className="focus-ring mt-2 w-full rounded-lg border border-red-200 bg-white p-3" placeholder="Optional details for the moderator"/><Button variant="danger" size="sm" disabled={pending} onClick={()=>start(async()=>{const result=await reportAction({targetType:type,targetId:id,reason,details});setMessage(result.message);if(result.ok)setReporting(false)})}>Submit report</Button><p className="mt-2 text-xs text-red-900">Reports are for safety or policy violations—not simply disagreeing with a negative opinion.</p></div>}
  </div>
}
