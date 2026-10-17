alter table public.reviews add column if not exists grade_status text not null default 'Prefer not to say';
alter table public.reviews add column if not exists descriptors text[] not null default '{}';
alter table public.reviews drop constraint if exists reviews_grade_status_check;
alter table public.reviews add constraint reviews_grade_status_check check(grade_status in ('A','A-','B+','B','B-','C+','C','C-','D','F','Pass','No credit','Not received yet','Prefer not to say'));
alter table public.reviews drop constraint if exists reviews_descriptors_check;
alter table public.reviews add constraint reviews_descriptors_check check(
  cardinality(descriptors)<=5 and descriptors <@ array['Caring and supportive','Tough grader','Lecture-heavy','Discussion-based','Clear expectations','Lots of reading','Fast-paced','Accessible outside class','Participation-heavy','Exam-heavy']::text[]
);

create or replace view public.public_reviews with (security_barrier=true) as
select r.id,r.professor_id,r.course_id,p.display_name professor_name,p.slug professor_slug,c.code course_code,c.slug course_slug,col.slug college_slug,ra.alias,r.semester,r.year,r.teaching_quality,r.workload,r.grading_difficulty,r.would_take_again,r.attendance_importance,r.body,r.advice,r.wish_known,
  (select count(*)::int from public.votes v where v.target_type='review' and v.target_id=r.id) helpful_count,r.created_at,r.grade_status,r.descriptors
from public.reviews r join public.review_aliases ra on ra.review_id=r.id join public.professors p on p.id=r.professor_id join public.courses c on c.id=r.course_id join public.colleges col on col.id=c.college_id where r.status='visible';

drop function if exists public.submit_anonymous_review(text,uuid,uuid,uuid,text,int,int,int,int,boolean,text,text,text,text);
create function public.submit_anonymous_review(
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
  insert into public.review_aliases(review_id,alias) values(new_id,public.random_alias());
  return new_id;
end; $$;
revoke execute on function public.submit_anonymous_review(text,uuid,uuid,uuid,text,int,int,int,int,boolean,text,text,text[],text,text,text) from public,anon,authenticated;
grant execute on function public.submit_anonymous_review(text,uuid,uuid,uuid,text,int,int,int,int,boolean,text,text,text[],text,text,text) to service_role;
