
import connectDb from "@/lib/db";
import Goal from "@/models/Goal";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";

interface GoalType {
  _id: string;
  title: string;
  description?: string;
  targetDate: string;
  hoursPerDay: number;
  daysPerWeek: number;
  preferredTime: string;
  motivation: string;
  completed: boolean;
  createdAt: string;
  roadmap?: any[];
}

function calculateRemainingDays(targetDate: string): string {
  const diff = new Date(targetDate).getTime() - new Date().getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return days <= 0 ? "Goal ended" : `${days} day${days === 1 ? "" : "s"} left`;
}

export default async function AllGoalsPage() {
  await connectDb();
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    redirect("/login");
  }

  const rawGoals = await Goal.find({ userId: session.user.id })
    .sort({ createdAt: -1 })
    .lean();

  const goals: GoalType[] = rawGoals.map((g) => ({
    _id: String(g._id),
    title: g.title,
    description: g.description || "",
    targetDate: String(g.targetDate),
    hoursPerDay: g.hoursPerDay,
    daysPerWeek: g.daysPerWeek,
    preferredTime: g.preferredTime,
    motivation: g.motivation,
    completed: g.completed,
    createdAt: String(g.createdAt),
    roadmap: g.roadmap,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-10 text-center">
        🎯 Your Goals
      </h1>

      {goals.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 text-lg">
          You haven’t created any goals yet. Start now to build momentum!
        </div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
          {goals.map((goal) => (
            <Link
              href={`/dashboard/goals/${goal._id}`}
              key={goal._id}
              className="relative flex flex-col bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-3xl shadow-lg transition-transform hover:scale-[1.015] hover:shadow-xl"
            >
              {/* Decorative Gradient Bar */}
              <div className="h-2 w-full rounded-t-3xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

              <div className="p-6 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white leading-snug">
                    {goal.title}
                  </h2>

                  <div className="text-xs font-medium px-2 py-1 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-white whitespace-nowrap">
                    {calculateRemainingDays(goal.targetDate)}
                  </div>
                </div>

                {goal.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    {goal.description.length > 90
                      ? goal.description.slice(0, 90) + "..."
                      : goal.description}
                  </p>
                )}

                <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300 mb-4">
                  <p>
                    <span className="font-medium">⏱ Hours/Day:</span>{" "}
                    {goal.hoursPerDay}
                  </p>
                  <p>
                    <span className="font-medium">📆 Days/Week:</span>{" "}
                    {goal.daysPerWeek}
                  </p>
                  <p>
                    <span className="font-medium">🕖 Preferred Time:</span>{" "}
                    {goal.preferredTime}
                  </p>
                </div>

                <div className="mt-auto">
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                    {goal.motivation.length > 100
                      ? `“${goal.motivation.slice(0, 100)}...”`
                      : `“${goal.motivation}”`}
                  </p>
                </div>

                <span className="absolute bottom-4 right-6 text-[11px] text-gray-400 dark:text-gray-500">
                  Created on {new Date(goal.createdAt).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
