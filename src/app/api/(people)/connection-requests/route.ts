import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { requireUserId } from "@/lib/auth/session";
import { Errors, handleRouteError } from "@/lib/api";
import {
  createConnectionRequest,
  getConnectionRequestsForUser,
} from "@/modules/people-chat/services/connection-request.service";
import { createConnectionRequestSchema } from "@/modules/people-chat/validation/connection-request.schemas";

export async function POST(request: NextRequest) {
  try {
    const requesterId = await requireUserId();
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw Errors.badRequest("Invalid request body");
    }
    const input = createConnectionRequestSchema.safeParse(body);
    if (!input.success) throw Errors.badRequest("Invalid connection request", input.error.flatten());

    await dbConnect();
    const result = await createConnectionRequest(
      requesterId,
      input.data.recipientId,
      input.data.introductoryMessage
    );
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const direction = request.nextUrl.searchParams.get("direction");
    if (direction !== "incoming" && direction !== "outgoing") {
      throw Errors.badRequest("direction must be incoming or outgoing");
    }

    await dbConnect();
    const requests = await getConnectionRequestsForUser(userId, direction);
    return NextResponse.json(requests);
  } catch (error) {
    return handleRouteError(error);
  }
}
