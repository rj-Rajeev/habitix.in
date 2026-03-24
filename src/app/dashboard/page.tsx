"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  AddCircleOutline,
  CheckCircleOutline,
  EmojiObjects,
  Timeline,
  TrendingUp,
} from "@mui/icons-material";
import { CircularProgress } from "@mui/material";
import LogoutButton from "@/components/auth/logout-btn";

interface SummaryData {
  activeGoals: number;
  completedTasks: number;
  ongoingSessions: number;
  streak: string;
}

interface Task {
  goalId: string;
  goalTitle: string;
  dayNumber: number;
  dayDate: string;
  tasks: {
    title: string;
    isCompleted: boolean;
    createdAt: string;
    _id: string;
  };
}

export default function Dashboard() {
  const [summary, setSummary] = useState<SummaryData>({
    activeGoals: 0,
    completedTasks: 0,
    ongoingSessions: 0,
    streak: "0 Days",
  });

  const [todaysTasks, setTodaysTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();
  const userName = session?.user?.name || "User";

  useEffect(() => {
    const fetchSummary = async () => {
      const res = await fetch("/api/goals/count");
      const data = await res.json();
      setSummary((prev) => ({ ...prev, activeGoals: data.count || 0 }));
    };

    const fetchTodaysTasks = async () => {
      const res = await fetch("/api/get-todays-tasks");
      const data = await res.json();
      if (data.success) setTodaysTasks(data.tasks);
    };

    fetchSummary();
    fetchTodaysTasks();
  }, []);

  const toggleTask = async (taskItem: Task) => {
    setLoading(true);
    try {
      await fetch(`/api/goals/toggle-task`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goalId: taskItem.goalId,
          dayNumber: taskItem.dayNumber,
          taskId: taskItem.tasks._id,
        }),
      });

      setTodaysTasks((prev) =>
        prev.map((t) =>
          t.tasks._id === taskItem.tasks._id
            ? {
                ...t,
                tasks: {
                  ...t.tasks,
                  isCompleted: !t.tasks.isCompleted,
                },
              }
            : t
        )
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[100dvh] bg-gray-50 px-4 py-6 flex justify-center">

      <div className="w-full max-w-5xl space-y-6">

        {/* 🔷 Header */}
        <div className="flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm border">
          <div>
            <h1 className="text-xl font-semibold">
              Hi, {userName} 👋
            </h1>
            <p className="text-sm text-gray-500">
              Let’s stay consistent today
            </p>
          </div>

          <LogoutButton />
        </div>

        {/* 🔷 Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Goals", value: summary.activeGoals },
            { label: "Completed", value: summary.completedTasks },
            { label: "Sessions", value: summary.ongoingSessions },
            { label: "Streak", value: summary.streak },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-white p-4 rounded-xl border shadow-sm"
            >
              <p className="text-xs text-gray-500">{item.label}</p>
              <p className="text-lg font-semibold mt-1">{item.value}</p>
            </div>
          ))}
        </div>

        {/* 🔷 Tasks */}
        <div className="bg-white p-5 rounded-2xl border shadow-sm">

          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-lg">Today’s Tasks</h2>
            <span className="text-sm text-gray-400">
              {todaysTasks.length} tasks
            </span>
          </div>

          {todaysTasks.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">
              Nothing planned for today ✅
            </div>
          ) : (
            <div className="space-y-3">
              {todaysTasks.map((task) => {
                const isDone = task.tasks.isCompleted;

                return (
                  <div
                    key={task.tasks._id}
                    className={`flex justify-between items-center p-4 rounded-xl border transition ${
                      isDone
                        ? "bg-green-50 border-green-200"
                        : "bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex flex-col">
                      <p
                        className={`text-sm font-medium ${
                          isDone && "line-through text-gray-400"
                        }`}
                      >
                        {task.tasks.title}
                      </p>
                      <p className="text-xs text-gray-400">
                        {task.goalTitle}
                      </p>
                    </div>

                    <button
                      onClick={() => toggleTask(task)}
                      disabled={loading}
                      className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                        isDone
                          ? "bg-green-500 text-white"
                          : "bg-white"
                      }`}
                    >
                      {loading ? (
                        <CircularProgress size={16} />
                      ) : isDone ? (
                        "✓"
                      ) : null}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 🔷 Actions */}
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-md px-4">
          <div className="flex gap-3">

            <Link
              href="/dashboard/goal-chat"
              className="flex-1 text-center py-3 rounded-xl bg-black text-white text-sm font-medium"
            >
              + New Goal
            </Link>

            <Link
              href="/dashboard/goals"
              className="flex-1 text-center py-3 rounded-xl bg-gray-200 text-sm font-medium"
            >
              Roadmaps
            </Link>

          </div>
        </div>

      </div>
    </main>
  );
}
