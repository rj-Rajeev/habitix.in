import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/admin/",
        "/dashboard/",
        "/dashboard",
        "/profile/",
        "/profile",
        "/roadmap/",
        "/more",
        "/more/",
        "/today/",
        "/today",
        "/resources/",
        "/resources",
        "/recommendations/",
        "/recommendations",
        "/goals/",
        "/goals",
        "/performance/",
        "/performance",
        "/people/",
      ],
    },
    sitemap: "https://habitix.in/sitemap.xml",
  };
}
