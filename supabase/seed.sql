-- Clearly labeled demonstration catalog data. Never seed production with invented reviews.
insert into public.departments(college_id,name,code,slug)
select id,'Economics','ECON','economics' from public.colleges where slug='haverford'
union all select id,'Computer Science','CMSC','computer-science' from public.colleges where slug='bryn-mawr'
union all select id,'English Literature','ENGL','english-literature' from public.colleges where slug='swarthmore';

insert into public.professors(id,college_id,department_id,display_name,slug)
select '11111111-1111-4111-8111-111111111111',d.college_id,d.id,'Demo Professor A','demo-professor-one' from public.departments d where d.code='ECON'
union all select '22222222-2222-4222-8222-222222222222',d.college_id,d.id,'Demo Professor B','demo-professor-two' from public.departments d where d.code='CMSC'
union all select '33333333-3333-4333-8333-333333333333',d.college_id,d.id,'Demo Professor C','demo-professor-three' from public.departments d where d.code='ENGL';

insert into public.courses(id,college_id,department_id,code,title,description,slug)
select 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',d.college_id,d.id,'ECON 105','Introduction to Economic Analysis','Demonstration catalog entry.','econ-105-demo' from public.departments d where d.code='ECON'
union all select 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',d.college_id,d.id,'CMSC 151','Introduction to Computer Science','Demonstration catalog entry.','cmsc-151-demo' from public.departments d where d.code='CMSC'
union all select 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',d.college_id,d.id,'ENGL 071','Forms of Narrative','Demonstration catalog entry.','engl-071-demo' from public.departments d where d.code='ENGL';

insert into public.course_offerings(id,course_id,semester,year) values ('99999999-9999-4999-8999-999999999999','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Fall',2026);
insert into public.professor_course_assignments(professor_id,offering_id) values ('11111111-1111-4111-8111-111111111111','99999999-9999-4999-8999-999999999999');
