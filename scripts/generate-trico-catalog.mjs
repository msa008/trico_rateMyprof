import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { JSDOM } from "jsdom";

const SOURCE = "https://www.brynmawr.edu/inside/academic-information/registrar/tri-co-course-search";
const OUTPUT = process.argv[2] ?? "supabase/migrations/202610170002_import_trico_catalog.sql";
const terms = [
  { key: "fall_2025", semester: "Fall", year: 2025 },
  { key: "spring_2026", semester: "Spring", year: 2026 },
  { key: "fall_2026", semester: "Fall", year: 2026 },
  { key: "spring_2027", semester: "Spring", year: 2027 },
];
const colleges = {
  "Bryn Mawr": { slug: "bryn-mawr", marker: "B" },
  Haverford: { slug: "haverford", marker: "H" },
  Swarthmore: { slug: "swarthmore", marker: "S" },
};

const clean = (value) => value.replace(/\s+/g, " ").trim();
const slugify = (value) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const unique = (rows, key) => [...new Map(rows.map((row) => [key(row), row])).values()];
const sqlJson = (rows) => `$catalog$${JSON.stringify(rows).replaceAll("$catalog$", "")}$catalog$::jsonb`;
const sourceId = (value) => createHash("sha256").update(value).digest("hex").slice(0, 12);

function normalizeProfessor(raw) {
  const name = clean(raw);
  if (!name || /^(staff|tba|tbd|instructor)$/i.test(name)) return null;
  if (!name.includes(",")) return name;
  const [last, ...first] = name.split(",").map(clean);
  return clean(`${first.join(" ")} ${last}`);
}

function parseRegistration(registrationId, collegeName) {
  const compact = registrationId.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const marker = colleges[collegeName].marker;
  if (marker === "S") {
    const match = compact.match(/^([A-Z]+?)(\d{3})([0-9A-Z]*)$/);
    if (!match) return null;
    return { subject: match[1], number: match[2], section: match[3] || "001", code: `${match[1]} ${match[2]}` };
  }
  const match = compact.match(new RegExp(`^([A-Z]+)${marker}([0-9A-Z]+)$`));
  if (!match) return null;
  const rest = match[2];
  if (rest.length < 4) return null;
  const fourCharacterSection = rest.slice(-4);
  const sectionLength = /^0\d{2}[A-Z]$/.test(fourCharacterSection) ? 4 : 3;
  const number = rest.slice(0, -sectionLength);
  const section = rest.slice(-sectionLength);
  if (!number) return null;
  return { subject: match[1], number, section, code: `${match[1]} ${marker}${number}` };
}

async function fetchTerm(term) {
  const params = new URLSearchParams();
  params.append("semester[0]", term.key);
  params.append("college[0]", "bryn_mawr");
  params.append("college[1]", "haverford");
  params.append("college[2]", "swarthmore");
  params.set("page", "1");
  params.set("per_page", "5000");
  const response = await fetch(`${SOURCE}/results?${params}`, { headers: { "User-Agent": "TriCoReviewsCatalogImporter/1.0" } });
  if (!response.ok) throw new Error(`${term.key}: official catalog returned ${response.status}`);
  return new JSDOM(await response.text()).window.document;
}

const departments = [];
const professors = [];
const courses = [];
const offerings = [];
const assignments = [];
const skipped = [];

for (const term of terms) {
  console.log(`Reading official ${term.semester} ${term.year} offerings…`);
  const document = await fetchTerm(term);
  for (const heading of document.querySelectorAll("h3")) {
    const headingMatch = clean(heading.textContent).match(/^(Fall|Spring|Summer) \d{4}: (Bryn Mawr|Haverford|Swarthmore)$/);
    if (!headingMatch) continue;
    const collegeName = headingMatch[2];
    const college = colleges[collegeName];
    let sibling = heading.nextElementSibling;
    while (sibling && !sibling.querySelector("table.result-table")) sibling = sibling.nextElementSibling;
    const table = sibling?.querySelector("table.result-table");
    if (!table) continue;
    for (const row of table.querySelectorAll("tbody tr")) {
      const cells = row.querySelectorAll("td");
      if (cells.length < 3) continue;
      const registrationId = clean(cells[0].textContent);
      const parsed = parseRegistration(registrationId, collegeName);
      if (!parsed) { skipped.push(`${collegeName}:${registrationId}`); continue; }
      const title = clean(cells[1].textContent);
      if (!title) continue;
      const detailHref = cells[0].querySelector("a")?.getAttribute("href") ?? "";
      const sourceUrl = new URL(detailHref, SOURCE).href;
      const courseSlug = `${college.slug}-${slugify(parsed.code)}`;
      departments.push({ college_slug: college.slug, code: parsed.subject, name: parsed.subject, slug: slugify(parsed.subject) });
      courses.push({ college_slug: college.slug, department_code: parsed.subject, code: parsed.code, title, description: "", slug: courseSlug, source_url: sourceUrl });
      offerings.push({ course_slug: courseSlug, semester: term.semester, year: term.year, section: parsed.section });
      const instructorLinks = [...cells[2].querySelectorAll('a[href^="mailto:"]')];
      const instructorNames = unique(
        (instructorLinks.length ? instructorLinks.map((link) => link.textContent) : clean(cells[2].textContent).split(/;|\band\b/i))
          .map(normalizeProfessor).filter(Boolean),
        (name) => name.toLowerCase(),
      );
      for (const displayName of instructorNames) {
        const professorSlug = `${college.slug}-${slugify(displayName)}-${sourceId(displayName.toLowerCase())}`;
        professors.push({ college_slug: college.slug, department_code: parsed.subject, display_name: displayName, slug: professorSlug, source_url: `${SOURCE}?instructor=${encodeURIComponent(displayName)}` });
        assignments.push({ professor_slug: professorSlug, course_slug: courseSlug, semester: term.semester, year: term.year, section: parsed.section });
      }
    }
  }
}

const catalog = {
  departments: unique(departments, (row) => `${row.college_slug}|${row.code}`),
  professors: unique(professors, (row) => row.slug),
  courses: unique(courses, (row) => `${row.college_slug}|${row.code}`),
  offerings: unique(offerings, (row) => `${row.course_slug}|${row.semester}|${row.year}|${row.section}`),
  assignments: unique(assignments, (row) => `${row.professor_slug}|${row.course_slug}|${row.semester}|${row.year}|${row.section}`),
};

if (!catalog.courses.length || !catalog.professors.length || !catalog.assignments.length) throw new Error("Official catalog returned no usable courses, professors, or assignments.");

const migration = `-- Generated from the official public Tri-Co Course Search on ${new Date().toISOString()}.
-- Source: ${SOURCE}
begin;

with imported as (select * from jsonb_to_recordset(${sqlJson(catalog.departments)}) as x(college_slug text,code text,name text,slug text))
insert into public.departments(college_id,code,name,slug)
select c.id,i.code,i.name,i.slug from imported i join public.colleges c on c.slug=i.college_slug
on conflict(college_id,code) do update set name=excluded.name,slug=excluded.slug;

with imported as (select * from jsonb_to_recordset(${sqlJson(catalog.professors)}) as x(college_slug text,department_code text,display_name text,slug text,source_url text))
insert into public.professors(college_id,department_id,display_name,slug,source_url,source_updated_at)
select c.id,d.id,i.display_name,i.slug,i.source_url,now() from imported i join public.colleges c on c.slug=i.college_slug join public.departments d on d.college_id=c.id and d.code=i.department_code
on conflict(slug) do update set display_name=excluded.display_name,source_url=excluded.source_url,source_updated_at=excluded.source_updated_at;

with imported as (select * from jsonb_to_recordset(${sqlJson(catalog.courses)}) as x(college_slug text,department_code text,code text,title text,description text,slug text,source_url text))
insert into public.courses(college_id,department_id,code,title,description,slug,source_url,source_updated_at)
select c.id,d.id,i.code,i.title,i.description,i.slug,i.source_url,now() from imported i join public.colleges c on c.slug=i.college_slug join public.departments d on d.college_id=c.id and d.code=i.department_code
on conflict(college_id,code) do update set department_id=excluded.department_id,title=excluded.title,slug=excluded.slug,source_url=excluded.source_url,source_updated_at=excluded.source_updated_at;

with imported as (select * from jsonb_to_recordset(${sqlJson(catalog.offerings)}) as x(course_slug text,semester text,year smallint,section text))
insert into public.course_offerings(course_id,semester,year,section)
select c.id,i.semester,i.year,i.section from imported i join public.courses c on c.slug=i.course_slug
on conflict(course_id,semester,year,section) do nothing;

with imported as (select * from jsonb_to_recordset(${sqlJson(catalog.assignments)}) as x(professor_slug text,course_slug text,semester text,year smallint,section text))
insert into public.professor_course_assignments(professor_id,offering_id)
select p.id,o.id from imported i join public.professors p on p.slug=i.professor_slug join public.courses c on c.slug=i.course_slug join public.course_offerings o on o.course_id=c.id and o.semester=i.semester and o.year=i.year and o.section=i.section
on conflict(professor_id,offering_id) do nothing;

commit;
`;

await writeFile(OUTPUT, migration);
console.log(`Generated ${OUTPUT}`);
console.log(`${catalog.courses.length} courses, ${catalog.professors.length} professors, ${catalog.offerings.length} offerings, ${catalog.assignments.length} assignments.`);
if (skipped.length) console.warn(`Skipped ${skipped.length} unrecognized registration IDs. First examples: ${skipped.slice(0, 10).join(", ")}`);
