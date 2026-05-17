import { addDaysToKey, toDateKey } from "@/lib/dates";
import { UserAnalytics } from "./user-analytics.model";

export const analyticsService = {
  async getSummary(userId: string) {
    let analytics = await UserAnalytics.findOne({ userId });
    if (!analytics) {
      analytics = await UserAnalytics.create({ userId });
    }

    return {
      currentStreak: analytics.currentStreak,
      longestStreak: analytics.longestStreak,
      totalTasksCompleted: analytics.totalTasksCompleted,
      totalRevisionsCompleted: analytics.totalRevisionsCompleted,
      weeklyCompletionRate: analytics.weeklyCompletionRate,
      focusScore: analytics.focusScore,
      lastActiveDate: analytics.lastActiveDate,
    };
  },

  async recordTaskCompletion(userId: string, dateKey: string) {
    let analytics = await UserAnalytics.findOne({ userId });
    if (!analytics) {
      analytics = await UserAnalytics.create({ userId });
    }

    analytics.totalTasksCompleted += 1;
    const heatmap = analytics.heatmap ?? new Map();
    heatmap.set(dateKey, (heatmap.get(dateKey) ?? 0) + 1);
    analytics.heatmap = heatmap;

    if (analytics.lastActiveDate) {
      const yesterday = addDaysToKey(dateKey, -1);
      if (analytics.lastActiveDate === yesterday) {
        analytics.currentStreak += 1;
      } else if (analytics.lastActiveDate !== dateKey) {
        analytics.currentStreak = 1;
      }
    } else {
      analytics.currentStreak = 1;
    }

    if (analytics.currentStreak > analytics.longestStreak) {
      analytics.longestStreak = analytics.currentStreak;
    }

    analytics.lastActiveDate = dateKey;
    analytics.focusScore = Math.min(
      100,
      analytics.currentStreak * 5 + analytics.totalTasksCompleted
    );

    await analytics.save();
  },
};
