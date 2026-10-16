import { cookies } from "next/headers";

export async function readInitialSidebarCollapsed() {
  const cookieStore = await cookies();
  return cookieStore.get("habitix_sidebar")?.value === "collapsed";
}
