import {
  ensureWebPushConfigured,
  sendWebPushNotification,
} from "../integrations/web-push";
import { pushSubscriptionService } from "./push-subscription.service";
import type {
  NotificationDeliveryResult,
  SendUserNotificationInput,
} from "../types/notification";

function isExpiredSubscriptionError(error: unknown): boolean {
  if (!error || typeof error !== "object" || !("statusCode" in error)) return false;
  const statusCode = (error as { statusCode?: unknown }).statusCode;
  return statusCode === 404 || statusCode === 410;
}

export const notificationService = {
  ensureConfigured() {
    ensureWebPushConfigured();
  },

  async sendToUser({ userId, title, body, category }: SendUserNotificationInput): Promise<NotificationDeliveryResult> {
    const subscriptions = await pushSubscriptionService.getForUser(userId, category);
    let acceptedByPushService = 0;
    let failedAttempts = 0;

    await Promise.allSettled(subscriptions.map(async (subscription) => {
      try {
        await sendWebPushNotification(subscription.subscription, title, body);
        acceptedByPushService += 1;
      } catch (error) {
        failedAttempts += 1;
        if (isExpiredSubscriptionError(error)) {
          await pushSubscriptionService.cleanUpExpired(subscription._id.toString());
        }
      }
    }));

    return {
      selected: subscriptions.length,
      acceptedByPushService,
      failedAttempts,
      deliveryConfirmed: false,
    };
  },
};
