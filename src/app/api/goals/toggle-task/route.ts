import { NextRequest, NextResponse } from "next/server";
import { getOptionalUserId } from "@/lib/auth/session";
import { connectDb } from "@/lib/db";
import Goal, { type IRoadmapDay } from "@/models/Goal";
import { goalSyncService } from "@/modules/goals/goal-sync.service";
import { taskCompletionService } from "@/modules/tasks/task-completion.service";
import { Task } from "@/modules/tasks/task.model";
import { Types } from "mongoose";

type RevisionSchedule =
  | "none"
  | "1h"
  | "3h"
  | "tomorrow"
  | "3d"
  | "7d"
  | "15d"
  | "custom";

interface ToggleTaskRequestBody {
  goalId: string;
  dayNumber: number;
  taskId: string;
  scheduleRevision?: RevisionSchedule;
  customRevisionDate?: string;
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = await getOptionalUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as ToggleTaskRequestBody;
    const { goalId, dayNumber, taskId, scheduleRevision, customRevisionDate } = body;

    if (!goalId || !dayNumber || !taskId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectDb();
    const goal = await Goal.findOne({ _id: goalId, userId });
    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    const dayIndex = goal.roadmap?.findIndex(
      (d: IRoadmapDay) => d.dayNumber === dayNumber
    );
    if (dayIndex === undefined || dayIndex === -1) {
      return NextResponse.json({ error: "Day not found" }, { status: 404 });
    }

    const day = goal.roadmap![dayIndex];
    const taskIndex = day.tasks.findIndex(
      (t: { _id?: { toString(): string } }) => t._id?.toString() === taskId
    );
    if (taskIndex === -1) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Ensure the Task exists while the embedded roadmap still has its old status.
    await goalSyncService.syncGoalTasks(userId, goalId);

    const newCompleted = !day.tasks[taskIndex].isCompleted;
    day.tasks[taskIndex].isCompleted = newCompleted;

    const allCompleted = day.tasks.every(
      (t: { isCompleted: boolean }) => t.isCompleted
    );
    day.completed = allCompleted;

    if (allCompleted && dayIndex + 1 < (goal.roadmap?.length ?? 0)) {
      goal.roadmap![dayIndex + 1].unlocked = true;
    }

    await goal.save();

    const syncedTask = await Task.findOne({
      userId: new Types.ObjectId(userId),
      goalId: new Types.ObjectId(goalId),
      "source.roadmapDayNumber": dayNumber,
      "source.legacyTaskId": taskId,
    });

    if (syncedTask && newCompleted) {
      await taskCompletionService.complete(syncedTask._id.toString(), userId, {
        scheduleRevision: scheduleRevision ?? "none",
        customRevisionDate,
      });
    } else if (syncedTask && !newCompleted) {
      await taskCompletionService.reopen(syncedTask._id.toString(), userId);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Toggle task error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
