import api from "@/lib/api";

function flattenSkillsFromUserLike(raw) {
  if (!raw || typeof raw !== "object") {
    return { canTeach: [], wantsToLearn: [] };
  }
  const s = raw.skills;
  const canTeachFromFlat = raw.canTeach;
  const canTeachFromNested = s && s.canTeach;
  const canTeach = Array.isArray(canTeachFromFlat)
    ? canTeachFromFlat
    : Array.isArray(canTeachFromNested)
      ? canTeachFromNested
      : [];

  const learnFromFlat = raw.wantsToLearn ?? raw.wantToLearn;
  const learnFromNested = s && (s.wantsToLearn ?? s.wantToLearn);
  const learnRaw = learnFromFlat ?? learnFromNested;
  const wantsToLearn = Array.isArray(learnRaw) ? learnRaw : [];
  return { canTeach, wantsToLearn };
}

export function normalizeUser(raw) {
  if (!raw || typeof raw !== "object") return raw;
  const { canTeach, wantsToLearn } = flattenSkillsFromUserLike(raw);
  return {
    ...raw,
    canTeach,
    wantsToLearn,
    skills: { canTeach, wantsToLearn },
  };
}

function serializeUserUpdatePayload(payload) {
  if (!payload || typeof payload !== "object") return payload;
  const next = { ...payload };
  const hasSkillHints =
    Object.prototype.hasOwnProperty.call(next, "skills") ||
    Array.isArray(next.canTeach) ||
    Array.isArray(next.wantsToLearn) ||
    Array.isArray(next.wantToLearn);

  if (!hasSkillHints) return next;

  const { canTeach, wantsToLearn } = flattenSkillsFromUserLike(next);
  next.skills = {
    canTeach: [...canTeach],
    wantsToLearn: [...wantsToLearn],
  };
  next.canTeach = [...canTeach];
  next.wantsToLearn = [...wantsToLearn];
  next.wantToLearn = [...wantsToLearn];
  return next;
}

export async function getMe() {
  const res = await api.get("/api/users/me");
  return normalizeUser(res.data);
}

export async function getUserById(id) {
  const res = await api.get(`/api/users/${id}`);
  return normalizeUser(res.data);
}

export async function updateMe(payload) {
  const res = await api.put("/api/users/me/update", serializeUserUpdatePayload(payload));
  return normalizeUser(res.data);
}

export async function sendPasswordVerification() {
  const res = await api.post("/api/users/me/password/send-verification");
  return res.data;
}

export async function changeMyPassword(oldPassword, newPassword, verificationCode) {
  const res = await api.put(
    `/api/users/me/password?oldPassword=${oldPassword}&newPassword=${newPassword}&verificationCode=${verificationCode}`
  );
  return res.data;
}

export async function searchUsers(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await api.get(`/api/users/search?${query}`);
  return res.data;
}
