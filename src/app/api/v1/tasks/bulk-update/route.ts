import { NextRequest } from "next/server";
import { handleRouteError } from "@/lib/api/handle-route";
import { Errors } from "@/lib/api/errors";
import { jsonOk } from "@/lib/api/response";
import { requireUserId } from "@/lib/auth/session";
import { connectDb } from "@/lib/db";
import { z } from "zod";
import { taskRepository } from "@/modules/tasks/task.repository";

const itemSchema = z.object({
  id: z.string().min(1),
  task: z.string().max(200).optional(),
  topic: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  minutes: z.number().min(1).max(1440).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  status: z.enum(["pending","in_progress","completed","skipped","cancelled"]).optional(),
});

const bodySchema = z.object({ items: z.array(itemSchema).min(1) });

export async function PATCH(req: NextRequest) {
  try {
    await connectDb();
    const userId = await requireUserId();
    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) throw Errors.badRequest("Invalid input", parsed.error.flatten());

    const results: Array<{ id: string; ok: boolean; error?: string }> = [];
    for (const item of parsed.data.items) {
      const existing = await taskRepository.findByIdForUser(item.id, userId);
      if (!existing) {
        results.push({ id: item.id, ok: false, error: "Not found or not owned" });
        continue;
      }
      try {
        await taskRepository.updateById(item.id, {
          ...(item.task ? { task: item.task } : {}),
          ...(item.topic ? { topic: item.topic } : {}),
          ...(item.description ? { description: item.description } : {}),
          ...(item.date ? { date: item.date } : {}),
          ...(item.minutes ? { minutes: item.minutes } : {}),
          ...(item.priority ? { priority: item.priority } : {}),
          ...(item.status ? { status: item.status } : {}),
        } as any);
        results.push({ id: item.id, ok: true });
      } catch (err) {
        results.push({ id: item.id, ok: false, error: String(err) });
      }
    }

    return jsonOk({ results });
  } catch (err) {
    return handleRouteError(err);
  }
}
