import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router';
import { StatusBar } from '@/ui/layout/Screen';
import { Icon } from '@/design/icons/Icon';
import { useTheme } from '@/design/theme';
import { RADIUS } from '@/design/tokens';
import { useApp } from '@/app/store';
import { useBarcodeScanner, type ScanResult } from './useBarcodeScanner';
import { itemsRepo } from '@/data/repos/items';

type Mode = 'qr' | 'ocr';

export default function ViewfinderScreen({ mode }: { mode: Mode }) {
  const t = useTheme();
  const nav = useNavigate();
  const setDetected = useApp((s) => s.setDetected);
  const setScanSource = useApp((s) => s.setScanSource);
  const [m, setM] = useState<Mode>(mode);

  const onDetected = useCallback(async (r: ScanResult) => {
    // Best-effort SKU resolve: treat raw text as either SKU, EAN, or QR payload.
    const raw = r.text.trim();
    const bySku = await itemsRepo.get(raw);
    const all = await itemsRepo.list();
    const byEan = all.find((i) => i.ean === raw);
    const hit = bySku ?? byEan;
    setDetected(raw, hit?.sku ?? null);
    setScanSource(m === 'qr' ? 'qr' : 'ocr');
    if (hit) nav('/scan/success');
    else nav('/scan/error');
  }, [m, nav, setDetected, setScanSource]);

  const { videoRef, torchSupported, torchOn, toggleTorch, error } = useBarcodeScanner({
    enabled: m === 'qr',
    onDetected,
  });

  // OCR not implemented in v1 — show notice, let user switch or capture as stub.
  const captureOcr = () => {
    // stub: "detected" marker
    setDetected('OCR-STUB', null);
    nav('/scan/error');
  };

  const switchMode = (id: 'qr' | 'ocr' | 'manual') => {
    if (id === 'manual') nav('/scan/manual');
    else setM(id);
  };

  return (
    <div
      style={{
        flex: 1, minHeight: 0, background: '#000', color: '#fff',
        position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {m === 'qr' ? (
        <video
          ref={videoRef}
          muted
          autoPlay
          playsInline
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover',
          }}
        />
      ) : (
        <div style={{
          position: 'absolute', inset: 0,
          background: `
            radial-gradient(at 30% 40%, #1b2430 0%, #050709 70%),
            repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0 40px, transparent 40px 80px)`,
        }}>
          <div style={{
            position: 'absolute', top: '40%', left: '50%',
            transform: 'translate(-50%,-50%)',
            color: '#d9d9d9', fontFamily: 'JetBrains Mono, monospace', fontSize: 14, lineHeight: 1.6, textAlign: 'center',
          }}>
            OCR preview (not wired)<br/>
            Use QR or Manual
          </div>
        </div>
      )}

      {/* dim vignette with cutout */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(220px 160px at 50% 46%, transparent 70%, rgba(0,0,0,0.75) 100%)`,
        pointerEvents: 'none',
      }}/>

      {/* top chrome */}
      <div style={{ position: 'relative', padding: '12px 12px 0', zIndex: 2 }}>
        <StatusBar tint="#fff"/>
      </div>
      <div style={{ position: 'relative', padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 4, zIndex: 2 }}>
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
          {m === 'qr' ? 'Scan QR / Barcode' : 'OCR Text Scan'}
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
        <div style={{ position: 'relative', width: 240, height: 160, marginTop: -40 }}>
          {(['tl', 'tr', 'bl', 'br'] as const).map((c) => {
            const s: React.CSSProperties = { position: 'absolute', width: 28, height: 28, borderColor: t.accent[400], borderStyle: 'solid', borderWidth: 0 };
            if (c === 'tl') Object.assign(s, { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 4 });
            if (c === 'tr') Object.assign(s, { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 4 });
            if (c === 'bl') Object.assign(s, { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 4 });
            if (c === 'br') Object.assign(s, { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 4 });
            return <div key={c} style={s}/>;
          })}
          <div style={{
            position: 'absolute', left: 0, right: 0, top: '50%', height: 2,
            background: `linear-gradient(90deg, transparent, ${t.accent[400]}, transparent)`,
            boxShadow: `0 0 12px ${t.accent[400]}`,
            animation: 'lt-scan-line 2s ease-in-out infinite',
          }}/>
        </div>
      </div>

      {error && (
        <div style={{
          position: 'absolute', top: '58%', left: 20, right: 20, textAlign: 'center',
          color: t.danger, fontSize: 13, zIndex: 2,
        }}>
          Camera error: {error}
        </div>
      )}

      <div style={{
        position: 'absolute', top: '62%', left: 0, right: 0, textAlign: 'center', zIndex: 2,
      }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>Hold steady</div>
        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
          Center the {m === 'qr' ? 'code' : 'label'} in the frame
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
          {([
            { id: 'qr', label: 'QR', icon: 'qr' as const },
            { id: 'ocr', label: 'OCR', icon: 'camera' as const },
            { id: 'manual', label: 'Manual', icon: 'keyboard' as const },
          ] as const).map((item) => {
            const on = item.id === m;
            return (
              <div
                key={item.id}
                onClick={() => switchMode(item.id)}
                style={{
                  flex: 1, padding: '9px 10px', borderRadius: RADIUS.pill,
                  background: on ? t.accent[500] : 'transparent', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  fontSize: 12, fontWeight: 700, letterSpacing: 0.4, cursor: 'pointer',
                }}
              >
                <Icon name={item.icon} size={14} color="#fff"/>
                {item.label}
              </div>
            );
          })}
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
            onClick={m === 'ocr' ? captureOcr : undefined}
            style={{
              width: 72, height: 72, borderRadius: 36, border: `4px solid rgba(255,255,255,0.9)`,
              background: m === 'ocr' ? '#fff' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: m === 'ocr' ? 'pointer' : 'default',
            }}
          >
            {m === 'ocr' && <div style={{ width: 54, height: 54, borderRadius: 27, background: '#fff' }}/>}
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

      <style>{`@keyframes lt-scan-line { 0%,100% { transform: translateY(-60px); } 50% { transform: translateY(60px); } }`}</style>
    </div>
  );
}
