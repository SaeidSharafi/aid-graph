"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Info, X, ExternalLink } from "lucide-react";
import { Tooltip } from "./Tooltip";
import { AIHERO_SHARE_URL, SOURCE_REPO_URL } from "../../types/graph";
import { playTapSound } from "../../utils/sound";

export const AboutDialog: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Tooltip content="درباره" side="top">
        <button
          type="button"
          onClick={() => {
            playTapSound();
            setOpen(true);
          }}
          aria-label="درباره این پروژه"
          className="action-btn"
        >
          <Info className="w-4 h-4" />
        </button>
      </Tooltip>

      {open && (
        <div 
          dir="rtl" 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1a1a19]/30 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-lg bg-[#f2f2f0] border border-[#1a1a19]/20 rounded-xl shadow-2xl p-6 font-sans text-[#1a1a19] text-xs space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#1a1a19]/10 pb-3">
              <span className="text-[11px] font-bold tracking-wider text-[#1a1a19]/50">درباره پروژه</span>
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  setOpen(false);
                }}
                className="p-1 rounded hover:bg-[#1a1a19]/10 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Title & Description */}
            <h2 className="text-lg font-bold tracking-tight">
              دیکشنری کدنویسی با هوش مصنوعی
            </h2>

            <div className="space-y-2 text-[#1a1a19]/80 text-xs leading-relaxed">
              <p>
                این روزها همه از اصطلاحاتی مثل توکن‌ها، پنجره بافت (Context Window)، ایجنت‌ها و تحویل کار (Handoffs) صحبت می‌کنند؛ اما در نیمی از مواقع، توافقی بر سر معنای دقیق آن‌ها وجود ندارد.
              </p>
              <p>
                بنابراین این دیکشنری آماده شده است؛ تمام اصطلاحات به زبان ساده در قالب یک گراف تعاملی پیاده‌سازی شده‌اند تا به جای حفظ کردن یک فهرست الفبایی، بتوانید نحوه اتصال و ارتباط مفاهیم با یکدیگر را مشاهده کنید. روی هر گره کلیک کنید و مسیرها را دنبال کنید.
              </p>
            </div>

            {/* Action Links */}
            <div className="flex flex-wrap gap-2 pt-2">
              <Link
                href={AIHERO_SHARE_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => playTapSound()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#1a1a19] text-white hover:bg-[#1a1a19]/90 text-[11px] font-mono tracking-wider transition"
              >
                <span>aihero.dev</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
              <Link
                href={SOURCE_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => playTapSound()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#1a1a19]/20 hover:bg-[#1a1a19]/5 text-[11px] font-mono tracking-wider transition"
              >
                <span>GitHub (اصلی)</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
              <Link
                href="https://github.com/SaeidSharafi/dictionary-of-ai-coding/tree/feat/persian-localization-v2"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => playTapSound()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#1a1a19]/20 hover:bg-[#1a1a19]/5 text-[11px] font-mono tracking-wider transition"
              >
                <span>GitHub (فارسی)</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            {/* Persian Localization / AI Translation Disclaimer */}
            <div className="pt-3 border-t border-[#1a1a19]/10 space-y-1 text-[#1a1a19]/70 text-[11px]">
              <div className="flex items-center justify-between">
                <span>توسعه و بومی‌سازی فارسی:</span>
                <Link
                  href="https://github.com/SaeidSharafi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline hover:text-[#1a1a19]"
                >
                  سعید شرفی (SaeidSharafi)
                </Link>
              </div>
              <p className="text-[10px] text-[#1a1a19]/50">
                * این نسخه، ترجمه ماشینی (هوش مصنوعی) از مخزن اصلی پروژه می‌باشد.
              </p>
            </div>

            {/* Credits Section */}
            <div className="pt-3 border-t border-[#1a1a19]/10 space-y-3">
              <span className="text-[10px] font-bold text-[#1a1a19]/50 uppercase tracking-widest block">
                سازندگان اصلی (Credits)
              </span>

              {/* Author */}
              <div className="flex items-center gap-3">
                <img
                  src="https://www.aicodingdictionary.com/matt.jpg"
                  alt="Matt Pocock"
                  width={40}
                  height={40}
                  className="rounded-full object-cover border border-[#1a1a19]/10"
                />
                <div>
                  <Link
                    href="https://x.com/mattpocockuk"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-xs hover:underline block"
                  >
                    Matt Pocock
                  </Link>
                  <p className="text-[10px] text-[#1a1a19]/60">نویسنده دیکشنری · AI Hero</p>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      )}
    </>
  );
};