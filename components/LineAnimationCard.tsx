'use client';

import {useEffect, useRef, useState} from 'react';
import {
  Download,
  Maximize2,
  Pause,
  Play,
  RotateCcw,
  X,
} from 'lucide-react';
import {
  AnimationDefinition,
  AnimationId,
  renderAnimationFrame,
} from '@/lib/allSupplyChainAnimations';
import {exportLineAnimationVideo} from '@/lib/multiVideoExporter';

interface LineAnimationCardProps {
  definition: AnimationDefinition;
  globalPlaying: boolean;
  globalSpeed: number;
  showAccents: boolean;
  onExpand: (id: AnimationId) => void;
}

export default function LineAnimationCard({
  definition,
  globalPlaying,
  globalSpeed,
  showAccents,
  onExpand,
}: LineAnimationCardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timeRef = useRef<number>(0);
  const lastNowRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [localPlaying, setLocalPlaying] = useState<boolean>(true);
  const [activePhaseIndex, setActivePhaseIndex] = useState<number>(0);
  const [exportSize, setExportSize] = useState<'300x100' | '900x300'>('300x100');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportPct, setExportPct] = useState<number>(0);
  const [exportErr, setExportErr] = useState<string | null>(null);

  const isRunning = globalPlaying && localPlaying;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    renderAnimationFrame(
      ctx,
      definition.id,
      timeRef.current,
      canvas.width,
      canvas.height,
      {showAccents}
    );

    if (!isRunning) {
      lastNowRef.current = null;
      return;
    }

    let rafId = 0;
    let lastPhaseSync = 0;

    const tick = (now: number) => {
      if (lastNowRef.current === null) lastNowRef.current = now;
      const dt = Math.min(0.1, (now - lastNowRef.current) / 1000);
      lastNowRef.current = now;

      const next =
        (timeRef.current + dt * globalSpeed) % definition.durationSec;
      timeRef.current = next;

      renderAnimationFrame(ctx, definition.id, next, canvas.width, canvas.height, {
        showAccents,
      });

      if (now - lastPhaseSync > 120) {
        lastPhaseSync = now;
        const idx = Math.min(
          definition.phases.length - 1,
          Math.floor((next / definition.durationSec) * definition.phases.length)
        );
        setActivePhaseIndex(idx);
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
      lastNowRef.current = null;
    };
  }, [definition, isRunning, globalSpeed, showAccents]);

  const handleRestart = () => {
    timeRef.current = 0;
    setActivePhaseIndex(0);
    setLocalPlaying(true);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      renderAnimationFrame(ctx, definition.id, 0, canvas.width, canvas.height, {
        showAccents,
      });
    }
  };

  const handleDownloadVideo = async () => {
    if (isExporting) return;
    setExportErr(null);
    setIsExporting(true);
    setExportPct(0);

    const controller = new AbortController();
    abortRef.current = controller;

    const width = exportSize === '300x100' ? 300 : 900;
    const height = exportSize === '300x100' ? 100 : 300;

    try {
      const res = await exportLineAnimationVideo({
        animationId: definition.id,
        width,
        height,
        showAccents,
        onProgress: setExportPct,
        signal: controller.signal,
      });

      const url = URL.createObjectURL(res.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        setExportErr(err instanceof Error ? err.message : 'Export failed');
      }
    } finally {
      setIsExporting(false);
      abortRef.current = null;
    }
  };

  return (
    <section
      id={definition.id}
      className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
    >
      {/* Left: Exact 300x100 px Live Line-Animation Viewport */}
      <div className="shrink-0 flex flex-col items-start gap-2">
        <div
          className="w-[300px] h-[100px] bg-white border border-slate-300 rounded-lg overflow-hidden shadow-xs"
          title="Exact 300 × 100 px live animation frame"
        >
          <canvas
            ref={canvasRef}
            width={900}
            height={300}
            aria-label={`${definition.title} line animation`}
            className="w-[300px] h-[100px] block"
          />
        </div>

        <div className="w-[300px] flex items-center justify-between text-xs font-mono text-slate-500 tabular-nums">
          <span>300 × 100 px</span>
          <span className="text-sky-700 font-medium truncate max-w-[180px]">
            {definition.phases[activePhaseIndex]}
          </span>
        </div>
      </div>

      {/* Middle: Section Title, Description & Phase Sequence */}
      <div className="flex-1 min-w-0 space-y-2.5">
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-500 tabular-nums">
          <span>Loop {definition.durationSec.toFixed(1)}s</span>
          <span aria-hidden="true">·</span>
          <span>{definition.phases.join(' → ')}</span>
        </div>

        <h2 className="font-display text-lg sm:text-xl font-semibold text-slate-900">
          {definition.title}
        </h2>

        <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
          {definition.subtitle}
        </p>

        {exportErr && (
          <p className="text-xs font-medium text-red-700">{exportErr}</p>
        )}
      </div>

      {/* Right: Per-Section Controls & Video Download */}
      <div className="shrink-0 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setLocalPlaying((p) => !p)}
          aria-label={isRunning ? 'Pause animation' : 'Play animation'}
          className="inline-flex items-center justify-center min-h-10 min-w-10 px-3 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          {isRunning ? (
            <Pause className="w-4 h-4" aria-hidden="true" />
          ) : (
            <Play className="w-4 h-4" aria-hidden="true" />
          )}
        </button>

        <button
          type="button"
          onClick={handleRestart}
          aria-label="Restart animation"
          className="inline-flex items-center justify-center min-h-10 min-w-10 px-3 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => onExpand(definition.id)}
          className="inline-flex items-center gap-1.5 min-h-10 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Expand</span>
        </button>

        <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            type="button"
            onClick={() => setExportSize('300x100')}
            className={`px-2 py-1 text-xs font-mono rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              exportSize === '300x100'
                ? 'bg-white text-slate-900 font-medium shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            300×100
          </button>
          <button
            type="button"
            onClick={() => setExportSize('900x300')}
            className={`px-2 py-1 text-xs font-mono rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              exportSize === '900x300'
                ? 'bg-white text-slate-900 font-medium shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            900×300
          </button>
        </div>

        {isExporting ? (
          <button
            type="button"
            onClick={() => abortRef.current?.abort()}
            className="inline-flex items-center gap-1.5 min-h-10 px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Cancel ({exportPct}%)</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleDownloadVideo}
            className="inline-flex items-center gap-1.5 min-h-10 px-3.5 py-2 text-xs font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Video (.webm)</span>
          </button>
        )}
      </div>
    </section>
  );
}
