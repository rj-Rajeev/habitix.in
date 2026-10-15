import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth/session";
import { handleRouteError } from "@/lib/api";
import { issueSocketToken } from "@/modules/people-chat/services/socket-token.service";

export async function POST() {
  try {
    const userId = await requireUserId();
    const token = await issueSocketToken(userId);
    return NextResponse.json(token, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.log("---------------------");
    console.log(error);
    
    return handleRouteError(error);
  }
}
