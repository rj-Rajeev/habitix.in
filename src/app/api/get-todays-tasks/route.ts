import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDb from "@/lib/db";
import Goal from "@/models/Goal";

export async function GET(req: NextRequest) {
  await connectDb();

  const session = await getServerSession();
  console.log(session, "-----------");

  if (!session || !session.user?.id) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const userId = session.user.id;
  const todayStr = new Date().toISOString().split("T")[0];

  try {
    const userGoals = await Goal.find({ userId });

    const todaysTasks = [];

    for (const goal of userGoals) {
      for (const day of goal.roadmap) {
        const dayDateStr = new Date(day.dayDate).toISOString().split("T")[0];
        if (dayDateStr === todayStr) {
          for (const task of day.tasks) {
            todaysTasks.push({
              goalId: goal._id,
              goalTitle: goal.title,
              dayNumber: day.dayNumber,
              taskId: task._id,
              taskTitle: task.title,
              isCompleted: task.isCompleted,
              dayDate: dayDateStr,
            });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      count: todaysTasks.length,
      tasks: todaysTasks,
    });
  } catch (error) {
    console.error("Error fetching today's tasks:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
