import { useUser } from "@/context/UserContext";
import { Loader2, Key, User, BookOpen, Edit3 } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { changeMyPassword, sendPasswordVerification, updateMe } from "@/services/userService";
import VerificationModal from "@/components/VerificationModal";

export default function Profile() {
  const { currentUser, isUserLoading, setCurrentUser } = useUser();
  const [activeSection, setActiveSection] = useState('info');
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showVerification, setShowVerification] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [userData, setUserData] = useState({
    id: null,
    name: "",
    email: "",
    username: "",
    bio: "",
    college: "",
    canTeach: [],
    wantsToLearn: []
  });
  const [newSkill, setNewSkill] = useState({ teach: "", learn: "" });

  useEffect(() => {
    if (currentUser) {
      setUserData({
        id: currentUser.id || null,
        name: currentUser.name || "",
        email: currentUser.email || "",
        username: currentUser.username || "",
        bio: currentUser.bio || "",
        college: currentUser.college || "",
        canTeach: currentUser.canTeach || [],
        wantsToLearn: currentUser.wantsToLearn || []
      });
    }
  }, [currentUser]);

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("New passwords don't match");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      await sendPasswordVerification();
      setShowVerification(true);
    } catch {
      setError("Failed to send verification code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationSuccess = async (code) => {
    setShowVerification(false);
    try {
      await changeMyPassword(passwordData.oldPassword, passwordData.newPassword, code);
      setError("Password changed successfully");
      setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setShowPasswordChange(false);
    } catch {
      setError("Failed to change password");
    }
  };

  const handleUpdateInfo = async () => {
    try {
      const updatedUser = await updateMe({
        id: userData.id,
        name: userData.name,
        email: userData.email,
        username: userData.username,
        bio: userData.bio,
        college: userData.college,
        canTeach: userData.canTeach,
        wantsToLearn: userData.wantsToLearn,
      });
      setCurrentUser(updatedUser);
      setEditMode(false);
      setError("Info updated successfully");
    } catch {
      setError("Failed to update info");
    }
  };

  const handleAddSkill = async (type) => {
    const skill = type === 'teach' ? newSkill.teach : newSkill.learn;
    if (!skill.trim()) return;
    try {
      const updatedSkills = type === 'teach'
        ? [...userData.canTeach, skill]
        : [...userData.wantsToLearn, skill];
      const payload = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        username: userData.username,
        bio: userData.bio,
        college: userData.college,
        canTeach: type === 'teach' ? updatedSkills : userData.canTeach,
        wantsToLearn: type === 'learn' ? updatedSkills : userData.wantsToLearn,
      };

      const updatedUser = await updateMe(payload);
      setCurrentUser(updatedUser);
      setUserData(prev => ({
        ...prev,
        [type === 'teach' ? 'canTeach' : 'wantsToLearn']: updatedSkills,
      }));
      setNewSkill(prev => ({ ...prev, [type]: "" }));
      setError("Skill added successfully");
    } catch {
      setError("Failed to add skill");
    }
  };

  const handleRemoveSkill = async (skill, type) => {
    try {
      const updatedSkills = type === 'teach'
        ? userData.canTeach.filter(s => s !== skill)
        : userData.wantsToLearn.filter(s => s !== skill);
      const payload = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        username: userData.username,
        bio: userData.bio,
        college: userData.college,
        canTeach: type === 'teach' ? updatedSkills : userData.canTeach,
        wantsToLearn: type === 'learn' ? updatedSkills : userData.wantsToLearn,
      };
      const updatedUser = await updateMe(payload);
      setCurrentUser(updatedUser);
      setUserData(prev => ({ ...prev, [type === 'teach' ? 'canTeach' : 'wantsToLearn']: updatedSkills }));
      setError("Skill removed successfully");
    } catch {
      setError("Failed to remove skill");
    }
  };

  if (isUserLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-[var(--accent)]" /></div>;
  }

  if (!currentUser) {
    return <div className="min-h-screen flex items-center justify-center text-xl">Please log in to view your profile.</div>;
  }

  return (
    <div className="min-h-screen py-24 px-6 relative z-10">
      <div className="max-w-[800px] mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-8 md:p-10 rounded-[32px] bg-card/60 backdrop-blur-[12px] border-[0.5px] border-border shadow-sm">
          
          <div className="flex gap-4 mb-8">
            <Button onClick={() => setActiveSection('info')} variant={activeSection === 'info' ? 'default' : 'outline'} className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Info
            </Button>
            <Button onClick={() => setActiveSection('skills')} variant={activeSection === 'skills' ? 'default' : 'outline'} className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Skills
            </Button>
            <Button onClick={() => setActiveSection('password')} variant={activeSection === 'password' ? 'default' : 'outline'} className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              Change Password
            </Button>
          </div>

          {activeSection === 'info' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-heading text-lg font-bold">Personal Information</h3>
                <Button onClick={() => setEditMode(!editMode)} variant="outline">
                  <Edit3 className="w-4 h-4 mr-2" />
                  {editMode ? 'Cancel' : 'Edit'}
                </Button>
              </div>
              <div className="flex flex-col md:flex-row gap-8 items-center md:items-start mb-10 text-center md:text-left">
                <div className="w-32 h-32 shrink-0 rounded-[32px] flex items-center justify-center font-heading text-4xl font-extrabold text-white shadow-xl bg-gradient-to-br from-[#7b6cff] to-[#a78bfa]">
                  {currentUser.name?.split(' ').map(n => n[0]).join('').substring(0,2)}
                </div>
                <div className="flex-1 mt-2">
                  {editMode ? (
                    <div className="space-y-4">
                      <input
                        type="text"
                        placeholder="Name"
                        value={userData.name}
                        onChange={(e) => setUserData({...userData, name: e.target.value})}
                        className="w-full h-11 px-4 rounded-xl bg-background/50 border border-border focus:border-[var(--accent)] outline-none"
                      />
                      <input
                        type="text"
                        placeholder="College / University"
                        value={userData.college}
                        onChange={(e) => setUserData({...userData, college: e.target.value})}
                        className="w-full h-11 px-4 rounded-xl bg-background/50 border border-border focus:border-[var(--accent)] outline-none"
                      />
                      <textarea
                        placeholder="Bio"
                        value={userData.bio}
                        onChange={(e) => setUserData({...userData, bio: e.target.value})}
                        className="w-full h-20 px-4 py-2 rounded-xl bg-background/50 border border-border focus:border-[var(--accent)] outline-none resize-none"
                      />
                      <Button onClick={handleUpdateInfo}>Save Changes</Button>
                    </div>
                  ) : (
                    <>
                      <h1 className="text-3xl md:text-4xl font-heading font-extrabold mb-2">{currentUser.name}</h1>
                      <p className="text-lg text-muted-foreground mb-2">@{currentUser.username}</p>
                      {currentUser.college && <p className="text-sm font-medium mb-2">{currentUser.college}</p>}
                      <p className="text-sm font-medium">{currentUser.bio}</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'skills' && (
            <div>
              <h3 className="font-heading text-lg font-bold mb-6">Skills</h3>
              <div className="grid md:grid-cols-2 gap-8 mb-10">
                <div>
                  <h4 className="font-heading text-lg font-bold mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--accent)]"></span> I Can Teach
                  </h4>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {userData.canTeach.map((skill, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-xl border-[0.5px] bg-[var(--teach-bg)] border-[var(--teach-border)] text-[var(--teach-text)] font-semibold text-sm flex items-center gap-2">
                        {skill}
                        <button onClick={() => handleRemoveSkill(skill, 'teach')} className="text-red-500 hover:text-red-700">×</button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add skill"
                      value={newSkill.teach}
                      onChange={(e) => setNewSkill({...newSkill, teach: e.target.value})}
                      className="flex-1 h-11 px-4 rounded-xl bg-background/50 border border-border focus:border-[var(--accent)] outline-none"
                    />
                    <Button onClick={() => handleAddSkill('teach')}>Add</Button>
                  </div>
                </div>
                <div>
                  <h4 className="font-heading text-lg font-bold mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--primary)]"></span> I Want to Learn
                  </h4>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {userData.wantsToLearn.map((skill, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-xl border-[0.5px] bg-[var(--learn-bg)] border-[var(--learn-border)] text-[var(--learn-text)] font-semibold text-sm flex items-center gap-2">
                        {skill}
                        <button onClick={() => handleRemoveSkill(skill, 'learn')} className="text-red-500 hover:text-red-700">×</button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add skill"
                      value={newSkill.learn}
                      onChange={(e) => setNewSkill({...newSkill, learn: e.target.value})}
                      className="flex-1 h-11 px-4 rounded-xl bg-background/50 border border-border focus:border-[var(--accent)] outline-none"
                    />
                    <Button onClick={() => handleAddSkill('learn')}>Add</Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'password' && (
            <div>
              <h3 className="font-heading text-lg font-bold mb-6">Change Password</h3>
              <Button onClick={() => setShowPasswordChange(!showPasswordChange)} variant="outline" className="mb-4">
                <Key className="w-4 h-4 mr-2" />
                {showPasswordChange ? 'Cancel' : 'Change Password'}
              </Button>
              {showPasswordChange && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-6 p-6 rounded-xl bg-muted/50">
                  <h4 className="font-semibold mb-4">Change Password</h4>
                  <div className="space-y-4">
                    <input
                      type="password"
                      placeholder="Current Password"
                      value={passwordData.oldPassword}
                      onChange={(e) => setPasswordData({...passwordData, oldPassword: e.target.value})}
                      className="w-full h-11 px-4 rounded-xl bg-background/50 border border-border focus:border-[var(--accent)] outline-none"
                    />
                    <input
                      type="password"
                      placeholder="New Password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                      className="w-full h-11 px-4 rounded-xl bg-background/50 border border-border focus:border-[var(--accent)] outline-none"
                    />
                    <input
                      type="password"
                      placeholder="Confirm New Password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                      className="w-full h-11 px-4 rounded-xl bg-background/50 border border-border focus:border-[var(--accent)] outline-none"
                    />
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <Button onClick={handlePasswordChange} disabled={isLoading} className="w-full">
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Verification Code"}
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {error && activeSection !== 'password' && <p className="text-green-500 text-sm mt-4">{error}</p>}

        </motion.div>
      </div>

      {showVerification && (
        <VerificationModal
          email={currentUser.email}
          onVerified={handleVerificationSuccess}
          onClose={() => setShowVerification(false)}
          title="Verify Password Change"
          description={`We've sent a verification code to <strong>${currentUser.email}</strong> to confirm your password change.`}
          resendFunction={sendPasswordVerification}
        />
      )}
    </div>
  );
}