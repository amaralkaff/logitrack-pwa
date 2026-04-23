import { useCallback } from 'react';
import { useAiVision, type VisionResult } from './useAiVision';
import { Icon } from '@/design/icons/Icon';
import { useTheme } from '@/design/theme';
import { RADIUS } from '@/design/tokens';

interface Props {
  open: boolean;
  onClose: () => void;
  onResult: (r: VisionResult) => void;
}

/** Fullscreen camera sheet for form auto-fill. Manual shutter only. */
export function ScanToFillSheet({ open, onClose, onResult }: Props) {
  const t = useTheme();

  const handle = useCallback((r: VisionResult) => {
    onResult(r);
    onClose();
  }, [onResult, onClose]);

  const { videoRef, ready, recognizing, error, torchSupported, torchOn, toggleTorch, captureNow } = useAiVision({
    enabled: open,
    onResult: handle,
  });

  if (!open) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: '#000', color: '#fff', display: 'flex', flexDirection: 'column',
    }}>
      <video
        ref={videoRef}
        muted
        autoPlay
        playsInline
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
      />

      {ready && recognizing && (
        <div style={{
          position: 'absolute', left: 0, right: 0, top: 52, height: 2, zIndex: 2,
          background: `linear-gradient(90deg, transparent, ${t.accent[400]}, transparent)`,
          boxShadow: `0 0 10px ${t.accent[400]}`,
          animation: 'lt-scan-sweep-h 1.2s linear infinite',
        }}/>
      )}

      {/* top chrome */}
      <div style={{ position: 'relative', padding: '12px 12px 4px', display: 'flex', alignItems: 'center', gap: 4, zIndex: 2 }}>
        <button
          onClick={onClose}
          style={{
            width: 40, height: 40, borderRadius: 20, background: 'rgba(0,0,0,0.5)',
            border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}
        >
          <Icon name="x" color="#fff" size={20}/>
        </button>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 700, letterSpacing: 0.3 }}>
          Scan to fill form
        </div>
        {torchSupported && (
          <button
            onClick={toggleTorch}
            style={{
              width: 40, height: 40, borderRadius: 20,
              background: torchOn ? t.accent[500] : 'rgba(0,0,0,0.5)',
              border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}
          >
            <Icon name={torchOn ? 'flash' : 'flashOff'} color="#fff" size={18}/>
          </button>
        )}
      </div>

      {error && (
        <div style={{
          position: 'absolute', top: '58%', left: 20, right: 20, textAlign: 'center',
          color: t.danger, fontSize: 13, zIndex: 2, padding: 8, background: 'rgba(0,0,0,0.6)', borderRadius: 8,
        }}>
          {error}
        </div>
      )}

      <div style={{
        position: 'absolute', top: '62%', left: 0, right: 0, textAlign: 'center', zIndex: 2,
      }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>
          {!ready ? 'Opening camera…' : recognizing ? 'Analyzing…' : 'Point at label'}
        </div>
        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
          Tap shutter to capture
        </div>
      </div>

      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 2,
        padding: '16px 20px calc(24px + env(safe-area-inset-bottom))',
        background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14,
      }}>
        <button
          onClick={captureNow}
          disabled={!ready || recognizing}
          style={{
            width: 72, height: 72, borderRadius: 36, border: `4px solid rgba(255,255,255,0.9)`,
            background: ready && !recognizing ? '#fff' : 'rgba(255,255,255,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: ready && !recognizing ? 'pointer' : 'default',
          }}
        >
          {recognizing ? (
            <div style={{ width: 24, height: 24, borderRadius: 12, border: `3px solid ${t.accent[500]}`, borderTopColor: 'transparent', animation: 'lt-spin 0.8s linear infinite' }}/>
          ) : (
            <div style={{ width: 54, height: 54, borderRadius: 27, background: '#fff' }}/>
          )}
        </button>
      </div>
      <style>{`
        @keyframes lt-scan-sweep-h { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        @keyframes lt-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export { type VisionResult };
