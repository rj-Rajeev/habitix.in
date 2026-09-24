"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  FileUp,
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
import { Alert, Skeleton } from "@/components/ui";

type SectionConfig = {
  key: string;
  title: string;
  items: TodayTaskCard[];
  empty: string;
};

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
        <h2 className="text-base font-semibold text-text-primary">
          {section.title}
        </h2>
        <span className="ui-badge" data-tone={section.key === "revisions" ? "ai" : "neutral"}>
          {section.items.length}
        </span>
      </div>

      {section.items.length === 0 ? (
        <div className="border-b border-border py-3 text-sm text-text-muted">
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
      <div className="space-y-8">
        <section className="rounded-container border border-border bg-surface p-5 shadow-[var(--shadow-sm)] sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-text-secondary">Here&apos;s what matters today.</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-text-primary">{queue?.summary.total ?? 0} tasks</p>
              <p className="mt-1 text-sm text-text-secondary">~{queue?.summary.estimatedMinutes ?? 0}m of focused work</p>
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
              className="inline-flex items-center gap-2 self-start rounded-control border border-border-strong bg-surface px-3 py-2 text-sm font-semibold text-text-secondary hover:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${redistributing ? "animate-spin" : ""}`} />
              Rebalance
            </button>
          </div>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-4 text-xs text-text-secondary">
            <span>{queue?.sections.today.length ?? 0} today</span>
            <span>{queue?.summary.overdueCount ?? 0} overdue</span>
            <span>{queue?.sections.revisions.length ?? 0} revision{queue?.sections.revisions.length === 1 ? "" : "s"}</span>
            {summary.currentStreak > 0 && <span>{summary.currentStreak} day streak</span>}
          </div>
        </section>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowAddTaskModal(true)}
            className="ui-button min-h-11 flex-1 sm:flex-none"
            data-variant="primary"
          >
            <Plus className="h-4 w-4" /> Add task
          </button>
          <button
            type="button"
            onClick={() => setShowExcelUploadModal(true)}
            className="ui-button min-h-11 flex-1 sm:flex-none"
            data-variant="secondary"
          >
            <FileUp className="h-4 w-4" /> Import
          </button>
          <button
            type="button"
            onClick={() => setShowAddGoalModal(true)}
            className="ui-button min-h-11 flex-1 sm:flex-none"
            data-variant="secondary"
          >
            <Target className="h-4 w-4" /> Add goal
          </button>
        </div>

        {loading && (
          <div className="space-y-3"><Skeleton className="h-5 w-36" /><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>
        )}

        {error && (
          <Alert tone="error">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </Alert>
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
              <div className="border-t border-border py-6 text-center">
                <p className="text-base font-semibold text-text-primary">Your day is clear.</p>
                <div className="mt-4 flex justify-center gap-2">
                  <button type="button" onClick={() => setShowAddTaskModal(true)} className="ui-button" data-variant="primary"><Plus className="h-4 w-4" /> Add task</button>
                  <button type="button" onClick={() => setShowAddGoalModal(true)} className="ui-button" data-variant="secondary">Create goal</button>
                  <button
                    type="button"
                    onClick={() => setShowExcelUploadModal(true)}
                    className="ui-button"
                    data-variant="ghost"
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
