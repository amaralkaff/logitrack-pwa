import type { ReactNode } from 'react';
import { useTheme } from '@/design/theme';
import { RADIUS } from '@/design/tokens';
import { Icon, type IconName } from '@/design/icons/Icon';

interface ChipProps {
  children: ReactNode;
  active?: boolean;
  color?: string;
  icon?: IconName;
  onClick?: () => void;
}

export function Chip({ children, active, color, icon, onClick }: ChipProps) {
  const t = useTheme();
  const bg = active ? (color || t.accent[500]) : t.surface2;
  const fg = active ? '#fff' : t.textDim;
  return (
    <div
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        height: 30, padding: '0 12px', borderRadius: RADIUS.pill,
        background: bg, color: fg, fontSize: 13, fontWeight: 600,
        border: active ? 'none' : `1px solid ${t.divider}`,
        cursor: onClick ? 'pointer' : 'default', flexShrink: 0,
      }}
    >
      {icon && <Icon name={icon} size={13} color={fg}/>}
      {children}
    </div>
  );
}
