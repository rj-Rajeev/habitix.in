
import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Goal from "@/models/Goal";
import { ObjectId } from "mongodb";

interface ToggleTaskRequestBody {
  goalId: string;
  dayNumber: number;
  taskId: string;
}

export async function PATCH(req: NextRequest) {
  try {
    const body = (await req.json()) as ToggleTaskRequestBody;
    const { goalId, dayNumber, taskId } = body;

    if (!goalId || !dayNumber || !taskId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectDb();

    const goal = await Goal.findById(goalId);
    if (!goal)
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });

    const dayIndex = goal.roadmap.findIndex(
      (d: { dayNumber: number }) => d.dayNumber === dayNumber
    );
    if (dayIndex === -1)
      return NextResponse.json({ error: "Day not found" }, { status: 404 });

    const taskIndex = goal.roadmap[dayIndex].tasks.findIndex(
      (t: { _id: ObjectId }) => t._id.toString() === taskId
    );
    if (taskIndex === -1)
      return NextResponse.json({ error: "Task not found" }, { status: 404 });

    // Toggle task completion
    goal.roadmap[dayIndex].tasks[taskIndex].isCompleted =
      !goal.roadmap[dayIndex].tasks[taskIndex].isCompleted;

    // Mark day completed if all tasks are done
    const allCompleted = goal.roadmap[dayIndex].tasks.every(
      (t: { isCompleted: boolean }) => t.isCompleted
    );
    goal.roadmap[dayIndex].completed = allCompleted;

    // Unlock next day
    if (allCompleted && dayIndex + 1 < goal.roadmap.length) {
      goal.roadmap[dayIndex + 1].unlocked = true;
    }

    await goal.save();

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Toggle task error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
