import { Types } from "mongoose";
import { Errors } from "@/lib/api";
import Goal from "./goal.model";
import { Task } from "@/modules/tasks/task.model";

export const goalCompletionService = {
  async evaluateGoalCompletion(goalId: string, userId: string) {
    const [counts] = await Task.aggregate<{ taskCount: number; completedCount: number }>([
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

    const executableTaskCount = counts?.taskCount ?? 0;
    const completed = executableTaskCount > 0 && counts.completedCount === executableTaskCount;
    const goal = await Goal.findOneAndUpdate(
      { _id: goalId, userId },
      { completed, status: completed ? "completed" : "active" },
      { new: true, projection: { _id: 1 } }
    );
    if (!goal) throw Errors.notFound("Goal");

    return { goalId, completed, status: completed ? "completed" as const : "active" as const, executableTaskCount };
  },
};
