import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDb } from "@/lib/db";
import { goalService } from "@/modules/goals/goal.service";

export async function GET() {
  try {
    await connectDb();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ count: 0 }, { status: 401 });
    }

    const count = await goalService.countForUser(session.user.id);
    return NextResponse.json({ count });
  } catch (err) {
    console.error("Failed to fetch goal count:", err);
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}
