import { NextResponse } from "next/server";
import { Types } from "mongoose";
import dbConnect from "@/lib/db";
import Chat from "@/models/PeoplesChat/Chat";
import Message from "@/models/PeoplesChat/Message";
import { requireUserId } from "@/lib/auth/session";
import { Errors, handleRouteError } from "@/lib/api";

export async function GET(
  _req: Request,
  { params }: { params: { chatId: string } }
) {
  try {
    const userId = await requireUserId();
    const { chatId } = params;
    if (!Types.ObjectId.isValid(chatId)) throw Errors.notFound("Chat");

    await dbConnect();
    const chat = await Chat.findById(chatId).select("participants");
    if (!chat) throw Errors.notFound("Chat");
    const isParticipant = chat.participants.some(
      (participant: Types.ObjectId) => participant.toString() === userId
    );
    if (!isParticipant) throw Errors.forbidden();

    const messages = await Message.find({ chatId }).sort({ createdAt: 1 });
    return NextResponse.json(messages);
  } catch (error) {
    return handleRouteError(error);
  }
}
