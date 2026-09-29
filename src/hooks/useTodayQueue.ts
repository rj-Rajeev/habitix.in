"use client";

import { useCallback, useEffect, useState } from "react";
import type { TodayQueue } from "@/types/today";
import { getBrowserTimezone } from "@/lib/dates";

type ApiResponse<T> = { success: true; data: T } | { success: false };

async function responseError(res: Response, fallback: string) {
  const payload = await res.json().catch(() => ({}));
  return payload?.error?.message || payload?.message || fallback;
}

export function useTodayQueue() {
  const timezone = getBrowserTimezone();
  const [queue, setQueue] = useState<TodayQueue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/today?timezone=${encodeURIComponent(timezone)}`);
      const json = (await res.json().catch(() => ({}))) as ApiResponse<TodayQueue> & {
        error?: { message?: string };
        message?: string;
      };
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || json.message || "Failed to load Today");
      }
      setQueue(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [timezone]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const completeTask = async (taskId: string, revision?: string) => {
    const res = await fetch(`/api/v1/tasks/${taskId}/complete`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scheduleRevision: revision ?? "none",
      }),
    });
    if (!res.ok) throw new Error(await responseError(res, "Failed to complete task"));
    await fetchQueue();
  };

  const skipTask = async (taskId: string) => {
    const res = await fetch(`/api/v1/tasks/${taskId}/skip`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (!res.ok) throw new Error(await responseError(res, "Failed to skip task"));
    await fetchQueue();
  };

  const moveTaskToEnd = (taskId: string) => {
    setQueue((prev) => {
      if (!prev) return prev;

      const copy = { ...prev } as typeof prev;

      const moveInList = (list: any[]) => {
        const idx = list.findIndex((t) => t._id === taskId);
        if (idx === -1) return false;
        const [item] = list.splice(idx, 1);
        list.push(item);
        return true;
      };

      if (moveInList(copy.sections.overdue)) return copy;
      if (moveInList(copy.sections.today)) return copy;
      if (moveInList(copy.sections.revisions)) return copy;

      return copy;
    });
  };

  return {
    queue,
    loading,
    error,
    refresh: fetchQueue,
    completeTask,
    skipTask,
    moveTaskToEnd,
  };
}
