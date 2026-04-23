import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/data/api';

export interface VisionResult {
  sku?: string | null;
  name?: string | null;
  qty?: number | null;
  batch?: string | null;
  ean?: string | null;
  unit?: string | null;
  location?: string | null;
  confidence: number;
  raw_text: string;
}

/** Confidence threshold — below this we force a manual review. */
const MIN_CONFIDENCE = 0.55;

interface UseAiVisionOpts {
  enabled: boolean;
  /** Auto-snapshot cadence in ms. Default 0 (manual only). */
  intervalMs?: number;
  onResult: (r: VisionResult) => void;
  onError?: (err: string) => void;
}

export function useAiVision({ enabled, intervalMs = 0, onResult, onError }: UseAiVisionOpts) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const busyRef = useRef(false);
  const doneRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

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
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        const v = videoRef.current;
        if (!v) { stream.getTracks().forEach((t) => t.stop()); return; }
        v.srcObject = stream;
        try { await v.play(); } catch { /* autoplay */ }

        const track = stream.getVideoTracks()[0];
        const caps = (track?.getCapabilities?.() ?? {}) as { torch?: boolean };
        setTorchSupported(!!caps.torch);
        setReady(true);

        if (intervalMs > 0) {
          const loop = async () => {
            if (cancelled || doneRef.current) return;
            await runOnce();
            if (cancelled || doneRef.current) return;
            timerRef.current = window.setTimeout(loop, intervalMs);
          };
          timerRef.current = window.setTimeout(loop, 600);
        }
      } catch (e) {
        setError((e as Error).message);
      }
    }

    void start();

    return () => {
      cancelled = true;
      doneRef.current = true;
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setReady(false);
    };
  }, [enabled, intervalMs]);

  const snapshot = (): string | null => {
    const v = videoRef.current;
    if (!v || v.readyState < 2) return null;
    // Aggressive downscale — long edge 720 + q 0.72 → ~50–80 KB JPEG.
    // Gemini 2.5 vision reads fine at this size and processes noticeably faster.
    const MAX = 720;
    const QUALITY = 0.72;
    const vw = v.videoWidth || 1280;
    const vh = v.videoHeight || 720;
    const scale = Math.min(1, MAX / Math.max(vw, vh));
    const cw = Math.round(vw * scale);
    const ch = Math.round(vh * scale);
    const canvas = document.createElement('canvas');
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(v, 0, 0, vw, vh, 0, 0, cw, ch);
    return canvas.toDataURL('image/jpeg', QUALITY);
  };

  const runOnce = useCallback(async () => {
    if (busyRef.current || doneRef.current) return;
    const img = snapshot();
    if (!img) return;
    busyRef.current = true;
    setRecognizing(true);
    try {
      const parsed = await api.vision.extract(img) as VisionResult;
      if ((parsed?.confidence ?? 0) >= MIN_CONFIDENCE && (parsed?.sku || parsed?.name)) {
        doneRef.current = true;
        onResult(parsed);
      }
    } catch (e) {
      const msg = (e as Error).message;
      setError(msg);
      onError?.(msg);
    } finally {
      busyRef.current = false;
      setRecognizing(false);
    }
  }, [onError, onResult]);

  const captureNow = useCallback(async () => {
    if (busyRef.current || doneRef.current) return;
    const img = snapshot();
    if (!img) return;
    busyRef.current = true;
    setRecognizing(true);
    try {
      const parsed = await api.vision.extract(img) as VisionResult;
      doneRef.current = true;
      onResult(parsed);
    } catch (e) {
      const raw = (e as Error).message ?? String(e);
      const friendly = /503|overload|unavailable|spike|resource_exhausted|429/i.test(raw)
        ? 'AI is temporarily overloaded. Wait a moment and try again.'
        : raw.slice(0, 160);
      setError(friendly);
      onError?.(friendly);
    } finally {
      busyRef.current = false;
      setRecognizing(false);
    }
  }, [onError, onResult]);

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn } as MediaTrackConstraintSet] });
      setTorchOn((v) => !v);
    } catch { /* ignore */ }
  };

  return { videoRef, ready, recognizing, error, torchSupported, torchOn, toggleTorch, captureNow };
}
