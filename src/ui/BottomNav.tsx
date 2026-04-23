import { useNavigate, useLocation } from 'react-router';
import { useTheme } from '@/design/theme';
import { Icon, type IconName } from '@/design/icons/Icon';

type TabId = 'home' | 'inv' | 'hist' | 'me';

interface Item { id: TabId | null; label?: string; icon?: IconName; path?: string }

const items: Item[] = [
  { id: 'home', label: 'Home', icon: 'home', path: '/home' },
  { id: 'inv', label: 'Inventory', icon: 'box', path: '/inv' },
  { id: null },
  { id: 'hist', label: 'History', icon: 'history', path: '/hist' },
  { id: 'me', label: 'Profile', icon: 'user', path: '/me' },
];

export function BottomNav({ withFab = true }: { withFab?: boolean }) {
  const t = useTheme();
  const nav = useNavigate();
  const loc = useLocation();
  const activeFromPath = (p: string): TabId | null => {
    if (p.startsWith('/home')) return 'home';
    if (p.startsWith('/inv')) return 'inv';
    if (p.startsWith('/hist')) return 'hist';
    if (p.startsWith('/me')) return 'me';
    return null;
  };
  const active = activeFromPath(loc.pathname);
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      {withFab && (
        <button
          onClick={() => nav('/scan')}
          style={{
            position: 'absolute', left: '50%', top: -24, transform: 'translateX(-50%)',
            width: 60, height: 60, borderRadius: 30,
            background: t.accent[500], border: `3px solid ${t.bg}`,
            boxShadow: `0 6px 20px ${t.accent.glow}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', zIndex: 2,
          }}
        >
          <Icon name="plus" size={28} color="#fff" stroke={2.4}/>
        </button>
      )}
      <div style={{
        height: 68, background: t.surface, borderTop: `1px solid ${t.divider}`,
        display: 'flex', alignItems: 'stretch', paddingTop: 4,
      }}>
        {items.map((it, i) => {
          if (!it.id || !it.path) return <div key={`sp-${i}`} style={{ flex: 1 }}/>;
          const on = active === it.id;
          return (
            <button
              key={it.id}
              onClick={() => nav(it.path!)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 2,
                background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
              }}
            >
              <Icon name={it.icon!} size={22} color={on ? t.accent[500] : t.textMute}/>
              <div style={{ fontSize: 10, fontWeight: 600, color: on ? t.accent[500] : t.textMute, letterSpacing: 0.3 }}>
                {it.label}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
