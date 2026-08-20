/**
 * Header & Preset Bar
 */

import React from 'react';
import { Network, Sparkles, Layers, Cpu, RefreshCw, Box } from 'lucide-react';
import { GraphStore } from '../store/GraphStore';

interface HeaderProps {
  store: GraphStore;
  currentPreset: string;
  onSelectPreset: (presetId: string) => void;
  onResetLayout: () => void;
  lastSolveDuration: number | null;
  selectedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  store,
  currentPreset,
  onSelectPreset,
  onResetLayout,
  lastSolveDuration,
  selectedCount,
}) => {
  return (
    <header
      id="app-header"
      className="h-16 px-5 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md flex items-center justify-between z-20 shrink-0"
    >
      <div className="flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
          <Network className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
            3D Force-Directed Knowledge Graph
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
              Octree Barnes-Hut & Bézier
            </span>
          </h1>
          <p className="text-xs text-slate-400 hidden md:block">
            High-performance 3D spatial layout solver & dynamic repacking engine
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Preset Selector */}
        <div className="flex items-center gap-2 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700/60">
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          <select
            id="preset-select"
            value={currentPreset}
            onChange={(e) => onSelectPreset(e.target.value)}
            className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer pr-2 font-medium"
          >
            <option value="deep-tech" className="bg-slate-900 text-slate-200">
              Deep Tech Graph (52 Nodes)
            </option>
            <option value="scale-100" className="bg-slate-900 text-slate-200">
              Scale Benchmark (100 Nodes)
            </option>
            <option value="scale-200" className="bg-slate-900 text-slate-200">
              Dense Scale Test (200 Nodes)
            </option>
          </select>
        </div>

        {/* Solver Stats Badge */}
        {lastSolveDuration !== null && (
          <div
            id="solver-duration-badge"
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono"
            title="Last solveRepack 180-tick execution time"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>{lastSolveDuration.toFixed(1)}ms (180 ticks)</span>
          </div>
        )}

        {/* Global Reset */}
        <button
          id="btn-reset-layout"
          onClick={onResetLayout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-indigo-200 border border-indigo-500/30 text-xs font-medium transition active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset Solver</span>
        </button>
      </div>
    </header>
  );
};
