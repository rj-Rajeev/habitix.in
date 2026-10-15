import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { requireUserId } from "@/lib/auth/session";
import { handleRouteError } from "@/lib/api";
import { acceptConnectionRequest } from "@/modules/people-chat/services/connection-request.service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const recipientId = await requireUserId();
    const { requestId } = await params;
    await dbConnect();
    const result = await acceptConnectionRequest(requestId, recipientId);
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
