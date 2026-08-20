"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Canvas } from "@react-three/fiber";
import { Atlas } from "./canvas/Atlas";
import { BootLoader } from "./ui/BootLoader";
import { SearchInput } from "./ui/SearchInput";
import { NodeInspector } from "./ui/NodeInspector";
import { ColorToggle } from "./ui/ColorToggle";
import { SoundToggle } from "./ui/SoundToggle";
import { AboutDialog } from "./ui/AboutDialog";
import { SettingsMenu } from "./ui/SettingsMenu";
import { useJourney } from "../store/useJourney";
import { nodeBySlug, AIHERO_SHARE_URL } from "../data/dictionary";
import { playTapSound } from "../utils/sound";

export const DictionaryExperience: React.FC = () => {
  const focusedSlug = useJourney((s) => s.focusedSlug);
  const focusNode = useJourney((s) => s.focusNode);

  // Sync URL search params
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const term = params.get("term");
    if (term && nodeBySlug.has(term)) {
      focusNode(term);
    }
  }, [focusNode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (focusedSlug) {
      url.searchParams.set("term", focusedSlug);
    } else {
      url.searchParams.delete("term");
    }
    window.history.replaceState(null, "", url.toString());
  }, [focusedSlug]);

  return (
    <main
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "#f2f2f0",
        userSelect: "none",
      }}
    >
      {/* 3D WebGL Canvas Layer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 0,
        }}
      >
        <Canvas
          camera={{ position: [120, 90, 620], fov: 50, near: 0.1, far: 6000 }}
          gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
          dpr={[1, 2]}
        >
          <Atlas />
        </Canvas>
      </div>

      {/* Boot Splash Loading Progress */}
      <BootLoader />

      {/* Top Left Search Input */}
      <SearchInput shifted={Boolean(focusedSlug)} />

      {/* Top Right AIHero Logo */}
      <div style={{ position: "fixed", top: "16px", left: "16px", zIndex: 30 }}>
        <Link
          href={AIHERO_SHARE_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => playTapSound()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "12px",
            fontWeight: "bold",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            color: "rgba(26,26,25,0.8)",
            textDecoration: "none",
            backgroundColor: "rgba(242,242,240,0.9)",
            backdropFilter: "blur(8px)",
            padding: "6px 12px",
            borderRadius: "8px",
            border: "1px solid rgba(26,26,25,0.15)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            fontFamily: "ui-monospace, monospace",
          }}
        >
          <span style={{ backgroundColor: "#1a1a19", color: "#ffffff", padding: "2px 5px", borderRadius: "4px", fontSize: "10px" }}>
            AI
          </span>
          <span>Hero.dev</span>
        </Link>
      </div>

      {/* Side Content Inspector Panel */}
      <NodeInspector />

      {/* Bottom Left Toolbar Controls */}
      <div style={{ position: "fixed", bottom: "16px", left: "16px", zIndex: 30, display: "flex", alignItems: "center", gap: "8px" }}>
        <AboutDialog />
        <ColorToggle />
        <SoundToggle />
        <SettingsMenu />
      </div>

      {/* Bottom Right Orbit Hint */}
      <div
        style={{
          position: "fixed",
          bottom: "16px",
          right: "16px",
          zIndex: 30,
          pointerEvents: "none",
          fontSize: "10px",
          fontFamily: "ui-monospace, monospace",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "rgba(26,26,25,0.45)",
          backgroundColor: "rgba(242,242,240,0.65)",
          backdropFilter: "blur(6px)",
          padding: "4px 10px",
          borderRadius: "6px",
          border: "1px solid rgba(26,26,25,0.1)",
        }}
      >
        Drag to rotate · Scroll to zoom
      </div>
    </main>
  );
};