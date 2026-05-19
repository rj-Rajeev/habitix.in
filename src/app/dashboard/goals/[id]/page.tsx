"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  BookOpen,
  Calendar,
  Check,
  ChevronLeft,
  Clock3,
  Download,
  GripVertical,
  Loader2,
  Plus,
  Save,
  Target,
  Upload,
} from "lucide-react";
import AppShell from "@/components/app/AppShell";
import {
  TASK_SPREADSHEET_ACCEPT,
  TASK_SPREADSHEET_HEADERS,
} from "@/modules/tasks/task-spreadsheet";

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
  task?: string;
  topic?: string;
  title: string;
  description?: string;
  status: "pending" | "in_progress" | "completed" | "skipped" | "cancelled";
  scheduledDate: string;
  priority?: "low" | "medium" | "high";
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
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"plan" | "excel">("plan");
  const [edits, setEdits] = useState<Record<string, Partial<GoalTask>>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();

  const REVISION_OPTIONS = [
    { key: "1h", label: "1 hour" },
    { key: "3h", label: "3 hours" },
    { key: "tomorrow", label: "Tomorrow" },
    { key: "3d", label: "3 days" },
    { key: "7d", label: "7 days" },
    { key: "15d", label: "15 days" },
  ] as const;

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

  const updateLocalTaskStatus = (taskId: string, completed: boolean) => {
    setTasks((prev) =>
      prev.map((task) =>
        task._id === taskId
          ? { ...task, status: completed ? "completed" : "pending" }
          : task
      )
    );
  };

  const updateLocalTaskSchedule = (taskId: string, scheduledDate: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task._id === taskId ? { ...task, scheduledDate } : task
      )
    );
  };

  const getEditedTask = useCallback(
    (task: GoalTask) => ({ ...task, ...(edits[task._id] ?? {}) }),
    [edits]
  );

  const setTaskEdit = useCallback((taskId: string, update: Partial<GoalTask>) => {
    setEdits((prev) => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        ...update,
      },
    }));
  }, []);

  const resetTaskEdit = useCallback((taskId: string) => {
    setEdits((prev) => {
      const next = { ...prev };
      delete next[taskId];
      return next;
    });
  }, []);

  const saveAllEdits = useCallback(async () => {
      const updates = Object.entries(edits)
      .map(([id, update]) => ({
        id,
        ...(update.task !== undefined ? { task: update.task } : {}),
        ...(update.topic !== undefined ? { topic: update.topic } : {}),
        ...(update.description !== undefined
          ? { description: update.description }
          : {}),
        ...(update.scheduledDate !== undefined
          ? { date: update.scheduledDate }
          : {}),
        ...(update.estimatedMinutes !== undefined
          ? { minutes: update.estimatedMinutes }
          : {}),
        ...(update.priority !== undefined ? { priority: update.priority } : {}),
        ...(update.status !== undefined ? { status: update.status } : {}),
      }))
      .filter((item) => Object.keys(item).length > 1);

    if (updates.length === 0) {
      return;
    }

    setSaveError(null);
    setSaveSuccess(null);
    setSaving(true);

    try {
      const res = await fetch("/api/v1/tasks/bulk-update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: updates }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || "Failed to save task updates");
      }
      await loadGoal();
      setEdits({});
      setSaveSuccess("Changes saved.");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }, [edits, loadGoal]);

  const importTasks = useCallback(
    async (file?: File) => {
      if (!file) return;

      setSaveError(null);
      setSaveSuccess(null);
      setImporting(true);

      try {
        const form = new FormData();
        form.set("goalId", goalId);
        form.set("date", new Date().toISOString().split("T")[0]);
        form.set("replace", "true");
        form.set("file", file);

        const res = await fetch("/api/v1/tasks/import-excel", {
          method: "POST",
          body: form,
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data.success) {
          throw new Error(
            data?.error?.message || data?.message || "Failed to import tasks"
          );
        }

        await loadGoal();
        const imported = data?.data?.imported ?? 0;
        const skipped = data?.data?.skipped ?? 0;
        setSaveSuccess(
          `Replaced with ${imported} task${imported === 1 ? "" : "s"}${
            skipped ? `, skipped ${skipped}` : ""
          }.`
        );
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : String(err));
      } finally {
        setImporting(false);
        if (importInputRef.current) {
          importInputRef.current.value = "";
        }
      }
    },
    [goalId, loadGoal]
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      setSaveError(null);
      setSaveSuccess(null);
      setBusyTaskId(taskId);

      try {
        const res = await fetch(`/api/v1/tasks/${taskId}/delete`, {
          method: "DELETE",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
          throw new Error(data?.error?.message || "Failed to delete task");
        }
        setTasks((prev) => prev.filter((task) => task._id !== taskId));
        resetTaskEdit(taskId);
        setSaveSuccess("Task deleted.");
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : String(err));
      } finally {
        setBusyTaskId(null);
      }
    },
    [resetTaskEdit]
  );

  const exportCsv = useCallback(() => {
    const exportItems =
      tasks.length > 0
        ? tasks.map((task) => {
            const row = getEditedTask(task);
            return {
              task: row.task ?? "",
              topic: row.topic ?? row.title,
              description: row.description ?? "",
              scheduledDate: row.scheduledDate || "",
              priority: row.priority ?? "medium",
              estimatedMinutes: String(row.estimatedMinutes ?? ""),
              status: row.status,
            };
          })
        : (goal?.roadmap ?? []).flatMap((day) =>
            day.tasks.map((task) => ({
              task: "",
              topic: task.title,
              description: "",
              scheduledDate: day.dayDate ?? day.date ?? "",
              priority: "medium",
              estimatedMinutes: "30",
              status: task.isCompleted ? "completed" : "pending",
            }))
          );

    const rows = [
      [...TASK_SPREADSHEET_HEADERS],
      ...exportItems.map((item) => [
        item.scheduledDate,
        item.task,
        item.topic,
        item.description,
        item.priority,
        item.estimatedMinutes,
        item.status,
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\r\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${goal?.title?.replace(/\s+/g, "-") || "goal"}-tasks.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, [goal?.roadmap, goal?.title, getEditedTask, tasks]);

  const updateLocalRoadmapTask = (taskId: string, completed: boolean) => {
    setGoal((prev) => {
      if (!prev?.roadmap) return prev;

      const updatedRoadmap = prev.roadmap.map((day, index, array) => {
        const taskFound = day.tasks.some(
          (task) => task._id?.toString() === taskId
        );

        const tasks = day.tasks.map((task) =>
          task._id?.toString() === taskId
            ? { ...task, isCompleted: completed }
            : task
        );

        const completedDay = tasks.every((task) => task.isCompleted);
        const updatedDay = { ...day, tasks, completed: completedDay };

        if (taskFound && completedDay && index + 1 < array.length) {
          updatedDay.unlocked = true;
        }

        return updatedDay;
      });

      return { ...prev, roadmap: updatedRoadmap };
    });
  };

  const toggleTaskDone = async (
    task: TaskSection["tasks"][number],
    scheduleRevision: string = "none"
  ) => {
    setBusyTaskId(task.id);
    try {
      const res = task.completed
        ? await fetch(`/api/v1/tasks/${task.id}/reopen`, {
            method: "PATCH",
          })
        : task.source === "roadmap"
        ? await fetch("/api/goals/toggle-task", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              goalId,
              dayNumber: task.dayNumber,
              taskId: task.id,
              scheduleRevision,
            }),
          })
        : await fetch(`/api/v1/tasks/${task.id}/complete`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ scheduleRevision }),
          });

      if (!res.ok) throw new Error("Failed to update task");

      if (task.source === "roadmap") {
        updateLocalRoadmapTask(task.id, !task.completed);
      } else {
        updateLocalTaskStatus(task.id, !task.completed);
      }
    } finally {
      setBusyTaskId(null);
      setExpandedTaskId(null);
    }
  };

  const rescheduleTask = async (taskId: string, scheduledDate?: string) => {
    if (!scheduledDate) return;
    setBusyTaskId(taskId);
    try {
      const res = await fetch(`/api/v1/tasks/${taskId}/reschedule`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: scheduledDate }),
      });
      if (!res.ok) throw new Error("Failed to reschedule task");
      updateLocalTaskSchedule(taskId, scheduledDate);
    } finally {
      setBusyTaskId(null);
      setDragTaskId(null);
    }
  };

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
  const pendingEditCount = Object.keys(edits).length;

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

          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">
                  Tasks
                </h3>
                <p className="text-sm text-slate-500">{totalTasks} in this goal</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode("plan")}
                  className={`h-10 rounded-full px-3 text-sm font-semibold transition ${
                    viewMode === "plan"
                      ? "bg-slate-950 text-white"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Plan view
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("excel")}
                  className={`h-10 rounded-full px-3 text-sm font-semibold transition ${
                    viewMode === "excel"
                      ? "bg-slate-950 text-white"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Excel view
                </button>
                <input
                  ref={importInputRef}
                  type="file"
                  accept={TASK_SPREADSHEET_ACCEPT}
                  className="hidden"
                  onChange={(event) => void importTasks(event.target.files?.[0])}
                />
                <button
                  type="button"
                  onClick={() => importInputRef.current?.click()}
                  disabled={importing}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  {importing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Import
                </button>
                <button
                  type="button"
                  onClick={exportCsv}
                  disabled={totalTasks === 0}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                  Export
                </button>
                {viewMode === "excel" && pendingEditCount > 0 && (
                  <button
                    type="button"
                    onClick={saveAllEdits}
                    disabled={saving}
                    className="inline-flex h-10 items-center gap-2 rounded-full bg-emerald-600 px-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save
                  </button>
                )}
              </div>
            </div>

            {(saveError || saveSuccess) && (
              <div
                className={`mt-3 rounded-2xl px-3 py-2 text-sm ${
                  saveError
                    ? "bg-red-50 text-red-700"
                    : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {saveError || saveSuccess}
              </div>
            )}

            {viewMode === "excel" && (
              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
                <div className="w-full overflow-x-auto overflow-y-hidden touch-pan-x">
                  <table className="min-w-max border-collapse text-[11px] sm:text-sm">
                    <thead className="sticky top-0 z-20 bg-slate-100">
                      <tr>
                        <th className="sticky left-0 z-30 min-w-[110px] w-[110px] border border-slate-300 bg-slate-100 px-2 py-2 text-center font-semibold text-slate-700 sm:px-3 sm:py-3">
                          Date
                        </th>
                        <th className="min-w-[130px] w-[130px] border border-slate-300 px-2 py-2 text-left font-semibold text-slate-700 sm:px-3 sm:py-3">
                          Task
                        </th>
                        <th className="min-w-[130px] w-[130px] border border-slate-300 px-2 py-2 text-left font-semibold text-slate-700 sm:px-3 sm:py-3">
                          Topic
                        </th>
                        <th className="min-w-[160px] w-[160px] border border-slate-300 px-2 py-2 text-left font-semibold text-slate-700 sm:px-3 sm:py-3">
                          Description
                        </th>
                        <th className="min-w-[90px] w-[90px] border border-slate-300 px-2 py-2 text-center font-semibold text-slate-700 sm:px-3 sm:py-3">
                          Priority
                        </th>
                        <th className="min-w-[70px] w-[70px] border border-slate-300 px-2 py-2 text-center font-semibold text-slate-700 sm:px-3 sm:py-3">
                          Minutes
                        </th>
                        <th className="min-w-[95px] w-[95px] border border-slate-300 px-2 py-2 text-center font-semibold text-slate-700 sm:px-3 sm:py-3">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.map((task, index) => {
                        const edited = edits[task._id] ?? {};

                        return (
                          <tr
                            key={task._id}
                            className={`transition ${
                              index % 2 === 0 ? "bg-white" : "bg-slate-50"
                            } hover:bg-blue-50`}
                          >
                            <td className="sticky left-0 z-10 border border-slate-300 bg-white p-0">
                              <input
                                type="date"
                                value={
                                  (
                                    edited.scheduledDate ??
                                    task.scheduledDate
                                  )?.split("T")[0]
                                }
                                onChange={(e) =>
                                  setEdits((prev) => ({
                                    ...prev,
                                    [task._id]: {
                                      ...prev[task._id],
                                      scheduledDate: e.target.value,
                                    },
                                  }))
                                }
                                className="h-9 w-full border-0 bg-transparent px-1 text-center text-[11px] outline-none focus:bg-yellow-50 sm:h-11 sm:px-2 sm:text-sm"
                              />
                            </td>
                            <td className="border border-slate-300 p-0">
                              <input
                                value={edited.task ?? task.task ?? ""}
                                onChange={(e) =>
                                  setEdits((prev) => ({
                                    ...prev,
                                    [task._id]: {
                                      ...prev[task._id],
                                      task: e.target.value,
                                    },
                                  }))
                                }
                                className="h-9 w-full border-0 bg-transparent px-2 text-[11px] outline-none focus:bg-yellow-50 sm:h-11 sm:px-3 sm:text-sm"
                              />
                            </td>
                            <td className="border border-slate-300 p-0">
                              <input
                                value={edited.topic ?? task.topic ?? task.title}
                                onChange={(e) =>
                                  setEdits((prev) => ({
                                    ...prev,
                                    [task._id]: {
                                      ...prev[task._id],
                                      topic: e.target.value,
                                      title: e.target.value,
                                    },
                                  }))
                                }
                                className="h-9 w-full border-0 bg-transparent px-2 text-[11px] outline-none focus:bg-yellow-50 sm:h-11 sm:px-3 sm:text-sm"
                              />
                            </td>
                            <td className="border border-slate-300 p-0">
                              <input
                                value={edited.description ?? task.description ?? ""}
                                onChange={(e) =>
                                  setEdits((prev) => ({
                                    ...prev,
                                    [task._id]: {
                                      ...prev[task._id],
                                      description: e.target.value,
                                    },
                                  }))
                                }
                                className="h-9 w-full border-0 bg-transparent px-2 text-[11px] outline-none focus:bg-yellow-50 sm:h-11 sm:px-3 sm:text-sm"
                              />
                            </td>
                            <td className="border border-slate-300 p-0">
                              <select
                                value={edited.priority ?? task.priority ?? "medium"}
                                onChange={(e) =>
                                  setEdits((prev) => ({
                                    ...prev,
                                    [task._id]: {
                                      ...prev[task._id],
                                      priority: e.target
                                        .value as GoalTask["priority"],
                                    },
                                  }))
                                }
                                className="h-9 w-full border-0 bg-transparent px-1 text-center text-[11px] outline-none focus:bg-yellow-50 sm:h-11 sm:px-2 sm:text-sm"
                              >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                              </select>
                            </td>
                            <td className="border border-slate-300 p-0">
                              <input
                                type="number"
                                value={
                                  edited.estimatedMinutes ??
                                  task.estimatedMinutes ??
                                  30
                                }
                                onChange={(e) =>
                                  setEdits((prev) => ({
                                    ...prev,
                                    [task._id]: {
                                      ...prev[task._id],
                                      estimatedMinutes: Number(e.target.value),
                                    },
                                  }))
                                }
                                className="h-9 w-full border-0 bg-transparent px-1 text-center text-[11px] outline-none focus:bg-yellow-50 sm:h-11 sm:px-2 sm:text-sm"
                              />
                            </td>
                            <td className="border border-slate-300 p-0">
                              <select
                                value={edited.status ?? task.status}
                                onChange={(e) =>
                                  setEdits((prev) => ({
                                    ...prev,
                                    [task._id]: {
                                      ...prev[task._id],
                                      status: e.target.value as GoalTask["status"],
                                    },
                                  }))
                                }
                                className="h-9 w-full border-0 bg-transparent px-1 text-center text-[11px] outline-none focus:bg-yellow-50 sm:h-11 sm:px-2 sm:text-sm"
                              >
                                <option value="pending">Pending</option>
                                <option value="in_progress">Progress</option>
                                <option value="completed">Done</option>
                                <option value="skipped">Skipped</option>
                                <option value="cancelled">Cancel</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          {viewMode === "plan" && (
            sections.length === 0 ? (
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
                          className={`rounded-2xl border border-slate-100 bg-slate-50 p-3 transition ${
                            dragTaskId === task.id ? "opacity-50" : ""
                          }`}
                        >
                          <div className="flex items-start gap-3">
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
                              aria-label={
                                task.completed
                                  ? "Mark incomplete"
                                  : "Mark complete"
                              }
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
                                <span className="mt-1 block line-clamp-2 text-xs leading-5 text-slate-500">
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

                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedTaskId((current) =>
                                      current === task.id ? null : task.id
                                    )
                                  }
                                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                  {expandedTaskId === task.id
                                    ? "Hide"
                                    : "Revision"}
                                </button>
                              </div>
                            </div>
                          </div>

                          {expandedTaskId === task.id && !task.completed && (
                            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Schedule a revision after completion
                              </p>

                              <div className="mt-3 flex flex-wrap gap-2">
                                {REVISION_OPTIONS.map((option) => (
                                  <button
                                    key={option.key}
                                    type="button"
                                    disabled={busyTaskId === task.id}
                                    onClick={() =>
                                      toggleTaskDone(task, option.key)
                                    }
                                    className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-800 hover:bg-violet-100"
                                  >
                                    {option.label}
                                  </button>
                                ))}
                              </div>

                              <p className="mt-3 text-xs text-slate-500">
                                Choose a revision schedule, or tap the main
                                checkmark to complete without revision.
                              </p>
                            </div>
                          )}

                          <span className="sr-only">
                            {task.completed ? "Completed" : "Pending"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )
          )}

          <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
            <h3 className="font-semibold text-red-800">Danger zone</h3>
            <p className="mt-2 text-xs text-red-700">
              Permanently delete this goal and its tasks. This action cannot be undone.
            </p>
            {!showDeleteConfirm ? (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Delete goal
                </button>
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-red-700">Type the goal title to confirm:</p>
                <input
                  type="text"
                  value={confirmName}
                  onChange={(e) => setConfirmName(e.target.value)}
                  placeholder={goal.title}
                  className="w-full rounded-md border border-red-300 px-3 py-2 text-sm"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={deleting || confirmName.trim() !== goal.title}
                    onClick={async () => {
                      setDeleteError(null);
                      setDeleting(true);
                      try {
                        const res = await fetch(`/api/v1/goals/${goalId}`, {
                          method: "DELETE",
                        });
                        if (!res.ok) {
                          const data = await res.json().catch(() => ({}));
                          throw new Error(data?.error?.message || "Failed to delete goal");
                        }
                        router.push("/goals");
                      } catch (err) {
                        setDeleteError(err instanceof Error ? err.message : String(err));
                      } finally {
                        setDeleting(false);
                      }
                    }}
                    className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {deleting ? "Deleting..." : "Confirm delete"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setConfirmName("");
                      setDeleteError(null);
                    }}
                    className="rounded-md border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 bg-white"
                  >
                    Cancel
                  </button>
                </div>
                {deleteError && (
                  <p className="mt-2 text-xs text-red-800">{deleteError}</p>
                )}
              </div>
            )}
          </section>
        </div>
      ) : null}
    </AppShell>
  );
}
