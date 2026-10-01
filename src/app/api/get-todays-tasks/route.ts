import { NextResponse } from "next/server";
import { getOptionalUserId } from "@/lib/auth/session";
import { connectDb } from "@/lib/db";
import { todayService } from "@/modules/tasks/today.service";

/** Legacy shape for older clients */
export async function GET() {
  await connectDb();

  const userId = await getOptionalUserId();
  if (!userId) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const queue = await todayService.getTodayQueue(userId);
    const all = [
      ...queue.sections.overdue,
      ...queue.sections.today,
      ...queue.sections.revisions,
    ];

    const tasks = all.map((t) => ({
      goalId: t.goalId,
      goalTitle: t.goalTitle,
      dayNumber: 0,
      dayDate: t.scheduledDate,
      tasks: {
        _id: t._id,
        title: t.title,
        isCompleted: t.status === "completed",
        createdAt: new Date().toISOString(),
      },
    }));

    return NextResponse.json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    console.error("Error fetching today's tasks:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
