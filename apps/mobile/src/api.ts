import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

export type Shift = {
  id: string;
  startsAt: string;
  endsAt: string;
  breakMinutes: number;
  notes: string | null;
  location: string;
  position: string;
  color: string;
  taskList: null | { id: string; name: string; items: Array<{ id: string; title: string; completed: boolean }> };
};
export type RequestItem = {
  id: string;
  startsOn: string;
  endsOn: string;
  type: string;
  status: string;
  note: string | null;
};
export type Trade = {
  id: string;
  kind: "OPEN_SHIFT" | "SWAP";
  status: "OFFERED" | "PENDING" | "APPROVED" | "DECLINED" | "CANCELLED";
  owner: string | null;
  claimant: string | null;
  shift: Shift;
};
export type Bootstrap = {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    organization: string;
  };
  shifts: Shift[];
  openShifts: Shift[];
  requests: RequestItem[];
  trades: Trade[];
  swapOffers: Array<{ id: string; owner: string | null; shift: Shift }>;
  timeEntries: Array<{
    id: string;
    clockIn: string;
    clockOut: string | null;
    source: string;
    breakStartedAt: string | null;
    breakMinutes: number;
    approvalStatus: string;
    correctionNote: string | null;
  }>;
  availability: Array<{
    id: string;
    weekday: number;
    startMinute: number;
    endMinute: number;
    available: boolean;
  }>;
  notifications: Array<{ id: string; type: string; title: string; body: string; href: string | null; readAt: string | null; createdAt: string }>;
  conversations: Array<{ id: string; title: string; isGroup: boolean; unread: number; messages: Array<{ id: string; content: string; createdAt: string; authorId: string; authorName: string; readCount: number; recipientCount: number }> }>;
  directory: Array<{ id: string; name: string }>;
  management: null | {
    employees: Array<{ id: string; name: string }>;
    locations: Array<{ id: string; name: string }>;
    positions: Array<{ id: string; name: string; color: string }>;
    taskLists: Array<{ id: string; name: string; itemCount: number }>;
  };
  clockPolicy: { locationRequired: boolean };
};

const API_URL =
  Constants.expoConfig?.extra?.apiUrl ?? "https://schichtpro.smarbiz.sbs";
const TOKEN_KEY = "schichtpro.session";

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error ?? "Etwas ist schiefgelaufen.");
  return body as T;
}

export async function login(email: string, password: string) {
  const result = await call<{ token: string }>("/api/mobile/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  await AsyncStorage.setItem(TOKEN_KEY, result.token);
}
export const bootstrap = () => call<Bootstrap>("/api/mobile/bootstrap");
export const shiftAction = (body: Record<string, string>) =>
  call("/api/mobile/shift-actions", {
    method: "POST",
    body: JSON.stringify(body),
  });
export const timeClockAction = (
  action: "CLOCK_IN" | "CLOCK_OUT" | "TOGGLE_BREAK",
  coordinates?: { latitude: number; longitude: number; accuracy?: number },
) =>
  call("/api/mobile/time-clock", {
    method: "POST",
    body: JSON.stringify({ action, ...coordinates }),
  });
export const timeOffAction = (body: Record<string, string>) =>
  call("/api/mobile/time-off", { method: "POST", body: JSON.stringify(body) });
export const availabilityAction = (
  body: Record<string, string | number | boolean>,
) =>
  call("/api/mobile/availability", {
    method: "POST",
    body: JSON.stringify(body),
  });
export const requestTimesheetCorrection = (id: string, note: string) =>
  call(`/api/mobile/timesheets/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ note }),
  });
export const sendMessage = (content: string) =>
  call("/api/mobile/messages", {
    method: "POST",
    body: JSON.stringify({ content }),
  });
export const createConversation = (participantIds: string[], name?: string) => call<{ conversation: { id: string } }>("/api/mobile/conversations", { method: "POST", body: JSON.stringify({ participantIds, name }) });
export const sendConversationMessage = (conversationId: string, content: string) => call(`/api/mobile/conversations/${conversationId}/messages`, { method: "POST", body: JSON.stringify({ content }) });
export const markConversationRead = (conversationId: string) => call(`/api/mobile/conversations/${conversationId}/messages`, { method: "PATCH" });
export const markNotificationRead = (id?: string) => call("/api/mobile/notifications", { method: "PATCH", body: JSON.stringify(id ? { id } : { all: true }) });
export const changePassword = (currentPassword: string, newPassword: string) => call("/api/mobile/password", { method: "PATCH", body: JSON.stringify({ currentPassword, newPassword }) });
export const createManagedShift = (body: {
  assigneeId: string | null;
  locationId: string;
  positionId: string;
  startsAt: string;
  endsAt: string;
  unpaidBreakMin: number;
  notes?: string;
  taskListId?: string | null;
}) => call("/api/mobile/manage/shifts", { method: "POST", body: JSON.stringify(body) });
export const setShiftTask = (shiftId: string, taskItemId: string, completed: boolean) => call("/api/mobile/shift-tasks", { method: "POST", body: JSON.stringify({ shiftId, taskItemId, completed }) });
export async function logout() {
  await call("/api/mobile/auth/logout", { method: "POST" }).catch(() => null);
  await AsyncStorage.removeItem(TOKEN_KEY);
}
export const hasSession = async () =>
  Boolean(await AsyncStorage.getItem(TOKEN_KEY));
