// ❌ DO NOT use "use client" in a server component
import { notFound } from "next/navigation";
import connectDb from "@/lib/db";
import Goal from "@/models/Goal";
import mongoose from "mongoose";

interface RoadmapStep {
  day: number;
  task: string;
}

interface GoalType {
  _id: string;
  title: string;
  duration: string;
  hoursPerDay: number;
  daysPerWeek: number;
  preferredTime: string;
  motivation: string;
  roadmap?: RoadmapStep[];
  createdAt: string;
}

interface GoalPageProps {
  params: Promise<{ id: string }>;
}

export default async function GoalPage({ params }: GoalPageProps) {
  await connectDb();

  const { id: goalId } = await params; // ✅ await the promise

  if (!goalId || !mongoose.Types.ObjectId.isValid(goalId)) {
    return notFound();
  }

  const goal = (await Goal.findById(goalId).lean()) as GoalType | null;
  if (!goal) return notFound();


  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">{goal.title}</h1>

      <div className="space-y-2 text-gray-700 dark:text-gray-300">
        <p>
          <strong>Duration:</strong> {goal.duration}
        </p>
        <p>
          <strong>Hours/Day:</strong> {goal.hoursPerDay}
        </p>
        <p>
          <strong>Days/Week:</strong> {goal.daysPerWeek}
        </p>
        <p>
          <strong>Preferred Time:</strong> {goal.preferredTime}
        </p>
        <p>
          <strong>Motivation:</strong> {goal.motivation}
        </p>
      </div>

      <div className="mt-8 p-5 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-4">🛣️ AI Roadmap</h2>
        {goal.roadmap && goal.roadmap.length > 0 ? (
          <ul className="space-y-3">
            {goal.roadmap.map((step) => (
              <li
                key={step.day}
                className="p-3 bg-white/60 dark:bg-slate-700 rounded-lg shadow"
              >
                <strong>Day {step.day}:</strong> {step.task}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">🚧 Roadmap not available yet.</p>
        )}
      </div>
    </div>
  );
}
