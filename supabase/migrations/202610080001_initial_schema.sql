-- TriCo Reviews initial schema. Apply with `supabase db push`.
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create type public.user_role as enum ('student','moderator','admin');
create type public.content_status as enum ('visible','hidden','removed');
create type public.target_type as enum ('review','question','answer');
create type public.report_status as enum ('open','reviewing','resolved','dismissed');
create type public.interest_status as enum ('interested','planning');

create table public.colleges (
  id uuid primary key default gen_random_uuid(), name text not null unique, slug text not null unique,
  short_name text not null unique, email_domains text[] not null default '{}', created_at timestamptz not null default now()
);
create table public.departments (
  id uuid primary key default gen_random_uuid(), college_id uuid not null references public.colleges on delete cascade,
  name text not null, code text not null, slug text not null, created_at timestamptz not null default now(),
  unique(college_id,code), unique(college_id,slug)
);
create table public.professors (
  id uuid primary key default gen_random_uuid(), college_id uuid not null references public.colleges,
  department_id uuid not null references public.departments, display_name text not null check(length(display_name) between 2 and 120),
  slug text not null unique, source_url text, source_updated_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.courses (
  id uuid primary key default gen_random_uuid(), college_id uuid not null references public.colleges,
  department_id uuid not null references public.departments, code text not null, title text not null,
  description text not null default '', slug text not null unique, source_url text, source_updated_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(college_id,code)
);
create table public.course_offerings (
  id uuid primary key default gen_random_uuid(), course_id uuid not null references public.courses on delete cascade,
  semester text not null check(semester in ('Fall','Spring','Summer')), year smallint not null check(year between 2000 and 2100),
  section text not null default '', created_at timestamptz not null default now(), unique(course_id,semester,year,section)
);
create table public.professor_course_assignments (
  id uuid primary key default gen_random_uuid(), professor_id uuid not null references public.professors on delete cascade,
  offering_id uuid not null references public.course_offerings on delete cascade, created_at timestamptz not null default now(),
  unique(professor_id,offering_id)
);

-- Private identity data. No public profile contains auth identifiers.
create table public.private_profiles (
  user_id uuid primary key references auth.users on delete cascade, college_id uuid references public.colleges,
  notifications_enabled boolean not null default true, email_notifications_enabled boolean not null default false,
  is_suspended boolean not null default false, deletion_requested_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.user_roles (
  user_id uuid primary key references auth.users on delete cascade, role public.user_role not null default 'student',
  granted_by uuid references auth.users, granted_at timestamptz not null default now()
);
create table public.rate_limits (
  id bigint generated always as identity primary key, user_id uuid not null references auth.users on delete cascade,
  action text not null, created_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(), author_id uuid not null references auth.users on delete cascade,
  professor_id uuid not null references public.professors, course_id uuid not null references public.courses,
  offering_id uuid not null references public.course_offerings, semester text not null check(semester in ('Fall','Spring','Summer')),
  year smallint not null check(year between 2000 and 2100), teaching_quality smallint not null check(teaching_quality between 1 and 5),
  workload smallint not null check(workload between 1 and 5), grading_difficulty smallint not null check(grading_difficulty between 1 and 5),
  would_take_again boolean not null, attendance_importance text not null check(attendance_importance in ('Not important','Somewhat important','Very important','Required')),
  body text not null check(length(body) between 80 and 3000), advice text check(length(advice)<=1000), wish_known text check(length(wish_known)<=1000),
  status public.content_status not null default 'visible', created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(author_id,professor_id,course_id,semester,year)
);
create table public.review_aliases (
  review_id uuid primary key references public.reviews on delete cascade, alias text not null unique check(alias ~ '^[a-z]+[a-z]+[0-9]{3}$'),
  created_at timestamptz not null default now()
);
create table public.questions (
  id uuid primary key default gen_random_uuid(), author_id uuid not null references auth.users on delete cascade,
  title text not null check(length(title) between 10 and 160), body text not null check(length(body) between 20 and 2000),
  college_id uuid references public.colleges, department_id uuid references public.departments, professor_id uuid references public.professors,
  course_id uuid references public.courses, review_id uuid references public.reviews on delete cascade,
  status public.content_status not null default 'visible', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.question_aliases (
  question_id uuid primary key references public.questions on delete cascade, alias text not null,
  unique(question_id,alias)
);
create table public.answers (
  id uuid primary key default gen_random_uuid(), question_id uuid not null references public.questions on delete cascade,
  author_id uuid not null references auth.users on delete cascade, parent_answer_id uuid references public.answers on delete cascade,
  body text not null check(length(body) between 10 and 2000), status public.content_status not null default 'visible',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.answer_aliases (
  answer_id uuid primary key references public.answers on delete cascade, alias text not null
);
create table public.votes (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade,
  target_type public.target_type not null, target_id uuid not null, value smallint not null default 1 check(value=1),
  created_at timestamptz not null default now(), unique(user_id,target_type,target_id)
);
create table public.course_interests (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade,
  course_id uuid not null references public.courses on delete cascade, status public.interest_status not null,
  semester text not null check(semester in ('Fall','Spring','Summer')), year smallint not null check(year between 2000 and 2100),
  created_at timestamptz not null default now(), unique(user_id,course_id,semester,year)
);
create table public.notifications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade,
  type text not null, title text not null, body text not null, target_path text, read_at timestamptz, created_at timestamptz not null default now()
);
create table public.reports (
  id uuid primary key default gen_random_uuid(), reporter_id uuid not null references auth.users on delete cascade,
  target_type public.target_type not null, target_id uuid not null, reason text not null check(reason in ('harassment','spam','personal_information','misleading','inappropriate','other')),
  details text check(length(details)<=500), status public.report_status not null default 'open', assigned_to uuid references auth.users,
  created_at timestamptz not null default now(), resolved_at timestamptz, unique(reporter_id,target_type,target_id)
);
create table public.moderation_actions (
  id uuid primary key default gen_random_uuid(), moderator_id uuid not null references auth.users,
  target_type public.target_type, target_id uuid, account_id uuid references auth.users, action text not null,
  reason text not null check(length(reason) between 5 and 1000), metadata jsonb not null default '{}', created_at timestamptz not null default now()
);

create index professors_name_trgm on public.professors using gin(display_name gin_trgm_ops);
create index courses_search_trgm on public.courses using gin((code||' '||title) gin_trgm_ops);
create index departments_name_trgm on public.departments using gin((code||' '||name) gin_trgm_ops);
create index reviews_professor_created on public.reviews(professor_id,created_at desc) where status='visible';
create index reviews_course_created on public.reviews(course_id,created_at desc) where status='visible';
create index questions_created on public.questions(created_at desc) where status='visible';
create index answers_question_created on public.answers(question_id,created_at) where status='visible';
create index notifications_user_unread on public.notifications(user_id,created_at desc) where read_at is null;
create index reports_open on public.reports(created_at) where status='open';
create index rate_limits_lookup on public.rate_limits(user_id,action,created_at desc);

create or replace function public.is_verified_student() returns boolean language sql stable security definer set search_path='' as $$
  select auth.uid() is not null
    and coalesce((auth.jwt()->>'email_verified')::boolean,false)
    and split_part(lower(auth.jwt()->>'email'),'@',2) = any(array['haverford.edu','brynmawr.edu','swarthmore.edu'])
    and not exists(select 1 from public.private_profiles p where p.user_id=auth.uid() and p.is_suspended);
$$;
create or replace function public.is_moderator() returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.user_roles r where r.user_id=auth.uid() and r.role in ('moderator','admin'));
$$;
create or replace function public.check_rate_limit(p_action text,p_max int,p_window interval) returns void language plpgsql security definer set search_path='' as $$
begin
  if (select count(*) from public.rate_limits where user_id=auth.uid() and action=p_action and created_at>now()-p_window)>=p_max then raise exception 'Rate limit exceeded. Please try again later.' using errcode='P0001'; end if;
  insert into public.rate_limits(user_id,action) values(auth.uid(),p_action);
end; $$;
create or replace function public.random_alias() returns text language plpgsql volatile security definer set search_path='' as $$
declare adjectives text[]:=array['quiet','blue','maple','bright','calm','silver','kind','swift','north','clever']; animals text[]:=array['otter','fox','badger','finch','heron','moth','orbit','cedar','wren','panda']; candidate text;
begin loop candidate:=adjectives[1+floor(random()*array_length(adjectives,1))::int]||animals[1+floor(random()*array_length(animals,1))::int]||lpad(floor(random()*1000)::int::text,3,'0'); exit when not exists(select 1 from public.review_aliases where alias=candidate); end loop; return candidate; end; $$;

create or replace function public.submit_review(p_professor_id uuid,p_course_id uuid,p_offering_id uuid,p_semester text,p_year int,p_teaching_quality int,p_workload int,p_grading_difficulty int,p_would_take_again boolean,p_attendance_importance text,p_body text,p_advice text,p_wish_known text) returns uuid language plpgsql security definer set search_path='' as $$
declare new_id uuid;
begin
  if not public.is_verified_student() then raise exception 'Verified student account required'; end if;
  perform public.check_rate_limit('review',3,interval '24 hours');
  if not exists(select 1 from public.professor_course_assignments a join public.course_offerings o on o.id=a.offering_id where a.professor_id=p_professor_id and o.id=p_offering_id and o.course_id=p_course_id) then raise exception 'Professor/course offering mismatch'; end if;
  insert into public.reviews(author_id,professor_id,course_id,offering_id,semester,year,teaching_quality,workload,grading_difficulty,would_take_again,attendance_importance,body,advice,wish_known)
  values(auth.uid(),p_professor_id,p_course_id,p_offering_id,p_semester,p_year,p_teaching_quality,p_workload,p_grading_difficulty,p_would_take_again,p_attendance_importance,p_body,nullif(p_advice,''),nullif(p_wish_known,'')) returning id into new_id;
  insert into public.review_aliases(review_id,alias) values(new_id,public.random_alias()); return new_id;
end; $$;

create or replace function public.assign_content_alias() returns trigger language plpgsql security definer set search_path='' as $$
declare linked_alias text;
begin
  if tg_table_name='questions' then insert into public.question_aliases(question_id,alias) values(new.id,public.random_alias()); perform public.check_rate_limit('question',8,interval '24 hours');
  elsif tg_table_name='answers' then
    select ra.alias into linked_alias from public.questions q join public.reviews r on r.id=q.review_id join public.review_aliases ra on ra.review_id=r.id where q.id=new.question_id and r.author_id=new.author_id;
    insert into public.answer_aliases(answer_id,alias) values(new.id,coalesce(linked_alias,public.random_alias())); perform public.check_rate_limit('answer',20,interval '24 hours');
  end if; return new;
end; $$;
create trigger questions_alias after insert on public.questions for each row execute function public.assign_content_alias();
create trigger answers_alias after insert on public.answers for each row execute function public.assign_content_alias();

create or replace function public.notify_on_answer() returns trigger language plpgsql security definer set search_path='' as $$
declare q_author uuid; r_author uuid; review_author uuid;
begin select author_id into q_author from public.questions where id=new.question_id; if q_author<>new.author_id then insert into public.notifications(user_id,type,title,body,target_path) values(q_author,'question_answer','Your question has a new answer','A student answered your public question.','/questions/'||new.question_id); end if;
  select r.author_id into review_author from public.questions q join public.reviews r on r.id=q.review_id where q.id=new.question_id; if review_author is not null and review_author<>new.author_id and review_author<>q_author then insert into public.notifications(user_id,type,title,body,target_path) values(review_author,'review_reply','Someone asked about your review','A public follow-up has a new answer.','/questions/'||new.question_id); end if;
  if new.parent_answer_id is not null then select author_id into r_author from public.answers where id=new.parent_answer_id; if r_author<>new.author_id and r_author<>q_author then insert into public.notifications(user_id,type,title,body,target_path) values(r_author,'answer_reply','Someone replied to your answer','A student continued the discussion.','/questions/'||new.question_id); end if; end if; return new; end; $$;
create trigger answer_notifications after insert on public.answers for each row execute function public.notify_on_answer();

-- Public-safe views intentionally omit every auth identifier and ownership mapping.
create view public.public_reviews with (security_barrier=true) as
select r.id,r.professor_id,r.course_id,p.display_name professor_name,p.slug professor_slug,c.code course_code,c.slug course_slug,col.slug college_slug,ra.alias,r.semester,r.year,r.teaching_quality,r.workload,r.grading_difficulty,r.would_take_again,r.attendance_importance,r.body,r.advice,r.wish_known,
  (select count(*)::int from public.votes v where v.target_type='review' and v.target_id=r.id) helpful_count,r.created_at
from public.reviews r join public.review_aliases ra on ra.review_id=r.id join public.professors p on p.id=r.professor_id join public.courses c on c.id=r.course_id join public.colleges col on col.id=c.college_id where r.status='visible';
create view public.professor_rating_summaries with (security_barrier=true) as
select p.id,p.slug,p.display_name,col.name college_name,col.slug college_slug,d.name department_name,d.code department_code,
  round(avg(r.teaching_quality)::numeric,1)::float8 overall_rating,round(avg(r.teaching_quality)::numeric,1)::float8 teaching_quality,
  round(avg(r.workload)::numeric,1)::float8 workload,round(avg(r.grading_difficulty)::numeric,1)::float8 grading_difficulty,
  round(100*avg(case when r.would_take_again then 1 else 0 end)::numeric)::int would_take_again_pct,count(r.id)::int review_count,max(coalesce(r.updated_at,p.updated_at)) updated_at
from public.professors p join public.colleges col on col.id=p.college_id join public.departments d on d.id=p.department_id left join public.reviews r on r.professor_id=p.id and r.status='visible' group by p.id,col.name,col.slug,d.name,d.code;
create view public.course_rating_summaries with (security_barrier=true) as
select c.id,c.slug,c.code,c.title,c.description,col.name college_name,col.slug college_slug,d.name department_name,
  round(avg(r.workload)::numeric,1)::float8 workload,round(avg(r.grading_difficulty)::numeric,1)::float8 difficulty,count(r.id)::int review_count,
  (select count(*)::int from public.course_interests i where i.course_id=c.id and i.status='interested') interested_count,
  (select count(*)::int from public.course_interests i where i.course_id=c.id and i.status='planning') planning_count
from public.courses c join public.colleges col on col.id=c.college_id join public.departments d on d.id=c.department_id left join public.reviews r on r.course_id=c.id and r.status='visible' group by c.id,col.name,col.slug,d.name;
create view public.public_questions with (security_barrier=true) as
select q.id,q.title,q.body,qa.alias,col.name college_name,d.code department_code,c.code course_code,c.slug course_slug,p.display_name professor_name,q.course_id,q.professor_id,
  (select count(*)::int from public.answers a where a.question_id=q.id and a.status='visible') answer_count,
  (select count(*)::int from public.votes v where v.target_type='question' and v.target_id=q.id) helpful_count,q.created_at
from public.questions q join public.question_aliases qa on qa.question_id=q.id left join public.colleges col on col.id=q.college_id left join public.departments d on d.id=q.department_id left join public.courses c on c.id=q.course_id left join public.professors p on p.id=q.professor_id where q.status='visible';
create view public.public_answers with (security_barrier=true) as
select a.id,a.question_id,a.parent_answer_id,aa.alias,a.body,(select count(*)::int from public.votes v where v.target_type='answer' and v.target_id=a.id) helpful_count,a.created_at from public.answers a join public.answer_aliases aa on aa.answer_id=a.id where a.status='visible';
create view public.professor_courses_public as select distinct pca.professor_id,c.id,c.slug,c.code,c.title,c.description,col.name college_name,col.slug college_slug,d.name department_name,0::int review_count,null::float8 workload,null::float8 difficulty from public.professor_course_assignments pca join public.course_offerings o on o.id=pca.offering_id join public.courses c on c.id=o.course_id join public.colleges col on col.id=c.college_id join public.departments d on d.id=c.department_id;
create view public.course_professors_public as select distinct pca.professor_id,pca.offering_id,o.course_id,p.id,p.slug,p.display_name,col.name college_name,col.slug college_slug,d.name department_name,d.code department_code,null::float8 overall_rating,null::float8 teaching_quality,null::float8 workload,null::float8 grading_difficulty,null::int would_take_again_pct,0::int review_count from public.professor_course_assignments pca join public.professors p on p.id=pca.professor_id join public.course_offerings o on o.id=pca.offering_id join public.colleges col on col.id=p.college_id join public.departments d on d.id=p.department_id;
create view public.review_form_options as select pca.offering_id,pca.professor_id,p.display_name professor_name,o.course_id,c.code course_code,c.title course_title,col.name college_name,o.semester,o.year from public.professor_course_assignments pca join public.professors p on p.id=pca.professor_id join public.course_offerings o on o.id=pca.offering_id join public.courses c on c.id=o.course_id join public.colleges col on col.id=c.college_id;

create or replace function public.search_catalog(search_term text,result_limit int default 12) returns table(id uuid,type text,title text,subtitle text,slug text) language sql stable security definer set search_path='' as $$
  select x.id,x.type,x.title,x.subtitle,x.slug from (
    select p.id,'professor'::text type,p.display_name title,d.name||' · '||c.name subtitle,p.slug,
      case when lower(p.display_name)=lower(search_term) then 3 when p.display_name ilike search_term||'%' then 2 else 1 end score
    from public.professors p join public.departments d on d.id=p.department_id join public.colleges c on c.id=p.college_id
    where p.display_name ilike '%'||search_term||'%'
    union all
    select co.id,'course'::text,co.code||': '||co.title,d.name||' · '||c.name,co.slug,
      case when lower(co.code)=lower(search_term) then 3 when co.code ilike search_term||'%' or co.title ilike search_term||'%' then 2 else 1 end
    from public.courses co join public.departments d on d.id=co.department_id join public.colleges c on c.id=co.college_id
    where co.code ilike '%'||search_term||'%' or co.title ilike '%'||search_term||'%'
  ) x order by x.score desc,x.title limit least(result_limit,25);
$$;

-- RLS: catalog is public; UGC bases reveal only the owner's rows. Everyone reads through public-safe views.
alter table public.colleges enable row level security; alter table public.departments enable row level security; alter table public.professors enable row level security; alter table public.courses enable row level security; alter table public.course_offerings enable row level security; alter table public.professor_course_assignments enable row level security;
alter table public.private_profiles enable row level security; alter table public.user_roles enable row level security; alter table public.rate_limits enable row level security; alter table public.reviews enable row level security; alter table public.review_aliases enable row level security; alter table public.questions enable row level security; alter table public.question_aliases enable row level security; alter table public.answers enable row level security; alter table public.answer_aliases enable row level security; alter table public.votes enable row level security; alter table public.course_interests enable row level security; alter table public.notifications enable row level security; alter table public.reports enable row level security; alter table public.moderation_actions enable row level security;
create policy catalog_read_colleges on public.colleges for select using(true); create policy catalog_read_departments on public.departments for select using(true); create policy catalog_read_professors on public.professors for select using(true); create policy catalog_read_courses on public.courses for select using(true); create policy catalog_read_offerings on public.course_offerings for select using(true); create policy catalog_read_assignments on public.professor_course_assignments for select using(true);
create policy own_profile_read on public.private_profiles for select using(user_id=auth.uid()); create policy own_profile_update on public.private_profiles for update using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy moderator_profile_read on public.private_profiles for select using(public.is_moderator()); create policy moderator_profile_update on public.private_profiles for update using(public.is_moderator()) with check(public.is_moderator());
create policy role_self_read on public.user_roles for select using(user_id=auth.uid() or public.is_moderator());
create policy own_reviews on public.reviews for select using(author_id=auth.uid() or public.is_moderator()); create policy own_review_update on public.reviews for update using(author_id=auth.uid()) with check(author_id=auth.uid()); create policy own_review_delete on public.reviews for delete using(author_id=auth.uid());
create policy moderator_review_update on public.reviews for update using(public.is_moderator()) with check(public.is_moderator());
create policy own_questions on public.questions for select using(author_id=auth.uid() or public.is_moderator()); create policy verified_question_insert on public.questions for insert with check(public.is_verified_student() and author_id=auth.uid()); create policy own_question_update on public.questions for update using(author_id=auth.uid()) with check(author_id=auth.uid()); create policy own_question_delete on public.questions for delete using(author_id=auth.uid());
create policy moderator_question_update on public.questions for update using(public.is_moderator()) with check(public.is_moderator());
create policy own_answers on public.answers for select using(author_id=auth.uid() or public.is_moderator()); create policy verified_answer_insert on public.answers for insert with check(public.is_verified_student() and author_id=auth.uid()); create policy own_answer_update on public.answers for update using(author_id=auth.uid()) with check(author_id=auth.uid()); create policy own_answer_delete on public.answers for delete using(author_id=auth.uid());
create policy moderator_answer_update on public.answers for update using(public.is_moderator()) with check(public.is_moderator());
create policy own_votes_all on public.votes for all using(user_id=auth.uid()) with check(public.is_verified_student() and user_id=auth.uid());
create policy own_interests_all on public.course_interests for all using(user_id=auth.uid()) with check(public.is_verified_student() and user_id=auth.uid());
create policy own_notifications on public.notifications for select using(user_id=auth.uid()); create policy own_notifications_update on public.notifications for update using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy own_reports_read on public.reports for select using(reporter_id=auth.uid() or public.is_moderator()); create policy verified_report_insert on public.reports for insert with check(public.is_verified_student() and reporter_id=auth.uid()); create policy moderator_reports_update on public.reports for update using(public.is_moderator());
create policy moderator_actions_read on public.moderation_actions for select using(public.is_moderator()); create policy moderator_actions_insert on public.moderation_actions for insert with check(public.is_moderator() and moderator_id=auth.uid());

create or replace function public.protect_profile_privileges() returns trigger language plpgsql security definer set search_path='' as $$ begin if not public.is_moderator() then new.is_suspended:=old.is_suspended; new.college_id:=old.college_id; end if; return new; end; $$;
create trigger private_profile_privilege_guard before update on public.private_profiles for each row execute function public.protect_profile_privileges();

revoke all on public.private_profiles,public.user_roles,public.rate_limits,public.review_aliases,public.question_aliases,public.answer_aliases,public.moderation_actions from anon;
revoke select on public.reviews,public.questions,public.answers,public.votes,public.course_interests,public.notifications,public.reports from anon;
grant select on public.public_reviews,public.professor_rating_summaries,public.course_rating_summaries,public.public_questions,public.public_answers,public.professor_courses_public,public.course_professors_public,public.review_form_options to anon,authenticated;
grant execute on function public.search_catalog(text,int) to anon,authenticated;
grant execute on function public.submit_review(uuid,uuid,uuid,text,int,int,int,int,boolean,text,text,text,text) to authenticated;
revoke execute on function public.submit_review(uuid,uuid,uuid,text,int,int,int,int,boolean,text,text,text,text) from anon;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path='' as $$
declare domain text; college uuid; begin domain:=split_part(lower(new.email),'@',2); select id into college from public.colleges where domain=any(email_domains); if college is null then raise exception 'Email domain is not eligible'; end if; insert into public.private_profiles(user_id,college_id) values(new.id,college); insert into public.user_roles(user_id,role) values(new.id,'student'); return new; end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

insert into public.colleges(name,slug,short_name,email_domains) values
('Haverford College','haverford','HC',array['haverford.edu']),('Bryn Mawr College','bryn-mawr','BMC',array['brynmawr.edu']),('Swarthmore College','swarthmore','SC',array['swarthmore.edu']);
