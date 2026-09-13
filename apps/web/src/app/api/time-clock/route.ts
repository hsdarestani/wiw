import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { clockIn, clockOut, toggleBreak } from "@/lib/time-clock";

const schema = z.object({
  action: z.enum(["CLOCK_IN", "CLOCK_OUT", "TOGGLE_BREAK"]),
});
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Ungültige Aktion." }, { status: 400 });
  const result =
    parsed.data.action === "CLOCK_IN"
      ? await clockIn(user, "WEB")
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
