import { addDays, format, startOfDay } from "date-fns";
import { toDateKey } from "@/lib/dates";
import { Errors } from "@/lib/api";
import type { CreateGoalInput } from "@/modules/tasks/task.schemas";
import { goalRepository } from "./goal.repository";
import { goalSyncService } from "./goal-sync.service";
import type { IRoadmapDay } from "./goal.model";

function normalizeRoadmap(roadmap: CreateGoalInput["roadmap"]): IRoadmapDay[] {
  if (!roadmap?.length) return [];

  return roadmap.map((day, index) => {
    let dayDate: string;
    if (typeof day.dayDate === "string") {
      dayDate = /^\d{4}-\d{2}-\d{2}$/.test(day.dayDate)
        ? day.dayDate
        : toDateKey(new Date(day.dayDate));
    } else {
      dayDate = toDateKey(new Date(day.dayDate));
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dayDate)) {
      dayDate = format(
        startOfDay(addDays(new Date(), index)),
        "yyyy-MM-dd"
      );
    }

    return {
      dayNumber: day.dayNumber,
      dayDate,
      unlocked: day.unlocked ?? index === 0,
      completed: day.completed ?? false,
      tasks: day.tasks.map((t) => ({
        title: t.title,
        isCompleted: t.isCompleted ?? false,
        createdAt: new Date(),
      })),
      proof: { uploaded: false },
    };
  });
}

export const goalService = {
  async create(userId: string, input: CreateGoalInput) {
    const roadmap = normalizeRoadmap(input.roadmap);

    const goal = await goalRepository.create({
      userId,
      title: input.title,
      description: input.description,
      targetDate: input.targetDate,
      hoursPerDay: input.hoursPerDay,
      preferredTime: input.preferredTime,
      daysPerWeek: input.daysPerWeek,
      motivation: input.motivation,
      timezone: input.timezone,
      roadmap,
      status: "active",
      completed: false,
    });

    const goalId = goal._id.toString();
    await goalSyncService.syncGoalTasks(userId, goalId);

    return { id: goalId, goal };
  },

  async getById(id: string, userId?: string) {
    const goal = userId
      ? await goalRepository.findByIdForUser(id, userId)
      : await goalRepository.findById(id);
    if (!goal) throw Errors.notFound("Goal");
    return goal;
  },

  async listForUser(userId: string) {
    return goalRepository.findActiveByUser(userId);
  },

  async countForUser(userId: string) {
    return goalRepository.countActiveByUser(userId);
  },
};
