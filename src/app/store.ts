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

  /** AI vision extraction result from Gemini. */
  aiResult: AiScanResult | null;
  setAiResult: (r: AiScanResult | null) => void;
}

export interface AiScanResult {
  sku?: string | null;
  name?: string | null;
  qty?: number | null;
  batch?: string | null;
  ean?: string | null;
  unit?: string | null;
  location?: string | null;
  confidence: number;
  raw_text: string;
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

      aiResult: null,
      setAiResult: (aiResult) => set({ aiResult }),
    }),
    { name: 'logitrack-app', partialize: (s) => ({ operatorId: s.operatorId, signedInAt: s.signedInAt }) },
  ),
);
