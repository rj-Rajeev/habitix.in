"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CalendarDays,
  FileUp,
  Flame,
  Loader2,
  Plus,
  RefreshCw,
  Target,
} from "lucide-react";
import { useSession } from "next-auth/react";
import AppShell from "@/components/app/AppShell";
import LogoutButton from "@/components/auth/logout-btn";
import TaskCard from "./TaskCard";
import AddTaskModal from "./AddTaskModal";
import AddGoalModal from "./AddGoalModal";
import ExcelUploadModal from "./ExcelUploadModal";
import { useTodayQueue } from "@/hooks/useTodayQueue";
import type { TodayTaskCard } from "@/types/today";
import type {
  CreateGoalInput,
  CreateManualTaskInput,
} from "@/modules/tasks/task.schemas";
import { useRouter } from "next/navigation";

type SectionConfig = {
  key: string;
  title: string;
  items: TodayTaskCard[];
  empty: string;
};

function StatCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
        {value}
      </p>
    </div>
  );
}

function TaskSection({
  section,
  completeTask,
  skipTask,
  rescheduleTask,
  onReveal,
}: {
  section: SectionConfig;
  completeTask: (id: string, rev?: string) => Promise<void>;
  skipTask: (id: string) => Promise<void>;
  rescheduleTask: (id: string, date: string) => Promise<void>;
  onReveal?: (id: string) => void;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">
          {section.title}
        </h2>
        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">
          {section.items.length}
        </span>
      </div>

      {section.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-5 text-sm text-slate-500">
          {section.empty}
        </div>
      ) : (
        <div className="space-y-3">
          {section.items.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onComplete={completeTask}
              onSkip={skipTask}
              onReschedule={rescheduleTask}
              onReveal={onReveal}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default function TodayView() {
  const { data: session } = useSession();
  const router = useRouter();
  const {
    queue,
    loading,
    error,
    completeTask,
    skipTask,
    rescheduleTask,
    redistribute,
    refresh,
    moveTaskToEnd,
  } = useTodayQueue();

  const [summary, setSummary] = useState({ currentStreak: 0, activeGoals: 0 });
  const [redistributing, setRedistributing] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [showExcelUploadModal, setShowExcelUploadModal] = useState(false);
  const [goals, setGoals] = useState<Array<{ _id: string; title: string }>>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryRes, goalsRes] = await Promise.all([
          fetch("/api/v1/analytics/summary"),
          fetch("/api/v1/goals"),
        ]);

        if (summaryRes.ok) {
          const data = await summaryRes.json();
          if (data.success) {
            setSummary({
              currentStreak: data.data.currentStreak ?? 0,
              activeGoals: data.data.activeGoals ?? 0,
            });
          }
        }

        if (goalsRes.ok) {
          const data = await goalsRes.json();
          if (data.success && Array.isArray(data.data)) {
            setGoals(
              data.data.map((g: { _id: string; title: string }) => ({
                _id: g._id,
                title: g.title,
              }))
            );
          }
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      }
    };

    fetchData();
  }, [queue?.summary.total]);

  const handleAddTask = async (taskData: CreateManualTaskInput) => {
    const res = await fetch("/api/v1/tasks/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taskData),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to create task");
    }

    await refresh();
  };

  const handleCreateGoal = async (goalData: CreateGoalInput) => {
    const res = await fetch("/api/v1/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(goalData),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to create goal");
    }

    const json = await res.json();
    const id = json?.data?.id ?? json?.id;
    if (!id) throw new Error("Missing goal id");
    router.push(`/dashboard/goals/${id}`);
  };

  const userName = session?.user?.name?.split(" ")[0] ?? "there";
  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
    []
  );

  const sections: SectionConfig[] = [
    {
      key: "overdue",
      title: "Overdue",
      items: queue?.sections.overdue ?? [],
      empty: "No overdue tasks.",
    },
    {
      key: "today",
      title: "Today",
      items: queue?.sections.today ?? [],
      empty: "Nothing scheduled today.",
    },
    {
      key: "revisions",
      title: "Revisions",
      items: queue?.sections.revisions ?? [],
      empty: "No revisions due.",
    },
  ];

  return (
    <AppShell
      eyebrow={todayLabel}
      title={`Hi, ${userName}`}
      action={<LogoutButton />}
    >
      <div className="space-y-5">
        <section className="rounded-3xl bg-slate-950 p-5 text-white shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-300">Focus queue</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight">
                {queue?.summary.total ?? 0}
              </p>
            </div>
            <button
              type="button"
              disabled={redistributing || (queue?.summary.overdueCount ?? 0) === 0}
              onClick={async () => {
                setRedistributing(true);
                try {
                  await redistribute();
                } finally {
                  setRedistributing(false);
                }
              }}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/15 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${redistributing ? "animate-spin" : ""}`}
              />
              Rebalance
            </button>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-white/10 p-3">
              <Flame className="h-4 w-4 text-orange-300" />
              <p className="mt-2 text-sm font-semibold">
                {summary.currentStreak}d
              </p>
              <p className="text-xs text-slate-300">Streak</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-3">
              <Target className="h-4 w-4 text-emerald-300" />
              <p className="mt-2 text-sm font-semibold">
                {summary.activeGoals}
              </p>
              <p className="text-xs text-slate-300">Goals</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-3">
              <CalendarDays className="h-4 w-4 text-sky-300" />
              <p className="mt-2 text-sm font-semibold">
                {queue?.summary.estimatedMinutes ?? 0}m
              </p>
              <p className="text-xs text-slate-300">Load</p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setShowAddTaskModal(true)}
            className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
          >
            <Plus className="h-5 w-5 text-emerald-700" />
            Task
          </button>
          <button
            type="button"
            onClick={() => setShowExcelUploadModal(true)}
            className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
          >
            <FileUp className="h-5 w-5 text-sky-700" />
            Upload
          </button>
          <button
            type="button"
            onClick={() => setShowAddGoalModal(true)}
            className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
          >
            <Target className="h-5 w-5 text-violet-700" />
            Goal
          </button>
        </div>

        {loading && (
          <div className="flex min-h-56 items-center justify-center rounded-3xl bg-white text-slate-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading
          </div>
        )}

        {error && (
          <div className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-6">
            {sections.map((section) => (
              <TaskSection
                key={section.key}
                section={section}
                completeTask={completeTask}
                skipTask={skipTask}
                rescheduleTask={rescheduleTask}
                onReveal={moveTaskToEnd}
              />
            ))}
            {queue?.summary.total === 0 && (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                <p className="text-base font-semibold text-slate-950">
                  Your day is clear.
                </p>
                <div className="mt-4 flex justify-center gap-2">
                  <Link
                    href="/goals/new"
                    className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
                  >
                    New goal
                  </Link>
                  <button
                    type="button"
                    onClick={() => setShowExcelUploadModal(true)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                  >
                    Upload
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <AddTaskModal
        isOpen={showAddTaskModal}
        onClose={() => setShowAddTaskModal(false)}
        onSubmit={handleAddTask}
        scheduledDate={new Date().toISOString().split("T")[0]}
        goals={goals}
      />

      <AddGoalModal
        isOpen={showAddGoalModal}
        onClose={() => setShowAddGoalModal(false)}
        onSubmit={handleCreateGoal}
      />

      <ExcelUploadModal
        isOpen={showExcelUploadModal}
        onClose={() => setShowExcelUploadModal(false)}
        onImported={refresh}
        goals={goals}
      />
    </AppShell>
  );
}
