import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Maximize2, Mic, MicOff, MonitorUp, Phone, PhoneOff, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AiSessionPanel from '@/components/AiSessionPanel';
import { enterVideoFullscreen } from '@/lib/videoFullscreen';
import { addCallNote, endVideoCall, listCallNotes, listVideoCalls, startVideoCall } from '@/services/videoCallService';

function iceServers() {
  try {
    const configured = import.meta.env.VITE_WEBRTC_ICE_SERVERS;
    return configured ? JSON.parse(configured) : [{ urls: 'stun:stun.l.google.com:19302' }];
  } catch { return [{ urls: 'stun:stun.l.google.com:19302' }]; }
}

export default function VideoCallPanel({ roomId, room, currentUser, socketClient, socketConnected, registerCallHandler }) {
  const [calls, setCalls] = useState([]);
  const [active, setActive] = useState(null);
  const [selected, setSelected] = useState(null);
  const [joined, setJoined] = useState(false);
  const [remoteOnline, setRemoteOnline] = useState(false);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [captioning, setCaptioning] = useState(false);
  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const localVideo = useRef(null);
  const remoteVideo = useRef(null);
  const localStream = useRef(null);
  const displayStream = useRef(null);
  const peerConnection = useRef(null);
  const recognition = useRef(null);
  const activeRef = useRef(null);
  const joinedRef = useRef(false);
  const pendingIce = useRef([]);
  const cleanup = useRef(null);
  const peerId = room?.ownerId === currentUser?.id ? room?.peerId : room?.ownerId;
  const isCaller = room?.ownerId === currentUser?.id;

  const signal = useCallback((kind, payload, callId = activeRef.current?.id) => {
    if (socketClient?.connected && callId && peerId) {
      socketClient.publish({ destination: `/app/rooms.signal/${roomId}`,
        body: JSON.stringify({ callId, kind, targetUserId: peerId, payload: payload || null }) });
    }
  }, [socketClient, peerId, roomId]);

  const createPeerConnection = useCallback(() => {
    peerConnection.current?.close();
    const pc = new RTCPeerConnection({ iceServers: iceServers() });
    peerConnection.current = pc;
    pendingIce.current = [];
    for (const track of localStream.current?.getTracks() || []) pc.addTrack(track, localStream.current);
    pc.ontrack = event => {
      if (remoteVideo.current) remoteVideo.current.srcObject = event.streams[0];
      setRemoteOnline(true);
    };
    pc.onicecandidate = event => {
      if (event.candidate) signal('ICE', JSON.stringify(event.candidate));
    };
    pc.onconnectionstatechange = () => {
      if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) setRemoteOnline(false);
    };
    return pc;
  }, [signal]);

  const stopMedia = useCallback((notify = true) => {
    if (notify && joinedRef.current) signal('LEAVE');
    recognition.current?.stop(); recognition.current = null;
    displayStream.current?.getTracks().forEach(track => track.stop()); displayStream.current = null;
    localStream.current?.getTracks().forEach(track => track.stop()); localStream.current = null;
    peerConnection.current?.close(); peerConnection.current = null;
    if (localVideo.current) localVideo.current.srcObject = null;
    if (remoteVideo.current) remoteVideo.current.srcObject = null;
    joinedRef.current = false;
    setJoined(false); setRemoteOnline(false); setSharing(false); setCaptioning(false);
  }, [signal]);
  cleanup.current = stopMedia;

  useEffect(() => {
    let cancelled = false;
    listVideoCalls(roomId).then(data => {
      if (cancelled) return;
      setCalls(data);
      const open = data.find(call => !call.endedAt) || null;
      setActive(open); activeRef.current = open;
      setSelected(data.find(call => call.endedAt) || null);
    }).catch(() => { if (!cancelled) setError('Calls could not be loaded.'); });
    return () => { cancelled = true; cleanup.current?.(false); };
  }, [roomId]);

  const handleRoomEvent = useCallback(event => {
    if (event?.type === 'ROOM_CLOSED') {
      stopMedia(false); setActive(null); activeRef.current = null;
      return;
    }
    if (event?.type === 'CALL_STARTED' && event.call) {
      setActive(event.call); activeRef.current = event.call;
      setCalls(previous => [event.call, ...previous.filter(call => call.id !== event.call.id)]);
      return;
    }
    if (event?.type === 'CALL_ENDED' && event.call) {
      if (activeRef.current?.id === event.call.id) {
        stopMedia(false); setActive(null); activeRef.current = null;
      }
      setCalls(previous => previous.map(call => call.id === event.call.id ? event.call : call));
      setSelected(event.call);
      return;
    }
    if (event?.type !== 'SIGNAL' || event.targetUserId !== currentUser?.id
        || event.fromUserId !== peerId || event.callId !== activeRef.current?.id || !joinedRef.current) return;
    (async () => {
      try {
        let pc = peerConnection.current;
        if (event.kind === 'LEAVE') {
          createPeerConnection(); setRemoteOnline(false);
          if (remoteVideo.current) remoteVideo.current.srcObject = null;
          return;
        }
        if (event.kind === 'READY') {
          if (!isCaller) { signal('READY'); return; }
          pc = createPeerConnection();
          await pc.setLocalDescription(await pc.createOffer());
          signal('OFFER', JSON.stringify(pc.localDescription));
        } else if (event.kind === 'OFFER' && !isCaller) {
          if (!pc || pc.remoteDescription || pc.signalingState !== 'stable') pc = createPeerConnection();
          await pc.setRemoteDescription(JSON.parse(event.payload));
          await pc.setLocalDescription(await pc.createAnswer());
          signal('ANSWER', JSON.stringify(pc.localDescription));
        } else if (event.kind === 'ANSWER' && isCaller && pc?.signalingState === 'have-local-offer') {
          await pc.setRemoteDescription(JSON.parse(event.payload));
        } else if (event.kind === 'ICE' && pc) {
          const candidate = JSON.parse(event.payload);
          if (pc.remoteDescription) await pc.addIceCandidate(candidate);
          else pendingIce.current.push(candidate);
        }
        if (pc?.remoteDescription) {
          for (const candidate of pendingIce.current.splice(0)) await pc.addIceCandidate(candidate);
        }
      } catch { setError('Video connection failed. Leave and rejoin the call.'); }
    })();
  }, [currentUser?.id, peerId, isCaller, createPeerConnection, signal, stopMedia]);

  useEffect(() => {
    registerCallHandler(handleRoomEvent);
    return () => registerCallHandler(null);
  }, [registerCallHandler, handleRoomEvent]);

  useEffect(() => {
    if (socketConnected && joinedRef.current) signal('READY');
  }, [socketConnected, signal]);

  const selectedId = selected?.id;
  useEffect(() => {
    if (!selectedId) return;
    listCallNotes(roomId, selectedId).then(setNotes).catch(() => setNotes([]));
  }, [roomId, selectedId]);

  const join = async (call = activeRef.current) => {
    if (!call || joinedRef.current) return;
    setBusy(true); setError('');
    try {
      localStream.current = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      if (activeRef.current?.id !== call.id) { localStream.current.getTracks().forEach(track => track.stop()); return; }
      if (localVideo.current) localVideo.current.srcObject = localStream.current;
      createPeerConnection();
      joinedRef.current = true; setJoined(true);
      signal('READY', null, call.id);
    } catch { setError('Camera or microphone access was denied or unavailable. Check browser permissions.'); }
    finally { setBusy(false); }
  };

  const start = async () => {
    setBusy(true); setError('');
    try {
      const call = await startVideoCall(roomId);
      setActive(call); activeRef.current = call;
      setCalls(previous => [call, ...previous.filter(item => item.id !== call.id)]);
      await join(call);
    } catch { setError('The call could not be started. Try again.'); }
    finally { setBusy(false); }
  };

  const end = async () => {
    if (!activeRef.current) return;
    setBusy(true); setError('');
    try {
      const ended = await endVideoCall(roomId, activeRef.current.id);
      stopMedia(); setActive(null); activeRef.current = null;
      setCalls(previous => previous.map(call => call.id === ended.id ? ended : call));
      setSelected(ended);
    } catch { setError('The call could not be ended. Retry.'); }
    finally { setBusy(false); }
  };

  const shareScreen = async () => {
    if (!peerConnection.current || !localStream.current) return;
    setError('');
    try {
      if (displayStream.current) {
        displayStream.current.getTracks().forEach(track => track.stop());
        displayStream.current = null;
        const camera = localStream.current.getVideoTracks()[0];
        await peerConnection.current.getSenders().find(sender => sender.track?.kind === 'video')?.replaceTrack(camera);
        if (localVideo.current) localVideo.current.srcObject = localStream.current;
        setSharing(false);
        return;
      }
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const track = stream.getVideoTracks()[0];
      await peerConnection.current.getSenders().find(sender => sender.track?.kind === 'video')?.replaceTrack(track);
      displayStream.current = stream;
      if (localVideo.current) localVideo.current.srcObject = stream;
      setSharing(true);
      track.onended = () => { if (displayStream.current) shareScreen(); };
    } catch { setError('Screen sharing was cancelled or is unavailable.'); }
  };

  const saveNote = async content => {
    const value = content.trim();
    if (!value || !activeRef.current) return;
    try {
      const saved = await addCallNote(roomId, activeRef.current.id, value);
      setNotes(previous => [...previous, saved]);
      setNoteText('');
    } catch { setError('Call note could not be saved. Try again.'); }
  };

  const toggleCaptions = () => {
    if (recognition.current) { recognition.current.stop(); recognition.current = null; setCaptioning(false); return; }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { setError('Live captions are unavailable in this browser. Add notes manually.'); return; }
    const instance = new SpeechRecognition();
    instance.continuous = true; instance.interimResults = false;
    instance.onresult = event => {
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        if (event.results[i].isFinal) saveNote(event.results[i][0].transcript.slice(0, 1000));
      }
    };
    instance.onerror = () => { setCaptioning(false); recognition.current = null; setError('Captions stopped. Add notes manually if needed.'); };
    instance.onend = () => { setCaptioning(false); recognition.current = null; };
    recognition.current = instance; instance.start(); setCaptioning(true);
  };

  const expandVideo = async video => {
    try { await enterVideoFullscreen(video); setError(''); }
    catch (failure) { setError(failure.message || 'Full-screen video is unavailable.'); }
  };

  return <section className="rounded-2xl border border-border bg-card/80 p-4 mb-5" aria-label="Video call">
    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
      <div><h2 className="font-heading text-xl font-bold">Video call</h2><p className="text-xs text-muted-foreground">Camera and screen media go directly between members when the network permits.</p></div>
      {active ? <div className="flex gap-2">{!joined && <Button onClick={() => join()} disabled={busy || !socketClient?.connected}><Phone className="w-4 h-4 mr-1" /> Join call</Button>}
        <Button variant="outline" onClick={end} disabled={busy}><PhoneOff className="w-4 h-4 mr-1" /> End call</Button></div>
        : room?.status === 'OPEN' && <Button onClick={start} disabled={busy || !socketClient?.connected}><Phone className="w-4 h-4 mr-1" /> Start call</Button>}
    </div>
    {error && <p role="alert" className="text-sm text-destructive mb-3">{error}</p>}
    {active && <>
      <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
        <div className="relative rounded-xl bg-slate-950 overflow-hidden aspect-video"><video ref={localVideo} autoPlay muted playsInline onDoubleClick={() => expandVideo(localVideo.current)} className="w-full h-full object-contain" /><span className="absolute bottom-2 left-2 text-white text-xs bg-black/60 rounded px-2 py-1">You {sharing ? '· screen' : ''}</span><Button type="button" size="sm" variant="outline" className="absolute bottom-2 right-2 bg-black/70 text-white" disabled={!joined} onClick={() => expandVideo(localVideo.current)} aria-label="Full screen your video" title="Full screen your video"><Maximize2 className="w-4 h-4" /></Button></div>
        <div className="relative rounded-xl bg-slate-950 overflow-hidden aspect-video"><video ref={remoteVideo} autoPlay playsInline onDoubleClick={() => expandVideo(remoteVideo.current)} className="w-full h-full object-contain" /><span className="absolute bottom-2 left-2 text-white text-xs bg-black/60 rounded px-2 py-1">{room?.ownerId === currentUser?.id ? room?.peerName : room?.ownerName} {remoteOnline ? '· connected' : '· waiting'}</span><Button type="button" size="sm" variant="outline" className="absolute bottom-2 right-2 bg-black/70 text-white" disabled={!remoteOnline} onClick={() => expandVideo(remoteVideo.current)} aria-label="Full screen partner video" title="Full screen partner video or screen share"><Maximize2 className="w-4 h-4" /></Button></div>
      </div>
      {joined && <div className="flex flex-wrap gap-2 mt-3">
        <Button size="sm" variant="outline" onClick={() => { const track = localStream.current?.getAudioTracks()[0]; if (track) { track.enabled = muted; setMuted(!muted); } }}>{muted ? <MicOff className="w-4 h-4 mr-1" /> : <Mic className="w-4 h-4 mr-1" />}{muted ? 'Unmute' : 'Mute'}</Button>
        <Button size="sm" variant="outline" onClick={() => { const track = localStream.current?.getVideoTracks()[0]; if (track) { track.enabled = cameraOff; setCameraOff(!cameraOff); } }}>{cameraOff ? <CameraOff className="w-4 h-4 mr-1" /> : <Camera className="w-4 h-4 mr-1" />}{cameraOff ? 'Camera on' : 'Camera off'}</Button>
        <Button size="sm" variant="outline" onClick={shareScreen}><MonitorUp className="w-4 h-4 mr-1" /> {sharing ? 'Stop sharing' : 'Share screen'}</Button>
        <Button size="sm" variant="outline" onClick={toggleCaptions}>{captioning ? 'Stop captions' : 'Save my speech as notes'}</Button>
        <Button size="sm" variant="outline" onClick={() => stopMedia()}><PhoneOff className="w-4 h-4 mr-1" /> Leave</Button>
      </div>}
      <div className="mt-4 flex gap-2"><input aria-label="Call note" value={noteText} onChange={event => setNoteText(event.target.value)} maxLength={1000} placeholder="Add a point discussed in this call" className="flex-1 min-w-0 rounded-md border border-border bg-background px-3 py-2 text-sm" /><Button size="sm" onClick={() => saveNote(noteText)} disabled={!noteText.trim()}><StickyNote className="w-4 h-4 mr-1" /> Save note</Button></div>
      <p className="text-xs text-muted-foreground mt-2">Speech captions are optional and browser dependent; the browser speech service may process audio. Only saved notes and captions are used for AI summaries; media is not recorded by this app.</p>
    </>}
    {calls.some(call => call.endedAt) && <div className="mt-4 border-t border-border pt-4"><label className="text-sm font-semibold mr-2" htmlFor="call-history">Past calls</label><select id="call-history" value={selected?.id || ''} onChange={event => setSelected(calls.find(call => call.id === Number(event.target.value)) || null)} className="rounded-md border border-border bg-background px-2 py-1 text-sm"><option value="">Choose call</option>{calls.filter(call => call.endedAt).map(call => <option key={call.id} value={call.id}>Call #{call.id} · {new Date(call.startedAt).toLocaleString()}</option>)}</select>
      {selected && <><div className="mt-3 text-sm"><h3 className="font-semibold">Saved call notes</h3>{notes.length ? <ul className="list-disc pl-5 mt-1">{notes.map(note => <li key={note.id}>{note.content}</li>)}</ul> : <p className="text-muted-foreground">No notes were saved. Add notes during a call to generate its summary.</p>}</div><AiSessionPanel key={selected.id} roomId={roomId} callId={selected.id} /></>}
    </div>}
  </section>;
}
