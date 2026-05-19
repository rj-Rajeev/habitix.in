import { NextRequest } from "next/server";
import { handleRouteError } from "@/lib/api/handle-route";
import { jsonOk } from "@/lib/api/response";
import { requireUserId } from "@/lib/auth/session";
import { connectDb } from "@/lib/db";
import { goalService } from "@/modules/goals/goal.service";
import { taskRepository } from "@/modules/tasks/task.repository";
import Goal from "@/models/Goal";

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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDb();
    const userId = await requireUserId();
    const { id } = await params;

    const goal = await Goal.findOne({ _id: id, userId });
    if (!goal) {
      return new Response(JSON.stringify({ success: false, error: { message: "Goal not found" } }), { status: 404 });
    }

    // Remove tasks associated with the goal
    if (taskRepository.deleteByGoalId) {
      await taskRepository.deleteByGoalId(id);
    } else {
      await Goal.deleteOne({ _id: id, userId });
      return jsonOk({ success: true });
    }

    // Remove the goal itself
    await Goal.deleteOne({ _id: id, userId });

    return jsonOk({ success: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
