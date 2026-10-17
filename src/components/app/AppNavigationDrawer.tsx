"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type RefObject } from "react";
import { X } from "lucide-react";
import { getNavigationItems, isNavigationItemActive } from "@/config/navigation";
import { navigationIcons } from "./navigation-icons";

const DRAWER_TRANSITION_MS = 250;

type AppNavigationDrawerProps = {
  open: boolean;
  onClose: () => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
};

export default function AppNavigationDrawer({
  open,
  onClose,
  triggerRef,
}: AppNavigationDrawerProps) {
  const pathname = usePathname();
  const drawerItems = getNavigationItems("mobileDrawer");
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(open);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setVisible(false);
      const frame = window.requestAnimationFrame(() => setVisible(true));
      return () => window.cancelAnimationFrame(frame);
    }

    setVisible(false);
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const timeout = window.setTimeout(
      () => setMounted(false),
      reducedMotion ? 0 : DRAWER_TRANSITION_MS
    );
    return () => window.clearTimeout(timeout);
  }, [open]);

  useEffect(() => {
    if (!open || !mounted) return;

    const previouslyFocused = document.activeElement;
    const triggerElement = triggerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable?.length) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      const returnTarget =
        previouslyFocused instanceof HTMLElement
          ? previouslyFocused
          : triggerElement;
      if (returnTarget?.isConnected) returnTarget.focus();
    };
  }, [open, mounted, onClose, triggerRef]);

  if (!mounted) return null;

  return (
    <div
      aria-hidden={!open}
      inert={!open}
      className={`fixed inset-0 z-50 bg-black/40 transition-opacity duration-[250ms] ease-out motion-reduce:transition-none md:hidden ${
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        id="mobile-app-navigation"
        role="dialog"
        aria-modal={open}
        aria-labelledby="app-navigation-title"
        tabIndex={-1}
        className={`mr-auto flex h-full max-h-[100dvh] w-[min(22rem,calc(100vw-1rem))] flex-col overflow-y-auto border-r border-border bg-surface p-4 pt-20 shadow-xl transition-transform duration-[250ms] ease-out motion-reduce:transition-none ${
          visible ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-border pb-3">
          <h2 id="app-navigation-title" className="text-lg font-semibold text-text-primary">
            Navigation
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-text-secondary hover:bg-surface-subtle hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        <nav aria-label="Application">
          <ul className="space-y-1">
            {drawerItems.map((item) => {
              const Icon = item.icon ? navigationIcons[item.icon] : null;
              const active = isNavigationItemActive(pathname, item.id, "mobileDrawer");

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={onClose}
                    className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary ${
                      active
                        ? "bg-brand-primary text-white"
                        : "text-text-secondary hover:bg-surface-subtle hover:text-text-primary"
                    }`}
                  >
                    {Icon && <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />}
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </section>
    </div>
  );
}
