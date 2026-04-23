import { useTheme } from '@/design/theme';
import { RADIUS } from '@/design/tokens';

const KEY = import.meta.env.VITE_GMAPS_KEY as string | undefined;

interface Props {
  lat: number;
  lng: number;
  height?: number;
  /** If true, wraps in an anchor that opens Google Maps. */
  interactive?: boolean;
  label?: string;
}

/**
 * Google Static Maps tile — one <img>. No JS loader, no interaction,
 * no per-load billing surprise vs embedded JS maps.
 */
export function MiniMap({ lat, lng, height = 160, interactive = true, label }: Props) {
  const t = useTheme();
  if (!KEY) return null;
  // Retina: request 2x size, display at 1x.
  const w = 640;
  const h = Math.round(height * 2);
  const scheme = 'dark'; // matches app theme
  const color = '0x2F6BFF'; // accent blue for pin
  const src = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=17&size=${w}x${h}&scale=1&maptype=roadmap&style=feature:all|element:labels.text.fill|color:0xffffff&style=feature:all|element:labels.text.stroke|color:0x000000|lightness:13&style=feature:administrative|element:geometry.fill|color:0x000000&style=feature:administrative|element:geometry.stroke|color:0x144b53|lightness:14|weight:1.4&style=feature:landscape|element:all|color:0x08304b&style=feature:poi|element:geometry|color:0x0c4152|lightness:5&style=feature:road.arterial|element:geometry.fill|color:0x0b434f&style=feature:road.arterial|element:geometry.stroke|color:0x0b3d51|lightness:16&style=feature:road.highway|element:geometry.fill|color:0x000000&style=feature:road.highway|element:geometry.stroke|color:0x0b434f|lightness:0.4&style=feature:road.local|element:geometry|color:0x000000&style=feature:transit|element:all|color:0x146474&style=feature:water|element:all|color:0x021019&markers=color:${encodeURIComponent(color)}%7C${lat},${lng}&key=${KEY}`;
  const href = `https://www.google.com/maps?q=${lat},${lng}`;

  const img = (
    <div style={{
      width: '100%', height, borderRadius: RADIUS.md, overflow: 'hidden',
      border: `1px solid ${t.divider}`, position: 'relative',
    }}>
      <img
        src={src}
        alt={label ?? `Map · ${lat.toFixed(5)}, ${lng.toFixed(5)}`}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
      {label && (
        <div style={{
          position: 'absolute', bottom: 8, left: 8, right: 8,
          padding: '6px 10px', borderRadius: RADIUS.sm,
          background: 'rgba(5,7,10,0.7)', color: '#fff',
          fontSize: 11, fontWeight: 600, letterSpacing: 0.2,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          backdropFilter: 'blur(6px)',
        }}>
          {label}
        </div>
      )}
    </div>
  );

  if (!interactive) return img;
  return (
    <a href={href} target="_blank" rel="noreferrer" style={{ display: 'block', textDecoration: 'none' }}>
      {img}
    </a>
  );
  void scheme;
}
