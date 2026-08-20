/**
 * Markdown Import & Graph JSON Builder Modal
 * Allows uploading .md files from github.com/SaeidSharafi/dictionary-of-ai-coding or pasting Markdown text
 * to run the 5-step Hyperlink AST/Regex parser, generate 3D Bézier curves, inDegrees, and download graph.json.
 */

import React, { useState } from 'react';
import { X, Upload, FileText, Download, Check, Sparkles, RefreshCw, Layers } from 'lucide-react';
import {
  parseSingleMarkdownDoc,
  parseMultiSectionMarkdownDoc,
  buildGraphFromMarkdownTerms,
  ParsedMarkdownTerm,
  CompleteGraphData,
} from '../utils/markdownGraphBuilder';

interface MarkdownImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyGraph: (graphData: CompleteGraphData) => void;
}

export const MarkdownImportModal: React.FC<MarkdownImportModalProps> = ({
  isOpen,
  onClose,
  onApplyGraph,
}) => {
  const [activeTab, setActiveTab] = useState<'files' | 'paste'>('files');
  const [pastedText, setPastedText] = useState('');
  const [docName, setDocName] = useState('README.md');
  const [parsedTerms, setParsedTerms] = useState<ParsedMarkdownTerm[]>([]);
  const [generatedGraph, setGeneratedGraph] = useState<CompleteGraphData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  if (!isOpen) return null;

  // Handle Multiple File Upload or single multi-section README
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    setStatusMsg(`در حال خواندن ${files.length} فایل Markdown...`);

    const terms: ParsedMarkdownTerm[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.name.endsWith('.md')) {
        const text = await file.text();
        if (text.includes('## Section') || (text.match(/###\s+/g) || []).length > 2) {
          const multi = parseMultiSectionMarkdownDoc(text);
          terms.push(...multi);
        } else {
          const term = parseSingleMarkdownDoc(file.name, text);
          terms.push(term);
        }
      }
    }

    if (terms.length > 0) {
      const graph = buildGraphFromMarkdownTerms(terms);
      setParsedTerms(terms);
      setGeneratedGraph(graph);
      setStatusMsg(`✅ ${terms.length} اصطلاح و ${graph.edges.length} پیوند (یال سه‌بعدی) با موفقیت استخراج شدند.`);
    } else {
      setStatusMsg('❌ هیچ فایل .md معتبری پیدا نشد.');
    }
    setIsProcessing(false);
  };

  // Handle Parse Pasted Text
  const handleParsePasted = () => {
    if (!pastedText.trim()) return;

    setIsProcessing(true);
    let extracted: ParsedMarkdownTerm[] = [];

    if (pastedText.includes('## Section') || (pastedText.match(/###\s+/g) || []).length > 2) {
      extracted = parseMultiSectionMarkdownDoc(pastedText);
    } else {
      extracted = [parseSingleMarkdownDoc(docName, pastedText)];
    }

    const termSlugs = new Set(extracted.map((t) => t.slug));
    const existing = parsedTerms.filter((t) => !termSlugs.has(t.slug));
    const updated = [...existing, ...extracted];

    const graph = buildGraphFromMarkdownTerms(updated);
    setParsedTerms(updated);
    setGeneratedGraph(graph);
    setStatusMsg(`✅ ${extracted.length} اصطلاح پردازش شدند. (${graph.edges.length} پیوند در کل)`);
    setIsProcessing(false);
  };

  // Download graph.json
  const handleDownloadJSON = () => {
    if (!generatedGraph) return;
    const blob = new Blob([JSON.stringify(generatedGraph, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'graph.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      id="markdown-import-modal"
      className="fixed inset-0 z-50 bg-neutral-950/40 backdrop-blur-xs flex items-center justify-center p-4 font-sans"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#fafaf9] rounded-2xl border border-neutral-200 shadow-2xl p-6 space-y-5 text-neutral-900 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
          <div className="space-y-0.5">
            <span className="text-[10.5px] font-bold tracking-widest text-neutral-500 uppercase">
              ساخت خودکار گراف دانش از پیوندهای MARKDOWN
            </span>
            <h2 className="text-xl font-black text-neutral-950">
              استخراج هایپرلینک‌ها و ساخت JSON گراف
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center text-neutral-600 hover:text-neutral-950 hover:bg-neutral-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info box explaining the 5-step breakdown */}
        <div className="p-3.5 bg-neutral-100 rounded-xl border border-neutral-200 text-xs leading-relaxed text-neutral-700 space-y-1">
          <div className="font-bold text-neutral-950 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-neutral-700" />
            <span>نحوه عملکرد الگوریتم استخراج پیوندها:</span>
          </div>
          <p>
            فایل‌های Markdown مخزن (مثلاً شاخه فارسی{' '}
            <code className="bg-neutral-200 px-1 py-0.5 rounded text-[11px] font-mono">feat/persian-localization</code>)
            را دریافت کرده، پیوندهای <code className="bg-neutral-200 px-1 py-0.5 rounded text-[11px] font-mono">[term](./File.md)</code>{' '}
            را استخراج نموده، یال‌های منحنی سه‌بعدی Bézier و درجه ورودی (<code className="font-mono">inDegree</code>) هر گره را محاسبه می‌کند.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex rounded-lg bg-neutral-200/80 p-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('files')}
            className={`flex-1 py-2 rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'files' ? 'bg-white text-neutral-950 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>آپلود گروهی فایل‌های md.</span>
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`flex-1 py-2 rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'paste' ? 'bg-white text-neutral-950 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>جای‌گذاری مستقیم متن Markdown</span>
          </button>
        </div>

        {/* Tab 1: File Upload */}
        {activeTab === 'files' && (
          <div className="space-y-4">
            <label className="border-2 border-dashed border-neutral-300 hover:border-neutral-500 bg-white rounded-xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all">
              <Upload className="w-8 h-8 text-neutral-400" />
              <span className="text-sm font-bold text-neutral-800">
                فایل‌های Markdown (دایرکتوری /dictionary/*.md) را اینجا بکشید یا انتخاب کنید
              </span>
              <span className="text-xs text-neutral-500">
                پشتیبانی از چندین فایل همزمان با پسوند .md
              </span>
              <input
                type="file"
                multiple
                accept=".md"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </div>
        )}

        {/* Tab 2: Paste Markdown */}
        {activeTab === 'paste' && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                نام فایل Markdown (مثلاً: Agent.md یا Turn.md):
              </label>
              <input
                type="text"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-white border border-neutral-300 rounded-lg focus:outline-none focus:border-neutral-900"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                متن محتوای Markdown با لینک‌های نسبی:
              </label>
              <textarea
                rows={6}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Away from keyboard. A working pattern where the user kicks off a [session](./Session.md) and leaves the [agent](./Agent.md)..."
                className="w-full p-3 text-xs font-mono bg-white border border-neutral-300 rounded-lg focus:outline-none focus:border-neutral-900"
              />
            </div>

            <button
              onClick={handleParsePasted}
              disabled={!pastedText.trim()}
              className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-xs font-bold hover:bg-neutral-800 disabled:opacity-50 cursor-pointer"
            >
              استخراج هایپرلینک‌ها و افزودن به گراف
            </button>
          </div>
        )}

        {/* Status Notification */}
        {statusMsg && (
          <div className="p-3 bg-neutral-100 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-800">
            {statusMsg}
          </div>
        )}

        {/* Results Preview & Actions */}
        {generatedGraph && (
          <div className="pt-4 border-t border-neutral-200 space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-white border border-neutral-200 rounded-xl">
                <span className="text-xs text-neutral-500 block">تعداد اصطلاحات (گره‌ها)</span>
                <span className="text-lg font-black text-neutral-950">
                  {generatedGraph.meta.totalNodes}
                </span>
              </div>
              <div className="p-3 bg-white border border-neutral-200 rounded-xl">
                <span className="text-xs text-neutral-500 block">تعداد پیوندها (یال‌ها)</span>
                <span className="text-lg font-black text-neutral-950">
                  {generatedGraph.meta.totalEdges}
                </span>
              </div>
              <div className="p-3 bg-white border border-neutral-200 rounded-xl">
                <span className="text-xs text-neutral-500 block">بیشترین inDegree</span>
                <span className="text-lg font-black text-neutral-950">
                  {generatedGraph.meta.maxInDegree}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={handleDownloadJSON}
                className="px-4 py-2 border border-neutral-300 bg-white text-neutral-900 rounded-xl text-xs font-bold hover:bg-neutral-100 flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>دانلود فایل graph.json</span>
              </button>

              <button
                onClick={() => {
                  onApplyGraph(generatedGraph);
                  onClose();
                }}
                className="px-5 py-2 bg-neutral-950 text-white rounded-xl text-xs font-bold hover:bg-neutral-800 flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                <span>اعمال روی گراف سه‌بعدی فعال</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
