import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2, Plus, RefreshCw, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getMyReceivedExchangeRequests, getMySentExchangeRequests } from '@/services/exchangeRequestsService';
import { createRoom, listRooms } from '@/services/roomService';

export default function Rooms() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [exchanges, setExchanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [roomList, sent, received] = await Promise.all([
        listRooms(), getMySentExchangeRequests(), getMyReceivedExchangeRequests(),
      ]);
      setRooms(roomList || []);
      setExchanges([...sent, ...received].filter(item => item.status === 'ACCEPTED'));
    } catch {
      setError('Rooms could not be loaded. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const available = useMemo(() => exchanges.filter(exchange =>
    !rooms.some(room => room.exchangeRequestId === exchange.id)), [exchanges, rooms]);

  const start = async (exchangeId) => {
    setCreating(exchangeId);
    setError('');
    try {
      const room = await createRoom(exchangeId);
      navigate(`/rooms/${room.id}`);
    } catch (failure) {
      setError(failure.response?.status === 409
        ? 'This exchange already has a closed room.'
        : 'Could not create the room. Please try again.');
    } finally {
      setCreating(null);
    }
  };

  return <main className="min-h-screen pt-24 pb-16 px-4 md:px-8 text-foreground">
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <p className="text-sm font-semibold text-[var(--accent)] mb-2">Learn together</p>
          <h1 className="font-heading text-4xl font-extrabold">Learning rooms</h1>
          <p className="text-muted-foreground mt-2">Draw and explain ideas with an accepted skill exchange partner.</p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}><RefreshCw className="w-4 h-4 mr-2" /> Refresh</Button>
      </div>
      {error && <div role="alert" className="mb-6 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-destructive">{error}</div>}
      {loading ? <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin" /> Loading rooms…</div> : <>
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4">Your rooms</h2>
          {rooms.length === 0 ? <p className="rounded-2xl border border-border bg-card/60 p-6 text-muted-foreground">No rooms yet. Start one from an accepted exchange below.</p> :
            <div className="grid sm:grid-cols-2 gap-4">{rooms.map(room =>
              <div key={room.id} className="rounded-2xl border border-border bg-card/70 p-5 flex items-center justify-between gap-4">
                <div><div className="flex items-center gap-2 font-semibold"><Users className="w-4 h-4" /> {room.ownerName} and {room.peerName}</div>
                  <p className="text-sm text-muted-foreground mt-1">{room.status === 'OPEN' ? 'Live board available' : 'Room closed'} · {room.latestSequence} saved updates</p></div>
                <Link to={`/rooms/${room.id}`}><Button size="sm">{room.status === 'OPEN' ? 'Open' : 'Review'} <ArrowRight className="w-4 h-4 ml-2" /></Button></Link>
              </div>)}</div>}
        </section>
        <section>
          <h2 className="text-xl font-bold mb-4">Start a room</h2>
          {available.length === 0 ? <p className="rounded-2xl border border-border bg-card/60 p-6 text-muted-foreground">No accepted exchanges are waiting for a room. Visit <Link className="underline" to="/request">Requests</Link> to see your connections.</p> :
            <div className="grid sm:grid-cols-2 gap-4">{available.map(exchange =>
              <div key={exchange.id} className="rounded-2xl border border-border bg-card/70 p-5">
                <p className="font-semibold">{exchange.sender?.name || 'Member'} and {exchange.receiver?.name || 'Member'}</p>
                <p className="text-sm text-muted-foreground mt-1 mb-4">{exchange.canTeach?.join(', ')} ↔ {exchange.wantToLearn?.join(', ')}</p>
                <Button onClick={() => start(exchange.id)} disabled={creating !== null}>
                  {creating === exchange.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />} Create room
                </Button>
              </div>)}</div>}
        </section>
      </>}
    </div>
  </main>;
}
