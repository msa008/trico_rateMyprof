"use client";
import Link from "next/link";
import { Pencil,Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState,useTransition } from "react";
import { deleteReviewAction } from "@/app/actions";
import { Button } from "./ui/button";

export function ReviewManagementButtons({reviewId}:{reviewId:string}){const router=useRouter();const[pending,startTransition]=useTransition();const[error,setError]=useState("");return <div><div className="flex flex-wrap gap-2"><Button asChild variant="secondary" size="sm"><Link href={`/dashboard/reviews/${reviewId}/edit`}><Pencil className="size-4"/>Edit</Link></Button><Button type="button" variant="danger" size="sm" disabled={pending} onClick={()=>{if(!window.confirm("Delete this review permanently? Questions connected directly to it will also be removed."))return;startTransition(async()=>{const result=await deleteReviewAction(reviewId);if(result.ok){router.refresh()}else setError(result.message)})}}><Trash2 className="size-4"/>{pending?"Deleting…":"Delete"}</Button></div>{error&&<p className="mt-2 text-xs text-red-600">{error}</p>}</div>}
