"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Sparkles, Target } from "lucide-react";
import { useState } from "react";
import AppShell from "@/components/app/AppShell";
import ManualGoalForm from "@/components/goals/ManualGoalForm";
import CourseGoalWizard from "@/components/goals/CourseGoalWizard";
import type { CreateGoalInput } from "@/modules/tasks/task.schemas";

export default function NewGoalPage() {
  const router = useRouter();
  const [flow, setFlow] = useState<"choice" | "manual" | "course">("choice");
  const createGoal = async (goalData: CreateGoalInput) => {
    const res = await fetch("/api/v1/goals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(goalData) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.message || json?.error || "Failed to create goal");
    const id = json?.data?.id ?? json?.id;
    if (!id) throw new Error("Missing goal id");
    router.push(`/dashboard/goals/${id}`);
  };
  return <AppShell eyebrow="Create" title="New goal">
    {flow === "choice" && <section className="mx-auto max-w-5xl">
      <div className="mb-6"><p className="text-sm font-semibold text-brand-primary">A clear next step</p><h2 className="mt-1 text-2xl font-semibold tracking-tight">How would you like to begin?</h2><p className="mt-2 max-w-xl text-sm leading-6 text-text-secondary">Choose the planning mode that fits what you have in mind.</p></div>
      <div className="grid gap-4 md:grid-cols-3">
        <button type="button" onClick={() => setFlow("course")} className="min-h-48 rounded-2xl border border-border bg-surface p-6 text-left hover:border-brand-primary/50 hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-primary-soft text-brand-primary"><BookOpen className="h-5 w-5" /></span><span className="mt-5 block text-lg font-semibold text-text-primary">Complete a Course</span><span className="mt-2 block text-sm leading-6 text-text-secondary">Use a Habitix course as your learning plan.</span><span className="mt-4 block text-sm font-semibold text-brand-primary">Choose a course →</span></button>
        <Link href="/dashboard/goal-chat" className="min-h-48 rounded-2xl border border-border bg-surface p-6 hover:border-brand-primary/50 hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-subtle text-brand-primary"><Sparkles className="h-5 w-5" /></span><span className="mt-5 block text-lg font-semibold text-text-primary">Let AI build my plan</span><span className="mt-2 block text-sm leading-6 text-text-secondary">Describe what you want to achieve and let AI create an editable roadmap.</span><span className="mt-4 block text-sm font-semibold text-brand-primary">Build with AI →</span></Link>
        <button type="button" onClick={() => setFlow("manual")} className="min-h-48 rounded-2xl border border-border bg-surface p-6 text-left hover:border-brand-primary/50 hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-subtle text-text-secondary"><Target className="h-5 w-5" /></span><span className="mt-5 block text-lg font-semibold text-text-primary">I&apos;ll create the plan</span><span className="mt-2 block text-sm leading-6 text-text-secondary">Define your goal and add the tasks yourself.</span><span className="mt-4 block text-sm font-semibold text-brand-primary">Create manually →</span></button>
      </div>
    </section>}
    {flow === "manual" && <section className="mx-auto max-w-3xl"><button type="button" onClick={() => setFlow("choice")} className="mb-4 inline-flex min-h-10 items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary"><ArrowLeft className="h-4 w-4" /> Back to goal type</button><div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><ManualGoalForm onSubmit={createGoal} /></div></section>}
    {flow === "course" && <CourseGoalWizard onCancel={() => setFlow("choice")} />}
  </AppShell>;
}
