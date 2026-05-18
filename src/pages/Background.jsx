import React from "react";

export default function Background({ children }) {
  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden font-sans">
      
      {/* ── Fixed Background Grid ── */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.05)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none z-0" />
      
      {/* ── Fixed Glowing Orbs ── */}
      {/* Top Right Orb (Purple/Accent) */}
      <div className="fixed top-[-200px] right-[-200px] w-[700px] h-[700px] rounded-full bg-[radial-gradient(circle,rgba(123,108,255,0.1)_0%,transparent_70%)] pointer-events-none z-0" />
      
      {/* Bottom Left Orb (Teal/Primary) */}
      <div className="fixed bottom-[-100px] left-[-100px] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(0,229,176,0.08)_0%,transparent_70%)] pointer-events-none z-0" />

      {/* ── Page Content ── */}
      {/* The relative z-10 ensures your content always sits above the background */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {children}
      </div>
      
    </div>
  );
}