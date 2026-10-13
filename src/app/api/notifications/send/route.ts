import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import { requireUserId } from "@/lib/auth/session";
import { notificationService } from "@/modules/notifications/services/notification.service";

export async function POST(req: NextRequest) {
  try {
    notificationService.ensureConfigured();
  } catch {
    return NextResponse.json(
      { error: "Push notifications not configured" },
      { status: 503 }
    );
  }

  try {
    await connectDb();
    const userId = await requireUserId();
    const body = await req.json();
    const { message, title = "Habitix", category } = body;

    const result = await notificationService.sendToUser({
      userId,
      title,
      body: message,
      category,
    });

    // Preserve the legacy response contract: this field counts selected
    // subscriptions, not confirmed device deliveries.
    return NextResponse.json({ success: true, sent: result.selected });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
