"use client";

import { useMemo, useState } from "react";
import { Upload, X } from "lucide-react";
import {
  TASK_SPREADSHEET_ACCEPT,
  TASK_SPREADSHEET_HELP_TEXT,
} from "@/modules/tasks/task-spreadsheet";
import { Alert } from "@/components/ui";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onImported: () => Promise<void>;
  goals: Array<{ _id: string; title: string }>;
};

export default function ExcelUploadModal({
  isOpen,
  onClose,
  onImported,
  goals,
}: Props) {
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [goalId, setGoalId] = useState("");
  const [scheduledDate, setScheduledDate] = useState(today);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!goalId) {
      setError("Please select a goal");
      return;
    }
    if (!file) {
      setError("Please choose an Excel file");
      return;
    }

    setLoading(true);
    try {
      const form = new FormData();
      form.set("goalId", goalId);
      form.set("date", scheduledDate);
      form.set("file", file);

      const res = await fetch("/api/v1/tasks/import-excel", {
        method: "POST",
        body: form,
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          json?.error?.message || json?.message || "Failed to import Excel"
        );
      }

      const imported = json?.data?.imported ?? 0;
      const skipped = json?.data?.skipped ?? 0;
      setResult(`Imported ${imported} tasks${skipped ? `, skipped ${skipped}` : ""}.`);
      await onImported();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import Excel");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50 px-0 sm:items-center sm:px-4">
      <div className="max-h-[92dvh] w-full overflow-y-auto rounded-t-container bg-surface pb-[max(env(safe-area-inset-bottom),1rem)] shadow-[var(--shadow-md)] sm:mx-auto sm:max-w-lg sm:rounded-container sm:pb-0">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface px-4 py-4">
          <h2 className="text-lg font-semibold text-text-primary">
            Upload Excel
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-control p-2 text-text-muted hover:bg-surface-subtle hover:text-text-primary"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          {error && <Alert tone="error">{error}</Alert>}
          {result && <Alert tone="success">{result}</Alert>}

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Goal <span className="text-red-500">*</span>
            </label>
            <select
              value={goalId}
              onChange={(e) => setGoalId(e.target.value)}
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

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Default date
            </label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="mt-1 h-12 w-full rounded-2xl border border-slate-300 px-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Excel file <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              accept={TASK_SPREADSHEET_ACCEPT}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="mt-1 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm file:mr-3 file:rounded-xl file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-700"
              disabled={loading}
            />
            <p className="mt-1 text-xs text-slate-500">
              {TASK_SPREADSHEET_HELP_TEXT}
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="ui-button h-11 flex-1"
              data-variant="secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="ui-button h-11 flex-1"
              data-variant="primary"
            >
              <Upload className="h-4 w-4" />
              {loading ? "Importing..." : "Import"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
