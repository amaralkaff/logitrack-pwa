import { useTheme } from '@/design/theme';
import { RADIUS } from '@/design/tokens';
import { Icon } from '@/design/icons/Icon';

interface Props {
  src?: string | null;
  size?: number;
  alt?: string;
}

/** Rounded thumbnail for list rows. Falls back to box icon when no image. */
export function ItemThumb({ src, size = 40, alt = '' }: Props) {
  const t = useTheme();
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        style={{
          width: size, height: size, objectFit: 'cover',
          borderRadius: RADIUS.sm, border: `1px solid ${t.divider}`,
          background: t.surface2, flexShrink: 0,
        }}
      />
    );
  }
  return (
    <div
      style={{
        width: size, height: size, borderRadius: RADIUS.sm,
        background: t.surface2,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Icon name="box" size={Math.round(size * 0.45)} color={t.textDim}/>
    </div>
  );
}
