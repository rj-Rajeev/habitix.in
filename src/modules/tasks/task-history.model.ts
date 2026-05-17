import mongoose, { Schema, Document, models, model, Types } from "mongoose";

export interface ITaskHistory extends Document {
  userId: Types.ObjectId;
  taskId: Types.ObjectId;
  goalId: Types.ObjectId;
  event:
    | "created"
    | "completed"
    | "skipped"
    | "rescheduled"
    | "note_added"
    | "revision_scheduled";
  payload?: Record<string, unknown>;
  createdAt: Date;
}

const TaskHistorySchema = new Schema<ITaskHistory>(
  {
    userId: { type: Schema.Types.ObjectId, required: true },
    taskId: { type: Schema.Types.ObjectId, ref: "Task", required: true },
    goalId: { type: Schema.Types.ObjectId, ref: "Goal", required: true },
    event: { type: String, required: true },
    payload: Schema.Types.Mixed,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

TaskHistorySchema.index({ userId: 1, createdAt: -1 });
TaskHistorySchema.index({ taskId: 1, createdAt: -1 });

export const TaskHistory =
  models.TaskHistory || model<ITaskHistory>("TaskHistory", TaskHistorySchema);
