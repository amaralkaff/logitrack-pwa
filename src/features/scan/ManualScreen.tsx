import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { Screen } from '@/ui/layout/Screen';
import { TopBar } from '@/ui/TopBar';
import { Field } from '@/ui/Field';
import { Chip } from '@/ui/Chip';
import { Icon } from '@/design/icons/Icon';
import { useTheme } from '@/design/theme';
import { RADIUS, TYPE } from '@/design/tokens';
import { useApp } from '@/app/store';
import { itemsRepo } from '@/data/repos/items';

export default function ManualScreen() {
  const t = useTheme();
  const nav = useNavigate();
  const dir = useApp((s) => s.scanDir);
  const setDetected = useApp((s) => s.setDetected);
  const setScanSource = useApp((s) => s.setScanSource);
  const [q, setQ] = useState('');
  const hits = useLiveQuery(() => itemsRepo.search(q), [q], []) ?? [];
  const qLower = useMemo(() => q.trim().toLowerCase(), [q]);

  const select = (sku: string) => {
    setDetected(sku, sku);
    setScanSource('manual');
    nav('/scan/success');
  };

  return (
    <Screen>
      <TopBar title="Manual entry" subtitle={dir === 'in' ? 'Incoming' : 'Outgoing'}/>
      <div style={{ padding: '0 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Field
          label="SKU or name"
          value={q}
          editable
          autoFocus
          onChange={setQ}
          focused
          suffix={
            <div style={{ display: 'flex', gap: 4 }}>
              <Icon name="qr" size={18} color={t.accent[400]}/>
              <Icon name="mic" size={18} color={t.textDim}/>
            </div>
          }
        />

        {hits.length > 0 && (
          <div style={{ background: t.surface, border: `1px solid ${t.divider}`, borderRadius: RADIUS.md, overflow: 'hidden' }}>
            {hits.map((s, i) => (
              <div
                key={s.sku}
                onClick={() => select(s.sku)}
                style={{
                  padding: 12, display: 'flex', alignItems: 'center', gap: 10,
                  borderTop: i ? `1px solid ${t.divider}` : 'none',
                  background: i === 0 ? t.surface2 : 'transparent',
                  cursor: 'pointer',
                }}
              >
                <Icon name="box" size={16} color={t.textDim}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {highlight(s.name, qLower, t.accent[500] + '44', t.text)}
                  </div>
                  <div style={{ fontSize: 11, fontFamily: TYPE.mono, color: t.textMute, marginTop: 2 }}>{s.sku}</div>
                </div>
                <div style={{ fontSize: 12, color: t.textDim }}>{s.stock} in stock</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <Chip active icon="history">Recent</Chip>
          <Chip>Zone B</Chip>
          <Chip>Low stock</Chip>
        </div>

        <div style={{ flex: 1 }}/>
      </div>
    </Screen>
  );
}

function highlight(text: string, q: string, bg: string, fg: string) {
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q);
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span style={{ background: bg, color: fg, padding: '0 2px', borderRadius: 2 }}>{text.slice(idx, idx + q.length)}</span>
      {text.slice(idx + q.length)}
    </>
  );
}
