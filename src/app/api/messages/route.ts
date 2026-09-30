import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import dbConnect from "@/lib/db";
import Chat from "@/models/PeoplesChat/Chat";
import Message from "@/models/PeoplesChat/Message";
import { requireUserId } from "@/lib/auth/session";
import { Errors, handleRouteError } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const { chatId, text } = await req.json();
    if (typeof chatId !== "string" || !Types.ObjectId.isValid(chatId)) {
      throw Errors.notFound("Chat");
    }
    if (typeof text !== "string" || !text.trim()) {
      throw Errors.badRequest("Message text is required");
    }

    await dbConnect();
    const chat = await Chat.findById(chatId).select("participants");
    if (!chat) throw Errors.notFound("Chat");
    const isParticipant = chat.participants.some(
      (participant: Types.ObjectId) => participant.toString() === userId
    );
    if (!isParticipant) throw Errors.forbidden();

    const message = await Message.create({
      chatId,
      senderId: userId,
      text: text.trim(),
    });

    return NextResponse.json(message);
  } catch (error) {
    return handleRouteError(error);
  }
}
