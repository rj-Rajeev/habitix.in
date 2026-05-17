import { handleRouteError, jsonOk } from "@/lib/api";
import { requireUserId } from "@/lib/auth/session";
import { connectDb } from "@/lib/db";
import { todayService } from "@/modules/tasks/today.service";

export async function GET() {
  try {
    await connectDb();
    const userId = await requireUserId();
    const queue = await todayService.getTodayQueue(userId);
    return jsonOk(queue);
  } catch (err) {
    return handleRouteError(err);
  }
}
