alter table public.questions drop constraint if exists questions_body_check;
alter table public.questions add constraint questions_body_check check(length(body)<=2000);

drop view if exists public.public_reviews;
drop view if exists public.public_questions;
drop view if exists public.public_answers;

create view public.public_reviews with (security_barrier=true) as
select r.id,r.professor_id,r.course_id,p.display_name professor_name,p.slug professor_slug,c.code course_code,c.slug course_slug,col.slug college_slug,r.semester,r.year,r.teaching_quality,r.workload,r.grading_difficulty,r.would_take_again,r.attendance_importance,r.body,r.advice,r.wish_known,
  (select count(*)::int from public.votes v where v.target_type='review' and v.target_id=r.id) helpful_count,r.created_at,r.grade_status,r.descriptors
from public.reviews r join public.professors p on p.id=r.professor_id join public.courses c on c.id=r.course_id join public.colleges col on col.id=c.college_id where r.status='visible';

create view public.public_questions with (security_barrier=true) as
select q.id,q.title,q.body,col.name college_name,d.code department_code,c.code course_code,c.slug course_slug,p.display_name professor_name,q.course_id,q.professor_id,
  (select count(*)::int from public.answers a where a.question_id=q.id and a.status='visible') answer_count,
  (select count(*)::int from public.votes v where v.target_type='question' and v.target_id=q.id) helpful_count,q.created_at,q.review_id
from public.questions q left join public.colleges col on col.id=q.college_id left join public.departments d on d.id=q.department_id left join public.courses c on c.id=q.course_id left join public.professors p on p.id=q.professor_id where q.status='visible';

create view public.public_answers with (security_barrier=true) as
select a.id,a.question_id,a.parent_answer_id,a.body,(select count(*)::int from public.votes v where v.target_type='answer' and v.target_id=a.id) helpful_count,a.created_at from public.answers a where a.status='visible';

grant select on public.public_reviews,public.public_questions,public.public_answers to anon,authenticated;

drop trigger if exists questions_alias on public.questions;
drop trigger if exists answers_alias on public.answers;
drop function if exists public.assign_content_alias();
drop function if exists public.submit_review(uuid,uuid,uuid,text,int,int,int,int,boolean,text,text,text,text);

create or replace function public.submit_anonymous_review(
  p_contributor_hash text,p_professor_id uuid,p_course_id uuid,p_offering_id uuid,p_semester text,p_year int,
  p_teaching_quality int,p_workload int,p_grading_difficulty int,p_would_take_again boolean,p_attendance_importance text,
  p_grade_status text,p_descriptors text[],p_body text,p_advice text,p_wish_known text
) returns uuid language plpgsql security definer set search_path='' as $$
declare new_id uuid;
begin
  perform public.check_anonymous_rate_limit(p_contributor_hash,'review',3,86400);
  if not exists(select 1 from public.professor_course_assignments a join public.course_offerings o on o.id=a.offering_id where a.professor_id=p_professor_id and o.id=p_offering_id and o.course_id=p_course_id) then raise exception 'Professor/course offering mismatch'; end if;
  insert into public.reviews(contributor_hash,professor_id,course_id,offering_id,semester,year,teaching_quality,workload,grading_difficulty,would_take_again,attendance_importance,grade_status,descriptors,body,advice,wish_known)
  values(p_contributor_hash,p_professor_id,p_course_id,p_offering_id,p_semester,p_year,p_teaching_quality,p_workload,p_grading_difficulty,p_would_take_again,p_attendance_importance,p_grade_status,p_descriptors,p_body,nullif(p_advice,''),nullif(p_wish_known,'')) returning id into new_id;
  return new_id;
end; $$;
revoke execute on function public.submit_anonymous_review(text,uuid,uuid,uuid,text,int,int,int,int,boolean,text,text,text[],text,text,text) from public,anon,authenticated;
grant execute on function public.submit_anonymous_review(text,uuid,uuid,uuid,text,int,int,int,int,boolean,text,text,text[],text,text,text) to service_role;

drop function if exists public.random_alias();
drop table if exists public.answer_aliases;
drop table if exists public.question_aliases;
drop table if exists public.review_aliases;
