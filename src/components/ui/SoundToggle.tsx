"use client";

import React, { useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Tooltip } from "./Tooltip";
import { getSoundMuted, setSoundMuted, playTapSound } from "../../utils/sound";

export const SoundToggle: React.FC = () => {
  const [muted, setMutedState] = useState(getSoundMuted);

  const toggle = () => {
    const next = !muted;
    setMutedState(next);
    setSoundMuted(next);
    if (!next) playTapSound();
  };

  const label = muted ? "فعال‌سازی صدا" : "بی‌صدا کردن";

  return (
    <Tooltip content={label} side="top">
      <button
        type="button"
        onClick={toggle}
        aria-label={label}
        data-active={!muted}
        className="action-btn"
      >
        {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>
    </Tooltip>
  );
};