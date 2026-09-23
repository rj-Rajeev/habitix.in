"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { ArrowLeft, BookOpen, ExternalLink, FileText, Loader2, Play } from "lucide-react";

type Course = { _id: string; title: string; slug: string; shortDescription: string; description: string; thumbnail?: string; price: number; status: "published" };
type Lesson = { _id: string; moduleId: string; title: string; description?: string; order: number; markdownContent?: string; videoUrl?: string; pdfUrl?: string };
type Module = { _id: string; title: string; description?: string; order: number; lessons: Lesson[] };
type CourseResponse = { course: Course; modules: Module[] };

async function loadCourse(slug: string): Promise<CourseResponse> {
  const response = await fetch(`/api/courses/${encodeURIComponent(slug)}`);
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.error?.message || "Unable to load this course.");
  }
  return (payload?.data ?? payload) as CourseResponse;
}

export default function CourseDetail({ slug }: { slug: string }) {
  const [data, setData] = useState<CourseResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void loadCourse(slug)
      .then((result) => {
        if (active) setData(result);
      })
      .catch((loadError) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load this course.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) return <PageState><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading course</PageState>;
  if (error || !data) return <PageState><div><BookOpen className="mx-auto h-8 w-8 text-emerald-700" /><h1 className="mt-4 font-semibold text-slate-950">Course unavailable</h1><p className="mt-2 text-sm text-slate-500">{error || "This course could not be found."}</p><Link href="/courses" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white"> <ArrowLeft className="h-4 w-4" /> Browse courses</Link></div></PageState>;

  const { course, modules } = data;
  return (
    <main className="min-h-[calc(100vh-80px)] bg-[#f6f7f9] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/courses" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-emerald-700"><ArrowLeft className="h-4 w-4" /> All courses</Link>
        <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
            <div className="aspect-[16/9] bg-emerald-50 lg:aspect-auto lg:min-h-80">
              {course.thumbnail ? <img src={course.thumbnail} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full min-h-64 items-center justify-center text-emerald-700"><BookOpen className="h-16 w-16" /></div>}
            </div>
            <div className="p-6 sm:p-8"><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{course.price === 0 ? "Free course" : `Paid course · ${course.price}`}</span><h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">{course.title}</h1><p className="mt-4 text-base leading-7 text-slate-600">{course.shortDescription}</p></div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><h2 className="text-xl font-semibold text-slate-950">About this course</h2><p className="mt-4 whitespace-pre-line text-base leading-8 text-slate-600">{course.description}</p></section>

        <section className="mt-8"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Curriculum</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Course content</h2></div><span className="text-sm text-slate-500">{modules.length} {modules.length === 1 ? "module" : "modules"}</span></div>
          {modules.length === 0 ? <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">Course content is being prepared.</div> : <div className="mt-5 space-y-4">{modules.map((module) => <ModuleSection key={module._id} module={module} />)}</div>}
        </section>
      </div>
    </main>
  );
}

function ModuleSection({ module }: { module: Module }) {
  return <section className="rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-5 py-5 sm:px-6"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Module {module.order}</p><h3 className="mt-1 text-lg font-semibold text-slate-950">{module.title}</h3>{module.description && <p className="mt-2 text-sm leading-6 text-slate-500">{module.description}</p>}</div><BookOpen className="h-5 w-5 shrink-0 text-slate-400" /></div></div><div className="divide-y divide-slate-100">{module.lessons.length === 0 ? <p className="px-5 py-5 text-sm text-slate-500 sm:px-6">No lessons in this module yet.</p> : module.lessons.map((lesson) => <LessonSection key={lesson._id} lesson={lesson} />)}</div></section>;
}

function LessonSection({ lesson }: { lesson: Lesson }) {
  return <article className="px-5 py-6 sm:px-6"><div className="flex items-start gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-600">{lesson.order}</span><div className="min-w-0 flex-1"><h4 className="text-base font-semibold text-slate-950">{lesson.title}</h4>{lesson.description && <p className="mt-2 text-sm leading-6 text-slate-600">{lesson.description}</p>}{lesson.markdownContent && <MarkdownContent content={lesson.markdownContent} />}{lesson.videoUrl && <div className="mt-5 overflow-hidden rounded-2xl bg-slate-950"><div className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-white"><Play className="h-4 w-4 text-emerald-400" /> Video</div><div className="aspect-video"><iframe src={lesson.videoUrl} title={`${lesson.title} video`} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="h-full w-full border-0" /></div></div>}{lesson.pdfUrl && <a href={lesson.pdfUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"><FileText className="h-4 w-4 text-emerald-700" /> Download PDF <ExternalLink className="h-3.5 w-3.5 text-slate-400" /></a>}</div></div></article>;
}

function MarkdownContent({ content }: { content: string }) {
  const lines = content.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length === 0) return;
    blocks.push(<ul key={`list-${blocks.length}`} className="my-4 list-disc space-y-2 pl-5 text-slate-600">{listItems.map((item, index) => <li key={`${item}-${index}`}>{renderInline(item)}</li>)}</ul>);
    listItems = [];
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) { flushList(); return; }
    const listMatch = trimmed.match(/^[-*]\s+(.+)/);
    if (listMatch) { listItems.push(listMatch[1]); return; }
    flushList();
    const heading = trimmed.match(/^(#{1,3})\s+(.+)/);
    if (heading) {
      const Tag = heading[1].length === 1 ? "h3" : heading[1].length === 2 ? "h4" : "h5";
      blocks.push(<Tag key={`heading-${index}`} className="mt-5 text-base font-semibold text-slate-950 first:mt-0">{renderInline(heading[2])}</Tag>);
      return;
    }
    blocks.push(<p key={`paragraph-${index}`} className="mt-4 text-sm leading-7 text-slate-600 first:mt-0">{renderInline(trimmed)}</p>);
  });
  flushList();
  return <div className="mt-5 border-l-2 border-emerald-100 pl-4">{blocks}</div>;
}

function renderInline(text: string) {
  const tokens = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^\s)]+\))/g).filter(Boolean);
  return tokens.map((token, index) => {
    if (token.startsWith("**") && token.endsWith("**")) return <strong key={index}>{token.slice(2, -2)}</strong>;
    if (token.startsWith("`") && token.endsWith("`")) return <code key={index} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-800">{token.slice(1, -1)}</code>;
    const link = token.match(/^\[([^\]]+)\]\(([^\s)]+)\)$/);
    if (link) return <a key={index} href={link[2]} target="_blank" rel="noopener noreferrer" className="font-medium text-emerald-700 underline">{link[1]}</a>;
    return <span key={index}>{token}</span>;
  });
}

function PageState({ children }: { children: ReactNode }) {
  return <main className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-[#f6f7f9] px-4 py-12 text-center"><div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">{children}</div></main>;
}
