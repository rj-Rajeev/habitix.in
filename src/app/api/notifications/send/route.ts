import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import PushSubscription from "@/models/PushSubscription";
import webpush from "web-push";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: NextRequest) {
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
