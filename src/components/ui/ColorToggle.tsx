"use client";

import React, { useEffect } from "react";
import { Palette } from "lucide-react";
import { useJourney, SECTION_COLOR_KEY } from "../../store/useJourney";
import { Tooltip } from "./Tooltip";
import { playTapSound } from "../../utils/sound";

export const ColorToggle: React.FC = () => {
  const sectionColorOn = useJourney((s) => s.sectionColorOn);
  const toggleSectionColor = useJourney((s) => s.toggleSectionColor);
  const setSectionColorOn = useJourney((s) => s.setSectionColorOn);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SECTION_COLOR_KEY) === "1";
      setSectionColorOn(stored);
    } catch {}
  }, [setSectionColorOn]);

  const label = sectionColorOn ? "خاموش کردن رنگ‌ها" : "روشن کردن رنگ‌ها";

  return (
    <Tooltip content={label} side="top">
      <button
        type="button"
        onClick={() => {
          playTapSound();
          toggleSectionColor();
        }}
        aria-label={label}
        data-active={sectionColorOn}
        className="action-btn"
      >
        <Palette className="w-4 h-4" />
      </button>
    </Tooltip>
  );
};