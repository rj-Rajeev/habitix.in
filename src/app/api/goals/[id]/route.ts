import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { requireUserId } from "@/lib/auth/session";
import { goalService } from "@/modules/goals/goal.service";
import { handleRouteError } from "@/lib/api";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { id } = await params;
    const userId = await requireUserId();

    await connectDb();

    const goal = await goalService.getById(id, userId);

    return NextResponse.json(goal, { status: 200 });
  } catch (error) {
    return handleRouteError(error);
  }
}