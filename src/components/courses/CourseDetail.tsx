"use client";

import Link from "next/link";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import {
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  LockKeyhole,
  Menu,
  Play,
  X,
} from "lucide-react";

type Course = {
  _id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  thumbnail?: string;
  price: number;
  status: "published";
};

type Lesson = {
  _id: string;
  moduleId: string;
  title: string;
  description?: string;
  order: number;
  markdownContent?: string;
  videoUrl?: string;
  pdfUrl?: string;
};

type Module = { _id: string; title: string; description?: string; order: number; lessons: Lesson[] };
type CourseResponse = { course: Course; modules: Module[] };
type EnrollmentState = { enrolled: boolean; status?: "active" | "pending" | "cancelled"; paymentStatus?: string };
type PaymentDetails = { keyId: string; orderId: string; amount: number; currency: string };
type RazorpayConstructor = new (options: { key: string; amount: number; currency: string; name: string; description: string; order_id: string; handler: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void }) => { open: () => void };

type FlatLesson = Lesson & { moduleTitle: string; moduleOrder: number };

async function loadCourse(slug: string): Promise<CourseResponse> {
  const response = await fetch(`/api/courses/${encodeURIComponent(slug)}`);
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success === false) throw new Error(payload?.error?.message || "Unable to load this course.");
  return (payload?.data ?? payload) as CourseResponse;
}

export default function CourseDetail({ slug }: { slug: string }) {
  const [data, setData] = useState<CourseResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [enrollment, setEnrollment] = useState<EnrollmentState | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollmentMessage, setEnrollmentMessage] = useState("");
  const [activeLessonId, setActiveLessonId] = useState("");
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [contentsOpen, setContentsOpen] = useState(false);
  const { status: authStatus } = useSession();

  useEffect(() => {
    let active = true;
    void loadCourse(slug).then((result) => {
      if (!active) return;
      setData(result);
      const firstModule = result.modules[0];
      const firstLesson = firstModule?.lessons[0];
      if (firstLesson) {
        setActiveLessonId(firstLesson._id);
        setExpandedModules({ [firstModule._id]: true });
      }
    }).catch((loadError) => {
      if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load this course.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [slug]);

  useEffect(() => {
    if (authStatus !== "authenticated" || !data?.course._id) return;
    void fetch(`/api/courses/${data.course._id}/enrollment`).then((response) => response.json()).then((payload) => {
      if (payload?.success) setEnrollment(payload.data);
    }).catch(() => undefined);
  }, [authStatus, data?.course._id]);

  useEffect(() => {
    if (!contentsOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setContentsOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [contentsOpen]);

  async function enroll() {
    if (!data) return;
    if (authStatus !== "authenticated") {
      await signIn(undefined, { callbackUrl: `/courses/${encodeURIComponent(slug)}` });
      return;
    }
    setEnrolling(true);
    setEnrollmentMessage("");
    try {
      const response = await fetch(`/api/courses/${data.course._id}/enroll`, { method: "POST" });
      const payload = await response.json().catch(() => null);
      if (!response.ok || payload?.success === false) throw new Error(payload?.error?.message || "Unable to start enrollment.");
      const result = payload.data;
      if (!result.requiresPayment) {
        setEnrollment({ enrolled: true, status: "active", paymentStatus: "paid" });
        setEnrollmentMessage("You are enrolled. Course content is ready.");
        return;
      }
      const payment = result.payment as PaymentDetails | null;
      if (!payment?.keyId || !payment.orderId) throw new Error("Payment checkout is not available right now.");
      await loadRazorpay();
      const Razorpay = (window as unknown as { Razorpay?: RazorpayConstructor }).Razorpay;
      if (!Razorpay) throw new Error("Payment checkout is not available right now.");
      const checkout = new Razorpay({
        key: payment.keyId,
        amount: payment.amount,
        currency: payment.currency,
        name: "Habitix",
        description: data.course.title,
        order_id: payment.orderId,
        handler: async (paymentResponse) => {
          const confirmation = await fetch(`/api/courses/${data.course._id}/enroll/confirm`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId: paymentResponse.razorpay_payment_id, orderId: paymentResponse.razorpay_order_id, signature: paymentResponse.razorpay_signature }),
          });
          const confirmationPayload = await confirmation.json().catch(() => null);
          if (!confirmation.ok || confirmationPayload?.success === false) {
            setEnrollmentMessage(confirmationPayload?.error?.message || "Payment could not be verified.");
            return;
          }
          setEnrollment({ enrolled: true, status: "active", paymentStatus: "paid" });
          setEnrollmentMessage("Payment verified. You are enrolled.");
        },
      });
      checkout.open();
      setEnrollment({ enrolled: true, status: "pending", paymentStatus: "pending" });
    } catch (enrollmentError) {
      setEnrollmentMessage(enrollmentError instanceof Error ? enrollmentError.message : "Unable to enroll.");
    } finally {
      setEnrolling(false);
    }
  }

  if (loading) return <PageState>Loading course</PageState>;
  if (error || !data) return <PageState><BookOpen className="mx-auto h-8 w-8 text-brand-primary" aria-hidden="true" /><h1 className="mt-4 font-semibold text-text-primary">Course unavailable</h1><p className="mt-2 text-sm text-text-secondary">{error || "This course could not be found."}</p><Link href="/courses" className="ui-button mt-5 no-underline" data-variant="primary"><ArrowLeft className="h-4 w-4" /> Browse courses</Link></PageState>;

  const { course, modules } = data;
  const allLessons = modules.flatMap((module) => module.lessons.map((lesson) => ({ ...lesson, moduleTitle: module.title, moduleOrder: module.order })));
  const activeLesson = allLessons.find((lesson) => lesson._id === activeLessonId) ?? allLessons[0];
  const activeIndex = activeLesson ? allLessons.findIndex((lesson) => lesson._id === activeLesson._id) : -1;
  const hasAccess = course.price === 0 || (enrollment?.status === "active" && enrollment.paymentStatus === "paid");
  const progress = allLessons.length ? Math.round((completedLessons.length / allLessons.length) * 100) : 0;

  const selectLesson = (lesson: FlatLesson) => {
    setActiveLessonId(lesson._id);
    setExpandedModules((current) => ({ ...current, [lesson.moduleId]: true }));
    setContentsOpen(false);
  };

  const markComplete = () => {
    if (!hasAccess || !activeLesson || completedLessons.includes(activeLesson._id)) return;
    setCompletedLessons((current) => [...current, activeLesson._id]);
  };

  return (
    <>
      <style jsx>{`\n        @keyframes course-drawer-in {\n          from { transform: translateX(100%); }\n          to { transform: translateX(0); }\n        }\n      `}</style>
      <main className="min-h-[calc(100vh-80px)] bg-background">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="min-w-0"><Link href="/courses" className="inline-flex items-center gap-2 text-xs font-semibold text-text-muted hover:text-brand-primary"><ArrowLeft className="h-4 w-4" /> Courses</Link><h1 className="mt-2 truncate text-lg font-semibold text-text-primary">{course.title}</h1><p className="mt-1 text-sm text-text-secondary">{activeLesson ? `Module ${activeLesson.moduleOrder} · ${activeLesson.moduleTitle}` : "Course learning path"}</p></div>
          <div className="hidden min-w-32 text-right sm:block"><p className="text-xs font-semibold uppercase tracking-[0.1em] text-text-muted">Progress</p><p className="mt-1 text-lg font-semibold text-text-primary">{progress}%</p></div>
          <button type="button" onClick={() => setContentsOpen(true)} className="ui-button sm:hidden" data-variant="secondary" aria-label="Open course contents"><Menu className="h-4 w-4" /> Contents</button>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl lg:grid-cols-[288px_minmax(0,1fr)]">
        <aside className="hidden border-r border-border bg-surface lg:block"><CourseSidebar modules={modules} activeLessonId={activeLesson?._id} expandedModules={expandedModules} setExpandedModules={setExpandedModules} completedLessons={completedLessons} onSelect={selectLesson} progress={progress} locked={!hasAccess} /></aside>
        <section className="min-w-0 px-4 py-8 sm:px-6 lg:px-12 lg:py-10">
          <div className="mx-auto max-w-3xl">
            {activeLesson ? <><div className="mb-8 flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-primary">Module {activeLesson.moduleOrder} · {activeLesson.moduleTitle}</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">{activeLesson.title}</h2><p className="mt-3 max-w-2xl text-base leading-7 text-text-secondary">{activeLesson.description || "Work through this lesson at your own pace."}</p></div><span className="hidden rounded-full bg-surface-subtle px-3 py-1 text-xs font-semibold text-text-secondary sm:inline-flex">Lesson {activeIndex + 1} of {allLessons.length}</span></div><LessonContent lesson={activeLesson} hasAccess={hasAccess} onEnroll={() => void enroll()} enrolling={enrolling} /><LessonNavigation previous={allLessons[activeIndex - 1]} next={allLessons[activeIndex + 1]} canComplete={hasAccess} currentComplete={Boolean(activeLesson && completedLessons.includes(activeLesson._id))} onPrevious={() => allLessons[activeIndex - 1] && selectLesson(allLessons[activeIndex - 1])} onNext={() => allLessons[activeIndex + 1] && selectLesson(allLessons[activeIndex + 1])} onComplete={markComplete} /></> : <EmptyCourseState />}
            {enrollmentMessage && <p className="mt-5 text-sm text-text-secondary" role="status">{enrollmentMessage}</p>}
          </div>
        </section>
      </div>

      {contentsOpen && <div className="fixed inset-0 z-50 lg:hidden">
        <button type="button" className="absolute inset-0 bg-black/30 opacity-100 transition-opacity duration-200 motion-reduce:transition-none" onClick={() => setContentsOpen(false)} aria-label="Close course contents" />
        <aside className="absolute right-0 top-0 flex h-full w-[min(88vw,360px)] flex-col bg-surface shadow-[var(--shadow-md)] animate-[course-drawer-in_220ms_ease-out] motion-reduce:animate-none" role="dialog" aria-modal="true" aria-label="Course contents">
          <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-4"><div><h2 className="font-semibold text-text-primary">Course contents</h2><p className="mt-1 text-xs text-text-muted">{progress}% complete</p></div><button type="button" onClick={() => setContentsOpen(false)} className="rounded-control p-2 text-text-muted hover:bg-surface-subtle" aria-label="Close course contents"><X className="h-5 w-5" /></button></div>
          <div className="min-h-0 flex-1 overflow-y-auto"><CourseSidebar modules={modules} activeLessonId={activeLesson?._id} expandedModules={expandedModules} setExpandedModules={setExpandedModules} completedLessons={completedLessons} onSelect={selectLesson} progress={progress} locked={!hasAccess} showHeading={false} /></div>
        </aside>
      </div>}
      </main>
    </>
  );
}

function CourseSidebar({ modules, activeLessonId, expandedModules, setExpandedModules, completedLessons, onSelect, progress, locked, showHeading = true }: { modules: Module[]; activeLessonId?: string; expandedModules: Record<string, boolean>; setExpandedModules: Dispatch<SetStateAction<Record<string, boolean>>>; completedLessons: string[]; onSelect: (lesson: FlatLesson) => void; progress: number; locked: boolean; showHeading?: boolean }) {
  return <div className={`flex min-h-full flex-col p-4 ${showHeading ? "min-h-[calc(100vh-145px)]" : ""}`}>{showHeading && <div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">Learning path</p><p className="mt-1 text-sm text-text-secondary">{modules.length} {modules.length === 1 ? "module" : "modules"}</p></div><BookOpen className="h-5 w-5 text-brand-primary" aria-hidden="true" /></div>}<div className="space-y-2">{modules.map((module) => { const expanded = expandedModules[module._id] ?? false; const completed = module.lessons.filter((lesson) => completedLessons.includes(lesson._id)).length; return <section key={module._id}><button type="button" className="flex w-full items-center gap-2 rounded-control px-2 py-2 text-left hover:bg-surface-subtle focus-visible:outline-none" onClick={() => setExpandedModules((current) => ({ ...current, [module._id]: !expanded }))} aria-expanded={expanded} aria-controls={`module-${module._id}`}><ChevronDown className={`h-4 w-4 shrink-0 text-text-muted transition-transform ${expanded ? "rotate-0" : "-rotate-90"}`} aria-hidden="true" /><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-text-primary">{String(module.order).padStart(2, "0")} {module.title}</span><span className="mt-0.5 block text-xs text-text-muted">{completed}/{module.lessons.length} complete</span></span></button>{expanded && <div id={`module-${module._id}`} className="ml-3 border-l border-border pl-3">{module.lessons.map((lesson) => { const lessonLocked = locked; return <button type="button" key={lesson._id} onClick={() => onSelect({ ...lesson, moduleTitle: module.title, moduleOrder: module.order })} className={`flex w-full items-start gap-2 rounded-control px-2 py-2 text-left text-sm focus-visible:outline-none ${activeLessonId === lesson._id ? "bg-brand-primary-soft font-semibold text-brand-primary" : "text-text-secondary hover:bg-surface-subtle"}`} aria-current={activeLessonId === lesson._id ? "page" : undefined}>{lessonLocked ? <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" aria-label="Preview; enrollment required" /> : completedLessons.includes(lesson._id) ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" aria-label="Completed" /> : <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full border border-border-strong" aria-hidden="true" />}<span className="min-w-0 break-words">{lesson.title}</span></button>; })}</div>}</section>; })}</div><div className="mt-auto border-t border-border pt-5"><div className="flex items-center justify-between text-sm"><span className="font-medium text-text-primary">Course progress</span><span className="font-semibold text-brand-primary">{progress}%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-subtle"><div className="h-full rounded-full bg-brand-primary transition-[width] duration-200" style={{ width: `${progress}%` }} /></div><p className="mt-2 text-xs text-text-muted">{completedLessons.length} of {modules.reduce((total, module) => total + module.lessons.length, 0)} lessons</p></div></div>;
}

function LessonContent({ lesson, hasAccess, onEnroll, enrolling }: { lesson: Lesson; hasAccess: boolean; onEnroll: () => void; enrolling: boolean }) {
  const previewContent = lesson.markdownContent ? truncateMarkdown(lesson.markdownContent, 1400) : lesson.description || "This lesson is ready to explore. Enroll to access the complete lesson.";
  return <article className="lesson-prose">{hasAccess ? <>{lesson.markdownContent ? <MarkdownContent content={lesson.markdownContent} /> : <p className="text-base leading-8 text-text-secondary">{previewContent}</p>}</> : <div className="relative max-h-[420px] overflow-hidden"><div>{lesson.markdownContent ? <MarkdownContent content={previewContent} /> : <p className="text-base leading-8 text-text-secondary">{previewContent}</p>}</div><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background via-background/90 to-transparent px-4 pb-1 pt-24"><div className="rounded-container border border-border bg-surface p-5 shadow-[var(--shadow-sm)]"><LockKeyhole className="h-5 w-5 text-text-muted" aria-hidden="true" /><h3 className="mt-3 text-base font-semibold text-text-primary">Continue with enrollment</h3><p className="mt-1 text-sm leading-6 text-text-secondary">Enroll to access the full lesson and learning materials.</p><button type="button" onClick={onEnroll} disabled={enrolling} className="ui-button mt-4" data-variant="primary">{enrolling ? "Preparing enrollment..." : "Enroll now"}</button></div></div></div>}{lesson.videoUrl && (hasAccess ? <div className="mt-8 overflow-hidden rounded-container bg-text-primary"><div className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-white"><Play className="h-4 w-4" aria-hidden="true" /> Video lesson</div><div className="aspect-video"><iframe src={lesson.videoUrl} title={`${lesson.title} video`} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="h-full w-full border-0" /></div></div> : <div className="mt-8 flex items-center gap-2 rounded-control border border-border bg-surface-subtle px-4 py-3 text-sm text-text-secondary"><LockKeyhole className="h-4 w-4" aria-hidden="true" /> Video lesson · Available after enrollment</div>)}{lesson.pdfUrl && (hasAccess ? <a href={lesson.pdfUrl} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-brand-primary hover:text-brand-primary-hover"><FileText className="h-4 w-4" aria-hidden="true" /> Open resource <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /></a> : <div className="mt-8 flex items-center gap-2 rounded-control border border-border bg-surface-subtle px-4 py-3 text-sm text-text-secondary"><LockKeyhole className="h-4 w-4" aria-hidden="true" /> PDF resource available after enrollment</div>)}</article>;
}

function truncateMarkdown(content: string, maxLength: number) {
  if (content.length <= maxLength) return content;
  const boundary = content.lastIndexOf(" ", maxLength);
  return `${content.slice(0, boundary > 0 ? boundary : maxLength).trim()}...`;
}

function LessonNavigation({ previous, next, canComplete, currentComplete, onPrevious, onNext, onComplete }: { previous?: FlatLesson; next?: FlatLesson; canComplete: boolean; currentComplete: boolean; onPrevious: () => void; onNext: () => void; onComplete: () => void }) {
  return <nav className="mt-12 border-t border-border pt-5" aria-label="Lesson navigation"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><button type="button" onClick={onPrevious} disabled={!previous} className="ui-button justify-start sm:min-w-36" data-variant="ghost"><ChevronLeft className="h-4 w-4" aria-hidden="true" /> Previous</button><button type="button" onClick={onComplete} disabled={!canComplete || currentComplete} className="ui-button order-first sm:order-none" data-variant={currentComplete ? "secondary" : "primary"}>{currentComplete ? <Check className="h-4 w-4" aria-hidden="true" /> : canComplete ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : <LockKeyhole className="h-4 w-4" aria-hidden="true" />}{currentComplete ? "Completed" : canComplete ? "Mark complete" : "Locked"}</button>{next ? <button type="button" onClick={onNext} disabled={!canComplete} className="ui-button justify-end sm:min-w-36" data-variant="ghost">Next <ChevronRight className="h-4 w-4" aria-hidden="true" /></button> : <span className="text-right text-xs text-text-muted sm:min-w-36">Course complete</span>}</div></nav>;
}

function MarkdownContent({ content }: { content: string }) {
  const lines = content.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let listItems: string[] = [];
  const flushList = () => { if (!listItems.length) return; blocks.push(<ul key={`list-${blocks.length}`} className="my-5 list-disc space-y-2 pl-5">{listItems.map((item, index) => <li key={`${item}-${index}`}>{renderInline(item)}</li>)}</ul>); listItems = []; };
  lines.forEach((line, index) => { const trimmed = line.trim(); if (!trimmed) { flushList(); return; } const listMatch = trimmed.match(/^[-*]\s+(.+)/); if (listMatch) { listItems.push(listMatch[1]); return; } flushList(); const heading = trimmed.match(/^(#{1,3})\s+(.+)/); if (heading) { const Tag = heading[1].length === 1 ? "h3" : heading[1].length === 2 ? "h4" : "h5"; blocks.push(<Tag key={`heading-${index}`} className="mt-8 text-xl font-semibold text-text-primary first:mt-0">{renderInline(heading[2])}</Tag>); return; } blocks.push(<p key={`paragraph-${index}`} className="mt-5 text-base leading-8 text-text-secondary first:mt-0">{renderInline(trimmed)}</p>); });
  flushList();
  return <div>{blocks}</div>;
}

function renderInline(text: string) {
  const tokens = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^\s)]+\))/g).filter(Boolean);
  return tokens.map((token, index) => { if (token.startsWith("**") && token.endsWith("**")) return <strong key={index}>{token.slice(2, -2)}</strong>; if (token.startsWith("`") && token.endsWith("`")) return <code key={index} className="rounded bg-surface-subtle px-1.5 py-0.5 text-sm text-text-primary">{token.slice(1, -1)}</code>; const link = token.match(/^\[([^\]]+)\]\(([^\s)]+)\)$/); if (link) return <a key={index} href={link[2]} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-primary underline">{link[1]}</a>; return <span key={index}>{token}</span>; });
}

function EmptyCourseState() { return <div className="py-16 text-center"><BookOpen className="mx-auto h-8 w-8 text-brand-primary" aria-hidden="true" /><h2 className="mt-4 text-lg font-semibold text-text-primary">Course content is being prepared.</h2><p className="mt-2 text-sm text-text-secondary">Check back soon for the learning path.</p></div>; }
function PageState({ children }: { children: ReactNode }) { return <main className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-background px-4 py-12 text-center"><div className="rounded-container border border-border bg-surface p-8 shadow-[var(--shadow-sm)]">{children}</div></main>; }
function loadRazorpay() { if ((window as unknown as { Razorpay?: RazorpayConstructor }).Razorpay) return Promise.resolve(); return new Promise<void>((resolve, reject) => { const script = document.createElement("script"); script.src = "https://checkout.razorpay.com/v1/checkout.js"; script.onload = () => resolve(); script.onerror = () => reject(new Error("Unable to load payment checkout.")); document.body.appendChild(script); }); }
