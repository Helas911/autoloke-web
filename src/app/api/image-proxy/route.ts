import { NextRequest } from "next/server";

function isAllowedUrl(raw: string) {
  try {
    const url = new URL(raw);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("url") || "";

  if (!raw || !isAllowedUrl(raw)) {
    return new Response("Bad image url", { status: 400 });
  }

  const target = new URL(raw);

  try {
    const res = await fetch(target.toString(), {
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; AutolokeBot/1.0; +https://autoloke.lt)",
        accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        referer: `${target.protocol}//${target.host}/`,
      },
      next: { revalidate: 60 * 60 * 6 },
    });

    if (!res.ok || !res.body) {
      return new Response("Image fetch failed", { status: 404 });
    }

    const headers = new Headers();
    headers.set("Content-Type", res.headers.get("content-type") || "image/jpeg");
    headers.set("Cache-Control", "public, s-maxage=21600, stale-while-revalidate=86400");

    return new Response(res.body, {
      status: 200,
      headers,
    });
  } catch {
    return new Response("Image fetch failed", { status: 404 });
  }
}
