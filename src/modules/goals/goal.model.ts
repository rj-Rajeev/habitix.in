import mongoose, { Schema, Document, models, model, Types } from "mongoose";

export interface IRoadmapTask {
  _id?: mongoose.Types.ObjectId;
  title: string;
  isCompleted: boolean;
  createdAt: Date;
  courseLessonId?: Types.ObjectId;
}

export interface IRoadmapDay {
  dayNumber: number;
  dayDate: string;
  unlocked: boolean;
  completed: boolean;
  tasks: IRoadmapTask[];
  proof?: {
    uploaded: boolean;
    imageUrl?: string;
    uploadedAt?: Date;
  };
}

export interface IGoal extends Document {
  planSource: "course" | "ai" | "manual";
  userId: string;
  title: string;
  description?: string;
  targetDate?: string;
  hoursPerDay: number;
  preferredTime: string;
  daysPerWeek: number;
  motivation?: string;
  completed: boolean;
  status: "active" | "completed" | "archived";
  timezone: string;
  courseId?: Types.ObjectId;
  roadmap?: IRoadmapDay[];
  tasksSyncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const GoalSchema = new Schema<IGoal>(
  {
    userId: { type: String, required: true, index: true },
    planSource: { type: String, enum: ["course", "ai", "manual"], default: "manual", required: true },
    title: { type: String, required: true },
    description: String,
    targetDate: String,
    hoursPerDay: { type: Number, required: true, default: 1 },
    preferredTime: { type: String, required: true, default: "morning" },
    daysPerWeek: { type: Number, required: true, default: 5 },
    motivation: String,
    completed: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["active", "completed", "archived"],
      default: "active",
    },
    timezone: { type: String, default: "UTC" },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: false, index: true },
    roadmap: [
      {
        dayNumber: { type: Number, required: true },
        dayDate: { type: String, required: true },
        unlocked: { type: Boolean, default: false },
        completed: { type: Boolean, default: false },
        tasks: [
          {
            title: { type: String, required: true },
            isCompleted: { type: Boolean, default: false },
            createdAt: { type: Date, default: Date.now },
            courseLessonId: { type: Schema.Types.ObjectId, ref: "CourseLesson", required: false },
          },
        ],
        proof: {
          uploaded: { type: Boolean, default: false },
          imageUrl: String,
          uploadedAt: Date,
        },
      },
    ],
    tasksSyncedAt: Date,
  },
  { timestamps: true }
);

GoalSchema.index({ userId: 1, status: 1 });

export const Goal = models.Goal || model<IGoal>("Goal", GoalSchema);

// Re-export default for legacy imports
export default Goal;
