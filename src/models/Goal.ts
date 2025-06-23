import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IGoal extends Document {
  userId: string;
  title: string;
  description?: string;
  targetDate?: string;
  hoursPerDay: number;
  preferredTime: string;
  daysPerWeek: number;
  motivation?: string;
  roadmap?: { day: number; task: string }[];
  createdAt: Date;
}

const GoalSchema = new Schema<IGoal>({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  description: String,
  targetDate: String,
  hoursPerDay: { type: Number, required: true },
  preferredTime: { type: String, required: true },
  daysPerWeek: { type: Number, required: true },
  motivation: String,
  roadmap: [
    {
      day: Number,
      task: String,
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

const Goal = models.Goal || model<IGoal>("Goal", GoalSchema);
export default Goal;
