import type { CSSProperties, MouseEventHandler, ReactNode } from 'react';
import { useTheme } from '@/design/theme';
import { TYPE, RADIUS } from '@/design/tokens';
import { Icon, type IconName } from '@/design/icons/Icon';

type Kind = 'primary' | 'ghost' | 'danger' | 'success' | 'subtle';
type Size = 'sm' | 'md' | 'lg';

interface BtnProps {
  kind?: Kind;
  children: ReactNode;
  icon?: IconName;
  block?: boolean;
  size?: Size;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  style?: CSSProperties;
  type?: 'button' | 'submit';
}

const heights = { sm: 36, md: 48, lg: 56 } as const;
const pad = { sm: '0 14px', md: '0 18px', lg: '0 22px' } as const;
const fs = { sm: 14, md: 16, lg: 17 } as const;

export function Btn({ kind = 'primary', children, icon, block, size = 'md', onClick, style, type = 'button' }: BtnProps) {
  const t = useTheme();
  const palettes: Record<Kind, { bg: string; color: string; border: string }> = {
    primary: { bg: t.accent[500], color: '#fff', border: 'none' },
    ghost:   { bg: 'transparent', color: t.text, border: `1px solid ${t.divider}` },
    danger:  { bg: t.danger, color: '#fff', border: 'none' },
    success: { bg: t.success, color: '#05150B', border: 'none' },
    subtle:  { bg: t.surface2, color: t.text, border: 'none' },
  };
  const pal = palettes[kind];
  return (
    <button
      type={type}
      onClick={onClick}
      style={{
        height: heights[size], padding: pad[size], fontSize: fs[size],
        fontWeight: 600, fontFamily: TYPE.family,
        borderRadius: RADIUS.md, background: pal.bg, color: pal.color, border: pal.border,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        width: block ? '100%' : 'auto', cursor: 'pointer', letterSpacing: 0.1,
        ...style,
      }}
    >
      {icon && <Icon name={icon} size={18} color={pal.color}/>}
      {children}
    </button>
  );
}
