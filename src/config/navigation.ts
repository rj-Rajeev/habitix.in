export type NavigationIconName =
  | "Activity"
  | "BarChart3"
  | "BookOpen"
  | "CalendarCheck"
  | "CircleUserRound"
  | "Lightbulb"
  | "MoreHorizontal"
  | "Sparkles"
  | "Target";

export type NavigationSurface =
  | "brand"
  | "publicNavbar"
  | "publicAuth"
  | "publicFooter"
  | "desktopSidebar"
  | "mobileBottomBar"
  | "mobileDrawer"
  | "mobileMore"
  | "desktopMore"
  | "morePage";

export type NavigationGroup =
  | "account"
  | "insights"
  | "learning"
  | "marketing"
  | "planning"
  | "primary"
  | "support";

export const navigationGroupLabels: Record<NavigationGroup, string> = {
  account: "Account",
  insights: "Insights",
  learning: "Learning",
  marketing: "Product",
  planning: "Planning",
  primary: "Main navigation",
  support: "Support",
};

type NavigationItemConfig = {
  id: string;
  label: string;
  href: string;
  icon?: NavigationIconName;
  group: NavigationGroup;
  activeMatch: "none" | "exact" | "section";
  surfaces: Partial<Record<NavigationSurface, { order: number; label?: string }>>;
};

export const navigationConfig: readonly NavigationItemConfig[] = [
  {
    id: "home",
    label: "HABITIX",
    href: "/",
    group: "marketing",
    activeMatch: "none",
    surfaces: { brand: { order: 1 } },
  },
  {
    id: "product",
    label: "Product",
    href: "/features",
    group: "marketing",
    activeMatch: "none",
    surfaces: {
      publicNavbar: { order: 1 },
      publicFooter: { order: 1, label: "Features" },
    },
  },
  {
    id: "courses",
    label: "Courses",
    href: "/courses",
    icon: "BookOpen",
    group: "learning",
    activeMatch: "section",
    surfaces: {
      publicNavbar: { order: 2 },
      desktopSidebar: { order: 6 },
      mobileDrawer: { order: 6 },
      mobileMore: { order: 1 },
      morePage: { order: 1 },
    },
  },
  {
    id: "how-it-works",
    label: "How it works",
    href: "/#how-it-works",
    group: "marketing",
    activeMatch: "none",
    surfaces: { publicNavbar: { order: 3 } },
  },
  {
    id: "sign-in",
    label: "Sign in",
    href: "/signin",
    group: "marketing",
    activeMatch: "none",
    surfaces: { publicAuth: { order: 1 } },
  },
  {
    id: "get-started",
    label: "Get Started",
    href: "/signup",
    group: "marketing",
    activeMatch: "none",
    surfaces: { publicAuth: { order: 2 } },
  },
  {
    id: "download",
    label: "Download",
    href: "/download",
    group: "marketing",
    activeMatch: "none",
    surfaces: { publicFooter: { order: 2 } },
  },
  {
    id: "privacy-policy",
    label: "Privacy Policy",
    href: "/privacy-policy",
    group: "support",
    activeMatch: "none",
    surfaces: { publicFooter: { order: 1 } },
  },
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: "Activity",
    group: "primary",
    activeMatch: "section",
    surfaces: {
      desktopSidebar: { order: 1 },
      mobileDrawer: { order: 1 },
    },
  },
  {
    id: "today",
    label: "Today",
    href: "/today",
    icon: "CalendarCheck",
    group: "primary",
    activeMatch: "exact",
    surfaces: {
      desktopSidebar: { order: 2 },
      mobileBottomBar: { order: 1 },
      mobileDrawer: { order: 2 },
    },
  },
  {
    id: "goals",
    label: "Goals",
    href: "/goals",
    icon: "Target",
    group: "primary",
    activeMatch: "section",
    surfaces: {
      desktopSidebar: { order: 3 },
      mobileBottomBar: { order: 2 },
      mobileDrawer: { order: 3 },
    },
  },
  {
    id: "stats",
    label: "Stats",
    href: "/performance",
    icon: "BarChart3",
    group: "insights",
    activeMatch: "section",
    surfaces: {
      desktopSidebar: { order: 4 },
      mobileBottomBar: { order: 3 },
      mobileDrawer: { order: 4 },
      morePage: { order: 5, label: "Performance" },
    },
  },
  {
    id: "ideas",
    label: "Ideas",
    href: "/recommendations",
    icon: "Lightbulb",
    group: "insights",
    activeMatch: "section",
    surfaces: {
      desktopSidebar: { order: 5 },
      mobileBottomBar: { order: 4 },
      mobileDrawer: { order: 5 },
      morePage: { order: 6, label: "Recommendations" },
    },
  },
  {
    id: "more",
    label: "More",
    href: "/more",
    icon: "MoreHorizontal",
    group: "primary",
    activeMatch: "exact",
    surfaces: {
      desktopSidebar: { order: 7 },
      mobileBottomBar: { order: 5 },
      mobileDrawer: { order: 7 },
    },
  },
  {
    id: "profile",
    label: "Profile",
    href: "/profile",
    icon: "CircleUserRound",
    group: "account",
    activeMatch: "exact",
    surfaces: {
      desktopMore: { order: 1 },
      mobileMore: { order: 2 },
      morePage: { order: 3 },
    },
  },
  {
    id: "create-goal",
    label: "Create an AI Goal",
    href: "/goals/new",
    icon: "Sparkles",
    group: "planning",
    activeMatch: "exact",
    surfaces: { morePage: { order: 2 } },
  },
  {
    id: "resources",
    label: "Resources",
    href: "/resources",
    icon: "BookOpen",
    group: "learning",
    activeMatch: "exact",
    surfaces: {
      desktopMore: { order: 2 },
      mobileMore: { order: 3 },
      morePage: { order: 2 },
    },
  },
];

export type NavigationItem = (typeof navigationConfig)[number];

export function getNavigationItems(surface: NavigationSurface) {
  return navigationConfig
    .filter((item) => item.surfaces[surface] !== undefined)
    .sort((left, right) => left.surfaces[surface]!.order - right.surfaces[surface]!.order);
}

export function getNavigationItem(id: string) {
  const item = navigationConfig.find((candidate) => candidate.id === id);
  if (!item) throw new Error(`Unknown navigation item: ${id}`);
  return item;
}

export function getNavigationLabel(item: NavigationItem, surface: NavigationSurface) {
  return item.surfaces[surface]?.label ?? item.label;
}

function normalizePath(path: string) {
  const pathname = path.split(/[?#]/, 1)[0];
  if (!pathname || pathname === "/") return "/";
  return `/${pathname.split("/").filter(Boolean).join("/")}`;
}

function itemMatchesPath(pathname: string, item: NavigationItem) {
  if (item.activeMatch === "none") return false;

  const path = normalizePath(pathname);
  const hrefPath = normalizePath(item.href);
  if (path === hrefPath) return true;
  return item.activeMatch === "section" && hrefPath !== "/" && path.startsWith(`${hrefPath}/`);
}

export function isNavigationItemActive(
  pathname: string,
  itemId: string,
  surface: NavigationSurface
) {
  const item = getNavigationItem(itemId);
  if (itemMatchesPath(pathname, item)) return true;
  if (itemId !== "more") return false;

  const relatedSurface =
    surface === "mobileBottomBar" || surface === "mobileDrawer"
      ? "mobileMore"
      : surface === "desktopSidebar"
        ? "desktopMore"
        : null;

  return relatedSurface
    ? getNavigationItems(relatedSurface).some((candidate) => itemMatchesPath(pathname, candidate))
    : false;
}
