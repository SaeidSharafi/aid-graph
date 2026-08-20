import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { X, Link2, AlertTriangle, CheckCircle2 } from 'lucide-react';

export interface NodeData {
  slug: string;
  title: string;
  description: string;
  body: string;
  prose?: string;
  avoid?: string;
  usage?: string[];
  links?: string[];
  inDegree: number;
  section: number;
}

export interface TermSheetProps {
  node: NodeData;
  onNavigate: (slug: string) => void;
  onClose: () => void;
}

export const TermSheet: React.FC<TermSheetProps> = ({
  node,
  onNavigate,
  onClose,
}) => {
  return (
    <div dir="rtl" className="flex flex-col gap-6 p-6 text-[#1a1a19] font-sans bg-[#fdfdfc] h-full overflow-y-auto select-text">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-neutral-100 pb-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-neutral-950">{node.title}</h1>
          <span className="text-xs text-gray-500 uppercase tracking-wider font-mono mt-1 block">{node.slug}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full border border-gray-300 bg-gray-50 font-mono font-medium text-neutral-700 flex items-center gap-1">
            <Link2 className="w-3 h-3 text-neutral-500" />
            {node.inDegree} ارجاع
          </span>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-gray-200 transition-colors text-neutral-600 hover:text-neutral-950 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Description */}
      {node.description && (
        <p className="text-base leading-relaxed text-gray-800 font-normal">{node.description}</p>
      )}

      {/* HEARD IN THE WILD (USAGE CHAT) */}
      {node.usage && node.usage.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>نحوه کاربرد و استفاده (USAGE)</span>
          </div>

          <div className="space-y-2">
            {/* User message (White bubble) */}
            {node.usage[0] && (
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs text-sm leading-relaxed text-neutral-800">
                {node.usage[0]}
              </div>
            )}
            {/* Response message (Dark bubble) */}
            {node.usage[1] && (
              <div className="rounded-2xl bg-[#1a1a19] text-[#eaeae8] p-4 text-sm leading-relaxed shadow-xs">
                {node.usage[1]}
              </div>
            )}
            {/* Any additional usage examples */}
            {node.usage.slice(2).map((item, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-gray-200 bg-neutral-50 p-4 text-sm leading-relaxed text-neutral-800"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AVOID BOX */}
      {node.avoid && (
        <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-4 text-sm shadow-2xs">
          <div className="flex items-center gap-1.5 font-semibold text-amber-800 mb-1 text-xs uppercase tracking-wider">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>پرهیز شود (AVOID)</span>
          </div>
          <p className="text-amber-950 leading-relaxed text-[13.5px]">{node.avoid}</p>
        </div>
      )}

      {/* CONNECTS TO (NEIGHBOR PILLS) */}
      {node.links && node.links.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            متصل به (CONNECTS TO)
          </div>
          <div className="flex flex-wrap gap-2">
            {node.links.map((linkSlug) => (
              <button
                key={linkSlug}
                onClick={() => onNavigate(linkSlug)}
                className="rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-medium hover:bg-neutral-900 hover:text-white hover:border-neutral-900 transition-all capitalize shadow-2xs cursor-pointer"
              >
                {linkSlug.replace(/-/g, ' ')}
              </button>
            ))}
          </div>
        </div>
      )}

      <hr className="border-gray-200 my-1" />

      {/* FULL DEFINITION MARKDOWN (Supports Tables & Links) */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          تعریف و شرح مفهومی (FULL DEFINITION)
        </div>

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
                      if (targetSlug) onNavigate(targetSlug);
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
  );
};

export const TermDrawer = TermSheet;
