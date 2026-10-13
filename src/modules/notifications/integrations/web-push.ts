import webpush from "web-push";
import type { WebPushSubscriptionInput } from "../types/notification";

export class PushNotificationsNotConfiguredError extends Error {
  constructor() {
    super("Push notifications are not configured");
    this.name = "PushNotificationsNotConfiguredError";
  }
}

export function ensureWebPushConfigured() {
  const subject = process.env.VAPID_SUBJECT;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!subject || !publicKey || !privateKey) {
    throw new PushNotificationsNotConfiguredError();
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export function sendWebPushNotification(
  subscription: WebPushSubscriptionInput,
  title: string,
  body: string
) {
  return webpush.sendNotification(subscription, JSON.stringify({ title, body }));
}
