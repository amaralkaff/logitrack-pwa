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
    if (!skuGuess) {
      setDetected(rawText || null, null);
      nav('/scan/error');
      return;
    }
    const bySku = await itemsRepo.get(skuGuess);
    const all = await itemsRepo.list();
    const byEan = all.find((i) => i.ean === skuGuess);
    const hit = bySku ?? byEan;
    setDetected(rawText, hit?.sku ?? null);
    if (hit) nav('/scan/success');
    else nav('/scan/error');
  }, [nav, setDetected, setScanSource]);

  const { videoRef, ready, recognizing, error, torchSupported, torchOn, toggleTorch, capture } = useOcr({
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
          OCR Text Scan
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
            const s: React.CSSProperties = { position: 'absolute', width: 28, height: 28, borderColor: t.accent[400], borderStyle: 'solid', borderWidth: 0 };
            if (c === 'tl') Object.assign(s, { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 4 });
            if (c === 'tr') Object.assign(s, { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 4 });
            if (c === 'bl') Object.assign(s, { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 4 });
            if (c === 'br') Object.assign(s, { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 4 });
            return <div key={c} style={s}/>;
          })}
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
          {ready ? 'Center the label' : 'Loading OCR engine…'}
        </div>
        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
          {ready ? 'Tap the shutter when text is readable' : 'One-time download, cached afterwards'}
        </div>
      </div>

      {/* bottom controls */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 2,
        padding: '16px 20px 24px', background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
      }}>
        <div style={{
          display: 'flex', gap: 8, padding: 4, background: 'rgba(0,0,0,0.5)',
          borderRadius: RADIUS.pill, marginBottom: 14, backdropFilter: 'blur(10px)',
        }}>
          <div style={{
            flex: 1, padding: '9px 10px', borderRadius: RADIUS.pill,
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
              flex: 1, padding: '9px 10px', borderRadius: RADIUS.pill,
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
            onClick={capture}
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

      <style>{`@keyframes lt-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
