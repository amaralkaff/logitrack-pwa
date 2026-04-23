import { useNavigate } from 'react-router';
import { Screen } from '@/ui/layout/Screen';
import { TopBar } from '@/ui/TopBar';
import { Icon, type IconName } from '@/design/icons/Icon';
import { useTheme } from '@/design/theme';
import { RADIUS } from '@/design/tokens';
import { useApp } from '@/app/store';

export default function ChoiceScreen() {
  const t = useTheme();
  const nav = useNavigate();
  const dir = useApp((s) => s.scanDir);
  const setScanDir = useApp((s) => s.setScanDir);
  const setScanSource = useApp((s) => s.setScanSource);

  const inActive = dir === 'in';
  const tabActive = {
    flex: 1, padding: '10px 12px', borderRadius: RADIUS.sm,
    background: inActive ? t.incoming : t.outgoing, color: '#05150B', textAlign: 'center' as const,
    fontWeight: 700 as const, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    cursor: 'pointer',
  };
  const tabIdle = {
    flex: 1, padding: '10px 12px', textAlign: 'center' as const,
    fontWeight: 700 as const, fontSize: 13, color: t.textDim, cursor: 'pointer',
  };

  const pick = (source: 'qr' | 'ocr' | 'manual') => {
    setScanSource(source);
    if (source === 'qr') nav('/scan/qr');
    else if (source === 'ocr') nav('/scan/ocr');
    else nav('/scan/manual');
  };

  return (
    <Screen>
      <TopBar title="New entry" subtitle={`${inActive ? 'Incoming' : 'Outgoing'} · Dock B`}/>
      <div style={{ padding: '0 20px 16px' }}>
        <div style={{ display: 'flex', gap: 8, padding: 4, background: t.surface2, borderRadius: RADIUS.md }}>
          <div onClick={() => setScanDir('in')} style={inActive ? tabActive : tabIdle}>
            {inActive && <Icon name="arrowDown" size={14} color="#05150B"/>} INCOMING
          </div>
          <div onClick={() => setScanDir('out')} style={!inActive ? tabActive : tabIdle}>
            {!inActive && <Icon name="arrowUp" size={14} color="#05150B"/>} OUTGOING
          </div>
        </div>
      </div>

      <div style={{ flex: 1, padding: '4px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.8, color: t.textDim, textTransform: 'uppercase' }}>
          Choose input method
        </div>

        <MethodCard icon="qr" title="QR / Barcode scan" desc="Fastest. Auto-detects and logs in ≈2s." badge="2s" badgeColor={t.success} onClick={() => pick('qr')}/>
        <MethodCard icon="camera" title="OCR text scan" desc="Capture SKU, batch, lot from paper labels." badge="4s" badgeColor={t.accent[500]} onClick={() => pick('ocr')}/>
        <MethodCard icon="keyboard" title="Manual entry" desc="Type SKU or search inventory." badge="SLOW" badgeColor={t.textMute} onClick={() => pick('manual')}/>
      </div>

      <div style={{ padding: '0 20px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Icon name="bolt" size={14} color={t.accent[400]}/>
        <div style={{ fontSize: 11, color: t.textDim }}>
          Last used: <b style={{ color: t.text }}>QR / Barcode</b> · swipe right to repeat
        </div>
      </div>
    </Screen>
  );
}

function MethodCard({
  icon, title, desc, badge, badgeColor, onClick,
}: {
  icon: IconName; title: string; desc: string; badge: string; badgeColor: string; onClick: () => void;
}) {
  const t = useTheme();
  return (
    <div
      onClick={onClick}
      style={{
        padding: 16, borderRadius: RADIUS.lg, background: t.surface,
        border: `1px solid ${t.divider}`,
        display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
      }}
    >
      <div style={{
        width: 52, height: 52, borderRadius: RADIUS.md, background: t.surface2,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={icon} size={26} color={t.accent[400]} stroke={1.8}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>{title}</div>
        <div style={{ fontSize: 12, color: t.textDim, marginTop: 2, lineHeight: 1.35 }}>{desc}</div>
      </div>
      <div style={{ padding: '4px 8px', borderRadius: 6, background: badgeColor + '22', color: badgeColor, fontSize: 10, fontWeight: 800, letterSpacing: 0.5 }}>
        {badge}
      </div>
    </div>
  );
}
