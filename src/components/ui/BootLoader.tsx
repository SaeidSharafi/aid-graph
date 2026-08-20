"use client";

import React, { useState, useEffect, useRef } from "react";
import { useBoot } from "../../store/useBoot";

export const BootLoader: React.FC = () => {
  const ready = useBoot((s) => s.ready);
  const [hiding, setHiding] = useState(false);
  const [hidden, setHidden] = useState(false);

  const barRef = useRef<HTMLSpanElement>(null);
  const progress = useRef(0);
  const isDone = useRef(false);
  const startTime = useRef(0);

  useEffect(() => {
    startTime.current = performance.now();
    let animId: number;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      // Accelerate progress once ready is signaled
      const target = isDone.current ? 1.0 : 0.85;
      const speed = isDone.current ? 6.0 : 1.2;
      progress.current += (target - progress.current) * (1 - Math.exp(-speed * dt));

      if (barRef.current) {
        barRef.current.style.width = `${(progress.current * 100).toFixed(2)}%`;
      }

      if (isDone.current && progress.current > 0.98) {
        if (barRef.current) barRef.current.style.width = "100%";
        setHiding(true);
        return;
      }
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);

    // Guaranteed fallback: unblock after 2.5 seconds even on slow devices
    const fallbackTimer = setTimeout(() => {
      isDone.current = true;
    }, 2500);

    return () => {
      cancelAnimationFrame(animId);
      clearTimeout(fallbackTimer);
    };
  }, []);

  // When Three.js signals that the graph is ready
  useEffect(() => {
    if (!ready) return;
    const elapsed = performance.now() - startTime.current;
    const delay = Math.max(0, 400 - elapsed);
    const timer = setTimeout(() => {
      isDone.current = true;
    }, delay);
    return () => clearTimeout(timer);
  }, [ready]);

  // Reveal graph when hiding starts
  useEffect(() => {
    if (!hiding) return;
    useBoot.getState().reveal();
    const timer = setTimeout(() => setHidden(true), 600);
    return () => clearTimeout(timer);
  }, [hiding]);

  if (hidden) return null;

  return (
    <div dir="rtl" className="loading-screen" data-hiding={hiding}>
      <p className="text-[0.65rem] font-mono tracking-widest uppercase opacity-40">
        اثر مت پوکاک (Matt Pocock)
      </p>
      <h1 className="loading-title">دیکشنری کدنویسی با هوش مصنوعی</h1>
      <div className="loading-bar">
        <span ref={barRef} className="loading-fill" />
      </div>
    </div>
  );
};