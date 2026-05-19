import { Types } from "mongoose";
import { Task, ITask, TaskStatus } from "./task.model";

export type TaskLean = {
  _id: string;
  userId: string;
  goalId: string;
  date: string;
  task: string;
  topic: string;
  title: string;
  description?: string;
  answer?: string;
  type: ITask["type"];
  status: TaskStatus;
  scheduledDate: string;
  scheduledOrder: number;
  priority: ITask["priority"];
  estimatedMinutes: number;
  revisionOfTaskId?: string;
  completedAt?: Date;
  notes?: string;
  goalTitle?: string;
};

type TaskDocLike = {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  goalId: Types.ObjectId;
  date?: string;
  scheduledDate?: string;
  task?: string;
  topic?: string;
  title?: string;
  description?: string;
  type: ITask["type"];
  status: TaskStatus;
  scheduledOrder: number;
  priority: ITask["priority"];
  minutes?: number;
  estimatedMinutes?: number;
  revisionOfTaskId?: Types.ObjectId;
  completedAt?: Date;
  notes?: string;
};

function toLean(doc: TaskDocLike, goalTitle?: string): TaskLean {
  const date = doc.date ?? doc.scheduledDate ?? "";
  const minutes = doc.minutes ?? doc.estimatedMinutes ?? 30;
  const topic = doc.topic ?? doc.title ?? doc.task ?? "";

  return {
    _id: doc._id.toString(),
    userId: doc.userId.toString(),
    goalId: doc.goalId.toString(),
    date,
    task: doc.task ?? topic,
    topic,
    title: topic,
    description: doc.description,
    answer: doc.description ?? doc.notes,
    type: doc.type,
    status: doc.status,
    scheduledDate: date,
    scheduledOrder: doc.scheduledOrder,
    priority: doc.priority,
    estimatedMinutes: minutes,
    revisionOfTaskId: doc.revisionOfTaskId?.toString(),
    completedAt: doc.completedAt,
    notes: doc.notes,
    goalTitle,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPopulatedTask(doc: any): TaskLean {
  const populated = doc.goalId;
  const goalTitle =
    populated && typeof populated === "object" && "title" in populated
      ? String(populated.title)
      : undefined;
  const goalId =
    populated && typeof populated === "object" && "_id" in populated
      ? (populated._id as Types.ObjectId)
      : (doc.goalId as Types.ObjectId);

  return toLean(
    {
      _id: doc._id as Types.ObjectId,
      userId: doc.userId as Types.ObjectId,
      goalId,
      task: doc.task,
      topic: doc.topic,
      title: doc.title,
      description: doc.description,
      type: doc.type,
      status: doc.status,
      date: doc.date,
      scheduledDate: doc.scheduledDate,
      scheduledOrder: doc.scheduledOrder,
      priority: doc.priority,
      minutes: doc.minutes,
      estimatedMinutes: doc.estimatedMinutes,
      revisionOfTaskId: doc.revisionOfTaskId,
      completedAt: doc.completedAt,
      notes: doc.notes,
    },
    goalTitle
  );
}

export const taskRepository = {
  async findByIdForUser(taskId: string, userId: string) {
    return Task.findOne({
      _id: new Types.ObjectId(taskId),
      userId: new Types.ObjectId(userId),
    });
  },

  async findScheduledForDate(userId: string, dateKey: string) {
    const docs = await Task.find({
      userId: new Types.ObjectId(userId),
      $or: [{ date: dateKey }, { scheduledDate: dateKey }],
      status: { $in: ["pending", "in_progress"] },
    })
      .sort({ scheduledOrder: 1, priority: -1, createdAt: 1 })
      .populate("goalId", "title")
      .lean();

    return docs.map(mapPopulatedTask);
  },

  async findOverdue(userId: string, beforeDateKey: string) {
    const docs = await Task.find({
      userId: new Types.ObjectId(userId),
      $or: [
        { date: { $lt: beforeDateKey } },
        { scheduledDate: { $lt: beforeDateKey } },
      ],
      status: { $in: ["pending", "in_progress"] },
    })
      .sort({ date: 1, scheduledDate: 1, scheduledOrder: 1 })
      .populate("goalId", "title")
      .lean();

    return docs.map(mapPopulatedTask);
  },

  async findRevisionsForDate(userId: string, dateKey: string) {
    const docs = await Task.find({
      userId: new Types.ObjectId(userId),
      $or: [{ date: dateKey }, { scheduledDate: dateKey }],
      type: "revision",
      status: { $in: ["pending", "in_progress"] },
    })
      .sort({ scheduledOrder: 1 })
      .populate("goalId", "title")
      .lean();

    return docs.map(mapPopulatedTask);
  },

  async findByGoalForUser(goalId: string, userId: string) {
    const docs = await Task.find({
      userId: new Types.ObjectId(userId),
      goalId: new Types.ObjectId(goalId),
      status: { $in: ["pending", "in_progress", "completed"] },
    })
      .sort({ date: 1, scheduledDate: 1, scheduledOrder: 1, createdAt: 1 })
      .populate("goalId", "title")
      .lean();

    return docs.map(mapPopulatedTask);
  },

  async countByStatus(userId: string, status: TaskStatus) {
    return Task.countDocuments({
      userId: new Types.ObjectId(userId),
      status,
    });
  },

  async createMany(
    tasks: Array<{
      userId: string;
      goalId: string;
      date?: string;
      task?: string;
      topic?: string;
      title?: string;
      description?: string;
      scheduledDate: string;
      scheduledOrder?: number;
      status?: TaskStatus;
      type?: ITask["type"];
      source?: ITask["source"];
      priority?: ITask["priority"];
      minutes?: number;
      estimatedMinutes?: number;
      revisionOfTaskId?: string;
    }>
  ) {
    if (tasks.length === 0) return [];
    const docs = await Task.insertMany(
      tasks.map((t) => ({
        ...t,
        date: t.date ?? t.scheduledDate,
        task: t.task ?? t.topic ?? t.title,
        topic: t.topic ?? t.title ?? t.task,
        minutes: t.minutes ?? t.estimatedMinutes,
        userId: new Types.ObjectId(t.userId),
        goalId: new Types.ObjectId(t.goalId),
        revisionOfTaskId: t.revisionOfTaskId
          ? new Types.ObjectId(t.revisionOfTaskId)
          : undefined,
      }))
    );
    return docs;
  },

  async updateById(taskId: string, update: Partial<ITask>) {
    const normalized: Partial<ITask> = {
      ...update,
    };
    if (update.date || update.scheduledDate) {
      normalized.date = update.date ?? update.scheduledDate;
    }
    if (update.minutes || update.estimatedMinutes) {
      normalized.minutes = update.minutes ?? update.estimatedMinutes;
    }
    if (update.topic || update.title) {
      normalized.topic = update.topic ?? update.title;
      normalized.title = update.topic ?? update.title;
    }
    return Task.findByIdAndUpdate(taskId, normalized, { new: true });
  },

  async deleteByGoalId(goalId: string) {
    return Task.deleteMany({ goalId: new Types.ObjectId(goalId) });
  },

  async existsForGoal(goalId: string) {
    const count = await Task.countDocuments({
      goalId: new Types.ObjectId(goalId),
    });
    return count > 0;
  },
};
