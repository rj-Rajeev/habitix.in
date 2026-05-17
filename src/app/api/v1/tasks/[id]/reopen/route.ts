import { handleRouteError, jsonOk } from "@/lib/api";
import { requireUserId } from "@/lib/auth/session";
import { connectDb } from "@/lib/db";
import { taskCompletionService } from "@/modules/tasks/task-completion.service";

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDb();
    const userId = await requireUserId();
    const { id } = await params;
    const result = await taskCompletionService.reopen(id, userId);
    return jsonOk(result);
  } catch (err) {
    return handleRouteError(err);
  }
}
