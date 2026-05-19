"use client";

import { useMemo, useState } from "react";
import { Calendar, Check, ChevronDown, Clock3, RotateCcw } from "lucide-react";
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
  const [busy, setBusy] = useState(false);
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
      className={`rounded-2xl border bg-white p-4 shadow-sm transition ${
        task.isOverdue ? "border-amber-200 ring-1 ring-amber-100" : "border-slate-200"
      } ${showAnswer ? "card-sweep card-3d" : ""}`}
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
              ? "border-emerald-600 bg-emerald-600 text-white"
              : "border-slate-300 bg-white text-slate-500 hover:border-emerald-600 hover:text-emerald-700"
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
                className={`text-sm font-semibold leading-5 ${
                  isDone ? "text-slate-400 line-through" : "text-slate-950"
                }`}
              >
                {task.title}
              </h3>
              <p className="mt-1 truncate text-xs text-slate-500">
                {task.goalTitle}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label={expanded ? "Hide revision options" : "Show revision options"}
            >
              <ChevronDown
                className={`h-4 w-4 transition ${expanded ? "rotate-180" : ""}`}
              />
            </button>
          </div>

          {!showAnswer && task.description && (
            <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-600">
              {task.description}
            </p>
          )}

          {showAnswer && (
            <div className={`mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 ${showAnswer ? "answer-reveal" : ""}`}>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Answer / Details
              </p>
              <div className="mt-2 whitespace-pre-wrap text-sm leading-6">
                {answer || "No answer or additional details available for this task."}
              </div>
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            {task.type === "revision" && (
              <span className="rounded-full bg-violet-50 px-2.5 py-1 font-medium text-violet-700 ring-1 ring-violet-100">
                Revision
              </span>
            )}
            {task.isOverdue && (
              <span className="rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-700 ring-1 ring-amber-100">
                Overdue
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-slate-500">
              <Clock3 className="h-3.5 w-3.5" />
              {task.estimatedMinutes}m
            </span>
            <span className="inline-flex items-center gap-1 text-slate-500">
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
                  ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  : "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
              }`}
            >
              {showAnswer ? "Hide answer" : "Show answer"}
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
          {task.type === "execution" && !isDone && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Revision
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => run(() => onComplete(task._id))}
                  className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Complete without revision
                </button>
                {REVISION_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    disabled={busy}
                    onClick={() => run(() => onComplete(task._id, opt.key))}
                    className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-800 hover:bg-violet-100"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Choose when you want to revisit this task, or complete without scheduling a revision.
              </p>
            </div>
          )}

          
        </div>
      )}
    </article>
  );
}
