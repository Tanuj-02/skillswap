import api from "@/lib/api";

export async function discoverUsers(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await api.get(`/api/discover?${query}`);
  const data = res.data;
  return Array.isArray(data) ? data : data?.content ?? [];
}