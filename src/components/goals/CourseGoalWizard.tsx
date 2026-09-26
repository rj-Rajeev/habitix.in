"use client";

import { useEffect, useMemo, useState } from "react";
import type React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Check, LoaderCircle, LockKeyhole, Sparkles } from "lucide-react";
import { enrollInCourse } from "@/lib/courses/enroll-client";

type CourseSummary = {
  _id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  price: number;
  thumbnail?: string;
};
type CourseModule = { _id: string; title: string; lessons: Array<{ _id: string; moduleId: string; title: string }> };
type CourseContext = { course: CourseSummary; modules: CourseModule[] };
type AccessStatus = "checking" | "ready" | "required" | "error";
type RoadmapTask = { title: string; courseLessonId: string; lessonTitle?: string };
type RoadmapDay = { dayNumber: number; dayDate: string; tasks: RoadmapTask[] };

const timeOptions = [
  { label: "30 minutes", hours: 0.5 },
  { label: "1 hour", hours: 1 },
  { label: "1.5 hours", hours: 1.5 },
  { label: "2 hours", hours: 2 },
  { label: "3+ hours", hours: 3 },
];
const levels = [
  { value: "beginner", label: "Beginner" },
  { value: "some_knowledge", label: "Some knowledge" },
  { value: "comfortable", label: "Comfortable" },
];
const preferences = [
  { value: "finish_course", label: "Finish the course" },
  { value: "understand_deeply", label: "Understand deeply" },
  { value: "interview_prep", label: "Prepare for interviews" },
  { value: "learn_practice", label: "Learn + practice" },
  { value: "build_something", label: "Build something" },
];

async function responseData<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success === false) throw new Error("Request failed");
  return (payload?.data ?? payload) as T;
}

function todayKey() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function CourseGoalWizard({ onCancel }: { onCancel: () => void }) {
  const router = useRouter();
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [courseLoadError, setCourseLoadError] = useState("");
  const [course, setCourse] = useState<CourseSummary | null>(null);
  const [courseContext, setCourseContext] = useState<CourseContext | null>(null);
  const [accessStatus, setAccessStatus] = useState<AccessStatus>("checking");
  const [accessError, setAccessError] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [step, setStep] = useState<"course" | "requirements" | "review">("course");
  const [objective, setObjective] = useState("");
  const [currentLevel, setCurrentLevel] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [hoursPerDay, setHoursPerDay] = useState(1);
  const [existingKnowledge, setExistingKnowledge] = useState("");
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [learningPreference, setLearningPreference] = useState("learn_practice");
  const [additionalRequirements, setAdditionalRequirements] = useState("");
  const [daysPerWeek, setDaysPerWeek] = useState(5);
  const [preferredTime, setPreferredTime] = useState("morning");
  const [roadmap, setRoadmap] = useState<RoadmapDay[]>([]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setCoursesLoading(true);
    setCourseLoadError("");
    void fetch("/api/courses")
      .then((response) => responseData<CourseSummary[]>(response))
      .then((result) => { if (active) setCourses(result); })
      .catch(() => { if (active) setCourseLoadError("We couldn't load courses. Please try again."); })
      .finally(() => { if (active) setCoursesLoading(false); });
    return () => { active = false; };
  }, []);

  const totalLessons = useMemo(
    () => courseContext?.modules.reduce((total, module) => total + module.lessons.length, 0) ?? 0,
    [courseContext]
  );
  const lessonLookup = useMemo(() => {
    const result = new Map<string, { title: string; moduleTitle: string }>();
    courseContext?.modules.forEach((module) => module.lessons.forEach((lesson) => {
      result.set(lesson._id, { title: lesson.title, moduleTitle: module.title });
    }));
    return result;
  }, [courseContext]);

  async function selectCourse(selected: CourseSummary) {
    setCourse(selected);
    setCourseContext(null);
    setAccessStatus("checking");
    setAccessError("");
    setError("");
    setStep("course");
    try {
      const [contextResponse, enrollmentResponse] = await Promise.all([
        fetch(`/api/courses/${encodeURIComponent(selected.slug)}`),
        fetch(`/api/courses/${selected._id}/enrollment`),
      ]);
      const [context, enrollment] = await Promise.all([
        responseData<CourseContext>(contextResponse),
        responseData<{ enrolled: boolean; status?: string; paymentStatus?: string }>(enrollmentResponse),
      ]);
      setCourseContext(context);
      const canContinue = selected.price === 0 || (
        enrollment.enrolled && enrollment.status === "active" && enrollment.paymentStatus === "paid"
      );
      setAccessStatus(canContinue ? "ready" : "required");
      if (!canContinue) setAccessError("This course is required for your learning goal. Enroll in this course to continue.");
    } catch {
      setAccessStatus("error");
      setAccessError("We couldn't verify access to this course. Please try again.");
    }
  }

  async function refreshAccess() {
    if (!course) return false;
    try {
      const response = await fetch(`/api/courses/${course._id}/enrollment`);
      const enrollment = await responseData<{ enrolled: boolean; status?: string; paymentStatus?: string }>(response);
      const canContinue = course.price === 0 || (
        enrollment.enrolled && enrollment.status === "active" && enrollment.paymentStatus === "paid"
      );
      setAccessStatus(canContinue ? "ready" : "required");
      if (!canContinue) setAccessError("You need access to this course before creating a learning goal.");
      else setAccessError("");
      return canContinue;
    } catch {
      setAccessStatus("error");
      setAccessError("We couldn't verify your course access. Please try again.");
      return false;
    }
  }

  async function handleEnroll() {
    if (!course) return;
    setEnrolling(true);
    setAccessError("");
    try {
      await enrollInCourse(course._id, course.title);
      if (!(await refreshAccess())) {
        setAccessError("Payment was received, but course access is not active yet. Please try again shortly.");
      }
    } catch {
      if (!(await refreshAccess())) setAccessError("Enrollment couldn't be completed. Please try again.");
    } finally {
      setEnrolling(false);
    }
  }

  async function generatePlan(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!course) {
      setError("Please choose a course.");
      return;
    }
    if (accessStatus !== "ready") {
      setError("You need access to this course before creating a learning goal.");
      return;
    }
    if (!objective.trim()) {
      setError("Tell us what you want to achieve.");
      return;
    }
    if (!levels.some((level) => level.value === currentLevel)) {
      setError("Choose your current level.");
      return;
    }
    const targetTimestamp = /^\d{4}-\d{2}-\d{2}$/.test(targetDate)
      ? Date.parse(`${targetDate}T00:00:00Z`)
      : Number.NaN;
    const todayTimestamp = Date.parse(`${todayKey()}T00:00:00Z`);
    if (!Number.isFinite(targetTimestamp) || new Date(targetTimestamp).toISOString().slice(0, 10) !== targetDate || targetTimestamp < todayTimestamp) {
      setError("Choose a valid target date that is today or later.");
      return;
    }
    if (!timeOptions.some((option) => option.hours === hoursPerDay)) {
      setError("Choose how much time you have each day.");
      return;
    }
    if (!preferences.some((preference) => preference.value === learningPreference)) {
      setError("Choose a learning preference.");
      return;
    }
    setError("");
    setGenerating(true);
    const days = Math.max(1, Math.ceil((targetTimestamp - todayTimestamp) / 86400000));
    try {
      const response = await fetch("/api/v1/goals/generate-roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planSource: "course",
          courseId: course._id,
          title: objective.trim(),
          objective: objective.trim(),
          duration: `${days} days`,
          hoursPerDay,
          daysPerWeek,
          preferredTime,
          motivation: additionalRequirements.trim() || undefined,
          currentLevel,
          existingKnowledge: existingKnowledge.trim() || undefined,
          focusAreas,
          learningPreference,
          additionalRequirements: additionalRequirements.trim() || undefined,
        }),
      });
      const result = await responseData<{ roadmap: Array<{ dayNumber: number; tasks: Array<{ title: string; courseLessonId: string; lessonTitle?: string }> }> }>(response);
      const startDate = new Date(`${todayKey()}T00:00:00`);
      setRoadmap(result.roadmap.map((day, index) => {
        const dayDate = new Date(startDate);
        dayDate.setDate(dayDate.getDate() + index);
        return { ...day, dayDate: localDateKey(dayDate) };
      }));
      setStep("review");
    } catch {
      setError("We couldn't create your learning plan right now. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  async function createGoal() {
    if (!course || !roadmap.length || accessStatus !== "ready") return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/v1/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course._id,
          title: objective.trim().slice(0, 200),
          description: `Learning goal based on ${course.title}. ${objective.trim()}`.slice(0, 2000),
          targetDate,
          hoursPerDay,
          daysPerWeek,
          preferredTime,
          motivation: [
            currentLevel ? `Current level: ${levels.find((item) => item.value === currentLevel)?.label}` : "",
            existingKnowledge.trim() ? `Already know: ${existingKnowledge.trim()}` : "",
            `Learning preference: ${preferences.find((item) => item.value === learningPreference)?.label}`,
            additionalRequirements.trim(),
          ].filter(Boolean).join("\n").slice(0, 2000),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
          roadmap,
        }),
      });
      const result = await responseData<{ id: string }>(response);
      if (!result.id) throw new Error("Missing goal id");
      router.push(`/dashboard/goals/${result.id}`);
    } catch {
      setError("We couldn't create your goal. Your learning plan is still available to review.");
    } finally {
      setSaving(false);
    }
  }

  function back() {
    setError("");
    if (step === "review") setStep("requirements");
    else if (step === "requirements") setStep("course");
    else if (course) {
      setCourse(null);
      setCourseContext(null);
      setAccessStatus("checking");
    } else onCancel();
  }

  const inputClass = "min-h-12 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10";

  if (step === "course" && !course) {
    return <section className="mx-auto max-w-4xl">
      <button type="button" onClick={onCancel} className="mb-5 inline-flex min-h-10 items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary"><ArrowLeft className="h-4 w-4" /> Back to goal type</button>
      <div className="mb-6"><p className="text-sm font-semibold text-brand-primary">Learn from a course</p><h2 className="mt-1 text-2xl font-semibold tracking-tight">Choose a course for your goal</h2><p className="mt-2 text-sm leading-6 text-text-secondary">Habitix will shape a learning plan around the course and what you want to achieve.</p></div>
      {courseLoadError && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{courseLoadError} <button type="button" onClick={() => { setCoursesLoading(true); setCourseLoadError(""); void fetch("/api/courses").then((response) => responseData<CourseSummary[]>(response)).then(setCourses).catch(() => setCourseLoadError("We couldn't load courses. Please try again.")).finally(() => setCoursesLoading(false)); }} className="ml-1 font-semibold underline">Retry</button></div>}
      {coursesLoading ? <div className="flex min-h-40 items-center justify-center rounded-2xl border border-border bg-surface text-sm text-text-secondary"><LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Loading courses</div> : courses.length === 0 ? <div className="rounded-2xl border border-border bg-surface p-6 text-sm text-text-secondary">There are no published courses available yet.</div> : <div className="grid gap-3 sm:grid-cols-2">{courses.map((item) => <button key={item._id} type="button" onClick={() => void selectCourse(item)} className="min-h-40 rounded-2xl border border-border bg-surface p-5 text-left transition hover:border-brand-primary/50 hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"><span className="flex items-start justify-between gap-3"><span className="min-w-0"><span className="block text-base font-semibold text-text-primary">{item.title}</span><span className="mt-2 line-clamp-3 block text-sm leading-5 text-text-secondary">{item.shortDescription}</span></span><span className="shrink-0 rounded-full bg-surface-subtle px-2.5 py-1 text-xs font-semibold text-text-secondary">{item.price === 0 ? "Free" : `₹${item.price}`}</span></span><span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-primary">Select course <span aria-hidden="true">→</span></span></button>)}</div>}
    </section>;
  }

  if (!course) return null;

  return <section className="mx-auto max-w-3xl">
    <button type="button" onClick={back} disabled={generating || saving || enrolling} className="mb-5 inline-flex min-h-10 items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary disabled:opacity-50"><ArrowLeft className="h-4 w-4" /> Back</button>
    <div className="mb-6 flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-primary-soft text-brand-primary"><BookOpen className="h-5 w-5" /></span><div><p className="text-sm font-semibold text-brand-primary">Learn from a course</p><h2 className="text-2xl font-semibold tracking-tight">{step === "course" ? "Course access" : step === "requirements" ? "Shape your learning goal" : "Review your learning plan"}</h2></div></div>

    {step === "course" && <>
      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <p className="text-lg font-semibold text-text-primary">{course.title}</p>
        <p className="mt-2 text-sm leading-6 text-text-secondary">{course.shortDescription}</p>
        {courseContext && <div className="mt-5 border-t border-border pt-4"><p className="text-sm font-medium text-text-primary">{courseContext.modules.length} {courseContext.modules.length === 1 ? "module" : "modules"} · {totalLessons} {totalLessons === 1 ? "lesson" : "lessons"}</p><p className="mt-1 text-sm leading-6 text-text-secondary">{course.description}</p><div className="mt-4 flex flex-wrap gap-2">{courseContext.modules.map((module) => <span key={module._id} className="rounded-full bg-surface-subtle px-3 py-1.5 text-xs text-text-secondary">{module.title}</span>)}</div></div>}
      </div>
      {accessStatus === "checking" && <p className="mt-4 flex items-center gap-2 text-sm text-text-secondary" role="status"><LoaderCircle className="h-4 w-4 animate-spin" /> Checking course access</p>}
      {accessError && <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-5 text-amber-900" role="alert">{accessError}</p>}
      {accessStatus === "required" && <div className="mt-5 rounded-2xl border border-border bg-surface p-5"><div className="flex items-start gap-3"><LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-text-secondary" /><div><h3 className="font-semibold">Enrollment required</h3><p className="mt-1 text-sm leading-6 text-text-secondary">This course is required for your learning goal. Enroll in this course to continue.</p><button type="button" onClick={() => void handleEnroll()} disabled={enrolling} className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 text-sm font-semibold text-white disabled:opacity-60">{enrolling && <LoaderCircle className="h-4 w-4 animate-spin" />}{enrolling ? "Preparing enrollment…" : `Enroll · ₹${course.price}`}</button></div></div></div>}
      {accessStatus === "error" && <button type="button" onClick={() => void selectCourse(course)} className="mt-4 min-h-11 rounded-xl border border-border bg-surface px-4 text-sm font-semibold">Check access again</button>}
      {accessStatus === "ready" && <button type="button" onClick={() => { setStep("requirements"); setError(""); }} disabled={!courseContext} className="mt-5 min-h-12 w-full rounded-xl bg-brand-primary px-5 text-sm font-semibold text-white disabled:opacity-50 sm:w-auto">Continue</button>}
    </>}

    {step === "requirements" && <>
      {generating && <div className="mb-4 rounded-2xl border border-brand-primary/20 bg-brand-primary-soft p-5" role="status"><div className="flex items-center gap-3"><LoaderCircle className="h-5 w-5 animate-spin text-brand-primary" /><div><p className="text-sm font-semibold text-text-primary">Building your learning plan</p><p className="mt-1 text-sm text-text-secondary">We're organizing the course around your goal, available time, and target date.</p></div></div><div className="mt-5 space-y-2"><div className="h-2 animate-pulse rounded-full bg-white/80" /><div className="h-2 w-4/5 animate-pulse rounded-full bg-white/80" /><div className="h-2 w-3/5 animate-pulse rounded-full bg-white/80" /></div></div>}
      <form onSubmit={(event) => void generatePlan(event)} className="space-y-6 rounded-2xl border border-border bg-surface p-5 sm:p-7">
      <div className="rounded-xl bg-surface-subtle px-4 py-3"><p className="text-sm font-semibold">{course.title}</p><p className="mt-1 text-xs text-text-secondary">{courseContext?.modules.length ?? 0} modules · {totalLessons} lessons</p></div>
      <label className="block space-y-2"><span className="text-sm font-semibold">What do you want to achieve? <span className="text-brand-primary">*</span></span><textarea maxLength={2000} value={objective} onChange={(event) => setObjective(event.target.value)} placeholder="I want to learn this subject well enough to confidently use it in my work." rows={4} className={inputClass} /></label>
      <fieldset className="space-y-2"><legend className="mb-2 text-sm font-semibold">Your current level <span className="text-brand-primary">*</span></legend><div className="grid grid-cols-1 gap-2 sm:grid-cols-3">{levels.map((level) => <label key={level.value} className={`flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border px-3 text-sm ${currentLevel === level.value ? "border-brand-primary bg-brand-primary-soft text-brand-primary" : "border-border bg-surface text-text-secondary"}`}><input type="radio" name="currentLevel" value={level.value} checked={currentLevel === level.value} onChange={(event) => setCurrentLevel(event.target.value)} className="accent-teal-700" />{level.label}</label>)}</div></fieldset>
      <div className="grid gap-5 sm:grid-cols-2"><label className="block space-y-2"><span className="text-sm font-semibold">Target date <span className="text-brand-primary">*</span></span><input type="date" min={todayKey()} value={targetDate} onChange={(event) => setTargetDate(event.target.value)} className={inputClass} /></label><fieldset className="space-y-2"><legend className="text-sm font-semibold">Time available per day <span className="text-brand-primary">*</span></legend><div className="flex flex-wrap gap-2">{timeOptions.map((option) => <button key={option.hours} type="button" aria-pressed={hoursPerDay === option.hours} onClick={() => setHoursPerDay(option.hours)} className={`min-h-10 rounded-xl border px-3 text-sm ${hoursPerDay === option.hours ? "border-brand-primary bg-brand-primary-soft font-semibold text-brand-primary" : "border-border bg-surface text-text-secondary"}`}>{option.label}</button>)}</div></fieldset></div>
      <label className="block space-y-2"><span className="text-sm font-semibold">What do you already know? <span className="font-normal text-text-muted">Optional</span></span><textarea maxLength={2000} value={existingKnowledge} onChange={(event) => setExistingKnowledge(event.target.value)} placeholder="I already know the fundamentals and have tried a few projects." rows={2} className={inputClass} /></label>
      {Boolean(courseContext?.modules.length) && <fieldset className="space-y-2"><legend className="text-sm font-semibold">Main focus <span className="font-normal text-text-muted">Optional</span></legend><p className="text-xs text-text-secondary">Choose areas from this course that matter most to you.</p><div className="grid gap-2 sm:grid-cols-2">{courseContext?.modules.map((module) => <label key={module._id} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-border px-3 text-sm text-text-secondary"><input type="checkbox" checked={focusAreas.includes(module._id)} onChange={(event) => setFocusAreas((current) => event.target.checked ? [...current, module._id] : current.filter((item) => item !== module._id))} className="accent-teal-700" />{module.title}</label>)}</div></fieldset>}
      <label className="block space-y-2"><span className="text-sm font-semibold">Learning preference</span><select value={learningPreference} onChange={(event) => setLearningPreference(event.target.value)} className={inputClass}>{preferences.map((preference) => <option key={preference.value} value={preference.value}>{preference.label}</option>)}</select></label>
      <label className="block space-y-2"><span className="text-sm font-semibold">Additional requirements <span className="font-normal text-text-muted">Optional</span></span><textarea maxLength={2000} value={additionalRequirements} onChange={(event) => setAdditionalRequirements(event.target.value)} placeholder="I prefer practical examples and time to revise before the target date." rows={2} className={inputClass} /></label>
      <details className="rounded-xl border border-border px-4 py-3"><summary className="cursor-pointer text-sm font-semibold">Your schedule</summary><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="block space-y-2 text-sm"><span>Days per week</span><select value={daysPerWeek} onChange={(event) => setDaysPerWeek(Number(event.target.value))} className={inputClass}>{[1, 2, 3, 4, 5, 6, 7].map((days) => <option key={days} value={days}>{days} days</option>)}</select></label><label className="block space-y-2 text-sm"><span>Preferred time</span><select value={preferredTime} onChange={(event) => setPreferredTime(event.target.value)} className={inputClass}><option value="morning">Morning</option><option value="afternoon">Afternoon</option><option value="evening">Evening</option></select></label></div></details>
      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{error}</p>}
      <button type="submit" disabled={generating || accessStatus !== "ready"} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-primary px-5 text-sm font-semibold text-white disabled:opacity-60"><Sparkles className="h-4 w-4" />{generating ? "Building your learning plan…" : "Build my learning plan"}</button>
      </form>
    </>}

    {step === "review" && <>
      <div className="mb-5 rounded-2xl border border-border bg-surface p-5"><p className="text-xs font-semibold uppercase tracking-wide text-brand-primary">{course.title}</p><p className="mt-2 text-lg font-semibold">{objective}</p><dl className="mt-4 grid gap-3 border-t border-border pt-4 text-sm sm:grid-cols-2"><div><dt className="text-text-muted">Current level</dt><dd className="mt-0.5 font-medium text-text-primary">{levels.find((level) => level.value === currentLevel)?.label}</dd></div><div><dt className="text-text-muted">Target date</dt><dd className="mt-0.5 font-medium text-text-primary">{targetDate}</dd></div><div><dt className="text-text-muted">Time available</dt><dd className="mt-0.5 font-medium text-text-primary">{timeOptions.find((option) => option.hours === hoursPerDay)?.label} per day</dd></div><div><dt className="text-text-muted">Learning preference</dt><dd className="mt-0.5 font-medium text-text-primary">{preferences.find((preference) => preference.value === learningPreference)?.label}</dd></div></dl></div>
      {error && <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{error}</p>}
      <div className="space-y-3">{roadmap.map((day) => <article key={`${day.dayNumber}-${day.dayDate}`} className="rounded-2xl border border-border bg-surface p-5"><div className="flex items-center justify-between gap-3"><h3 className="font-semibold">Day {day.dayNumber}</h3><span className="text-xs text-text-muted">{day.dayDate}</span></div><ul className="mt-3 space-y-3">{day.tasks.map((task, index) => { const linked = lessonLookup.get(task.courseLessonId); return <li key={`${task.courseLessonId}-${index}`} className="flex gap-3 border-t border-border pt-3"><Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" /><div className="min-w-0"><p className="text-sm font-medium text-text-primary">{task.title}</p>{linked && <p className="mt-1 text-xs leading-5 text-text-secondary">{linked.moduleTitle} · {task.lessonTitle || linked.title}</p>}</div></li>; })}</ul></article>)}</div>
      <div className="sticky bottom-20 mt-5 flex flex-col-reverse gap-2 rounded-2xl border border-border bg-background/95 p-3 backdrop-blur sm:static sm:flex-row sm:justify-end sm:border-0 sm:bg-transparent sm:p-0"><button type="button" onClick={() => setStep("requirements")} disabled={saving} className="min-h-12 rounded-xl border border-border bg-surface px-5 text-sm font-semibold text-text-secondary">Back</button><button type="button" onClick={() => void createGoal()} disabled={saving || accessStatus !== "ready"} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-primary px-5 text-sm font-semibold text-white disabled:opacity-60">{saving && <LoaderCircle className="h-4 w-4 animate-spin" />}{saving ? "Creating goal…" : "Create goal"}</button></div>
    </>}
  </section>;
}
