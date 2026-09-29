import { NextRequest } from "next/server";
import { handleRouteError, jsonOk } from "@/lib/api";
import { requireUserId } from "@/lib/auth/session";
import { connectDb } from "@/lib/db";
import { todayService } from "@/modules/tasks/today.service";

function isValidTimezone(value: string | null): value is string {
  if (!value) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDb();
    const userId = await requireUserId();
    const requestedTimezone = request.nextUrl.searchParams.get("timezone");
    const timezone = isValidTimezone(requestedTimezone) ? requestedTimezone : "UTC";
    const queue = await todayService.getTodayQueue(userId, timezone);
    return jsonOk(queue);
  } catch (err) {
    return handleRouteError(err);
  }
}
