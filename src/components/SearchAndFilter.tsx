/**
 * Search, Multi-Filter, and Section Cluster Selector
 */

import React from 'react';
import { Search, X, Filter, Sparkles, CheckSquare, Square } from 'lucide-react';
import { Section } from '../types/graph';

interface SearchAndFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sections: Section[];
  selectedSections: number[];
  onToggleSection: (sectionIndex: number) => void;
  onSelectAllSections: () => void;
  onClearFilter: () => void;
  matchedCount: number;
  totalNodes: number;
}

export const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  searchQuery,
  onSearchChange,
  sections,
  selectedSections,
  onToggleSection,
  onSelectAllSections,
  onClearFilter,
  matchedCount,
  totalNodes,
}) => {
  const isFiltered = searchQuery.trim().length > 0 || (selectedSections.length > 0 && selectedSections.length < sections.length);

  return (
    <div
      id="search-and-filter-bar"
      className="p-3.5 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs z-10 shrink-0"
    >
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          id="graph-search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by title, concept, or slug (e.g. transformer, consensus, octree)..."
          className="w-full pl-9 pr-8 py-1.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition text-xs"
        />
        {searchQuery && (
          <button
            id="btn-clear-search"
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Cluster / Section Selector Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
        <span className="text-slate-400 text-[11px] font-medium mr-1 flex items-center gap-1">
          <Filter className="w-3 h-3" />
          Clusters:
        </span>

        {sections.map((sec) => {
          const isSelected = selectedSections.includes(sec.index);
          return (
            <button
              key={sec.index}
              id={`filter-section-${sec.index}`}
              onClick={() => onToggleSection(sec.index)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition border whitespace-nowrap ${
                isSelected
                  ? 'bg-slate-800 border-slate-600 text-white shadow-sm'
                  : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: sec.color }}
              />
              <span>{sec.title.split(' ')[0]}</span>
              <span className="text-[10px] text-slate-400">({sec.slugs.length})</span>
            </button>
          );
        })}

        {isFiltered && (
          <button
            id="btn-reset-filters"
            onClick={onClearFilter}
            className="px-2 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[11px] font-medium transition flex items-center gap-1 shrink-0"
          >
            <X className="w-3 h-3" />
            Reset ({matchedCount}/{totalNodes})
          </button>
        )}
      </div>
    </div>
  );
};
