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

    // Guaranteed fallback: unblock after 3 seconds even on slow devices
    const fallbackTimer = setTimeout(() => {
      isDone.current = true;
    }, 3000);

    return () => {
      cancelAnimationFrame(animId);
      clearTimeout(fallbackTimer);
    };
  }, []);

  // When Three.js signals that the graph is ready
  useEffect(() => {
    if (!ready) return;
    const elapsed = performance.now() - startTime.current;
    const delay = Math.max(0, 300 - elapsed);
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
    <div
      dir="rtl"
      className="loading-screen"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        backgroundColor: "#f2f2f0",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        textAlign: "center",
        fontFamily: "system-ui, -apple-system, sans-serif",
        userSelect: "none",
        opacity: hiding ? 0 : 1,
        pointerEvents: hiding ? "none" : "auto",
        transition: "opacity 0.5s ease-out",
      }}
    >
      {/* Subtitle / Author */}
      <p
        style={{
          fontSize: "11px",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "rgba(26, 26, 25, 0.45)",
          marginBottom: "8px",
        }}
      >
        اثر مت پوکاک (Matt Pocock)
        
      </p>

      {/* Main Title */}
      <h1
        className="loading-title"
        style={{
          fontSize: "24px",
          fontWeight: 800,
          letterSpacing: "-0.01em",
          color: "#1a1a19",
          marginBottom: "28px",
          lineHeight: 1.3,
        }}
      >
        دیکشنری کدنویسی با هوش مصنوعی
      </h1>

      {/* Loading Progress Bar Container */}
      <div
        className="loading-bar"
        style={{
          width: "180px",
          height: "3px",
          backgroundColor: "rgba(26, 26, 25, 0.1)",
          borderRadius: "9999px",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Animated Fill Indicator */}
        <span
          ref={barRef}
          className="loading-fill"
          style={{
            display: "block",
            height: "100%",
            backgroundColor: "#1a1a19",
            borderRadius: "9999px",
            width: "0%",
            transition: "width 0.08s ease-out",
          }}
        />
      </div>
    </div>
  );
};