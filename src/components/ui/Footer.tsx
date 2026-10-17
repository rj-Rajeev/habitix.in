"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import {
  getNavigationItem,
  getNavigationItems,
  getNavigationLabel,
} from "@/config/navigation";

const productLinkIds = new Set(["product", "courses", "how-it-works", "download"]);
const legalLinkIds = new Set(["privacy-policy", "terms", "refund-policy"]);

export default function Footer() {
  const footerLinks = getNavigationItems("publicFooter");
  const productLinks = footerLinks.filter((item) => productLinkIds.has(item.id));
  const supportLinks = footerLinks.filter((item) => item.id === "contact");
  const legalLinks = footerLinks.filter((item) => legalLinkIds.has(item.id));
  const home = getNavigationItem("home");

  return (
    <footer className="bg-[#17201e] text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:gap-x-12 lg:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))] lg:gap-10">
          <section className="col-span-2 lg:col-span-1" aria-label="Habitix">
            <Link
              href={home.href}
              aria-label="Habitix home"
              className="inline-flex min-h-11 items-center gap-3 rounded-lg focus-visible:outline-offset-4"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary text-white">
                <Check className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-lg font-bold tracking-[0.08em]">HABITIX</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-300">
              Plan your goals, organize daily tasks, learn through courses, and track your progress.
            </p>
          </section>

          <FooterLinkGroup title="Product" label="Product navigation" links={productLinks} />
          <FooterLinkGroup title="Support" label="Support navigation" links={supportLinks} />
          <FooterLinkGroup title="Legal" label="Legal navigation" links={legalLinks} />
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/15 pt-6 text-sm text-slate-300 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Habitix</p>
          <p>Plan with intention. Make steady progress.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterLinkGroup({
  title,
  label,
  links,
}: {
  title: string;
  label: string;
  links: ReturnType<typeof getNavigationItems>;
}) {
  return (
    <nav aria-label={label}>
      <h2 className="mb-3 text-sm font-semibold tracking-wide text-white">{title}</h2>
      <ul className="space-y-1">
        {links.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className="inline-flex min-h-10 max-w-full items-center rounded-md py-1 text-sm leading-5 text-slate-300 underline-offset-4 transition-colors hover:text-white hover:underline focus-visible:text-white"
            >
              {getNavigationLabel(item, "publicFooter")}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
