"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import AppShell from "@/components/app/AppShell";

export default function NewCoursePage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function createDraft() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/courses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: "Untitled course", slug: `untitled-course-${Date.now()}`, shortDescription: "Add a short description", description: "Add a course description.", price: 0, status: "draft" }) });
      const payload = await response.json();
      if (!response.ok || payload?.success === false) throw new Error(payload?.error?.message || "Unable to create course.");
      const course = payload?.data ?? payload;
      window.location.assign(`/admin/courses/${course._id}`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to create course."); setBusy(false); }
  }
  return <AppShell eyebrow="Admin · Courses" title="Create course" action={<Link href="/admin/courses" className="text-sm font-semibold text-slate-600">Back to Courses</Link>}>
    <p className="mb-6 max-w-2xl text-sm text-slate-600">Build a course directly in Habitix or import a complete course from the supported CSV format.</p>
    {error && <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <div className="grid gap-4 sm:grid-cols-2">
      <section className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-lg font-semibold text-slate-950">Create manually</h2><p className="mt-2 text-sm text-slate-600">Start with a draft and build the curriculum inside Habitix.</p><button type="button" disabled={busy} onClick={() => void createDraft()} className="mt-6 inline-flex min-h-10 items-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white disabled:opacity-50">{busy && <Loader2 className="h-4 w-4 animate-spin" />}Create draft</button></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-lg font-semibold text-slate-950">Import CSV</h2><p className="mt-2 text-sm text-slate-600">Create a complete course from the supported CSV format.</p><Link href="/admin/courses/import" className="mt-6 inline-flex min-h-10 items-center rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700">Import CSV</Link></section>
    </div>
  </AppShell>;
}
