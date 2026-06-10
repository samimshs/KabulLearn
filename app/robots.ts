import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/educator", "/admin", "/dashboard", "/api/", "/auth/"]
      }
    ],
    sitemap: "https://kabullearn.com/sitemap.xml"
  };
}
