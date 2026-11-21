export function shouldApplyMessages(activeConversationId, responseConversationId) {
  return activeConversationId != null && String(activeConversationId) === String(responseConversationId);
}

export function mergeMessages(current, incoming) {
  const byId = new Map();
  for (const message of [...current, ...incoming]) {
    if (message?.id != null) byId.set(String(message.id), message);
  }
  return [...byId.values()].sort((a, b) =>
    new Date(a.createdAt || a.timestamp) - new Date(b.createdAt || b.timestamp)
  );
}
