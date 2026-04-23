import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Direction, Source } from '@/data/schemas';

interface AppState {
  operatorId: string | null;
  operatorName: string | null;
  token: string | null;
  signedInAt: number | null;
  signIn: (operatorId: string, name: string, token: string) => void;
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
  dir?: 'in' | 'out' | null;
  confidence: number;
  raw_text: string;
  imageDataUrl?: string;
}

export const useApp = create<AppState>()(
  persist(
    (set) => ({
      operatorId: null,
      operatorName: null,
      token: null,
      signedInAt: null,
      signIn: (operatorId, operatorName, token) =>
        set({ operatorId, operatorName, token, signedInAt: Date.now() }),
      signOut: () => set({ operatorId: null, operatorName: null, token: null, signedInAt: null }),

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
    {
      name: 'logitrack-app',
      partialize: (s) => ({
        operatorId: s.operatorId,
        operatorName: s.operatorName,
        token: s.token,
        signedInAt: s.signedInAt,
      }),
    },
  ),
);
