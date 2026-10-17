alter table public.courses add column if not exists catalog_source text not null default 'official' check(catalog_source in ('official','community'));
alter table public.courses add column if not exists catalog_verified boolean not null default true;
alter table public.professors add column if not exists catalog_source text not null default 'official' check(catalog_source in ('official','community'));
alter table public.professors add column if not exists catalog_verified boolean not null default true;

drop function if exists public.search_review_options(text,uuid,uuid,int);
create function public.search_review_options(
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
  year smallint,
  catalog_verified boolean
) language sql stable security definer set search_path='' as $$
  select pca.offering_id,pca.professor_id,p.display_name,o.course_id,c.code,c.title,col.name,o.semester,o.year,(p.catalog_verified and c.catalog_verified)
  from public.professor_course_assignments pca
  join public.professors p on p.id=pca.professor_id
  join public.course_offerings o on o.id=pca.offering_id
  join public.courses c on c.id=o.course_id
  join public.colleges col on col.id=c.college_id
  where (professor_filter is null or p.id=professor_filter)
    and (course_filter is null or c.id=course_filter)
    and (length(trim(search_term))=0 or p.display_name ilike '%'||trim(search_term)||'%' or c.code ilike '%'||trim(search_term)||'%' or c.title ilike '%'||trim(search_term)||'%')
  order by case when lower(c.code)=lower(trim(search_term)) then 0 when c.code ilike trim(search_term)||'%' then 1 when p.display_name ilike trim(search_term)||'%' then 2 else 3 end,c.code,p.display_name,o.year desc
  limit least(greatest(result_limit,1),30);
$$;
revoke execute on function public.search_review_options(text,uuid,uuid,int) from public;
grant execute on function public.search_review_options(text,uuid,uuid,int) to anon,authenticated;

create or replace function public.create_community_catalog_option(
  p_contributor_hash text,
  p_college_slug text,
  p_course_code text,
  p_course_title text,
  p_professor_name text,
  p_semester text,
  p_year int
) returns table(
  offering_id uuid,
  professor_id uuid,
  professor_name text,
  course_id uuid,
  course_code text,
  course_title text,
  college_name text,
  semester text,
  year smallint,
  catalog_verified boolean
) language plpgsql security definer set search_path='' as $$
declare
  v_college public.colleges%rowtype;
  v_department_id uuid;
  v_course_id uuid;
  v_professor_id uuid;
  v_offering_id uuid;
  v_code text:=upper(regexp_replace(trim(p_course_code),'\s+',' ','g'));
  v_title text:=trim(p_course_title);
  v_name text:=trim(p_professor_name);
  v_department_code text;
  v_slug text;
begin
  perform public.check_anonymous_rate_limit(p_contributor_hash,'catalog_add',5,86400);
  if v_code !~ '^[A-Z]{2,10} [A-Z]?[0-9]{2,4}[A-Z]?$' then raise exception 'Use a course code like ECON H105, MATH B101, or CPSC 021'; end if;
  if length(v_title) not between 3 and 160 or length(v_name) not between 3 and 120 then raise exception 'Enter the full course title and professor name'; end if;
  if p_semester not in ('Fall','Spring','Summer') or p_year not between 2000 and 2100 then raise exception 'Invalid semester or year'; end if;
  select * into v_college from public.colleges where slug=p_college_slug;
  if v_college.id is null then raise exception 'Unknown college'; end if;
  v_department_code:=split_part(v_code,' ',1);
  insert into public.departments(college_id,name,code,slug) values(v_college.id,v_department_code,v_department_code,lower(v_department_code)) on conflict(college_id,code) do nothing;
  select id into v_department_id from public.departments where college_id=v_college.id and code=v_department_code;
  v_slug:=p_college_slug||'-'||lower(regexp_replace(v_code,'[^A-Z0-9]+','-','g'));
  insert into public.courses(college_id,department_id,code,title,description,slug,catalog_source,catalog_verified)
  values(v_college.id,v_department_id,v_code,v_title,'Community-added catalog entry.',v_slug,'community',false)
  on conflict(college_id,code) do update set title=case when public.courses.catalog_source='community' then excluded.title else public.courses.title end
  returning id into v_course_id;
  if v_course_id is null then select id into v_course_id from public.courses where college_id=v_college.id and code=v_code; end if;
  select id into v_professor_id from public.professors where college_id=v_college.id and lower(display_name)=lower(v_name) order by catalog_verified desc limit 1;
  if v_professor_id is null then
    v_slug:=p_college_slug||'-'||lower(regexp_replace(v_name,'[^A-Za-z0-9]+','-','g'))||'-'||substr(md5(lower(v_name)),1,10);
    insert into public.professors(college_id,department_id,display_name,slug,catalog_source,catalog_verified)
    values(v_college.id,v_department_id,v_name,v_slug,'community',false) returning id into v_professor_id;
  end if;
  insert into public.course_offerings(course_id,semester,year,section) values(v_course_id,p_semester,p_year,'COMMUNITY') on conflict(course_id,semester,year,section) do update set section=excluded.section returning id into v_offering_id;
  insert into public.professor_course_assignments(professor_id,offering_id) values(v_professor_id,v_offering_id) on conflict(professor_id,offering_id) do nothing;
  return query select v_offering_id,v_professor_id,p.display_name,v_course_id,c.code,c.title,v_college.name,p_semester,p_year::smallint,(p.catalog_verified and c.catalog_verified) from public.professors p join public.courses c on c.id=v_course_id where p.id=v_professor_id;
end; $$;
revoke execute on function public.create_community_catalog_option(text,text,text,text,text,text,int) from public,anon,authenticated;
grant execute on function public.create_community_catalog_option(text,text,text,text,text,text,int) to service_role;

alter table public.notifications alter column user_id drop not null;
alter table public.notifications add column if not exists contributor_hash text;
create index if not exists notifications_anonymous_unread on public.notifications(contributor_hash,created_at desc) where read_at is null and contributor_hash is not null;

create or replace function public.notify_anonymous_question() returns trigger language plpgsql security definer set search_path='' as $$
declare recipient text;
begin
  if new.review_id is not null then
    select contributor_hash into recipient from public.reviews where id=new.review_id;
    if recipient is not null and recipient<>new.contributor_hash then
      insert into public.notifications(contributor_hash,type,title,body,target_path) values(recipient,'review_question','Someone asked about your review',new.title,'/questions/'||new.id);
    end if;
  end if;
  return new;
end; $$;
drop trigger if exists anonymous_question_notifications on public.questions;
create trigger anonymous_question_notifications after insert on public.questions for each row execute function public.notify_anonymous_question();

create or replace function public.notify_anonymous_answer() returns trigger language plpgsql security definer set search_path='' as $$
declare question_owner text; parent_owner text;
begin
  select contributor_hash into question_owner from public.questions where id=new.question_id;
  if question_owner is not null and question_owner<>new.contributor_hash then
    insert into public.notifications(contributor_hash,type,title,body,target_path) values(question_owner,'question_answer','Your question has a new answer',left(new.body,180),'/questions/'||new.question_id);
  end if;
  if new.parent_answer_id is not null then
    select contributor_hash into parent_owner from public.answers where id=new.parent_answer_id;
    if parent_owner is not null and parent_owner<>new.contributor_hash and parent_owner is distinct from question_owner then
      insert into public.notifications(contributor_hash,type,title,body,target_path) values(parent_owner,'answer_reply','Someone replied to your answer',left(new.body,180),'/questions/'||new.question_id);
    end if;
  end if;
  return new;
end; $$;
drop trigger if exists anonymous_answer_notifications on public.answers;
create trigger anonymous_answer_notifications after insert on public.answers for each row execute function public.notify_anonymous_answer();
