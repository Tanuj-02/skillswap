import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Circle, Eraser, Loader2, Minus, MousePointer2, PenLine, RectangleHorizontal, RotateCcw, Trash2, Type, Wifi, WifiOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser } from '@/context/userSessionContext';
import { appendBoardOperation, closeRoom, getBoardHistory, getBoardProjection, getRoom, joinRoom, reopenRoom } from '@/services/roomService';
import { connectRoomSocket } from '@/services/roomSocket';
import { contiguousSequence, mergeBoardOperations, sampleStrokePoints, visibleStrokes } from '@/lib/whiteboard';
import AiSessionPanel from '@/components/AiSessionPanel';
import VideoCallPanel from '@/components/VideoCallPanel';

function describeError(error) {
  if (error?.response?.status === 403) return 'You no longer have access to this room.';
  if (error?.response?.status === 404) return 'This room was not found.';
  if (error?.response?.status === 409) return 'This room is closed or the operation conflicts with an existing one.';
  if (error?.response?.status === 503) return 'The board is recovering. Your changes may already be saved; retry shortly.';
  return 'The board could not be updated. Check your connection and retry.';
}

function normalizedPoint(event) {
  const rect = event.currentTarget.getBoundingClientRect();
  return {
    x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
    y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
  };
}

function pathPoints(points) {
  return points.map(point => `${point.x * 1000},${point.y * 1000}`).join(' ');
}

function BoardItem({ item, onErase }) {
  const [a, b] = item.points || [];
  const common = { fill: 'none', stroke: item.color, strokeWidth: (item.width || 4) * 2,
    opacity: item.pending ? 0.55 : 1,
    strokeLinecap: 'round', strokeLinejoin: 'round', onPointerDown: onErase ? event => { event.stopPropagation(); onErase(item.operationId); } : undefined };
  if (item.type === 'TEXT' && a) return <text x={a.x * 1000} y={a.y * 1000} fill={item.color} fontSize={Math.max(20, (item.width || 4) * 10)} onPointerDown={common.onPointerDown}>{item.text}</text>;
  if (item.type === 'SHAPE' && a && b) {
    const x = Math.min(a.x, b.x) * 1000; const y = Math.min(a.y, b.y) * 1000;
    const w = Math.abs(a.x - b.x) * 1000; const h = Math.abs(a.y - b.y) * 1000;
    if (item.shape === 'RECTANGLE') return <rect x={x} y={y} width={w} height={h} {...common} />;
    if (item.shape === 'ELLIPSE') return <ellipse cx={x + w / 2} cy={y + h / 2} rx={w / 2} ry={h / 2} {...common} />;
    return <line x1={a.x * 1000} y1={a.y * 1000} x2={b.x * 1000} y2={b.y * 1000} {...common} markerEnd={item.shape === 'ARROW' ? 'url(#board-arrow)' : undefined} />;
  }
  return <polyline points={pathPoints(item.points || [])} {...common} />;
}

export default function WhiteboardRoom() {
  const { roomId: roomIdParam } = useParams();
  const roomId = Number(roomIdParam);
  const { currentUser } = useUser();
  const [room, setRoom] = useState(null);
  const [operations, setOperations] = useState([]);
  const [seedStrokes, setSeedStrokes] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#7b6cff');
  const [width, setWidth] = useState(4);
  const [draft, setDraft] = useState([]);
  const [textDraft, setTextDraft] = useState(null);
  const [optimistic, setOptimistic] = useState([]);
  const [saving, setSaving] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [cursors, setCursors] = useState({});
  const [clock, setClock] = useState(0);
  const operationsRef = useRef([]);
  const statusRef = useRef(status);
  statusRef.current = status;
  const baseSequenceRef = useRef(0);
  const pendingRef = useRef(new Map());
  const initializingRef = useRef(false);
  const drawingRef = useRef(null);
  const socketRef = useRef(null);
  const syncingRef = useRef(false);
  const queuedRef = useRef([]);
  const lastCursorRef = useRef(0);
  const lastDraftRef = useRef(0);
  const callHandlerRef = useRef(null);
  const registerCallHandler = useCallback(handler => { callHandlerRef.current = handler; }, []);

  const merge = (incoming) => {
    const next = mergeBoardOperations(operationsRef.current, incoming);
    operationsRef.current = next;
    const savedIds = new Set(incoming.map(op => op.operationId));
    const resolvedPending = [...savedIds].some(id => pendingRef.current.has(id));
    for (const id of savedIds) pendingRef.current.delete(id);
    if (resolvedPending) setError('');
    setPendingCount([...pendingRef.current.values()].filter(entry => entry.status === 'failed').length);
    setOptimistic(previous => previous.filter(op => !savedIds.has(op.operationId)));
    setOperations(next);
  };

  useEffect(() => {
    let cancelled = false;
    let heartbeat;
    operationsRef.current = [];
    baseSequenceRef.current = 0;
    pendingRef.current.clear();
    setPendingCount(0);
    setOperations([]);
    setSeedStrokes([]);
    setRoom(null);
    setStatus('loading');
    setError('');

    async function catchUp() {
      if (syncingRef.current || cancelled) return;
      syncingRef.current = true;
      setStatus('syncing');
      try {
        let after = contiguousSequence(operationsRef.current, baseSequenceRef.current);
        while (!cancelled) {
          const batch = await getBoardHistory(roomId, after);
          if (cancelled) return;
          merge(batch.operations || []);
          const last = batch.operations?.at(-1)?.sequenceNumber ?? after;
          if (!batch.hasMore) break;
          if (last <= after) throw new Error('Board history did not advance.');
          after = last;
        }
        merge(queuedRef.current);
        queuedRef.current = [];
        const contiguous = contiguousSequence(operationsRef.current, baseSequenceRef.current);
        if ((operationsRef.current.at(-1)?.sequenceNumber ?? contiguous) > contiguous) {
          setStatus('recovering');
          return;
        }
        setStatus(socketRef.current?.connected ? 'connected' : 'disconnected');
      } catch (failure) {
        if (!cancelled) {
          setError(describeError(failure));
          setStatus(failure.response?.status === 403 ? 'denied' : failure.response?.status === 503 ? 'recovering' : 'disconnected');
        }
      } finally {
        syncingRef.current = false;
      }
    }

    async function initialize() {
      if (initializingRef.current || socketRef.current) return;
      initializingRef.current = true;
      if (!Number.isSafeInteger(roomId) || roomId <= 0) {
        setError('Invalid room link.'); setStatus('denied'); initializingRef.current = false; return;
      }
      try {
        const current = await getRoom(roomId);
        const joined = current.status === 'OPEN' ? await joinRoom(roomId) : current;
        if (cancelled) return;
        setRoom(joined);
        // The versioned projection contains current strokes; history after it closes the race before subscription.
        const projection = await getBoardProjection(roomId);
        if (cancelled) return;
        baseSequenceRef.current = projection.sequenceNumber;
        setSeedStrokes(projection.strokes || []);
        let after = projection.sequenceNumber;
        while (!cancelled) {
          const batch = await getBoardHistory(roomId, after);
          if (cancelled) return;
          merge(batch.operations || []);
          if (!batch.hasMore) break;
          const last = batch.operations?.at(-1)?.sequenceNumber ?? after;
          if (last <= after) throw new Error('Board history did not advance.');
          after = last;
        }
        if (joined.status === 'CLOSED') { setStatus('closed'); return; }
        setStatus('connecting');
        socketRef.current = connectRoomSocket(roomId, {
          onEvent(event) {
            if (cancelled) return;
            if (event.type === 'ROOM_CLOSED') {
              callHandlerRef.current?.(event);
              setRoom(event.room); setStatus('closed'); return;
            }
            if (event.type === 'ROOM_REOPENED') { window.location.reload(); return; }
            if (['CALL_STARTED', 'CALL_ENDED', 'SIGNAL'].includes(event.type)) callHandlerRef.current?.(event);
            if (event.type === 'CURSOR' && event.cursor) {
              setCursors(previous => ({ ...previous,
                [event.cursor.userId]: { ...event.cursor, seenAt: Date.now() } }));
            }
            if (event.type === 'OPERATION' && event.operation) {
              if (syncingRef.current) queuedRef.current.push(event.operation);
              else {
                merge([event.operation]);
                if (contiguousSequence(operationsRef.current, baseSequenceRef.current) < event.operation.sequenceNumber) catchUp();
              }
            }
          },
          onConnected(client) {
            if (cancelled) return;
            clearInterval(heartbeat);
            heartbeat = setInterval(() => {
              if (client.connected) client.publish({
                destination: `/app/rooms.cursor/${roomId}`,
                body: JSON.stringify({ x: 0.5, y: 0.5, active: false }),
              });
            }, 3000);
            catchUp();
          },
          onDisconnected() {
            if (!cancelled) { clearInterval(heartbeat); setStatus('disconnected'); }
          },
          onError(message) { if (!cancelled) { setError(message); setStatus('disconnected'); } },
        });
      } catch (failure) {
        if (!cancelled) {
          setError(describeError(failure));
          setStatus(failure.response?.status === 403 ? 'denied'
            : failure.response?.status === 409 ? 'closed'
              : failure.response?.status === 503 ? 'recovering' : 'disconnected');
        }
      } finally {
        initializingRef.current = false;
      }
    }
    initialize();
    const timer = setInterval(() => setClock(Date.now()), 1000);
    const recovery = setInterval(() => {
      if (cancelled) return;
      if (['denied', 'closed'].includes(statusRef.current)) return;
      if (!socketRef.current) initialize();
      else if (!socketRef.current.connected || ['recovering', 'disconnected'].includes(statusRef.current)) catchUp();
    }, 3000);
    const roomRefresh = setInterval(async () => {
      if (cancelled || statusRef.current !== 'closed') return;
      try {
        const current = await getRoom(roomId);
        if (!cancelled && current.status === 'OPEN') window.location.reload();
      } catch { /* The next check will retry while the room remains closed. */ }
    }, 10000);
    return () => {
      cancelled = true;
      clearInterval(heartbeat);
      clearInterval(timer);
      clearInterval(recovery);
      clearInterval(roomRefresh);
      socketRef.current?.deactivate();
      socketRef.current = null;
    };
  }, [roomId]);

  const strokes = useMemo(() => visibleStrokes([...operations, ...optimistic.map(op => ({ ...op, pending: true, sequenceNumber: Number.MAX_SAFE_INTEGER }))], seedStrokes), [operations, seedStrokes, optimistic]);
  const canEdit = status === 'connected' && room?.status === 'OPEN';
  const peer = room && (room.ownerId === currentUser?.id
    ? { id: room.peerId, name: room.peerName }
    : { id: room.ownerId, name: room.ownerName });
  const peerCursor = peer && cursors[peer.id];
  const peerOnline = peerCursor && clock - peerCursor.seenAt < 7000;

  const sendOperation = async (payload) => {
    if (!canEdit) return;
    const operation = { operationId: crypto.randomUUID(), ...payload };
    if (['STROKE', 'SHAPE', 'TEXT'].includes(operation.type)) setOptimistic(previous => [...previous, operation]);
    pendingRef.current.set(operation.operationId, { operation, status: 'saving' });
    await submitOperation(operation);
  };

  const submitOperation = async (operation) => {
    setSaving(value => value + 1);
    setError('');
    try {
      const saved = await appendBoardOperation(roomId, operation);
      merge([saved]);
    } catch (failure) {
      if (![400, 403, 409].includes(failure.response?.status)) {
        if (pendingRef.current.has(operation.operationId)) {
          pendingRef.current.set(operation.operationId, { operation, status: 'failed' });
        }
      } else {
        pendingRef.current.delete(operation.operationId);
        setOptimistic(previous => previous.filter(op => op.operationId !== operation.operationId));
      }
      setPendingCount([...pendingRef.current.values()].filter(entry => entry.status === 'failed').length);
      setError(describeError(failure));
      if (failure.response?.status === 403) setStatus('denied');
      if (failure.response?.status === 409) setStatus('closed');
      if (failure.response?.status === 503) setStatus('recovering');
    } finally {
      setSaving(value => value - 1);
    }
  };

  const retryPending = () => {
    for (const entry of pendingRef.current.values()) {
      if (entry.status === 'failed') {
        pendingRef.current.set(entry.operation.operationId, { ...entry, status: 'saving' });
        submitOperation(entry.operation);
      }
    }
    setPendingCount(0);
  };

  const publishCursor = (point, active) => {
    const client = socketRef.current;
    if (!client?.connected || Date.now() - lastCursorRef.current < 80) return;
    lastCursorRef.current = Date.now();
    client.publish({ destination: `/app/rooms.cursor/${roomId}`,
      body: JSON.stringify({ ...point, active }) });
  };

  const begin = (event) => {
    if (!canEdit || tool === 'eraser') return;
    if (tool === 'text') { setTextDraft({ point: normalizedPoint(event), value: '' }); return; }
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = normalizedPoint(event);
    drawingRef.current = [point];
    setDraft([point]);
    publishCursor(point, true);
  };

  const move = (event) => {
    const point = normalizedPoint(event);
    publishCursor(point, true);
    if (!drawingRef.current) return;
    const last = drawingRef.current.at(-1);
    if (Math.hypot(point.x - last.x, point.y - last.y) < 0.003) return;
    drawingRef.current = tool === 'pen' ? [...drawingRef.current, point] : [drawingRef.current[0], point];
    if (Date.now() - lastDraftRef.current > 30) {
      lastDraftRef.current = Date.now(); setDraft(drawingRef.current);
    }
  };

  const finish = () => {
    const points = drawingRef.current;
    drawingRef.current = null;
    setDraft([]);
    if (!points?.length) return;
    const finalPoints = points.length === 1
      ? [points[0], { x: Math.min(1, points[0].x + 0.001), y: points[0].y }]
      : points;
    if (tool === 'pen') sendOperation({ type: 'STROKE', points: sampleStrokePoints(finalPoints), color, width });
    else sendOperation({ type: 'SHAPE', shape: tool.toUpperCase(), points: [finalPoints[0], finalPoints.at(-1)], color, width });
  };

  const erase = (operationId) => {
    if (tool === 'eraser' && canEdit) sendOperation({ type: 'ERASE', targetOperationId: operationId });
  };

  const clear = () => {
    if (canEdit && window.confirm('Clear the board for both members?')) sendOperation({ type: 'CLEAR' });
  };

  const close = async () => {
    if (!window.confirm('Close this room for both members?')) return;
    try {
      const closed = await closeRoom(roomId);
      callHandlerRef.current?.({ type: 'ROOM_CLOSED' });
      setRoom(closed); setStatus('closed');
    } catch (failure) { setError(describeError(failure)); }
  };

  const restart = async () => {
    try {
      await reopenRoom(roomId);
      window.location.reload();
    } catch (failure) {
      setError(failure.response?.status === 403
        ? 'Only the owner of an accepted exchange can restart this room.'
        : 'The room could not be restarted. Please retry.');
    }
  };

  return <main className="min-h-screen pt-20 pb-8 px-3 md:px-6 text-foreground">
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div><Link to="/rooms" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"><ArrowLeft className="w-4 h-4 mr-1" /> All rooms</Link>
          <h1 className="font-heading text-2xl md:text-3xl font-extrabold">Live learning room</h1>
          {room && <p className="text-sm text-muted-foreground">{room.ownerName} and {room.peerName}</p>}</div>
        <div className="flex items-center gap-2">
          <span role="status" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs font-medium">
            {status === 'connected' ? <Wifi className="w-4 h-4 text-emerald-500" /> : <WifiOff className="w-4 h-4 text-amber-500" />}
            {status === 'connected' ? 'Live' : status === 'syncing' ? 'Catching up' : status === 'recovering' ? 'Recovering' : status === 'loading' || status === 'connecting' ? 'Connecting' : status === 'closed' ? 'Closed' : status === 'denied' ? 'Access denied' : 'Disconnected · retrying'}
          </span>
          {room?.ownerId === currentUser?.id && room?.status === 'OPEN' && <Button variant="outline" onClick={close} size="sm"><X className="w-4 h-4 mr-1" /> Close room</Button>}
          {room?.ownerId === currentUser?.id && room?.status === 'CLOSED' && <Button onClick={restart} size="sm"><RotateCcw className="w-4 h-4 mr-1" /> Restart room</Button>}
        </div>
      </div>
      {error && <div role="alert" className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      {room?.status === 'CLOSED' && <p className="mb-4 text-sm text-muted-foreground">Restarting keeps the saved board and past call summaries. {room?.ownerId !== currentUser?.id && 'The owner can restart this room; this page checks for updates automatically.'}</p>}
      {pendingCount > 0 && <Button className="mb-4 ml-2" size="sm" onClick={retryPending}>Retry {pendingCount} pending {pendingCount === 1 ? 'change' : 'changes'}</Button>}
      {status === 'loading' ? <div className="flex items-center gap-2 py-24 justify-center"><Loader2 className="w-5 h-5 animate-spin" /> Loading saved board…</div> :
        <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-4 items-start">
          <section className="order-2 lg:order-1 min-w-0 rounded-2xl border border-border bg-card/80 p-3 md:p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Button size="sm" variant={tool === 'pen' ? 'default' : 'outline'} disabled={room?.status === 'CLOSED'} onClick={() => setTool('pen')}><PenLine className="w-4 h-4 mr-1" /> Draw</Button>
              <Button size="sm" variant={tool === 'eraser' ? 'default' : 'outline'} disabled={room?.status === 'CLOSED'} onClick={() => setTool('eraser')}><Eraser className="w-4 h-4 mr-1" /> Erase</Button>
              <Button size="sm" variant={tool === 'rectangle' ? 'default' : 'outline'} disabled={room?.status === 'CLOSED'} onClick={() => setTool('rectangle')}><RectangleHorizontal className="w-4 h-4 mr-1" /> Rectangle</Button>
              <Button size="sm" variant={tool === 'ellipse' ? 'default' : 'outline'} disabled={room?.status === 'CLOSED'} onClick={() => setTool('ellipse')}><Circle className="w-4 h-4 mr-1" /> Ellipse</Button>
              <Button size="sm" variant={tool === 'line' ? 'default' : 'outline'} disabled={room?.status === 'CLOSED'} onClick={() => setTool('line')}><Minus className="w-4 h-4 mr-1" /> Line</Button>
              <Button size="sm" variant={tool === 'arrow' ? 'default' : 'outline'} disabled={room?.status === 'CLOSED'} onClick={() => setTool('arrow')}><MousePointer2 className="w-4 h-4 mr-1" /> Arrow</Button>
              <Button size="sm" variant={tool === 'text' ? 'default' : 'outline'} disabled={room?.status === 'CLOSED'} onClick={() => setTool('text')}><Type className="w-4 h-4 mr-1" /> Text</Button>
              <label className="text-xs flex items-center gap-2 ml-1">Color <input aria-label="Stroke color" type="color" disabled={room?.status === 'CLOSED'} value={color} onChange={event => setColor(event.target.value)} /></label>
              <label className="text-xs flex items-center gap-2">Size <select aria-label="Stroke size" disabled={room?.status === 'CLOSED'} value={width} onChange={event => setWidth(Number(event.target.value))} className="rounded-md border border-border bg-background p-1">{[2, 4, 8, 12, 18].map(size => <option key={size}>{size}</option>)}</select></label>
              <Button size="sm" variant="outline" onClick={clear} disabled={!canEdit}><Trash2 className="w-4 h-4 mr-1" /> Clear</Button>
              {saving > 0 && <span className="text-xs text-muted-foreground"><Loader2 className="w-3 h-3 inline animate-spin" /> Saving</span>}
            </div>
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-border bg-white" style={{ backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
              <svg aria-label="Shared whiteboard" viewBox="0 0 1000 1000" preserveAspectRatio="none" className={`absolute inset-0 w-full h-full ${tool === 'eraser' ? 'cursor-crosshair' : 'cursor-pencil'}`} style={{ touchAction: 'none' }}
                onPointerDown={begin} onPointerMove={move} onPointerUp={finish} onPointerCancel={finish}
                onPointerLeave={() => publishCursor({ x: 0.5, y: 0.5 }, false)}>
                <defs><marker id="board-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8" fill="none" stroke="currentColor" /></marker></defs>
                {strokes.map(item => <BoardItem key={item.operationId} item={item} onErase={tool === 'eraser' ? erase : undefined} />)}
                {draft.length > 0 && <BoardItem item={{ operationId: 'draft', type: tool === 'pen' ? 'STROKE' : 'SHAPE', shape: tool.toUpperCase(), points: draft, color, width }} onErase={() => {}} />}
              </svg>
              {textDraft && <div className="absolute z-20 flex gap-1" style={{ left: `${textDraft.point.x * 100}%`, top: `${textDraft.point.y * 100}%` }}><input autoFocus aria-label="Whiteboard text" maxLength={500} value={textDraft.value} onChange={event => setTextDraft({ ...textDraft, value: event.target.value })} onKeyDown={event => { if (event.key === 'Enter') { if (textDraft.value.trim()) sendOperation({ type: 'TEXT', points: [textDraft.point], text: textDraft.value.trim(), color, width }); setTextDraft(null); } if (event.key === 'Escape') setTextDraft(null); }} className="rounded border border-border bg-white text-black px-2 py-1 text-sm" /><Button size="sm" onClick={() => { if (textDraft.value.trim()) sendOperation({ type: 'TEXT', points: [textDraft.point], text: textDraft.value.trim(), color, width }); setTextDraft(null); }}>Add</Button></div>}
              {peerOnline && peerCursor.active && <div className="absolute pointer-events-none z-10" style={{ left: `${peerCursor.x * 100}%`, top: `${peerCursor.y * 100}%` }}><span className="block w-3 h-3 rounded-full bg-[var(--accent)] border-2 border-white" /><span className="text-xs bg-[var(--accent)] text-white rounded px-1">{peerCursor.userName}</span></div>}
              {!canEdit && <div className="absolute inset-0 bg-background/40 flex items-center justify-center text-center p-4 pointer-events-none"><span className="rounded-xl bg-card border border-border p-3 text-sm">{status === 'closed' ? 'This room is closed.' : status === 'denied' ? 'You cannot access this board.' : 'Waiting for the live connection…'}</span></div>}
            </div>
            <p className="text-xs text-muted-foreground mt-3">Draw with a mouse, pen, or touch. Select Erase and tap a stroke to remove it.</p>
          </section>
          <aside className="order-1 lg:order-2 min-w-0">
            {room && <VideoCallPanel roomId={roomId} room={room} currentUser={currentUser} socketClient={socketRef.current} socketConnected={status === 'connected'} registerCallHandler={registerCallHandler} />}
            <div className="rounded-2xl border border-border bg-card/80 p-5 h-fit">
            <h2 className="font-bold mb-4">Members</h2>
            {room && <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between"><span>{currentUser?.name || 'You'} (you)</span><span className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-emerald-500' : 'bg-muted-foreground'}`} /></div>
              <div className="flex items-center justify-between"><span>{peer?.name}</span><span className={`w-2 h-2 rounded-full ${peerOnline ? 'bg-emerald-500' : 'bg-muted-foreground'}`} /></div>
              <p className="text-xs text-muted-foreground">Green means connected recently. Cursor positions are temporary.</p>
            </div>}
            </div>
          </aside>
        </div>}
      {room?.status === 'CLOSED' && <AiSessionPanel roomId={roomId} />}
    </div>
  </main>;
}
