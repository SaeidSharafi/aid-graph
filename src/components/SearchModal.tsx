/**
 * Search Modal for AI Coding Dictionary - RTL & Persian Support
 */

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowLeft, BookOpen, Layers } from 'lucide-react';
import { DictionaryNode, DictionarySection } from '../data/dictionaryData';
import { useJourney } from '../store/useJourney';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: DictionaryNode[];
  sections: DictionarySection[];
  onSelectSlug: (slug: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  nodes,
  sections,
  onSelectSlug,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      useJourney.getState().setQuery('');
      useJourney.getState().setMatches(null);
    }
  }, [isOpen]);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    useJourney.getState().setQuery(val);
    const q = val.toLowerCase().trim();
    if (!q) {
      useJourney.getState().setMatches(null);
    } else {
      const matchSlugs = nodes
        .filter(
          (n) =>
            n.title.toLowerCase().includes(q) ||
            n.slug.toLowerCase().includes(q) ||
            n.description.toLowerCase().includes(q) ||
            n.aliases.some((a) => a.toLowerCase().includes(q))
        )
        .map((n) => n.slug);
      useJourney.getState().setMatches(matchSlugs);
    }
  };

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();
  const filtered = nodes.filter((n) => {
    if (!q) return true;
    return (
      n.title.toLowerCase().includes(q) ||
      n.slug.toLowerCase().includes(q) ||
      n.description.toLowerCase().includes(q) ||
      n.aliases.some((a) => a.toLowerCase().includes(q))
    );
  });

  return (
    <div
      id="search-modal-backdrop"
      dir="rtl"
      className="fixed inset-0 z-50 bg-neutral-950/40 backdrop-blur-xs flex items-start justify-center pt-20 px-4 font-sans"
      onClick={onClose}
    >
      <div
        id="search-modal-card"
        className="w-full max-w-xl bg-[#fafaf9] rounded-2xl border border-neutral-200 shadow-2xl overflow-hidden flex flex-col max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Input */}
        <div className="p-4 px-6 border-b border-neutral-200 flex items-center gap-3 bg-white">
          <Search className="w-5 h-5 text-neutral-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="جستجوی اصطلاحات، ابزارها، تعاریف کدنویسی هوش مصنوعی..."
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            className="flex-1 bg-transparent text-base text-neutral-900 placeholder:text-neutral-400 outline-none font-medium text-right"
          />
          {query && (
            <button
              onClick={() => handleQueryChange('')}
              className="text-neutral-400 hover:text-neutral-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-[11px] font-mono text-neutral-400 px-2 py-0.5 rounded bg-neutral-100 border border-neutral-200">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-neutral-100">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-neutral-400 text-sm">
              هیچ اصطلاحی برای «{query}» پیدا نشد.
            </div>
          ) : (
            filtered.map((node) => {
              const sec = sections[node.section % sections.length];
              return (
                <div
                  key={node.slug}
                  onClick={() => {
                    onSelectSlug(node.slug);
                    onClose();
                  }}
                  className="py-3 px-3 hover:bg-neutral-200/50 rounded-xl cursor-pointer transition-colors flex items-start justify-between group text-right"
                >
                  <div className="space-y-1 pl-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-neutral-900 text-sm group-hover:text-black">
                        {node.title}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-600">
                        {sec?.title?.split('&')[0] || 'اصطلاح'}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-600 line-clamp-1">{node.description}</p>
                  </div>

                  <ArrowLeft className="w-4 h-4 text-neutral-300 group-hover:text-neutral-800 transition-transform group-hover:-translate-x-0.5 mt-1 shrink-0" />
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 px-6 bg-neutral-100 border-t border-neutral-200 text-[11px] text-neutral-500 flex justify-between">
          <span>{filtered.length} اصطلاح یافت شد</span>
          <span>کلیک جهت مشاهده در گراف سه‌بعدی</span>
        </div>
      </div>
    </div>
  );
};
