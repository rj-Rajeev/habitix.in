import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { requireUserId } from "@/lib/auth/session";
import { Errors, handleRouteError } from "@/lib/api";
import {
  getDiscoveryPreferences,
  saveDiscoveryPreferences,
} from "@/modules/people-chat/services/discovery.service";
import { updateDiscoveryPreferencesSchema } from "@/modules/people-chat/validation/discovery.schemas";

export async function GET() {
  try {
    const userId = await requireUserId();
    await dbConnect();
    return NextResponse.json(await getDiscoveryPreferences(userId));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = await requireUserId();
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw Errors.badRequest("Invalid request body");
    }
    const parsed = updateDiscoveryPreferencesSchema.safeParse(body);
    if (!parsed.success) {
      throw Errors.badRequest("Invalid discovery preferences", parsed.error.flatten());
    }

    await dbConnect();
    return NextResponse.json(await saveDiscoveryPreferences(userId, parsed.data));
  } catch (error) {
    return handleRouteError(error);
  }
}
