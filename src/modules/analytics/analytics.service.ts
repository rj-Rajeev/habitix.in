import { ClientSession } from "mongoose";
import { addDaysToKey, toDateKeyInTimezone } from "@/lib/dates";
import { UserAnalytics } from "./user-analytics.model";
import { taskHistoryRepository } from "@/modules/tasks/task-history.repository";

export type WeeklyActivityDay = {
  date: string;
  /** Null means no event was recorded; historical completeness is not guaranteed. */
  completedTasks: number | null;
};

export type WeeklyActivity = {
  timezone: string;
  historyCoverage: "unverified" | "truncated";
  days: WeeklyActivityDay[];
};

function utcDateStart(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

export const analyticsService = {
  async getWeeklyActivity(userId: string, timezone: string, now = new Date()): Promise<WeeklyActivity> {
    const today = toDateKeyInTimezone(now, timezone);
    const dates = Array.from({ length: 7 }, (_, index) => addDaysToKey(today, index - 6));
    const firstDateStart = utcDateStart(dates[0]);
    const dayAfterTodayStart = utcDateStart(addDaysToKey(today, 1));

    // IANA offsets stay within this padded UTC range; bucketing below uses the requested zone.
    const start = new Date(firstDateStart.getTime() - 24 * 60 * 60 * 1000);
    const end = new Date(dayAfterTodayStart.getTime() + 24 * 60 * 60 * 1000);
    const { events, truncated } = await taskHistoryRepository.findCompletionEventsForUserInRange(
      userId,
      start,
      end,
      5000
    );

    const counts = new Map(dates.map((date) => [date, 0]));
    for (const event of events) {
      const date = toDateKeyInTimezone(event.createdAt, timezone);
      const count = counts.get(date);
      if (count !== undefined) counts.set(date, count + 1);
    }

    return {
      timezone,
      historyCoverage: truncated ? "truncated" : "unverified",
      days: dates.map((date) => {
        const count = counts.get(date) ?? 0;
        return { date, completedTasks: count > 0 ? count : null };
      }),
    };
  },

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

  async recordTaskCompletion(userId: string, dateKey: string, session?: ClientSession) {
    const query = UserAnalytics.findOne({ userId });
    if (session) query.session(session);
    let analytics = await query;
    if (!analytics) {
      analytics = new UserAnalytics({ userId });
      await analytics.save(session ? { session } : undefined);
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

    await analytics.save(session ? { session } : undefined);
  },
};
