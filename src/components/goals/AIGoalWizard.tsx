"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, LoaderCircle, Sparkles } from "lucide-react";
import { dateKeyInTimezone, scheduleRoadmapTasks } from "@/lib/goals/goal-scheduling";

type GeneratedTask = { title: string; isCompleted?: boolean };
type GeneratedDay = {
  dayNumber: number;
  dayDate?: string;
  unlocked?: boolean;
  completed?: boolean;
  tasks: GeneratedTask[];
};

type Props = { onCancel: () => void };

function dateKeyTimestamp(dateKey: string) {
  return Date.parse(`${dateKey}T00:00:00Z`);
}

function formatCalendarDate(dateKey: string) {
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default function AIGoalWizard({ onCancel }: Props) {
  const router = useRouter();
  const timezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", []);
  const now = useMemo(() => new Date(), []);
  const today = useMemo(() => dateKeyInTimezone(now, timezone), [now, timezone]);
  const [step, setStep] = useState<"setup" | "review">("setup");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [hoursPerDay, setHoursPerDay] = useState(1);
  const [daysPerWeek, setDaysPerWeek] = useState(5);
  const [preferredTime, setPreferredTime] = useState("morning");
  const [motivation, setMotivation] = useState("");
  const [existingKnowledge, setExistingKnowledge] = useState("");
  const [roadmap, setRoadmap] = useState<GeneratedDay[]>([]);
  const [generatedFor, setGeneratedFor] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputClass = "min-h-12 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10";
  const taskCount = roadmap.reduce((sum, day) => sum + day.tasks.length, 0);
  const currentGenerationSettings = JSON.stringify({
    title: title.trim(),
    description: description.trim(),
    targetDate,
    hoursPerDay,
    daysPerWeek,
    preferredTime,
    motivation: motivation.trim(),
    existingKnowledge: existingKnowledge.trim(),
  });
  const canReviewExistingPlan = taskCount > 0 && generatedFor === currentGenerationSettings;

  async function generatePlan(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setError(null);

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError("Enter the goal you want to achieve.");
      setStep("setup");
      return;
    }
    if (!targetDate || dateKeyTimestamp(targetDate) < dateKeyTimestamp(today)) {
      setError("Choose a target date that is today or later.");
      setStep("setup");
      return;
    }

    const targetTimestamp = dateKeyTimestamp(targetDate);
    if (!Number.isFinite(targetTimestamp) || new Date(targetTimestamp).toISOString().slice(0, 10) !== targetDate) {
      setError("Choose a valid target date.");
      setStep("setup");
      return;
    }

    setGenerating(true);
    const planningDays = Math.max(
      1,
      Math.floor((targetTimestamp - dateKeyTimestamp(today)) / 86_400_000) + 1
    );
    const contextForGeneration = [description.trim(), existingKnowledge.trim(), motivation.trim()]
      .filter(Boolean)
      .join("\n");

    try {
      const response = await fetch("/api/v1/goals/generate-roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: cleanTitle,
          objective: cleanTitle,
          duration: `${planningDays} days`,
          hoursPerDay,
          daysPerWeek,
          preferredTime,
          motivation: contextForGeneration || undefined,
          existingKnowledge: existingKnowledge.trim() || undefined,
          additionalRequirements: description.trim() || undefined,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) {
        throw new Error(payload?.error?.message || "We couldn't generate your plan. Please try again.");
      }

      const generated = payload?.data?.roadmap;
      const executableDays = Array.isArray(generated)
        ? generated.filter((day: GeneratedDay) => Array.isArray(day.tasks) && day.tasks.length > 0)
        : [];
      const generatedTaskCount = executableDays.reduce(
        (sum: number, day: GeneratedDay) => sum + day.tasks.length,
        0
      );
      if (generatedTaskCount === 0) {
        throw new Error("The generated plan had no executable tasks. Try generating it again.");
      }

      const scheduledRoadmap = scheduleRoadmapTasks<GeneratedTask>(executableDays, {
        targetDate,
        daysPerWeek,
        timezone,
        now,
      });
      if (scheduledRoadmap.length === 0) {
        throw new Error("There are no selected study days between today and your target date. Adjust your target date or study frequency and try again.");
      }
      setRoadmap(scheduledRoadmap);
      setGeneratedFor(currentGenerationSettings);
      setStep("review");
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : "We couldn't generate your plan. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  async function createGoal() {
    if (roadmap.length === 0 || taskCount === 0) {
      setError("Generate a plan with at least one task before creating this goal.");
      return;
    }

    setCreating(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planSource: "ai",
          title: title.trim(),
          description: description.trim() || undefined,
          targetDate,
          timezone,
          hoursPerDay,
          daysPerWeek,
          preferredTime,
          motivation: motivation.trim() || undefined,
          roadmap,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) {
        throw new Error(payload?.error?.message || "We couldn't create your goal. Please try again.");
      }
      const goalId = payload?.data?.id;
      if (!goalId) throw new Error("The Goal was created but its ID was missing from the response.");
      router.push(`/goals/${goalId}`);
    } catch (creationError) {
      setError(creationError instanceof Error ? creationError.message : "We couldn't create your goal. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <section className="mx-auto max-w-3xl">
      <button
        type="button"
        onClick={step === "review" ? () => { setError(null); setStep("setup"); } : onCancel}
        disabled={generating || creating}
        className="mb-4 inline-flex min-h-10 items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        {step === "review" ? "Back to setup" : "Back to goal type"}
      </button>

      {step === "setup" ? (
        <form onSubmit={(event) => void generatePlan(event)} className="space-y-5 rounded-3xl border border-border bg-white p-5 shadow-sm sm:p-7">
          <div>
            <p className="text-sm font-semibold text-brand-primary">AI Goal Plan</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-text-primary">What do you want to achieve?</h2>
            <p className="mt-2 text-sm leading-6 text-text-secondary">Set an outcome and target date. Habitix will draft an executable plan for you to review.</p>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-semibold">Goal title / desired outcome <span className="text-brand-primary">*</span></span>
            <input required maxLength={200} disabled={generating} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Prepare for a frontend engineering interview" className={inputClass} />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-semibold">Description or context <span className="font-normal text-text-muted">Optional</span></span>
            <textarea maxLength={2000} disabled={generating} value={description} onChange={(event) => setDescription(event.target.value)} rows={3} className={inputClass} placeholder="Add details that help define success." />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-semibold">Target date <span className="text-brand-primary">*</span></span>
              <span className="relative block"><CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" /><input required type="date" min={today} disabled={generating} value={targetDate} onChange={(event) => setTargetDate(event.target.value)} className={`${inputClass} pl-10`} /></span>
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-semibold">Hours per day</span>
              <select value={hoursPerDay} disabled={generating} onChange={(event) => setHoursPerDay(Number(event.target.value))} className={inputClass}>{[0.5, 1, 1.5, 2, 3, 4].map((hours) => <option key={hours} value={hours}>{hours} {hours === 1 ? "hour" : "hours"}</option>)}</select>
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-semibold">Days per week</span>
              <select value={daysPerWeek} disabled={generating} onChange={(event) => setDaysPerWeek(Number(event.target.value))} className={inputClass}>{[1, 2, 3, 4, 5, 6, 7].map((days) => <option key={days} value={days}>{days} days</option>)}</select>
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-semibold">Preferred time</span>
              <select value={preferredTime} disabled={generating} onChange={(event) => setPreferredTime(event.target.value)} className={inputClass}><option value="morning">Morning</option><option value="afternoon">Afternoon</option><option value="evening">Evening</option></select>
            </label>
          </div>
          <label className="block space-y-2">
            <span className="text-sm font-semibold">What do you already know? <span className="font-normal text-text-muted">Optional</span></span>
            <textarea maxLength={2000} disabled={generating} value={existingKnowledge} onChange={(event) => setExistingKnowledge(event.target.value)} rows={2} className={inputClass} placeholder="Share relevant experience or knowledge." />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-semibold">Motivation <span className="font-normal text-text-muted">Optional</span></span>
            <textarea maxLength={2000} disabled={generating} value={motivation} onChange={(event) => setMotivation(event.target.value)} rows={2} className={inputClass} placeholder="Why does this goal matter to you?" />
          </label>

          {error && <p className="rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error" role="alert">{error}</p>}
          <div className="flex flex-col gap-2 sm:flex-row">
            <button type="submit" disabled={generating} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-primary px-5 text-sm font-semibold text-white disabled:opacity-60">
              {generating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {generating ? "Generating plan…" : "Generate plan"}
            </button>
            {canReviewExistingPlan && <button type="button" onClick={() => { setError(null); setStep("review"); }} disabled={generating} className="min-h-12 rounded-xl border border-border px-5 text-sm font-semibold text-text-secondary disabled:opacity-60">Review generated plan</button>}
          </div>
        </form>
      ) : (
        <div className="space-y-5 rounded-3xl border border-border bg-white p-5 shadow-sm sm:p-7">
          <div>
            <p className="text-sm font-semibold text-brand-primary">Review your plan</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-text-primary">{title}</h2>
            {description.trim() && <p className="mt-2 whitespace-pre-line text-sm leading-6 text-text-secondary">{description}</p>}
            <dl className="mt-4 grid gap-3 rounded-2xl bg-surface p-4 text-sm sm:grid-cols-2">
              <div><dt className="text-text-muted">Target date</dt><dd className="mt-0.5 font-medium text-text-primary">{targetDate}</dd></div>
              <div><dt className="text-text-muted">Schedule</dt><dd className="mt-0.5 font-medium text-text-primary">{hoursPerDay} {hoursPerDay === 1 ? "hour" : "hours"}/day · {daysPerWeek} days/week · {preferredTime}</dd></div>
              <div><dt className="text-text-muted">Plan length</dt><dd className="mt-0.5 font-medium text-text-primary">{roadmap.length} days · {taskCount} tasks</dd></div>
              {existingKnowledge.trim() && <div><dt className="text-text-muted">Existing knowledge</dt><dd className="mt-0.5 whitespace-pre-line font-medium text-text-primary">{existingKnowledge}</dd></div>}
              {motivation.trim() && <div><dt className="text-text-muted">Motivation</dt><dd className="mt-0.5 whitespace-pre-line font-medium text-text-primary">{motivation}</dd></div>}
            </dl>
          </div>

          {error && <p className="rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error" role="alert">{error}</p>}
          <div className="space-y-3">
            {roadmap.map((day) => (
              <article key={`${day.dayNumber}-${day.dayDate}`} className="rounded-2xl border border-border bg-surface p-5">
                <div className="flex items-center justify-between gap-3"><h3 className="font-semibold text-text-primary">Day {day.dayNumber} · {formatCalendarDate(day.dayDate ?? "")}</h3><time className="text-xs text-text-muted" dateTime={day.dayDate}>{day.dayDate}</time></div>
                <ul className="mt-3 space-y-3">{day.tasks.map((task, index) => <li key={`${day.dayNumber}-${index}`} className="border-t border-border pt-3 text-sm leading-6 text-text-secondary">{task.title}</li>)}</ul>
              </article>
            ))}
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => void generatePlan()} disabled={generating || creating} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border px-5 text-sm font-semibold text-text-secondary disabled:opacity-60">
              {generating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {generating ? "Regenerating…" : "Regenerate"}
            </button>
            <button type="button" onClick={() => void createGoal()} disabled={creating || generating} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-primary px-5 text-sm font-semibold text-white disabled:opacity-60">
              {creating && <LoaderCircle className="h-4 w-4 animate-spin" />}
              {creating ? "Creating Goal…" : "Create Goal"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
