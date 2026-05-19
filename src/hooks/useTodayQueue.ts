"use client";

import { useCallback, useEffect, useState } from "react";
import type { TodayQueue } from "@/types/today";

type ApiResponse<T> = { success: true; data: T } | { success: false };

export function useTodayQueue() {
  const [queue, setQueue] = useState<TodayQueue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/today");
      const json = (await res.json()) as ApiResponse<TodayQueue>;
      if (!res.ok || !json.success) {
        throw new Error("Failed to load today queue");
      }
      setQueue(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

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
    if (!res.ok) throw new Error("Failed to complete task");
    await fetchQueue();
  };

  const skipTask = async (taskId: string) => {
    const res = await fetch(`/api/v1/tasks/${taskId}/skip`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (!res.ok) throw new Error("Failed to skip task");
    await fetchQueue();
  };

  const rescheduleTask = async (taskId: string, scheduledDate: string) => {
    const res = await fetch(`/api/v1/tasks/${taskId}/reschedule`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: scheduledDate }),
    });
    if (!res.ok) throw new Error("Failed to reschedule task");
    await fetchQueue();
  };

  const redistribute = async () => {
    const res = await fetch("/api/v1/scheduling/redistribute", {
      method: "POST",
    });
    if (!res.ok) throw new Error("Failed to redistribute");
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
    rescheduleTask,
    redistribute,
    moveTaskToEnd,
  };
}
