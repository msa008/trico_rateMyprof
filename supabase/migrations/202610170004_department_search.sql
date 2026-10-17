drop function if exists public.search_catalog(text,int);
create function public.search_catalog(search_term text,result_limit int default 12)
returns table(id uuid,type text,title text,subtitle text,slug text)
language sql stable security definer set search_path='' as $$
  select x.id,x.type,x.title,x.subtitle,x.slug from (
    select p.id,'professor'::text type,p.display_name title,d.name||' · '||col.name subtitle,p.slug,
      case when lower(p.display_name)=lower(search_term) then 4 when p.display_name ilike search_term||'%' then 3 else 1 end score
    from public.professors p join public.departments d on d.id=p.department_id join public.colleges col on col.id=p.college_id
    where p.display_name ilike '%'||search_term||'%'
    union all
    select c.id,'course'::text,c.code||': '||c.title,d.name||' · '||col.name,c.slug,
      case when lower(c.code)=lower(search_term) then 4 when c.code ilike search_term||'%' or c.title ilike search_term||'%' then 3 else 1 end
    from public.courses c join public.departments d on d.id=c.department_id join public.colleges col on col.id=c.college_id
    where c.code ilike '%'||search_term||'%' or c.title ilike '%'||search_term||'%'
    union all
    select d.id,'department'::text,d.name,d.code||' · '||col.name,col.slug||'/'||lower(d.code),
      case when lower(d.code)=lower(search_term) then 4 when d.code ilike search_term||'%' or d.name ilike search_term||'%' then 3 else 1 end
    from public.departments d join public.colleges col on col.id=d.college_id
    where d.code ilike '%'||search_term||'%' or d.name ilike '%'||search_term||'%'
    union all
    select col.id,'college'::text,col.name,'College directory',col.slug,
      case when lower(col.name)=lower(search_term) then 4 when col.name ilike search_term||'%' then 3 else 1 end
    from public.colleges col where col.name ilike '%'||search_term||'%' or col.short_name ilike '%'||search_term||'%'
  ) x order by x.score desc,x.title limit least(result_limit,25);
$$;
revoke execute on function public.search_catalog(text,int) from public;
grant execute on function public.search_catalog(text,int) to anon,authenticated;
