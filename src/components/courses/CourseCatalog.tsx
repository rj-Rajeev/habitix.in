"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, Loader2 } from "lucide-react";

type Course = {
  _id: string;
  title: string;
  slug: string;
  shortDescription: string;
  thumbnail?: string;
  price: number;
};

async function loadCourses(): Promise<Course[]> {
  const response = await fetch("/api/courses");
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.error?.message || "Unable to load courses.");
  }
  return (payload?.data ?? []) as Course[];
}

export default function CourseCatalog() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void loadCourses()
      .then((items) => {
        if (active) setCourses(items);
      })
      .catch((loadError) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load courses.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="min-h-[calc(100vh-80px)] bg-[#f6f7f9] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Learn at your pace</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Courses for your next step</h1>
          <p className="mt-3 text-base leading-7 text-slate-600">Practical lessons to help you build momentum, one focused session at a time.</p>
        </header>

        {loading ? (
          <LoadingState />
        ) : error ? (
          <StateMessage title="Courses are unavailable" message={error} />
        ) : courses.length === 0 ? (
          <StateMessage title="No courses published yet" message="New courses will appear here when they are ready." />
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Link key={course._id} href={`/courses/${encodeURIComponent(course.slug)}`} className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
                <div className="aspect-[16/9] overflow-hidden bg-emerald-50">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-emerald-700"><BookOpen className="h-10 w-10" /></div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-lg font-semibold text-slate-950">{course.title}</h2>
                    <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{course.price === 0 ? "Free" : "Paid"}</span>
                  </div>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{course.shortDescription}</p>
                  <div className="mt-auto flex items-center justify-between gap-3 pt-6">
                    <span className="text-sm font-semibold text-slate-800">{course.price === 0 ? "Free" : course.price}</span>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">View course <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" /></span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function LoadingState() {
  return <div className="mt-10 flex min-h-64 items-center justify-center rounded-3xl bg-white text-sm text-slate-500 shadow-sm"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading courses</div>;
}

function StateMessage({ title, message }: { title: string; message: string }) {
  return <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm"><BookOpen className="mx-auto h-8 w-8 text-emerald-700" /><h2 className="mt-4 font-semibold text-slate-950">{title}</h2><p className="mt-2 text-sm text-slate-500">{message}</p></div>;
}
