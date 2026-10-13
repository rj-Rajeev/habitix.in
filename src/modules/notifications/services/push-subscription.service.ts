import { pushSubscriptionRepository } from "../repositories/push-subscription.repository";
import type { SavePushSubscriptionInput } from "../types/notification";

export const pushSubscriptionService = {
  save(input: SavePushSubscriptionInput) {
    return pushSubscriptionRepository.saveForUser(input);
  },

  getForUser(userId: string, category?: string) {
    return pushSubscriptionRepository.findForUser(userId, category);
  },

  cleanUpExpired(subscriptionId: string) {
    return pushSubscriptionRepository.deleteById(subscriptionId);
  },
};
