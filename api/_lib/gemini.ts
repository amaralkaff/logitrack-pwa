import { GoogleGenAI, Type } from '@google/genai';

let cached: GoogleGenAI | null = null;

/**
 * Returns a Gemini client. Prefers Vertex AI (billed against the GCP project,
 * no per-key quota); falls back to the Gemini Developer API when GEMINI_API_KEY
 * is set and VERTEX_PROJECT is not.
 */
export function gemini(): GoogleGenAI {
  if (cached) return cached;

  const project = process.env.VERTEX_PROJECT ?? process.env.GOOGLE_CLOUD_PROJECT;
  const location = process.env.VERTEX_LOCATION ?? 'global';
  const apiKey = process.env.GEMINI_API_KEY;

  if (project) {
    cached = new GoogleGenAI({ vertexai: true, project, location });
  } else if (apiKey) {
    cached = new GoogleGenAI({ apiKey });
  } else {
    throw new Error('Set VERTEX_PROJECT (preferred) or GEMINI_API_KEY');
  }
  return cached;
}

export function geminiModel(): string {
  // Vertex exposes gemini-2.0-flash under the same short id.
  return process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';
}

export const LABEL_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    sku:        { type: Type.STRING, description: 'SKU or part number, e.g. MIL-11001, SKU-77421, or similar prefix-digits pattern. null if not visible.' },
    name:       { type: Type.STRING, description: 'Item or product name, as written on the label.' },
    qty:        { type: Type.NUMBER, description: 'Quantity if visible on label. Integer only. null if not visible.' },
    batch:      { type: Type.STRING, description: 'Batch, lot or serial number if visible. null if not visible.' },
    ean:        { type: Type.STRING, description: '8, 12, or 13 digit barcode / EAN / UPC if visible as digits. null if not visible.' },
    unit:       { type: Type.STRING, description: 'Unit of measure abbreviation (EA, BOX, CAN, KG, L, M, etc). null if not inferable.' },
    location:   { type: Type.STRING, description: 'Storage location code if visible (e.g. A-12-03). null otherwise.' },
    confidence: { type: Type.NUMBER, description: 'Your own confidence 0-1 that the extracted data is correct and complete.' },
    raw_text:   { type: Type.STRING, description: 'All text you read from the image, for audit.' },
  },
  required: ['confidence', 'raw_text'],
} as const;

export const LABEL_PROMPT = `You are a logistics label parser. Extract inventory metadata from the image.

Rules:
- Return only the JSON object matching the schema. No prose.
- If a field is not visible or unreadable, use null (or omit).
- SKU formats to recognize: "MIL-11001", "SKU-77421", "PN 12345", any ALPHA-DIGITS or ALPHA DIGITS pattern. Normalize to uppercase with a hyphen.
- Prefer the on-label quantity over any interpretation. Integer only.
- Keep name concise — the product name, not the whole label.
- Confidence: set low (<0.5) if the image is blurry, partial, or ambiguous.`;
