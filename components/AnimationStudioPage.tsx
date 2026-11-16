'use client';

import {useEffect, useRef, useState} from 'react';
import {
  Layers,
  Pause,
  Play,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import {
  ANIMATION_DEFINITIONS,
  AnimationId,
  renderAnimationFrame,
} from '@/lib/allSupplyChainAnimations';
import LineAnimationCard from './LineAnimationCard';
import SupplyChainPlayer from './SupplyChainPlayer';

const SPEEDS = [0.5, 1, 1.5, 2] as const;

export default function AnimationStudioPage() {
  const [viewMode, setViewMode] = useState<'suite' | 'hd-mine'>('suite');
  const [globalPlaying, setGlobalPlaying] = useState<boolean>(true);
  const [globalSpeed, setGlobalSpeed] = useState<number>(1);
  const [showAccents, setShowAccents] = useState<boolean>(true);
  const [expandedId, setExpandedId] = useState<AnimationId | null>(null);

  const modalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const modalTimeRef = useRef<number>(0);

  const expandedDef = expandedId
    ? ANIMATION_DEFINITIONS.find((d) => d.id === expandedId) ?? null
    : null;

  useEffect(() => {
    if (!expandedDef) return;
    const canvas = modalCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    modalTimeRef.current = 0;
    let rafId = 0;
    let lastNow = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - lastNow) / 1000);
      lastNow = now;
      modalTimeRef.current =
        (modalTimeRef.current + dt * globalSpeed) % expandedDef.durationSec;

      renderAnimationFrame(
        ctx,
        expandedDef.id,
        modalTimeRef.current,
        canvas.width,
        canvas.height,
        {showAccents}
      );
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [expandedDef, globalSpeed, showAccents]);

  if (viewMode === 'hd-mine') {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setViewMode('suite')}
              className="text-xs font-medium text-sky-700 hover:text-sky-900 hover:underline underline-offset-4 cursor-pointer"
            >
              ← Back to All 7 Line Animations (300×100 px)
            </button>
            <span className="text-xs font-mono text-slate-500">
              1920 × 720 HD Single-Process View
            </span>
          </div>
        </div>
        <SupplyChainPlayer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          <a
            href="#top"
            className="font-display text-lg font-semibold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            Industrial Line Suite
          </a>

          <nav
            aria-label="Section links"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
          >
            <a
              href="#stevedoring"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Stevedoring
            </a>
            <a
              href="#mine-to-port"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Mine-to-Port
            </a>
            <a
              href="#earthmoving"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Earthmoving
            </a>
            <a
              href="#ready-mix"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Ready-Mix
            </a>
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setGlobalPlaying((p) => !p)}
              className="inline-flex items-center gap-2 min-h-10 px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {globalPlaying ? (
                <>
                  <Pause className="w-4 h-4" aria-hidden="true" />
                  <span>Pause All</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" aria-hidden="true" />
                  <span>Play All</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      <main
        id="top"
        className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6"
      >
        {/* Intro & Workspace Controls */}
        <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 pb-2 border-b border-slate-200">
          <div className="space-y-2 max-w-3xl">
            <p className="text-xs font-mono font-medium text-sky-700">
              7 Industrial Process Animations · Native 300 × 100 px Slots
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 text-balance">
              Supply Chain & Operations Line Animations
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              All seven line-art animations rendered in your exact black-ink
              technical illustration style at native 300 × 100 px dimensions,
              ready for individual section embedding or .webm video export.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Speed Control */}
            <div
              role="group"
              aria-label="Global playback speed"
              className="inline-flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg"
            >
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setGlobalSpeed(s)}
                  className={`px-2.5 py-1.5 text-xs font-mono rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    globalSpeed === s
                      ? 'bg-slate-900 text-white font-medium'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>

            {/* Line Accent Toggle */}
            <button
              type="button"
              onClick={() => setShowAccents((a) => !a)}
              aria-pressed={showAccents}
              className={`inline-flex items-center gap-1.5 min-h-10 px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                showAccents
                  ? 'border-sky-200 bg-sky-50 text-sky-800'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{showAccents ? 'Style: Ink + Accents' : 'Style: Pure Ink'}</span>
            </button>

            {/* Full-screen HD Mine-to-Port View Switch */}
            <button
              type="button"
              onClick={() => setViewMode('hd-mine')}
              className="inline-flex items-center gap-1.5 min-h-10 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Full 1920×720 Mine-to-Port</span>
            </button>
          </div>
        </section>

        {/* All 7 Sections Stacked Cleanly on One Page */}
        <div className="space-y-4">
          {ANIMATION_DEFINITIONS.map((def) => (
            <LineAnimationCard
              key={def.id}
              definition={def}
              globalPlaying={globalPlaying}
              globalSpeed={globalSpeed}
              showAccents={showAccents}
              onExpand={(id) => setExpandedId(id)}
            />
          ))}
        </div>
      </main>

      {/* Expanded 900x300 Inspector Modal */}
      {expandedDef && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={expandedDef.title}
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setExpandedId(null)}
        >
          <div
            className="bg-white border border-slate-200 rounded-xl max-w-4xl w-full p-5 sm:p-6 space-y-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-semibold text-slate-900">
                  {expandedDef.title}
                </h2>
                <p className="text-sm text-slate-600 mt-0.5">
                  {expandedDef.subtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setExpandedId(null)}
                aria-label="Close expanded preview"
                className="inline-flex items-center justify-center min-h-10 min-w-10 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="w-full bg-white border border-slate-300 rounded-lg overflow-hidden">
              <canvas
                ref={modalCanvasRef}
                width={900}
                height={300}
                className="w-full h-auto block aspect-[3/1]"
              />
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-slate-500">
              <span>Preview scaled 3× from 300 × 100 px vector coordinates</span>
              <span>Cycle duration {expandedDef.durationSec.toFixed(1)}s</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
