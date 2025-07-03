import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import PushSubscription from "@/models/PushSubscription";

export async function POST(req: NextRequest) {
  await connectDb();
  const body = await req.json();
  const { subscription, categories, userId } = body;

  if (!subscription || !subscription.endpoint) {
    return NextResponse.json(
      { error: "Invalid subscription" },
      { status: 400 }
    );
  }

  await PushSubscription.findOneAndUpdate(
    { "subscription.endpoint": subscription.endpoint },
    { subscription, categories, userId },
    { upsert: true, new: true }
  );

  return NextResponse.json({ success: true });
}
