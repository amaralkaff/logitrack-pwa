import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Icon } from '@/design/icons/Icon';
import { useTheme } from '@/design/theme';
import { RADIUS } from '@/design/tokens';
import { useApp } from '@/app/store';
import { useAiVision, type VisionResult } from './useAiVision';
import { itemsRepo } from '@/data/repos/items';

export default function ViewfinderScreen() {
  const t = useTheme();
  const nav = useNavigate();
  const setDetected = useApp((s) => s.setDetected);
  const setAiResult = useApp((s) => s.setAiResult);
  const setScanSource = useApp((s) => s.setScanSource);

  const onResult = useCallback(async (r: VisionResult) => {
    setScanSource('ocr');
    setAiResult(r);
    setDetected(r.raw_text ?? null, r.sku ?? null);

    const sku = r.sku?.trim();
    let hit = sku ? await itemsRepo.resolve(sku) : undefined;
    if (!hit && r.ean) hit = await itemsRepo.resolveByEan(r.ean);
    if (hit) {
      setDetected(r.raw_text ?? null, hit.sku);
      nav('/scan/success');
    } else {
      nav('/scan/error');
    }
  }, [nav, setAiResult, setDetected, setScanSource]);

  const { videoRef, ready, recognizing, error, torchSupported, torchOn, toggleTorch, captureNow } = useAiVision({
    enabled: true,
    onResult,
  });

  return (
    <div
      style={{
        flex: 1, minHeight: 0, background: '#000', color: '#fff',
        position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}
    >
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
          onClick={() => nav(-1)}
          style={{
            width: 40, height: 40, borderRadius: 20, background: 'rgba(0,0,0,0.5)',
            border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}
        >
          <Icon name="x" color="#fff" size={20}/>
        </button>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 700, letterSpacing: 0.3 }}>
          AI Vision
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
          color: t.danger, fontSize: 12, zIndex: 2, padding: 8, background: 'rgba(0,0,0,0.6)', borderRadius: 8,
        }}>
          {error}
        </div>
      )}

      <div style={{
        position: 'absolute', top: '62%', left: 0, right: 0, textAlign: 'center', zIndex: 2,
      }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>
          {!ready ? 'Opening camera…' : recognizing ? 'Reading label…' : 'Point at label'}
        </div>
        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
          {!ready ? 'Waiting for camera' : 'Tap the shutter when the label is centered'}
        </div>
      </div>

      {/* bottom — optional manual shutter */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 2,
        padding: '16px 20px 24px', background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
      }}>
        <div style={{
          display: 'flex', gap: 8, padding: 4, background: 'rgba(0,0,0,0.5)',
          borderRadius: RADIUS.pill, marginBottom: 14, backdropFilter: 'blur(10px)',
        }}>
          <div style={{
            flex: 1, padding: '10px 10px', borderRadius: RADIUS.pill,
            background: t.accent[500], color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            fontSize: 12, fontWeight: 700, letterSpacing: 0.4,
          }}>
            <Icon name="bolt" size={14} color="#fff"/>
            AI
          </div>
          <div
            onClick={() => nav('/scan/manual')}
            style={{
              flex: 1, padding: '10px 10px', borderRadius: RADIUS.pill,
              color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              fontSize: 12, fontWeight: 700, letterSpacing: 0.4, cursor: 'pointer',
            }}
          >
            <Icon name="keyboard" size={14} color="#fff"/>
            Manual
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
          <button
            onClick={captureNow}
            disabled={!ready || recognizing}
            aria-label="Force capture"
            style={{
              width: 64, height: 64, borderRadius: 32, border: `3px solid rgba(255,255,255,0.85)`,
              background: ready && !recognizing ? '#fff' : 'rgba(255,255,255,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: ready && !recognizing ? 'pointer' : 'default',
            }}
          >
            {recognizing ? (
              <div style={{ width: 22, height: 22, borderRadius: 11, border: `3px solid ${t.accent[500]}`, borderTopColor: 'transparent', animation: 'lt-spin 0.8s linear infinite' }}/>
            ) : (
              <div style={{ width: 48, height: 48, borderRadius: 24, background: '#fff' }}/>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes lt-scan-sweep-h { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        @keyframes lt-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
