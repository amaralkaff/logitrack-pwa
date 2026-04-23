import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Icon } from '@/design/icons/Icon';
import { useTheme } from '@/design/theme';
import { RADIUS } from '@/design/tokens';
import { useApp } from '@/app/store';
import { useOcr } from './useOcr';
import { itemsRepo } from '@/data/repos/items';

export default function ViewfinderScreen() {
  const t = useTheme();
  const nav = useNavigate();
  const setDetected = useApp((s) => s.setDetected);
  const setScanSource = useApp((s) => s.setScanSource);

  const onRecognized = useCallback(async (rawText: string, skuGuess: string | null) => {
    setScanSource('ocr');
    if (!skuGuess) return; // loop keeps scanning until extractSku hits
    const bySku = await itemsRepo.get(skuGuess);
    const all = await itemsRepo.list();
    const byEan = all.find((i) => i.ean === skuGuess);
    const hit = bySku ?? byEan;
    setDetected(rawText, hit?.sku ?? null);
    if (hit) nav('/scan/success');
    else nav('/scan/error');
  }, [nav, setDetected, setScanSource]);

  const { videoRef, ready, recognizing, error, torchSupported, torchOn, toggleTorch } = useOcr({
    enabled: true,
    onRecognized,
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

      {/* dim vignette with cutout */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(260px 170px at 50% 46%, transparent 70%, rgba(0,0,0,0.75) 100%)`,
        pointerEvents: 'none',
      }}/>

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
          Auto OCR
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

      {/* reticle */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
        <div style={{ position: 'relative', width: 280, height: 170, marginTop: -40 }}>
          {(['tl', 'tr', 'bl', 'br'] as const).map((c) => {
            const s: React.CSSProperties = {
              position: 'absolute', width: 28, height: 28,
              borderColor: recognizing ? t.success : t.accent[400],
              borderStyle: 'solid', borderWidth: 0,
              transition: 'border-color 140ms ease',
            };
            if (c === 'tl') Object.assign(s, { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 4 });
            if (c === 'tr') Object.assign(s, { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 4 });
            if (c === 'bl') Object.assign(s, { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 4 });
            if (c === 'br') Object.assign(s, { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 4 });
            return <div key={c} style={s}/>;
          })}
          {/* active scanning sweep */}
          {ready && (
            <div style={{
              position: 'absolute', left: 0, right: 0, top: '50%', height: 2,
              background: `linear-gradient(90deg, transparent, ${t.accent[400]}, transparent)`,
              boxShadow: `0 0 12px ${t.accent[400]}`,
              animation: 'lt-scan-sweep 1.6s ease-in-out infinite',
            }}/>
          )}
        </div>
      </div>

      {error && (
        <div style={{
          position: 'absolute', top: '58%', left: 20, right: 20, textAlign: 'center',
          color: t.danger, fontSize: 13, zIndex: 2,
        }}>
          {error}
        </div>
      )}

      <div style={{
        position: 'absolute', top: '62%', left: 0, right: 0, textAlign: 'center', zIndex: 2,
      }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>
          {!ready ? 'Loading OCR engine…' : recognizing ? 'Reading…' : 'Hold steady'}
        </div>
        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
          {!ready ? 'One-time download, cached afterwards' : 'Centers on SKU / NSN · auto-captures'}
        </div>
      </div>

      {/* bottom controls — mode switch only, no shutter */}
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
            <Icon name="camera" size={14} color="#fff"/>
            OCR
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

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          fontSize: 12, color: '#e5e7eb',
        }}>
          <div style={{
            width: 10, height: 10, borderRadius: 5,
            background: recognizing ? t.success : ready ? t.accent[400] : t.textMute,
            boxShadow: recognizing ? `0 0 10px ${t.success}` : 'none',
            animation: ready && !recognizing ? 'lt-pulse 1.6s ease-in-out infinite' : 'none',
          }}/>
          {!ready ? 'Warming up' : recognizing ? 'Analyzing frame' : 'Auto-scanning'}
        </div>
      </div>

      <style>{`
        @keyframes lt-scan-sweep { 0%,100% { transform: translateY(-60px); } 50% { transform: translateY(60px); } }
        @keyframes lt-pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
      `}</style>
    </div>
  );
}
