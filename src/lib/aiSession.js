export function aiJobPhase(job) {
  if (!job) return 'empty';
  if (job.status === 'QUEUED' || job.status === 'RUNNING') return 'pending';
  if (job.status === 'FAILED') return 'failed';
  if (job.status === 'SUCCEEDED' && typeof job.summary === 'string' && job.summary.trim()
    && Array.isArray(job.questions) && job.questions.length === 3
    && job.questions.every(question => typeof question === 'string' && question.trim())) return 'ready';
  return 'invalid';
}

export function aiErrorMessage(error) {
  const status = error?.response?.status;
  if (status === 403) return 'You do not have access to this session.';
  if (status === 429) return 'This room has reached its AI generation limit.';
  if (status === 409) return 'Close the room first, or wait for the current request to finish.';
  return 'AI notes are unavailable right now. Please retry.';
}
