import api from "@/lib/api";

export async function createExchangeRequest(payload) {
  const res = await api.post("/api/exchange-requests/create", payload);
  return res.data;
}

export async function acceptExchangeRequest(id) {
  const res = await api.put(`/api/exchange-requests/${id}/accept`);
  return res.data;
}

export async function rejectExchangeRequest(id) {
  const res = await api.put(`/api/exchange-requests/${id}/reject`);
  return res.data;
}

export async function getMySentExchangeRequests() {
  const res = await api.get("/api/exchange-requests/me/sent");
  return res.data;
}

export async function getMyReceivedExchangeRequests() {
  const res = await api.get("/api/exchange-requests/me/received");
  return res.data;
}

export async function disconnectExchange(otherUserId) {
  const res = await api.delete(`/api/exchange-requests/disconnect/${otherUserId}`);
  return res.data;
}

