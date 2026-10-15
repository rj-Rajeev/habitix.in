import { NextResponse } from "next/server";
import { Types } from "mongoose";
import dbConnect from "@/lib/db";
import { requireUserId } from "@/lib/auth/session";
import { Errors, handleRouteError } from "@/lib/api";
import { getOtherParticipantDisplayName } from "@/modules/people-chat/services/chat.service";

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { chatId } = await params;
    if (!OBJECT_ID_PATTERN.test(chatId) || !Types.ObjectId.isValid(chatId)) {
      throw Errors.notFound("Chat");
    }

    await dbConnect();
    const participant = await getOtherParticipantDisplayName(chatId, userId);
    return NextResponse.json(participant);
  } catch (error) {
    return handleRouteError(error);
  }
}
