import { NextResponse } from "next/server";
export async function POST() {
  return NextResponse.json({ error: "Mokėjimai patvirtinami tik per Stripe." }, { status: 410 });
}
