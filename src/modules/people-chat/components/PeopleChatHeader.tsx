"use client";

import Link from "next/link";
import { Check } from "@mui/icons-material";

export default function PeopleChatHeader() {
  return (
    <header className="h-14 shrink-0 border-b border-border bg-surface">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          aria-label="Habitix home"
          className="inline-flex min-h-11 items-center gap-2.5 rounded-control pr-2 text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary text-white">
            <Check aria-hidden="true" fontSize="small" />
          </span>
          <span className="text-base font-bold tracking-wide">Habitix</span>
        </Link>

        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary sm:text-sm">
          People Chat
        </span>
      </div>
    </header>
  );
}
