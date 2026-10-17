import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const professor = request.nextUrl.searchParams.get("professor") || null;
  const course = request.nextUrl.searchParams.get("course") || null;
  if (!query && !professor && !course) return NextResponse.json([]);
  const supabase = await createClient();
  if (!supabase) return NextResponse.json([]);
  const { data, error } = await supabase.rpc("search_review_options", {
    search_term: query,
    professor_filter: professor,
    course_filter: course,
    result_limit: 20,
  });
  return NextResponse.json(error ? [] : data, { headers: { "Cache-Control": "private, no-store" } });
}
