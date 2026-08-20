/**
 * Physics Parameter Controls & 3D Visual Layer Toggles
 */

import React, { useState } from 'react';
import {
  Sliders,
  Eye,
  Activity,
  Play,
  RotateCcw,
  Zap,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { PhysicsParams, DEFAULT_PHYSICS_PARAMS } from '../types/graph';

interface PhysicsControlsProps {
  params: PhysicsParams;
  onChangeParams: (newParams: PhysicsParams) => void;
  showOctreeBounds: boolean;
  onToggleOctreeBounds: () => void;
  showBezierControlPoints: boolean;
  onToggleBezierControlPoints: () => void;
  showClusterHalos: boolean;
  onToggleClusterHalos: () => void;
  showLabels: boolean;
  onToggleLabels: () => void;
  pulseAnimation: boolean;
  onTogglePulseAnimation: () => void;
  curveResolution: number;
  onChangeCurveResolution: (res: number) => void;
  onTriggerSolveRepack: () => void;
}

export const PhysicsControls: React.FC<PhysicsControlsProps> = ({
  params,
  onChangeParams,
  showOctreeBounds,
  onToggleOctreeBounds,
  showBezierControlPoints,
  onToggleBezierControlPoints,
  showClusterHalos,
  onToggleClusterHalos,
  showLabels,
  onToggleLabels,
  pulseAnimation,
  onTogglePulseAnimation,
  curveResolution,
  onChangeCurveResolution,
  onTriggerSolveRepack,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'params' | 'visuals' | 'formulas'>('params');

  const updateParam = (key: keyof PhysicsParams, val: number) => {
    onChangeParams({
      ...params,
      [key]: val,
    });
  };

  const handleResetDefaults = () => {
    onChangeParams({ ...DEFAULT_PHYSICS_PARAMS });
  };

  return (
    <div
      id="physics-controls-panel"
      className="absolute top-20 left-4 z-20 w-80 max-h-[calc(100vh-140px)] flex flex-col bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 shadow-2xl overflow-hidden transition-all text-xs text-slate-300"
    >
      {/* Header Bar */}
      <div
        className="px-4 py-3 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between cursor-pointer select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <span className="font-semibold text-slate-100">Physics & Solver Engine</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="btn-run-solver-quick"
            onClick={(e) => {
              e.stopPropagation();
              onTriggerSolveRepack();
            }}
            className="p-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30"
            title="Re-run 180-Tick Solve"
          >
            <Zap className="w-3.5 h-3.5" />
          </button>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {isOpen && (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Sub Navigation Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-950/30 text-[11px] font-medium">
            <button
              onClick={() => setActiveTab('params')}
              className={`flex-1 py-2 text-center transition ${
                activeTab === 'params'
                  ? 'text-indigo-400 border-b-2 border-indigo-500 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Parameters
            </button>
            <button
              onClick={() => setActiveTab('visuals')}
              className={`flex-1 py-2 text-center transition ${
                activeTab === 'visuals'
                  ? 'text-indigo-400 border-b-2 border-indigo-500 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              3D Layers
            </button>
            <button
              onClick={() => setActiveTab('formulas')}
              className={`flex-1 py-2 text-center transition ${
                activeTab === 'formulas'
                  ? 'text-indigo-400 border-b-2 border-indigo-500 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Formulas
            </button>
          </div>

          <div className="p-4 space-y-4 overflow-y-auto max-h-[420px]">
            {activeTab === 'params' && (
              <>
                {/* Charge Strength */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-slate-400">
                    <span>Barnes-Hut Charge:</span>
                    <span className="font-mono text-indigo-400">{params.chargeStrength}</span>
                  </div>
                  <input
                    type="range"
                    min="-150"
                    max="-10"
                    step="5"
                    value={params.chargeStrength}
                    onChange={(e) => updateParam('chargeStrength', parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <p className="text-[10px] text-slate-500">Repulsive force magnitude (default -55)</p>
                </div>

                {/* Theta Parameter */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-slate-400">
                    <span>Barnes-Hut &theta; (theta):</span>
                    <span className="font-mono text-indigo-400">{params.theta.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="1.5"
                    step="0.05"
                    value={params.theta}
                    onChange={(e) => updateParam('theta', parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <p className="text-[10px] text-slate-500">Multipole approximation threshold (default 0.9)</p>
                </div>

                {/* Collision Radius Padding */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-slate-400">
                    <span>Collision Padding (r + P):</span>
                    <span className="font-mono text-indigo-400">+{params.collideRadiusPadding}</span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="40"
                    step="1"
                    value={params.collideRadiusPadding}
                    onChange={(e) => updateParam('collideRadiusPadding', parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <p className="text-[10px] text-slate-500">Minimum clearance between spheres (default 18)</p>
                </div>

                {/* Centering Force */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-slate-400">
                    <span>Centering Force (X, Y, Z):</span>
                    <span className="font-mono text-indigo-400">{params.centeringStrength.toFixed(3)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.01"
                    max="0.2"
                    step="0.005"
                    value={params.centeringStrength}
                    onChange={(e) => updateParam('centeringStrength', parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <p className="text-[10px] text-slate-500">Origin centering gravity (default 0.06)</p>
                </div>

                {/* Link Spring Stiffness */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-slate-400">
                    <span>Spring Link Stiffness:</span>
                    <span className="font-mono text-indigo-400">{params.linkStrength.toFixed(3)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.01"
                    max="0.25"
                    step="0.005"
                    value={params.linkStrength}
                    onChange={(e) => updateParam('linkStrength', parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>

                {/* Simulation Ticks */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-slate-400">
                    <span>Synchronous Repack Ticks:</span>
                    <span className="font-mono text-indigo-400">{params.simulationTicks}</span>
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="300"
                    step="20"
                    value={params.simulationTicks}
                    onChange={(e) => updateParam('simulationTicks', parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between gap-2">
                  <button
                    id="btn-repack-now"
                    onClick={onTriggerSolveRepack}
                    className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center justify-center gap-1.5 transition active:scale-95 shadow-md shadow-indigo-600/30"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    Solve 180 Ticks
                  </button>
                  <button
                    id="btn-reset-params"
                    onClick={handleResetDefaults}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                    title="Reset Physics Defaults"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}

            {activeTab === 'visuals' && (
              <div className="space-y-3">
                {/* Octree Bounds Toggle */}
                <label className="flex items-center justify-between p-2 rounded-xl bg-slate-950/40 border border-slate-800 hover:border-slate-700 cursor-pointer">
                  <span className="flex items-center gap-2">
                    <Eye className="w-3.5 h-3.5 text-cyan-400" />
                    <span>3D Octree Bounding Boxes</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={showOctreeBounds}
                    onChange={onToggleOctreeBounds}
                    className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                  />
                </label>

                {/* Cluster Halos Toggle */}
                <label className="flex items-center justify-between p-2 rounded-xl bg-slate-950/40 border border-slate-800 hover:border-slate-700 cursor-pointer">
                  <span className="flex items-center gap-2">
                    <Eye className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Cluster Centroid Halos</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={showClusterHalos}
                    onChange={onToggleClusterHalos}
                    className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                  />
                </label>

                {/* Billboard Labels */}
                <label className="flex items-center justify-between p-2 rounded-xl bg-slate-950/40 border border-slate-800 hover:border-slate-700 cursor-pointer">
                  <span className="flex items-center gap-2">
                    <Eye className="w-3.5 h-3.5 text-amber-400" />
                    <span>Node Title Billboards</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={showLabels}
                    onChange={onToggleLabels}
                    className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                  />
                </label>

                {/* Pulse Glow */}
                <label className="flex items-center justify-between p-2 rounded-xl bg-slate-950/40 border border-slate-800 hover:border-slate-700 cursor-pointer">
                  <span className="flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Aura Pulse Animation</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={pulseAnimation}
                    onChange={onTogglePulseAnimation}
                    className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                  />
                </label>

                {/* Curve Segments Resolution */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Bézier Spline Segments:</span>
                    <span className="font-mono text-indigo-400">{curveResolution}</span>
                  </div>
                  <input
                    type="range"
                    min="12"
                    max="48"
                    step="4"
                    value={curveResolution}
                    onChange={(e) => onChangeCurveResolution(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
              </div>
            )}

            {activeTab === 'formulas' && (
              <div className="space-y-3 text-[11px] text-slate-300 font-mono bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <div className="space-y-1">
                  <span className="text-indigo-400 font-semibold block">Node Radius R(k):</span>
                  <code className="text-slate-300 block text-[10px] bg-slate-900 p-1.5 rounded">
                    R = 2.2 + [ln(1+k) / ln(1+37)] * 6.5
                  </code>
                </div>

                <div className="space-y-1">
                  <span className="text-indigo-400 font-semibold block">3D Quadratic Bézier Curve:</span>
                  <code className="text-slate-300 block text-[10px] bg-slate-900 p-1.5 rounded">
                    B(t) = (1-t)² P₀ + 2(1-t)t P₁ + t² P₂
                  </code>
                </div>

                <div className="space-y-1">
                  <span className="text-indigo-400 font-semibold block">Barnes-Hut Criterion:</span>
                  <code className="text-slate-300 block text-[10px] bg-slate-900 p-1.5 rounded">
                    (length² / dist²) &lt; 0.81 (&theta; = 0.9)
                  </code>
                </div>

                <div className="space-y-1">
                  <span className="text-indigo-400 font-semibold block">Link Spring Force:</span>
                  <code className="text-slate-300 block text-[10px] bg-slate-900 p-1.5 rounded">
                    factor = [(dist - targetDist) / dist] * 0.08
                  </code>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
