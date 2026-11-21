export function serializeExchangeRequest({ receiverId, message = '', selectedTeach, selectedLearn }) {
  if (!receiverId || !selectedTeach?.trim() || !selectedLearn?.trim()) {
    throw new Error('Select one skill to teach and one skill to learn.');
  }

  return {
    receiverId,
    message: message.trim(),
    canTeach: [selectedTeach.trim()],
    wantToLearn: [selectedLearn.trim()],
  };
}

export function normalizeExchangeRequest(request) {
  const status = request.status || 'PENDING';
  return {
    ...request,
    status: status.charAt(0).toUpperCase() + status.slice(1).toLowerCase(),
    senderid: request.sender?.id || '',
    senderName: request.sender?.name || 'Unknown User',
    senderUserName: request.sender?.username || 'user',
    receiverid: request.receiver?.id || '',
    receiverName: request.receiver?.name || 'Unknown User',
    receiverUserName: request.receiver?.username || 'user',
    offeredSkills: Array.isArray(request.canTeach) ? request.canTeach : [],
    askingSkills: Array.isArray(request.wantToLearn) ? request.wantToLearn : [],
  };
}
