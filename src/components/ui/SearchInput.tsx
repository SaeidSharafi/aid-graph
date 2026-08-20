"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { Search, X } from "lucide-react";
import { useJourney } from "../../store/useJourney";
import { searchDictionary } from "../../utils/search";
import { applyMatches, solveRepack } from "../../physics/repack";
import { playTapSound, playTypeSound } from "../../utils/sound";

interface SearchInputProps {
  shifted?: boolean;
}

export const SearchInput: React.FC<SearchInputProps> = () => {
  const query = useJourney((s) => s.query);
  const matchCount = useJourney((s) => s.matchCount);
  const setQuery = useJourney((s) => s.setQuery);
  const setMatches = useJourney((s) => s.setMatches);
  const bumpRepack = useJourney((s) => s.bumpRepack);
  const focusNode = useJourney((s) => s.focusNode);

  const inputRef = useRef<HTMLInputElement>(null);
  const topMatchSlug = useRef<string | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const handleSearch = useCallback(
    (q: string) => {
      setQuery(q);
      const trimmed = q.trim();

      if (debounceTimer.current) clearTimeout(debounceTimer.current);

      if (!trimmed) {
        topMatchSlug.current = null;
        applyMatches(null);
        setMatches(null);
        bumpRepack();
        return;
      }

      const res = searchDictionary(trimmed);
      topMatchSlug.current = res.slugs[0] ?? null;

      applyMatches(res.slugs);
      setMatches(res.slugs);

      debounceTimer.current = setTimeout(() => {
        solveRepack(res.slugs);
        bumpRepack();
      }, 250);
    },
    [setQuery, setMatches, bumpRepack]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;

      const isSlash = e.key === "/" && !isInput;
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";

      if (isSlash || isCmdK) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }

      if (e.key === "Escape") {
        if (query) {
          handleSearch("");
        } else {
          inputRef.current?.blur();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [query, handleSearch]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && topMatchSlug.current) {
      e.preventDefault();
      playTapSound();
      focusNode(topMatchSlug.current);
      inputRef.current?.blur();
    }
  };

  const hintText =
    matchCount === null ? null : matchCount === 0 ? "موردی یافت نشد" : `${matchCount} اصطلاح`;

  return (
    <div
      dir="rtl"
      style={{
        position: "fixed",
        top: "16px",
        right: "16px",
        zIndex: 30,
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          backgroundColor: "rgba(242,242,240,0.9)",
          backdropFilter: "blur(8px)",
          borderRadius: "8px",
          border: "1px solid rgba(26,26,25,0.15)",
          padding: "6px 10px",
          width: "280px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        <Search size={14} color="rgba(26,26,25,0.4)" style={{ marginLeft: "8px", flexShrink: 0 }} />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            playTypeSound();
            handleSearch(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          placeholder="جستجو در دیکشنری..."
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            outline: "none",
            fontSize: "12px",
            color: "#1a1a19",
            fontFamily: "inherit",
          }}
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              playTapSound();
              handleSearch("");
              inputRef.current?.focus();
            }}
            aria-label="پاک کردن جستجو"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "rgba(26,26,25,0.4)",
              display: "flex",
              alignItems: "center",
              padding: 0,
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>
      {hintText && (
        <span style={{ fontSize: "10px", color: "rgba(26,26,25,0.55)", paddingRight: "4px" }}>
          {hintText}
        </span>
      )}
    </div>
  );
};