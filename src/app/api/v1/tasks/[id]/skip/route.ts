import { NextRequest } from "next/server";
import { handleRouteError, jsonOk, Errors } from "@/lib/api";
import { requireUserId } from "@/lib/auth/session";
import { connectDb } from "@/lib/db";
import { skipTaskSchema } from "@/modules/tasks/task.schemas";
import { taskCompletionService } from "@/modules/tasks/task-completion.service";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDb();
    const userId = await requireUserId();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const parsed = skipTaskSchema.safeParse(body);
    if (!parsed.success) {
      throw Errors.badRequest("Invalid input", parsed.error.flatten());
    }

    const result = await taskCompletionService.skip(
      id,
      userId,
      parsed.data.reason
    );
    return jsonOk(result);
  } catch (err) {
    return handleRouteError(err);
  }
}
