"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Course = { title: string; slug: string; shortDescription: string; description: string; thumbnail?: string; price: number };
type Lesson = { _id: string; title: string; description?: string; markdownContent?: string; videoUrl?: string; pdfUrl?: string; isFree: boolean; order: number };
type Module = { _id: string; title: string; description?: string; order: number };
async function get<T>(url: string): Promise<T> { const res = await fetch(url); const body = await res.json(); if (!res.ok || body?.success === false) throw new Error("Unable to load preview."); return body?.data ?? body; }

export default function CoursePreviewPage({ params }: { params: Promise<{ courseId: string }> }) {
  const [courseId, setCourseId] = useState("");
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Record<string, Lesson[]>>({});
  const [error, setError] = useState("");
  useEffect(() => { void params.then(({ courseId: id }) => { setCourseId(id); void (async () => { try { const [c, ms] = await Promise.all([get<Course>(`/api/admin/courses/${id}`), get<Module[]>(`/api/admin/courses/${id}/modules`)]); setCourse(c); setModules(ms.sort((a,b)=>a.order-b.order)); const entries = await Promise.all(ms.map(async m => [m._id, await get<Lesson[]>(`/api/admin/courses/${id}/modules/${m._id}/lessons`)] as const)); setLessons(Object.fromEntries(entries)); } catch (e) { setError(e instanceof Error ? e.message : "Unable to load preview."); } })(); }); }, [params]);
  return <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6"><div className="mx-auto max-w-4xl"><Link href={courseId ? `/admin/courses/${courseId}` : "/admin/courses"} className="text-sm font-semibold text-slate-600">← Back to course builder</Link>{error ? <p role="alert" className="mt-6 text-sm text-red-700">{error}</p> : course && <><p className="mt-6 text-xs font-semibold uppercase tracking-wider text-emerald-700">Admin preview · {course.price === 0 ? "Free" : course.price}</p><h1 className="mt-2 text-3xl font-semibold text-slate-950">{course.title}</h1><p className="mt-2 text-lg text-slate-600">{course.shortDescription}</p><p className="mt-6 whitespace-pre-wrap text-slate-700">{course.description}</p>{course.thumbnail && <img src={course.thumbnail} alt="" className="mt-6 max-h-80 w-full rounded-xl object-cover" />}<h2 className="mt-10 text-xl font-semibold text-slate-950">Curriculum</h2><div className="mt-4 space-y-4">{modules.map(m=><section key={m._id} className="rounded-xl border border-slate-200 bg-white p-5"><h3 className="font-semibold text-slate-950">{m.order}. {m.title}</h3>{m.description && <p className="mt-1 text-sm text-slate-600">{m.description}</p>}<ol className="mt-4 space-y-3">{(lessons[m._id]??[]).sort((a,b)=>a.order-b.order).map(l=><li key={l._id} className="border-t border-slate-100 pt-3"><p className="font-medium text-slate-800">{l.order}. {l.title} <span className="text-xs text-slate-500">{l.isFree ? "Free preview" : "Enrolled learners"}</span></p>{l.description && <p className="mt-1 text-sm text-slate-600">{l.description}</p>}<p className="mt-2 line-clamp-4 whitespace-pre-wrap text-sm text-slate-600">{l.markdownContent}</p>{l.videoUrl && <p className="mt-2 text-sm text-emerald-700">Video: {l.videoUrl}</p>}{l.pdfUrl && <p className="mt-1 text-sm text-emerald-700">PDF: {l.pdfUrl}</p>}</li>)}</ol></section>)}</div></>}</div></main>;
}
