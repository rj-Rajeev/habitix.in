import { NextResponse } from "next/server";
import { getOptionalUserId } from "@/lib/auth/session";
import { connectDb } from "@/lib/db";
import { goalService } from "@/modules/goals/goal.service";

export async function GET() {
  try {
    await connectDb();
    const userId = await getOptionalUserId();
    if (!userId) {
      return NextResponse.json({ count: 0 }, { status: 401 });
    }

    const count = await goalService.countForUser(userId);
    return NextResponse.json({ count });
  } catch (err) {
    console.error("Failed to fetch goal count:", err);
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}
