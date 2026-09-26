import { z } from "zod";

export const completeTaskSchema = z.object({
  note: z.string().max(2000).optional(),
  scheduleRevision: z
    .enum(["1h", "3h", "tomorrow", "3d", "7d", "15d", "custom", "none"])
    .optional()
    .default("none"),
  customRevisionDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export const skipTaskSchema = z.object({
  reason: z.string().max(500).optional(),
});

export const rescheduleTaskSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const createGoalSchema = z.object({
  planSource: z.enum(["course", "ai", "manual"]).optional(),
  courseId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  targetDate: z.string().optional(),
  hoursPerDay: z.coerce.number().min(0.5).max(24).default(1),
  preferredTime: z.string().default("morning"),
  daysPerWeek: z.coerce.number().min(1).max(7).default(5),
  motivation: z.string().max(2000).optional(),
  timezone: z.string().default("UTC"),
  roadmap: z
    .array(
      z.object({
        dayNumber: z.number(),
        dayDate: z.union([z.string(), z.coerce.date()]),
        unlocked: z.boolean().optional(),
        completed: z.boolean().optional(),
        tasks: z.array(
          z.object({
            title: z.string(),
            isCompleted: z.boolean().optional(),
            courseLessonId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
          })
        ),
      })
    )
    .optional(),
}).superRefine((value, context) => {
  const source = value.planSource ?? (value.courseId ? "course" : "manual");
  if (source === "course" && !value.courseId) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["courseId"], message: "Course goals require a courseId" });
  }
  if (source !== "course" && value.courseId) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["courseId"], message: `${source} goals cannot include a courseId` });
  }
});

export const generateRoadmapSchema = z.object({
  courseId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  title: z.string().min(1),
  duration: z.string().min(1),
  hoursPerDay: z.coerce.number().min(0.5).max(24),
  daysPerWeek: z.coerce.number().min(1).max(7),
  preferredTime: z.string(),
  motivation: z.string().optional(),
  currentLevel: z.enum(["beginner", "some_knowledge", "comfortable"]).optional(),
  objective: z.string().max(2000).optional(),
  existingKnowledge: z.string().max(2000).optional(),
  focusAreas: z.array(z.string().max(200)).max(100).optional(),
  learningPreference: z.enum(["finish_course", "understand_deeply", "interview_prep", "learn_practice", "build_something"]).optional(),
  additionalRequirements: z.string().max(2000).optional(),
});

export const createManualTaskSchema = z.object({
  goalId: z.string().min(1),
  task: z.string().min(1).max(200),
  topic: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  minutes: z.coerce.number().min(5).max(480).default(30),
  status: z
    .enum(["pending", "in_progress", "completed", "skipped", "cancelled"])
    .default("pending"),
});

export const importTasksSchema = z.object({
  goalId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export type CompleteTaskInput = z.infer<typeof completeTaskSchema>;
export type RescheduleTaskInput = z.infer<typeof rescheduleTaskSchema>;
export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type GenerateRoadmapInput = z.infer<typeof generateRoadmapSchema>;
export type CreateManualTaskInput = z.infer<typeof createManualTaskSchema>;
export type ImportTasksInput = z.infer<typeof importTasksSchema>;
