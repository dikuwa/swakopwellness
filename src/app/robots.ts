import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://swakopwellness.vercel.app";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard/", "/api/", "/chat/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
