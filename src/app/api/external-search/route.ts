import { NextRequest, NextResponse } from "next/server";
import { searchExternalListings, type ExternalSection } from "@/lib/externalAggregator";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() || "";
  const brand = request.nextUrl.searchParams.get("brand")?.trim() || "";
  const model = request.nextUrl.searchParams.get("model")?.trim() || "";
  const city = request.nextUrl.searchParams.get("city")?.trim() || "";
  const section = (request.nextUrl.searchParams.get("section") || "transportas") as ExternalSection;
  const category = request.nextUrl.searchParams.get("category") || undefined;

  if (!q) {
    return NextResponse.json([]);
  }

  const items = await searchExternalListings({
    query: q,
    brand,
    model,
    city,
    section: section === "dalys" ? "dalys" : "transportas",
    category,
  });

  return NextResponse.json(items, {
    headers: {
      "Cache-Control": "s-maxage=900, stale-while-revalidate=1800",
    },
  });
}
