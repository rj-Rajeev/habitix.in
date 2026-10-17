import { handleRouteError, jsonOk } from "@/lib/api";
import { requireUserId } from "@/lib/auth/session";
import { connectDb } from "@/lib/db";
import { taskHistoryService } from "@/modules/tasks/task-history.service";

export async function GET() {
  try {
    await connectDb();
    const userId = await requireUserId();
    const events = await taskHistoryService.listRecentForUser(userId);
    return jsonOk({ events });
  } catch (err) {
    return handleRouteError(err);
  }
}
