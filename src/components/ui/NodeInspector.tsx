"use client";

import React, { useState } from "react";
import Link from "next/link";
import { X, ArrowUpLeft, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Share, Copy, Check } from "lucide-react";
import { useJourney } from "../../store/useJourney";
import { nodeBySlug, orderedTerms, AIHERO_URL, sections } from "../../data/dictionary";
import { playTapSound } from "../../utils/sound";

const BASE_URL = AIHERO_URL || "https://www.aihero.dev/ai-coding-dictionary";

export const NodeInspector: React.FC = () => {
  const focusedSlug = useJourney((s) => s.focusedSlug);
  const focusNode = useJourney((s) => s.focusNode);
  const [readMoreExpanded, setReadMoreExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!focusedSlug) return null;

  const node = nodeBySlug.get(focusedSlug) || nodeBySlug.get(focusedSlug.toLowerCase());
  if (!node) return null;

  const currentIdx = Math.max(
    0,
    orderedTerms.findIndex((t) => t.node.slug.toLowerCase() === node.slug.toLowerCase())
  );
  const total = Math.max(1, orderedTerms.length);
  const sectionTitle = sections[node.section]?.title || `بخش ${node.section + 1}`;

  const handlePrev = () => {
    playTapSound();
    const prev = orderedTerms[(currentIdx - 1 + total) % total]?.node.slug;
    if (prev) focusNode(prev);
  };

  const handleNext = () => {
    playTapSound();
    const next = orderedTerms[(currentIdx + 1) % total]?.node.slug;
    if (next) focusNode(next);
  };

  const handleCopy = async () => {
    playTapSound();
    const markdown = `# ${node.title}\n\n${node.description}\n\n${(node as any).fullDefinition || ''}\n\n---\n${BASE_URL}/${node.slug}`;
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  const handleShare = async () => {
    playTapSound();
    const url = `${window.location.origin}${window.location.pathname}?term=${encodeURIComponent(node.slug)}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${node.title} — دیکشنری کدنویسی با هوش مصنوعی`, url });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(url);
    } catch {}
  };

  // Convert markdown links [Text](#slug) into interactive inline buttons
  const renderFormattedText = (text: string) => {
    if (!text) return null;
    const parts: React.ReactNode[] = [];
    const linkRegex = /\[([^\]]+)\]\(#([a-zA-Z0-9_\u0600-\u06FF-]+)\)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = linkRegex.exec(text)) !== null) {
      const matchIndex = match.index;
      if (matchIndex > lastIndex) {
        parts.push(text.substring(lastIndex, matchIndex));
      }
      const label = match[1];
      const targetSlug = match[2].toLowerCase().replace(/^#/, "");

      parts.push(
        <button
          key={`${targetSlug}-${matchIndex}`}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            playTapSound();
            focusNode(targetSlug);
          }}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            color: "#171717",
            textDecoration: "underline",
            textUnderlineOffset: "3px",
            textDecorationColor: "#737373",
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: "inherit",
            display: "inline",
            margin: "0 2px",
            fontWeight: 600,
          }}
        >
          {label}
        </button>
      );
      lastIndex = linkRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    return parts;
  };

  // Renders Markdown tables or standard paragraphs
  const renderParagraphOrTable = (block: string, key: number) => {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    const isTable = lines.length >= 2 && lines[0].startsWith('|') && lines[1].includes('---');

    if (isTable) {
      const headerCols = lines[0].split('|').map(c => c.trim()).filter(Boolean);
      const rowLines = lines.slice(2);

      return (
        <div key={key} style={{ overflowX: "auto", margin: "12px 0" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", border: "1px solid #e5e5e5" }}>
            <thead>
              <tr style={{ backgroundColor: "#eaeaea" }}>
                {headerCols.map((h, hIdx) => (
                  <th key={hIdx} style={{ padding: "8px 12px", border: "1px solid #d4d4d4", textAlign: "start" }}>
                    {renderFormattedText(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rowLines.map((r, rIdx) => {
                const cols = r.split('|').map(c => c.trim()).filter(Boolean);
                return (
                  <tr key={rIdx} style={{ backgroundColor: rIdx % 2 === 0 ? "#ffffff" : "#f9f9f8" }}>
                    {cols.map((c, cIdx) => (
                      <td key={cIdx} style={{ padding: "8px 12px", border: "1px solid #e5e5e5" }}>
                        {renderFormattedText(c)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    return (
      <p key={key} style={{ margin: 0 }}>
        {renderFormattedText(block)}
      </p>
    );
  };

  const outboundUrl = `${BASE_URL}/${node.slug}`;
  const fullDef = (node as any).fullDefinition || '';

  return (
    <aside
      dir="rtl"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        width: "min(100vw, 470px)",
        backgroundColor: "#f2f2f0",
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        boxShadow: "-8px 0 32px rgba(0, 0, 0, 0.12)",
        borderLeft: "1px solid #d4d4d4",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: "#171717",
        overflow: "hidden",
      }}
    >
      {/* Top Header Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 24px 14px",
          borderBottom: "1px solid #e5e5e5",
          fontFamily: "inherit",
        }}
      >
        <span
          style={{
            fontSize: "11px",
            letterSpacing: "0.05em",
            color: "#737373",
            fontWeight: 600,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: "70%",
          }}
        >
          {sectionTitle}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "#171717", letterSpacing: "0.05em", direction: "ltr" }}>
            {currentIdx + 1} <span style={{ color: "#a3a3a3", fontWeight: 400 }}>/ {total}</span>
          </span>
          <button
            type="button"
            onClick={() => {
              playTapSound();
              focusNode(null);
            }}
            aria-label="بستن"
            style={{
              width: "28px",
              height: "28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              border: "1px solid #d4d4d4",
              backgroundColor: "#ffffff",
              cursor: "pointer",
              color: "#525252",
              padding: 0,
            }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Main Scrollable Body */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px 24px 32px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        {/* Title & Lead Paragraph */}
        <div>
          <h2
            style={{
              fontSize: "26px",
              fontWeight: 800,
              letterSpacing: "-0.01em",
              color: "#0a0a0a",
              margin: "0 0 12px 0",
              lineHeight: 1.3,
            }}
          >
            {node.title}
          </h2>
          {node.description && (
            <p
              dir="auto"
              style={{
                fontSize: "14px",
                lineHeight: 1.75,
                color: "#262626",
                margin: 0,
              }}
            >
              {renderFormattedText(node.description)}
            </p>
          )}
        </div>

        {/* HEARD IN THE WILD (مکالمات واقعی) */}
        {(node as any).heardInTheWild && (
          <div style={{ borderTop: "1px solid #e5e5e5", paddingTop: "18px" }}>
            <span
              style={{
                fontSize: "10px",
                letterSpacing: "0.08em",
                color: "#a3a3a3",
                fontWeight: 700,
                display: "block",
                marginBottom: "12px",
              }}
            >
              در گفتگوهای واقعی
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {/* User Bubble (White) */}
              {(node as any).heardInTheWild.user && (
                <div
                  dir="auto"
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #d4d4d4",
                    borderRadius: "16px",
                    padding: "12px 16px",
                    fontSize: "13px",
                    lineHeight: 1.6,
                    color: "#171717",
                    maxWidth: "88%",
                    alignSelf: "flex-start",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                  }}
                >
                  {renderFormattedText((node as any).heardInTheWild.user)}
                </div>
              )}
              {/* Agent Bubble (Black) */}
              {(node as any).heardInTheWild.agent && (
                <div
                  dir="auto"
                  style={{
                    backgroundColor: "#1a1a19",
                    color: "#ffffff",
                    borderRadius: "16px",
                    padding: "12px 16px",
                    fontSize: "13px",
                    lineHeight: 1.6,
                    maxWidth: "92%",
                    alignSelf: "flex-end",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
                  }}
                >
                  {renderFormattedText((node as any).heardInTheWild.agent)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* AVOID (پرهیز شود) */}
        {node.avoid && (
          <div style={{ borderTop: "1px solid #e5e5e5", paddingTop: "18px" }}>
            <span
              style={{
                fontSize: "10px",
                letterSpacing: "0.08em",
                color: "#a3a3a3",
                fontWeight: 700,
                display: "block",
                marginBottom: "8px",
              }}
            >
              اشتباه رایج / پرهیز شود
            </span>
            <p
              dir="auto"
              style={{
                fontSize: "13px",
                lineHeight: 1.7,
                color: "#525252",
                margin: 0,
              }}
            >
              {renderFormattedText(node.avoid)}
            </p>
          </div>
        )}

        {/* CONNECTS TO (مفاهیم مرتبط) */}
        {node.links && node.links.length > 0 && (
          <div style={{ borderTop: "1px solid #e5e5e5", paddingTop: "18px" }}>
            <span
              style={{
                fontSize: "10px",
                letterSpacing: "0.08em",
                color: "#a3a3a3",
                fontWeight: 700,
                display: "block",
                marginBottom: "10px",
              }}
            >
              مفاهیم مرتبط
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {node.links.map((linkSlug) => {
                const targetNode =
                  nodeBySlug.get(linkSlug) || nodeBySlug.get(linkSlug.toLowerCase());
                return (
                  <button
                    key={linkSlug}
                    type="button"
                    onClick={() => {
                      playTapSound();
                      focusNode(linkSlug);
                    }}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "9999px",
                      backgroundColor: "#ffffff",
                      border: "1px solid #d4d4d4",
                      fontSize: "12px",
                      fontFamily: "inherit",
                      color: "#262626",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                    }}
                  >
                    {targetNode?.title || linkSlug}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* FULL DEFINITION (توضیح کامل) */}
        {fullDef && (
          <div style={{ borderTop: "1px solid #e5e5e5", paddingTop: "18px" }}>
            <span
              style={{
                fontSize: "10px",
                letterSpacing: "0.08em",
                color: "#a3a3a3",
                fontWeight: 700,
                display: "block",
                marginBottom: "8px",
              }}
            >
              توضیح و جزئیات کامل
            </span>
            <div
              dir="auto"
              style={{
                fontSize: "13px",
                lineHeight: 1.75,
                color: "#262626",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                maxHeight: readMoreExpanded ? "none" : "90px",
                overflow: "hidden",
                position: "relative",
              }}
            >
              {fullDef.split(/\n\s*\n/).map((block: string, i: number) =>
                renderParagraphOrTable(block, i)
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                playTapSound();
                setReadMoreExpanded(!readMoreExpanded);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "11px",
                letterSpacing: "0.05em",
                color: "#737373",
                background: "none",
                border: "none",
                padding: "8px 0 0",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              <span>{readMoreExpanded ? "نمایش کمتر" : "مشاهده بیشتر"}</span>
              {readMoreExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div
          style={{
            borderTop: "1px solid #e5e5e5",
            paddingTop: "20px",
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            alignItems: "center",
          }}
        >
          <Link
            href={outboundUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => playTapSound()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              borderRadius: "9999px",
              backgroundColor: "#1a1a19",
              color: "#ffffff",
              fontSize: "12px",
              fontWeight: 600,
              textDecoration: "none",
              cursor: "pointer",
            }}
          >
            <span>مشاهده در منبع اصلی</span>
            <ArrowUpLeft size={14} />
          </Link>
          <button
            type="button"
            onClick={handleShare}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              borderRadius: "9999px",
              backgroundColor: "#ffffff",
              border: "1px solid #d4d4d4",
              fontSize: "12px",
              color: "#262626",
              cursor: "pointer",
            }}
          >
            <Share size={13} color="#525252" />
            <span>اشتراک‌گذاری</span>
          </button>
          <button
            type="button"
            onClick={handleCopy}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              borderRadius: "9999px",
              backgroundColor: "#ffffff",
              border: "1px solid #d4d4d4",
              fontSize: "12px",
              color: "#262626",
              cursor: "pointer",
            }}
          >
            {copied ? <Check size={13} color="#16a34a" /> : <Copy size={13} color="#525252" />}
            <span>{copied ? "کپی شد" : "کپی مارک‌داون"}</span>
          </button>
        </div>
      </div>

      {/* 50/50 Split Pager Footer */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          borderTop: "1px solid #d4d4d4",
          backgroundColor: "#f2f2f0",
          fontSize: "12px",
        }}
      >
        {/* قبلی (Prev) - سمت راست در RTL */}
        <button
          type="button"
          onClick={handlePrev}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "16px 20px",
            borderLeft: "1px solid #d4d4d4",
            borderTop: "none",
            borderBottom: "none",
            borderRight: "none",
            backgroundColor: "transparent",
            cursor: "pointer",
            textAlign: "right",
          }}
        >
          <span
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              border: "1px solid #d4d4d4",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#ffffff",
              flexShrink: 0,
            }}
          >
            <ChevronRight size={16} color="#525252" />
          </span>
          <div style={{ overflow: "hidden" }}>
            <span
              style={{
                fontSize: "10px",
                letterSpacing: "0.08em",
                color: "#a3a3a3",
                display: "block",
                fontWeight: 600,
              }}
            >
              قبلی
            </span>
            <span
              style={{
                fontWeight: 600,
                color: "#171717",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                display: "block",
              }}
            >
              {orderedTerms[(currentIdx - 1 + total) % total]?.node.title}
            </span>
          </div>
        </button>

        {/* بعدی (Next) - سمت چپ در RTL */}
        <button
          type="button"
          onClick={handleNext}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            border: "none",
            backgroundColor: "transparent",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <div style={{ overflow: "hidden", flex: 1, marginLeft: "12px", textAlign: "right" }}>
            <span
              style={{
                fontSize: "10px",
                letterSpacing: "0.08em",
                color: "#a3a3a3",
                display: "block",
                fontWeight: 600,
              }}
            >
              بعدی
            </span>
            <span
              style={{
                fontWeight: 600,
                color: "#171717",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                display: "block",
              }}
            >
              {orderedTerms[(currentIdx + 1) % total]?.node.title}
            </span>
          </div>
          <span
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              border: "1px solid #d4d4d4",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#ffffff",
              flexShrink: 0,
            }}
          >
            <ChevronLeft size={16} color="#525252" />
          </span>
        </button>
      </div>
    </aside>
  );
};