"use client";

import { useMemo, useState } from "react";
import type { CreateGoalInput } from "@/modules/tasks/task.schemas";

type Props = {
  onSubmit: (goal: CreateGoalInput) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  className?: string;
};

const defaultForm = (): CreateGoalInput => ({
  title: "",
  description: "",
  targetDate: "",
  hoursPerDay: 1,
  preferredTime: "morning",
  daysPerWeek: 5,
  motivation: "",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  roadmap: undefined,
});

function trimOrUndefined(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export default function ManualGoalForm({
  onSubmit,
  onCancel,
  submitLabel = "Create goal",
  cancelLabel = "Cancel",
  className = "",
}: Props) {
  const [form, setForm] = useState<CreateGoalInput>(() => defaultForm());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const title = form.title.trim();
    if (!title) {
      setError("Title is required");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        title,
        description: trimOrUndefined(form.description),
        targetDate: trimOrUndefined(form.targetDate),
        hoursPerDay: Number(form.hoursPerDay),
        preferredTime: form.preferredTime || "morning",
        daysPerWeek: Number(form.daysPerWeek),
        motivation: trimOrUndefined(form.motivation),
        timezone: form.timezone || "UTC",
        roadmap: undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create goal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-5 ${className}`}>
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-slate-700">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Interview preparation"
          className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          disabled={loading}
          autoFocus
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-slate-700">
          Description
        </label>
        <textarea
          name="description"
          value={form.description ?? ""}
          onChange={handleChange}
          placeholder="What does success look like?"
          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          rows={3}
          disabled={loading}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">
            Target date
          </label>
          <input
            name="targetDate"
            type="date"
            min={today}
            value={form.targetDate ?? ""}
            onChange={handleChange}
            className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            disabled={loading}
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">
            Hours / day
          </label>
          <input
            name="hoursPerDay"
            type="number"
            value={String(form.hoursPerDay)}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                hoursPerDay: Number(e.target.value),
              }))
            }
            className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            disabled={loading}
            min={0.5}
            max={24}
            step={0.5}
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">
            Days / week
          </label>
          <input
            name="daysPerWeek"
            type="number"
            value={String(form.daysPerWeek)}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                daysPerWeek: Number(e.target.value),
              }))
            }
            className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            disabled={loading}
            min={1}
            max={7}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-slate-700">
          Preferred time
        </label>
        <select
          name="preferredTime"
          value={form.preferredTime}
          onChange={handleChange}
          className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          disabled={loading}
        >
          <option value="morning">Morning</option>
          <option value="afternoon">Afternoon</option>
          <option value="evening">Evening</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-slate-700">
          Motivation
        </label>
        <textarea
          name="motivation"
          value={form.motivation ?? ""}
          onChange={handleChange}
          placeholder="Why does this matter right now?"
          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          rows={2}
          disabled={loading}
        />
      </div>

      <div className="flex gap-2 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="h-12 flex-1 rounded-2xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {cancelLabel}
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="h-12 flex-1 rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? "Creating..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
