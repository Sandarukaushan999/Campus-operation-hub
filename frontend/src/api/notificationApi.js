import api from "./axios";

export async function getMyUnreadNotificationCount() {
  const res = await api.get("/notifications/my/unread-count");
  return res.data?.data ?? 0;
}

export async function getMyNotifications(limit = 10) {
  const res = await api.get("/notifications/my", { params: { limit } });
  return res.data?.data ?? [];
}

export async function markNotificationRead(id) {
  const res = await api.put(`/notifications/${id}/read`);
  return res.data?.data ?? null;
}

export async function markAllNotificationsRead() {
  const res = await api.put("/notifications/my/read-all");
  return res.data?.data ?? null;
}