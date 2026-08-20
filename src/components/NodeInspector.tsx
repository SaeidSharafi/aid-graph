/**
 * Node Inspector Drawer - Details, 3D Coordinates, Neighbor Subgraph Focus
 */

import React from 'react';
import {
  X,
  ArrowUpRight,
  ArrowDownLeft,
  Share2,
  Maximize2,
  Minimize2,
  Compass,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { GraphStore } from '../store/GraphStore';
import { calculateNodeRadius } from '../types/graph';

interface NodeInspectorProps {
  slug: string;
  store: GraphStore;
  onClose: () => void;
  onSelectNode: (slug: string) => void;
  onFocusNeighborhood: (slug: string) => void;
}

export const NodeInspector: React.FC<NodeInspectorProps> = ({
  slug,
  store,
  onClose,
  onSelectNode,
  onFocusNeighborhood,
}) => {
  const nodeIndex = store.slugToIndex.get(slug);
  if (nodeIndex === undefined) return null;

  const node = store.nodes[nodeIndex];
  const section = store.sections.find((s) => s.index === node.section);
  const radius = calculateNodeRadius(node.inDegree, store.maxInDegree);

  // Position breakdown
  const rx = store.restPositions[nodeIndex * 3 + 0];
  const ry = store.restPositions[nodeIndex * 3 + 1];
  const rz = store.restPositions[nodeIndex * 3 + 2];

  const ox = store.repackOffset[nodeIndex * 3 + 0];
  const oy = store.repackOffset[nodeIndex * 3 + 1];
  const oz = store.repackOffset[nodeIndex * 3 + 2];

  const wx = rx + ox;
  const wy = ry + oy;
  const wz = rz + oz;

  // Neighbors
  const incomingSlugs = Array.from(store.incomingMap.get(slug) ?? []);
  const outgoingSlugs = Array.from(store.outgoingMap.get(slug) ?? []);

  return (
    <div
      id="node-inspector-drawer"
      className="absolute top-20 right-4 z-20 w-96 max-h-[calc(100vh-140px)] flex flex-col bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-800 shadow-2xl overflow-hidden text-xs text-slate-300 transition-all animate-in fade-in slide-in-from-right-5 duration-200"
    >
      {/* Header */}
      <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: section?.color || '#818cf8' }}
            />
            <span className="text-[11px] font-medium text-slate-400">
              {section?.title || `Section ${node.section}`}
            </span>
          </div>
          <h2 className="text-base font-bold text-slate-100 leading-snug">{node.title}</h2>
          <span className="inline-block font-mono text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
            slug: {node.slug}
          </span>
        </div>
        <button
          id="btn-close-inspector"
          onClick={onClose}
          className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body Content */}
      <div className="p-4 space-y-4 overflow-y-auto max-h-[500px]">
        {/* Quick Action: Subgraph Repack */}
        <button
          id="btn-repack-neighborhood"
          onClick={() => onFocusNeighborhood(node.slug)}
          className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-medium flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 transition"
        >
          <Radio className="w-4 h-4" />
          <span>Repack 1-Hop Subgraph ({incomingSlugs.length + outgoingSlugs.length + 1} Nodes)</span>
        </button>

        {/* Mathematical Radius & In-Degree Stats */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span>In-Degree (Incoming Links):</span>
            <span className="font-mono font-bold text-indigo-400">{node.inDegree}</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Calculated Node Radius R:</span>
            <span className="font-mono font-bold text-cyan-400">{radius.toFixed(2)} units</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono bg-slate-900/90 p-1.5 rounded border border-slate-800/80">
            R = 2.2 + [ln(1 + {node.inDegree}) / ln(1 + {store.maxInDegree})] &times; 6.5
          </div>
        </div>

        {/* 3D Spatial Vector Coordinates */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
          <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-indigo-400" />
            3D Spatial Coordinates
          </span>
          <div className="grid grid-cols-3 gap-2 font-mono text-[10px]">
            <div className="bg-slate-900 p-2 rounded border border-slate-800">
              <span className="text-slate-400 block text-[9px]">Rest Base</span>
              <div className="text-slate-200">
                X: {rx.toFixed(1)}<br />
                Y: {ry.toFixed(1)}<br />
                Z: {rz.toFixed(1)}
              </div>
            </div>
            <div className="bg-slate-900 p-2 rounded border border-slate-800">
              <span className="text-indigo-400 block text-[9px]">Repack Offset</span>
              <div className="text-indigo-200">
                &Delta;X: {ox.toFixed(1)}<br />
                &Delta;Y: {oy.toFixed(1)}<br />
                &Delta;Z: {oz.toFixed(1)}
              </div>
            </div>
            <div className="bg-slate-900 p-2 rounded border border-slate-800">
              <span className="text-emerald-400 block text-[9px]">Current World</span>
              <div className="text-emerald-200">
                X: {wx.toFixed(1)}<br />
                Y: {wy.toFixed(1)}<br />
                Z: {wz.toFixed(1)}
              </div>
            </div>
          </div>
        </div>

        {/* Description & Technical Summary */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-300">Description:</span>
          <p className="text-slate-300 text-xs leading-relaxed bg-slate-950/30 p-2.5 rounded-xl border border-slate-800/60">
            {node.description}
          </p>
        </div>

        {/* Extended Body Markdown / Content */}
        {node.body && (
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-300">Technical Context:</span>
            <div className="text-slate-300 text-[11px] leading-relaxed bg-slate-950/50 p-3 rounded-xl border border-slate-800/80 whitespace-pre-line font-sans">
              {node.body}
            </div>
          </div>
        )}

        {/* Outgoing Links */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-cyan-400" />
            Outgoing Connections ({outgoingSlugs.length}):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {outgoingSlugs.length > 0 ? (
              outgoingSlugs.map((tSlug) => {
                const targetNode = store.nodes.find((n) => n.slug === tSlug);
                return (
                  <button
                    key={tSlug}
                    onClick={() => onSelectNode(tSlug)}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-cyan-200 border border-slate-700 text-[11px] transition flex items-center gap-1"
                  >
                    <span>{targetNode?.title || tSlug}</span>
                    <ArrowUpRight className="w-2.5 h-2.5 opacity-60" />
                  </button>
                );
              })
            ) : (
              <span className="text-slate-400 italic">No outgoing connections</span>
            )}
          </div>
        </div>

        {/* Incoming Links */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
            <ArrowDownLeft className="w-3.5 h-3.5 text-indigo-400" />
            Referenced By (Incoming {incomingSlugs.length}):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {incomingSlugs.length > 0 ? (
              incomingSlugs.map((sSlug) => {
                const srcNode = store.nodes.find((n) => n.slug === sSlug);
                return (
                  <button
                    key={sSlug}
                    onClick={() => onSelectNode(sSlug)}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-indigo-200 border border-slate-700 text-[11px] transition flex items-center gap-1"
                  >
                    <span>{srcNode?.title || sSlug}</span>
                    <ArrowDownLeft className="w-2.5 h-2.5 opacity-60" />
                  </button>
                );
              })
            ) : (
              <span className="text-slate-400 italic">No incoming references</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
