import api from '@/lib/api';

export async function listRooms() {
  const response = await api.get('/api/rooms');
  return response.data;
}

export async function createRoom(exchangeRequestId) {
  const response = await api.post('/api/rooms', { exchangeRequestId });
  return response.data;
}

export async function joinRoom(roomId) {
  const response = await api.post(`/api/rooms/${roomId}/join`);
  return response.data;
}

export async function getRoom(roomId) {
  const response = await api.get(`/api/rooms/${roomId}`);
  return response.data;
}

export async function closeRoom(roomId) {
  const response = await api.post(`/api/rooms/${roomId}/close`);
  return response.data;
}

export async function reopenRoom(roomId) {
  const response = await api.post(`/api/rooms/${roomId}/reopen`);
  return response.data;
}

export async function getBoardHistory(roomId, after = 0) {
  const response = await api.get(`/api/rooms/${roomId}/operations`, { params: { after } });
  return response.data;
}

export async function getBoardProjection(roomId) {
  const response = await api.get(`/api/rooms/${roomId}/board`);
  return response.data;
}

export async function appendBoardOperation(roomId, operation) {
  const response = await api.post(`/api/rooms/${roomId}/operations`, operation);
  return response.data;
}
