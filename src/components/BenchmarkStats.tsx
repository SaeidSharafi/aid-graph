/**
 * High-Performance TypedArray Memory Model & Benchmark Stats Panel
 */

import React, { useState } from 'react';
import { HardDrive, Activity, Cpu, Sparkles, ChevronUp, ChevronDown } from 'lucide-react';
import { GraphStore } from '../store/GraphStore';

interface BenchmarkStatsProps {
  store: GraphStore;
  lastSolveDuration: number | null;
  selectedCount: number;
}

export const BenchmarkStats: React.FC<BenchmarkStatsProps> = ({
  store,
  lastSolveDuration,
  selectedCount,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const n = store.nodes.length;
  const e = store.edges.length;

  const restPosBytes = store.restPositions.byteLength;
  const repackOffsetBytes = store.repackOffset.byteLength;
  const matchTargetBytes = store.matchTarget.byteLength;
  const totalTypedArrayBytes = restPosBytes + repackOffsetBytes + matchTargetBytes;

  return (
    <div
      id="benchmark-stats-bar"
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 shadow-2xl overflow-hidden text-xs text-slate-300 transition-all max-w-xl w-[92%] sm:w-auto"
    >
      {/* Collapsed Pill Summary */}
      <div
        className="px-4 py-2 flex items-center justify-between sm:justify-start gap-4 cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-semibold text-slate-200">
            Graph: <span className="text-indigo-400 font-mono">{n}</span> nodes,{' '}
            <span className="text-cyan-400 font-mono">{e}</span> Bézier edges
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-400 font-mono">
          <span className="flex items-center gap-1">
            <HardDrive className="w-3 h-3 text-emerald-400" />
            {(totalTypedArrayBytes / 1024).toFixed(1)} KB TypedArray
          </span>

          {lastSolveDuration !== null && (
            <span className="flex items-center gap-1 text-indigo-300">
              <Cpu className="w-3 h-3 text-indigo-400" />
              {lastSolveDuration.toFixed(2)}ms (180 ticks)
            </span>
          )}
        </div>

        <button className="text-slate-400 hover:text-slate-200">
          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expanded Memory & Solver Details */}
      {isExpanded && (
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
          {/* restPositions */}
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <div className="flex justify-between text-slate-400 font-medium">
              <span>restPositions</span>
              <span className="font-mono text-cyan-400">{restPosBytes} B</span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              Float32Array(3 &times; {n})
            </p>
            <p className="text-[10px] text-slate-400">
              Baseline 3D coordinates [x, y, z]
            </p>
          </div>

          {/* repackOffset */}
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <div className="flex justify-between text-slate-400 font-medium">
              <span>repackOffset</span>
              <span className="font-mono text-indigo-400">{repackOffsetBytes} B</span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              Float32Array(3 &times; {n})
            </p>
            <p className="text-[10px] text-slate-400">
              Dynamic displacement vectors
            </p>
          </div>

          {/* matchTarget */}
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <div className="flex justify-between text-slate-400 font-medium">
              <span>matchTarget</span>
              <span className="font-mono text-emerald-400">{matchTargetBytes} B</span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              Float32Array({n})
            </p>
            <p className="text-[10px] text-slate-400">
              Opacity alpha (1.0 active / 0.0 dimmed)
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
