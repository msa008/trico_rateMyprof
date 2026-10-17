-- Make multi-word professor searches insensitive to word order and punctuation.
drop function if exists public.search_catalog(text,int);
create function public.search_catalog(search_term text,result_limit int default 12)
returns table(id uuid,type text,title text,subtitle text,slug text)
language sql stable security definer set search_path='' as $$
  select x.id,x.type,x.title,x.subtitle,x.slug from (
    select p.id,'professor'::text type,p.display_name title,d.name||' · '||col.name subtitle,p.slug,
      case when lower(p.display_name)=lower(trim(search_term)) then 5 when p.display_name ilike trim(search_term)||'%' then 4 else 2 end score
    from public.professors p join public.departments d on d.id=p.department_id join public.colleges col on col.id=p.college_id
    where not exists(select 1 from unnest(regexp_split_to_array(lower(trim(search_term)),'\s+')) token where lower(p.display_name) not like '%'||token||'%')
       or regexp_replace(lower(p.display_name),'[^a-z0-9]','','g') like '%'||regexp_replace(lower(trim(search_term)),'[^a-z0-9]','','g')||'%'
    union all
    select c.id,'course'::text,c.code||': '||c.title,d.name||' · '||col.name,c.slug,
      case when lower(c.code)=lower(trim(search_term)) then 5 when c.code ilike trim(search_term)||'%' or c.title ilike trim(search_term)||'%' then 4 else 2 end
    from public.courses c join public.departments d on d.id=c.department_id join public.colleges col on col.id=c.college_id
    where not exists(select 1 from unnest(regexp_split_to_array(lower(trim(search_term)),'\s+')) token where lower(c.code||' '||c.title) not like '%'||token||'%')
    union all
    select d.id,'department'::text,d.name,d.code||' · '||col.name,col.slug||'/'||lower(d.code),
      case when lower(d.code)=lower(trim(search_term)) then 5 when d.code ilike trim(search_term)||'%' or d.name ilike trim(search_term)||'%' then 4 else 2 end
    from public.departments d join public.colleges col on col.id=d.college_id
    where d.code ilike '%'||trim(search_term)||'%' or d.name ilike '%'||trim(search_term)||'%'
    union all
    select col.id,'college'::text,col.name,'College directory',col.slug,3
    from public.colleges col where col.name ilike '%'||trim(search_term)||'%' or col.short_name ilike '%'||trim(search_term)||'%'
  ) x order by x.score desc,x.title limit least(result_limit,25);
$$;
revoke execute on function public.search_catalog(text,int) from public;
grant execute on function public.search_catalog(text,int) to anon,authenticated;

drop function if exists public.search_review_options(text,uuid,uuid,int);
create function public.search_review_options(search_term text,professor_filter uuid default null,course_filter uuid default null,result_limit int default 20)
returns table(offering_id uuid,professor_id uuid,professor_name text,course_id uuid,course_code text,course_title text,college_name text,semester text,year smallint,catalog_verified boolean)
language sql stable security definer set search_path='' as $$
  select pca.offering_id,pca.professor_id,p.display_name,o.course_id,c.code,c.title,col.name,o.semester,o.year,(p.catalog_verified and c.catalog_verified)
  from public.professor_course_assignments pca
  join public.professors p on p.id=pca.professor_id join public.course_offerings o on o.id=pca.offering_id
  join public.courses c on c.id=o.course_id join public.colleges col on col.id=c.college_id
  where (professor_filter is null or p.id=professor_filter) and (course_filter is null or c.id=course_filter)
    and (length(trim(search_term))=0 or not exists(
      select 1 from unnest(regexp_split_to_array(lower(trim(search_term)),'\s+')) token
      where lower(p.display_name||' '||c.code||' '||c.title) not like '%'||token||'%'
    ) or regexp_replace(lower(p.display_name),'[^a-z0-9]','','g') like '%'||regexp_replace(lower(trim(search_term)),'[^a-z0-9]','','g')||'%')
  order by case when lower(p.display_name)=lower(trim(search_term)) then 0 when p.display_name ilike trim(search_term)||'%' then 1 when lower(c.code)=lower(trim(search_term)) then 2 when c.code ilike trim(search_term)||'%' then 3 else 4 end,c.code,p.display_name,o.year desc
  limit least(greatest(result_limit,1),30);
$$;
revoke execute on function public.search_review_options(text,uuid,uuid,int) from public;
grant execute on function public.search_review_options(text,uuid,uuid,int) to anon,authenticated;
