import mongoose, { Schema, Document, models, model, Types } from "mongoose";

export type TaskStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "skipped"
  | "cancelled";

export type TaskType = "execution" | "revision" | "recovery";

export type TaskSourceType =
  | "ai"
  | "manual"
  | "import"
  | "template"
  | "revision"
  | "recovery"
  | "roadmap_sync";

export interface ITask extends Document {
  userId: Types.ObjectId;
  goalId: Types.ObjectId;
  title: string;
  description?: string;
  type: TaskType;
  status: TaskStatus;
  scheduledDate: string;
  scheduledOrder: number;
  priority: "low" | "medium" | "high";
  estimatedMinutes: number;
  source: {
    type: TaskSourceType;
    templateId?: Types.ObjectId;
    parentTaskId?: Types.ObjectId;
    roadmapDayNumber?: number;
    legacyTaskId?: string;
  };
  revisionOfTaskId?: Types.ObjectId;
  completedAt?: Date;
  skippedAt?: Date;
  notes?: string;
  rescheduleCount: number;
  lastRescheduledAt?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    goalId: { type: Schema.Types.ObjectId, ref: "Goal", required: true },
    title: { type: String, required: true, trim: true },
    description: String,
    type: {
      type: String,
      enum: ["execution", "revision", "recovery"],
      default: "execution",
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "skipped", "cancelled"],
      default: "pending",
    },
    scheduledDate: { type: String, required: true },
    scheduledOrder: { type: Number, default: 0 },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    estimatedMinutes: { type: Number, default: 30 },
    source: {
      type: { type: String, default: "manual" },
      templateId: Schema.Types.ObjectId,
      parentTaskId: Schema.Types.ObjectId,
      roadmapDayNumber: Number,
      legacyTaskId: String,
    },
    revisionOfTaskId: { type: Schema.Types.ObjectId, ref: "Task" },
    completedAt: Date,
    skippedAt: Date,
    notes: String,
    rescheduleCount: { type: Number, default: 0 },
    lastRescheduledAt: Date,
    metadata: Schema.Types.Mixed,
  },
  { timestamps: true }
);

TaskSchema.index({ userId: 1, scheduledDate: 1, status: 1 });
TaskSchema.index({ userId: 1, status: 1, scheduledDate: 1 });
TaskSchema.index({ goalId: 1, scheduledDate: 1 });
TaskSchema.index(
  { goalId: 1, "source.roadmapDayNumber": 1, "source.legacyTaskId": 1 },
  { sparse: true }
);

export const Task =
  models.Task || model<ITask>("Task", TaskSchema);
