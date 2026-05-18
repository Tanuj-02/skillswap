import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { login } from "@/services/authService";
import { useUser } from "@/context/UserContext";

export default function Login() {
  const navigate = useNavigate();
  const { refreshUserData } = useUser();
  
  // Form State
  const [formData, setFormData] = useState({
    username: "", // Note: Your backend expects 'username', not email for the login request DTO right now
    password: "",
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInput = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(""); // Clear error when user types
  };

 const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true); // Turn on the spinner!
    setError("");
    try {
      const data = await login(formData);
      
      const token = data?.token;
      if (!token) throw new Error("Missing token in login response");
      localStorage.setItem("jwt_token", token);
      refreshUserData(); 
      navigate("/dashboard"); 

    } catch (error) {
      console.error("Login failed!", error);
      setError(error?.response?.data?.message || error?.response?.data || "Login failed. Please check credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 rounded-[24px] bg-card/60 backdrop-blur-xl border-[0.5px] border-border shadow-2xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-extrabold tracking-[-1px] mb-2">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground">
            Log in to continue swapping skills.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleLogin}>
          {error && (
            <div className="p-3 text-sm font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-xl text-center">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInput}
              placeholder="e.g. rohit_s"
              className="w-full h-12 px-4 rounded-xl bg-background/50 border border-border focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-dim)] outline-none transition-all text-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInput}
              placeholder="••••••••"
              className="w-full h-12 px-4 rounded-xl bg-background/50 border border-border focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-dim)] outline-none transition-all text-sm"
              required
            />
          </div>

          <Button 
            disabled={isLoading}
            className="w-full h-12 mt-4 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white rounded-xl font-semibold shadow-lg transition-transform hover:-translate-y-0.5"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Log In"}
          </Button>
        </form>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/register" className="font-semibold text-[var(--accent)] hover:underline">
            Sign up
          </Link>
        </div>
      </motion.div>
    </div>
  );
}