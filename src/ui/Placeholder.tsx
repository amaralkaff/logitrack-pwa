import { useTheme } from '@/design/theme';
import { RADIUS, TYPE } from '@/design/tokens';

export function Placeholder({ label, h = 120 }: { label: string; h?: number }) {
  const t = useTheme();
  return (
    <div
      style={{
        height: h, borderRadius: RADIUS.md,
        background: `repeating-linear-gradient(135deg, ${t.surface2} 0 8px, ${t.surface3} 8px 16px)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: t.textMute, fontFamily: TYPE.mono, fontSize: 11, letterSpacing: 0.5,
      }}
    >
      {label}
    </div>
  );
}
