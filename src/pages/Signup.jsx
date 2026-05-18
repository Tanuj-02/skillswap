import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, CheckCircle2, Loader2 } from "lucide-react";
import { register, login } from "@/services/authService";
import { addSkill as addSkillAPI } from "@/services/skillsService";
import VerificationModal from "@/components/VerificationModal";

export default function Signup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showVerification, setShowVerification] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "", lastName: "", username: "", email: "", password: "", confirmPassword: "",
    college: "", bio: "",
    canTeach: [], wantsToLearn: []
  });

  const [teachInput, setTeachInput] = useState("");
  const [learnInput, setLearnInput] = useState("");

  const handleInput = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleAddSkill = (type) => {
    if (type === "teach" && teachInput.trim()) {
      setFormData({ ...formData, canTeach: [...formData.canTeach, teachInput.trim()] });
      setTeachInput("");
    } else if (type === "learn" && learnInput.trim()) {
      setFormData({ ...formData, wantsToLearn: [...formData.wantsToLearn, learnInput.trim()] });
      setLearnInput("");
    }
  };

  const removeSkill = (type, index) => {
    if (type === "teach") {
      const newSkills = [...formData.canTeach];
      newSkills.splice(index, 1);
      setFormData({ ...formData, canTeach: newSkills });
    } else {
      const newSkills = [...formData.wantsToLearn];
      newSkills.splice(index, 1);
      setFormData({ ...formData, wantsToLearn: newSkills });
    }
  };

  const handleNext = () => {
    setError("");
    if (step === 1) {
      if (!formData.firstName || !formData.lastName || !formData.username || !formData.email || !formData.password || formData.password !== formData.confirmPassword) {
        setError("Please fill all fields and ensure passwords match.");
        return;
      }
    } else if (step === 2) {
      if (!formData.college || !formData.bio) {
        setError("College name and Bio are required.");
        return;
      }
    } else if (step === 3) {
      if (formData.canTeach.length === 0 && formData.wantsToLearn.length === 0) {
        setError("Please add at least one skill to teach or learn.");
        return;
      }
    }
    if (step < 3) setStep(step + 1);
  };

const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    setIsLoading(true);

    try {
      await register({
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        username: formData.username,
        password: formData.password,
        college: formData.college,
        bio: formData.bio,
        profilePicture: "",
      });
      setShowVerification(true);

    } catch (err) {
      console.error("Signup failed", err);
      setError(err.response?.data?.message || "Failed to create account. Username or email may be taken.");
    } finally {
      setIsLoading(false);
    }
  };

 const handleVerificationSuccess = async () => {
  setShowVerification(false);
  setIsLoading(true);
  try {
    const loginRes = await login({
      username: formData.username,
      password: formData.password,
    });
    
    const token = loginRes?.token;
    if (token) {
      localStorage.setItem("jwt_token", token);
      if (formData.canTeach.length > 0 || formData.wantsToLearn.length > 0) {
        try {
          await addSkillAPI({
            canTeach: formData.canTeach,
            wantsToLearn: formData.wantsToLearn,
          });
          console.log("✅ Skills saved successfully");
        } catch (skillErr) {
          console.error("⚠️ Failed to save skills:", skillErr);
          setError("Skills saved with errors, but account created. Check your profile.");
        }
      }
      navigate("/dashboard");
    } else {
      setError("Login failed - no token received. Please try logging in manually.");
    }
  } catch (err) {
    console.error("Verification/Login failed:", err);
    setError(err.response?.data?.message || "Verification successful, but login failed. Please try logging in manually.");
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative z-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl p-8 rounded-[24px] bg-card/60 backdrop-blur-xl border-[0.5px] border-border shadow-2xl overflow-hidden relative"
      >
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {step > 1 && (
              <button onClick={() => setStep(step - 1)} className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <h1 className="text-2xl font-heading font-extrabold tracking-[-0.5px] mx-auto">
              {step === 1 && "Create Account"}
              {step === 2 && "Your Profile"}
              {step === 3 && "Your Skills"}
            </h1>
          </div>
          <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? "w-8 bg-[var(--accent)]" : i < step ? "w-3 bg-[var(--primary)]" : "w-3 bg-border"}`} />
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 text-sm font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-xl text-center">
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">First Name</label>
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleInput} className="w-full h-11 px-4 rounded-xl bg-background/50 border border-border focus:border-[var(--accent)] outline-none text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Last Name</label>
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleInput} className="w-full h-11 px-4 rounded-xl bg-background/50 border border-border focus:border-[var(--accent)] outline-none text-sm" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Username</label>
                <input type="text" name="username" value={formData.username} onChange={handleInput} className="w-full h-11 px-4 rounded-xl bg-background/50 border border-border focus:border-[var(--accent)] outline-none text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleInput} className="w-full h-11 px-4 rounded-xl bg-background/50 border border-border focus:border-[var(--accent)] outline-none text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Password</label>
                  <input type="password" name="password" value={formData.password} onChange={handleInput} className="w-full h-11 px-4 rounded-xl bg-background/50 border border-border focus:border-[var(--accent)] outline-none text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Confirm Password</label>
                  <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInput} className="w-full h-11 px-4 rounded-xl bg-background/50 border border-border focus:border-[var(--accent)] outline-none text-sm" />
                </div>
              </div>
              <Button onClick={handleNext} className="w-full h-12 mt-4 bg-foreground text-background hover:bg-foreground/90 rounded-xl font-semibold">
                Next Step
              </Button>
              <p className="text-center text-sm text-muted-foreground mt-4">
                Already have an account? <Link to="/login" className="text-[var(--accent)] font-semibold hover:underline">Log In</Link>
              </p>
            </motion.div>
          )}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">College / University</label>
                <input type="text" name="college" placeholder="e.g. MIT, Stanford" value={formData.college} onChange={handleInput} className="w-full h-11 px-4 rounded-xl bg-background/50 border border-border focus:border-[var(--accent)] outline-none text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Bio</label>
                <textarea name="bio" placeholder="Tell peers a bit about yourself..." value={formData.bio} onChange={handleInput} rows={4} className="w-full p-4 rounded-xl bg-background/50 border border-border focus:border-[var(--accent)] outline-none text-sm resize-none" />
              </div>
              <Button onClick={handleNext} className="w-full h-12 mt-4 bg-foreground text-background hover:bg-foreground/90 rounded-xl font-semibold">
                Next Step
              </Button>
            </motion.div>
          )}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--accent)]"></span> I can teach
                </label>
                <div className="flex gap-2">
                  <input type="text" placeholder="e.g. React, Java, UI Design" value={teachInput} onChange={(e) => setTeachInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddSkill("teach")} className="flex-1 h-11 px-4 rounded-xl bg-background/50 border border-border outline-none text-sm focus:border-[var(--accent)]" />
                  <Button variant="outline" onClick={() => handleAddSkill("teach")} className="h-11 px-4 rounded-xl border-border"><Plus className="w-4 h-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.canTeach.map((skill, idx) => (
                    <span key={idx} onClick={() => removeSkill("teach", idx)} className="text-xs font-medium px-3 py-1.5 rounded-[8px] border-[0.5px] border-[var(--teach-border)] bg-[var(--teach-bg)] text-[var(--teach-text)] cursor-pointer hover:opacity-80 transition-opacity">
                      {skill} ✕
                    </span>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-sm font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--primary)]"></span> I want to learn
                </label>
                <div className="flex gap-2">
                  <input type="text" placeholder="e.g. Rust, Marketing, DevOps" value={learnInput} onChange={(e) => setLearnInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddSkill("learn")} className="flex-1 h-11 px-4 rounded-xl bg-background/50 border border-border outline-none text-sm focus:border-[var(--primary)]" />
                  <Button variant="outline" onClick={() => handleAddSkill("learn")} className="h-11 px-4 rounded-xl border-border"><Plus className="w-4 h-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.wantsToLearn.map((skill, idx) => (
                    <span key={idx} onClick={() => removeSkill("learn", idx)} className="text-xs font-medium px-3 py-1.5 rounded-[8px] border-[0.5px] border-[var(--learn-border)] bg-[var(--learn-bg)] text-[var(--learn-text)] cursor-pointer hover:opacity-80 transition-opacity">
                      {skill} ✕
                    </span>
                  ))}
                </div>
              </div>

              <Button onClick={handleSubmit} disabled={isLoading} className="w-full h-12 mt-4 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white rounded-xl font-semibold shadow-lg">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {showVerification && (
        <VerificationModal
          email={formData.email}
          onVerified={handleVerificationSuccess}
          onClose={() => setShowVerification(false)}
        />
      )}
    </div>
  );
}