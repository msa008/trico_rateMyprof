"use client";
import{useMemo,useState}from"react";
import type{Review}from"@/lib/types";
import{ReviewCard}from"./review-card";

export function ProfessorReviewList({reviews}:{reviews:Review[]}){const[sort,setSort]=useState("recent");const sorted=useMemo(()=>[...reviews].sort((a,b)=>sort==="helpful"?b.helpful_count-a.helpful_count:sort==="highest"?b.teaching_quality-a.teaching_quality:new Date(b.created_at).getTime()-new Date(a.created_at).getTime()),[reviews,sort]);return <><div className="flex justify-end"><select aria-label="Sort reviews" value={sort} onChange={event=>setSort(event.target.value)} className="focus-ring h-11 rounded-xl border border-[#d8dde6] bg-white px-4 text-sm"><option value="recent">Most recent</option><option value="helpful">Most helpful</option><option value="highest">Highest rating</option></select></div><div className="mt-5 grid gap-5">{sorted.map(review=><ReviewCard key={review.id} review={review}/>)}</div></>}
