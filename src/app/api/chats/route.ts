import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Types } from "mongoose";
import Chat from "@/models/PeoplesChat/Chat";
import { getOptionalUserId } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  await dbConnect();

  const currentUserId = await getOptionalUserId();
  if (!currentUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await req.json();
  if (!userId || !Types.ObjectId.isValid(userId)) {
    return NextResponse.json(
      { error: "Invalid userId" },
      { status: 400 }
    );
  }

  let chat = await Chat.findOne({
    participants: { $all: [currentUserId, userId] },
  });

  if (!chat) {
    chat = await Chat.create({
      participants: [currentUserId, userId],
    });
  }

  return NextResponse.json({ chatId: chat._id });
}
