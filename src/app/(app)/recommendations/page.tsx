"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Lightbulb, Loader2, Upload } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import type { TodayQueue } from "@/types/today";
import { getBrowserTimezone } from "@/lib/dates";

type Recommendation = { message: string; href: string; action: string };

export default function RecommendationsPage() {
  const [queue, setQueue] = useState<TodayQueue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/v1/today?timezone=${encodeURIComponent(getBrowserTimezone())}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setQueue(json.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const overdue = queue?.summary.overdueCount ?? 0;
  const queuedTasks = queue?.summary.total ?? 0;
  const load = queue?.summary.estimatedMinutes ?? 0;
  const recommendations: Recommendation[] = [
    overdue > 0
      ? { message: "Start with overdue tasks in your queue and decide what to work on today.", href: "/today", action: "Open Today" }
      : queuedTasks > 0
        ? { message: "Continue with the tasks scheduled for today in your queue.", href: "/today", action: "Open Today" }
        : { message: "Your Today queue is clear. Add a task when you are ready to work.", href: "/today", action: "Open Today" },
    load > 180
      ? { message: "Your queued workload is over three hours. Review today's tasks and choose where to begin.", href: "/today", action: "Review Today" }
      : queuedTasks > 0
        ? { message: "Your queued workload is manageable. Continue with today's tasks and revisions.", href: "/today", action: "Open Today" }
        : { message: "Review a Goal plan and choose a next task to schedule.", href: "/goals", action: "View Goals" },
    { message: "Review your Goal plans and adjust task details or dates to keep your plan organized.", href: "/goals", action: "View Goals" },
    { message: "Add useful reference links to task descriptions from a Goal's spreadsheet view.", href: "/goals", action: "View Goals" },
  ];

  return (
    <AppShell eyebrow="Coach" title="Recommendations">
      {loading ? (
        <div className="flex min-h-64 items-center justify-center rounded-3xl bg-white text-slate-500">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((item, index) => (
            <div
              key={`${item.action}-${index}`}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                  <Lightbulb className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Recommendation {index + 1}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-800">{item.message}</p>
                  <Link href={item.href} className="mt-3 inline-flex min-h-10 items-center text-sm font-semibold text-brand-primary">{item.action}</Link>
                </div>
              </div>
            </div>
          ))}

          <Link
            href="/resources"
            className="flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
          >
            <Upload className="h-4 w-4" />
            Open resources
          </Link>
        </div>
      )}
    </AppShell>
  );
}
