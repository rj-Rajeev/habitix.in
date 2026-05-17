"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  BookOpen,
  Calendar,
  Check,
  ChevronLeft,
  Clock3,
  GripVertical,
  Loader2,
  Plus,
  Target,
} from "lucide-react";
import AppShell from "@/components/app/AppShell";

type RoadmapTask = {
  _id?: string;
  title: string;
  isCompleted?: boolean;
  createdAt?: string;
};

type RoadmapDay = {
  dayNumber: number;
  dayDate?: string;
  date?: string;
  unlocked?: boolean;
  completed?: boolean;
  tasks: RoadmapTask[];
};

type GoalDetail = {
  _id: string;
  title: string;
  description?: string;
  targetDate?: string;
  hoursPerDay?: number;
  daysPerWeek?: number;
  preferredTime?: string;
  motivation?: string;
  roadmap?: RoadmapDay[];
};

type GoalTask = {
  _id: string;
  title: string;
  description?: string;
  status: "pending" | "in_progress" | "completed" | "skipped" | "cancelled";
  scheduledDate: string;
  estimatedMinutes?: number;
  type?: "execution" | "revision" | "recovery";
};

type TaskSection = {
  key: string;
  title: string;
  dateKey?: string;
  dateLabel: string;
  tasks: Array<{
    id: string;
    title: string;
    description?: string;
    completed: boolean;
    minutes: number;
    source: "task" | "roadmap";
    dayNumber?: number;
  }>;
};

function formatDate(value?: string) {
  if (!value) return "Unscheduled";
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function sectionsFromTasks(tasks: GoalTask[]): TaskSection[] {
  const groups = new Map<string, GoalTask[]>();
  tasks.forEach((task) => {
    const key = task.scheduledDate || "unscheduled";
    groups.set(key, [...(groups.get(key) ?? []), task]);
  });

  return [...groups.entries()].map(([date, items], index) => ({
    key: date,
    title: index === 0 ? "First block" : `Block ${index + 1}`,
    dateKey: date,
    dateLabel: formatDate(date),
    tasks: items.map((task) => ({
      id: task._id,
      title: task.title,
      description: task.description,
      completed: task.status === "completed",
      minutes: task.estimatedMinutes ?? 30,
      source: "task",
    })),
  }));
}

function sectionsFromRoadmap(roadmap: RoadmapDay[] = []): TaskSection[] {
  return roadmap.map((day) => {
    const date = day.dayDate ?? day.date;
    return {
      key: String(day.dayNumber),
      title: `Day ${day.dayNumber}`,
      dateKey: date,
      dateLabel: formatDate(date),
      tasks: day.tasks.map((task, index) => ({
        id: task._id ?? `${day.dayNumber}-${index}`,
        title: task.title,
        completed: Boolean(task.isCompleted),
        minutes: 30,
        source: "roadmap" as const,
        dayNumber: day.dayNumber,
      })),
    };
  });
}

export default function GoalDetailPage() {
  const params = useParams<{ id: string }>();
  const goalId = params.id;
  const [goal, setGoal] = useState<GoalDetail | null>(null);
  const [tasks, setTasks] = useState<GoalTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);

  const loadGoal = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [goalRes, tasksRes] = await Promise.all([
        fetch(`/api/v1/goals/${goalId}`),
        fetch(`/api/v1/goals/${goalId}/tasks`),
      ]);

      const goalJson = await goalRes.json().catch(() => ({}));
      const tasksJson = await tasksRes.json().catch(() => ({}));

      if (!goalRes.ok || !goalJson.success) {
        throw new Error(goalJson?.error?.message || "Failed to load goal");
      }

      setGoal(goalJson.data);
      setTasks(tasksJson?.success && Array.isArray(tasksJson.data) ? tasksJson.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load goal");
    } finally {
      setLoading(false);
    }
  }, [goalId]);

  useEffect(() => {
    loadGoal();
  }, [loadGoal]);

  const sections = useMemo(() => {
    if (tasks.length > 0) return sectionsFromTasks(tasks);
    return sectionsFromRoadmap(goal?.roadmap ?? []);
  }, [goal?.roadmap, tasks]);

  const totalTasks = sections.reduce((sum, section) => sum + section.tasks.length, 0);
  const completedTasks = sections.reduce(
    (sum, section) => sum + section.tasks.filter((task) => task.completed).length,
    0
  );
  const progress = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const toggleTaskDone = async (task: TaskSection["tasks"][number]) => {
    setBusyTaskId(task.id);
    try {
      const res = task.completed
        ? await fetch(`/api/v1/tasks/${task.id}/reopen`, { method: "PATCH" })
        : task.source === "roadmap"
          ? await fetch("/api/goals/toggle-task", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                goalId,
                dayNumber: task.dayNumber,
                taskId: task.id,
              }),
            })
          : await fetch(`/api/v1/tasks/${task.id}/complete`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ scheduleRevision: "none" }),
            });

      if (!res.ok) throw new Error("Failed to update task");
      await loadGoal();
    } finally {
      setBusyTaskId(null);
    }
  };

  const rescheduleTask = async (taskId: string, scheduledDate?: string) => {
    if (!scheduledDate) return;
    setBusyTaskId(taskId);
    try {
      const res = await fetch(`/api/v1/tasks/${taskId}/reschedule`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledDate }),
      });
      if (!res.ok) throw new Error("Failed to reschedule task");
      await loadGoal();
    } finally {
      setBusyTaskId(null);
      setDragTaskId(null);
    }
  };

  return (
    <AppShell
      eyebrow="Goal"
      title={goal?.title ?? "Goal"}
      action={
        <Link
          href="/goals"
          className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Link>
      }
    >
      {loading ? (
        <div className="flex min-h-72 items-center justify-center rounded-3xl bg-white text-slate-500">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading
        </div>
      ) : error ? (
        <div className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      ) : goal ? (
        <div className="space-y-5">
          <section className="rounded-3xl bg-slate-950 p-5 text-white shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-2xl font-semibold tracking-tight">
                  {goal.title}
                </h2>
                {goal.description && (
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-300">
                    {goal.description}
                  </p>
                )}
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                <Target className="h-6 w-6 text-emerald-300" />
              </div>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Progress</span>
                <span className="font-semibold">{progress}%</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-emerald-400 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-white/10 p-3">
                <p className="text-lg font-semibold">{completedTasks}</p>
                <p className="text-xs text-slate-300">Done</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3">
                <p className="text-lg font-semibold">{totalTasks}</p>
                <p className="text-xs text-slate-300">Tasks</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3">
                <p className="text-lg font-semibold">
                  {goal.targetDate ? formatDate(goal.targetDate) : "Open"}
                </p>
                <p className="text-xs text-slate-300">Target</p>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3">
            <Link
              href="/today"
              className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-900 shadow-sm"
            >
              Today queue
            </Link>
            <Link
              href="/goals/new"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-900 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              New goal
            </Link>
            <Link
              href="/resources"
              className="col-span-2 inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-900 shadow-sm"
            >
              <BookOpen className="h-4 w-4" />
              Resources
            </Link>
          </section>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            Drag tasks between dated blocks to restructure the plan. On mobile,
            use the date field inside a task for the same result.
          </div>

          {sections.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-6 text-center text-sm text-slate-500">
              No tasks in this goal yet.
            </div>
          ) : (
            <div className="space-y-4">
              {sections.map((section) => (
                <section
                  key={section.key}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    if (dragTaskId && section.dateKey) {
                      void rescheduleTask(dragTaskId, section.dateKey);
                    }
                  }}
                  className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-950">
                        {section.title}
                      </h3>
                      <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                        <Calendar className="h-3.5 w-3.5" />
                        {section.dateLabel}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      {section.tasks.filter((task) => task.completed).length}/
                      {section.tasks.length}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {section.tasks.map((task) => (
                      <div
                        key={task.id}
                        draggable={task.source === "task"}
                        onDragStart={() => setDragTaskId(task.id)}
                        onDragEnd={() => setDragTaskId(null)}
                        className={`flex w-full items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-left transition ${
                          dragTaskId === task.id ? "opacity-50" : ""
                        }`}
                      >
                        <span className="mt-1 text-slate-300">
                          <GripVertical className="h-4 w-4" />
                        </span>
                        <button
                          type="button"
                          disabled={busyTaskId === task.id}
                          onClick={() => toggleTaskDone(task)}
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                            task.completed
                              ? "border-emerald-600 bg-emerald-600 text-white"
                              : "border-slate-300 bg-white text-slate-400"
                          }`}
                          aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
                        >
                          {busyTaskId === task.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </button>
                        <div className="min-w-0 flex-1">
                          <span
                            className={`block text-sm font-semibold leading-5 ${
                              task.completed
                                ? "text-slate-400 line-through"
                                : "text-slate-900"
                            }`}
                          >
                            {task.title}
                          </span>
                          {task.description && (
                            <span className="mt-1 line-clamp-2 block text-xs leading-5 text-slate-500">
                              {task.description}
                            </span>
                          )}
                          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                              <Clock3 className="h-3.5 w-3.5" />
                              {task.minutes}m
                            </span>
                            {task.source === "task" && (
                              <input
                                type="date"
                                defaultValue={section.dateKey}
                                onChange={(event) =>
                                  rescheduleTask(task.id, event.target.value)
                                }
                                className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700"
                                aria-label="Change task date"
                              />
                            )}
                          </div>
                        </div>
                        {/* 
                          Preserve visible completion state in a small, reversible control.
                          The card itself is for restructuring, not accidental completion.
                        */}
                        <span
                          className="sr-only"
                        >
                          {task.completed ? "Completed" : "Pending"}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </AppShell>
  );
}
