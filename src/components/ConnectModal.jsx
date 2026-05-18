import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createExchangeRequest } from "@/services/exchangeRequestsService";

export default function ConnectModal({ isOpen, onClose, targetUser, currentUser }) {
  const [selectedLearn, setSelectedLearn] = useState("");
  const [selectedTeach, setSelectedTeach] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (targetUser && currentUser && isOpen) {
      const overlapLearn = targetUser.canTeach.find(skill => currentUser.wantsToLearn.includes(skill));
      const overlapTeach = currentUser.canTeach.find(skill => targetUser.wantsToLearn.includes(skill));
      
      setSelectedLearn(overlapLearn || targetUser.canTeach[0] || "");
      setSelectedTeach(overlapTeach || currentUser.canTeach[0] || "");
      setIsSuccess(false);
      setError("");
    }
  }, [targetUser, currentUser, isOpen]);

  useEffect(() => {
    if (selectedLearn && selectedTeach && !isSuccess && targetUser) {
      setMessage(
        `Hey ${targetUser.name.split(' ')[0]}! I saw you're looking to learn ${selectedTeach}. I'd love to help you out with that, and in exchange, I was hoping you could teach me some ${selectedLearn}. Let me know if you want to swap!`
      );
    }
  }, [selectedLearn, selectedTeach, targetUser, isSuccess]);

  const handleSend = async () => {
    setIsSubmitting(true);
    setError("");

    try {
      await createExchangeRequest({
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderUserName: currentUser.username,
        receiverId: targetUser.id,
        receiverName: targetUser.name,
        receiverUserName: targetUser.username,
        message: message,
        offeredSkills: [selectedTeach],
        askingSkills: [selectedLearn],
      });

      setIsSuccess(true);
      setTimeout(() => {
        if (onClose) onClose();
      }, 2000);

    } catch (err) {
      console.error("Failed to send request:", err);
      setError("Failed to send request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && targetUser && currentUser && (
        <motion.div 
          initial={{ opacity: 0,scale: 0.95, y: 15 }} animate={{ opacity: 1,scale: 1, y: 0 }} exit={{ opacity: 0,scale: 0.95, y: 15 }} transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        >
          <div onClick={onClose} className="absolute inset-0 bg-background/80 backdrop-blur-sm cursor-pointer" />

          <motion.div 
            initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0 }}
            className="relative w-full max-w-lg bg-card/90 backdrop-blur-xl border border-border shadow-2xl rounded-[24px] overflow-hidden flex flex-col"
          >
            {!isSuccess ? (
              <>
                <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-surface2/30">
                  <div>
                    <h2 className="text-xl font-heading font-bold text-foreground tracking-[-0.5px]">
                      Connect with {targetUser.name.split(' ')[0]}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Propose a skill swap</p>
                  </div>
                  <button onClick={onClose} className="w-8 h-8 rounded-full bg-surface2 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-border transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {error && <div className="text-sm text-destructive font-medium text-center">{error}</div>}
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold tracking-[0.8px] uppercase text-muted-foreground flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[var(--primary)]"></span> I want to learn
                      </label>
                      <select value={selectedLearn} onChange={(e) => setSelectedLearn(e.target.value)} className="w-full h-11 px-3 rounded-xl bg-background/50 border-[0.5px] border-border text-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none cursor-pointer">
                        {targetUser.canTeach.length > 0 ? targetUser.canTeach.map(skill => (
                          <option key={skill} value={skill}>{skill}</option>
                        )) : <option value="">No skills available</option>}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold tracking-[0.8px] uppercase text-muted-foreground flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[var(--accent)]"></span> I can teach
                      </label>
                      <select value={selectedTeach} onChange={(e) => setSelectedTeach(e.target.value)} className="w-full h-11 px-3 rounded-xl bg-background/50 border-[0.5px] border-border text-sm focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] outline-none cursor-pointer">
                        {currentUser.canTeach.length > 0 ? currentUser.canTeach.map(skill => (
                          <option key={skill} value={skill}>{skill}</option>
                        )) : <option value="">No skills available</option>}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold text-foreground">Message</label>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[var(--accent-dim)] text-[var(--accent)] flex items-center gap-1 border border-[var(--accent-border)]">
                        <Sparkles className="w-3 h-3" /> Auto-generated
                      </span>
                    </div>
                    <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} className="w-full p-4 rounded-xl bg-background/50 border-[0.5px] border-border focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] outline-none text-sm leading-relaxed resize-none transition-all" />
                  </div>
                </div>

                <div className="px-6 py-5 border-t border-border bg-surface2/30 flex justify-end gap-3">
                  <Button variant="outline" onClick={onClose} className="h-11 px-6 rounded-xl border-border hover:bg-card">Cancel</Button>
                  <Button onClick={handleSend} disabled={isSubmitting || !message.trim()} className="h-11 px-6 bg-foreground text-background hover:bg-foreground/90 rounded-xl font-bold shadow-lg min-w-[120px]">
                    {isSubmitting ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-4 h-4 border-2 border-background border-t-transparent rounded-full" /> : <>Send Request <Send className="w-4 h-4 ml-2" /></>}
                  </Button>
                </div>
              </>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-10 text-center flex flex-col items-center justify-center min-h-[300px]">
                <div className="w-16 h-16 rounded-full bg-[var(--primary-dim)] flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-[var(--primary)]" />
                </div>
                <h2 className="text-2xl font-heading font-bold mb-2">Request Sent!</h2>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  {targetUser.name.split(' ')[0]} will be notified. You can track this in your Requests tab.
                </p>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}