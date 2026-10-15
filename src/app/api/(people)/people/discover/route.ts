import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { requireUserId } from "@/lib/auth/session";
import { handleRouteError } from "@/lib/api";
import { discoverPeople } from "@/modules/people-chat/services/discovery.service";

export async function GET() {
  try {
    const userId = await requireUserId();
    await dbConnect();
    return NextResponse.json({ candidates: await discoverPeople(userId) });
  } catch (error) {
    return handleRouteError(error);
  }
}
