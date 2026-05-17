"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Lightbulb, Loader2, Upload } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import type { TodayQueue } from "@/types/today";

export default function RecommendationsPage() {
  const [queue, setQueue] = useState<TodayQueue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/today")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setQueue(json.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const overdue = queue?.summary.overdueCount ?? 0;
  const load = queue?.summary.estimatedMinutes ?? 0;
  const recommendations = [
    overdue > 0
      ? "Rebalance overdue work before adding new tasks."
      : "Keep today light and finish the current queue first.",
    load > 180
      ? "Your focus load is heavy. Move low-priority tasks to tomorrow."
      : "Your workload is manageable. Use revision slots for retention.",
    "Group interview questions by topic, then drag them into dated blocks from the goal page.",
    "Upload resources and links into task descriptions so practice stays one tap away.",
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
              key={item}
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
                  <p className="mt-1 text-sm leading-6 text-slate-800">{item}</p>
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
