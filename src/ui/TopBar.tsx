import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { useTheme } from '@/design/theme';
import { Icon, type IconName } from '@/design/icons/Icon';

interface TopBarProps {
  title: string;
  subtitle?: string;
  leading?: IconName | null;
  trailing?: ReactNode;
  onBack?: () => void;
}

export function TopBar({ title, subtitle, leading = 'back', trailing, onBack }: TopBarProps) {
  const t = useTheme();
  const navigate = useNavigate();
  const handleBack = onBack ?? (() => navigate(-1));
  return (
    <div style={{
      height: 56, flexShrink: 0, padding: '0 8px 0 4px',
      display: 'flex', alignItems: 'center', gap: 4,
    }}>
      {leading && (
        <button
          onClick={handleBack}
          style={{
            width: 44, height: 44, border: 'none', background: 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}
        >
          <Icon name={leading} color={t.text} size={22}/>
        </button>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: t.text, letterSpacing: -0.2 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: t.textDim, marginTop: 1 }}>{subtitle}</div>}
      </div>
      {trailing}
    </div>
  );
}

export function btnIcon(): React.CSSProperties {
  return {
    width: 44, height: 44, border: 'none', background: 'transparent', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };
}
