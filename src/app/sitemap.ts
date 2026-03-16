import type { MetadataRoute } from "next";

const routes = [
  "",
  "/transportas",
  "/transportas/map",
  "/dalys",
  "/dalys/map",
  "/ikelti",
  "/prisijungti",
  "/registracija",
  "/mano",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return routes.flatMap((route) => [
    {
      url: `https://autoloke.lt${route}`,
      lastModified: now,
      alternates: {
        languages: {
          "lt-LT": `https://autoloke.lt${route}`,
          "da-DK": `https://autoloke.dk${route}`,
        },
      },
    },
    {
      url: `https://autoloke.dk${route}`,
      lastModified: now,
      alternates: {
        languages: {
          "lt-LT": `https://autoloke.lt${route}`,
          "da-DK": `https://autoloke.dk${route}`,
        },
      },
    },
  ]);
}
