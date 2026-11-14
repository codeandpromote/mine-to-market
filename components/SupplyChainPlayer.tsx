'use client';

import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {motion, useReducedMotion} from 'motion/react';
import {
  CheckCircle2,
  Download,
  Film,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  Tag,
  X,
} from 'lucide-react';
import {
  computeSimulationState,
  SUPPLY_CHAIN_STAGES,
  TOTAL_CYCLE_SECONDS,
} from '@/lib/supplyChainSimulation';
import {
  renderSupplyChainFrame,
  SCENE_HEIGHT,
  SCENE_WIDTH,
} from '@/lib/supplyChainRenderer';
import {exportSupplyChainVideo} from '@/lib/videoExporter';
import SupplyChainHeader from './SupplyChainHeader';

const SPEED_OPTIONS = [0.5, 1, 1.5, 2] as const;

const COMPONENT_MAPPING = [
  {
    element: 'Mine Bench & Ore Bank',
    motion: 'Terraced pit face on left with dynamic ore bank depletion as the excavator bucket drags across the slope.',
  },
  {
    element: 'Tracked Excavator',
    motion: 'Articulated boom, stick, hydraulic cylinders, and toothed bucket performing two scoop-drag-lift-dump cycles.',
  },
  {
    element: 'Heavy Haul Dumper',
    motion: 'Spoked mining tires rotate with road speed, bed fills in two pours, drives to port, tilts 38 deg to unload, and returns empty.',
  },
  {
    element: 'Port Gantry & Ship Loader',
    motion: 'Intake hopper catches dumped ore, inclined truss conveyor carries parcels to the boom, and chute pours into the ship hold.',
  },
  {
    element: 'Bulk Carrier Vessel',
    motion: 'Cargo hold mound grows during loading as hull settles gently into animated harbor waterline ripples.',
  },
];

export default function SupplyChainPlayer() {
  const prefersReducedMotion = useReducedMotion();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const simTimeRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number | null>(null);
  const exportAbortRef = useRef<AbortController | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(!prefersReducedMotion);
  const [speed, setSpeed] = useState<number>(1);
  const [showAnnotations, setShowAnnotations] = useState<boolean>(true);
  const [displayTime, setDisplayTime] = useState<number>(0);

  // Video export state
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [exportDurationChoice, setExportDurationChoice] = useState<1 | 1.5>(1);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);
  const [exportedFilename, setExportedFilename] = useState<string>(
    'mine-to-port-supply-chain.webm'
  );
  const [sourceImgError, setSourceImgError] = useState<boolean>(false);

  const simState = useMemo(
    () => computeSimulationState(displayTime),
    [displayTime]
  );

  // Clean up object URL on unmount or replacement
  useEffect(() => {
    return () => {
      if (exportedVideoUrl) {
        URL.revokeObjectURL(exportedVideoUrl);
      }
    };
  }, [exportedVideoUrl]);

  // Render helper
  const drawAtTime = useCallback(
    (timeSec: number, annotations: boolean) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const state = computeSimulationState(timeSec);
      renderSupplyChainFrame(ctx, state, {showAnnotations: annotations});
    },
    []
  );

  // Main animation loop
  useEffect(() => {
    drawAtTime(simTimeRef.current, showAnnotations);

    if (!isPlaying) {
      lastFrameTimeRef.current = null;
      return;
    }

    let rafId = 0;
    let lastUiSync = 0;

    const loop = (now: number) => {
      if (lastFrameTimeRef.current === null) {
        lastFrameTimeRef.current = now;
      }
      const dtSec = Math.min(0.1, (now - lastFrameTimeRef.current) / 1000);
      lastFrameTimeRef.current = now;

      const nextTime =
        (simTimeRef.current + dtSec * speed) % TOTAL_CYCLE_SECONDS;
      simTimeRef.current = nextTime;

      drawAtTime(nextTime, showAnnotations);

      // Update React HUD state at ~20fps so controls/metrics stay crisp without wasted renders
      if (now - lastUiSync > 50) {
        lastUiSync = now;
        setDisplayTime(nextTime);
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafId);
      lastFrameTimeRef.current = null;
    };
  }, [isPlaying, speed, showAnnotations, drawAtTime]);

  const seekTo = useCallback(
    (targetSec: number) => {
      const clamped =
        ((targetSec % TOTAL_CYCLE_SECONDS) + TOTAL_CYCLE_SECONDS) %
        TOTAL_CYCLE_SECONDS;
      simTimeRef.current = clamped;
      setDisplayTime(clamped);
      drawAtTime(clamped, showAnnotations);
    },
    [drawAtTime, showAnnotations]
  );

  const handleTogglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  const handleRestart = () => {
    seekTo(0);
    setIsPlaying(true);
  };

  const handleStep = (deltaSec: number) => {
    setIsPlaying(false);
    seekTo(simTimeRef.current + deltaSec);
  };

  const handleStageSelect = (startSec: number) => {
    seekTo(startSec);
    setIsPlaying(true);
  };

  const handleExportVideo = async () => {
    if (isExporting) return;
    setExportError(null);
    setIsExporting(true);
    setExportProgress(0);

    if (exportedVideoUrl) {
      URL.revokeObjectURL(exportedVideoUrl);
      setExportedVideoUrl(null);
    }

    const controller = new AbortController();
    exportAbortRef.current = controller;

    try {
      const result = await exportSupplyChainVideo({
        showAnnotations,
        speedMultiplier: exportDurationChoice,
        onProgress: (pct) => setExportProgress(pct),
        signal: controller.signal,
      });

      const url = URL.createObjectURL(result.blob);
      setExportedVideoUrl(url);
      setExportedFilename(result.filename);

      // Automatically trigger browser download
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = result.filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        setExportError(
          err instanceof Error
            ? err.message
            : 'Unable to render video in this browser.'
        );
      }
    } finally {
      setIsExporting(false);
      exportAbortRef.current = null;
    }
  };

  const handleCancelExport = () => {
    exportAbortRef.current?.abort();
  };

  const scrubberPercent = (displayTime / TOTAL_CYCLE_SECONDS) * 100;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <SupplyChainHeader
        onExportClick={handleExportVideo}
        isExporting={isExporting}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-12">
        {/* Hero Title & Primary Interactive Video Stage */}
        <section id="stage" className="space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="space-y-2 max-w-3xl">
              <p className="text-xs font-mono font-medium text-sky-700 tracking-wide">
                Supply Chain Line Animation · 1920 × 720 HD
              </p>
              <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 text-balance">
                Mine Excavation to Bulk Carrier Loading Cycle
              </h1>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Continuous line-art process animation built directly from your
                mine-to-port diagram: excavator scoop and dump, haul corridor
                transit, port conveyor transfer, ship hold loading, and empty
                return.
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono text-slate-600 shrink-0 tabular-nums">
              <span>Stage {simState.activeStage.index} of 4</span>
              <span aria-hidden="true">·</span>
              <span>{simState.activeStage.shortLabel}</span>
            </div>
          </div>

          {/* Primary Drafting Video Canvas Container */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            {/* Pure White Drafting Canvas */}
            <div className="relative w-full bg-white border-b border-slate-200">
              <canvas
                ref={canvasRef}
                width={SCENE_WIDTH}
                height={SCENE_HEIGHT}
                aria-label="Animated line-art supply chain visualization from mine excavator to port bulk carrier ship"
                className="w-full h-auto block aspect-[8/3]"
              />
            </div>

            {/* Interactive Timeline Scrubber with Stage Segments */}
            <div className="px-4 sm:px-6 pt-4 pb-3 bg-white border-b border-slate-100 space-y-2.5">
              <div className="relative flex items-center">
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                  {SUPPLY_CHAIN_STAGES.map((stage, idx) => {
                    const widthPct =
                      ((stage.endSec - stage.startSec) / TOTAL_CYCLE_SECONDS) *
                      100;
                    const isCurrent = simState.activeStage.id === stage.id;
                    return (
                      <div
                        key={stage.id}
                        style={{width: `${widthPct}%`}}
                        className={`h-full border-r last:border-r-0 border-white transition-colors ${
                          isCurrent ? 'bg-sky-100' : 'bg-slate-100'
                        }`}
                        aria-hidden="true"
                      >
                        {idx === simState.activeStage.index - 1 && (
                          <div className="h-full bg-sky-200/60" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Active Playhead Fill */}
                <div
                  className="pointer-events-none absolute left-0 top-0 h-2.5 bg-sky-600 rounded-l-full"
                  style={{width: `${scrubberPercent}%`}}
                />

                {/* Range Input Overlay for smooth scrubbing */}
                <input
                  type="range"
                  min={0}
                  max={TOTAL_CYCLE_SECONDS}
                  step={0.05}
                  value={displayTime}
                  onChange={(e) => {
                    setIsPlaying(false);
                    seekTo(parseFloat(e.target.value));
                  }}
                  aria-label="Animation timeline scrubber"
                  className="absolute inset-0 w-full h-6 -top-1.5 opacity-0 cursor-pointer"
                />
              </div>

              {/* Stage Quick-Jump Markers under Scrubber */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {SUPPLY_CHAIN_STAGES.map((stage) => {
                  const isActive = simState.activeStage.id === stage.id;
                  return (
                    <button
                      key={stage.id}
                      type="button"
                      onClick={() => handleStageSelect(stage.startSec)}
                      className={`text-left px-2.5 py-1.5 rounded-md transition-colors cursor-pointer truncate ${
                        isActive
                          ? 'bg-sky-50 text-sky-800 font-medium'
                          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <span className="font-mono mr-1.5 tabular-nums">
                        0{stage.index}.
                      </span>
                      <span>{stage.shortLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Playback & Video Export Control Bar */}
            <div className="px-4 sm:px-6 py-4 bg-white flex flex-wrap items-center justify-between gap-4">
              {/* Left Playback Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleTogglePlay}
                  className="inline-flex items-center gap-2 min-h-10 px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4" aria-hidden="true" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" aria-hidden="true" />
                      <span>Play</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleStep(-0.5)}
                  aria-label="Step backward 0.5 seconds"
                  title="Step backward 0.5s"
                  className="inline-flex items-center justify-center min-h-10 min-w-10 px-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 cursor-pointer"
                >
                  <SkipBack className="w-4 h-4" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => handleStep(0.5)}
                  aria-label="Step forward 0.5 seconds"
                  title="Step forward 0.5s"
                  className="inline-flex items-center justify-center min-h-10 min-w-10 px-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 cursor-pointer"
                >
                  <SkipForward className="w-4 h-4" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={handleRestart}
                  className="inline-flex items-center gap-1.5 min-h-10 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" aria-hidden="true" />
                  <span>Restart</span>
                </button>

                <div className="px-3 py-1.5 text-xs font-mono text-slate-600 tabular-nums whitespace-nowrap">
                  {displayTime.toFixed(1)}s / {TOTAL_CYCLE_SECONDS.toFixed(1)}s
                </div>
              </div>

              {/* Right Speed, Labels & Export Controls */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Speed Selector */}
                <div
                  role="group"
                  aria-label="Playback speed"
                  className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg"
                >
                  {SPEED_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setSpeed(opt)}
                      className={`px-2.5 py-1.5 text-xs font-mono font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
                        speed === opt
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {opt}x
                    </button>
                  ))}
                </div>

                {/* Annotations Toggle */}
                <button
                  type="button"
                  onClick={() => setShowAnnotations((prev) => !prev)}
                  aria-pressed={showAnnotations}
                  className={`inline-flex items-center gap-1.5 min-h-10 px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    showAnnotations
                      ? 'border-sky-200 bg-sky-50 text-sky-800'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Labels: {showAnnotations ? 'On' : 'Off'}</span>
                </button>

                {/* Export Duration Toggle */}
                <div
                  role="group"
                  aria-label="Video export length"
                  className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg"
                >
                  <button
                    type="button"
                    onClick={() => setExportDurationChoice(1)}
                    className={`px-2.5 py-1.5 text-xs font-mono rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      exportDurationChoice === 1
                        ? 'bg-white text-slate-900 font-medium shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    18s Video
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportDurationChoice(1.5)}
                    className={`px-2.5 py-1.5 text-xs font-mono rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      exportDurationChoice === 1.5
                        ? 'bg-white text-slate-900 font-medium shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    12s Fast
                  </button>
                </div>

                {/* Primary Download Video Button */}
                {isExporting ? (
                  <button
                    type="button"
                    onClick={handleCancelExport}
                    className="inline-flex items-center gap-2 min-h-10 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                    <span>Cancel ({exportProgress}%)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleExportVideo}
                    className="inline-flex items-center gap-2 min-h-10 px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Film className="w-4 h-4" aria-hidden="true" />
                    <span>Download Video (.webm)</span>
                  </button>
                )}
              </div>
            </div>

            {/* Video Render Progress or Ready Banner */}
            {(isExporting || exportError || exportedVideoUrl) && (
              <div className="px-4 sm:px-6 py-4 bg-slate-50 border-t border-slate-200">
                {isExporting && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                      <span>
                        Rendering 1920 × 720 line-animation video loop...
                      </span>
                      <span className="font-mono tabular-nums">
                        {exportProgress}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sky-600 transition-all duration-150"
                        style={{width: `${exportProgress}%`}}
                      />
                    </div>
                  </div>
                )}

                {exportError && (
                  <p className="text-sm text-red-700 font-medium">
                    Export failed: {exportError}
                  </p>
                )}

                {!isExporting && exportedVideoUrl && (
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-3">
                      <CheckCircle2
                        className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5 sm:mt-0"
                        aria-hidden="true"
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          Video rendered and downloaded ({exportedFilename})
                        </p>
                        <p className="text-xs text-slate-600">
                          1920 × 720 WebM · Seamless supply chain loop
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <a
                        href={exportedVideoUrl}
                        download={exportedFilename}
                        className="inline-flex items-center gap-1.5 min-h-10 px-3.5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Save Again</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 4-Column Live Physical Telemetry Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-white border border-slate-200 rounded-xl divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
            <div className="p-4 sm:p-5 space-y-1">
              <p className="text-xs text-slate-500">Current Operation</p>
              <p className="text-sm font-semibold text-slate-900 truncate">
                {simState.activeStage.shortLabel}
              </p>
              <p className="text-xs text-slate-600 truncate">
                {simState.subPhaseLabel}
              </p>
            </div>

            <div className="p-4 sm:p-5 space-y-1">
              <p className="text-xs text-slate-500">Dumper Payload</p>
              <p className="text-xl font-mono font-semibold text-slate-900 tabular-nums">
                {simState.payloadTons} t
              </p>
              <p className="text-xs text-slate-600 font-mono tabular-nums">
                Capacity 120 t · Bed tilt {Math.round(simState.dumperBedTiltDeg)}°
              </p>
            </div>

            <div className="p-4 sm:p-5 space-y-1">
              <p className="text-xs text-slate-500">Conveyor & Loader Chute</p>
              <p className="text-xl font-mono font-semibold text-slate-900 tabular-nums">
                {simState.conveyorActive ? '240 t/h' : 'Standby'}
              </p>
              <p className="text-xs text-slate-600">
                {simState.chutePourAlpha > 0.05
                  ? 'Discharging into cargo hold'
                  : 'Waiting for port tip'}
              </p>
            </div>

            <div className="p-4 sm:p-5 space-y-1">
              <p className="text-xs text-slate-500">Bulk Carrier Cargo</p>
              <p className="text-xl font-mono font-semibold text-slate-900 tabular-nums">
                +{Math.max(0, simState.shipTonsLoaded)} t
              </p>
              <p className="text-xs text-slate-600 font-mono tabular-nums">
                Draft offset +{simState.shipDraftOffsetY.toFixed(1)} px
              </p>
            </div>
          </div>
        </section>

        {/* Exported Video Inline Preview (shown when user exports) */}
        {exportedVideoUrl && (
          <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-lg font-semibold text-slate-900">
                  Rendered Video Preview
                </h2>
                <p className="text-xs text-slate-600">
                  Recorded directly from the 1920 × 720 canvas stream · Ready
                  for presentations and embedding
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  URL.revokeObjectURL(exportedVideoUrl);
                  setExportedVideoUrl(null);
                }}
                className="text-xs font-medium text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
            <video
              src={exportedVideoUrl}
              controls
              loop
              autoPlay
              muted
              className="w-full rounded-lg border border-slate-200 bg-white aspect-[8/3]"
            />
          </section>
        )}

        {/* Section 2: Interactive 4-Stage Cycle Breakdown */}
        <section id="stages" className="space-y-5">
          <div className="space-y-1">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-slate-900">
              Four-Stage Supply Chain Cycle
            </h2>
            <p className="text-sm text-slate-600">
              Select any stage below to jump the animation playhead directly to
              that phase.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {SUPPLY_CHAIN_STAGES.map((stage) => {
              const isActive = simState.activeStage.id === stage.id;
              return (
                <motion.button
                  key={stage.id}
                  type="button"
                  onClick={() => handleStageSelect(stage.startSec)}
                  whileTap={prefersReducedMotion ? undefined : {scale: 0.99}}
                  className={`text-left p-5 rounded-xl border transition-colors cursor-pointer flex flex-col justify-between gap-4 ${
                    isActive
                      ? 'bg-white border-sky-600 ring-1 ring-sky-600'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 text-xs font-mono text-slate-500 tabular-nums">
                      <span>
                        {stage.startSec.toFixed(1)}s – {stage.endSec.toFixed(1)}s
                      </span>
                      {isActive && (
                        <span className="text-sky-700 font-semibold">
                          Active
                        </span>
                      )}
                    </div>
                    <h3 className="font-display text-base font-semibold text-slate-900">
                      {stage.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {stage.description}
                    </p>
                  </div>

                  <p className="text-xs font-mono text-slate-500 pt-3 border-t border-slate-100">
                    {stage.equipmentFocus}
                  </p>
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* Section 3: Original Reference Drawing & Animated Element Mapping */}
        <section id="reference" className="space-y-5 pb-6">
          <div className="space-y-1">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-slate-900">
              Source Line-Art Reference & Component Mapping
            </h2>
            <p className="text-sm text-slate-600">
              Every structural silhouette and mechanical assembly from your
              uploaded illustration is preserved in the animated canvas.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Uploaded Reference Diagram</span>
                <span className="font-mono">Original Static Line Art</span>
              </div>

              {sourceImgError ? (
                <div className="flex-1 min-h-56 rounded-lg border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center p-6 text-center text-sm text-slate-500">
                  Reference diagram preview unavailable. All elements are
                  rendered live in the vector stage above.
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-white rounded-lg border border-slate-100 p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/assets/aistudio/Untitled_design__2__7c9a7a90.png"
                    alt="Original static line-art supply chain illustration provided by user"
                    referrerPolicy="no-referrer"
                    onError={() => setSourceImgError(true)}
                    className="w-full h-auto max-h-72 object-contain"
                  />
                </div>
              )}
            </div>

            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="font-display text-base font-semibold text-slate-900">
                  Animated Mechanical Rig Summary
                </h3>
                <ul className="divide-y divide-slate-100">
                  {COMPONENT_MAPPING.map((item) => (
                    <li key={item.element} className="py-3 first:pt-0 last:pb-0">
                      <p className="text-sm font-medium text-slate-900">
                        {item.element}
                      </p>
                      <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
                        {item.motion}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
