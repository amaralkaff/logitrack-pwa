import React from 'react';
import { useNavigate, useParams } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { Screen } from '@/ui/layout/Screen';
import { TopBar, btnIcon } from '@/ui/TopBar';
import { Badge } from '@/ui/Badge';
import { MiniMap } from '@/features/inventory/MiniMap';
import { ImageWithLightbox } from '@/ui/ImageLightbox';
import { Icon } from '@/design/icons/Icon';
import { useTheme } from '@/design/theme';
import { RADIUS, TYPE } from '@/design/tokens';
import { db } from '@/data/db';

export default function ItemDetailScreen() {
  const t = useTheme();
  const nav = useNavigate();
  const { sku = '' } = useParams();

  // Edit-mode pulls full doc (incl. imageUrl). Detail relies on Dexie which
  // got its rows from the list endpoint that strips imageUrl, so fetch the
  // single record via API for rendering.
  const localItem = useLiveQuery(() => db.items.get(sku), [sku]);
  const [item, setItem] = React.useState(localItem);
  React.useEffect(() => { setItem(localItem); }, [localItem]);
  const refetch = React.useCallback(async () => {
    if (!sku) return;
    try {
      const remote = await (await import('@/data/api')).api.items.get(sku);
      setItem(remote);
      await db.items.put({ ...remote, updatedAt: remote.updatedAt ?? Date.now() });
    } catch { /* offline */ }
  }, [sku]);

  React.useEffect(() => { void refetch(); }, [refetch]);

  // Refresh when the tab gets focus or becomes visible — picks up remote
  // stock changes (another device's incoming/outgoing tx) without a full
  // page reload.
  React.useEffect(() => {
    const onFocus = () => void refetch();
    const onVis = () => { if (document.visibilityState === 'visible') void refetch(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [refetch]);

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
        {item.imageUrl ? (
          <ImageWithLightbox
            src={item.imageUrl}
            alt={item.name}
            style={{
              width: '100%', height: 180, objectFit: 'cover',
              borderRadius: RADIUS.md, border: `1px solid ${t.divider}`,
              display: 'block',
            }}
          />
        ) : (
          <div style={{
            height: 132, borderRadius: RADIUS.md,
            background: `repeating-linear-gradient(135deg, ${t.surface2} 0 8px, ${t.surface3} 8px 16px)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: t.textMute, fontFamily: TYPE.mono, fontSize: 11, letterSpacing: 0.5,
          }}>
            NO PRODUCT IMAGE
          </div>
        )}
        <div style={{ padding: '16px 0 12px' }}>
          <Badge color={low ? t.warning : t.incoming}>{low ? 'Low stock' : 'In stock'}</Badge>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.3, marginTop: 8 }}>{item.name}</div>
          <div style={{ fontSize: 12, color: t.textMute, fontFamily: TYPE.mono, marginTop: 4 }}>
            {item.sku}{item.ean && ` · EAN ${item.ean}`}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, paddingBottom: 10 }}>
          <Stat label="Stock" value={String(item.stock)} unit={item.unit}/>
          <Stat label="Location" value={item.loc.length > 24 ? item.loc.slice(0, 24) + '…' : item.loc}/>
        </div>

        {item.lat != null && item.lng != null && (
          <div style={{ paddingBottom: 14 }}>
            <MiniMap lat={item.lat} lng={item.lng} height={160} label={item.loc}/>
          </div>
        )}

        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: t.textMute, padding: '8px 0' }}>
          ACTIVITY · {history.length}
        </div>
        {history.length === 0 && <div style={{ fontSize: 12, color: t.textMute, padding: '6px 0' }}>No activity yet.</div>}
        {history.map((r) => {
          const c = r.dir === 'in' ? t.incoming : t.outgoing;
          return (
            <div
              key={r.localId}
              style={{
                padding: '8px 0', borderBottom: `1px solid ${t.divider}`,
                display: 'flex', alignItems: 'center', gap: 10, minWidth: 0,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: c, width: 44, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                {r.dir === 'in' ? '+' : '−'}{r.qty}
              </div>
              <div style={{ flex: 1, minWidth: 0, fontSize: 11, color: t.textDim, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {compactTime(r.createdAt)} · {r.operatorId}
              </div>
              <div style={{ fontSize: 10, color: t.textMute, letterSpacing: 0.5, flexShrink: 0 }}>{r.source.toUpperCase()}</div>
            </div>
          );
        })}
      </div>
    </Screen>
  );
}

function compactTime(ms: number): string {
  const d = new Date(ms);
  const diff = Date.now() - ms;
  if (diff < 60_000) return 'just now';
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3600_000)}h ago`;
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
