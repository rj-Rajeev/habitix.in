import { Types } from "mongoose";
import { Errors } from "@/lib/api";
import Goal from "./goal.model";
import { Task } from "@/modules/tasks/task.model";

type ExecutionTaskCounts = { taskCount: number; completedCount: number };

async function getExecutionTaskCounts(goalId: string, userId: string) {
  const [counts] = await Task.aggregate<ExecutionTaskCounts>([
    {
      $match: {
        goalId: new Types.ObjectId(goalId),
        userId: new Types.ObjectId(userId),
        type: "execution",
      },
    },
    {
      $group: {
        _id: null,
        taskCount: { $sum: 1 },
        completedCount: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
      },
    },
  ]);

  return {
    taskCount: counts?.taskCount ?? 0,
    completedCount: counts?.completedCount ?? 0,
  };
}

export const goalCompletionService = {
  async getGoalTaskProgress(goalId: string, userId: string) {
    const { taskCount, completedCount } = await getExecutionTaskCounts(goalId, userId);
    const remaining = taskCount - completedCount;

    return {
      total: taskCount,
      completed: completedCount,
      remaining,
      percentage: taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0,
    };
  },

  async evaluateGoalCompletion(goalId: string, userId: string) {
    const { taskCount: executableTaskCount, completedCount } =
      await getExecutionTaskCounts(goalId, userId);
    const completed = executableTaskCount > 0 && completedCount === executableTaskCount;
    const goal = await Goal.findOneAndUpdate(
      { _id: goalId, userId },
      { completed, status: completed ? "completed" : "active" },
      { new: true, projection: { _id: 1 } }
    );
    if (!goal) throw Errors.notFound("Goal");

    return { goalId, completed, status: completed ? "completed" as const : "active" as const, executableTaskCount };
  },
};
