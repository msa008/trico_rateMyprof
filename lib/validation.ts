import { z } from "zod";

const rating = z.coerce.number().int().min(1).max(5);
const noPrivateContact = (value:string) => !/(?:[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}|https?:\/\/)/i.test(value);
const safeText = (minimum:number,maximum:number) => z.string().trim().min(minimum).max(maximum).refine(noPrivateContact,"Remove email addresses, phone numbers, and private links.");
export const reviewDescriptors=["Caring and supportive","Tough grader","Lecture-heavy","Discussion-based","Clear expectations","Lots of reading","Fast-paced","Accessible outside class","Participation-heavy","Exam-heavy"] as const;
export const gradeStatuses=["A","A-","B+","B","B-","C+","C","C-","D","F","Pass","No credit","Not received yet","Prefer not to say"] as const;
export const reviewSchema = z.object({
  professorId: z.string().uuid(), courseId: z.string().uuid(), offeringId: z.string().uuid(),
  semester: z.enum(["Fall", "Spring", "Summer"]), year: z.coerce.number().int().min(2000).max(2100),
  teachingQuality: rating, workload: rating, gradingDifficulty: rating,
  wouldTakeAgain: z.union([z.enum(["yes", "no"]),z.boolean()]).transform((v) => typeof v === "boolean" ? v : v === "yes"),
  attendanceImportance: z.enum(["Not important", "Somewhat important", "Very important", "Required"]),
  gradeStatus: z.enum(gradeStatuses), descriptors: z.array(z.enum(reviewDescriptors)).max(5,"Choose up to five descriptions."),
  body: safeText(80,3000), advice: safeText(0,1000).optional(),
  wishKnown: safeText(0,1000).optional(), tookCourse: z.union([z.literal(true),z.literal("on")],{message:"Confirm that you took this course."}).transform(()=>true),
});

export const reviewEditSchema = reviewSchema.omit({
  professorId:true,courseId:true,offeringId:true,semester:true,year:true,tookCourse:true,
}).extend({reviewId:z.string().uuid()});

export const questionSchema = z.object({
  title: safeText(10,160), body: safeText(20,2000),
  courseId: z.string().uuid().optional().or(z.literal("")), professorId: z.string().uuid().optional().or(z.literal("")),
  reviewId: z.string().uuid().optional().or(z.literal("")),
});

export const answerSchema = z.object({
  questionId: z.string().uuid(), body: safeText(10,2000),
  parentAnswerId: z.string().uuid().optional().or(z.literal("")),
});

export const reportSchema = z.object({
  targetType: z.enum(["review", "question", "answer"]), targetId: z.string().uuid(),
  reason: z.enum(["harassment", "spam", "personal_information", "misleading", "inappropriate", "other"]),
  details: z.string().trim().max(500).optional(),
});

export const communityCatalogSchema = z.object({
  collegeSlug: z.enum(["haverford", "bryn-mawr", "swarthmore"]),
  courseCode: z.string().trim().transform((value) => value.toUpperCase().replace(/\s+/g, " ")).pipe(
    z.string().regex(/^[A-Z]{2,10} [A-Z]?[0-9]{2,4}[A-Z]?$/, "Use a code like ECON H105, MATH B101, or CPSC 021."),
  ),
  courseTitle: z.string().trim().min(3).max(160),
  professorName: z.string().trim().min(3).max(120),
  semester: z.enum(["Fall", "Spring", "Summer"]),
  year: z.coerce.number().int().min(2000).max(2100),
});
