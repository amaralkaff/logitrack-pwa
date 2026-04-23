import type { CSSProperties, ReactNode } from 'react';
import { useTheme } from '@/design/theme';
import { TYPE } from '@/design/tokens';

interface ScreenProps {
  children: ReactNode;
  style?: CSSProperties;
}

export function Screen({ children, style }: ScreenProps) {
  const t = useTheme();
  return (
    <div
      style={{
        flex: 1, minHeight: 0,
        background: t.bg, color: t.text, fontFamily: TYPE.family,
        position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
