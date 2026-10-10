import { NextRequest, NextResponse } from "next/server";
import { getOptionalUserId } from "@/lib/auth/session";
import { AppError } from "@/lib/api/errors";
import { handleRouteError } from "@/lib/api/handle-route";
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

    let dayIndex = goal.roadmap?.findIndex(
      (d: IRoadmapDay) => d.dayNumber === dayNumber
    );
    if (dayIndex === undefined || dayIndex === -1) {
      return NextResponse.json({ error: "Day not found" }, { status: 404 });
    }

    let day = goal.roadmap![dayIndex];
    let taskIndex = day.tasks.findIndex(
      (t: { _id?: { toString(): string } }) => t._id?.toString() === taskId
    );
    if (taskIndex === -1) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    let syncedTasks = await Task.find({
      userId: new Types.ObjectId(userId),
      goalId: new Types.ObjectId(goalId),
      "source.type": "roadmap_sync",
    });
    let matchingTasks = syncedTasks.filter((task) =>
      task.source.roadmapDayNumber === dayNumber && task.source.legacyTaskId === taskId
    );

    if (matchingTasks.length === 0 && !goal.tasksSyncedAt) {
      await goalSyncService.syncGoalTasks(userId, goalId);
      syncedTasks = await Task.find({
        userId: new Types.ObjectId(userId),
        goalId: new Types.ObjectId(goalId),
        "source.type": "roadmap_sync",
      });
      matchingTasks = syncedTasks.filter((task) =>
        task.source.roadmapDayNumber === dayNumber && task.source.legacyTaskId === taskId
      );
      const refreshedGoal = await Goal.findOne({ _id: goalId, userId });
      if (refreshedGoal) {
        const refreshedDayIndex = refreshedGoal.roadmap?.findIndex((item: IRoadmapDay) => item.dayNumber === dayNumber) ?? -1;
        if (refreshedDayIndex >= 0) {
          dayIndex = refreshedDayIndex;
          day = refreshedGoal.roadmap![dayIndex];
          taskIndex = day.tasks.findIndex((item: { _id?: { toString(): string } }) => item._id?.toString() === taskId);
        }
      }
    }

    if (matchingTasks.length > 1) {
      return NextResponse.json({ error: "Task mapping is ambiguous" }, { status: 409 });
    }

    if (matchingTasks.length === 1) {
      const syncedTask = matchingTasks[0];
      if (syncedTask.status === "completed") {
        await taskCompletionService.reopen(syncedTask._id.toString(), userId);
      } else {
        await taskCompletionService.complete(syncedTask._id.toString(), userId, {
          scheduleRevision: scheduleRevision ?? "none",
          customRevisionDate,
        });
      }
    } else if (syncedTasks.length > 0) {
      return NextResponse.json({ error: "Task has no unambiguous normalized mapping" }, { status: 409 });
    } else {
      // Legacy Goals with no normalized roadmap Tasks retain their embedded fallback.
      if (taskIndex < 0) return NextResponse.json({ error: "Task not found" }, { status: 404 });
      const newCompleted = !day.tasks[taskIndex].isCompleted;
      day.tasks[taskIndex].isCompleted = newCompleted;
      const allCompleted = day.tasks.every((task: { isCompleted: boolean }) => task.isCompleted);
      day.completed = allCompleted;
      if (allCompleted && dayIndex + 1 < (goal.roadmap?.length ?? 0)) {
        goal.roadmap![dayIndex + 1].unlocked = true;
      }
      await goal.save();
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof AppError && error.code === "CONFLICT") {
      return handleRouteError(error);
    }

    console.error("Toggle task error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
