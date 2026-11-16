import {
  ANIMATION_DEFINITIONS,
  AnimationId,
  renderAnimationFrame,
} from './allSupplyChainAnimations';

export interface MultiVideoExportOptions {
  animationId: AnimationId;
  width: 300 | 900;
  height: 100 | 300;
  showAccents: boolean;
  onProgress: (percent: number) => void;
  signal?: AbortSignal;
}

export interface MultiVideoExportResult {
  blob: Blob;
  filename: string;
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

export async function exportLineAnimationVideo(
  options: MultiVideoExportOptions
): Promise<MultiVideoExportResult> {
  const {animationId, width, height, showAccents, onProgress, signal} = options;

  if (typeof MediaRecorder === 'undefined') {
    throw new Error('Video recording is not supported in this browser.');
  }

  const def = ANIMATION_DEFINITIONS.find((d) => d.id === animationId);
  const durationSec = def?.durationSec ?? 8.0;
  const targetDurationMs = durationSec * 1000;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not initialize 2D rendering context.');
  }

  const mimeType = getSupportedMimeType();
  const stream = canvas.captureStream(30);
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: width >= 900 ? 4_000_000 : 1_800_000,
  });

  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (ev) => {
    if (ev.data && ev.data.size > 0) {
      chunks.push(ev.data);
    }
  };

  return new Promise<MultiVideoExportResult>((resolve, reject) => {
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
      reject(new Error('MediaRecorder failed while encoding video.'));
    };

    recorder.onstop = () => {
      if (settled) return;
      settled = true;
      cleanup();
      const blob = new Blob(chunks, {type: mimeType});
      onProgress(100);
      resolve({
        blob,
        filename: `${animationId}-${width}x${height}.webm`,
      });
    };

    renderAnimationFrame(ctx, animationId, 0, width, height, {showAccents});
    recorder.start(200);
    const startTime = performance.now();

    const tick = (now: number) => {
      if (settled) return;
      const elapsedMs = now - startTime;
      const progress = Math.min(1, elapsedMs / targetDurationMs);
      const simTime = progress * durationSec;

      renderAnimationFrame(ctx, animationId, simTime, width, height, {
        showAccents,
      });
      onProgress(Math.round(progress * 99));

      if (elapsedMs < targetDurationMs) {
        rafId = requestAnimationFrame(tick);
      } else {
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
