import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Types } from "mongoose";
import { getOptionalUserId } from "@/lib/auth/session";
import { handleRouteError } from "@/lib/api";
import {
  getExistingChatForPair,
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
  try {
    await dbConnect();

    const currentUserId = await getOptionalUserId();
    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid userId" },
        { status: 400 }
      );
    }
    const userId =
      body && typeof body === "object" && !Array.isArray(body)
        ? (body as Record<string, unknown>).userId
        : undefined;
    if (typeof userId !== "string" || !Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: "Invalid userId" },
        { status: 400 }
      );
    }

    const chat = await getExistingChatForPair(currentUserId, userId);

    return NextResponse.json({ chatId: chat._id });
  } catch (error) {
    return handleRouteError(error);
  }
}
