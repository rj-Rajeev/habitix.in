import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Goal from "@/models/Goal";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params; // ✅ await here
  await connectDb();

  try {
    const goal = await Goal.findById(id);
    if (!goal) return NextResponse.json({ message: "Goal not found" }, { status: 404 });
    return NextResponse.json(goal, { status: 200 });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
