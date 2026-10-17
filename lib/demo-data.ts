import type { Course, Professor, Question, Review } from "./types";

export const demoProfessors: Professor[] = [
  { id: "11111111-1111-4111-8111-111111111111", slug: "demo-professor-one", display_name: "Demo Professor A", college_name: "Haverford College", college_slug: "haverford", department_name: "Economics", department_code: "ECON", overall_rating: 4.6, teaching_quality: 4.7, workload: 3.4, grading_difficulty: 3.2, would_take_again_pct: 88, review_count: 24 },
  { id: "22222222-2222-4222-8222-222222222222", slug: "demo-professor-two", display_name: "Demo Professor B", college_name: "Bryn Mawr College", college_slug: "bryn-mawr", department_name: "Computer Science", department_code: "CMSC", overall_rating: 4.2, teaching_quality: 4.4, workload: 4.1, grading_difficulty: 3.8, would_take_again_pct: 79, review_count: 17 },
  { id: "33333333-3333-4333-8333-333333333333", slug: "demo-professor-three", display_name: "Demo Professor C", college_name: "Swarthmore College", college_slug: "swarthmore", department_name: "English Literature", department_code: "ENGL", overall_rating: null, teaching_quality: null, workload: null, grading_difficulty: null, would_take_again_pct: null, review_count: 0 },
];

export const demoCourses: Course[] = [
  { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", slug: "econ-105-demo", code: "ECON 105", title: "Introduction to Economic Analysis", description: "Demonstration catalog entry covering core microeconomic and macroeconomic concepts.", college_name: "Haverford College", college_slug: "haverford", department_name: "Economics", workload: 3.5, difficulty: 3.1, review_count: 31, interested_count: 42, planning_count: 19 },
  { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", slug: "cmsc-151-demo", code: "CMSC 151", title: "Introduction to Computer Science", description: "Demonstration catalog entry introducing computational thinking and programming fundamentals.", college_name: "Bryn Mawr College", college_slug: "bryn-mawr", department_name: "Computer Science", workload: 4.2, difficulty: 3.7, review_count: 22, interested_count: 58, planning_count: 27 },
  { id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", slug: "engl-071-demo", code: "ENGL 071", title: "Forms of Narrative", description: "Demonstration catalog entry exploring narrative form through close reading and discussion.", college_name: "Swarthmore College", college_slug: "swarthmore", department_name: "English Literature", workload: null, difficulty: null, review_count: 0, interested_count: 15, planning_count: 6 },
];

export const demoReviews: Review[] = [
  { id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd", professor_name: "Demo Professor A", professor_slug: "demo-professor-one", course_code: "ECON 105", course_slug: "econ-105-demo", semester: "Spring", year: 2026, teaching_quality: 5, workload: 3, grading_difficulty: 3, would_take_again: true, attendance_importance: "Very important", body: "Demonstration review: class meetings were structured and the expectations were clear. Weekly practice mattered more than cramming, and office hours were genuinely useful when concepts became more abstract.", advice: "Start the problem sets early and compare approaches with classmates after attempting them yourself.", wish_known: "The first exam is more conceptual than the practice problems suggest.", helpful_count: 18, created_at: "2026-09-28T12:00:00Z" },
];

export const demoQuestions: Question[] = [
  { id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee", title: "Is ECON 105 manageable without a strong math background?", body: "I am comfortable with basic algebra but have not taken calculus yet. What should I review before the semester?", college_name: "Haverford College", department_code: "ECON", course_code: "ECON 105", course_slug: "econ-105-demo", answer_count: 4, helpful_count: 21, created_at: "2026-10-05T14:00:00Z" },
  { id: "ffffffff-ffff-4fff-8fff-ffffffffffff", title: "How much weekly reading should I expect in Forms of Narrative?", body: "Trying to balance this with two lab courses. Is the reading load consistent week to week?", college_name: "Swarthmore College", department_code: "ENGL", course_code: "ENGL 071", course_slug: "engl-071-demo", answer_count: 0, helpful_count: 8, created_at: "2026-10-07T18:30:00Z" },
];

export const demoDepartments = [
  { name: "Economics", code: "ECON", professor_count: 18, course_count: 32 },
  { name: "Computer Science", code: "CMSC", professor_count: 21, course_count: 38 },
  { name: "English Literature", code: "ENGL", professor_count: 16, course_count: 29 },
  { name: "Biology", code: "BIOL", professor_count: 24, course_count: 41 },
  { name: "Political Science", code: "POLS", professor_count: 15, course_count: 26 },
  { name: "Mathematics", code: "MATH", professor_count: 20, course_count: 35 },
];
