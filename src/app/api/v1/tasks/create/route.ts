import { NextRequest } from "next/server";
import { handleRouteError, jsonOk, Errors } from "@/lib/api";
import { requireUserId } from "@/lib/auth/session";
import { connectDb } from "@/lib/db";
import { createManualTaskSchema } from "@/modules/tasks/task.schemas";
import { taskRepository } from "@/modules/tasks/task.repository";
import { goalRepository, isCourseGoalRecord } from "@/modules/goals/goal.repository";
import { goalCompletionService } from "@/modules/goals/goal-completion.service";
import { taskCompletionService } from "@/modules/tasks/task-completion.service";

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
    if (isCourseGoalRecord(goal)) {
      throw Errors.badRequest("Course Goals are curriculum-only and cannot accept manually created tasks");
    }

    const [task] = await taskRepository.createMany([
      {
        userId,
        goalId: parsed.data.goalId,
        task: parsed.data.task,
        topic: parsed.data.topic,
        title: parsed.data.topic,
        description: parsed.data.description,
        date: parsed.data.date,
        scheduledDate: parsed.data.date,
        priority: parsed.data.priority,
        minutes: parsed.data.minutes,
        estimatedMinutes: parsed.data.minutes,
        type: "execution",
        status: parsed.data.status === "completed" ? "pending" : parsed.data.status,
        source: {
          type: "manual",
        },
      },
    ]);
    if (parsed.data.status === "completed") {
      await taskCompletionService.complete(task._id.toString(), userId, {
        scheduleRevision: "none",
      });
    } else {
      await goalCompletionService.evaluateGoalCompletion(parsed.data.goalId, userId);
    }

    return jsonOk(
      {
        id: task._id.toString(),
        date: task.date,
        task: task.task,
        topic: task.topic,
        title: task.title,
        minutes: task.minutes,
        status: parsed.data.status === "completed" ? "completed" : task.status,
      },
      { status: 201 }
    );
  } catch (err) {
    return handleRouteError(err);
  }
}
