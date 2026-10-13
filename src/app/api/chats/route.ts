import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Types } from "mongoose";
import { getOptionalUserId } from "@/lib/auth/session";
import {
  getOrCreateChat,
  getUserConversations,
} from "@/modules/people-chat/services/chat.service";

export async function GET() {
  await dbConnect();

  const currentUserId = await getOptionalUserId();
  if (!currentUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Chat timestamps reflect creation time, not the time of the latest message.
  const conversations = await getUserConversations(currentUserId);
  return NextResponse.json(conversations);
}

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

  const chat = await getOrCreateChat(currentUserId, userId);

  return NextResponse.json({ chatId: chat._id });
}
