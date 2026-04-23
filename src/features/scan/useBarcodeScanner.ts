import { useEffect, useRef, useState } from 'react';

type DetectedKind = 'qr' | 'ean' | 'upc' | 'code128' | 'code39' | 'unknown';

export interface ScanResult {
  text: string;
  kind: DetectedKind;
}

interface UseBarcodeScannerOpts {
  enabled: boolean;
  onDetected: (r: ScanResult) => void;
  /** Continue scanning after detection. Default: false (fires once). */
  continuous?: boolean;
}

// Narrow wrapper around native BarcodeDetector with ZXing fallback.
// TS: no native types for BarcodeDetector yet — declare minimal.
interface BarcodeDetectorLike {
  detect: (src: CanvasImageSource) => Promise<Array<{ rawValue: string; format: string }>>;
}
type BDConstructor = new (opts?: { formats?: string[] }) => BarcodeDetectorLike;

function mapFormat(f: string): DetectedKind {
  if (f === 'qr_code') return 'qr';
  if (f === 'ean_13' || f === 'ean_8') return 'ean';
  if (f === 'upc_a' || f === 'upc_e') return 'upc';
  if (f === 'code_128') return 'code128';
  if (f === 'code_39') return 'code39';
  return 'unknown';
}

export function useBarcodeScanner({ enabled, onDetected, continuous = false }: UseBarcodeScannerOpts) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const detectorRef = useRef<BarcodeDetectorLike | null>(null);
  const zxingStopRef = useRef<(() => void) | null>(null);
  const stopRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    stopRef.current = false;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('getUserMedia not available (needs HTTPS or localhost)');
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
        try { await v.play(); } catch { /* autoplay blocked — user gesture will resume */ }
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }

        const track = stream.getVideoTracks()[0];
        const caps = (track?.getCapabilities?.() ?? {}) as { torch?: boolean };
        setTorchSupported(!!caps.torch);

        const BD = (window as unknown as { BarcodeDetector?: BDConstructor }).BarcodeDetector;
        if (BD) {
          detectorRef.current = new BD({
            formats: ['qr_code', 'ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e'],
          });
          loopNative();
        } else {
          await loopZXing();
        }
      } catch (e) {
        setError((e as Error).message);
      }
    }

    function loopNative() {
      const tick = async () => {
        if (stopRef.current) return;
        const v = videoRef.current;
        const det = detectorRef.current;
        if (v && det && v.readyState >= 2) {
          try {
            const hits = await det.detect(v);
            if (hits[0]) {
              onDetected({ text: hits[0].rawValue, kind: mapFormat(hits[0].format) });
              if (!continuous) { stopRef.current = true; return; }
            }
          } catch { /* ignore frame errors */ }
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    }

    async function loopZXing() {
      const { BrowserMultiFormatReader } = await import('@zxing/browser');
      const reader = new BrowserMultiFormatReader();
      const v = videoRef.current;
      if (!v) return;
      try {
        const controls = await reader.decodeFromVideoElement(v, (result) => {
          if (!result) return;
          onDetected({ text: result.getText(), kind: 'unknown' });
          if (!continuous) { stopRef.current = true; controls.stop(); }
        });
        zxingStopRef.current = () => controls.stop();
      } catch (e) {
        setError((e as Error).message);
      }
    }

    void start();
    return () => {
      cancelled = true;
      stopRef.current = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      zxingStopRef.current?.();
      zxingStopRef.current = null;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [enabled, onDetected, continuous]);

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn } as MediaTrackConstraintSet] });
      setTorchOn((v) => !v);
    } catch { /* ignore */ }
  };

  return { videoRef, error, torchSupported, torchOn, toggleTorch };
}
