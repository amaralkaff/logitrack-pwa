import { useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { Screen } from '@/ui/layout/Screen';
import { BottomNav } from '@/ui/BottomNav';
import { Icon, type IconName } from '@/design/icons/Icon';
import { useTheme } from '@/design/theme';
import { RADIUS, TYPE } from '@/design/tokens';
import { useApp } from '@/app/store';
import { useOnline } from '@/hooks/useOnline';
import { usePendingCount } from '@/hooks/usePendingCount';
import { db } from '@/data/db';

export default function HomeScreen() {
  const t = useTheme();
  const nav = useNavigate();
  const operatorId = useApp((s) => s.operatorId);
  const setScanDir = useApp((s) => s.setScanDir);
  const online = useOnline();
  const pending = usePendingCount();

  const user = useLiveQuery(
    async () => (operatorId ? await db.users.get(operatorId) : undefined),
    [operatorId],
  );
  const todaysTx = useLiveQuery(async () => {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    return db.transactions.where('createdAt').aboveOrEqual(start.getTime()).toArray();
  }, [], []) ?? [];
  const recent = useLiveQuery(
    () => db.transactions.orderBy('createdAt').reverse().limit(3).toArray(),
    [], [],
  ) ?? [];

  const inQty = todaysTx.filter((x) => x.dir === 'in').reduce((s, x) => s + x.qty, 0);
  const outQty = todaysTx.filter((x) => x.dir === 'out').reduce((s, x) => s + x.qty, 0);
  const total = inQty + outQty;
  const lastTxAt = todaysTx.length
    ? Math.max(...todaysTx.map((x) => x.createdAt))
    : null;

  return (
    <Screen>
      <div style={{ padding: '16px 20px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, background: t.accent[500],
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="package" size={18} color="#fff"/>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: t.textDim }}>{user?.location ?? 'No location set'}</div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Hello, {user?.name?.split(' ')[0] ?? 'there'}</div>
        </div>
        <div
          onClick={() => nav('/sync')}
          style={{
            display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer',
            padding: '6px 10px', borderRadius: RADIUS.pill,
            background: (online ? t.success : t.warning) + '22',
            color: online ? t.success : t.warning,
            fontSize: 11, fontWeight: 700,
          }}
        >
          <Icon name={online ? 'cloud' : 'cloudOff'} size={13} color={online ? t.success : t.warning}/>
          {online ? 'ONLINE' : 'OFFLINE'} · {pending}
        </div>
      </div>

      <div style={{ padding: '0 20px 12px' }}>
        <div style={{
          padding: 16, borderRadius: RADIUS.lg,
          background: `linear-gradient(135deg, ${t.accent[600]}, ${t.accent[500]})`,
          color: '#fff', display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, opacity: 0.8 }}>TODAY</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
            <div>
              <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.8 }}>{total}</span>
              <span style={{ fontSize: 12, opacity: 0.8, marginLeft: 4 }}>items</span>
            </div>
            {total > 0 && (
              <>
                <div style={{ opacity: 0.4 }}>·</div>
                <div style={{ fontSize: 12 }}>IN {inQty} / OUT {outQty}</div>
              </>
            )}
          </div>
          {lastTxAt && (
            <div style={{ fontSize: 11, opacity: 0.75, marginTop: 4 }}>
              Last entry · {agoLabel(lastTxAt)} ago
            </div>
          )}
          {!lastTxAt && (
            <div style={{ fontSize: 11, opacity: 0.75, marginTop: 4 }}>
              No transactions yet — tap Scan to log your first.
            </div>
          )}
        </div>
      </div>

      {/* AI Scan — primary CTA */}
      <div style={{ padding: '0 20px 12px' }}>
        <button
          onClick={() => nav('/scan/ocr')}
          style={{
            width: '100%', padding: 16, borderRadius: RADIUS.lg,
            background: t.accent[500] + '14', border: `1px solid ${t.accent[500]}66`,
            color: t.text, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14,
            fontFamily: 'inherit', textAlign: 'left',
          }}
        >
          <div style={{
            width: 48, height: 48, borderRadius: RADIUS.md,
            background: t.accent[500],
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 4px 16px ${t.accent.glow}`,
          }}>
            <Icon name="camera" size={22} color="#fff"/>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: -0.2 }}>Scan with AI</div>
            <div style={{ fontSize: 11, color: t.textDim, marginTop: 2 }}>
              Point camera at a label · Gemini auto-fills the fields
            </div>
          </div>
          <Icon name="chevron" size={18} color={t.textMute}/>
        </button>
      </div>

      <div style={{ padding: '0 20px 12px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <QuickTile
          icon="plus" color={t.accent[500]} label="Add" sub="New item"
          onClick={() => nav('/inv/new')}
        />
        <QuickTile
          icon="arrowDown" color={t.incoming} label="Incoming" sub="Scan in"
          onClick={() => { setScanDir('in'); nav('/scan'); }}
        />
        <QuickTile
          icon="arrowUp" color={t.outgoing} label="Outgoing" sub="Scan out"
          onClick={() => { setScanDir('out'); nav('/scan'); }}
        />
      </div>

      <div style={{ padding: '0 20px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: t.textDim, letterSpacing: 0.8, textTransform: 'uppercase' }}>Recent</div>
        <div onClick={() => nav('/hist')} style={{ fontSize: 12, color: t.accent[400], fontWeight: 600, cursor: 'pointer' }}>See all</div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 20px' }}>
        {recent.length === 0 && (
          <div style={{ fontSize: 12, color: t.textMute, padding: '16px 0' }}>No activity yet — scan to log first item.</div>
        )}
        {recent.map((r) => {
          const c = r.dir === 'in' ? t.incoming : t.outgoing;
          return (
            <div
              key={r.localId}
              onClick={() => nav(`/inv/${r.sku}`)}
              style={{
                padding: '10px 0', borderBottom: `1px solid ${t.divider}`,
                display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
              }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: 6, background: c + '22',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name={r.dir === 'in' ? 'arrowDown' : 'arrowUp'} size={14} color={c}/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {r.sku}
                </div>
                <div style={{ fontSize: 11, fontFamily: TYPE.mono, color: t.textMute }}>{r.source.toUpperCase()}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: c, fontVariantNumeric: 'tabular-nums' }}>
                {r.dir === 'in' ? '+' : '−'}{r.qty}
              </div>
            </div>
          );
        })}
      </div>

      <BottomNav/>
    </Screen>
  );
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

function QuickTile({ icon, color, label, sub, onClick }: { icon: IconName; color: string; label: string; sub: string; onClick: () => void }) {
  const t = useTheme();
  return (
    <div
      onClick={onClick}
      style={{
        padding: 12, borderRadius: RADIUS.lg, background: t.surface,
        border: `1px solid ${t.divider}`, cursor: 'pointer',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: RADIUS.sm,
        background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={icon} size={18} color={color} stroke={2.2}/>
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700 }}>{label}</div>
        <div style={{ fontSize: 10, color: t.textMute, marginTop: 2 }}>{sub}</div>
      </div>
    </div>
  );
}
