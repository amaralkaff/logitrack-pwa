import type { CSSProperties } from 'react';

export type IconName =
  | 'qr' | 'camera' | 'keyboard' | 'plus' | 'arrowDown' | 'arrowUp' | 'arrowRight'
  | 'back' | 'check' | 'x' | 'search' | 'filter' | 'list' | 'home' | 'box'
  | 'history' | 'user' | 'cloud' | 'cloudOff' | 'sync' | 'wifi' | 'bolt'
  | 'warn' | 'info' | 'settings' | 'mic' | 'flash' | 'flashOff' | 'trash'
  | 'edit' | 'truck' | 'package' | 'mapPin' | 'chevron' | 'minus' | 'dots'
  | 'scan' | 'clock' | 'eye';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  stroke?: number;
  style?: CSSProperties;
}

export function Icon({ name, size = 22, color = 'currentColor', stroke = 1.8, style }: IconProps) {
  const p = {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none' as const,
    stroke: color, strokeWidth: stroke, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, style,
  };
  switch (name) {
    case 'qr': return (<svg {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v3M14 20h7M20 17v4"/></svg>);
    case 'camera': return (<svg {...p}><path d="M4 8h3l2-3h6l2 3h3a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z"/><circle cx="12" cy="13" r="4"/></svg>);
    case 'keyboard': return (<svg {...p}><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h12"/></svg>);
    case 'plus': return (<svg {...p}><path d="M12 5v14M5 12h14"/></svg>);
    case 'arrowDown': return (<svg {...p}><path d="M12 5v14M6 13l6 6 6-6"/></svg>);
    case 'arrowUp': return (<svg {...p}><path d="M12 19V5M6 11l6-6 6 6"/></svg>);
    case 'arrowRight': return (<svg {...p}><path d="M5 12h14M13 6l6 6-6 6"/></svg>);
    case 'back': return (<svg {...p}><path d="M19 12H5M11 18l-6-6 6-6"/></svg>);
    case 'check': return (<svg {...p}><path d="M4 12l5 5L20 6"/></svg>);
    case 'x': return (<svg {...p}><path d="M6 6l12 12M6 18L18 6"/></svg>);
    case 'search': return (<svg {...p}><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>);
    case 'filter': return (<svg {...p}><path d="M3 5h18M6 12h12M10 19h4"/></svg>);
    case 'list': return (<svg {...p}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>);
    case 'home': return (<svg {...p}><path d="M3 11l9-8 9 8M5 10v10h14V10"/></svg>);
    case 'box': return (<svg {...p}><path d="M3 7l9-4 9 4v10l-9 4-9-4V7z"/><path d="M3 7l9 4 9-4M12 11v10"/></svg>);
    case 'history': return (<svg {...p}><path d="M3 12a9 9 0 109-9 9 9 0 00-6.4 2.6L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/></svg>);
    case 'user': return (<svg {...p}><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg>);
    case 'cloud': return (<svg {...p}><path d="M7 18a4 4 0 01-.5-7.97A6 6 0 0118 9a4 4 0 01-1 7.87"/></svg>);
    case 'cloudOff': return (<svg {...p}><path d="M3 3l18 18M7 18a4 4 0 01-.5-7.97A6 6 0 0110.5 6.5M13 6a6 6 0 015 3 4 4 0 011 7.4"/></svg>);
    case 'sync': return (<svg {...p}><path d="M21 12a9 9 0 01-15 6.7L3 16M3 12a9 9 0 0115-6.7L21 8M21 3v5h-5M3 21v-5h5"/></svg>);
    case 'wifi': return (<svg {...p}><path d="M2 9a15 15 0 0120 0M5 13a10 10 0 0114 0M8.5 16.5a5 5 0 017 0"/><circle cx="12" cy="20" r=".5" fill="currentColor"/></svg>);
    case 'bolt': return (<svg {...p}><path d="M13 3L4 14h7l-1 7 9-11h-7l1-7z"/></svg>);
    case 'warn': return (<svg {...p}><path d="M12 3l10 18H2L12 3z"/><path d="M12 10v5M12 18v.01"/></svg>);
    case 'info': return (<svg {...p}><circle cx="12" cy="12" r="9"/><path d="M12 8v.01M11 12h1v5h1"/></svg>);
    case 'settings': return (<svg {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.6V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1-1.6 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.6-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.6-1 1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.3H9a1.7 1.7 0 001-1.6V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.6 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.9V9a1.7 1.7 0 001.6 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/></svg>);
    case 'mic': return (<svg {...p}><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v3"/></svg>);
    case 'flash': return (<svg {...p}><path d="M7 2v11h4l-2 9 8-13h-5l2-7z"/></svg>);
    case 'flashOff': return (<svg {...p}><path d="M3 3l18 18M14 2l-3 7h5l-5 8M11 13H7V2"/></svg>);
    case 'trash': return (<svg {...p}><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M6 6l1 14a2 2 0 002 2h6a2 2 0 002-2l1-14"/></svg>);
    case 'edit': return (<svg {...p}><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>);
    case 'truck': return (<svg {...p}><rect x="1" y="6" width="13" height="10" rx="1"/><path d="M14 9h4l3 3v4h-7M6 21a2 2 0 100-4 2 2 0 000 4zM17 21a2 2 0 100-4 2 2 0 000 4z"/></svg>);
    case 'package': return (<svg {...p}><path d="M16 3l4 2v6M4 5l8-3 8 3-8 3-8-3zM4 5v11l8 4V8"/><path d="M20 11l-8 4"/></svg>);
    case 'mapPin': return (<svg {...p}><path d="M12 21s-7-6.2-7-12a7 7 0 0114 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>);
    case 'chevron': return (<svg {...p}><path d="M9 6l6 6-6 6"/></svg>);
    case 'minus': return (<svg {...p}><path d="M5 12h14"/></svg>);
    case 'dots': return (<svg {...p}><circle cx="5" cy="12" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="19" cy="12" r="1.2" fill="currentColor"/></svg>);
    case 'scan': return (<svg {...p}><path d="M3 7V5a2 2 0 012-2h2M21 7V5a2 2 0 00-2-2h-2M3 17v2a2 2 0 002 2h2M21 17v2a2 2 0 01-2 2h-2M3 12h18"/></svg>);
    case 'clock': return (<svg {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>);
    case 'eye': return (<svg {...p}><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>);
    default: return <svg {...p}/>;
  }
}
