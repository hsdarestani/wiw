import { NextResponse } from "next/server";
import { destroyMobileSession } from "@/lib/mobile-auth";

export async function POST(request: Request) {
  await destroyMobileSession(request);
  return NextResponse.json({ ok: true });
}
