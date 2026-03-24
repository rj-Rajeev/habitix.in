import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET() {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = session.user.id;

    const users = await User.find({
      _id: { $ne: currentUserId },
    }).select("_id fullname email");

    return NextResponse.json(users);

  } catch (error) {
    console.log(error);
    
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}