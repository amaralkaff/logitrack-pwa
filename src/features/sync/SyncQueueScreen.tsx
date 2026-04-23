import { useLiveQuery } from 'dexie-react-hooks';
import { Screen } from '@/ui/layout/Screen';
import { TopBar } from '@/ui/TopBar';
import { Btn } from '@/ui/Btn';
import { Icon } from '@/design/icons/Icon';
import { useTheme } from '@/design/theme';
import { RADIUS } from '@/design/tokens';
import { db } from '@/data/db';
import { useOnline } from '@/hooks/useOnline';

function agoLabel(ms: number): string {
  const s = Math.max(1, Math.floor((Date.now() - ms) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function SyncQueueScreen() {
  const t = useTheme();
  const online = useOnline();
  const pending = useLiveQuery(
    () => db.transactions.filter((t) => !t.syncedAt).reverse().sortBy('createdAt'),
    [], [],
  ) ?? [];

  return (
    <Screen>
      <TopBar title="Sync queue"/>
      <div style={{ padding: '0 20px', flex: 1, overflow: 'auto' }}>
        <div style={{
          padding: 16, borderRadius: RADIUS.lg,
          background: (online ? t.success : t.warning) + '14',
          border: `1px solid ${(online ? t.success : t.warning)}44`,
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 20,
            background: (online ? t.success : t.warning) + '22',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name={online ? 'cloud' : 'cloudOff'} size={20} color={online ? t.success : t.warning}/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{online ? 'Online' : 'Offline'}</div>
            <div style={{ fontSize: 12, color: t.textDim, marginTop: 2 }}>
              {pending.length} pending · 0 failed
            </div>
          </div>
          <Btn kind="subtle" size="sm" icon="sync">Retry</Btn>
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: t.textMute, padding: '4px 0 8px' }}>
          PENDING · {pending.length}
        </div>
        {pending.length === 0 && (
          <div style={{ padding: 12, color: t.textMute, fontSize: 13 }}>Queue empty.</div>
        )}
        {pending.map((r) => (
          <div key={r.localId} style={{
            padding: '12px 14px', marginBottom: 8, borderRadius: RADIUS.md,
            background: t.surface, border: `1px solid ${t.divider}`,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: t.textMute }}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{r.sku}</div>
              <div style={{ fontSize: 11, color: t.textMute, marginTop: 2 }}>
                {agoLabel(r.createdAt)} · Queued · {r.dir === 'in' ? '+' : '−'}{r.qty}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Screen>
  );
}
