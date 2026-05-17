import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import PushSubscription from "@/models/PushSubscription";
import webpush from "web-push";

function ensureVapid() {
  const subject = process.env.VAPID_SUBJECT;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!subject || !publicKey || !privateKey) {
    throw new Error("Push notifications are not configured");
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export async function POST(req: NextRequest) {
  try {
    ensureVapid();
  } catch {
    return NextResponse.json(
      { error: "Push notifications not configured" },
      { status: 503 }
    );
  }

  await connectDb();
  const body = await req.json();
  const { message, title = "Habitix", userId, category } = body;

  const query: any = {};
  if (userId) query.userId = userId;
  else if (category) query.categories = category;

  const subs = await PushSubscription.find(query);
  const payload = JSON.stringify({ title, body: message });

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(sub.subscription, payload).catch((err) => {
        if (err.statusCode === 410 || err.statusCode === 404) {
          return PushSubscription.deleteOne({ _id: sub._id });
        }
      })
    )
  );

  return NextResponse.json({ success: true, sent: results.length });
}
