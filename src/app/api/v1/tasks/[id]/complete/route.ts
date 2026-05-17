import { NextRequest } from "next/server";
import { handleRouteError, jsonOk } from "@/lib/api";
import { requireUserId } from "@/lib/auth/session";
import { connectDb } from "@/lib/db";
import { completeTaskSchema } from "@/modules/tasks/task.schemas";
import { taskCompletionService } from "@/modules/tasks/task-completion.service";
import { Errors } from "@/lib/api";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDb();
    const userId = await requireUserId();
    const { id } = await params;
    const body = await req.json();
    const parsed = completeTaskSchema.safeParse(body);
    if (!parsed.success) {
      throw Errors.badRequest("Invalid input", parsed.error.flatten());
    }

    const result = await taskCompletionService.complete(
      id,
      userId,
      parsed.data
    );
    return jsonOk(result);
  } catch (err) {
    return handleRouteError(err);
  }
}
