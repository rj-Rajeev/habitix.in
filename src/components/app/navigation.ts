import {
  BarChart3,
  CalendarCheck,
  Lightbulb,
  MoreHorizontal,
  Target,
  type LucideIcon,
} from "lucide-react";

export type AppNavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const appNavigationItems: AppNavigationItem[] = [
  { href: "/today", label: "Today", icon: CalendarCheck },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/performance", label: "Stats", icon: BarChart3 },
  { href: "/recommendations", label: "Ideas", icon: Lightbulb },
  { href: "/more", label: "More", icon: MoreHorizontal },
];

export function isAppNavigationItemActive(pathname: string, href: string) {
  return pathname === href || (href !== "/today" && pathname.startsWith(href));
}
