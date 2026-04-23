import { useNavigate } from 'react-router';
import { Screen } from '@/ui/layout/Screen';
import { TopBar } from '@/ui/TopBar';
import { Btn } from '@/ui/Btn';
import { Icon } from '@/design/icons/Icon';
import { useTheme } from '@/design/theme';
import { RADIUS } from '@/design/tokens';

export default function ErrorScreen() {
  const t = useTheme();
  const nav = useNavigate();
  return (
    <Screen>
      <TopBar title="Scan failed"/>
      <div style={{
        padding: '0 20px', flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 16, paddingTop: 32,
      }}>
        <div style={{
          width: 84, height: 84, borderRadius: 42,
          background: t.danger + '22', border: `2px solid ${t.danger}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="warn" size={40} color={t.danger} stroke={2.4}/>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.3 }}>Code not recognized</div>
          <div style={{ fontSize: 13, color: t.textDim, marginTop: 6, lineHeight: 1.5, maxWidth: 260 }}>
            Try better lighting or move closer. If the label is damaged, use OCR or enter manually.
          </div>
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          <FallbackRow icon="flash" color={t.warning} label="Turn on flash" onClick={() => nav('/scan/qr')}/>
          <FallbackRow icon="camera" color={t.accent[400]} label="Switch to OCR text scan" onClick={() => nav('/scan/ocr')}/>
          <FallbackRow icon="keyboard" color={t.textDim} label="Enter manually" onClick={() => nav('/scan/manual')}/>
        </div>

        <div style={{ flex: 1 }}/>
        <Btn kind="primary" size="lg" block icon="sync" onClick={() => nav('/scan/qr')}>Try again</Btn>
      </div>
    </Screen>
  );
}

function FallbackRow({ icon, color, label, onClick }: { icon: Parameters<typeof Icon>[0]['name']; color: string; label: string; onClick: () => void }) {
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
      <div style={{ flex: 1, fontSize: 13 }}>{label}</div>
      <Icon name="chevron" size={16} color={t.textMute}/>
    </div>
  );
}
