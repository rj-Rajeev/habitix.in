import { z } from "zod";

export const courseCreateSchema = z.object({
  title: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  shortDescription: z.string().trim().min(1),
  description: z.string().trim().min(1),
  thumbnail: z.string().url().optional().or(z.literal("")),
  price: z.number().min(0),
  status: z.enum(["draft", "published"]).default("draft"),
}).strict();

export const courseUpdateSchema = courseCreateSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one course field is required"
);

export const moduleSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().optional(),
  order: z.number().int().min(0).default(0),
}).strict();

export const moduleUpdateSchema = moduleSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one module field is required"
);

export const lessonSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().optional(),
  order: z.number().int().min(0).default(0),
  markdownContent: z.string().optional(),
  videoUrl: z.string().url().optional().or(z.literal("")),
  pdfUrl: z.string().url().optional().or(z.literal("")),
  isFree: z.boolean().default(false),
}).strict();

export const lessonUpdateSchema = lessonSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one lesson field is required"
);

export function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isObjectId(value: string): boolean {
  return /^[a-f\d]{24}$/i.test(value);
}
