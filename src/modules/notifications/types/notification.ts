export type WebPushSubscriptionInput = {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export type SavePushSubscriptionInput = {
  userId: string;
  subscription: WebPushSubscriptionInput;
  categories: string[];
};

export type SendUserNotificationInput = {
  userId: string;
  title: string;
  body: string;
  category?: string;
};

/** Push-service acceptance does not confirm that a device displayed a notification. */
export type NotificationDeliveryResult = {
  selected: number;
  acceptedByPushService: number;
  failedAttempts: number;
  deliveryConfirmed: false;
};
