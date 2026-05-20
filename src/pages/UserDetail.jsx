import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "@/context/UserContext";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Zap, ArrowRight, Loader2, GraduationCap, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getUserById } from "@/services/userService";
import { disconnectExchange } from "@/services/exchangeRequestsService";
import ConnectModal from "../components/ConnectModal";

const avatarGradients = ["from-[#7b6cff] to-[#a78bfa]", "from-[#00e5b0] to-[#00a878]", "from-[#ff6b9d] to-[#e84393]", "from-[#f59e0b] to-[#ef4444]"];

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, connectionRequests, isUserLoading, refreshUserData } = useUser();
  const [peer, setPeer] = useState(null);
  const [isLoadingPeer, setIsLoadingPeer] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  useEffect(() => {
    const fetchPeerData = async () => {
      try {
        const pData = await getUserById(id);
        setPeer(pData);
      } catch (error) {
        console.error("Failed to fetch user profile", error);
      } finally {
        setIsLoadingPeer(false);
      }
    };
    fetchPeerData();
  }, [id]);

  const handleDisconnect = async () => {
    if (!window.confirm(`Disconnect from ${peer.name}? You can reconnect later.`)) return;
    
    setIsDisconnecting(true);
    try {
      await disconnectExchange(peer.id);
      console.log("✅ Disconnected successfully");
      await refreshUserData();
    } catch (error) {
      console.error("❌ Failed to disconnect:", error);
      alert("Failed to disconnect. Please try again.");
    } finally {
      setIsDisconnecting(false);
    }
  };

  if (isUserLoading || isLoadingPeer) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-[var(--accent)]" /></div>;
  if (!peer) return <div className="min-h-screen flex items-center justify-center text-xl font-heading">User not found</div>;

  const isSameCollege = peer.college && currentUser?.college && peer.college.toLowerCase() === currentUser.college.toLowerCase();
  const teachesWhatIWant = currentUser?.wantsToLearn.some(skill => peer.canTeach.includes(skill));
  const wantsWhatITeach = currentUser?.canTeach.some(skill => peer.wantsToLearn.includes(skill));
  const isMutualMatch = teachesWhatIWant && wantsWhatITeach;

  return (
    <div className="min-h-screen relative z-10 py-24 px-6">
      <div className="max-w-[800px] mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-8 md:p-10 rounded-[32px] bg-card/60 backdrop-blur-[12px] border-[0.5px] border-border shadow-sm">
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start mb-10 text-center md:text-left">
            <div className={`w-32 h-32 shrink-0 rounded-[32px] flex items-center justify-center font-heading text-4xl font-extrabold text-white bg-gradient-to-br ${avatarGradients[peer.id?.toString().charCodeAt(0) % avatarGradients.length || 0]}`}>
              {peer.name?.split(' ').map(n => n[0]).join('').substring(0,2)}
            </div>
            <div className="flex-1 mt-2">
              <h1 className="text-3xl md:text-4xl font-heading font-extrabold text-foreground mb-2">{peer.name}</h1>
              <p className="text-lg text-muted-foreground mb-4">@{peer.username}</p>
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                {isMutualMatch && <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase px-3 py-1 rounded-lg bg-[var(--primary-dim)] text-[var(--primary)] border-[0.5px] border-[var(--primary-border)]"><Zap className="w-4 h-4" /> Mutual Match</span>}
                {peer.college && <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase px-3 py-1 rounded-lg border-[0.5px] bg-surface2 text-muted-foreground"><GraduationCap className="w-4 h-4" /> {peer.college}</span>}
              </div>
            </div>
          </div>

          {peer.bio && (
            <div className="mb-10">
              <h2 className="font-heading text-xl font-bold mb-3">About {peer.name.split(' ')[0]}</h2>
              <p className="text-base leading-7 text-muted-foreground">{peer.bio}</p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div>
              <h3 className="font-heading text-lg font-bold mb-4 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[var(--accent)]"></span> Can Teach</h3>
              <div className="flex flex-wrap gap-2">
                {peer.canTeach.map((skill, i) => <span key={i} className="px-3 py-1.5 rounded-xl border-[0.5px] bg-[var(--teach-bg)] border-[var(--teach-border)] text-[var(--teach-text)] font-semibold text-sm">{skill}</span>)}
              </div>
            </div>
            <div>
              <h3 className="font-heading text-lg font-bold mb-4 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[var(--primary)]"></span> Wants to Learn</h3>
              <div className="flex flex-wrap gap-2">
                {peer.wantsToLearn.map((skill, i) => <span key={i} className="px-3 py-1.5 rounded-xl border-[0.5px] bg-[var(--learn-bg)] border-[var(--learn-border)] text-[var(--learn-text)] font-semibold text-sm">{skill}</span>)}
              </div>
            </div>
          </div>

          {(() => {
            console.log("🔍 Checking requests for peer:", peer.id);
            console.log("📋 Available connection requests:", connectionRequests);
            
            // Check for any existing request (sent or received) with this peer
            const existingReq = connectionRequests.find(req => {
              const senderId = req.sender?.id || req.senderid || req.senderId;
              const receiverId = req.receiver?.id || req.receiverid || req.receiverId;
              const peerId = String(peer.id);
              
              console.log(`  Comparing: sender=${senderId}, receiver=${receiverId} with peer=${peerId}`);
              
              return (
                String(senderId) === peerId || String(receiverId) === peerId
              );
            });

            console.log("Found existing request:", existingReq);
            const status = existingReq?.status?.toUpperCase();

            if (status === "PENDING") return <Button disabled className="w-full h-14 rounded-2xl text-lg font-bold bg-surface2 text-muted-foreground border cursor-not-allowed">Request Pending...</Button>;
            if (status === "ACCEPTED") return (
              <div className="flex gap-3">
                <Button className="flex-1 h-14 rounded-2xl text-lg font-bold bg-[var(--learn-bg)] text-[var(--learn-text)] border border-[var(--learn-border)] cursor-default">Connected ✓</Button>
                <Button onClick={handleDisconnect} disabled={isDisconnecting} variant="outline" className="flex-1 h-14 rounded-2xl text-lg font-bold border-destructive/50 text-destructive hover:bg-destructive/10 transition-all">
                  {isDisconnecting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><LogOut className="w-5 h-5 mr-2" /> Disconnect</>}
                </Button>
              </div>
            );
            if (status === "REJECTED") return <Button disabled className="w-full h-14 rounded-2xl text-lg font-bold bg-surface2 text-muted-foreground border cursor-not-allowed">Request Declined</Button>;
            
            return <Button onClick={() => setIsModalOpen(true)} className="w-full h-14 rounded-2xl text-lg font-bold bg-foreground text-background hover:bg-[var(--accent)] hover:text-white transition-all shadow-md">Connect with {peer.name.split(' ')[0]} <ArrowRight className="w-5 h-5 ml-2" /></Button>;
          })()}
        </motion.div>
      </div>
      <ConnectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} targetUser={peer} currentUser={currentUser} />
    </div>
  );
}