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
  roadmap?: {
    dayNumber: number;
    date?: string;
    unlocked: boolean;
    completed: boolean;
    tasks: {
      title: string;
      isCompleted: boolean;
      createdAt: Date;
    }[];
    proof?: {
      uploaded: boolean;
      imageUrl?: string;
      uploadedAt?: Date;
    };
  }[];
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
      dayNumber: { type: Number, required: true },
      date: String,
      unlocked: { type: Boolean, default: false },
      completed: { type: Boolean, default: false },
      tasks: [
        {
          title: { type: String, required: true },
          isCompleted: { type: Boolean, default: false },
          createdAt: { type: Date, default: Date.now }
        }
      ],
      proof: {
        uploaded: { type: Boolean, default: false },
        imageUrl: String,
        uploadedAt: Date
      }
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

const Goal = models.Goal || model<IGoal>("Goal", GoalSchema);
export default Goal;
