import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Loader2, LogOut } from "lucide-react"
import { useState } from "react"
import { disconnectExchange } from "@/services/exchangeRequestsService"

export default function UserCard({ user, isConnected = false, onDisconnect = null }) {
  const navigate = useNavigate()
  const [isDisconnecting, setIsDisconnecting] = useState(false)

  const handleDisconnect = async (e) => {
    e.stopPropagation()
    if (!window.confirm(`Disconnect from ${user.name}?`)) return
    
    setIsDisconnecting(true)
    try {
      await disconnectExchange(user.id)
      console.log("✅ Disconnected successfully")
      if (onDisconnect) onDisconnect(user.id)
    } catch (error) {
      console.error("❌ Failed to disconnect:", error)
      alert("Failed to disconnect. Please try again.")
    } finally {
      setIsDisconnecting(false)
    }
  }

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.2 }}
      onClick={() => navigate(`/user/${user.id}`)}
      className="cursor-pointer"
    >
      <Card className="rounded-xl shadow-sm hover:shadow-md transition">
        <CardContent className="p-5 space-y-4">

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 text-[16px] font-heading rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-extrabold">
              {user.name[0]}
            </div>
            <div>
              <p className="font-bold text-[15px] font-heading tracking-[-0.3px]">{user.name}</p>
              <p className="text-sm text-muted-foreground">
                @{user.username}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">Can Teach</p>
            <div className="flex flex-wrap gap-2">
              {user.canTeach.map((skill, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-1 rounded-md bg-chart-2 text-white"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">Wants to Learn</p>
            <div className="flex flex-wrap gap-2">
              {user.wantToLearn.map((skill, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {isConnected && (
            <Button
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              variant="outline"
              className="w-full mt-2 h-9 text-xs border-destructive/50 text-destructive hover:bg-destructive/10"
            >
              {isDisconnecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <><LogOut className="w-3 h-3 mr-1" /> Disconnect</> }
            </Button>
          )}

        </CardContent>
      </Card>
    </motion.div>
  )
}