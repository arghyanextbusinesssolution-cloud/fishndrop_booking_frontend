import type { MetadataRoute } from "next";

/** /robots.txt — lets search engines crawl the public site, keeps private areas out, points to the sitemap. */
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.tropica.nyc").replace(/\/+$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/promoter/register"],
        disallow: [
          "/admin",
          "/user",
          "/employee",
          "/promoter/",
          "/login",
          "/register",
          "/admin-login",
          "/employee-login",
          "/staff-login",
          "/invite/",
          "/tickets/",
          "/upload",
          "/booking/",
          "/seo",
          "/seo-login"
        ]
      }
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE
  };
}
