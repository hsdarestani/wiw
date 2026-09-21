import { prisma } from "@/lib/prisma";

type PushData = Record<string, string>;

export async function sendPush(userIds: string[], title: string, body: string, data: PushData = {}) {
  if (!userIds.length) return;
  const devices = await prisma.pushDevice.findMany({
    where: { userId: { in: userIds }, enabled: true },
    select: { id: true, token: true },
  });
  if (!devices.length) return;
  const accessToken = process.env.EXPO_ACCESS_TOKEN;
  for (let offset = 0; offset < devices.length; offset += 100) {
    const chunk = devices.slice(offset, offset + 100);
    try {
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
          ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(chunk.map((device) => ({ to: device.token, sound: "default", title, body, data }))),
      });
      if (!response.ok) continue;
      const result = await response.json() as { data?: Array<{ status: string; details?: { error?: string } }> };
      const invalidIds = chunk.filter((device, index) => result.data?.[index]?.details?.error === "DeviceNotRegistered").map((device) => device.id);
      if (invalidIds.length) await prisma.pushDevice.updateMany({ where: { id: { in: invalidIds } }, data: { enabled: false } });
    } catch {
      // Push delivery must never make the originating application action fail.
    }
  }
}
