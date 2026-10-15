import { z } from "zod";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid user ID");

export const createConnectionRequestSchema = z
  .object({
    recipientId: objectIdSchema,
    introductoryMessage: z
      .string()
      .trim()
      .min(1, "Introductory message is required")
      .max(500, "Introductory message must be 500 characters or fewer"),
  })
  .strict();

export type CreateConnectionRequestPayload = z.infer<
  typeof createConnectionRequestSchema
>;
