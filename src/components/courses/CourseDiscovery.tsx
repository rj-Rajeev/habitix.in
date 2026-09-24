"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, Loader2 } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { Container, SectionHeader } from "@/components/layout";

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

export default function CourseDiscovery() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void loadCourses()
      .then((items) => {
        if (active) setCourses(items.slice(0, 4));
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
    <section className="border-y border-border bg-surface py-20 sm:py-28">
      <Container>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeader title="Learn while you grow" description="Structured courses for the next skill or direction you want to explore." />
          <Link href="/courses" className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-brand-primary transition-colors hover:text-brand-primary-hover">Explore all courses <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        </div>

        {loading ? <LoadingState /> : error ? <StateMessage title="Courses are unavailable" message={error} /> : courses.length === 0 ? <StateMessage title="Courses are coming soon" message="Published courses will appear here when they are ready." /> : <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{courses.map((course) => <CourseCard key={course._id} course={course} />)}</div>}
      </Container>
    </section>
  );
}

function CourseCard({ course }: { course: Course }) {
  return (
    <Link href={`/courses/${encodeURIComponent(course.slug)}`} className="group block h-full focus-visible:outline-none">
      <Card className="flex h-full flex-col overflow-hidden transition-transform duration-180 group-hover:-translate-y-0.5 group-focus-visible:-translate-y-0.5">
        <div className="aspect-[16/9] overflow-hidden bg-brand-primary-soft">{course.thumbnail ? <img src={course.thumbnail} alt={`${course.title} course thumbnail`} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-brand-primary"><BookOpen className="h-8 w-8" aria-hidden="true" /></div>}</div>
        <div className="flex flex-1 flex-col p-5"><div className="flex items-start justify-between gap-3"><h3 className="font-semibold text-text-primary">{course.title}</h3><Badge tone={course.price === 0 ? "success" : "neutral"}>{course.price === 0 ? "Free" : "Paid"}</Badge></div><p className="mt-3 line-clamp-3 text-sm leading-6 text-text-secondary">{course.shortDescription}</p><span className="mt-auto inline-flex items-center gap-1 pt-6 text-sm font-semibold text-brand-primary">View course <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></span></div>
      </Card>
    </Link>
  );
}

function LoadingState() {
  return <div className="mt-10 flex min-h-40 items-center justify-center rounded-container border border-border bg-surface-subtle text-sm text-text-secondary"><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />Loading courses</div>;
}

function StateMessage({ title, message }: { title: string; message: string }) {
  return <div className="mt-10 rounded-container border border-dashed border-border-strong bg-surface-subtle p-8 text-center"><BookOpen className="mx-auto h-7 w-7 text-brand-primary" aria-hidden="true" /><h3 className="mt-4 font-semibold text-text-primary">{title}</h3><p className="mt-2 text-sm text-text-secondary">{message}</p></div>;
}

