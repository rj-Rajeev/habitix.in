import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDb } from "@/lib/db";
import Goal, { type IRoadmapDay } from "@/models/Goal";
import {
  goalSyncService,
  syncRoadmapTaskCompletion,
} from "@/modules/goals/goal-sync.service";
import { taskCompletionService } from "@/modules/tasks/task-completion.service";
import { Task } from "@/modules/tasks/task.model";
import { Types } from "mongoose";

interface ToggleTaskRequestBody {
  goalId: string;
  dayNumber: number;
  taskId: string;
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as ToggleTaskRequestBody;
    const { goalId, dayNumber, taskId } = body;

    if (!goalId || !dayNumber || !taskId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectDb();
    const userId = session.user.id;

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

    await goalSyncService.syncGoalTasks(userId, goalId);
    await syncRoadmapTaskCompletion(goalId, dayNumber, taskId, newCompleted);

    const syncedTask = await Task.findOne({
      goalId: new Types.ObjectId(goalId),
      "source.legacyTaskId": taskId,
    });

    if (syncedTask && newCompleted) {
      await taskCompletionService.complete(syncedTask._id.toString(), userId, {
        scheduleRevision: "none",
      });
    } else if (syncedTask && !newCompleted) {
      await Task.updateOne(
        { _id: syncedTask._id },
        { status: "pending", completedAt: undefined }
      );
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
