import { Link, useNavigate, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  Menu,
  X,
  Sun,
  Moon,
  User,
  LogOut
} from "lucide-react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "next-themes"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => setMounted(true), [])

  // 1. REAL AUTH CHECK: Check if the token exists in localStorage
  const isLoggedIn = !!localStorage.getItem("jwt_token")

  // 2. LOGOUT LOGIC: Clear token and redirect
  const handleLogout = () => {
    localStorage.removeItem("jwt_token")
    setIsOpen(false) // Close mobile menu if open
    navigate("/login")
  }

  // Optional: Hide the navbar completely if the user is on the login or register page
  // if (location.pathname === "/login" || location.pathname === "/register") {
  //   return null;
  // }

  return (
    <nav className="fixed w-full border-b bg-background/80 backdrop-blur top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

        <Link to={isLoggedIn ? "/dashboard" : "/"} className="font-heading text-[clamp(32px,4vw,48px)] font-extrabold tracking-[-1.5px] leading-[1.1] text-foreground mb-2.5">
          SkillSwap
        </Link>
        
        <div className="hidden md:flex items-center gap-6 ml-auto">

          {isLoggedIn && (
            <>
              <Link to="/discover" className="text-sm hover:text-primary transition">
                Discover
              </Link>
              <Link to="/request" className="text-sm hover:text-primary transition">
                Requests
              </Link>
              <Link to="/chat" className="text-sm hover:text-primary transition">
                Chat
              </Link>
            </>
          )}

          {mounted && (
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() =>
                setTheme(theme === "dark" ? "light" : "dark")
              }
              className="p-2 rounded-md hover:bg-muted transition"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </motion.button>
          )}

          {/* Auth Section */}
          {!isLoggedIn ? (
            <>
              <Link to="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link to="/register">
                <Button>Get Started</Button>
              </Link>
            </>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 hover:bg-muted px-3 py-2 rounded-md transition">
                  <User size={18} />
                  <span className="text-sm">Profile</span>
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-40">
                <Link to="/profile">
                  <DropdownMenuItem className="cursor-pointer">
                    <User size={16} className="mr-2" />
                    Profile
                  </DropdownMenuItem>
                </Link>

                <DropdownMenuItem className="text-red-500 cursor-pointer" onClick={handleLogout}>
                  <LogOut size={16} className="mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Mobile Button */}
        <motion.button
          whileTap={{ scale: 0.8 }}
          className="md:hidden"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </motion.button>
      </div>

      {/* MOBILE */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="md:hidden px-4 pb-6 pt-4 border-t bg-background space-y-4 shadow-xl"
          >

            {isLoggedIn && (
              <div className="flex flex-col gap-3">
                <Link
                  to="/discover"
                  onClick={() => setIsOpen(false)}
                  className="text-sm font-medium p-2 rounded-md hover:bg-muted"
                >
                  Discover
                </Link>
                <Link
                  to="/request"
                  onClick={() => setIsOpen(false)}
                  className="text-sm font-medium p-2 rounded-md hover:bg-muted"
                >
                  Requests
                </Link>
                <Link
                  to="/chat"
                  onClick={() => setIsOpen(false)}
                  className="text-sm font-medium p-2 rounded-md hover:bg-muted"
                >
                  Chat
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setIsOpen(false)}
                  className="text-sm font-medium p-2 rounded-md hover:bg-muted"
                >
                  Profile
                </Link>
              </div>
            )}

            {mounted && (
              <button
                onClick={() => {
                  setTheme(theme === "dark" ? "light" : "dark")
                  setIsOpen(false)
                }}
                className="flex items-center gap-2 text-sm p-2 rounded-md hover:bg-muted w-full"
              >
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                Toggle Theme
              </button>
            )}

            <div className="pt-2 flex flex-col gap-3">
              {!isLoggedIn ? (
                <>
                  <Link to="/login" onClick={() => setIsOpen(false)}>
                    <Button variant="ghost" className="w-full">
                      Login
                    </Button>
                  </Link>
                  <Link to="/register" onClick={() => setIsOpen(false)}>
                    <Button className="w-full">
                      Get Started
                    </Button>
                  </Link>
                </>
              ) : (
                <Button variant="destructive" className="w-full" onClick={handleLogout}>
                  Logout
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}