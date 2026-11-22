import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { aiErrorMessage, aiJobPhase } from '@/lib/aiSession';
import { latestAiJob, reportAiJob, requestAiJob } from '@/services/aiSessionService';

export default function AiSessionPanel({ roomId }) {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [reported, setReported] = useState(false);
  const requestIdRef = useRef(null);
  const phase = aiJobPhase(job);

  const refresh = useCallback(async () => {
    try {
      setJob(await latestAiJob(roomId));
      setError('');
    } catch (failure) { setError(aiErrorMessage(failure)); }
    finally { setLoading(false); }
  }, [roomId]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    if (phase !== 'pending') return undefined;
    const timer = setInterval(refresh, 3000);
    return () => clearInterval(timer);
  }, [phase, refresh]);

  const generate = async () => {
    setSending(true); setError('');
    requestIdRef.current ||= crypto.randomUUID();
    try {
      const next = await requestAiJob(roomId, requestIdRef.current);
      setJob(next); setReported(false); requestIdRef.current = null;
    } catch (failure) {
      setError(aiErrorMessage(failure));
      if (failure?.response?.status === 409) refresh();
      if ([403, 409, 429].includes(failure?.response?.status)) requestIdRef.current = null;
    } finally { setSending(false); }
  };

  const report = async () => {
    try {
      await reportAiJob(roomId, job.id, 'UNHELPFUL');
      setReported(true); setError('');
    } catch (failure) { setError(aiErrorMessage(failure)); }
  };

  return <section className="mt-5 rounded-2xl border border-border bg-card/80 p-5" aria-label="AI learning notes">
    <h2 className="flex items-center gap-2 font-bold"><Sparkles className="w-5 h-5" /> AI learning notes</h2>
    <p className="text-sm text-muted-foreground mt-1 mb-4">Your exchange skills and session chat excerpts are sent to Groq. AI results can be wrong; check them before relying on them.</p>
    {error && <p role="alert" className="text-sm text-destructive mb-3">{error}</p>}
    {loading ? <p className="text-sm"><Loader2 className="w-4 h-4 inline animate-spin" /> Loading notes…</p> : <>
      {phase === 'empty' && <p className="text-sm mb-3">No AI notes yet.</p>}
      {phase === 'pending' && <p role="status" className="text-sm mb-3"><Loader2 className="w-4 h-4 inline animate-spin" /> {job.status === 'QUEUED' ? 'Waiting for the AI worker…' : 'Generating notes…'}</p>}
      {phase === 'failed' && <p role="alert" className="text-sm mb-3">Generation failed{job.errorCode === 'not_configured' ? ' because the AI provider is not configured' : ''}. You can retry.</p>}
      {phase === 'invalid' && <p role="alert" className="text-sm mb-3">The generated result is incomplete. Please regenerate it.</p>}
      {phase === 'ready' && <div className="space-y-4 text-sm">
        <div><h3 className="font-semibold mb-1">Summary</h3><p className="whitespace-pre-wrap">{job.summary}</p></div>
        <div><h3 className="font-semibold mb-1">Practice questions</h3><ol className="list-decimal pl-5 space-y-2">{job.questions.map((question, index) => <li key={index}>{question}</li>)}</ol></div>
        <Button size="sm" variant="outline" disabled={reported} onClick={report}>{reported ? 'Reported' : 'Report unusable result'}</Button>
      </div>}
      {phase !== 'pending' && <Button size="sm" className="mt-4" disabled={sending} onClick={generate}>{sending ? 'Requesting…' : phase === 'empty' ? 'Generate notes' : 'Regenerate notes'}</Button>}
    </>}
  </section>;
}
