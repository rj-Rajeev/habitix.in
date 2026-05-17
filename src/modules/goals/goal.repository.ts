import { Goal, IGoal, IRoadmapDay } from "./goal.model";

export const goalRepository = {
  async findById(id: string) {
    return Goal.findById(id);
  },

  async findByIdForUser(id: string, userId: string) {
    return Goal.findOne({ _id: id, userId });
  },

  async findActiveByUser(userId: string) {
    return Goal.find({ userId, status: { $ne: "archived" } }).sort({
      createdAt: -1,
    });
  },

  async countActiveByUser(userId: string) {
    return Goal.countDocuments({ userId, status: { $ne: "archived" } });
  },

  async create(data: Partial<IGoal>) {
    return Goal.create(data);
  },

  async updateRoadmap(goalId: string, roadmap: IRoadmapDay[]) {
    return Goal.findByIdAndUpdate(
      goalId,
      { roadmap, tasksSyncedAt: undefined },
      { new: true }
    );
  },

  async markTasksSynced(goalId: string) {
    return Goal.findByIdAndUpdate(
      goalId,
      { tasksSyncedAt: new Date() },
      { new: true }
    );
  },

  async findUnsyncedGoals(userId: string) {
    return Goal.find({
      userId,
      roadmap: { $exists: true, $ne: [] },
      $or: [{ tasksSyncedAt: { $exists: false } }, { tasksSyncedAt: null }],
    });
  },
};
