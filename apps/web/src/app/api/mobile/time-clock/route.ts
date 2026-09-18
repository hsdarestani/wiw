import { NextResponse } from "next/server";
import { z } from "zod";
import { getMobileUser } from "@/lib/mobile-auth";
import { clockIn, clockOut, toggleBreak } from "@/lib/time-clock";

const schema = z.object({
  action: z.enum(["CLOCK_IN", "CLOCK_OUT", "TOGGLE_BREAK"]),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  accuracy: z.number().min(0).max(5000).optional(),
});
export async function POST(request: Request) {
  const user = await getMobileUser(request);
  if (!user)
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Ungültige Aktion." }, { status: 400 });
  const result =
    parsed.data.action === "CLOCK_IN"
      ? await clockIn(user, "MOBILE", parsed.data.latitude !== undefined && parsed.data.longitude !== undefined ? { latitude: parsed.data.latitude, longitude: parsed.data.longitude, accuracy: parsed.data.accuracy } : undefined)
      : parsed.data.action === "CLOCK_OUT"
        ? await clockOut(user)
        : await toggleBreak(user);
  if ("error" in result)
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  return NextResponse.json({ entry: result.entry });
}
