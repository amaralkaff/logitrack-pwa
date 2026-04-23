import { useNavigate } from 'react-router';
import { Screen } from '@/ui/layout/Screen';
import { BottomNav } from '@/ui/BottomNav';
import { TopBar } from '@/ui/TopBar';
import { Btn } from '@/ui/Btn';
import { Icon } from '@/design/icons/Icon';
import { useTheme } from '@/design/theme';

export default function EmptyScreen() {
  const t = useTheme();
  const nav = useNavigate();
  return (
    <Screen>
      <TopBar title="Inventory" leading={null}/>
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24,
      }}>
        <div style={{
          width: 84, height: 84, borderRadius: 20, background: t.surface,
          border: `1.5px dashed ${t.divider}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="box" size={36} color={t.textMute}/>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>No items yet</div>
          <div style={{ fontSize: 13, color: t.textDim, marginTop: 6, maxWidth: 240, lineHeight: 1.5 }}>
            Start by scanning an incoming shipment. We'll build your inventory automatically.
          </div>
        </div>
        <Btn kind="primary" size="lg" icon="qr" style={{ marginTop: 8 }} onClick={() => nav('/scan/qr')}>
          Scan first item
        </Btn>
      </div>
      <BottomNav/>
    </Screen>
  );
}
