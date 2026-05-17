import { NextRequest } from "next/server";
import { handleRouteError, jsonOk, Errors } from "@/lib/api";
import { requireUserId } from "@/lib/auth/session";
import { connectDb } from "@/lib/db";
import { createManualTaskSchema } from "@/modules/tasks/task.schemas";
import { taskRepository } from "@/modules/tasks/task.repository";
import { goalRepository } from "@/modules/goals/goal.repository";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const userId = await requireUserId();
    const body = await req.json();

    const parsed = createManualTaskSchema.safeParse(body);
    if (!parsed.success) {
      throw Errors.badRequest("Invalid task data", parsed.error.flatten());
    }

    const goal = await goalRepository.findByIdForUser(
      parsed.data.goalId,
      userId
    );
    if (!goal) {
      throw Errors.notFound("Goal");
    }

    const [task] = await taskRepository.createMany([
      {
        userId,
        goalId: parsed.data.goalId,
        title: parsed.data.title,
        description: parsed.data.description,
        scheduledDate: parsed.data.scheduledDate,
        priority: parsed.data.priority,
        estimatedMinutes: parsed.data.estimatedMinutes,
        type: "execution",
        status: "pending",
        source: {
          type: "manual",
        },
      },
    ]);

    return jsonOk(
      {
        id: task._id.toString(),
        title: task.title,
        scheduledDate: task.scheduledDate,
      },
      { status: 201 }
    );
  } catch (err) {
    return handleRouteError(err);
  }
}
