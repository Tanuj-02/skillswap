import api from "@/lib/api";

export async function getMyConversations(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await api.get(`/api/chats?${query}`);
  return res.data;
}

export async function getConversationMessages(conversationId, params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await api.get(`/api/chats/${conversationId}/messages?${query}`);
  return res.data;
}