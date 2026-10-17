import Link from "next/link";
import { ChevronRight } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import {
  getNavigationItems,
  getNavigationLabel,
  navigationGroupLabels,
} from "@/config/navigation";
import { navigationIcons } from "@/components/app/navigation-icons";

export default function MorePage() {
  const links = getNavigationItems("morePage");
  const groups = Array.from(new Set(links.map((item) => item.group))).map((group) => ({
    group,
    links: links.filter((item) => item.group === group),
  }));

  return (
    <AppShell eyebrow="Menu" title="More">
      <div className="space-y-6">
        {groups.map(({ group, links: groupLinks }) => (
          <section key={group} aria-labelledby={`more-group-${group}`}>
            <h2 id={`more-group-${group}`} className="mb-3 text-sm font-semibold text-text-secondary">
              {navigationGroupLabels[group]}
            </h2>
            <div className="space-y-3">
              {groupLinks.map((item) => {
                const Icon = item.icon ? navigationIcons[item.icon] : null;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="flex min-h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    {Icon && <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700"><Icon className="h-5 w-5" aria-hidden="true" /></span>}
                    <span className="min-w-0 flex-1 font-semibold text-slate-950">
                      {getNavigationLabel(item, "morePage")}
                    </span>
                    <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
