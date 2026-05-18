import { useEffect, useState, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
  fetchConversations, 
  fetchMessages, 
  setActiveConversation, 
  postMessage, 
  appendMessage 
} from "@/store/slices/chatSlice";
import { fetchCurrentUser } from "@/store/slices/userSlice";
import { Button } from "@/components/ui/button";
import { MessageCircle, User, Send, LogOut, Loader2 } from "lucide-react";
import { disconnectExchange } from "@/services/exchangeRequestsService";

export default function Chat() {
  const dispatch = useDispatch();
  const scrollRef = useRef(null);
  
  const { messages, conversations, activeConversationId, status } = useSelector((state) => state.chat);
  const { currentUser } = useSelector((state) => state.user);
  const [draft, setDraft] = useState("");
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const activeConversation = conversations?.find(c => c.id === activeConversationId);
  const otherUserId = activeConversation?.otherUserId || activeConversation?.otherUser?.id;

  const handleDisconnect = async () => {
    if (!otherUserId || !window.confirm(`Disconnect from ${activeConversation?.otherName}? You can reconnect later.`)) return;
    
    setIsDisconnecting(true);
    try {
      await disconnectExchange(otherUserId);
      console.log("✅ Disconnected successfully");
      dispatch(fetchConversations());
      dispatch(setActiveConversation(null));
    } catch (error) {
      console.error("❌ Failed to disconnect:", error);
      alert("Failed to disconnect. Please try again.");
    } finally {
      setIsDisconnecting(false);
    }
  };

  useEffect(() => {
    dispatch(fetchCurrentUser());
    dispatch(fetchConversations());
  }, [dispatch]);

  useEffect(() => {
    let interval;
    if (activeConversationId) {
      dispatch(fetchMessages(activeConversationId));
      interval = setInterval(() => {
        dispatch(fetchMessages(activeConversationId));
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [dispatch, activeConversationId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const renderedMessages = useMemo(() => {
    const sorted = [...messages].sort((a, b) => 
      new Date(a.createdAt || a.timestamp) - new Date(b.createdAt || b.timestamp)
    );

    return sorted.map((msg) => {
      const isMe = msg.senderId === currentUser?.id || msg.senderUsername === currentUser?.username;
      
      return (
        <div key={msg.id || Math.random()} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
          <div className={`max-w-[70%] p-3 px-5 rounded-[22px] text-sm shadow-sm ${
            isMe 
              ? "bg-[var(--primary)] text-white rounded-tr-none" 
              : "bg-muted border border-border text-foreground rounded-tl-none"
          }`}>
            <p className="leading-relaxed font-medium">{msg.content}</p>
            <p className={`text-[10px] mt-1.5 opacity-60 text-right ${isMe ? "text-white" : "text-muted-foreground"}`}>
              {new Date(msg.createdAt || msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </div>
      );
    });
  }, [messages, currentUser]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!draft.trim() || !activeConversationId) return;

    const messageText = draft.trim();
    setDraft("");

    dispatch(appendMessage({
      id: Date.now(),
      senderId: currentUser?.id,
      senderUsername: currentUser?.username,
      content: messageText,
      createdAt: new Date().toISOString(),
    }));

    try {
      await dispatch(postMessage({ conversationId: activeConversationId, content: messageText })).unwrap();
    } catch (error) {
      console.error("Failed to send:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen pt-24 pb-8 px-4 md:px-10">
      <div className="flex h-[calc(100vh-160px)] w-full max-w-6xl gap-6">
        
        {/* SIDEBAR */}
        <div className="w-80 hidden md:flex flex-col bg-card border border-border rounded-[35px] overflow-hidden shadow-sm">
          <div className="p-7 border-b border-border flex items-center gap-3">
            <MessageCircle className="w-6 h-6 text-[var(--primary)]" />
            <h2 className="font-bold text-xl tracking-tight text-foreground">Chats</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
            {conversations?.map((chat) => (
              <button
                key={chat.id}
                onClick={() => {
                  dispatch(setActiveConversation(chat.id));
                  dispatch(fetchMessages(chat.id));
                }}
                className={`w-full flex items-center gap-4 p-4 rounded-[28px] transition-all ${
                  activeConversationId === chat.id 
                    ? "bg-[var(--primary)] text-white shadow-lg scale-[1.02]" 
                    : "hover:bg-muted text-muted-foreground"
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-muted flex-shrink-0 flex items-center justify-center border-2 border-card shadow-sm">
                  <User size={22} className={activeConversationId === chat.id ? "text-white" : "text-muted-foreground"} />
                </div>
                <div className="text-left overflow-hidden">
                  <p className="font-bold truncate text-[15px]">{chat.otherName || chat.otherUsername}</p>
                  <p className="text-xs truncate opacity-70">Active Connection</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-card/60 backdrop-blur-md border border-border rounded-[35px] overflow-hidden shadow-sm relative">
          {activeConversationId ? (
            <>
              <div className="p-6 bg-card border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center border-2 border-card shadow-sm">
                    <User size={22} className="text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{activeConversation?.otherName || "Connected User"}</p>
                    <p className="text-xs text-muted-foreground">Active Connection</p>
                  </div>
                </div>
                <Button
                  onClick={handleDisconnect}
                  disabled={isDisconnecting}
                  variant="outline"
                  className="h-10 px-4 border-destructive/50 text-destructive hover:bg-destructive/10 transition-all"
                >
                  {isDisconnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><LogOut className="w-4 h-4 mr-2" /> Disconnect</>}
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-5 no-scrollbar">
                {renderedMessages}
                <div ref={scrollRef} />
              </div>

              <div className="p-6 bg-card border-t border-border">
                <form onSubmit={handleSend} className="flex gap-3 bg-background p-2 rounded-[25px] border border-border shadow-inner">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-transparent px-5 outline-none text-sm text-foreground"
                  />
                  <Button type="submit" size="icon" className="rounded-full h-12 w-12 bg-[var(--primary)] hover:bg-[var(--primary)]/90 transition-transform active:scale-95 shadow-md">
                    <Send size={18} className="text-white" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-10">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6 shadow-sm border border-border">
                 <MessageCircle size={40} className="text-[var(--primary)] opacity-30" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Your Conversations</h3>
              <p className="text-sm max-w-[280px] text-center mt-2">Select a peer from the left to begin swapping skills and growing together.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}