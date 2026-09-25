import Link from "next/link";
import CourseCsvImport from "@/components/admin/CourseCsvImport";

export const metadata = {
  title: "Import Course | Habitix Admin",
  description: "Import a course and its learning content from CSV.",
};

export default function CourseCsvImportPage() {
  return <main className="min-h-[calc(100vh-80px)] bg-background px-4 py-8 sm:px-6">
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-primary">Admin · Courses</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-text-primary">Import Course</h1></div>
        <Link href="/admin/courses" className="ui-button" data-variant="secondary">Back to Courses</Link>
      </div>
      <CourseCsvImport />
    </div>
  </main>;
}
