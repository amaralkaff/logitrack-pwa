import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router';
import { Screen } from '@/ui/layout/Screen';
import { BottomNav } from '@/ui/BottomNav';
import { TopBar } from '@/ui/TopBar';
import { Icon, type IconName } from '@/design/icons/Icon';
import { useTheme } from '@/design/theme';
import { RADIUS } from '@/design/tokens';
import { useApp } from '@/app/store';
import { db } from '@/data/db';
import { usePendingCount } from '@/hooks/usePendingCount';

function Row({ icon, label, value, color, onClick }: { icon: IconName; label: string; value?: string; color?: string; onClick?: () => void }) {
  const t = useTheme();
  return (
    <div
      onClick={onClick}
      style={{
        padding: 14, borderRadius: RADIUS.md,
        background: t.surface, border: `1px solid ${t.divider}`,
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8,
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: 8, background: t.surface2,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={icon} size={16} color={color || t.textDim}/>
      </div>
      <div style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{label}</div>
      {value && <div style={{ fontSize: 12, color: t.textDim }}>{value}</div>}
      <Icon name="chevron" size={14} color={t.textMute}/>
    </div>
  );
}

export default function ProfileScreen() {
  const t = useTheme();
  const nav = useNavigate();
  const operatorId = useApp((s) => s.operatorId);
  const signOut = useApp((s) => s.signOut);
  const pending = usePendingCount();
  const user = useLiveQuery(() => operatorId ? db.users.get(operatorId) : Promise.resolve(undefined), [operatorId]);
  const initials = user?.name?.split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase() ?? '??';

  return (
    <Screen>
      <TopBar title="Profile" leading={null}/>
      <div style={{ padding: '0 20px', flex: 1, overflow: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '4px 0 18px' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 28, background: t.accent[500],
            color: '#fff', fontSize: 20, fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{initials}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{user?.name ?? 'Unknown'}</div>
            <div style={{ fontSize: 12, color: t.textDim, marginTop: 2 }}>
              {operatorId} · {user?.role ?? ''}
            </div>
          </div>
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: t.textMute, padding: '4px 0 8px' }}>SHIFT</div>
        <Row icon="mapPin" label="Location" value="Warehouse 03 · Dock B"/>
        <Row icon="clock" label="Shift" value={user?.shift ?? '—'}/>

        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: t.textMute, padding: '12px 0 8px' }}>APP</div>
        <Row icon="cloud" label="Sync" value={`${pending} pending`} color={pending ? t.warning : t.success} onClick={() => nav('/sync')}/>
        <Row icon="eye" label="Outdoor mode" value="Auto"/>
        <Row icon="settings" label="Scan preferences"/>
        <Row icon="x" label="Sign out" color={t.danger} onClick={() => { signOut(); nav('/', { replace: true }); }}/>
      </div>
      <BottomNav/>
    </Screen>
  );
}
