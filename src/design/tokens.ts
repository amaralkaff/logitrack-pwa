// LogiTrack — design tokens. Dark-default, industrial blue, high-contrast outdoor.

export type AccentKey = 'blue' | 'cyan' | 'amber' | 'lime';
export type Scheme = 'dark' | 'light';

export interface AccentScale {
  500: string;
  400: string;
  600: string;
  glow: string;
}

export const ACCENTS: Record<AccentKey, AccentScale> = {
  blue:  { 500: '#2F6BFF', 400: '#5F8BFF', 600: '#1F4FD8', glow: 'rgba(47,107,255,0.35)' },
  cyan:  { 500: '#00B8D4', 400: '#30D4ED', 600: '#008FA8', glow: 'rgba(0,184,212,0.35)' },
  amber: { 500: '#FFB020', 400: '#FFC451', 600: '#D48A00', glow: 'rgba(255,176,32,0.35)' },
  lime:  { 500: '#8EE000', 400: '#A7EA3B', 600: '#6EB000', glow: 'rgba(142,224,0,0.35)' },
};

export interface Theme {
  scheme: Scheme;
  accent: AccentScale;
  bg: string;
  surface: string;
  surface2: string;
  surface3: string;
  divider: string;
  text: string;
  textDim: string;
  textMute: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  incoming: string;
  outgoing: string;
  scanStroke: string;
  shadow: string;
}

export function themeTokens(scheme: Scheme = 'dark', accentKey: AccentKey = 'blue'): Theme {
  const a = ACCENTS[accentKey] ?? ACCENTS.blue;
  if (scheme === 'dark') {
    return {
      scheme, accent: a,
      bg: '#05070A', surface: '#0D1218', surface2: '#151C25', surface3: '#1E2733',
      divider: '#232D3A',
      text: '#F5F7FA', textDim: '#A7B0BD', textMute: '#6C7685',
      success: '#2BD97C', warning: '#FFB020', danger: '#FF4D5E', info: a[500],
      incoming: '#2BD97C', outgoing: '#FF8A3D',
      scanStroke: a[400], shadow: '0 8px 24px rgba(0,0,0,0.5)',
    };
  }
  return {
    scheme, accent: a,
    bg: '#F5F7FA', surface: '#FFFFFF', surface2: '#EEF1F6', surface3: '#E1E6EE',
    divider: '#D7DCE4',
    text: '#0B1220', textDim: '#4A5465', textMute: '#7B8494',
    success: '#0E9F5A', warning: '#C07800', danger: '#D13240', info: a[600],
    incoming: '#0E9F5A', outgoing: '#C65A1F',
    scanStroke: a[500], shadow: '0 6px 18px rgba(15,25,45,0.12)',
  };
}

export const TYPE = {
  family: '"Inter Tight", "Roboto", system-ui, -apple-system, sans-serif',
  mono: '"JetBrains Mono", "Roboto Mono", ui-monospace, monospace',
  h1: 28, h2: 22, h3: 18,
  body: 16, bodySm: 14, label: 13, caption: 12, micro: 11,
} as const;

export const SPACE = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 32, 8: 40, 9: 48 } as const;
export const RADIUS = { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 } as const;
