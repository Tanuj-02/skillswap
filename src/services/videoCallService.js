import api from '@/lib/api';

export async function listVideoCalls(roomId) {
  return (await api.get(`/api/rooms/${roomId}/calls`)).data;
}

export async function startVideoCall(roomId) {
  return (await api.post(`/api/rooms/${roomId}/calls`)).data;
}

export async function endVideoCall(roomId, callId) {
  return (await api.post(`/api/rooms/${roomId}/calls/${callId}/end`)).data;
}

export async function addCallNote(roomId, callId, content, requestId = crypto.randomUUID()) {
  return (await api.post(`/api/rooms/${roomId}/calls/${callId}/notes`, { content, requestId })).data;
}

export async function listCallNotes(roomId, callId) {
  return (await api.get(`/api/rooms/${roomId}/calls/${callId}/notes`)).data;
}
