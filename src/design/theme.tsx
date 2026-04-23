import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { themeTokens, type AccentKey, type Scheme, type Theme } from './tokens';

interface ThemeCtx {
  theme: Theme;
  scheme: Scheme;
  accent: AccentKey;
  setScheme: (s: Scheme) => void;
  setAccent: (a: AccentKey) => void;
}

const Ctx = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [scheme, setScheme] = useState<Scheme>('dark');
  const [accent, setAccent] = useState<AccentKey>('blue');
  const theme = useMemo(() => themeTokens(scheme, accent), [scheme, accent]);
  return <Ctx.Provider value={{ theme, scheme, accent, setScheme, setAccent }}>{children}</Ctx.Provider>;
}

export function useTheme(): Theme {
  const v = useContext(Ctx);
  if (!v) throw new Error('useTheme outside ThemeProvider');
  return v.theme;
}

export function useThemeCtx(): ThemeCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useThemeCtx outside ThemeProvider');
  return v;
}
