// @vitest-environment node
import{readFileSync}from"node:fs";import{describe,expect,it}from"vitest";
const sql=readFileSync("supabase/migrations/202610080001_initial_schema.sql","utf8");
describe("database privacy and authorization",()=>{
  it("omits owner identifiers from all public content views",()=>{for(const name of["public_reviews","public_questions","public_answers"]){const start=sql.indexOf(`create view public.${name}`);const end=sql.indexOf(";",start);expect(sql.slice(start,end)).not.toMatch(/author_id|user_id|email/i)}});
  it("enables RLS on every private and user-generated table",()=>{for(const table of["private_profiles","user_roles","reviews","review_aliases","questions","answers","votes","course_interests","notifications","reports","moderation_actions"]){expect(sql).toContain(`alter table public.${table} enable row level security`)}});
  it("prevents duplicate reviews and votes",()=>{expect(sql).toContain("unique(author_id,professor_id,course_id,semester,year)");expect(sql).toContain("unique(user_id,target_type,target_id)")});
  it("requires verified students for review submission and contribution policies",()=>{expect(sql).toContain("if not public.is_verified_student()");expect(sql).toContain("verified_question_insert");expect(sql).toContain("verified_answer_insert")});
  it("does not expose role self-assignment",()=>{expect(sql).not.toMatch(/create policy .*user_roles for (insert|update)/i);expect(sql).toContain("role in ('moderator','admin')")});
  it("protects public API from base review ownership",()=>{expect(sql).toContain("revoke select on public.reviews");expect(sql).toContain("grant select on public.public_reviews")});
  it("creates per-review aliases and keeps reviewer replies consistent",()=>{expect(sql).toContain("insert into public.review_aliases");expect(sql).toContain("r.author_id=new.author_id")});
  it("covers voting, reporting, moderation, and rate limiting",()=>{expect(sql).toContain("own_votes_all");expect(sql).toContain("verified_report_insert");expect(sql).toContain("moderator_reports_update");expect(sql).toContain("check_rate_limit")});
});
