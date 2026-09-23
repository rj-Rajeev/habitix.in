"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  Check,
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import AppShell from "@/components/app/AppShell";

type Course = {
  _id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  thumbnail?: string;
  price: number;
  status: "draft" | "published";
  createdAt?: string;
};

type CourseFormValues = Omit<Course, "_id" | "createdAt">;

const emptyForm: CourseFormValues = {
  title: "",
  slug: "",
  shortDescription: "",
  description: "",
  thumbnail: "",
  price: 0,
  status: "draft",
};

async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.error?.message || payload?.message || "Request failed");
  }
  return (payload?.data ?? payload) as T;
}

function formatDate(value?: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}

export default function CourseManagement() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [form, setForm] = useState<CourseFormValues>(emptyForm);
  const [pending, setPending] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  async function loadCourses() {
    setLoading(true);
    try {
      setCourses(await apiRequest<Course[]>("/api/admin/courses"));
    } catch (error) {
      setFeedback({ tone: "error", text: error instanceof Error ? error.message : "Unable to load courses." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCourses();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
    setFeedback(null);
  }

  function openEdit(course: Course) {
    setEditing(course);
    setForm({
      title: course.title,
      slug: course.slug,
      shortDescription: course.shortDescription,
      description: course.description,
      thumbnail: course.thumbnail ?? "",
      price: course.price,
      status: course.status,
    });
    setFormOpen(true);
    setFeedback(null);
  }

  async function saveCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = form.title.trim();
    const slug = form.slug.trim();
    const shortDescription = form.shortDescription.trim();
    const description = form.description.trim();

    if (!title || !slug || !shortDescription || !description) {
      setFeedback({ tone: "error", text: "Title, slug, short description, and description are required." });
      return;
    }
    if (!Number.isFinite(form.price) || form.price < 0) {
      setFeedback({ tone: "error", text: "Price must be zero or greater." });
      return;
    }

    const key = editing ? `edit-${editing._id}` : "create";
    setPending(key);
    setFeedback(null);
    try {
      const url = editing ? `/api/admin/courses/${editing._id}` : "/api/admin/courses";
      const course = await apiRequest<Course>(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, title, slug, shortDescription, description, thumbnail: form.thumbnail?.trim() || undefined }),
      });
      setCourses((current) => editing
        ? current.map((item) => item._id === course._id ? course : item)
        : [course, ...current]);
      setFormOpen(false);
      setFeedback({ tone: "success", text: editing ? "Course updated." : "Course created." });
    } catch (error) {
      setFeedback({ tone: "error", text: error instanceof Error ? error.message : "Unable to save course." });
    } finally {
      setPending(null);
    }
  }

  async function changeStatus(course: Course) {
    const nextStatus = course.status === "published" ? "draft" : "published";
    setPending(`status-${course._id}`);
    setFeedback(null);
    try {
      const updated = await apiRequest<Course>(`/api/admin/courses/${course._id}/publish`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      setCourses((current) => current.map((item) => item._id === updated._id ? updated : item));
      setFeedback({ tone: "success", text: `Course ${nextStatus === "published" ? "published" : "unpublished"}.` });
    } catch (error) {
      setFeedback({ tone: "error", text: error instanceof Error ? error.message : "Unable to update status." });
    } finally {
      setPending(null);
    }
  }

  async function deleteCourse(course: Course) {
    if (!window.confirm(`Delete ${course.title}? Its modules and lessons will also be deleted.`)) return;
    setPending(`delete-${course._id}`);
    setFeedback(null);
    try {
      await apiRequest(`/api/admin/courses/${course._id}`, { method: "DELETE" });
      setCourses((current) => current.filter((item) => item._id !== course._id));
      setFeedback({ tone: "success", text: "Course deleted." });
    } catch (error) {
      setFeedback({ tone: "error", text: error instanceof Error ? error.message : "Unable to delete course." });
    } finally {
      setPending(null);
    }
  }

  return (
    <AppShell
      eyebrow="Admin"
      title="Courses"
      action={
        <button type="button" onClick={openCreate} className="inline-flex h-10 items-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-semibold text-white disabled:opacity-50">
          <Plus className="h-4 w-4" />
          Create Course
        </button>
      }
    >
      <div className="space-y-5">
        {feedback && <Feedback tone={feedback.tone}>{feedback.text}</Feedback>}
        {formOpen && (
          <CourseForm
            form={form}
            editing={Boolean(editing)}
            pending={pending !== null}
            onChange={setForm}
            onCancel={() => setFormOpen(false)}
            onSubmit={saveCourse}
          />
        )}
        {loading ? (
          <LoadingState />
        ) : courses.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="font-semibold text-slate-950">No courses yet</p>
            <p className="mt-1 text-sm text-slate-500">Create your first course to start building a library.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {courses.map((course) => {
              const busy = pending !== null && (pending.includes(course._id) || pending.startsWith("edit-"));
              return (
                <article key={course._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold text-slate-950">{course.title}</h2>
                        <StatusBadge status={course.status} />
                      </div>
                      <p className="mt-1 text-sm text-slate-500">/{course.slug}</p>
                      <p className="mt-2 line-clamp-2 text-sm text-slate-600">{course.shortDescription}</p>
                      <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                        <span>{course.price === 0 ? "Free" : `${course.price}`}</span>
                        {course.createdAt && <span>{formatDate(course.createdAt)}</span>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      <Link href={`/admin/courses/${course._id}`} className="inline-flex min-h-9 items-center gap-1 rounded-lg bg-slate-950 px-3 text-xs font-semibold text-white">
                        Structure <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                      <button type="button" disabled={busy} onClick={() => openEdit(course)} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 disabled:opacity-50">
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button type="button" disabled={busy} onClick={() => void changeStatus(course)} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-emerald-200 px-3 text-xs font-semibold text-emerald-700 disabled:opacity-50">
                        {pending === `status-${course._id}` && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        {course.status === "published" ? "Unpublish" : "Publish"}
                      </button>
                      <button type="button" disabled={busy} onClick={() => void deleteCourse(course)} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-700 disabled:opacity-50">
                        {pending === `delete-${course._id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function CourseForm({ form, editing, pending, onChange, onCancel, onSubmit }: {
  form: CourseFormValues;
  editing: boolean;
  pending: boolean;
  onChange: (value: CourseFormValues) => void;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const update = (field: keyof CourseFormValues, value: string | number) => onChange({ ...form, [field]: value });
  return (
    <form onSubmit={onSubmit} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div><h2 className="font-semibold text-slate-950">{editing ? "Edit course" : "Create course"}</h2><p className="mt-1 text-sm text-slate-500">Set the course details before building its modules.</p></div>
        <button type="button" onClick={onCancel} disabled={pending} className="text-sm font-semibold text-slate-500">Cancel</button>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Title" value={form.title} onChange={(value) => update("title", value)} required />
        <Field label="Slug" value={form.slug} onChange={(value) => update("slug", value)} required />
        <Field label="Short description" value={form.shortDescription} onChange={(value) => update("shortDescription", value)} required />
        <Field label="Thumbnail URL" value={form.thumbnail ?? ""} onChange={(value) => update("thumbnail", value)} type="url" />
        <Field label="Price" value={String(form.price)} onChange={(value) => update("price", Number(value))} type="number" min="0" step="0.01" required />
        <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Status</span><select value={form.status} onChange={(event) => update("status", event.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-3 text-slate-950 outline-none focus:border-emerald-500"><option value="draft">Draft</option><option value="published">Published</option></select></label>
        <label className="block sm:col-span-2"><span className="mb-2 block text-sm font-semibold text-slate-700">Description</span><textarea value={form.description} onChange={(event) => update("description", event.target.value)} rows={5} required className="w-full rounded-xl border border-slate-300 px-3 py-3 text-slate-950 outline-none focus:border-emerald-500" /></label>
      </div>
      <button type="submit" disabled={pending} className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white disabled:opacity-50">{pending && <Loader2 className="h-4 w-4 animate-spin" />}{editing ? "Save course" : "Create course"}</button>
    </form>
  );
}

function Field({ label, value, onChange, type = "text", min, step, required }: { label: string; value: string; onChange: (value: string) => void; type?: string; min?: string; step?: string; required?: boolean }) {
  return <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span><input type={type} value={value} min={min} step={step} required={required} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-3 text-slate-950 outline-none focus:border-emerald-500" /></label>;
}

function StatusBadge({ status }: { status: Course["status"] }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status === "published" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{status}</span>;
}

function LoadingState() {
  return <div className="flex min-h-56 items-center justify-center rounded-3xl bg-white text-sm text-slate-500"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading courses</div>;
}

function Feedback({ tone, children }: { tone: "success" | "error"; children: string }) {
  return <div role={tone === "error" ? "alert" : "status"} className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-sm ${tone === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{tone === "success" && <Check className="h-4 w-4" />}{children}</div>;
}
