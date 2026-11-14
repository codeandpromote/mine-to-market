import {
  computeSimulationState,
  TOTAL_CYCLE_SECONDS,
} from './supplyChainSimulation';
import {
  renderSupplyChainFrame,
  SCENE_HEIGHT,
  SCENE_WIDTH,
} from './supplyChainRenderer';

export interface VideoExportOptions {
  showAnnotations: boolean;
  speedMultiplier?: number; // e.g. 1 for 18s standard, 1.5 for 12s compact
  onProgress: (percent: number) => void;
  signal?: AbortSignal;
}

export interface VideoExportResult {
  blob: Blob;
  filename: string;
  mimeType: string;
  durationSec: number;
}

function getSupportedMimeType(): string {
  const candidates = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ];
  for (const type of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return 'video/webm';
}

export async function exportSupplyChainVideo(
  options: VideoExportOptions
): Promise<VideoExportResult> {
  const {showAnnotations, speedMultiplier = 1, onProgress, signal} = options;

  if (typeof MediaRecorder === 'undefined') {
    throw new Error('Video recording is not supported in this browser.');
  }

  const canvas = document.createElement('canvas');
  canvas.width = SCENE_WIDTH;
  canvas.height = SCENE_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not initialize 2D rendering context for video export.');
  }

  const mimeType = getSupportedMimeType();
  const stream = canvas.captureStream(30);
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 6_500_000,
  });

  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (ev) => {
    if (ev.data && ev.data.size > 0) {
      chunks.push(ev.data);
    }
  };

  const targetDurationMs = (TOTAL_CYCLE_SECONDS / speedMultiplier) * 1000;

  return new Promise<VideoExportResult>((resolve, reject) => {
    let rafId = 0;
    let settled = false;

    const cleanup = () => {
      if (rafId) cancelAnimationFrame(rafId);
      stream.getTracks().forEach((track) => track.stop());
    };

    if (signal) {
      signal.addEventListener(
        'abort',
        () => {
          if (settled) return;
          settled = true;
          cleanup();
          if (recorder.state !== 'inactive') {
            recorder.stop();
          }
          reject(new DOMException('Export cancelled', 'AbortError'));
        },
        {once: true}
      );
    }

    recorder.onerror = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error('MediaRecorder encountered an encoding error.'));
    };

    recorder.onstop = () => {
      if (settled) return;
      settled = true;
      cleanup();
      const blob = new Blob(chunks, {type: mimeType});
      onProgress(100);
      resolve({
        blob,
        filename: `mine-to-port-supply-chain-${speedMultiplier === 1 ? '18s' : '12s'}.webm`,
        mimeType,
        durationSec: targetDurationMs / 1000,
      });
    };

    // Draw initial frame before starting recorder
    renderSupplyChainFrame(ctx, computeSimulationState(0), {showAnnotations});
    recorder.start(200);
    const startTime = performance.now();

    const tick = (now: number) => {
      if (settled) return;
      const elapsedMs = now - startTime;
      const progress = Math.min(1, elapsedMs / targetDurationMs);
      const simTimeSec = progress * TOTAL_CYCLE_SECONDS;

      renderSupplyChainFrame(ctx, computeSimulationState(simTimeSec), {
        showAnnotations,
      });
      onProgress(Math.round(progress * 99));

      if (elapsedMs < targetDurationMs) {
        rafId = requestAnimationFrame(tick);
      } else {
        // Hold final seamless frame briefly so encoder flushes cleanly
        setTimeout(() => {
          if (recorder.state !== 'inactive') {
            recorder.stop();
          }
        }, 120);
      }
    };

    rafId = requestAnimationFrame(tick);
  });
}
