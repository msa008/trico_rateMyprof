import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import process from "node:process";

const inputPath = process.argv[2];
if (!inputPath) throw new Error("Usage: npm run catalog:import -- ./catalog.json");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment.");
const payload = JSON.parse(await readFile(inputPath, "utf8"));
if (!Array.isArray(payload.departments) || !Array.isArray(payload.professors) || !Array.isArray(payload.courses)) throw new Error("Catalog JSON needs departments, professors, and courses arrays.");
const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
for (const [table, rows] of [["departments", payload.departments], ["professors", payload.professors], ["courses", payload.courses], ["course_offerings", payload.offerings ?? []], ["professor_course_assignments", payload.assignments ?? []]]) {
  if (!rows.length) continue;
  const { error } = await supabase.from(table).upsert(rows, { onConflict: table === "departments" ? "college_id,code" : table === "courses" ? "college_id,code" : table === "professors" ? "slug" : undefined });
  if (error) throw new Error(`${table}: ${error.message}`);
  console.log(`Imported ${rows.length} ${table}.`);
}
console.log("Catalog import complete. Verify source_url and source_updated_at before publishing.");
