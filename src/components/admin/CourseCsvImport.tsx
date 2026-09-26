"use client";

import { useState } from "react";
import Link from "next/link";
import { Alert, Button, Card } from "@/components/ui";
import { COURSE_CSV_HEADERS, validateCourseCsv, type CourseCsvIssue, type CourseImportData } from "@/lib/course-csv";

type ImportedCourse = { _id: string; title: string };
type ImportResult = { course: ImportedCourse; moduleCount: number; lessonCount: number; freeLessonCount: number };

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function downloadTemplate() {
  const example = [
    ["Practical Node.js", "practical-nodejs", "Build useful Node.js skills", "A concise example course for learning the import format.", "0", "draft", "1", "Node.js basics", "Start with core concepts.", "1", "Welcome", "A short introduction.", "article", "# Welcome\n\nThis is a sample lesson.\n\n- Learn the runtime\n- Build a small app", "", "", "true"],
    ["Practical Node.js", "practical-nodejs", "Build useful Node.js skills", "A concise example course for learning the import format.", "0", "draft", "1", "Node.js basics", "Start with core concepts.", "2", "First exercise", "Practice with a small example.", "article", "# Exercise\n\nTry the next step.", "https://example.com/video", "", "false"],
  ];
  const csv = [COURSE_CSV_HEADERS.join(","), ...example.map((row) => row.map(csvCell).join(","))].join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "habitix-course-import-template.csv";
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function readResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success === false) {
    const details = payload?.error?.details;
    const detailText = Array.isArray(details)
      ? details.map((item: CourseCsvIssue) => `${item.row ? `Row ${item.row}: ` : ""}${item.message}`).join("\n")
      : "";
    throw new Error([payload?.error?.message || "Unable to process this CSV.", detailText].filter(Boolean).join("\n"));
  }
  return payload.data as T;
}

export default function CourseCsvImport() {
  const [fileName, setFileName] = useState("");
  const [csv, setCsv] = useState("");
  const [preview, setPreview] = useState<CourseImportData | null>(null);
  const [issues, setIssues] = useState<CourseCsvIssue[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [imported, setImported] = useState<ImportResult | null>(null);

  async function selectFile(file?: File) {
    setFileName(file?.name ?? "");
    setCsv("");
    setPreview(null);
    setIssues([]);
    setError("");
    setImported(null);
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Choose a .csv file.");
      return;
    }
    if (file.size > 10_000_000) {
      setError("CSV file must be smaller than 10 MB.");
      return;
    }

    setBusy(true);
    try {
      const source = await file.text();
      setCsv(source);
      const local = validateCourseCsv(source);
      if (!local.data) {
        setIssues(local.issues);
        return;
      }
      const serverResult = await readResponse<{ data: CourseImportData | null; issues: CourseCsvIssue[] }>(
        await fetch("/api/admin/courses/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "preview", csv: source }),
        })
      );
      setIssues(serverResult.issues);
      setPreview(serverResult.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to read this CSV.");
    } finally {
      setBusy(false);
    }
  }

  async function importCourse() {
    if (!csv || !preview || issues.length || busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await readResponse<ImportResult>(
        await fetch("/api/admin/courses/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "import", csv }),
        })
      );
      window.location.assign(`/admin/courses/${result.course._id}`);
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Unable to import this course.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="mx-auto max-w-4xl space-y-5">
    <header><p className="text-sm font-medium text-text-secondary">Add a complete course and its learning content in one import.</p></header>
    {imported ? <Card className="p-6 sm:p-8"><Alert tone="success">Course imported successfully.</Alert><h2 className="mt-5 text-xl font-semibold">{imported.course.title}</h2><p className="mt-2 text-sm text-text-secondary">{imported.moduleCount} modules · {imported.lessonCount} lessons</p><div className="mt-6 flex flex-wrap gap-2"><Link href={`/admin/courses/${imported.course._id}`} className="ui-button" data-variant="primary">View Course</Link><Link href="/admin/courses" className="ui-button" data-variant="secondary">Back to Courses</Link></div></Card> : <>
      <Card className="space-y-5 p-5 sm:p-6">
        <div><label htmlFor="course-csv" className="block text-sm font-semibold text-text-primary">Choose CSV</label><p className="mt-1 text-sm text-text-secondary">Upload one CSV containing a single course, its modules, and lessons.</p><input id="course-csv" type="file" accept=".csv,text/csv" disabled={busy} onChange={(event) => void selectFile(event.target.files?.[0])} className="mt-3 block w-full rounded-control border border-border bg-surface p-3 text-sm file:mr-3 file:rounded-control file:border-0 file:bg-surface-subtle file:px-3 file:py-2 file:text-sm file:font-semibold" />{fileName && <p className="mt-2 text-xs text-text-muted">Selected: {fileName}</p>}</div>
        <div className="flex flex-wrap items-center gap-3"><Button type="button" variant="secondary" onClick={downloadTemplate}>Download CSV Template</Button>{busy && <span className="text-sm text-text-secondary">Validating…</span>}</div>
      </Card>

      {error && <Alert tone="error" className="whitespace-pre-line">{error}</Alert>}
      {issues.length > 0 && <Card className="p-5"><h2 className="font-semibold text-text-primary">CSV cannot be imported</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-text-secondary">{issues.map((issue, index) => <li key={`${issue.row ?? "file"}-${index}`}>{issue.row ? `Row ${issue.row}: ` : ""}{issue.message}</li>)}</ul></Card>}

      {preview && issues.length === 0 && <>
        <Card className="p-5 sm:p-6"><h2 className="text-lg font-semibold text-text-primary">{preview.course.title}</h2><div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4"><Summary label="Modules" value={String(preview.modules.length)} /><Summary label="Lessons" value={String(preview.lessonCount)} /><Summary label="Free lessons" value={String(preview.freeLessonCount)} /><Summary label="Paid lessons" value={String(preview.lessonCount - preview.freeLessonCount)} /><Summary label="Status" value={preview.course.status === "draft" ? "Draft" : "Published"} /><Summary label="Price" value={String(preview.course.price)} /></div></Card>
        <Card className="p-5 sm:p-6"><h2 className="font-semibold text-text-primary">Course structure</h2><ol className="mt-4 space-y-4">{preview.modules.map((module) => <li key={module.order}><p className="font-medium text-text-primary">{String(module.order).padStart(2, "0")}. {module.title}</p>{module.description && <p className="mt-1 text-sm text-text-secondary">{module.description}</p>}<ol className="mt-2 space-y-1 pl-5">{module.lessons.map((lesson) => <li key={`${module.order}-${lesson.order}`} className="text-sm text-text-secondary">{String(lesson.order).padStart(2, "0")}. {lesson.title}{lesson.isFree ? <span className="ml-2 text-xs text-brand-primary">Free</span> : null}</li>)}</ol></li>)}</ol></Card>
      </>}

      <div className="flex flex-wrap justify-end gap-2"><Link href="/admin/courses" className="ui-button" data-variant="secondary">Cancel</Link><Button type="button" disabled={!preview || issues.length > 0 || busy} loading={busy} onClick={() => void importCourse()}>Import Course</Button></div>
    </>}
  </div>;
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs text-text-muted">{label}</p><p className="mt-1 font-semibold capitalize text-text-primary">{value}</p></div>;
}
