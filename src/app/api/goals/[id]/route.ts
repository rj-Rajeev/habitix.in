import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDb } from "@/lib/db";
import { goalService } from "@/modules/goals/goal.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;
  await connectDb();

  try {
    const session = await getServerSession(authOptions);
    const goal = session?.user?.id
      ? await goalService.getById(id, session.user.id)
      : await goalService.getById(id);

    return NextResponse.json(goal, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Goal not found" }, { status: 404 });
  }
}
