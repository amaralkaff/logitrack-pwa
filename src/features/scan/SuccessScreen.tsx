import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { Screen } from '@/ui/layout/Screen';
import { Btn } from '@/ui/Btn';
import { Field } from '@/ui/Field';
import { Icon } from '@/design/icons/Icon';
import { useTheme } from '@/design/theme';
import { RADIUS, TYPE } from '@/design/tokens';
import { useApp } from '@/app/store';
import { db } from '@/data/db';
import { txRepo } from '@/data/repos/transactions';

export default function SuccessScreen() {
  const t = useTheme();
  const nav = useNavigate();
  const operatorId = useApp((s) => s.operatorId);
  const dir = useApp((s) => s.scanDir);
  const source = useApp((s) => s.scanSource) ?? 'qr';
  const detectedSku = useApp((s) => s.detectedSku);
  const detectedText = useApp((s) => s.detectedText);
  const clearDetected = useApp((s) => s.setDetected);

  const item = useLiveQuery(() => detectedSku ? db.items.get(detectedSku) : Promise.resolve(undefined), [detectedSku]);
  const [qty, setQty] = useState(1);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => setElapsed(Date.now() - start), 100);
    return () => clearInterval(id);
  }, []);

  const confirm = async () => {
    if (!operatorId || !item) return;
    await txRepo.create({
      sku: item.sku,
      qty,
      dir,
      source,
      operatorId,
      location: item.loc,
    });
    clearDetected(null, null);
    nav('/home', { replace: true });
  };

  if (!item) return (
    <Screen>
      <div style={{ padding: 24 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Resolving…</div>
        <div style={{ fontSize: 12, color: t.textDim, marginTop: 8, fontFamily: TYPE.mono }}>
          {detectedText}
        </div>
      </div>
    </Screen>
  );

  return (
    <Screen>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '8px 20px 0' }}>
        <div style={{ padding: '28px 0 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 84, height: 84, borderRadius: 42,
            background: t.success + '22', border: `2px solid ${t.success}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="check" size={40} color={t.success} stroke={3}/>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: t.success, letterSpacing: 1 }}>DETECTED</div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.4, marginTop: 4 }}>{item.name}</div>
            <div style={{ fontSize: 12, color: t.textDim, marginTop: 4, fontFamily: TYPE.mono }}>
              {item.sku}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field
              label="Quantity"
              value={String(qty)}
              mono
              suffix={
                <div style={{ display: 'flex', gap: 4 }}>
                  <div
                    onClick={() => setQty((n) => Math.max(1, n - 1))}
                    style={{ width: 28, height: 28, borderRadius: 6, background: t.surface3, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <Icon name="minus" size={14} color={t.text}/>
                  </div>
                  <div
                    onClick={() => setQty((n) => n + 1)}
                    style={{ width: 28, height: 28, borderRadius: 6, background: t.surface3, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <Icon name="plus" size={14} color={t.text}/>
                  </div>
                </div>
              }
            />
            <Field label="Unit" value={item.unit}/>
          </div>
          <Field label="Location" value={`${item.loc}${item.zone ? ` · Zone ${item.zone}` : ''}`} suffix={<Icon name="mapPin" size={16} color={t.textDim}/>}/>
          <Field label="Condition" value="Good" suffix={<Icon name="chevron" size={16} color={t.textDim}/>}/>
        </div>

        <div style={{
          marginTop: 14, padding: 10, borderRadius: RADIUS.md,
          background: t.accent[500] + '14', border: `1px solid ${t.accent[500]}44`,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <Icon name="bolt" size={16} color={t.accent[400]}/>
          <div style={{ flex: 1, fontSize: 12, color: t.textDim }}>
            <b style={{ color: t.text }}>Auto-filled</b> from {source.toUpperCase()}. Tap any field to edit.
          </div>
          <div style={{ fontSize: 11, color: t.textMute, fontVariantNumeric: 'tabular-nums' }}>
            {(elapsed / 1000).toFixed(1)}s
          </div>
        </div>

        <div style={{ flex: 1 }}/>

        <div style={{ display: 'flex', gap: 10, padding: '12px 0' }}>
          <Btn kind="ghost" size="lg" style={{ flex: 1 }} onClick={() => nav('/scan/manual')}>Edit</Btn>
          <Btn kind="primary" size="lg" icon="check" style={{ flex: 2 }} onClick={confirm}>
            Confirm · Log {dir}
          </Btn>
        </div>
      </div>
    </Screen>
  );
}
