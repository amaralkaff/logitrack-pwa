import { GoogleGenAI, Type } from '@google/genai';

let cached: GoogleGenAI | null = null;
export function gemini(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY env var missing');
  if (!cached) cached = new GoogleGenAI({ apiKey });
  return cached;
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
