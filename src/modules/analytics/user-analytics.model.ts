import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IUserAnalytics extends Document {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate?: string;
  totalTasksCompleted: number;
  totalRevisionsCompleted: number;
  weeklyCompletionRate: number;
  focusScore: number;
  heatmap: Map<string, number>;
  updatedAt: Date;
}

const UserAnalyticsSchema = new Schema<IUserAnalytics>(
  {
    userId: { type: String, required: true, unique: true },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActiveDate: String,
    totalTasksCompleted: { type: Number, default: 0 },
    totalRevisionsCompleted: { type: Number, default: 0 },
    weeklyCompletionRate: { type: Number, default: 0 },
    focusScore: { type: Number, default: 0 },
    heatmap: {
      type: Map,
      of: Number,
      default: () => new Map(),
    },
  },
  { timestamps: true }
);

export const UserAnalytics =
  models.UserAnalytics ||
  model<IUserAnalytics>("UserAnalytics", UserAnalyticsSchema);
