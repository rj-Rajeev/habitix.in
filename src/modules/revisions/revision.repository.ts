import { Types } from "mongoose";
import { Revision } from "./revision.model";

export const revisionRepository = {
  async create(data: {
    userId: string;
    sourceTaskId: string;
    revisionTaskId: string;
    intervalDays: number;
    dueDate: string;
  }) {
    return Revision.create({
      userId: new Types.ObjectId(data.userId),
      sourceTaskId: new Types.ObjectId(data.sourceTaskId),
      revisionTaskId: new Types.ObjectId(data.revisionTaskId),
      intervalDays: data.intervalDays,
      dueDate: data.dueDate,
      status: "scheduled",
    });
  },

  async markCompletedByRevisionTaskId(revisionTaskId: string) {
    return Revision.findOneAndUpdate(
      { revisionTaskId: new Types.ObjectId(revisionTaskId) },
      { status: "completed", completedAt: new Date() },
      { new: true }
    );
  },

  async updateScheduleByRevisionTaskId(
    revisionTaskId: string,
    userId: string,
    dueDate: string,
    intervalDays: number
  ) {
    return Revision.findOneAndUpdate(
      {
        revisionTaskId: new Types.ObjectId(revisionTaskId),
        userId: new Types.ObjectId(userId),
      },
      {
        $set: {
          dueDate,
          intervalDays,
          status: "scheduled",
        },
        $unset: { completedAt: 1 },
      },
      { new: true }
    );
  },

  async markCancelledByRevisionTaskId(revisionTaskId: string, userId: string) {
    return Revision.findOneAndUpdate(
      {
        revisionTaskId: new Types.ObjectId(revisionTaskId),
        userId: new Types.ObjectId(userId),
      },
      { $set: { status: "cancelled" }, $unset: { completedAt: 1 } },
      { new: true }
    );
  },
};
