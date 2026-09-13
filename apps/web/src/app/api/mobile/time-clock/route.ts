import { NextResponse } from "next/server";
import { z } from "zod";
import { getMobileUser } from "@/lib/mobile-auth";
import { clockIn, clockOut } from "@/lib/time-clock";

const schema = z.object({ action: z.enum(["CLOCK_IN", "CLOCK_OUT"]) });
export async function POST(request: Request) {
  const user = await getMobileUser(request);
  if (!user)
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Ungültige Aktion." }, { status: 400 });
  const result =
    parsed.data.action === "CLOCK_IN"
      ? await clockIn(user, "MOBILE")
      : await clockOut(user);
  if ("error" in result)
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  return NextResponse.json({ entry: result.entry });
}
