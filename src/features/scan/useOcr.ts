import { useEffect, useRef, useState } from 'react';

// Tesseract worker type (imported lazily).
type TesseractWorker = {
  recognize: (img: HTMLCanvasElement | ImageData | Blob) => Promise<{ data: { text: string } }>;
  terminate: () => Promise<void>;
};

interface UseOcrOpts {
  enabled: boolean;
  /** Called with raw recognized text + extracted SKU (if matched). */
  onRecognized: (text: string, sku: string | null) => void;
}

/** Match patterns like "SKU-77421" or "SKU 77421" or bare EAN (8/12/13 digits). */
function extractSku(text: string): string | null {
  const skuMatch = text.match(/SKU[-\s]?(\d{3,6})/i);
  if (skuMatch) return `SKU-${skuMatch[1]}`;
  const ean = text.match(/\b(\d{13}|\d{12}|\d{8})\b/);
  if (ean) return ean[1]!;
  return null;
}

export function useOcr({ enabled, onRecognized }: UseOcrOpts) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workerRef = useRef<TesseractWorker | null>(null);
  const busyRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [recognizing, setRecognizing] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

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

        // Lazy-load Tesseract (large wasm).
        const { createWorker } = await import('tesseract.js');
        if (cancelled) return;
        const w = await createWorker('eng');
        if (cancelled) { await w.terminate(); return; }
        workerRef.current = w as unknown as TesseractWorker;
        setReady(true);
      } catch (e) {
        setError((e as Error).message);
      }
    }

    void start();

    return () => {
      cancelled = true;
      void workerRef.current?.terminate().catch(() => undefined);
      workerRef.current = null;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setReady(false);
    };
  }, [enabled]);

  const capture = async () => {
    if (busyRef.current) return;
    const v = videoRef.current;
    const w = workerRef.current;
    if (!v || !w) return;
    busyRef.current = true;
    setRecognizing(true);
    try {
      const canvas = document.createElement('canvas');
      const vw = v.videoWidth || 640;
      const vh = v.videoHeight || 480;
      // Crop center ~60% × 40% for the reticle region.
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
      onRecognized(text, sku);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      busyRef.current = false;
      setRecognizing(false);
    }
  };

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn } as MediaTrackConstraintSet] });
      setTorchOn((v) => !v);
    } catch { /* ignore */ }
  };

  return { videoRef, ready, recognizing, error, torchSupported, torchOn, toggleTorch, capture };
}
