import api from "@/lib/api";

export async function register(payload) {
  const res = await api.post("/api/auth/register", payload);
  return res.data;
}

export async function login(payload) {
  const usernameOrEmail =
    payload?.usernameOrEmail ?? payload?.username ?? payload?.email ?? null;
  const password = payload?.password ?? null;

  const res = await api.post("/api/auth/login", { usernameOrEmail, password });
  return res.data;
}

export async function verifyEmail(email, code) {
  const res = await api.get(`/api/auth/verify-email?email=${email}&code=${code}`);
  return res.data;
}

export async function resendVerification(email) {
  const res = await api.post(`/api/auth/resend-verification?email=${email}`);
  return res.data;
}

