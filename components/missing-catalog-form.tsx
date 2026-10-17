"use client";
import { useState } from "react";
import { PlusCircle } from "lucide-react";
import { createCommunityCatalogOptionAction } from "@/app/actions";
import type { ReviewOption } from "@/lib/types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

const fieldClass="focus-ring h-11 w-full rounded-xl border border-[#dfe3ec] bg-white px-3";

export function MissingCatalogForm({onCreated}:{onCreated:(option:ReviewOption)=>void}){
  const[pending,setPending]=useState(false);const[result,setResult]=useState<{ok:boolean;message:string}|null>(null);
  async function submit(formData:FormData){
    setPending(true);setResult(null);
    const response=await createCommunityCatalogOptionAction(Object.fromEntries(formData));
    setPending(false);setResult(response);if(response.ok&&response.option)onCreated(response.option);
  }
  return <div className="mt-4 rounded-xl border border-dashed border-[#b9c6ed] bg-[#f7f9ff] p-4">
    <div className="flex gap-3"><PlusCircle className="mt-0.5 size-5 shrink-0 text-[#3159d7]"/><div><h3 className="font-semibold">Add a missing class or professor</h3><p className="mt-1 text-sm text-[#667085]">Use the official catalog spelling when possible. This will be labeled “Community-added” until it is checked.</p></div></div>
    <form action={submit} className="mt-4 grid gap-4 sm:grid-cols-2">
      <div><Label>College</Label><select name="collegeSlug" className={fieldClass} required><option value="haverford">Haverford College</option><option value="bryn-mawr">Bryn Mawr College</option><option value="swarthmore">Swarthmore College</option></select></div>
      <div><Label>Course code</Label><Input name="courseCode" placeholder="Example: ECON H105" required/><p className="mt-1 text-xs text-[#667085]">Examples: ECON H105 · MATH B101 · CPSC 021</p></div>
      <div><Label>Course title</Label><Input name="courseTitle" placeholder="Example: Introduction to Economics" required/></div>
      <div><Label>Professor’s full name</Label><Input name="professorName" placeholder="Example: Jordan Lee" required/></div>
      <div><Label>Semester</Label><select name="semester" className={fieldClass} required><option>Fall</option><option>Spring</option><option>Summer</option></select></div>
      <div><Label>Year</Label><Input name="year" type="number" min="2000" max="2100" defaultValue={new Date().getFullYear()} required/></div>
      <div className="sm:col-span-2"><Button type="submit" disabled={pending}>{pending?"Adding…":"Add and use this class"}</Button>{result&&!result.ok&&<p className="mt-2 text-sm text-red-700">{result.message}</p>}</div>
    </form>
  </div>;
}
