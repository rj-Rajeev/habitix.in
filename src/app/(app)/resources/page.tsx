import Link from "next/link";
import { BookOpen, Code2, ExternalLink, Video } from "lucide-react";
import AppShell from "@/components/app/AppShell";

const resources = [
  {
    title: "DSA practice",
    description: "Use this area for LeetCode, notes, and topic links from imported sheets.",
    href: "https://leetcode.com/problemset/",
    icon: Code2,
  },
  {
    title: "Backend revision",
    description: "Keep Node.js, database, API, and system design notes close to your plan.",
    href: "https://developer.mozilla.org/",
    icon: BookOpen,
  },
  {
    title: "Mock interview prep",
    description: "Review answers, confidence notes, and failure points before sessions.",
    href: "https://www.pramp.com/",
    icon: Video,
  },
];

export default function ResourcesPage() {
  return (
    <AppShell eyebrow="Library" title="Resources">
      <div className="space-y-4">
        {resources.map((resource) => {
          const Icon = resource.icon;
          return (
            <a
              key={resource.title}
              href={resource.href}
              target="_blank"
              rel="noreferrer"
              className="block rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-semibold text-slate-950">
                      {resource.title}
                    </h2>
                    <ExternalLink className="h-4 w-4 text-slate-400" />
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {resource.description}
                  </p>
                </div>
              </div>
            </a>
          );
        })}

        <Link
          href="/recommendations"
          className="block rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white"
        >
          View recommendations
        </Link>
      </div>
    </AppShell>
  );
}
