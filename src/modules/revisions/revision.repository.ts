import { ClientSession, Types } from "mongoose";
import { Revision } from "./revision.model";

export const revisionRepository = {
  async create(data: {
    userId: string;
    sourceTaskId: string;
    revisionTaskId: string;
    intervalDays: number;
    dueDate: string;
    session?: ClientSession;
  }) {
    const revision = new Revision({
      userId: new Types.ObjectId(data.userId),
      sourceTaskId: new Types.ObjectId(data.sourceTaskId),
      revisionTaskId: new Types.ObjectId(data.revisionTaskId),
      intervalDays: data.intervalDays,
      dueDate: data.dueDate,
      status: "scheduled",
    });
    return revision.save(data.session ? { session: data.session } : undefined);
  },

  async markCompletedByRevisionTaskId(revisionTaskId: string, session?: ClientSession) {
    return Revision.findOneAndUpdate(
      { revisionTaskId: new Types.ObjectId(revisionTaskId) },
      { status: "completed", completedAt: new Date() },
      { new: true, ...(session ? { session } : {}) }
    );
  },

  async updateScheduleByRevisionTaskId(
    revisionTaskId: string,
    userId: string,
    dueDate: string,
    intervalDays: number,
    session?: ClientSession
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
      { new: true, ...(session ? { session } : {}) }
    );
  },

  async markCancelledByRevisionTaskId(revisionTaskId: string, userId: string, session?: ClientSession) {
    return Revision.findOneAndUpdate(
      {
        revisionTaskId: new Types.ObjectId(revisionTaskId),
        userId: new Types.ObjectId(userId),
      },
      { $set: { status: "cancelled" }, $unset: { completedAt: 1 } },
      { new: true, ...(session ? { session } : {}) }
    );
  },
};
