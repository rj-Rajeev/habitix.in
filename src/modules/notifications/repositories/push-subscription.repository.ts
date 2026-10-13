import PushSubscription from "../models/push-subscription.model";
import type { SavePushSubscriptionInput } from "../types/notification";

export const pushSubscriptionRepository = {
  saveForUser({ userId, subscription, categories }: SavePushSubscriptionInput) {
    return PushSubscription.findOneAndUpdate(
      { "subscription.endpoint": subscription.endpoint, userId },
      { subscription, categories, userId },
      { upsert: true, new: true }
    );
  },

  findForUser(userId: string, category?: string) {
    const query: { userId: string; categories?: string } = { userId };
    if (category) query.categories = category;
    return PushSubscription.find(query);
  },

  deleteById(id: string) {
    return PushSubscription.deleteOne({ _id: id });
  },
};
