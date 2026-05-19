import { NextRequest } from "next/server";
import { handleRouteError } from "@/lib/api/handle-route";
import { Errors } from "@/lib/api/errors";
import { jsonOk } from "@/lib/api/response";
import { requireUserId } from "@/lib/auth/session";
import { connectDb } from "@/lib/db";
import { z } from "zod";
import { taskRepository } from "@/modules/tasks/task.repository";

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  estimatedMinutes: z.number().min(1).max(1440).optional(),
  status: z.enum(["pending", "in_progress", "completed", "skipped", "cancelled"]).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDb();
    const userId = await requireUserId();
    const { id } = await params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) throw Errors.badRequest("Invalid input", parsed.error.flatten());

    // ensure task belongs to user
    const existing = await taskRepository.findByIdForUser(id, userId);
    if (!existing) throw Errors.notFound("Task");

    const update = parsed.data;
    const updated = await taskRepository.updateById(id, update as any);

    return jsonOk({ id: updated?._id?.toString(), title: updated?.title, scheduledDate: updated?.scheduledDate, estimatedMinutes: updated?.estimatedMinutes, status: updated?.status, description: updated?.description });
  } catch (err) {
    return handleRouteError(err);
  }
}
