"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Calendar,
  Check,
  ChevronDown,
  Clock3,
  RotateCcw,
  SkipForward,
} from "lucide-react";
import type { TodayTaskCard } from "@/types/today";

type Props = {
  task: TodayTaskCard;
  onComplete: (taskId: string, revision?: string) => Promise<void>;
  onSkip: (taskId: string) => Promise<void>;
  onReschedule: (taskId: string, date: string) => Promise<void>;
  onReveal?: (taskId: string) => void;
};

const REVISION_OPTIONS = [
  { key: "1h", label: "1h" },
  { key: "3h", label: "3h" },
  { key: "tomorrow", label: "Tomorrow" },
  { key: "3d", label: "3 days" },
  { key: "7d", label: "7 days" },
  { key: "15d", label: "15 days" },
] as const;

function addDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export default function TaskCard({
  task,
  onComplete,
  onSkip,
  onReschedule,
  onReveal,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [openingLesson, setOpeningLesson] = useState(false);
  const [lessonNavigationError, setLessonNavigationError] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const isDone = task.status === "completed";
  const scheduledLabel = useMemo(() => {
    const date = new Date(`${task.scheduledDate}T12:00:00`);
    return Number.isNaN(date.getTime())
      ? task.scheduledDate
      : date.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        });
  }, [task.scheduledDate]);

  const answer = task.answer ?? task.description ?? task.notes;
  const hasAnswer = Boolean(answer);
  const learning = task.metadata?.learning;

  const openLesson = async () => {
    if (!learning) return;
    setOpeningLesson(true);
    setLessonNavigationError("");
    try {
      const response = await fetch("/api/courses");
      const payload = await response.json().catch(() => null);
      if (!response.ok || payload?.success === false) throw new Error();
      const courses = payload?.data ?? payload;
      const course = Array.isArray(courses)
        ? courses.find((item: { _id?: string }) => item._id === learning.courseId)
        : undefined;
      if (!course?.slug) throw new Error();
      router.push(`/courses/${encodeURIComponent(course.slug)}?lessonId=${encodeURIComponent(learning.lessonId)}`);
    } catch {
      setLessonNavigationError("This course lesson is unavailable right now.");
    } finally {
      setOpeningLesson(false);
    }
  };

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
      setExpanded(false);
    }
  };

  return (
    <article
      className={`rounded-card border bg-surface p-4 shadow-[var(--shadow-sm)] transition-colors ${task.isOverdue ? "border-amber-200" : "border-border"}`}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          disabled={busy || isDone}
          onClick={() => {
            if (task.type === "execution" && !isDone) {
              setExpanded(true);
              return;
            }
            run(() => onComplete(task._id));
          }}
          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition ${
            isDone
              ? "border-brand-primary bg-brand-primary text-white"
              : "border-border-strong bg-surface text-text-muted hover:border-brand-primary hover:text-brand-primary"
          }`}
          aria-label={
            isDone
              ? "Task completed"
              : task.type === "execution"
              ? "Choose revision schedule"
              : "Complete task"
          }
        >
          <Check className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3
                className={`text-[15px] font-semibold leading-5 ${
                  isDone ? "text-text-muted line-through" : "text-text-primary"
                }`}
              >
                {task.title}
              </h3>
              <p className="mt-1 truncate text-xs text-text-secondary">
                {task.goalTitle}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="rounded-control p-1 text-text-muted hover:bg-surface-subtle hover:text-text-primary"
              aria-label={expanded ? "Hide revision options" : "Show revision options"}
            >
              <ChevronDown
                className={`h-4 w-4 transition ${expanded ? "rotate-180" : ""}`}
              />
            </button>
          </div>

          {!showAnswer && task.description && (
              <p className="mt-2 line-clamp-2 text-sm leading-5 text-text-secondary">
              {task.description}
            </p>
          )}

          {showAnswer && (
            <div className="mt-4 rounded-control border border-border bg-surface-subtle p-4 text-sm text-text-secondary">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                Answer / Details
              </p>
              <div className="mt-2 whitespace-pre-wrap text-sm leading-6">
                {answer || "No answer or additional details available for this task."}
              </div>
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            {task.type === "revision" && (
                <span className="ui-badge" data-tone="ai">
                Revision
              </span>
            )}
            {task.isOverdue && (
                <span className="ui-badge" data-tone="warning">
                Overdue
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-text-muted">
              <Clock3 className="h-3.5 w-3.5" />
              {task.estimatedMinutes}m
            </span>
            {task.type === "execution" && learning?.courseId && learning.lessonId && (
              <button
                type="button"
                disabled={openingLesson}
                onClick={() => void openLesson()}
                className="inline-flex min-h-8 items-center gap-1 rounded-full border border-border-strong bg-surface px-3 text-xs font-semibold text-brand-primary hover:bg-surface-subtle disabled:opacity-60"
              >
                <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                {openingLesson ? "Opening…" : "Open lesson"}
              </button>
            )}
            <span className="inline-flex items-center gap-1 text-text-muted">
              <Calendar className="h-3.5 w-3.5" />
              {scheduledLabel}
            </span>
            <button
              type="button"
              disabled={!hasAnswer}
              onClick={() =>
                setShowAnswer((value) => {
                  const next = !value;
                  if (next && onReveal) onReveal(task._id);
                  return next;
                })
              }
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                hasAnswer
                  ? "border-border-strong bg-surface text-text-secondary hover:bg-surface-subtle"
                  : "border-border bg-surface-subtle text-text-muted cursor-not-allowed"
              }`}
            >
              {showAnswer ? "Hide answer" : "Show answer"}
            </button>
          </div>
          {lessonNavigationError && <p className="mt-2 text-xs text-text-muted" role="status">{lessonNavigationError}</p>}
        </div>
      </div>

      {expanded && (
        <div className="mt-4 space-y-3 border-t border-border pt-4">
          {task.type === "execution" && !isDone && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                Revision
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => run(() => onComplete(task._id))}
                  className="ui-button min-h-9 px-3 text-xs"
                  data-variant="secondary"
                >
                  Complete without revision
                </button>
                {REVISION_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    disabled={busy}
                    onClick={() => run(() => onComplete(task._id, opt.key))}
                    className="ui-button min-h-9 px-3 text-xs"
                    data-variant="ghost"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-text-muted">
                Choose when you want to revisit this task, or complete without scheduling a revision.
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => onReschedule(task._id, addDays(1)))}
              className="ui-button min-h-10 px-3 text-xs"
              data-variant="secondary"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Tomorrow
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => onSkip(task._id))}
              className="ui-button min-h-10 px-3 text-xs"
              data-variant="ghost"
            >
              <SkipForward className="h-4 w-4" aria-hidden="true" />
              Skip
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
