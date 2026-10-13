import { NextResponse } from "next/server";
import { Types } from "mongoose";
import dbConnect from "@/lib/db";
import { requireUserId } from "@/lib/auth/session";
import { Errors, handleRouteError } from "@/lib/api";
import { getChatHistory } from "@/modules/people-chat/services/message.service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { chatId } = await params;
    if (!Types.ObjectId.isValid(chatId)) throw Errors.notFound("Chat");

    await dbConnect();
    const messages = await getChatHistory(chatId, userId);
    return NextResponse.json(messages);
  } catch (error) {
    return handleRouteError(error);
  }
}
