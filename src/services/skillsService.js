import api from "@/lib/api";

export async function addSkill(payload) {
  const res = await api.post("/api/skills/add", payload);
  return res.data;
}

