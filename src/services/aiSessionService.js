import api from '@/lib/api';

export async function latestAiJob(roomId) {
  const response = await api.get(`/api/rooms/${roomId}/ai/jobs/latest`);
  return response.data;
}

export async function requestAiJob(roomId, requestId) {
  const response = await api.post(`/api/rooms/${roomId}/ai/jobs`, { requestId });
  return response.data;
}

export async function reportAiJob(roomId, jobId, reason) {
  await api.post(`/api/rooms/${roomId}/ai/jobs/${jobId}/reports`, { reason });
}
