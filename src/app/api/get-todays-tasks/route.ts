import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectDb from "@/lib/db";
import Goal from "@/models/Goal";

export async function GET(req: NextRequest) {
  await connectDb();

  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const userId = session.user.id;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayDate = today.toISOString();

  try {
    const todaysTasks = await Goal.aggregate([
      {
        $match: {
          userId: userId,
        },
      },
      {
        $unwind: "$roadmap",
      },
      {
        $match: {
          "roadmap.dayDate": `${todayDate}`,
        },
      },
      {
        $unwind: "$roadmap.tasks",
      },
      {
        $project: {
          _id: 0,
          goalId: "$_id",
          goalTitle: "$title",
          dayNumber: "$roadmap.dayNumber",
          dayDate: "$roadmap.dayDate",
          tasks: "$roadmap.tasks",
        },
      },
    ]);

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
