import { handleRouteError, jsonOk } from "@/lib/api";
import { requireUserId } from "@/lib/auth/session";
import { connectDb } from "@/lib/db";
import { schedulingService } from "@/modules/scheduling/scheduling.service";

export async function POST() {
  try {
    await connectDb();
    const userId = await requireUserId();
    const result = await schedulingService.redistributeUserBacklog(userId);
    return jsonOk(result);
  } catch (err) {
    return handleRouteError(err);
  }
}
