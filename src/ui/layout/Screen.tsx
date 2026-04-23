import type { CSSProperties, ReactNode } from 'react';
import { useTheme } from '@/design/theme';
import { TYPE } from '@/design/tokens';

interface ScreenProps {
  children: ReactNode;
  style?: CSSProperties;
  /** Hide status bar (used by camera viewfinder). */
  hideStatus?: boolean;
}

export function Screen({ children, style, hideStatus }: ScreenProps) {
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
      {!hideStatus && <StatusBar />}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {children}
      </div>
    </div>
  );
}

export function StatusBar({ tint }: { tint?: string }) {
  const t = useTheme();
  const c = tint || t.text;
  return (
    <div
      style={{
        height: 28, flexShrink: 0, padding: '0 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: 12, fontWeight: 600, color: c, letterSpacing: 0.2,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      <TimeNow />
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', opacity: 0.95 }}>
        <svg width="13" height="10" viewBox="0 0 13 10"><path d="M1 8h2v1H1zM4 6h2v3H4zM7 4h2v5H7zM10 1h2v8h-2z" fill={c}/></svg>
        <svg width="14" height="10" viewBox="0 0 14 10" fill="none" stroke={c} strokeWidth="1.3"><path d="M1 4a10 10 0 0112 0M3 6a7 7 0 018 0M5 8a4 4 0 014 0"/></svg>
        <svg width="20" height="10" viewBox="0 0 20 10"><rect x="0.5" y="0.5" width="16" height="9" rx="2" fill="none" stroke={c}/><rect x="2" y="2" width="10" height="6" rx="1" fill={c}/><rect x="17" y="3" width="2" height="4" rx="0.5" fill={c}/></svg>
      </div>
    </div>
  );
}

function TimeNow() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return <span>{hh}:{mm}</span>;
}
