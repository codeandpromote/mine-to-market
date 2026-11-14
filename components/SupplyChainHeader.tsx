'use client';

import {Download} from 'lucide-react';

interface SupplyChainHeaderProps {
  onExportClick: () => void;
  isExporting: boolean;
}

export default function SupplyChainHeader({
  onExportClick,
  isExporting,
}: SupplyChainHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        <a
          href="#stage"
          className="font-display text-lg font-semibold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
        >
          Mine-to-Port Visualizer
        </a>

        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600"
        >
          <a
            href="#stage"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Animation Stage
          </a>
          <a
            href="#stages"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Cycle Breakdown
          </a>
          <a
            href="#reference"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Source Drawing
          </a>
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onExportClick}
            disabled={isExporting}
            className="inline-flex items-center gap-2 min-h-10 px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 disabled:bg-slate-400 rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            <span>{isExporting ? 'Rendering Video...' : 'Export Video'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
