import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import dbConnect from "@/lib/db";
import { requireUserId } from "@/lib/auth/session";
import { Errors, handleRouteError } from "@/lib/api";
import { sendChatMessage } from "@/modules/people-chat/services/message.service";

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
    const message = await sendChatMessage({
      chatId,
      senderId: userId,
      text: text.trim(),
    });

    return NextResponse.json(message);
  } catch (error) {
    return handleRouteError(error);
  }
}
