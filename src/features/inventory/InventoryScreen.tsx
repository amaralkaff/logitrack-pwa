import { useNavigate } from 'react-router';
import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Screen } from '@/ui/layout/Screen';
import { BottomNav } from '@/ui/BottomNav';
import { TopBar, btnIcon } from '@/ui/TopBar';
import { Chip } from '@/ui/Chip';
import { Icon } from '@/design/icons/Icon';
import { useTheme } from '@/design/theme';
import { RADIUS, TYPE } from '@/design/tokens';
import { db } from '@/data/db';

type Filter = 'all' | 'low' | 'A' | 'B';

export default function InventoryScreen() {
  const t = useTheme();
  const nav = useNavigate();
  const [filter, setFilter] = useState<Filter>('all');

  const items = useLiveQuery(() => db.items.orderBy('name').toArray(), [], []) ?? [];
  const filtered = items.filter((i) => {
    if (filter === 'low') return i.stock <= i.reorderAt;
    if (filter === 'A') return i.zone === 'A';
    if (filter === 'B') return i.zone === 'B';
    return true;
  });
  const lowCount = items.filter((i) => i.stock <= i.reorderAt).length;

  return (
    <Screen>
      <TopBar
        title="Inventory"
        subtitle={`${items.length} items · ${new Set(items.map((i) => i.loc)).size} locations`}
        leading={null}
        trailing={
          <div style={{ display: 'flex' }}>
            <button style={btnIcon()} onClick={() => nav('/inv/new')} aria-label="Add item">
              <Icon name="plus" color={t.text} size={22}/>
            </button>
            <button style={btnIcon()}><Icon name="search" color={t.text} size={20}/></button>
            <button style={btnIcon()}><Icon name="filter" color={t.text} size={20}/></button>
          </div>
        }
      />

      <div style={{ padding: '4px 20px 12px', display: 'flex', gap: 8, overflow: 'auto' }}>
        <Chip active={filter === 'all'} onClick={() => setFilter('all')}>All</Chip>
        <Chip active={filter === 'low'} onClick={() => setFilter('low')} color={t.warning} icon="warn">
          Low stock · {lowCount}
        </Chip>
        <Chip active={filter === 'A'} onClick={() => setFilter('A')}>Zone A</Chip>
        <Chip active={filter === 'B'} onClick={() => setFilter('B')}>Zone B</Chip>
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
              <div style={{
                width: 40, height: 40, borderRadius: RADIUS.sm, background: t.surface2,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name="box" size={18} color={t.textDim}/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 2 }}>
                  <span style={{ fontSize: 11, fontFamily: TYPE.mono, color: t.textMute }}>{r.sku}</span>
                  <span style={{ width: 2, height: 2, background: t.textMute, borderRadius: 1 }}/>
                  <span style={{ fontSize: 11, color: t.textDim }}>{r.loc}</span>
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
