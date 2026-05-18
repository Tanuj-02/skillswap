import { useState } from "react";

import { Button } from "@/components/ui/button";
import { X, Loader2 } from "lucide-react";
import { verifyEmail, resendVerification } from "@/services/authService";

export default function VerificationModal({ email, onVerified, onClose, title = "Verify Your Email", description, resendFunction }) {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendLoading, setResendLoading] = useState(false);

  const handleVerify = async () => {
    if (!code.trim()) {
      setError("Please enter the verification code");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await verifyEmail(email, code);
      onVerified(code);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid verification code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError("");

    try {
      if (resendFunction) {
        await resendFunction();
      } else {
        await resendVerification(email);
      }
      setError("Verification code sent successfully");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend code");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        className="bg-card p-6 rounded-lg shadow-lg max-w-md w-full mx-4"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          {description || `We've sent a verification code to <strong>${email}</strong>. Please enter it below.`}
        </p>

        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter 6-digit code"
          className="w-full h-12 px-4 text-center text-lg font-mono rounded-lg border border-border focus:border-primary outline-none mb-4"
          maxLength={6}
        />

        {error && (
          <p className={`text-sm mb-4 ${error.includes("successfully") ? "text-green-600" : "text-red-600"}`}>
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <Button onClick={handleVerify} disabled={isLoading} className="flex-1">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
          </Button>
          <Button variant="outline" onClick={handleResend} disabled={resendLoading}>
            {resendLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Resend"}
          </Button>
        </div>
      </div>
    </div>
  );
}