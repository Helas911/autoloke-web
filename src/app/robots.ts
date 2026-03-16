import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: ["https://autoloke.lt/sitemap.xml", "https://autoloke.dk/sitemap.xml"],
    host: "https://autoloke.lt",
  };
}
