import { useLiveQuery } from 'dexie-react-hooks';
import { Screen } from '@/ui/layout/Screen';
import { BottomNav } from '@/ui/BottomNav';
import { TopBar, btnIcon } from '@/ui/TopBar';
import { Icon } from '@/design/icons/Icon';
import { useTheme } from '@/design/theme';
import { RADIUS, TYPE } from '@/design/tokens';
import { db } from '@/data/db';
import type { Transaction } from '@/data/schemas';

function groupByDay(rows: Transaction[]): Array<{ label: string; rows: Transaction[] }> {
  const groups: Record<string, Transaction[]> = {};
  const now = new Date();
  const todayKey = dayKey(now);
  const y = new Date(now); y.setDate(now.getDate() - 1);
  const ydayKey = dayKey(y);
  for (const r of rows) {
    const k = dayKey(new Date(r.createdAt));
    (groups[k] ||= []).push(r);
  }
  return Object.entries(groups).map(([k, rs]) => ({
    label: k === todayKey ? 'TODAY' : k === ydayKey ? 'YESTERDAY' : k.toUpperCase(),
    rows: rs,
  }));
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function agoLabel(ms: number): string {
  const s = Math.max(1, Math.floor((Date.now() - ms) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function HistoryScreen() {
  const t = useTheme();
  const all = useLiveQuery(
    () => db.transactions.orderBy('createdAt').reverse().limit(100).toArray(),
    [], [],
  ) ?? [];

  const groups = groupByDay(all);

  return (
    <Screen>
      <TopBar
        title="History"
        subtitle="All transactions"
        leading={null}
        trailing={<button style={btnIcon()}><Icon name="filter" color={t.text} size={20}/></button>}
      />
      <div style={{ flex: 1, overflow: 'auto', padding: '0 20px' }}>
        {groups.length === 0 && <div style={{ padding: 20, color: t.textMute, fontSize: 13 }}>No transactions yet.</div>}
        {groups.map((g) => (
          <div key={g.label}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: t.textMute, padding: '12px 0 8px' }}>
              {g.label}
            </div>
            {g.rows.map((r) => {
              const c = r.dir === 'in' ? t.incoming : t.outgoing;
              const synced = Boolean(r.syncedAt);
              return (
                <div key={r.localId} style={{
                  padding: '12px 14px', marginBottom: 8, borderRadius: RADIUS.md,
                  background: t.surface, border: `1px solid ${t.divider}`,
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: RADIUS.sm, background: c + '22',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon name={r.dir === 'in' ? 'arrowDown' : 'arrowUp'} size={16} color={c}/>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{r.sku}</div>
                    <div style={{ fontSize: 11, color: t.textMute, marginTop: 2 }}>
                      <span style={{ fontFamily: TYPE.mono }}>{r.source.toUpperCase()}</span> · {r.operatorId}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: c, fontVariantNumeric: 'tabular-nums' }}>
                      {r.dir === 'in' ? '+' : '−'}{r.qty}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end', marginTop: 2 }}>
                      <Icon name={synced ? 'check' : 'cloudOff'} size={10} color={synced ? t.success : t.warning}/>
                      <span style={{ fontSize: 10, color: synced ? t.success : t.warning, fontWeight: 600 }}>
                        {agoLabel(r.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <BottomNav/>
    </Screen>
  );
}
