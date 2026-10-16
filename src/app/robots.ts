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
        "/profile/",
        "/roadmap/",
        "/more/",
        "/today/",
        "/resources/",
        "/recommendations/",
        "/goals/",
        "/performance/",
        "/people/",
      ],
    },
    sitemap: "https://habitix.in/sitemap.xml",
  };
}
