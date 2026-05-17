import mongoose, { Schema, Document, models, model, Types } from "mongoose";

export interface IRevision extends Document {
  userId: Types.ObjectId;
  sourceTaskId: Types.ObjectId;
  revisionTaskId: Types.ObjectId;
  intervalDays: number;
  dueDate: string;
  status: "scheduled" | "completed" | "missed" | "cancelled";
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RevisionSchema = new Schema<IRevision>(
  {
    userId: { type: Schema.Types.ObjectId, required: true },
    sourceTaskId: { type: Schema.Types.ObjectId, ref: "Task", required: true },
    revisionTaskId: { type: Schema.Types.ObjectId, ref: "Task", required: true },
    intervalDays: { type: Number, required: true },
    dueDate: { type: String, required: true },
    status: {
      type: String,
      enum: ["scheduled", "completed", "missed", "cancelled"],
      default: "scheduled",
    },
    completedAt: Date,
  },
  { timestamps: true }
);

RevisionSchema.index({ userId: 1, dueDate: 1, status: 1 });
RevisionSchema.index({ sourceTaskId: 1 });

export const Revision =
  models.Revision || model<IRevision>("Revision", RevisionSchema);
