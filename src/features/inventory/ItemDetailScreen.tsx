import { useNavigate, useParams } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { Screen } from '@/ui/layout/Screen';
import { TopBar, btnIcon } from '@/ui/TopBar';
import { Btn } from '@/ui/Btn';
import { Badge } from '@/ui/Badge';
import { Placeholder } from '@/ui/Placeholder';
import { Icon } from '@/design/icons/Icon';
import { useTheme } from '@/design/theme';
import { RADIUS, TYPE } from '@/design/tokens';
import { db } from '@/data/db';
import { useApp } from '@/app/store';

export default function ItemDetailScreen() {
  const t = useTheme();
  const nav = useNavigate();
  const { sku = '' } = useParams();
  const setScanDir = useApp((s) => s.setScanDir);

  const item = useLiveQuery(() => db.items.get(sku), [sku]);
  const history = useLiveQuery(
    () => db.transactions.where('sku').equals(sku).reverse().limit(8).sortBy('createdAt'),
    [sku], [],
  ) ?? [];

  if (!item) return (
    <Screen>
      <TopBar title="Item"/>
      <div style={{ padding: 24, color: t.textDim }}>Not found.</div>
    </Screen>
  );

  const low = item.stock <= item.reorderAt;

  return (
    <Screen>
      <TopBar
        title="Item"
        trailing={
          <button style={btnIcon()} onClick={() => nav(`/inv/${encodeURIComponent(sku)}/edit`)} aria-label="Edit item">
            <Icon name="edit" color={t.text} size={20}/>
          </button>
        }
      />
      <div style={{ flex: 1, overflow: 'auto', padding: '0 20px' }}>
        <Placeholder label="PRODUCT IMAGE" h={132}/>
        <div style={{ padding: '16px 0 12px' }}>
          <Badge color={low ? t.warning : t.incoming}>{low ? 'Low stock' : 'In stock'}</Badge>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.3, marginTop: 8 }}>{item.name}</div>
          <div style={{ fontSize: 12, color: t.textMute, fontFamily: TYPE.mono, marginTop: 4 }}>
            {item.sku}{item.ean && ` · EAN ${item.ean}`}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, paddingBottom: 14 }}>
          <Stat label="Stock" value={String(item.stock)} unit={item.unit}/>
          <Stat label="Location" value={item.loc}/>
          <Stat label="Reorder @" value={String(item.reorderAt)}/>
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: t.textMute, padding: '8px 0' }}>LAST 24H</div>
        {history.length === 0 && <div style={{ fontSize: 12, color: t.textMute, padding: '6px 0' }}>No activity yet.</div>}
        {history.map((r) => {
          const c = r.dir === 'in' ? t.incoming : t.outgoing;
          return (
            <div
              key={r.localId}
              style={{
                padding: '10px 0', borderBottom: `1px solid ${t.divider}`,
                display: 'flex', alignItems: 'center', gap: 10,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: c, width: 42, fontVariantNumeric: 'tabular-nums' }}>
                {r.dir === 'in' ? '+' : '−'}{r.qty}
              </div>
              <div style={{ flex: 1, fontSize: 12, color: t.textDim }}>
                {new Date(r.createdAt).toLocaleString()} · {r.operatorId}
              </div>
              <div style={{ fontSize: 10, color: t.textMute, letterSpacing: 0.5 }}>{r.source.toUpperCase()}</div>
            </div>
          );
        })}
      </div>
      <div style={{ padding: 16, display: 'flex', gap: 10, background: t.bg, borderTop: `1px solid ${t.divider}` }}>
        <Btn kind="ghost" size="lg" icon="arrowUp" style={{ flex: 1 }} onClick={() => { setScanDir('out'); nav('/scan'); }}>Outgoing</Btn>
        <Btn kind="primary" size="lg" icon="arrowDown" style={{ flex: 1 }} onClick={() => { setScanDir('in'); nav('/scan'); }}>Incoming</Btn>
      </div>
    </Screen>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  const t = useTheme();
  return (
    <div style={{ padding: 10, borderRadius: RADIUS.md, background: t.surface, border: `1px solid ${t.divider}` }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: t.textMute, letterSpacing: 0.8, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>
        {value} {unit && <span style={{ fontSize: 11, color: t.textMute, fontWeight: 500 }}>{unit}</span>}
      </div>
    </div>
  );
}
