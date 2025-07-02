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
    <main className="min-h-screen bg-[#f5f3ff] dark:bg-[#141021] px-5 py-8 space-y-10">
      {/* Greeting */}
      <div className="bg-gradient-to-r from-[#b39ddb] to-[#ce93d8] dark:from-[#2a2150] dark:to-[#3c1f5e] p-6 rounded-3xl text-center text-white shadow-lg">
        <h1 className="text-3xl font-extrabold mb-1">Welcome, {userName} 👋</h1>
        <p className="text-sm opacity-90 mb-3">
          You're doing great. Let's make today count!
        </p>
        <LogoutButton />
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Goals", icon: <TrendingUp fontSize="small" />, value: summary.activeGoals },
          { label: "Completed", icon: <CheckCircleOutline fontSize="small" />, value: summary.completedTasks },
          { label: "Sessions", icon: <Timeline fontSize="small" />, value: summary.ongoingSessions },
          { label: "Streak", icon: <EmojiObjects fontSize="small" />, value: summary.streak },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl p-4 bg-white dark:bg-[#1c1b2f] shadow-sm hover:shadow-lg transition flex flex-col items-center text-center"
          >
            <div className="text-[#8e24aa] dark:text-[#ce93d8] mb-2">{item.icon}</div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{item.label}</p>
            <p className="text-xl font-bold">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Today's Tasks */}
      <section className="bg-white dark:bg-[#1c1b2f] p-6 rounded-3xl shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">📌 Today’s Tasks</h2>
          <span className="text-sm text-gray-400">{todaysTasks.length} total</span>
        </div>

        {todaysTasks.length === 0 ? (
          <p className="italic text-gray-500">Nothing for today. You’re all set!</p>
        ) : (
          <ul className="space-y-4">
            {todaysTasks.map((task) => (
              <li
                key={task.tasks._id}
                className={`flex justify-between items-start rounded-xl p-4 border shadow-sm transition cursor-pointer ${
                  task.tasks.isCompleted
                    ? "bg-[#e8f5e9] dark:bg-green-900/20 border-green-200 dark:border-green-800"
                    : "bg-[#f3e5f5] dark:bg-[#302346] border-[#ce93d8] dark:border-[#7e57c2]"
                }`}
              >
                <div className="space-y-1">
                  <p className={`font-medium ${task.tasks.isCompleted ? "line-through text-gray-400" : ""}`}>
                    {task.tasks.title}
                  </p>
                  <p className="text-xs text-gray-500 italic">Goal: {task.goalTitle}</p>
                </div>
                <button
                  onClick={() => toggleTask(task)}
                  disabled={loading}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-white dark:bg-[#3f2d5c] border"
                >
                  {loading ? (
                    <CircularProgress size={16} />
                  ) : task.tasks.isCompleted ? (
                    <CheckCircleOutline className="text-green-600" fontSize="small" />
                  ) : (
                    <span className="block w-3 h-3 bg-[#8e24aa] rounded-full" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Footer FAB */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
        <Link
          href="/dashboard/goal-chat"
          className="flex items-center gap-2 px-6 py-3 bg-[#8e24aa] hover:bg-[#6a1b9a] text-white rounded-full text-sm font-semibold shadow-xl"
        >
          <AddCircleOutline fontSize="small" /> New Goal
        </Link>
        <Link
          href="/dashboard/goals"
          className="flex items-center gap-2 px-6 py-3 bg-[#4a148c] hover:bg-[#311b92] text-white rounded-full text-sm font-semibold shadow-xl"
        >
          <Timeline fontSize="small" /> My Roadmaps
        </Link>
      </div>
    </main>
  );
}
