export type College = { id: string; name: string; slug: string; short_name: string };
export type Professor = {
  id: string; slug: string; display_name: string; college_name: string; college_slug: string;
  department_name: string; department_code: string; overall_rating: number | null; teaching_quality: number | null;
  workload: number | null; grading_difficulty: number | null; would_take_again_pct: number | null; review_count: number;
};
export type Course = {
  id: string; slug: string; code: string; title: string; description: string; college_name: string;
  college_slug: string; department_name: string; workload: number | null; difficulty: number | null;
  review_count: number; interested_count?: number; planning_count?: number;
};
export type Review = {
  id: string; alias: string; professor_name: string; professor_slug: string; course_code: string; course_slug: string;
  semester: string; year: number; teaching_quality: number; workload: number; grading_difficulty: number;
  would_take_again: boolean; attendance_importance: string; body: string; advice: string | null;
  wish_known: string | null; helpful_count: number; created_at: string;
};
export type Question = {
  id: string; title: string; body: string; alias: string; college_name?: string; department_code?: string;
  course_code?: string; course_slug?: string; professor_name?: string; answer_count: number; helpful_count: number; created_at: string;
};
export type ReviewOption = { offeringId: string; professorId: string; professorName: string; courseId: string; courseCode: string; courseTitle: string; collegeName: string; semester: "Fall"|"Spring"|"Summer"; year: number };
