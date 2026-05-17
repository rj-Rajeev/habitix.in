"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { CreateManualTaskInput } from "@/modules/tasks/task.schemas";

type AddTaskModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: CreateManualTaskInput) => Promise<void>;
  scheduledDate?: string;
  goals?: Array<{ _id: string; title: string }>;
};

export default function AddTaskModal({
  isOpen,
  onClose,
  onSubmit,
  scheduledDate,
  goals = [],
}: AddTaskModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateManualTaskInput>({
    goalId: "",
    title: "",
    description: "",
    scheduledDate: scheduledDate || new Date().toISOString().split("T")[0],
    priority: "medium" as const,
    estimatedMinutes: 30,
  });

  useEffect(() => {
    if (scheduledDate) {
      setFormData((prev) => ({ ...prev, scheduledDate }));
    }
  }, [scheduledDate]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!formData.goalId) {
        throw new Error("Please select a goal");
      }
      if (!formData.title.trim()) {
        throw new Error("Please enter a task title");
      }

      await onSubmit(formData);
      setFormData({
        goalId: "",
        title: "",
        description: "",
        scheduledDate: scheduledDate || new Date().toISOString().split("T")[0],
        priority: "medium",
        estimatedMinutes: 30,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50 px-0 sm:items-center sm:px-4">
      <div className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white pb-[max(env(safe-area-inset-bottom),1rem)] shadow-2xl sm:mx-auto sm:max-w-lg sm:rounded-3xl sm:pb-0">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Add Task</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Goal Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Goal <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.goalId}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, goalId: e.target.value }))
              }
              className="mt-1 h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100"
              disabled={loading}
            >
              <option value="">Select a goal...</option>
              {goals.map((goal) => (
                <option key={goal._id} value={goal._id}>
                  {goal.title}
                </option>
              ))}
            </select>
          </div>

          {/* Task Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Task <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="What do you need to do?"
              className="mt-1 h-12 w-full rounded-2xl border border-slate-300 px-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100"
              maxLength={200}
              disabled={loading}
            />
            <p className="mt-1 text-xs text-slate-500">
              {formData.title.length}/200
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Add more details (optional)"
              className="mt-1 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100"
              rows={2}
              maxLength={2000}
              disabled={loading}
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.scheduledDate}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  scheduledDate: e.target.value,
                }))
              }
              className="mt-1 h-12 w-full rounded-2xl border border-slate-300 px-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100"
              disabled={loading}
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  priority: e.target.value as "low" | "medium" | "high",
                }))
              }
              className="mt-1 h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100"
              disabled={loading}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* Estimated Time */}
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Estimated Time (minutes)
            </label>
            <input
              type="number"
              min="5"
              max="480"
              step="5"
              value={formData.estimatedMinutes}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  estimatedMinutes: parseInt(e.target.value, 10),
                }))
              }
              className="mt-1 h-12 w-full rounded-2xl border border-slate-300 px-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100"
              disabled={loading}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-12 flex-1 rounded-2xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-12 flex-1 rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
