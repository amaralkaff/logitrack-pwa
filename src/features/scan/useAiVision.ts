import { useCallback, useEffect, useRef, useState } from 'react';

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

const BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';
/** Confidence threshold — below this we force a manual review. */
const MIN_CONFIDENCE = 0.55;

interface UseAiVisionOpts {
  enabled: boolean;
  /** Auto-snapshot cadence in ms. Default 2000. Set to 0 to disable. */
  intervalMs?: number;
  onResult: (r: VisionResult) => void;
  onError?: (err: string) => void;
}

export function useAiVision({ enabled, intervalMs = 2000, onResult, onError }: UseAiVisionOpts) {
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
    // Full-frame capture; downscale long edge to 1280 to keep JPEG under ~300 KB.
    const MAX = 1280;
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
    return canvas.toDataURL('image/jpeg', 0.82);
  };

  const runOnce = useCallback(async () => {
    if (busyRef.current || doneRef.current) return;
    const img = snapshot();
    if (!img) return;
    busyRef.current = true;
    setRecognizing(true);
    try {
      const res = await fetch(`${BASE}/vision`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ image: img }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => res.statusText);
        throw new Error(`${res.status}: ${txt.slice(0, 200)}`);
      }
      const parsed = (await res.json()) as VisionResult;
      if ((parsed?.confidence ?? 0) >= MIN_CONFIDENCE && (parsed?.sku || parsed?.name)) {
        doneRef.current = true;
        onResult(parsed);
      }
      // else keep looping
    } catch (e) {
      const msg = (e as Error).message;
      setError(msg);
      onError?.(msg);
    } finally {
      busyRef.current = false;
      setRecognizing(false);
    }
  }, [onError, onResult]);

  /** Manual shutter (also used by tap-to-scan). Bypasses confidence gate. */
  const captureNow = useCallback(async () => {
    if (busyRef.current || doneRef.current) return;
    const img = snapshot();
    if (!img) return;
    busyRef.current = true;
    setRecognizing(true);
    try {
      const res = await fetch(`${BASE}/vision`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ image: img }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => res.statusText);
        throw new Error(`${res.status}: ${txt.slice(0, 200)}`);
      }
      const parsed = (await res.json()) as VisionResult;
      doneRef.current = true;
      onResult(parsed);
    } catch (e) {
      const msg = (e as Error).message;
      setError(msg);
      onError?.(msg);
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
