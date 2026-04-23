import { useNavigate } from 'react-router';
import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Screen } from '@/ui/layout/Screen';
import { BottomNav } from '@/ui/BottomNav';
import { TopBar, btnIcon } from '@/ui/TopBar';
import { Chip } from '@/ui/Chip';
import { Icon } from '@/design/icons/Icon';
import { ItemThumb } from '@/ui/ItemThumb';
import { useTheme } from '@/design/theme';
import { TYPE } from '@/design/tokens';
import { db } from '@/data/db';

type Filter = 'all' | 'low' | string;

export default function InventoryScreen() {
  const t = useTheme();
  const nav = useNavigate();
  const [filter, setFilter] = useState<Filter>('all');

  const items = useLiveQuery(() => db.items.orderBy('name').toArray(), [], []) ?? [];
  const zones = Array.from(new Set(items.map((i) => i.zone).filter(Boolean) as string[])).sort();
  const filtered = items.filter((i) => {
    if (filter === 'all') return true;
    if (filter === 'low') return i.stock <= i.reorderAt;
    return i.zone === filter;
  });
  const lowCount = items.filter((i) => i.stock <= i.reorderAt).length;

  return (
    <Screen>
      <TopBar
        title="Inventory"
        subtitle={`${items.length} items · ${new Set(items.map((i) => i.loc)).size} locations`}
        leading={null}
        trailing={
          <button style={btnIcon()} onClick={() => nav('/inv/new')} aria-label="Add item">
            <Icon name="plus" color={t.text} size={22}/>
          </button>
        }
      />

      <div style={{ padding: '4px 20px 12px', display: 'flex', gap: 8, overflow: 'auto' }}>
        <Chip active={filter === 'all'} onClick={() => setFilter('all')}>All</Chip>
        {lowCount > 0 && (
          <Chip active={filter === 'low'} onClick={() => setFilter('low')} color={t.warning} icon="warn">
            Low stock · {lowCount}
          </Chip>
        )}
        {zones.map((z) => (
          <Chip key={z} active={filter === z} onClick={() => setFilter(z)}>Zone {z}</Chip>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 20px' }}>
        {filtered.length === 0 && (
          <div style={{ padding: 20, color: t.textDim, fontSize: 13 }}>No items match.</div>
        )}
        {filtered.map((r) => {
          const low = r.stock <= r.reorderAt;
          return (
            <div
              key={r.sku}
              onClick={() => nav(`/inv/${r.sku}`)}
              style={{
                padding: '12px 0', borderBottom: `1px solid ${t.divider}`,
                display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
              }}
            >
              <ItemThumb src={r.imageUrl} size={44} alt={r.name}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 2, minWidth: 0 }}>
                  <span style={{ fontSize: 11, fontFamily: TYPE.mono, color: t.textMute, flexShrink: 0 }}>{r.sku}</span>
                  <span style={{ width: 2, height: 2, background: t.textMute, borderRadius: 1, flexShrink: 0 }}/>
                  <span style={{ fontSize: 11, color: t.textDim, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
                    {shortenLoc(r.loc)}
                  </span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: low ? t.warning : t.text, fontVariantNumeric: 'tabular-nums' }}>{r.stock}</div>
                <div style={{ fontSize: 10, color: t.textMute, letterSpacing: 0.5 }}>IN STOCK</div>
              </div>
            </div>
          );
        })}
      </div>

      <BottomNav/>
    </Screen>
  );
}

/** Compact display of a long GPS address — keep the first meaningful segments. */
function shortenLoc(loc: string): string {
  if (!loc) return '—';
  const s = loc.trim();
  const m = s.match(/^(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)$/);
  if (m) return `${parseFloat(m[1]!).toFixed(3)}, ${parseFloat(m[2]!).toFixed(3)}`;
  const parts = s.split(',').map((x) => x.trim()).filter(Boolean);
  if (parts.length <= 2) return s;
  return `${parts[0]}, ${parts[1]}`;
}
