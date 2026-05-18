import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useUser } from "@/context/UserContext";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Zap, Filter, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { fetchPeers } from "@/store/slices/peersSlice";
import ConnectModal from "../components/ConnectModal";

const avatarGradients = ["from-[#7b6cff] to-[#a78bfa]", "from-[#00e5b0] to-[#00a878]", "from-[#ff6b9d] to-[#e84393]", "from-[#f59e0b] to-[#ef4444]", "from-[#3b82f6] to-[#7c3aed]", "from-[#10b981] to-[#0891b2]"];

export default function Discover() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentUser, connectionRequests, isUserLoading } = useUser();
  const { peers, status: peersStatus } = useSelector((state) => state.peers);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all"); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    if (!isUserLoading && peersStatus === "idle") {
      dispatch(fetchPeers());
    }
  }, [dispatch, isUserLoading, peersStatus]);

  const handleOpenModal = (user) => { setSelectedUser(user); setIsModalOpen(true); };

  const filteredUsers = useMemo(() => {
    if (!currentUser) return [];
    return peers.filter((user) => {
      const q = searchQuery.toLowerCase();
      const userWantsToLearn = user.wantToLearn || user.wantsToLearn || [];
      const peerCanTeach = Array.isArray(user.canTeach) ? user.canTeach : [];
      const peerWantsToLearn = Array.isArray(userWantsToLearn) ? userWantsToLearn : [];
      const currentCanTeach = Array.isArray(currentUser?.canTeach) ? currentUser.canTeach : [];
      const currentWantsToLearn = Array.isArray(currentUser?.wantsToLearn) ? currentUser.wantsToLearn : [];
      const matchesSearch = String(user.name).toLowerCase().includes(q) || String(user.username).toLowerCase().includes(q) || peerCanTeach.some((s) => String(s).toLowerCase().includes(q)) || peerWantsToLearn.some((s) => String(s).toLowerCase().includes(q));
      if (!matchesSearch) return false;

      const isSameCollege = user.college && currentUser?.college && user.college.toLowerCase() === currentUser.college.toLowerCase();
      const teachesWhatIWant = currentWantsToLearn.some(skill => peerCanTeach.includes(skill));
      const wantsWhatITeach = currentCanTeach.some(skill => peerWantsToLearn.includes(skill));
      const isMutualMatch = teachesWhatIWant && wantsWhatITeach;

      if (activeTab === "mutual") return isMutualMatch;
      if (activeTab === "college") return isSameCollege;
      return true;
    });
  }, [searchQuery, activeTab, peers, currentUser]);

  if (isUserLoading || peersStatus === "loading") return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-[var(--accent)]" /></div>;
console.log("peers:", peers);
console.log("currentUser:", currentUser);
console.log("filteredUsers:", filteredUsers);
  return (
    <div className="min-h-screen relative z-10 py-24 px-6">
      <div className="max-w-[1240px] mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-heading font-extrabold text-foreground">Discover <em className="not-italic text-[var(--accent)]">Peers</em></h1>
          <p className="text-muted-foreground mt-2 font-light">Find your perfect learning partner.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-10">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-14 pl-12 pr-4 rounded-2xl bg-card/60 backdrop-blur-md border-[0.5px] border-border outline-none text-sm" />
          </div>
          <div className="flex gap-2">
            {[{ id: "all", label: "All Peers", icon: <Filter className="w-4 h-4" /> }, { id: "mutual", label: "Mutual Matches", icon: <Zap className="w-4 h-4" /> }, { id: "college", label: "Same College", icon: <MapPin className="w-4 h-4" /> }].map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 h-14 px-6 rounded-2xl font-semibold text-sm border-[0.5px] ${activeTab === tab.id ? "bg-[var(--accent)] text-white border-[var(--accent)]" : "bg-card/60 text-muted-foreground border-border"}`}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        <motion.div layout className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredUsers.map((user, i) => {
               const userWantsToLearn = user.wantToLearn || user.wantsToLearn || [];
               return (
              <motion.div key={user.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="group p-6 rounded-[24px] bg-card/60 backdrop-blur-[12px] border-[0.5px] border-border flex flex-col">
                <div onClick={() => navigate(`/user/${user.id}`)} className="flex items-start gap-4 mb-5 cursor-pointer">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-heading text-lg font-bold text-white bg-gradient-to-br ${avatarGradients[i % avatarGradients.length]}`}>
                    {user.name.split(' ').map(n => n[0]).join('').substring(0,2)}
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-bold truncate">{user.name}</h3>
                    <p className="text-xs text-muted-foreground">@{user.username}</p>
                  </div>
                </div>

                <div className="space-y-4 flex-1">
                   <div>
                     <div className="text-[10px] font-bold uppercase text-muted-foreground mb-2">Can Teach</div>
                     <div className="flex flex-wrap gap-1.5">{user.canTeach.map((skill, idx) => <span key={idx} className="text-xs font-medium px-2 py-1 rounded border bg-[var(--teach-bg)] border-[var(--teach-border)] text-[var(--teach-text)]">{skill}</span>)}</div>
                   </div>
                   <div>
                     <div className="text-[10px] font-bold uppercase text-muted-foreground mb-2">Wants to Learn</div>
                     <div className="flex flex-wrap gap-1.5">{userWantsToLearn.map((skill, idx) => <span key={idx} className="text-xs font-medium px-2 py-1 rounded border bg-[var(--learn-bg)] border-[var(--learn-border)] text-[var(--learn-text)]">{skill}</span>)}</div>
                   </div>
                </div>

                <div className="pt-5 mt-auto flex gap-3">
                  <Button onClick={() => navigate(`/user/${user.id}`)} variant="outline" className="flex-1 h-11 rounded-xl">View</Button>
                  {(() => {
                    const existingReq = connectionRequests.find(req => {
                      const reqSenderId = req.sender?.id || req.senderid || req.senderId;
                      const reqReceiverId = req.receiver?.id || req.receiverid || req.receiverId;
                      const userId = String(user.id);
                      return String(reqSenderId) === userId || String(reqReceiverId) === userId;
                    });
                    const status = existingReq?.status?.toUpperCase();

                    if (status === "PENDING") return <Button disabled variant="outline" className="flex-1 h-11 rounded-xl opacity-60">Pending</Button>;
                    if (status === "ACCEPTED") return <Button disabled className="flex-1 h-11 bg-[var(--learn-bg)] text-[var(--learn-text)] border border-[var(--learn-border)] rounded-xl opacity-100">Connected ✓</Button>;
                    if (status === "REJECTED") return <Button disabled variant="outline" className="flex-1 h-11 rounded-xl opacity-60">Declined</Button>;
                    return <Button onClick={() => handleOpenModal(user)} className="flex-1 h-11 bg-foreground text-background hover:bg-[var(--accent)] hover:text-white rounded-xl">Connect <ArrowRight className="w-4 h-4 ml-2" /></Button>;
                  })()}
                </div>
              </motion.div>
            )})}
          </AnimatePresence>
        </motion.div>
      </div>
      <ConnectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} targetUser={selectedUser ? { ...selectedUser, wantsToLearn: selectedUser.wantToLearn || selectedUser.wantsToLearn } : null} currentUser={currentUser} />
    </div>
  );
}