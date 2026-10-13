import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import { requireUserId } from "@/lib/auth/session";
import { pushSubscriptionService } from "@/modules/notifications/services/push-subscription.service";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const userId = await requireUserId();
    const body = await req.json();
    const { subscription, categories = [] } = body;

    if (!subscription?.endpoint) {
      return NextResponse.json(
        { error: "Invalid subscription" },
        { status: 400 }
      );
    }

    const result = await pushSubscriptionService.save({ userId, subscription, categories });

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    console.error("Subscription API error:", err);
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
}
