"use client";

import React, { useState } from "react";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  side?: "top" | "bottom";
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, side = "top" }) => {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative inline-flex items-center justify-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        <div
          className={`absolute pointer-events-none z-50 px-2 py-1 bg-[#1a1a19] text-white text-[10px] font-mono uppercase tracking-widest rounded whitespace-nowrap shadow-md transition-all animate-in fade-in duration-150 ${
            side === "top" ? "-top-8" : "-bottom-8"
          }`}
        >
          {content}
        </div>
      )}
    </div>
  );
};