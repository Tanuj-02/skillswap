import api from '@/lib/api';

export async function latestAiJob(roomId, callId) {
  const path = callId ? `/api/rooms/${roomId}/calls/${callId}/ai` : `/api/rooms/${roomId}/ai`;
  const response = await api.get(`${path}/jobs/latest`);
  return response.data;
}

export async function requestAiJob(roomId, requestId, callId) {
  const path = callId ? `/api/rooms/${roomId}/calls/${callId}/ai` : `/api/rooms/${roomId}/ai`;
  const response = await api.post(`${path}/jobs`, { requestId });
  return response.data;
}

export async function reportAiJob(roomId, jobId, reason) {
  await api.post(`/api/rooms/${roomId}/ai/jobs/${jobId}/reports`, { reason });
}
