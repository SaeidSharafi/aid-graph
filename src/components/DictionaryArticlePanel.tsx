/**
 * Dictionary Article Panel - Full Specification with Interactive Markdown Links, Usage, Avoid & Section Papers
 */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { X, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2, Link2, BookOpen } from 'lucide-react';
import { DictionaryNode, DictionarySection } from '../data/dictionaryData';
import { GraphStore } from '../store/GraphStore';
import { PALETTE, GraphNode, Section } from '../types/graph';

interface DictionaryArticlePanelProps {
  node: DictionaryNode | GraphNode;
  store: GraphStore;
  section?: DictionarySection | Section;
  termIndex: number;
  totalTerms: number;
  onClose: () => void;
  onSelectSlug: (slug: string) => void;
  onPrev: () => void;
  onNext: () => void;
  prevTitle: string;
  nextTitle: string;
}

export const DictionaryArticlePanel: React.FC<DictionaryArticlePanelProps> = ({
  node,
  store,
  section,
  termIndex,
  totalTerms,
  onClose,
  onSelectSlug,
  onPrev,
  onNext,
  prevTitle,
  nextTitle,
}) => {
  // Extract connected nodes
  const connectedSlugs = store.neighborsOf(node.slug);
  const connectedNodes = Array.from(connectedSlugs)
    .map((slug) => store.nodes.find((n) => n.slug === slug))
    .filter((n): n is (typeof store.nodes)[0] => !!n);

  const sectionPaperColor =
    PALETTE.SECTION_PAPERS[node.section % PALETTE.SECTION_PAPERS.length] || '#4500B3';

  // Helper to render body text with auto-hyperlinking of dictionary terms
  const renderInteractiveText = (text: string) => {
    if (!text) return null;
    const slugMap = new Map(store.nodes.map((n) => [n.title.toLowerCase(), n.slug]));
    store.nodes.forEach((n) => {
      slugMap.set(n.slug.toLowerCase(), n.slug);
    });

    const words = text.split(/(\s+|[.,;!?()[\]"«»])/);
    return words.map((chunk, idx) => {
      const clean = chunk.toLowerCase().replace(/[^a-z0-9-]/g, '');
      const matchSlug = slugMap.get(clean);

      if (matchSlug && matchSlug !== node.slug) {
        return (
          <span
            key={idx}
            onClick={() => onSelectSlug(matchSlug)}
            className="underline underline-offset-4 decoration-neutral-400 hover:decoration-neutral-950 text-neutral-950 font-medium cursor-pointer transition-colors"
          >
            {chunk}
          </span>
        );
      }
      return <span key={idx}>{chunk}</span>;
    });
  };

  const leadSentence = node.description || '';

  return (
    <aside
      id="dictionary-article-panel"
      dir="rtl"
      className="w-full md:w-[480px] lg:w-[520px] h-full flex flex-col bg-[#fdfdfc] border-r border-neutral-200 text-neutral-900 shadow-2xl z-20 overflow-hidden font-sans select-text"
    >
      {/* Top Section Header */}
      <div className="px-7 pt-6 pb-4 flex items-center justify-between border-b border-neutral-100 bg-[#fafaf8]">
        <div className="flex items-center gap-2.5">
          <span
            className="w-3 h-3 rounded-full shadow-2xs"
            style={{ backgroundColor: sectionPaperColor }}
          />
          <span className="text-[11px] font-bold tracking-wider text-neutral-600 uppercase block">
            {section?.title || `بخش ${node.section}`}
          </span>
        </div>

        <div className="flex items-center gap-3.5">
          <span className="text-xs text-neutral-500 font-mono">
            <strong className="text-neutral-950 font-bold text-sm">{termIndex + 1}</strong> از {totalTerms}
          </span>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center text-neutral-600 hover:text-neutral-950 hover:bg-neutral-200 transition-colors cursor-pointer"
            title="بستن پنل"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-7 py-6 space-y-6 text-right">
        {/* Title & In-Degree Badge */}
        <div>
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-neutral-950">
              {node.title}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-[11px] font-mono font-medium text-neutral-700 whitespace-nowrap">
              <Link2 className="w-3 h-3 text-neutral-500" />
              {node.inDegree} ارجاع
            </span>
          </div>

          <span className="text-xs font-mono text-neutral-400 mt-1.5 block uppercase tracking-wider">
            {node.slug}
          </span>
        </div>

        {/* Lead Highlight Callout */}
        {leadSentence && (
          <div className="text-[15px] leading-relaxed text-neutral-800 font-normal">
            <span className="bg-neutral-950 text-white px-2 py-0.5 rounded-sm font-medium ml-1 inline-block">
              {leadSentence.split('.')[0]}.
            </span>
            {leadSentence.split('.').slice(1).join('.').trim() && (
              <span className="text-neutral-700">
                {' '}
                {leadSentence.split('.').slice(1).join('.').trim()}
              </span>
            )}
          </div>
        )}

        {/* Section: HEARD IN THE WILD */}
        {node.heardInTheWild && (
          <div className="space-y-3 pt-2">
            <h3 className="text-[11px] font-bold tracking-wider text-neutral-400 uppercase">
              شنیده شده در عمل (HEARD IN THE WILD)
            </h3>

            <div className="space-y-3">
              <div className="p-3.5 bg-neutral-100 rounded-2xl text-[13.5px] text-neutral-800 border border-neutral-200/80 max-w-[90%]">
                «{node.heardInTheWild.user}»
              </div>

              <div className="p-4 bg-neutral-900 text-neutral-100 rounded-2xl text-[13.5px] leading-relaxed mr-6 shadow-sm">
                {renderInteractiveText(node.heardInTheWild.agent)}
              </div>
            </div>
          </div>
        )}

        {/* Section: Heard in the wild EXAMPLES */}
        {node.usage && node.usage.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="text-[11px] font-bold tracking-wider text-neutral-400 uppercase flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
             گوشه‌ای از یک گفت‌وگو
            </h3>

          <div className="flex flex-col space-y-3 font-sans">
  {node.usage.map((item, idx) => {
    const isAssistant = idx % 2 !== 0;

    return (
      <div
        key={idx}
        className={`w-fit text-[14px] leading-relaxed tracking-tight ${
          isAssistant
            ? "ml-8 max-w-[90%] rounded-2xl bg-[#1c1c1c] p-4 text-neutral-200 shadow-sm"
            : "max-w-[75%] rounded-2xl border border-neutral-300 bg-[#f7f7f7] px-4 py-2.5 text-neutral-800"
        }`}
      >
        {renderInteractiveText(item)}
      </div>
    );
  })}
</div>
          </div>
        )}

        {/* Section: AVOID / WARNING */}
        {node.avoid && (
          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-[13px] text-amber-950 space-y-1.5 shadow-2xs">
            <span className="font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 text-amber-800">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              پرهیز شود (AVOID)
            </span>
            <p className="leading-relaxed">{node.avoid}</p>
          </div>
        )}

        {/* Section: CONNECTS TO */}
        <div className="space-y-3 pt-2">
          <h3 className="text-[11px] font-bold tracking-wider text-neutral-400 uppercase">
            متصل به (CONNECTS TO)
          </h3>

          <div className="flex flex-wrap gap-2">
            {connectedNodes.length > 0 ? (
              connectedNodes.map((target) => (
                <button
                  key={target.slug}
                  onClick={() => onSelectSlug(target.slug)}
                  className="px-3.5 py-1.5 rounded-full border border-neutral-300 bg-white text-xs font-medium text-neutral-800 hover:bg-neutral-950 hover:text-white hover:border-neutral-950 transition-all shadow-2xs cursor-pointer"
                >
                  {target.title}
                </button>
              ))
            ) : (
              <span className="text-xs text-neutral-400 italic">بدون اتصال مستقیم</span>
            )}
          </div>
        </div>

        {/* Section: FULL DEFINITION */}
        <div className="space-y-3 pt-2 pb-6 border-t border-neutral-200">
          <h3 className="text-[11px] font-bold tracking-wider text-neutral-400 uppercase pt-4 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-neutral-500" />
            تعریف و شرح مفهومی (FULL DEFINITION)
          </h3>

          <div className="prose prose-sm max-w-none text-neutral-800 leading-relaxed prose-headings:font-bold prose-headings:text-neutral-950 prose-table:border-collapse">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ href, children }) => {
                  const targetSlug = href?.replace(/^#/, '').replace(/^\.\//, '').replace(/\.md$/, '');
                  return (
                    <a
                      href={href}
                      onClick={(e) => {
                        e.preventDefault();
                        if (targetSlug) onSelectSlug(targetSlug);
                      }}
                      className="font-medium text-indigo-600 underline underline-offset-2 hover:text-indigo-800 cursor-pointer"
                    >
                      {children}
                    </a>
                  );
                },
                table: ({ children }) => (
                  <div className="overflow-x-auto my-4 rounded-lg border border-gray-200 shadow-2xs">
                    <table className="w-full text-right text-xs border-collapse">{children}</table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-gray-100/80 border-b border-gray-200 text-neutral-800 font-semibold">
                    {children}
                  </thead>
                ),
                th: ({ children }) => <th className="p-2.5 font-semibold text-gray-700 border-b border-gray-200">{children}</th>,
                td: ({ children }) => <td className="p-2.5 border-t border-gray-100 text-neutral-700">{children}</td>,
              }}
            >
              {node.prose || node.body}
            </ReactMarkdown>
          </div>
        </div>
      </div>

      {/* Bottom Sticky Navigation */}
      <div className="p-4 px-6 border-t border-neutral-200 bg-white/95 backdrop-blur-md flex items-center justify-between">
        {/* Previous Term (Right in RTL) */}
        <button
          onClick={onPrev}
          className="flex items-center gap-3 text-right group hover:opacity-80 transition-opacity cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center text-neutral-700 group-hover:bg-neutral-100">
            <ChevronRight className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase block">
              قبلی (PREV)
            </span>
            <span className="text-xs font-semibold text-neutral-800 max-w-[130px] truncate block">
              {prevTitle}
            </span>
          </div>
        </button>

        {/* Next Term (Left in RTL) */}
        <button
          onClick={onNext}
          className="flex items-center gap-3 text-left group hover:opacity-80 transition-opacity cursor-pointer"
        >
          <div>
            <span className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase block">
              بعدی (NEXT)
            </span>
            <span className="text-xs font-semibold text-neutral-800 max-w-[130px] truncate block">
              {nextTitle}
            </span>
          </div>
          <div className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center text-neutral-700 group-hover:bg-neutral-100">
            <ChevronLeft className="w-4 h-4" />
          </div>
        </button>
      </div>
    </aside>
  );
};
