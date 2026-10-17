"use client";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useEffect,useState } from "react";

export function ActivityLink({mobile=false}:{mobile?:boolean}){
  const[unread,setUnread]=useState(0);
  useEffect(()=>{fetch("/api/activity-summary",{cache:"no-store"}).then(r=>r.json()).then(data=>setUnread(data.unread??0)).catch(()=>undefined)},[]);
  if(mobile)return <Link className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-[#f2f4f7]" href="/dashboard"><Bell className="size-4"/>Your activity{unread>0&&<span className="ml-auto rounded-full bg-[#3159d7] px-2 py-0.5 text-[11px] font-bold text-white">{unread}</span>}</Link>;
  return <Link className="focus-ring relative grid size-10 place-items-center rounded-xl text-[#475467] hover:bg-[#f2f4f7] hover:text-[#11182a]" href="/dashboard" aria-label="Your activity and notifications"><Bell className="size-[18px]"/>{unread>0&&<span className="absolute right-0.5 top-0.5 grid min-w-4 place-items-center rounded-full bg-[#3159d7] px-1 text-[9px] font-bold text-white">{unread}</span>}</Link>;
}
