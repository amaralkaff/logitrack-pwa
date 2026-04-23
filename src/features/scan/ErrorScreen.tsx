import { useNavigate } from 'react-router';
import { Screen } from '@/ui/layout/Screen';
import { TopBar } from '@/ui/TopBar';
import { Btn } from '@/ui/Btn';
import { Icon, type IconName } from '@/design/icons/Icon';
import { useTheme } from '@/design/theme';
import { RADIUS, TYPE } from '@/design/tokens';
import { useApp } from '@/app/store';

export default function ErrorScreen() {
  const t = useTheme();
  const nav = useNavigate();
  const ai = useApp((s) => s.aiResult);
  const sku = ai?.sku ?? null;
  const name = ai?.name ?? null;

  return (
    <Screen>
      <TopBar title="Not in inventory"/>
      <div style={{
        padding: '0 20px', flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 16, paddingTop: 24,
      }}>
        <div style={{
          width: 84, height: 84, borderRadius: 42,
          background: t.warning + '22', border: `2px solid ${t.warning}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="warn" size={40} color={t.warning} stroke={2.4}/>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.3 }}>Item not found</div>
          <div style={{ fontSize: 13, color: t.textDim, marginTop: 6, lineHeight: 1.5, maxWidth: 280 }}>
            {sku
              ? <>SKU <b style={{ color: t.text, fontFamily: TYPE.mono }}>{sku}</b> isn't in your inventory yet. Add it before logging incoming or outgoing.</>
              : <>The scanned label doesn't match any existing inventory. Add it first or search manually.</>
            }
          </div>
          {name && (
            <div style={{ fontSize: 12, color: t.textMute, marginTop: 4 }}>Detected name: <b style={{ color: t.textDim }}>{name}</b></div>
          )}
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          <Row
            icon="plus" color={t.accent[400]}
            label={sku ? `Add ${sku} to inventory` : 'Add new item'}
            onClick={() => {
              const q = new URLSearchParams();
              if (ai?.sku)      q.set('sku', ai.sku);
              if (ai?.name)     q.set('name', ai.name);
              if (ai?.ean)      q.set('ean', ai.ean);
              if (ai?.unit)     q.set('unit', ai.unit);
              if (ai?.location) q.set('loc', ai.location);
              if (ai?.qty)      q.set('stock', String(ai.qty));
              nav(`/inv/new?${q.toString()}`);
            }}
          />
          <Row icon="search" color={t.accent[400]} label="Search manually" onClick={() => nav('/scan/manual')}/>
          <Row icon="sync" color={t.textDim} label="Scan again" onClick={() => nav('/scan/ocr')}/>
        </div>

        <div style={{ flex: 1 }}/>
        <Btn kind="ghost" size="lg" block onClick={() => nav(-1)}>Back</Btn>
      </div>
    </Screen>
  );
}

function Row({ icon, color, label, onClick }: { icon: IconName; color: string; label: string; onClick: () => void }) {
  const t = useTheme();
  return (
    <div
      onClick={onClick}
      style={{
        padding: 12, borderRadius: RADIUS.md,
        background: t.surface, border: `1px solid ${t.divider}`,
        display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
      }}
    >
      <Icon name={icon} size={18} color={color}/>
      <div style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{label}</div>
      <Icon name="chevron" size={16} color={t.textMute}/>
    </div>
  );
}
