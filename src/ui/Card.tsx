import type { CSSProperties, ReactNode } from 'react';
import { useTheme } from '@/design/theme';
import { RADIUS } from '@/design/tokens';

export function Card({ children, padded = true, style }: { children: ReactNode; padded?: boolean; style?: CSSProperties }) {
  const t = useTheme();
  return (
    <div
      style={{
        background: t.surface, borderRadius: RADIUS.lg,
        border: `1px solid ${t.divider}`,
        padding: padded ? 16 : 0, ...style,
      }}
    >
      {children}
    </div>
  );
}
