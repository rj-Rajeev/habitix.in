import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Chat from "@/models/PeoplesChat/Chat";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function POST(req: NextRequest) {
  await dbConnect();

  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const currentUserId = session.user.id;
  const { userId } = await req.json();

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