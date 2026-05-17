import { handleRouteError, jsonOk } from "@/lib/api";
import { requireUserId } from "@/lib/auth/session";
import { connectDb } from "@/lib/db";
import { goalService } from "@/modules/goals/goal.service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDb();
    const userId = await requireUserId();
    const { id } = await params;
    const goal = await goalService.getById(id, userId);
    return jsonOk(goal);
  } catch (err) {
    return handleRouteError(err);
  }
}
