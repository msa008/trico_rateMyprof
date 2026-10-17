-- Convert contributions from authenticated accounts to anonymous browser sessions.
-- The server hashes a random httpOnly browser cookie; raw session values are never stored.

alter table public.reviews alter column author_id drop not null;
alter table public.reviews add column if not exists contributor_hash text;
alter table public.questions alter column author_id drop not null;
alter table public.questions add column if not exists contributor_hash text;
alter table public.answers alter column author_id drop not null;
alter table public.answers add column if not exists contributor_hash text;
alter table public.votes alter column user_id drop not null;
alter table public.votes add column if not exists contributor_hash text;
alter table public.course_interests alter column user_id drop not null;
alter table public.course_interests add column if not exists contributor_hash text;
alter table public.reports alter column reporter_id drop not null;
alter table public.reports add column if not exists contributor_hash text;
alter table public.rate_limits alter column user_id drop not null;
alter table public.rate_limits add column if not exists contributor_hash text;

alter table public.reviews drop constraint if exists reviews_author_id_professor_id_course_id_semester_year_key;
alter table public.votes drop constraint if exists votes_user_id_target_type_target_id_key;
alter table public.course_interests drop constraint if exists course_interests_user_id_course_id_semester_year_key;
alter table public.reports drop constraint if exists reports_reporter_id_target_type_target_id_key;
create unique index if not exists anonymous_review_once on public.reviews(contributor_hash,professor_id,course_id,semester,year) where contributor_hash is not null;
create unique index if not exists anonymous_vote_once on public.votes(contributor_hash,target_type,target_id) where contributor_hash is not null;
create unique index if not exists anonymous_interest_once on public.course_interests(contributor_hash,course_id,semester,year) where contributor_hash is not null;
create unique index if not exists anonymous_report_once on public.reports(contributor_hash,target_type,target_id) where contributor_hash is not null;

create or replace function public.check_anonymous_rate_limit(p_contributor_hash text,p_action text,p_max int,p_window_seconds int) returns void language plpgsql security definer set search_path='' as $$
begin
  if p_contributor_hash is null or length(p_contributor_hash)<>64 then raise exception 'Invalid anonymous session'; end if;
  if (select count(*) from public.rate_limits where contributor_hash=p_contributor_hash and action=p_action and created_at>now()-make_interval(secs=>p_window_seconds))>=p_max then raise exception 'Rate limit exceeded. Please try again later.' using errcode='P0001'; end if;
  insert into public.rate_limits(contributor_hash,action) values(p_contributor_hash,p_action);
end; $$;

create or replace function public.submit_anonymous_review(p_contributor_hash text,p_professor_id uuid,p_course_id uuid,p_offering_id uuid,p_semester text,p_year int,p_teaching_quality int,p_workload int,p_grading_difficulty int,p_would_take_again boolean,p_attendance_importance text,p_body text,p_advice text,p_wish_known text) returns uuid language plpgsql security definer set search_path='' as $$
declare new_id uuid;
begin
  perform public.check_anonymous_rate_limit(p_contributor_hash,'review',3,86400);
  if not exists(select 1 from public.professor_course_assignments a join public.course_offerings o on o.id=a.offering_id where a.professor_id=p_professor_id and o.id=p_offering_id and o.course_id=p_course_id) then raise exception 'Professor/course offering mismatch'; end if;
  insert into public.reviews(contributor_hash,professor_id,course_id,offering_id,semester,year,teaching_quality,workload,grading_difficulty,would_take_again,attendance_importance,body,advice,wish_known)
  values(p_contributor_hash,p_professor_id,p_course_id,p_offering_id,p_semester,p_year,p_teaching_quality,p_workload,p_grading_difficulty,p_would_take_again,p_attendance_importance,p_body,nullif(p_advice,''),nullif(p_wish_known,'')) returning id into new_id;
  insert into public.review_aliases(review_id,alias) values(new_id,public.random_alias()); return new_id;
end; $$;

create or replace function public.assign_content_alias() returns trigger language plpgsql security definer set search_path='' as $$
declare linked_alias text;
begin
  if tg_table_name='questions' then insert into public.question_aliases(question_id,alias) values(new.id,public.random_alias());
  elsif tg_table_name='answers' then
    select ra.alias into linked_alias from public.questions q join public.reviews r on r.id=q.review_id join public.review_aliases ra on ra.review_id=r.id where q.id=new.question_id and r.contributor_hash=new.contributor_hash;
    insert into public.answer_aliases(answer_id,alias) values(new.id,coalesce(linked_alias,public.random_alias()));
  end if; return new;
end; $$;

drop trigger if exists answer_notifications on public.answers;
revoke execute on function public.submit_review(uuid,uuid,uuid,text,int,int,int,int,boolean,text,text,text,text) from authenticated;
revoke execute on function public.submit_anonymous_review(text,uuid,uuid,uuid,text,int,int,int,int,boolean,text,text,text,text) from anon,authenticated;
revoke execute on function public.check_anonymous_rate_limit(text,text,int,int) from anon,authenticated;

-- Public clients still read safe views only. Anonymous mutations go through server actions using the service role.
