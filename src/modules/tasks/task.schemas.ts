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
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const createGoalSchema = z.object({
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
          })
        ),
      })
    )
    .optional(),
});

export const generateRoadmapSchema = z.object({
  title: z.string().min(1),
  duration: z.string().min(1),
  hoursPerDay: z.coerce.number().min(0.5).max(24),
  daysPerWeek: z.coerce.number().min(1).max(7),
  preferredTime: z.string(),
  motivation: z.string().optional(),
});

export const createManualTaskSchema = z.object({
  goalId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  estimatedMinutes: z.coerce.number().min(5).max(480).default(30),
});

export const importTasksSchema = z.object({
  goalId: z.string().min(1),
  scheduledDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export type CompleteTaskInput = z.infer<typeof completeTaskSchema>;
export type RescheduleTaskInput = z.infer<typeof rescheduleTaskSchema>;
export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type GenerateRoadmapInput = z.infer<typeof generateRoadmapSchema>;
export type CreateManualTaskInput = z.infer<typeof createManualTaskSchema>;
export type ImportTasksInput = z.infer<typeof importTasksSchema>;
