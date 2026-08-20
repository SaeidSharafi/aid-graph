/**
 * Information Modal - RTL & Persian Localization
 */

import React from 'react';
import { X, ExternalLink, Code, GitBranch, Sparkles, MousePointerClick } from 'lucide-react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenImportModal?: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose, onOpenImportModal }) => {
  if (!isOpen) return null;

  return (
    <div
      id="info-modal-backdrop"
      dir="rtl"
      className="fixed inset-0 z-50 bg-neutral-950/50 backdrop-blur-xs flex items-center justify-center p-4 font-sans"
      onClick={onClose}
    >
      <div
        id="info-modal-card"
        className="w-full max-w-lg bg-[#fafaf9] rounded-2xl border border-neutral-200 shadow-2xl p-6 sm:p-7 space-y-5 text-neutral-900 max-h-[88vh] overflow-y-auto text-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-neutral-200 pb-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-neutral-500 uppercase bg-neutral-100 px-2 py-0.5 rounded-md border border-neutral-200">
              <Sparkles className="w-3 h-3 text-amber-500" />
              گراف دانش سه‌بعدی
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-neutral-950 mt-1.5">
              دانشنامه کدنویسی با هوش مصنوعی
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center text-neutral-500 hover:text-neutral-950 hover:bg-neutral-200 cursor-pointer transition-colors"
            aria-label="بستن"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 text-sm text-neutral-700 leading-relaxed">
          {/* Main Description */}
          <div className="space-y-2.5 bg-neutral-100/70 p-3.5 rounded-xl border border-neutral-200/80">
            <p className="text-neutral-800 font-medium">
              این روزها همه از <span className="font-semibold text-neutral-950">توکن‌ها</span>، <span className="font-semibold text-neutral-950">پنجره‌های کانتکست</span>، <span className="font-semibold text-neutral-950">ایجنت‌ها</span> و <span className="font-semibold text-neutral-950">هندآف‌ها</span> حرف می‌زنند — اما نیمی از مواقع هیچ‌کس بر سر معنای دقیق آن‌ها هم‌نظر نیست.
            </p>
            <p className="text-neutral-600 text-xs sm:text-sm">
              این دانشنامه هر اصطلاح را به بیانی ساده شرح داده و آن‌ها را به صورت یک گراف زنده به هم متصل کرده تا به جای حفظ کردن یک فهرست، ارتباط ایده‌ها را کشف کنید. کافی است روی هر گره کلیک کنید و مسیر مفاهیم را دنبال نمایید.
            </p>
          </div>

          {/* Interaction Guide */}
          <div className="space-y-2 pt-1">
            <h4 className="font-bold text-xs uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
              <MousePointerClick className="w-3.5 h-3.5" />
              راهنمای تعامل با گراف:
            </h4>
            <ul className="grid grid-cols-1 gap-1.5 text-xs text-neutral-600 bg-white p-3 rounded-lg border border-neutral-200">
              <li><strong className="text-neutral-800">کلیک چپ و کشیدن:</strong> چرخش زاویه دید سه‌بعدی</li>
              <li><strong className="text-neutral-800">کلیک راست و کشیدن:</strong> جابه‌جایی زاویه دوربین (Pan)</li>
              <li><strong className="text-neutral-800">چرخ ماوس (Scroll):</strong> بزرگ‌نمایی و کوچک‌نمایی</li>
              <li><strong className="text-neutral-800">کلیک روی هر گره:</strong> باز شدن تعریف کامل و جامع اصطلاح</li>
              <li><strong className="text-neutral-800">کلیک روی اتصالات:</strong> پرش مستقیم به مفاهیم مرتبط</li>
            </ul>
          </div>

          {/* Optional Action Button */}
          {onOpenImportModal && (
            <div className="pt-1">
              <button
                onClick={() => {
                  onClose();
                  onOpenImportModal();
                }}
                className="w-full py-2.5 px-4 bg-neutral-900 text-white rounded-xl text-xs font-bold hover:bg-neutral-800 flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
              >
                <Code className="w-3.5 h-3.5" />
                <span>ورود فایل‌های Markdown و ساخت خودکار JSON</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer (Attribution & AI translation note) */}
        <div className="pt-3.5 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-neutral-500">
          <div className="flex items-center gap-1 text-[11.5px]">
            <span>برگرفته و ترجمه‌شده با AI از</span>
            <a
              href="https://aicodingdictionary.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 text-neutral-900 font-semibold hover:underline"
            >
              <span>AI Coding Dictionary</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <a
            href="https://github.com/SaeidSharafi/dictionary-of-ai-coding/tree/feat/persian-localization-v2"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-neutral-800 hover:text-neutral-950 font-medium hover:underline bg-neutral-200/60 hover:bg-neutral-200 px-2.5 py-1 rounded-md transition-colors"
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>مشارکت در ترجمه</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};