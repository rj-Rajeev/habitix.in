import Link from "next/link";
import { BarChart3, BookOpen, Bot, ChevronRight, Lightbulb, Plus } from "lucide-react";
import AppShell from "@/components/app/AppShell";

const links = [
  { href: "/goals/new", label: "Create goal", icon: Plus },
  { href: "/performance", label: "Performance", icon: BarChart3 },
  { href: "/recommendations", label: "Recommendations", icon: Lightbulb },
  { href: "/resources", label: "Resources", icon: BookOpen },
  { href: "/dashboard/goal-chat", label: "AI roadmap", icon: Bot },
];

export default function MorePage() {
  return (
    <AppShell eyebrow="Menu" title="More">
      <div className="space-y-3">
        {links.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <Icon className="h-5 w-5" />
              </span>
              <span className="flex-1 font-semibold text-slate-950">
                {item.label}
              </span>
              <ChevronRight className="h-5 w-5 text-slate-400" />
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
