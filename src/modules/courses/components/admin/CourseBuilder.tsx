"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, Loader2, Pencil, Plus, Save, Trash2 } from "lucide-react";
import AppShell from "@/components/app/AppShell";

type Course = { _id: string; title: string; slug: string; shortDescription: string; description: string; thumbnail?: string; price: number; status: "draft" | "published" };
type Module = { _id: string; courseId: string; title: string; description?: string; order: number };
type Lesson = { _id: string; moduleId: string; title: string; description?: string; order: number; markdownContent?: string; videoUrl?: string; pdfUrl?: string; isFree: boolean };
type ModuleForm = { title: string; description: string; order: number };
type LessonForm = { title: string; description: string; order: number; markdownContent: string; videoUrl: string; pdfUrl: string; isFree: boolean };

const blankModule: ModuleForm = { title: "", description: "", order: 0 };
const blankLesson: LessonForm = { title: "", description: "", order: 0, markdownContent: "", videoUrl: "", pdfUrl: "", isFree: false };

async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success === false) throw new Error(payload?.error?.message || payload?.message || "Request failed");
  return (payload?.data ?? payload) as T;
}

export default function CourseBuilder({ courseId }: { courseId: string }) {
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Record<string, Lesson[]>>({});
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [editingCourse, setEditingCourse] = useState(false);
  const [courseForm, setCourseForm] = useState({ title: "", slug: "", shortDescription: "", description: "", thumbnail: "", price: 0 });
  const [moduleForm, setModuleForm] = useState<ModuleForm | null>(null);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [lessonForm, setLessonForm] = useState<{ moduleId: string; values: LessonForm } | null>(null);
  const [editingLesson, setEditingLesson] = useState<{ moduleId: string; lessonId: string } | null>(null);

  async function loadBuilder() {
    setLoading(true);
    try {
      const [courseData, moduleData] = await Promise.all([
        apiRequest<Course>(`/api/admin/courses/${courseId}`),
        apiRequest<Module[]>(`/api/admin/courses/${courseId}/modules`),
      ]);
      setCourse(courseData);
      setCourseForm({ title: courseData.title, slug: courseData.slug, shortDescription: courseData.shortDescription, description: courseData.description, thumbnail: courseData.thumbnail ?? "", price: courseData.price });
      setModules(moduleData.sort((a, b) => a.order - b.order));
      const lessonEntries = await Promise.all(moduleData.map(async (module) => [module._id, await apiRequest<Lesson[]>(`/api/admin/courses/${courseId}/modules/${module._id}/lessons`)] as const));
      setLessons(Object.fromEntries(lessonEntries));
    } catch (error) {
      setFeedback({ tone: "error", text: error instanceof Error ? error.message : "Unable to load course." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadBuilder(); }, [courseId]);

  async function saveCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending("course"); setFeedback(null);
    try {
      const updated = await apiRequest<Course>(`/api/admin/courses/${courseId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...courseForm, thumbnail: courseForm.thumbnail.trim() || undefined }) });
      setCourse(updated); setEditingCourse(false); setFeedback({ tone: "success", text: "Course details updated." });
    } catch (error) { setFeedback({ tone: "error", text: error instanceof Error ? error.message : "Unable to update course." }); }
    finally { setPending(null); }
  }

  async function togglePublish() {
    if (!course) return;
    setPending("publish"); setFeedback(null);
    try {
      const updated = await apiRequest<Course>(`/api/admin/courses/${courseId}/publish`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: course.status === "published" ? "draft" : "published" }) });
      setCourse(updated); setFeedback({ tone: "success", text: updated.status === "published" ? "Course published." : "Course unpublished." });
    } catch (error) { setFeedback({ tone: "error", text: error instanceof Error ? error.message : "Unable to update status." }); }
    finally { setPending(null); }
  }

  async function saveModule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!moduleForm) return;
    const editingId = editingModuleId;
    const values = moduleForm;
    setPending(editingId ? `module-${editingId}` : "module-new"); setFeedback(null);
    try {
      const url = editingId ? `/api/admin/courses/${courseId}/modules/${editingId}` : `/api/admin/courses/${courseId}/modules`;
      const saved = await apiRequest<Module>(url, { method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      setModules((current) => editingId ? current.map((item) => item._id === saved._id ? saved : item).sort((a, b) => a.order - b.order) : [...current, saved].sort((a, b) => a.order - b.order));
      setModuleForm(null); setEditingModuleId(null); setFeedback({ tone: "success", text: editingId ? "Module updated." : "Module added." });
    } catch (error) { setFeedback({ tone: "error", text: error instanceof Error ? error.message : "Unable to save module." }); }
    finally { setPending(null); }
  }

  function editModule(module: Module) { setEditingModuleId(module._id); setModuleForm({ title: module.title, description: module.description ?? "", order: module.order }); }

  async function deleteModule(module: Module) {
    if (!window.confirm(`Delete ${module.title}? All of its lessons will also be deleted.`)) return;
    setPending(`delete-module-${module._id}`); setFeedback(null);
    try { await apiRequest(`/api/admin/courses/${courseId}/modules/${module._id}`, { method: "DELETE" }); setModules((current) => current.filter((item) => item._id !== module._id)); setLessons((current) => { const next = { ...current }; delete next[module._id]; return next; }); setFeedback({ tone: "success", text: "Module deleted." }); }
    catch (error) { setFeedback({ tone: "error", text: error instanceof Error ? error.message : "Unable to delete module." }); }
    finally { setPending(null); }
  }

  async function saveLesson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!lessonForm) return;
    const { moduleId, values } = lessonForm;
    const lessonId = editingLesson?.lessonId;
    setPending(lessonId ? `lesson-${lessonId}` : `lesson-new-${moduleId}`); setFeedback(null);
    try {
      const url = lessonId ? `/api/admin/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}` : `/api/admin/courses/${courseId}/modules/${moduleId}/lessons`;
      const saved = await apiRequest<Lesson>(url, { method: lessonId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...values, description: values.description.trim() || undefined, markdownContent: values.markdownContent || undefined, videoUrl: values.videoUrl.trim() || undefined, pdfUrl: values.pdfUrl.trim() || undefined }) });
      setLessons((current) => ({ ...current, [moduleId]: (lessonId ? (current[moduleId] ?? []).map((item) => item._id === saved._id ? saved : item) : [...(current[moduleId] ?? []), saved]).sort((a, b) => a.order - b.order) }));
      setLessonForm(null); setEditingLesson(null); setFeedback({ tone: "success", text: lessonId ? "Lesson updated." : "Lesson added." });
    } catch (error) { setFeedback({ tone: "error", text: error instanceof Error ? error.message : "Unable to save lesson." }); }
    finally { setPending(null); }
  }

  function editLesson(moduleId: string, lesson: Lesson) { setEditingLesson({ moduleId, lessonId: lesson._id }); setLessonForm({ moduleId, values: { title: lesson.title, description: lesson.description ?? "", order: lesson.order, markdownContent: lesson.markdownContent ?? "", videoUrl: lesson.videoUrl ?? "", pdfUrl: lesson.pdfUrl ?? "", isFree: lesson.isFree ?? false } }); }

  async function deleteLesson(moduleId: string, lesson: Lesson) {
    if (!window.confirm(`Delete ${lesson.title}?`)) return;
    setPending(`delete-lesson-${lesson._id}`); setFeedback(null);
    try { await apiRequest(`/api/admin/courses/${courseId}/modules/${moduleId}/lessons/${lesson._id}`, { method: "DELETE" }); setLessons((current) => ({ ...current, [moduleId]: (current[moduleId] ?? []).filter((item) => item._id !== lesson._id) })); setFeedback({ tone: "success", text: "Lesson deleted." }); }
    catch (error) { setFeedback({ tone: "error", text: error instanceof Error ? error.message : "Unable to delete lesson." }); }
    finally { setPending(null); }
  }

  async function archiveCourse() {
    if (!course || !window.confirm(`Archive ${course.title}? It will leave the active library and public catalog. Course, module, lesson, enrollment, and progress data will be retained.`)) return;
    setPending("archive");
    try { await apiRequest(`/api/admin/courses/${courseId}`, { method: "DELETE" }); window.location.assign("/admin/courses"); }
    catch (error) { setFeedback({ tone: "error", text: error instanceof Error ? error.message : "Unable to archive course." }); setPending(null); }
  }

  if (loading) return <AppShell eyebrow="Admin" title="Course builder"><Loading /></AppShell>;
  if (!course) return <AppShell eyebrow="Admin" title="Course builder"><Feedback tone="error">Course could not be found.</Feedback></AppShell>;

  return <AppShell eyebrow="Admin" title="Course builder" action={<Link href="/admin/courses" className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700"><ArrowLeft className="h-4 w-4" /> Courses</Link>}>
    <div className="space-y-5">
      {feedback && <Feedback tone={feedback.tone}>{feedback.text}</Feedback>}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-semibold text-slate-950">{course.title}</h2><Status status={course.status} /></div><p className="mt-1 text-sm text-slate-500">{course.shortDescription} · {course.price === 0 ? "Free" : course.price} · /{course.slug}</p></div><div className="flex flex-wrap gap-2"><Link href={`/admin/courses/${courseId}/preview`} className="inline-flex min-h-9 items-center rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700">Preview</Link>{course.status === "published" && <Link href={`/courses/${course.slug}`} target="_blank" className="inline-flex min-h-9 items-center rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700">View live course</Link>}<button type="button" onClick={() => setEditingCourse((value) => !value)} disabled={pending !== null} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 disabled:opacity-50"><Pencil className="h-3.5 w-3.5" /> Edit details</button><button type="button" onClick={() => void togglePublish()} disabled={pending !== null} className="inline-flex min-h-9 items-center gap-1 rounded-lg bg-slate-950 px-3 text-xs font-semibold text-white disabled:opacity-50">{pending === "publish" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{course.status === "published" ? "Unpublish" : "Publish"}</button><button type="button" onClick={() => void archiveCourse()} disabled={pending !== null} className="inline-flex min-h-9 items-center rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-700 disabled:opacity-50">Archive course</button></div></div>
        {editingCourse && <form onSubmit={saveCourse} className="mt-5 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2"><Field label="Title" value={courseForm.title} onChange={(value) => setCourseForm({ ...courseForm, title: value })} required /><Field label="Slug" value={courseForm.slug} onChange={(value) => setCourseForm({ ...courseForm, slug: value })} required /><Field label="Short description" value={courseForm.shortDescription} onChange={(value) => setCourseForm({ ...courseForm, shortDescription: value })} required /><Field label="Thumbnail URL" value={courseForm.thumbnail} onChange={(value) => setCourseForm({ ...courseForm, thumbnail: value })} type="url" /><Field label="Price" value={String(courseForm.price)} onChange={(value) => setCourseForm({ ...courseForm, price: Number(value) })} type="number" min="0" step="0.01" required /><label className="block sm:col-span-2"><span className="mb-2 block text-sm font-semibold text-slate-700">Description</span><textarea value={courseForm.description} onChange={(event) => setCourseForm({ ...courseForm, description: event.target.value })} rows={4} required className="w-full rounded-xl border border-slate-300 px-3 py-3 outline-none focus:border-emerald-500" /></label><button type="submit" disabled={pending !== null} className="inline-flex min-h-10 w-fit items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white disabled:opacity-50"><Save className="h-4 w-4" /> Save details</button></form>}
      </section>

      <div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold text-slate-950">Course structure</h2><p className="text-sm text-slate-500">Use numeric order values to arrange content.</p></div><button type="button" onClick={() => { setEditingModuleId(null); setModuleForm({ ...blankModule }); }} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white"><Plus className="h-4 w-4" /> Add module</button></div>
      {moduleForm && <ModuleForm values={moduleForm} editing={Boolean(editingModuleId)} pending={pending !== null} onChange={setModuleForm} onCancel={() => { setModuleForm(null); setEditingModuleId(null); }} onSubmit={saveModule} />}
      {modules.length === 0 ? <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">No modules yet. Add the first module to begin.</div> : <div className="space-y-4">{modules.map((module) => <ModuleCard key={module._id} module={module} lessons={lessons[module._id] ?? []} pending={pending} onEdit={() => editModule(module)} onDelete={() => void deleteModule(module)} onAddLesson={() => { setEditingLesson(null); setLessonForm({ moduleId: module._id, values: { ...blankLesson, order: (lessons[module._id] ?? []).length } }); }} onEditLesson={(lesson) => editLesson(module._id, lesson)} onDeleteLesson={(lesson) => void deleteLesson(module._id, lesson)} />)}</div>}
      {lessonForm && <LessonForm values={lessonForm.values} pending={pending !== null} onChange={(values) => setLessonForm({ ...lessonForm, values })} onCancel={() => { setLessonForm(null); setEditingLesson(null); }} onSubmit={saveLesson} />}
    </div>
  </AppShell>;
}

function ModuleCard({ module, lessons, pending, onEdit, onDelete, onAddLesson, onEditLesson, onDeleteLesson }: { module: Module; lessons: Lesson[]; pending: string | null; onEdit: () => void; onDelete: () => void; onAddLesson: () => void; onEditLesson: (lesson: Lesson) => void; onDeleteLesson: (lesson: Lesson) => void }) {
  return <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex items-center gap-2"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">Module {module.order}</span><h3 className="font-semibold text-slate-950">{module.title}</h3></div>{module.description && <p className="mt-2 text-sm text-slate-500">{module.description}</p>}</div><div className="flex gap-2"><button type="button" onClick={onEdit} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700"><Pencil className="h-3.5 w-3.5" /> Edit</button><button type="button" onClick={onDelete} disabled={pending !== null} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-700 disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" /> Delete</button></div></div><div className="mt-5 border-t border-slate-100 pt-4"><div className="mb-3 flex items-center justify-between"><h4 className="text-sm font-semibold text-slate-700">Lessons</h4><button type="button" onClick={onAddLesson} className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"><Plus className="h-3.5 w-3.5" /> Add lesson</button></div>{lessons.length === 0 ? <p className="text-sm text-slate-400">No lessons yet.</p> : <div className="space-y-2">{lessons.map((lesson) => <div key={lesson._id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{lesson.order}. {lesson.title}</p>{lesson.description && <p className="truncate text-xs text-slate-500">{lesson.description}</p>}</div><div className="flex shrink-0 gap-2"><button type="button" onClick={() => onEditLesson(lesson)} className="text-xs font-semibold text-slate-600">Edit</button><button type="button" onClick={() => onDeleteLesson(lesson)} disabled={pending !== null} className="text-xs font-semibold text-red-600 disabled:opacity-50">Delete</button></div></div>)}</div>}</div></section>;
}

function ModuleForm({ values, editing, pending, onChange, onCancel, onSubmit }: { values: ModuleForm; editing: boolean; pending: boolean; onChange: (values: ModuleForm) => void; onCancel: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) { return <form onSubmit={onSubmit} className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4"><div className="grid gap-3 sm:grid-cols-[1fr_1fr_120px]"><Field label="Title" value={values.title} onChange={(value) => onChange({ ...values, title: value })} required /><Field label="Description" value={values.description} onChange={(value) => onChange({ ...values, description: value })} /><Field label="Order" value={String(values.order)} onChange={(value) => onChange({ ...values, order: Number(value) })} type="number" min="0" required /></div><FormActions pending={pending} onCancel={onCancel} label={editing ? "Save module" : "Add module"} /></form>; }

function LessonForm({ values, pending, onChange, onCancel, onSubmit }: { values: LessonForm; pending: boolean; onChange: (values: LessonForm) => void; onCancel: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) { const update = (key: keyof LessonForm, value: string | number | boolean) => onChange({ ...values, [key]: value }); return <form onSubmit={onSubmit} className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4"><h3 className="font-semibold text-slate-950">{values.title ? "Edit lesson" : "Add lesson"}</h3><div className="mt-4 grid gap-3 sm:grid-cols-2"><Field label="Title" value={values.title} onChange={(value) => update("title", value)} required /><Field label="Order" value={String(values.order)} onChange={(value) => update("order", Number(value))} type="number" min="0" required /><Field label="Video URL" value={values.videoUrl} onChange={(value) => update("videoUrl", value)} type="url" /><Field label="PDF URL" value={values.pdfUrl} onChange={(value) => update("pdfUrl", value)} type="url" /><Field label="Description" value={values.description} onChange={(value) => update("description", value)} /><label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Lesson access</span><select value={values.isFree ? "free" : "paid"} onChange={(event) => update("isFree", event.target.value === "free")} className="w-full rounded-xl border border-slate-300 px-3 py-3"><option value="paid">Enrolled learners</option><option value="free">Free preview</option></select></label><label className="block sm:col-span-2"><span className="mb-2 block text-sm font-semibold text-slate-700">Markdown content</span><textarea value={values.markdownContent} onChange={(event) => update("markdownContent", event.target.value)} rows={6} className="w-full rounded-xl border border-slate-300 px-3 py-3 outline-none focus:border-emerald-500" /></label></div><FormActions pending={pending} onCancel={onCancel} label={values.title ? "Save lesson" : "Add lesson"} /></form>; }

function FormActions({ pending, onCancel, label }: { pending: boolean; onCancel: () => void; label: string }) { return <div className="mt-4 flex gap-2"><button type="submit" disabled={pending} className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-slate-950 px-3 text-xs font-semibold text-white disabled:opacity-50">{pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{label}</button><button type="button" onClick={onCancel} disabled={pending} className="min-h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 disabled:opacity-50">Cancel</button></div>; }

function Field({ label, value, onChange, type = "text", min, step, required }: { label: string; value: string; onChange: (value: string) => void; type?: string; min?: string; step?: string; required?: boolean }) { return <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span><input type={type} value={value} min={min} step={step} required={required} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-3 text-slate-950 outline-none focus:border-emerald-500" /></label>; }
function Status({ status }: { status: Course["status"] }) { return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status === "published" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{status}</span>; }
function Loading() { return <div className="flex min-h-56 items-center justify-center rounded-3xl bg-white text-sm text-slate-500"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading course</div>; }
function Feedback({ tone, children }: { tone: "success" | "error"; children: string }) { return <div role={tone === "error" ? "alert" : "status"} className={`rounded-xl border px-3 py-3 text-sm ${tone === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{children}</div>; }
