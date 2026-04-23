import { useEffect, useRef, useState } from 'react';

type TesseractWorker = {
  recognize: (img: HTMLCanvasElement | ImageData | Blob) => Promise<{ data: { text: string } }>;
  terminate: () => Promise<void>;
};

interface UseOcrOpts {
  enabled: boolean;
  /** Called with raw recognized text + extracted SKU (if matched). */
  onRecognized: (text: string, sku: string | null) => void;
  /** ms between recognize passes. Default 1200. */
  intervalMs?: number;
}

/** Match SKU/NSN-style tokens. */
function extractSku(text: string): string | null {
  const prefixed = text.match(/\b([A-Z]{2,5})[-\s]?(\d{3,6})\b/);
  if (prefixed) return `${prefixed[1]}-${prefixed[2]}`;
  const ean = text.match(/\b(\d{13}|\d{12}|\d{8})\b/);
  if (ean) return ean[1]!;
  return null;
}

export function useOcr({ enabled, onRecognized, intervalMs = 1200 }: UseOcrOpts) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workerRef = useRef<TesseractWorker | null>(null);
  const busyRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const doneRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [recognizing, setRecognizing] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    doneRef.current = false;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Camera not available (needs HTTPS or localhost)');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        const v = videoRef.current;
        if (!v) { stream.getTracks().forEach((t) => t.stop()); return; }
        v.srcObject = stream;
        try { await v.play(); } catch { /* autoplay blocked */ }

        const track = stream.getVideoTracks()[0];
        const caps = (track?.getCapabilities?.() ?? {}) as { torch?: boolean };
        setTorchSupported(!!caps.torch);

        // Lazy-load Tesseract. Use self-hosted assets so no external CDN fetch
        // (avoids SSL/cert failures on locked-down networks).
        const { createWorker } = await import('tesseract.js');
        if (cancelled) return;
        const w = await createWorker('eng', 1, {
          workerPath: '/tesseract/worker.min.js',
          corePath: '/tesseract/',
          langPath: '/tesseract/lang',
        });
        if (cancelled) { await w.terminate(); return; }
        workerRef.current = w as unknown as TesseractWorker;
        setReady(true);

        // Kick off auto-recognize loop.
        const tick = async () => {
          if (cancelled || doneRef.current) return;
          await runOnce();
          if (cancelled || doneRef.current) return;
          timerRef.current = window.setTimeout(tick, intervalMs);
        };
        timerRef.current = window.setTimeout(tick, 400);
      } catch (e) {
        setError((e as Error).message);
      }
    }

    async function runOnce() {
      if (busyRef.current || doneRef.current) return;
      const v = videoRef.current;
      const w = workerRef.current;
      if (!v || !w || v.readyState < 2) return;
      busyRef.current = true;
      setRecognizing(true);
      try {
        const canvas = document.createElement('canvas');
        const vw = v.videoWidth || 640;
        const vh = v.videoHeight || 480;
        const cw = Math.round(vw * 0.6);
        const ch = Math.round(vh * 0.4);
        const cx = Math.round((vw - cw) / 2);
        const cy = Math.round((vh - ch) / 2);
        canvas.width = cw;
        canvas.height = ch;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('canvas 2d unavailable');
        ctx.drawImage(v, cx, cy, cw, ch, 0, 0, cw, ch);
        const { data } = await w.recognize(canvas);
        const text = data.text.trim();
        const sku = extractSku(text);
        if (sku) {
          doneRef.current = true;
          onRecognized(text, sku);
        }
      } catch (e) {
        // Non-fatal: swallow per-frame errors so loop continues.
        // eslint-disable-next-line no-console
        console.debug('[ocr] frame error', e);
      } finally {
        busyRef.current = false;
        setRecognizing(false);
      }
    }

    void start();

    return () => {
      cancelled = true;
      doneRef.current = true;
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
      void workerRef.current?.terminate().catch(() => undefined);
      workerRef.current = null;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setReady(false);
    };
  }, [enabled, intervalMs, onRecognized]);

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn } as MediaTrackConstraintSet] });
      setTorchOn((v) => !v);
    } catch { /* ignore */ }
  };

  return { videoRef, ready, recognizing, error, torchSupported, torchOn, toggleTorch };
}
