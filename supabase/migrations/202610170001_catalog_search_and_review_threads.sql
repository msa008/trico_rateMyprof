-- Fast server-side lookup for the review form and public review-linked questions.
create or replace function public.search_review_options(
  search_term text,
  professor_filter uuid default null,
  course_filter uuid default null,
  result_limit int default 20
) returns table(
  offering_id uuid,
  professor_id uuid,
  professor_name text,
  course_id uuid,
  course_code text,
  course_title text,
  college_name text,
  semester text,
  year smallint
) language sql stable security definer set search_path='' as $$
  select pca.offering_id,pca.professor_id,p.display_name,o.course_id,c.code,c.title,col.name,o.semester,o.year
  from public.professor_course_assignments pca
  join public.professors p on p.id=pca.professor_id
  join public.course_offerings o on o.id=pca.offering_id
  join public.courses c on c.id=o.course_id
  join public.colleges col on col.id=c.college_id
  where (professor_filter is null or p.id=professor_filter)
    and (course_filter is null or c.id=course_filter)
    and (
      length(trim(search_term))=0
      or p.display_name ilike '%'||trim(search_term)||'%'
      or c.code ilike '%'||trim(search_term)||'%'
      or c.title ilike '%'||trim(search_term)||'%'
    )
  order by
    case when lower(c.code)=lower(trim(search_term)) then 0
         when c.code ilike trim(search_term)||'%' then 1
         when p.display_name ilike trim(search_term)||'%' then 2
         else 3 end,
    c.code,p.display_name,o.year desc,
    case o.semester when 'Fall' then 1 when 'Spring' then 2 else 3 end
  limit least(greatest(result_limit,1),30);
$$;

revoke execute on function public.search_review_options(text,uuid,uuid,int) from public;
grant execute on function public.search_review_options(text,uuid,uuid,int) to anon,authenticated;

create or replace view public.public_questions with (security_barrier=true) as
select q.id,q.title,q.body,qa.alias,col.name college_name,d.code department_code,c.code course_code,c.slug course_slug,p.display_name professor_name,q.course_id,q.professor_id,
  (select count(*)::int from public.answers a where a.question_id=q.id and a.status='visible') answer_count,
  (select count(*)::int from public.votes v where v.target_type='question' and v.target_id=q.id) helpful_count,q.created_at,q.review_id
from public.questions q
join public.question_aliases qa on qa.question_id=q.id
left join public.colleges col on col.id=q.college_id
left join public.departments d on d.id=q.department_id
left join public.courses c on c.id=q.course_id
left join public.professors p on p.id=q.professor_id
where q.status='visible';

grant select on public.public_questions to anon,authenticated;
create index if not exists questions_review_created on public.questions(review_id,created_at) where status='visible' and review_id is not null;
