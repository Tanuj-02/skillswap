import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Loader2, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  acceptExchangeRequest,
  rejectExchangeRequest,
  getMyReceivedExchangeRequests,
} from "@/services/exchangeRequestsService";

const avatarGradients = [
  "from-[#7b6cff] to-[#a78bfa]", "from-[#00e5b0] to-[#00a878]",
  "from-[#ff6b9d] to-[#e84393]", "from-[#f59e0b] to-[#ef4444]",
  "from-[#3b82f6] to-[#7c3aed]", "from-[#10b981] to-[#0891b2]",
];

export default function Request() {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Pending"); 
  const [processingId, setProcessingId] = useState(null);

  const normalizeRequest = (req) => ({
    ...req,
    status: (req.status || "Pending").charAt(0).toUpperCase() + (req.status || "Pending").slice(1).toLowerCase(),
    senderid: req.sender?.id || "",
    senderName: req.sender?.name || "Unknown User",
    senderUserName: req.sender?.username || "user",
    askingSkills: req.sender?.skills?.wantsToLearn || [],
    offeredSkills: req.sender?.skills?.canTeach || [],
  });

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const data = await getMyReceivedExchangeRequests();
        console.log("Fetched requests:", data);
        const normalizedData = (data || []).map(normalizeRequest);
        console.log("Normalized requests:", normalizedData);
        setRequests(normalizedData);
      } catch (error) {
        console.error("Failed to fetch requests:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const handleUpdateStatus = async (requestId, newStatus) => {
    setProcessingId(requestId);
    try {
      if (String(newStatus).toLowerCase() === "accepted") {
        await acceptExchangeRequest(requestId);
      } else if (String(newStatus).toLowerCase() === "rejected") {
        await rejectExchangeRequest(requestId);
      } else {
        throw new Error(`Unsupported status: ${newStatus}`);
      }
      setRequests(prev => 
        prev.map(req => req.id === requestId ? { ...req, status: newStatus } : req)
      );
    } catch (error) {
      console.error(`Failed to ${newStatus} request:`, error);
      alert("Something went wrong. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-[var(--accent)]" /></div>;
  }

  const filteredRequests = requests.filter(req => {
    const reqStatus = req.status ? req.status.toLowerCase() : "pending";
    return reqStatus === activeTab.toLowerCase();
  });

  return (
    <div className="min-h-screen relative z-10 py-24 px-6">
      <div className="max-w-[800px] mx-auto">

        <div className="mb-10 text-center md:text-left">
          <h1 className="text-[clamp(32px,4vw,44px)] font-heading font-extrabold tracking-[-1px] text-foreground">
            Connection <em className="not-italic text-[var(--accent)]">Requests</em>
          </h1>
          <p className="text-muted-foreground mt-2 font-light">
            Review your incoming skill swap proposals and manage your connections.
          </p>
        </div>

        <div className="flex gap-2 mb-8 border-b border-border pb-px">
          {["Pending", "Accepted", "Rejected"].map(tab => {
            // Safe pending count check
            const pendingCount = requests.filter(r => (r.status ? r.status.toLowerCase() : "pending") === "pending").length;
            
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 px-4 text-sm font-semibold transition-colors relative ${
                  activeTab === tab ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab}
                {tab === "Pending" && pendingCount > 0 && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[var(--primary)]"></span>
                )}
                {activeTab === tab && (
                  <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--accent)]" />
                )}
              </button>
            )
          })}
        </div>

        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredRequests.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-center py-20 bg-card/40 rounded-3xl border-[0.5px] border-border backdrop-blur-sm flex flex-col items-center"
              >
                <div className="w-16 h-16 rounded-full bg-surface2 flex items-center justify-center mb-4 text-muted-foreground">
                  <Inbox className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-heading font-bold mb-2">No {activeTab.toLowerCase()} requests</h3>
                <p className="text-muted-foreground text-sm">When someone wants to swap skills with you, it will appear here.</p>
              </motion.div>
            ) : (
              filteredRequests.map((req, i) => (
                <motion.div
                  key={req.id || i}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-6 rounded-[24px] bg-card/60 backdrop-blur-[12px] border-[0.5px] border-border hover:border-[var(--accent)]/40 transition-colors shadow-sm relative overflow-hidden"
                >
                  <div className="flex flex-col md:flex-row gap-6 md:items-start justify-between">
                    
                    <div className="flex gap-4 flex-1">
                      {/* 🔥 EXTREME SAFETY AVATAR */}
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-heading text-lg font-extrabold text-white shadow-md bg-gradient-to-br ${avatarGradients[req.senderid ? req.senderid.charCodeAt(0) % avatarGradients.length : 0]}`}>
                        {req.senderName ? req.senderName.split(' ').map(n => n[0]).join('').substring(0,2) : 'U'}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2 mb-1">
                          <h3 className="font-heading text-lg font-bold text-foreground">{req.senderName || "Unknown User"}</h3>
                          <span className="text-xs text-muted-foreground">@{req.senderUserName || "user"}</span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2 mb-3 text-sm">
                          <span className="text-muted-foreground">Wants to learn</span>
                          <span className="font-semibold text-[var(--primary)] bg-[var(--primary-dim)] px-2 py-0.5 rounded border border-[var(--primary-border)]">
                            {req.askingSkills?.[0] || "a skill"}
                          </span>
                          <span className="text-muted-foreground">in exchange for</span>
                          <span className="font-semibold text-[var(--accent)] bg-[var(--accent-dim)] px-2 py-0.5 rounded border border-[var(--accent-border)]">
                            {req.offeredSkills?.[0] || "a skill"}
                          </span>
                        </div>

                        <div className="p-4 rounded-xl bg-background/50 border border-border text-sm text-foreground/90 leading-relaxed italic">
                          "{req.message || "I'd love to connect and swap skills!"}"
                        </div>
                      </div>
                    </div>

                    {activeTab === "Pending" && (
                      <div className="flex md:flex-col gap-3 shrink-0 mt-4 md:mt-0">
                        <Button 
                          onClick={() => handleUpdateStatus(req.id, "Accepted")}
                          disabled={processingId === req.id}
                          className="flex-1 md:flex-none h-11 px-6 bg-[var(--learn-bg)] text-[var(--learn-text)] border border-[var(--learn-border)] hover:bg-[var(--learn-text)] hover:text-white rounded-xl font-bold transition-all shadow-sm"
                        >
                          {processingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-2" /> Accept</>}
                        </Button>
                        <Button 
                          onClick={() => handleUpdateStatus(req.id, "Rejected")}
                          disabled={processingId === req.id}
                          variant="outline" 
                          className="flex-1 md:flex-none h-11 px-6 rounded-xl border-border/80 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 font-semibold"
                        >
                          <X className="w-4 h-4 mr-2" /> Decline
                        </Button>
                      </div>
                    )}

                    {activeTab !== "Pending" && (
                      <div className="shrink-0 flex items-center justify-center px-4 py-2 rounded-xl bg-surface2 border border-border mt-4 md:mt-0">
                        <span className={`text-sm font-bold ${activeTab === 'Accepted' ? 'text-[var(--learn-text)]' : 'text-muted-foreground'}`}>
                          {activeTab}
                        </span>
                      </div>
                    )}

                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}