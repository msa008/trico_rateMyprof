import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { demoCourses, demoDepartments, demoProfessors } from "@/lib/demo-data";
import { colleges } from "@/lib/config";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim().slice(0, 80) ?? "";
  if (q.length < 1) return NextResponse.json([]);
  const supabase = await createClient();
  if (supabase) { const { data, error } = await supabase.rpc("search_catalog", { search_term: q, result_limit: 12 }); return NextResponse.json(error ? [] : data, { headers: { "Cache-Control": "public, max-age=30" } }); }
  const lq = q.toLowerCase();
  const results = [
    ...demoProfessors.filter((p) => `${p.display_name} ${p.department_name}`.toLowerCase().includes(lq)).map((p) => ({ id: p.id, type: "professor", title: p.display_name, subtitle: `${p.department_name} · ${p.college_name}`, slug: p.slug })),
    ...demoCourses.filter((c) => `${c.code} ${c.title}`.toLowerCase().includes(lq)).map((c) => ({ id: c.id, type: "course", title: `${c.code}: ${c.title}`, subtitle: `${c.department_name} · ${c.college_name}`, slug: c.slug })),
    ...demoDepartments.filter((d) => `${d.name} ${d.code}`.toLowerCase().includes(lq)).map((d) => ({ id: d.code, type: "department", title: d.name, subtitle: `${d.code} department`, slug: d.code.toLowerCase() })),
    ...colleges.filter((c) => c.name.toLowerCase().includes(lq)).map((c) => ({ id: c.slug, type: "college", title: c.name, subtitle: "College directory", slug: c.slug })),
  ].slice(0, 12);
  return NextResponse.json(results);
}
