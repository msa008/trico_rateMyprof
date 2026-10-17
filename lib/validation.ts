import { z } from "zod";

const rating = z.coerce.number().int().min(1).max(5);
export const reviewSchema = z.object({
  professorId: z.string().uuid(), courseId: z.string().uuid(), offeringId: z.string().uuid(),
  semester: z.enum(["Fall", "Spring", "Summer"]), year: z.coerce.number().int().min(2000).max(2100),
  teachingQuality: rating, workload: rating, gradingDifficulty: rating,
  wouldTakeAgain: z.enum(["yes", "no"]).transform((v) => v === "yes"),
  attendanceImportance: z.enum(["Not important", "Somewhat important", "Very important", "Required"]),
  body: z.string().trim().min(80).max(3000), advice: z.string().trim().max(1000).optional(),
  wishKnown: z.string().trim().max(1000).optional(), tookCourse: z.literal("on", { message: "Confirm that you took this course." }),
});

export const questionSchema = z.object({
  title: z.string().trim().min(10).max(160), body: z.string().trim().min(20).max(2000),
  courseId: z.string().uuid().optional().or(z.literal("")), professorId: z.string().uuid().optional().or(z.literal("")),
  reviewId: z.string().uuid().optional().or(z.literal("")),
});

export const answerSchema = z.object({
  questionId: z.string().uuid(), body: z.string().trim().min(10).max(2000),
  parentAnswerId: z.string().uuid().optional().or(z.literal("")),
});

export const reportSchema = z.object({
  targetType: z.enum(["review", "question", "answer"]), targetId: z.string().uuid(),
  reason: z.enum(["harassment", "spam", "personal_information", "misleading", "inappropriate", "other"]),
  details: z.string().trim().max(500).optional(),
});
