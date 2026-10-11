"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import AppShell from "@/components/app/AppShell";

type Course = { _id: string; title: string; slug: string; shortDescription: string; price: number; status: "draft" | "published"; createdAt?: string };

export default function CourseManagement() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/admin/courses").then(async (response) => {
      const payload = await response.json();
      if (!response.ok || payload?.success === false) throw new Error(payload?.error?.message || "Unable to load courses.");
      setCourses(payload?.data ?? payload);
    }).catch((cause) => setError(cause instanceof Error ? cause.message : "Unable to load courses.")).finally(() => setLoading(false));
  }, []);
  return <AppShell eyebrow="Admin" title="Course library" action={<Link href="/admin/courses/new" className="inline-flex h-10 items-center rounded-full bg-slate-950 px-4 text-sm font-semibold text-white">Create course</Link>}>
    <div className="space-y-4">
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {loading ? <div className="flex min-h-48 items-center justify-center text-sm text-slate-500"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading courses</div> : courses.length === 0 ? <section className="rounded-2xl border border-slate-200 bg-white p-8"><h2 className="font-semibold text-slate-950">No courses yet</h2><p className="mt-1 text-sm text-slate-500">Create a course to start building your library.</p></section> : <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
        {courses.map((course) => <article key={course._id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-slate-950">{course.title}</h2><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${course.status === "published" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{course.status}</span></div><p className="mt-1 text-sm text-slate-500">/{course.slug}</p><p className="mt-2 line-clamp-1 text-sm text-slate-600">{course.shortDescription}</p><p className="mt-2 text-xs text-slate-500">{course.price === 0 ? "Free" : course.price}{course.createdAt ? ` · Added ${new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(course.createdAt))}` : ""}</p></div>
          <Link href={`/admin/courses/${course._id}`} className="inline-flex min-h-9 shrink-0 items-center gap-1 self-start rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 sm:self-auto">Open course <ArrowRight className="h-4 w-4" /></Link>
        </article>)}
      </div>}
    </div>
  </AppShell>;
}
