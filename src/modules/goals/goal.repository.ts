import { Goal, IGoal, IRoadmapDay, IRoadmapTask } from "./goal.model";

/** Determine Course Goal policy from the persisted Goal record, including legacy roadmap markers. */
type GoalRecordPolicyFields = Pick<IGoal, "planSource" | "courseId" | "roadmap"> & {
  $isDefault?: (path: string) => boolean;
};

export function isCourseGoalRecord(
  goal: GoalRecordPolicyFields | null | undefined
): boolean {
  return Boolean(
    goal && (
      goal.planSource === "course" ||
      goal.courseId ||
      goal.roadmap?.some((day) => day.tasks.some((task) => task.courseLessonId))
    )
  );
}

/** Legacy Goals without a source are Manual only when persisted Tasks provide evidence. */
export function isManualGoalRecord(
  goal: GoalRecordPolicyFields | null | undefined,
  hasManualTaskEvidence: boolean
): boolean {
  if (!goal || isCourseGoalRecord(goal)) return false;
  const sourceWasDefaulted = goal.$isDefault?.("planSource") ?? goal.planSource === undefined;
  if (!sourceWasDefaulted) return goal.planSource === "manual";
  const hasRoadmapWork = goal.roadmap?.some((day) => day.tasks.length > 0) ?? false;
  return !hasRoadmapWork && hasManualTaskEvidence;
}

export const goalRepository = {

  async findByIdForUser(id: string, userId: string) {
    return Goal.findOne({ _id: id, userId });
  },

  async findActiveByUser(userId: string) {
    return Goal.find({ userId, status: { $ne: "archived" } }).sort({
      createdAt: -1,
    });
  },

  async findGoalsWithStatusByUser(userId: string, status: "active") {
    return Goal.find({ userId, status }).sort({ createdAt: -1 });
  },

  async countActiveByUser(userId: string) {
    return Goal.countDocuments({ userId, status: { $ne: "archived" } });
  },

  async countActiveOnlyByUser(userId: string) {
    return Goal.countDocuments({ userId, status: "active" });
  },

  async create(data: Partial<IGoal>) {
    return Goal.create(data);
  },

  async deleteByIdForUser(id: string, userId: string) {
    return Goal.deleteOne({ _id: id, userId });
  },

  async updateRoadmap(goalId: string, userId: string, roadmap: IRoadmapDay[]) {
    return Goal.findOneAndUpdate(
      { _id: goalId, userId },
      { roadmap, tasksSyncedAt: undefined },
      { new: true }
    );
  },

  async markTasksSynced(goalId: string, userId: string) {
    return Goal.findOneAndUpdate(
      { _id: goalId, userId },
      { tasksSyncedAt: new Date() },
      { new: true }
    );
  },

  async mirrorRoadmapTaskCompletion(
    goalId: string,
    userId: string,
    dayNumber: number,
    legacyTaskId: string,
    isCompleted: boolean
  ) {
    const goal = await Goal.findOne({ _id: goalId, userId })
      .select("roadmap")
      .lean<{ roadmap?: IRoadmapDay[] }>();
    const matchingEntries = goal?.roadmap?.flatMap((day: IRoadmapDay) =>
      day.dayNumber === dayNumber
        ? day.tasks.filter((task: IRoadmapTask) => task._id?.toString() === legacyTaskId)
        : []
    ) ?? [];
    if (matchingEntries.length !== 1) return { matchedCount: 0 };

    return Goal.updateOne(
      {
        _id: goalId,
        userId,
        roadmap: {
          $elemMatch: {
            dayNumber,
            tasks: { $elemMatch: { _id: legacyTaskId } },
          },
        },
      },
      [
        {
          $set: {
            roadmap: {
              $map: {
                input: "$roadmap",
                as: "day",
                in: {
                  $cond: [
                    { $eq: ["$$day.dayNumber", dayNumber] },
                    {
                      $mergeObjects: ["$$day", {
                        tasks: {
                          $map: {
                            input: "$$day.tasks",
                            as: "task",
                            in: {
                              $cond: [
                                { $eq: [{ $toString: "$$task._id" }, legacyTaskId] },
                                { $mergeObjects: ["$$task", { isCompleted }] },
                                "$$task",
                              ],
                            },
                          },
                        },
                      }],
                    },
                    "$$day",
                  ],
                },
              },
            },
          },
        },
        {
          $set: {
            roadmap: {
              $map: {
                input: "$roadmap",
                as: "day",
                in: {
                  $cond: [
                    { $eq: ["$$day.dayNumber", dayNumber] },
                    {
                      $mergeObjects: ["$$day", {
                        completed: { $allElementsTrue: ["$$day.tasks.isCompleted"] },
                      }],
                    },
                    "$$day",
                  ],
                },
              },
            },
          },
        },
        {
          $set: {
            roadmap: {
              $map: {
                input: "$roadmap",
                as: "day",
                in: {
                  $cond: [
                    {
                      $and: [
                        { $eq: ["$$day.dayNumber", dayNumber + 1] },
                        {
                          $anyElementTrue: {
                            $map: {
                              input: "$roadmap",
                              as: "completedDay",
                              in: {
                                $and: [
                                  { $eq: ["$$completedDay.dayNumber", dayNumber] },
                                  "$$completedDay.completed",
                                ],
                              },
                            },
                          },
                        },
                      ],
                    },
                    { $mergeObjects: ["$$day", { unlocked: true }] },
                    "$$day",
                  ],
                },
              },
            },
          },
        },
      ]
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
