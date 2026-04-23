import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Direction, Source } from '@/data/schemas';

interface AppState {
  operatorId: string | null;
  signedInAt: number | null;
  signIn: (operatorId: string) => void;
  signOut: () => void;

  /** Transient per-scan-session state. */
  scanDir: Direction;
  setScanDir: (d: Direction) => void;
  scanSource: Source | null;
  setScanSource: (s: Source | null) => void;

  /** Last detected payload carried across scan → success. */
  detectedText: string | null;
  detectedSku: string | null;
  setDetected: (text: string | null, sku: string | null) => void;
}

export const useApp = create<AppState>()(
  persist(
    (set) => ({
      operatorId: null,
      signedInAt: null,
      signIn: (operatorId) => set({ operatorId, signedInAt: Date.now() }),
      signOut: () => set({ operatorId: null, signedInAt: null }),

      scanDir: 'in',
      setScanDir: (scanDir) => set({ scanDir }),
      scanSource: null,
      setScanSource: (scanSource) => set({ scanSource }),

      detectedText: null,
      detectedSku: null,
      setDetected: (detectedText, detectedSku) => set({ detectedText, detectedSku }),
    }),
    { name: 'logitrack-app', partialize: (s) => ({ operatorId: s.operatorId, signedInAt: s.signedInAt }) },
  ),
);
