"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Settings, ExternalLink } from "lucide-react";
import { Tooltip } from "./Tooltip";
import { AIHERO_URL, SOURCE_REPO_URL } from "../../types/graph";
import { playTapSound } from "../../utils/sound";

export const SettingsMenu: React.FC = () => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={menuRef} className="relative inline-flex">
      <Tooltip content="تنظیمات و لینک‌ها" side="top">
        <button
          type="button"
          onClick={() => {
            playTapSound();
            setOpen((prev) => !prev);
          }}
          aria-label="تنظیمات و پیوندها"
          className="action-btn"
        >
          <Settings className="w-4 h-4" />
        </button>
      </Tooltip>

      {open && (
        <div
          dir="rtl"
          className="absolute bottom-12 left-0 w-52 bg-[#f2f2f0] border border-[#1a1a19]/20 rounded-lg shadow-xl p-2 font-sans text-[11px] text-[#1a1a19] space-y-1 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          <Link
            href={AIHERO_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              playTapSound();
              setOpen(false);
            }}
            className="flex items-center justify-between p-2 rounded hover:bg-[#1a1a19]/5 transition font-mono"
          >
            <span>aihero.dev</span>
            <ExternalLink className="w-3 h-3 text-[#1a1a19]/40" />
          </Link>
          <Link
            href={SOURCE_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              playTapSound();
              setOpen(false);
            }}
            className="flex items-center justify-between p-2 rounded hover:bg-[#1a1a19]/5 transition"
          >
            <span>سورس گیت‌هاب (اصلی)</span>
            <ExternalLink className="w-3 h-3 text-[#1a1a19]/40" />
          </Link>
          <Link
            href="https://github.com/SaeidSharafi/dictionary-of-ai-coding/tree/feat/persian-localization-v2"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              playTapSound();
              setOpen(false);
            }}
            className="flex items-center justify-between p-2 rounded hover:bg-[#1a1a19]/5 transition"
          >
            <span>سورس گیت‌هاب (فارسی)</span>
            <ExternalLink className="w-3 h-3 text-[#1a1a19]/40" />
          </Link>
          <Link
            href="https://badass.dev"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              playTapSound();
              setOpen(false);
            }}
            className="flex items-center justify-between p-2 rounded hover:bg-[#1a1a19]/5 transition font-mono"
          >
            <span>badass.dev</span>
            <ExternalLink className="w-3 h-3 text-[#1a1a19]/40" />
          </Link>
        </div>
      )}
    </div>
  );
};