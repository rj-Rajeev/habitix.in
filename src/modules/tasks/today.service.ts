import { toDateKey } from "@/lib/dates";
import { goalSyncService } from "@/modules/goals/goal-sync.service";
import { taskRepository, TaskLean } from "./task.repository";

export type TodayTaskCard = TaskLean & {
  isOverdue: boolean;
  goalTitle: string;
};

export type TodayQueue = {
  date: string;
  summary: {
    total: number;
    estimatedMinutes: number;
    overdueCount: number;
  };
  sections: {
    overdue: TodayTaskCard[];
    today: TodayTaskCard[];
    revisions: TodayTaskCard[];
  };
};

export const todayService = {
  async getTodayQueue(userId: string): Promise<TodayQueue> {
    await goalSyncService.syncAllUserGoals(userId);

    const dateKey = toDateKey();
    const [overdue, today, revisions] = await Promise.all([
      taskRepository.findOverdue(userId, dateKey),
      taskRepository.findScheduledForDate(userId, dateKey),
      taskRepository.findRevisionsForDate(userId, dateKey),
    ]);

    const executionToday = today.filter((t) => t.type !== "revision");
    const revisionIds = new Set(revisions.map((r) => r._id));
    const todayFiltered = executionToday.filter(
      (t) => !revisionIds.has(t._id)
    );

    const mapCard = (t: TaskLean, isOverdue: boolean): TodayTaskCard => ({
      ...t,
      goalTitle: t.goalTitle ?? "Goal",
      isOverdue,
    });

    const overdueCards = overdue.map((t) => mapCard(t, true));
    const todayCards = todayFiltered.map((t) => mapCard(t, false));
    const revisionCards = revisions.map((t) => mapCard(t, false));

    const all = [...overdueCards, ...todayCards, ...revisionCards];

    return {
      date: dateKey,
      summary: {
        total: all.length,
        estimatedMinutes: all.reduce((s, t) => s + t.estimatedMinutes, 0),
        overdueCount: overdueCards.length,
      },
      sections: {
        overdue: overdueCards,
        today: todayCards,
        revisions: revisionCards,
      },
    };
  },
};
