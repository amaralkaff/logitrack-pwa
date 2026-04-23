import type { ReactNode } from 'react';

export function Badge({ children, color }: { children: ReactNode; color: string }) {
  return (
    <div
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        height: 22, padding: '0 8px', borderRadius: 6,
        background: color + '22', color,
        fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase',
      }}
    >
      {children}
    </div>
  );
}
