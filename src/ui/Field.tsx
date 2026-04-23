import type { ChangeEvent, ReactNode } from 'react';
import { useTheme } from '@/design/theme';
import { TYPE, RADIUS } from '@/design/tokens';

interface FieldProps {
  label: string;
  value?: string;
  placeholder?: string;
  suffix?: ReactNode;
  mono?: boolean;
  focused?: boolean;
  required?: boolean;
  editable?: boolean;
  onChange?: (v: string) => void;
  onClick?: () => void;
  type?: 'text' | 'password' | 'number';
  autoFocus?: boolean;
}

export function Field({
  label, value, placeholder, suffix, mono, focused, required,
  editable, onChange, onClick, type = 'text', autoFocus,
}: FieldProps) {
  const t = useTheme();
  // Defensive: never surface a literal 'null' / 'undefined' to the user.
  const cleanedValue =
    value && /^(null|undefined|none|n\/a|-)$/i.test(value.trim()) ? '' : value;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{
        fontSize: 12, fontWeight: 600, color: t.textDim,
        letterSpacing: 0.5, textTransform: 'uppercase',
      }}>
        {label}{required && <span style={{ color: t.danger, marginLeft: 4 }}>*</span>}
      </div>
      <div
        onClick={onClick}
        style={{
          height: 52, borderRadius: RADIUS.md,
          background: t.surface2,
          border: `1.5px solid ${focused ? t.accent[500] : 'transparent'}`,
          boxShadow: focused ? `0 0 0 4px ${t.accent.glow}` : 'none',
          display: 'flex', alignItems: 'center', padding: '0 14px', gap: 8,
          cursor: onClick ? 'pointer' : 'default',
        }}
      >
        {editable ? (
          <input
            type={type}
            value={cleanedValue ?? ''}
            autoFocus={autoFocus}
            placeholder={placeholder}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange?.(e.target.value)}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: t.text, fontSize: 16, fontWeight: 500,
              fontFamily: mono ? TYPE.mono : TYPE.family,
              letterSpacing: mono ? 0.4 : 0,
            }}
          />
        ) : (
          <div style={{
            flex: 1, fontSize: 16, fontWeight: 500,
            fontFamily: mono ? TYPE.mono : TYPE.family,
            color: cleanedValue ? t.text : t.textMute,
            letterSpacing: mono ? 0.4 : 0,
          }}>
            {cleanedValue || placeholder}
          </div>
        )}
        {suffix && <div style={{ color: t.textDim, display: 'flex', alignItems: 'center' }}>{suffix}</div>}
      </div>
    </div>
  );
}
