import api from "@/lib/api";

export async function createExchangeRequest(payload) {
  const res = await api.post("/api/exchange-requests/create", payload);
  return res.data;
}

export async function acceptExchangeRequest(id, otherUserId) {
  const res = await api.put(`/api/exchange-requests/${id}/accept`);
  try {
    await api.post(`/api/chats`, { userId: otherUserId });
  } catch (chatError) {
    console.error("Exchange accepted, but chat initialization failed:", chatError);
  }

  return res.data;
}
export const acceptSkillRequest = async (requestId, otherUserId) => {
  await api.post(`/api/requests/${requestId}/accept`);
  await api.post(`/api/chats`, { targetUserId: otherUserId });
  
  return { success: true };
};

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

