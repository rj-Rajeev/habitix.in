import {
  addDaysToKey,
  parseDateKey,
  resolveRevisionDateKey,
  toDateKey,
  type RevisionPreset,
} from "@/lib/dates";
import { differenceInCalendarDays } from "date-fns";
import { Types } from "mongoose";
import { taskRepository } from "@/modules/tasks/task.repository";
import { revisionRepository } from "./revision.repository";
import { TaskHistory } from "@/modules/tasks/task-history.model";

export const revisionService = {
  async scheduleFromCompletedTask(params: {
    userId: string;
    sourceTaskId: string;
    goalId: string;
    title: string;
    preset: RevisionPreset;
    customRevisionDate?: string;
  }) {
    const fromKey = toDateKey();
    const dueDate = resolveRevisionDateKey(
      params.preset,
      fromKey,
      params.customRevisionDate
    );
    const intervalDays = differenceInCalendarDays(
      parseDateKey(dueDate),
      parseDateKey(fromKey)
    );

    const [revisionTask] = await taskRepository.createMany([
      {
        userId: params.userId,
        goalId: params.goalId,
        title: `Revision: ${params.title}`,
        scheduledDate: dueDate,
        type: "revision",
        source: {
          type: "revision",
          parentTaskId: new Types.ObjectId(params.sourceTaskId),
        },
        revisionOfTaskId: params.sourceTaskId,
        estimatedMinutes: 20,
        scheduledOrder: 0,
      },
    ]);

    await revisionRepository.create({
      userId: params.userId,
      sourceTaskId: params.sourceTaskId,
      revisionTaskId: revisionTask._id.toString(),
      intervalDays,
      dueDate,
    });

    await TaskHistory.create({
      userId: new Types.ObjectId(params.userId),
      taskId: new Types.ObjectId(params.sourceTaskId),
      goalId: new Types.ObjectId(params.goalId),
      event: "revision_scheduled",
      payload: { dueDate, preset: params.preset },
    });

    return revisionTask;
  },
};
