import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Message from "@/models/PeoplesChat/Message";

export async function GET(
  req: Request,
  { params }: { params: { chatId: string } }
) {
  await dbConnect();

  const messages = await Message.find({
    chatId: params.chatId,
  }).sort({ createdAt: 1 });

  return NextResponse.json(messages);
}