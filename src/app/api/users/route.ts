import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { getOptionalUserId } from "@/lib/auth/session";

export async function GET() {
  try {
    await dbConnect();

    const currentUserId = await getOptionalUserId();
    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = await User.find({
      _id: { $ne: currentUserId },
    }).select("_id fullname");

    return NextResponse.json(users);

  } catch (error) {
    console.log(error);
    
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
