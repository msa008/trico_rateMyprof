// @vitest-environment node
import{existsSync,readFileSync}from"node:fs";import{describe,expect,it}from"vitest";
const initial=readFileSync("supabase/migrations/202610080001_initial_schema.sql","utf8");
const anonymous=readFileSync("supabase/migrations/202610160001_remove_authentication.sql","utf8");
const catalogFeatures=readFileSync("supabase/migrations/202610170001_catalog_search_and_review_threads.sql","utf8");
const catalogData=readFileSync("supabase/migrations/202610170002_import_trico_catalog.sql","utf8");
const community=readFileSync("supabase/migrations/202610170003_community_catalog_and_anonymous_notifications.sql","utf8");
describe("database privacy and anonymous contributions",()=>{
  it("omits private identifiers from all public content views",()=>{for(const name of["public_reviews","public_questions","public_answers"]){const start=initial.indexOf(`create view public.${name}`);const end=initial.indexOf(";",start);expect(initial.slice(start,end)).not.toMatch(/author_id|user_id|email|contributor_hash/i)}});
  it("keeps row-level security on user-generated tables",()=>{for(const table of["reviews","review_aliases","questions","answers","votes","course_interests","reports"]){expect(initial).toContain(`alter table public.${table} enable row level security`)}});
  it("prevents duplicate anonymous reviews, votes, interests, and reports",()=>{for(const index of["anonymous_review_once","anonymous_vote_once","anonymous_interest_once","anonymous_report_once"]){expect(anonymous).toContain(`create unique index if not exists ${index}`)}});
  it("rate limits anonymous reviews, questions, and answers on the server",()=>{expect(anonymous).toContain("check_anonymous_rate_limit");expect(anonymous).toContain("'review',3,86400");expect(anonymous).toContain("revoke execute on function public.check_anonymous_rate_limit")});
  it("does not expose ownership tables through public reads",()=>{expect(initial).toContain("revoke select on public.reviews");expect(initial).toContain("grant select on public.public_reviews")});
  it("creates per-review aliases and reuses them only for matching reviewer replies",()=>{expect(anonymous).toContain("insert into public.review_aliases");expect(anonymous).toContain("r.contributor_hash=new.contributor_hash")});
  it("keeps anonymous mutations behind server-only functions",()=>{expect(anonymous).toContain("revoke execute on function public.submit_anonymous_review");expect(anonymous).toContain("from anon,authenticated")});
  it("has no login, account callback, dashboard, or browser auth client",()=>{for(const path of["app/login/page.tsx","app/auth/callback/route.ts","app/dashboard/page.tsx","lib/supabase/client.ts"]){expect(existsSync(path)).toBe(false)}});
  it("supports server-side review option search and review-linked public questions",()=>{expect(catalogFeatures).toContain("search_review_options");expect(catalogFeatures).toContain("q.review_id");expect(catalogFeatures).toContain("questions_review_created")});
  it("imports official catalog records without instructor email addresses",()=>{expect(catalogData).toContain("official public Tri-Co Course Search");expect(catalogData).not.toMatch(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/)});
  it("keeps community catalog creation server-only and visibly unverified",()=>{expect(community).toContain("catalog_verified");expect(community).toContain("'community',false");expect(community).toContain("to service_role");expect(community).toContain("'catalog_add',5,86400")});
  it("routes anonymous answers and review questions to hashed-browser notifications",()=>{expect(community).toContain("notify_anonymous_question");expect(community).toContain("notify_anonymous_answer");expect(community).toContain("contributor_hash")});
});
