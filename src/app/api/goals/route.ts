import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { requireUserId } from "@/lib/auth/session";
import { createGoalSchema } from "@/modules/tasks/task.schemas";
import { goalService } from "@/modules/goals/goal.service";

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    await connectDb();
    const body = await req.json();
    const parsed = createGoalSchema.safeParse({
      ...body,
      hoursPerDay: body.hoursPerDay ?? 1,
      daysPerWeek: body.daysPerWeek ?? 5,
      preferredTime: body.preferredTime ?? "morning",
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid goal data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { id } = await goalService.create(userId, parsed.data);
    return NextResponse.json({ id });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create goal" },
      { status: 500 }
    );
  }
}
