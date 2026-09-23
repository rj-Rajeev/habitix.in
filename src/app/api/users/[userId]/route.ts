import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { requireUserId } from "@/lib/auth/session";

export async function GET(_req: Request, { params }: any) {
  try {
    await dbConnect();
    const userId = await requireUserId();
    const targetUserId = String(params.userId);

    if (targetUserId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const user = await User.findById(userId).select("_id fullname email");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}