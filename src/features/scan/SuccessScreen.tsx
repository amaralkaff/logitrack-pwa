import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { Screen } from '@/ui/layout/Screen';
import { TopBar } from '@/ui/TopBar';
import { Btn } from '@/ui/Btn';
import { Field } from '@/ui/Field';
import { Icon } from '@/design/icons/Icon';
import { useTheme } from '@/design/theme';
import { RADIUS, TYPE } from '@/design/tokens';
import { useApp } from '@/app/store';
import { db } from '@/data/db';
import { txRepo } from '@/data/repos/transactions';
import { useGpsLocation } from '@/features/inventory/useGpsLocation';
import { MiniMap } from '@/features/inventory/MiniMap';
import { ImageWithLightbox } from '@/ui/ImageLightbox';

export default function SuccessScreen() {
  const t = useTheme();
  const nav = useNavigate();
  const operatorId = useApp((s) => s.operatorId);
  const storeDir = useApp((s) => s.scanDir);
  const source = useApp((s) => s.scanSource) ?? 'ocr';
  const detectedSku = useApp((s) => s.detectedSku);
  const detectedText = useApp((s) => s.detectedText);
  const aiResult = useApp((s) => s.aiResult);
  const clearDetected = useApp((s) => s.setDetected);
  const clearAi = useApp((s) => s.setAiResult);

  const item = useLiveQuery(
    async () => (detectedSku ? await db.items.get(detectedSku) : undefined),
    [detectedSku],
  );

  const cleanStr = (v: unknown): string => {
    if (typeof v !== 'string') return '';
    const s = v.trim();
    if (!s || /^(null|undefined|none|n\/a|-)$/i.test(s)) return '';
    return s;
  };
  const cleanQty = (v: unknown): number => {
    const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
    if (!Number.isFinite(n) || n <= 0) return 1;
    return Math.min(999, Math.max(1, Math.round(n)));
  };

  const [qty, setQty] = useState(() => cleanQty(aiResult?.qty));
  const [batch, setBatch] = useState(() => cleanStr(aiResult?.batch));
  const [dir, setDir] = useState<'in' | 'out'>(
    aiResult?.dir === 'in' || aiResult?.dir === 'out' ? aiResult.dir : storeDir,
  );
  const dirAutoDetected = aiResult?.dir === 'in' || aiResult?.dir === 'out';
  const [gpsLoc, setGpsLoc] = useState<string>('');
  const [gpsLat, setGpsLat] = useState<number | null>(null);
  const [gpsLng, setGpsLng] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const gps = useGpsLocation();

  useEffect(() => {
    (async () => {
      const fix = await gps.capture();
      if (fix) { setGpsLoc(fix.address); setGpsLat(fix.lat); setGpsLng(fix.lng); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const confirm = async () => {
    if (!operatorId || !item || busy) return;
    setBusy(true);
    try {
      await txRepo.create({
        sku: item.sku,
        qty: cleanQty(qty),
        dir,
        source,
        operatorId,
        location: cleanStr(gpsLoc) || cleanStr(item.loc) || 'UNASSIGNED',
        batch: cleanStr(batch) || undefined,
      });
      clearDetected(null, null);
      clearAi(null);
      nav('/home', { replace: true });
    } finally {
      setBusy(false);
    }
  };

  const dirLabel = dir === 'in' ? 'Incoming' : 'Outgoing';

  if (!item) return (
    <Screen>
      <TopBar title="Resolving…"/>
      <div style={{ padding: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>Looking up item…</div>
        <div style={{ fontSize: 12, color: t.textDim, marginTop: 8, fontFamily: TYPE.mono }}>
          {detectedText ?? '—'}
        </div>
      </div>
    </Screen>
  );

  return (
    <Screen>
      <TopBar title={`${dirLabel} · Confirm`}/>

      <div style={{
        flex: 1, minHeight: 0, overflow: 'auto',
        padding: '4px 16px 12px',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        {/* Detection hero */}
        <div style={{
          padding: 14, borderRadius: RADIUS.lg,
          background: t.surface, border: `1px solid ${t.divider}`,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 22,
            background: t.success + '22', border: `2px solid ${t.success}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Icon name="check" size={20} color={t.success} stroke={3}/>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: -0.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {item.name}
            </div>
            <div style={{ fontSize: 11, color: t.textMute, fontFamily: TYPE.mono, marginTop: 2 }}>
              {item.sku}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {(['in', 'out'] as const).map((d) => {
              const on = d === dir;
              const c = d === 'in' ? t.incoming : t.outgoing;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDir(d)}
                  style={{
                    padding: '6px 10px', borderRadius: 8,
                    background: on ? c + '22' : 'transparent',
                    color: on ? c : t.textMute,
                    border: `1px solid ${on ? c + '66' : t.divider}`,
                    fontSize: 10, fontWeight: 800, letterSpacing: 0.5,
                    display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer',
                  }}
                >
                  <Icon name={d === 'in' ? 'arrowDown' : 'arrowUp'} size={12} color={on ? c : t.textMute}/>
                  {d === 'in' ? 'IN' : 'OUT'}
                </button>
              );
            })}
          </div>
        </div>
        {dirAutoDetected && (
          <div style={{ fontSize: 11, color: t.accent[400], display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon name="bolt" size={12} color={t.accent[400]}/>
            Direction auto-detected from label
          </div>
        )}

        {aiResult?.imageDataUrl && (
          <ImageWithLightbox
            src={aiResult.imageDataUrl}
            alt="Captured"
            style={{
              width: '100%', maxHeight: 180, objectFit: 'cover',
              borderRadius: RADIUS.md, border: `1px solid ${t.divider}`,
              display: 'block',
            }}
          />
        )}

        <Field
          label="Quantity"
          value={String(qty)}
          editable
          onChange={(v) => setQty(cleanQty(v))}
          type="number"
          mono
          suffix={
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                type="button"
                onClick={() => setQty((n) => Math.max(1, n - 1))}
                style={{ width: 28, height: 28, borderRadius: 6, background: t.surface3, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              ><Icon name="minus" size={14} color={t.text}/></button>
              <button
                type="button"
                onClick={() => setQty((n) => Math.min(999, n + 1))}
                style={{ width: 28, height: 28, borderRadius: 6, background: t.surface3, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              ><Icon name="plus" size={14} color={t.text}/></button>
            </div>
          }
        />
        <Field label="Unit" value={item.unit} />
        <Field
          label="Location (GPS)"
          value={gps.loading ? 'Getting GPS…' : (gpsLoc || item.loc)}
          suffix={<Icon name="mapPin" size={16} color={gpsLoc ? t.accent[400] : t.textDim}/>}
        />
        {gpsLat != null && gpsLng != null && (
          <MiniMap lat={gpsLat} lng={gpsLng} height={140} label={gpsLoc}/>
        )}
        <Field
          label="Batch / Lot"
          value={batch}
          editable
          onChange={(v) => setBatch(cleanStr(v))}
          placeholder="Optional"
        />
        <Field label="Source" value={source.toUpperCase()}/>
        <Field label="Operator" value={operatorId ?? ''} mono/>

        {aiResult && (
          <div style={{
            padding: '10px 12px', borderRadius: RADIUS.md,
            background: t.accent[500] + '14', border: `1px solid ${t.accent[500]}44`,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <Icon name="bolt" size={14} color={t.accent[400]}/>
            <div style={{ flex: 1, fontSize: 12, color: t.textDim }}>
              Gemini ·{' '}
              <b style={{
                color: aiResult.confidence >= 0.8 ? t.success
                  : aiResult.confidence >= 0.55 ? t.warning : t.danger,
              }}>
                {(aiResult.confidence * 100).toFixed(0)}% confidence
              </b>
            </div>
          </div>
        )}
      </div>

      {/* Sticky bottom action bar */}
      <div style={{
        flexShrink: 0, padding: '10px 16px calc(12px + env(safe-area-inset-bottom))',
        background: t.bg, borderTop: `1px solid ${t.divider}`,
        display: 'flex', gap: 10,
      }}>
        <Btn kind="ghost" size="lg" onClick={() => nav(-1)} style={{ flex: 1 }}>Cancel</Btn>
        <Btn kind="primary" size="lg" icon="check" onClick={confirm} style={{ flex: 2 }}>
          {busy ? 'Logging…' : `Log ${dirLabel}`}
        </Btn>
      </div>
    </Screen>
  );
}
