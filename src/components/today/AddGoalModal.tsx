"use client";

import { X } from "lucide-react";
import type { CreateGoalInput } from "@/modules/tasks/task.schemas";
import ManualGoalForm from "@/components/goals/ManualGoalForm";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (goal: CreateGoalInput) => Promise<void>;
};

export default function AddGoalModal({ isOpen, onClose, onSubmit }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50 px-0 sm:items-center sm:px-4">
      <div className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white pb-[max(env(safe-area-inset-bottom),1rem)] shadow-2xl sm:mx-auto sm:max-w-lg sm:rounded-3xl sm:pb-0">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Create Goal</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-slate-100" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <ManualGoalForm
          onSubmit={async (goal) => {
            await onSubmit(goal);
            onClose();
          }}
          onCancel={onClose}
          submitLabel="Create Goal"
          className="p-4"
        />
      </div>
    </div>
  );
}
