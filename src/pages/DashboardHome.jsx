import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useUser } from "@/context/UserContext";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { fetchPeers } from "@/store/slices/peersSlice";
import ConnectModal from "../components/ConnectModal";

const avatarGradients = ["from-[#7b6cff] to-[#a78bfa]", "from-[#00e5b0] to-[#00a878]", "from-[#ff6b9d] to-[#e84393]", "from-[#f59e0b] to-[#ef4444]"];

export default function DashboardHome() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentUser, connectionRequests, isUserLoading } = useUser();
  const { peers, status: peersStatus } = useSelector((state) => state.peers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const suggestedPeers = useMemo(() => peers.slice(0, 3), [peers]);

  useEffect(() => {
    if (!isUserLoading) {
      dispatch(fetchPeers());
    }
  }, [dispatch, isUserLoading]);

  const handleOpenModal = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  if (isUserLoading || peersStatus === "loading") return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-[var(--accent)]" /></div>;

  return (
    <div className="min-h-screen relative z-10 py-24 px-6">
      <div className="max-w-[1000px] mx-auto space-y-12">
        
        <div className="bg-card/40 border border-border backdrop-blur-md p-8 rounded-[32px]">
          <h1 className="text-3xl font-heading font-extrabold mb-2">Welcome back, {currentUser?.name?.split(' ')[0]}! 👋</h1>
          <p className="text-muted-foreground">Ready to learn something new today?</p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-heading font-bold flex items-center gap-2"><Sparkles className="w-5 h-5 text-[var(--accent)]" /> Suggested Matches</h2>
            <button onClick={() => navigate('/discover')} className="text-sm font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {suggestedPeers.map((peer, i) => (
              <motion.div key={peer.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="p-6 rounded-[24px] bg-card/60 backdrop-blur-[12px] border-[0.5px] border-border shadow-sm flex flex-col">
                <div onClick={() => navigate(`/user/${peer.id}`)} className="cursor-pointer mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-heading text-lg font-bold text-white mb-3 shadow-md bg-gradient-to-br ${avatarGradients[i % avatarGradients.length]}`}>
                    {peer.name.split(' ').map(n => n[0]).join('').substring(0,2)}
                  </div>
                  <h3 className="font-heading font-bold text-lg leading-tight truncate">{peer.name}</h3>
                  <p className="text-xs text-muted-foreground">@{peer.username}</p>
                </div>

                <div className="mt-auto pt-4 border-t border-border/50">
                  {(() => {
                    const senderId = peer.sender?.id || peer.senderid || peer.senderId;
                    const receiverId = peer.receiver?.id || peer.receiverid || peer.receiverId;
                    const peerId = String(peer.id);
                    
                    const existingReq = connectionRequests.find(req => {
                      const reqSenderId = req.sender?.id || req.senderid || req.senderId;
                      const reqReceiverId = req.receiver?.id || req.receiverid || req.receiverId;
                      return String(reqSenderId) === peerId || String(reqReceiverId) === peerId;
                    });
                    const status = existingReq?.status?.toUpperCase();

                    if (status === "PENDING") return <Button disabled variant="outline" className="w-full h-10 rounded-xl font-semibold opacity-60">Pending</Button>;
                    if (status === "ACCEPTED") return <Button disabled className="w-full h-10 bg-[var(--learn-bg)] text-[var(--learn-text)] border border-[var(--learn-border)] rounded-xl font-bold opacity-100 cursor-default">Connected ✓</Button>;
                    if (status === "REJECTED") return <Button disabled variant="outline" className="w-full h-10 rounded-xl font-semibold opacity-60">Declined</Button>;
                    
                    return <Button onClick={() => handleOpenModal(peer)} className="w-full h-10 bg-surface2 text-foreground hover:bg-[var(--accent)] hover:text-white rounded-xl font-semibold transition-colors">Connect</Button>;
                  })()}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      <ConnectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} targetUser={selectedUser ? { ...selectedUser, wantsToLearn: selectedUser.wantToLearn || selectedUser.wantsToLearn } : null} currentUser={currentUser} />
    </div>
  );
}