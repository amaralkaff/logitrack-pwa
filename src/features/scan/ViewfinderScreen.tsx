import { useCallback, useState } from 'react';
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
  const [preview, setPreview] = useState<VisionResult | null>(null);

  const onResult = useCallback(async (r: VisionResult) => {
    setScanSource('ocr');
    setAiResult(r);
    setDetected(r.raw_text ?? null, r.sku ?? null);
    setPreview(r);
  }, [setAiResult, setDetected, setScanSource]);

  const { videoRef, ready, recognizing, error, torchSupported, torchOn, toggleTorch, captureNow } = useAiVision({
    enabled: true,
    onResult,
  });

  const confirm = async () => {
    if (!preview) return;
    const sku = preview.sku?.trim();
    if (sku) {
      const local = await itemsRepo.get(sku);
      const all = await itemsRepo.list();
      const byEan = preview.ean ? all.find((i) => i.ean === preview.ean) : undefined;
      const hit = local ?? byEan;
      if (hit) {
        setDetected(preview.raw_text ?? null, hit.sku);
        nav('/scan/success');
        return;
      }
    }
    // Unknown — route to /inv/new pre-filled.
    const q = new URLSearchParams();
    if (preview.sku)      q.set('sku', preview.sku);
    if (preview.name)     q.set('name', preview.name);
    if (preview.ean)      q.set('ean', preview.ean);
    if (preview.unit)     q.set('unit', preview.unit);
    if (preview.location) q.set('loc', preview.location);
    if (preview.qty)      q.set('stock', String(preview.qty));
    nav(`/inv/new?${q.toString()}`);
  };

  const retry = () => setPreview(null);

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
          AI Vision · Gemini 2.0
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

      {/* recognizing pulse bar across the top */}
      {ready && !preview && recognizing && (
        <div style={{
          position: 'absolute', left: 0, right: 0, top: 52, height: 2, zIndex: 2,
          background: `linear-gradient(90deg, transparent, ${t.accent[400]}, transparent)`,
          boxShadow: `0 0 10px ${t.accent[400]}`,
          animation: 'lt-scan-sweep-h 1.2s linear infinite',
        }}/>
      )}

      {error && !preview && (
        <div style={{
          position: 'absolute', top: '58%', left: 20, right: 20, textAlign: 'center',
          color: t.danger, fontSize: 12, zIndex: 2, padding: 8, background: 'rgba(0,0,0,0.6)', borderRadius: 8,
        }}>
          {error}
        </div>
      )}

      {!preview && (
        <div style={{
          position: 'absolute', top: '62%', left: 0, right: 0, textAlign: 'center', zIndex: 2,
        }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>
            {!ready ? 'Opening camera…' : recognizing ? 'Analyzing…' : 'Point at label'}
          </div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
            Auto-capture every 2s · or tap shutter
          </div>
        </div>
      )}

      {/* Preview card — shown once we have a result */}
      {preview && (
        <PreviewOverlay preview={preview} onConfirm={confirm} onRetry={retry} accent={t.accent} success={t.success} warning={t.warning} danger={t.danger}/>
      )}

      {/* bottom controls */}
      {!preview && (
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
            <button
              onClick={toggleTorch}
              disabled={!torchSupported}
              style={{
                width: 44, height: 44, borderRadius: 22, background: 'rgba(255,255,255,0.12)',
                border: 'none', opacity: torchSupported ? 1 : 0.3,
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}
            >
              <Icon name="bolt" color="#fff" size={18}/>
            </button>
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
            <button
              onClick={() => nav('/scan/manual')}
              style={{
                width: 44, height: 44, borderRadius: 22, background: 'rgba(255,255,255,0.12)',
                border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}
            >
              <Icon name="keyboard" color="#fff" size={18}/>
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes lt-scan-sweep-h { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        @keyframes lt-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

interface Accent { 500: string; 400: string }

function PreviewOverlay({ preview, onConfirm, onRetry, accent, success, warning, danger }: {
  preview: VisionResult;
  onConfirm: () => void;
  onRetry: () => void;
  accent: Accent;
  success: string;
  warning: string;
  danger: string;
}) {
  const conf = preview.confidence ?? 0;
  const confColor = conf >= 0.8 ? success : conf >= 0.55 ? warning : danger;
  const rows: Array<[string, string | number | null | undefined]> = [
    ['SKU', preview.sku],
    ['Name', preview.name],
    ['Quantity', preview.qty],
    ['Unit', preview.unit],
    ['Location', preview.location],
    ['EAN', preview.ean],
    ['Batch', preview.batch],
  ];
  return (
    <div style={{
      position: 'absolute', left: 16, right: 16, bottom: 24, zIndex: 3,
      background: 'rgba(13,18,24,0.96)', borderRadius: RADIUS.lg,
      border: `1px solid rgba(255,255,255,0.1)`,
      padding: 18, color: '#fff',
      boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ width: 10, height: 10, borderRadius: 5, background: confColor, boxShadow: `0 0 8px ${confColor}` }}/>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: '#a7b0bd' }}>
          GEMINI · CONFIDENCE {(conf * 100).toFixed(0)}%
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', rowGap: 6, columnGap: 8, fontSize: 13 }}>
        {rows.map(([label, val]) => (
          <>
            <div key={`${label}-l`} style={{ color: '#a7b0bd', fontSize: 11, letterSpacing: 0.4, textTransform: 'uppercase', alignSelf: 'center' }}>
              {label}
            </div>
            <div key={`${label}-v`} style={{ fontWeight: 600, fontFamily: label === 'SKU' || label === 'EAN' ? 'JetBrains Mono, monospace' : undefined }}>
              {val ?? <span style={{ color: '#6c7685' }}>—</span>}
            </div>
          </>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <button
          onClick={onRetry}
          style={{
            flex: 1, height: 46, borderRadius: RADIUS.md, border: `1px solid rgba(255,255,255,0.15)`,
            background: 'transparent', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
          }}
        >
          Retry
        </button>
        <button
          onClick={onConfirm}
          style={{
            flex: 2, height: 46, borderRadius: RADIUS.md, border: 'none',
            background: accent[500], color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          <Icon name="check" size={16} color="#fff" stroke={2.4}/>
          {preview.sku ? 'Use this' : 'Create new'}
        </button>
      </div>
    </div>
  );
}
