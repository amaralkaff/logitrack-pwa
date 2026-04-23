import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { Screen } from '@/ui/layout/Screen';
import { TopBar } from '@/ui/TopBar';
import { Field } from '@/ui/Field';
import { Btn } from '@/ui/Btn';
import { Icon } from '@/design/icons/Icon';
import { useTheme } from '@/design/theme';
import { RADIUS } from '@/design/tokens';
import { api, ApiError } from '@/data/api';
import { db } from '@/data/db';
import { ScanToFillSheet, type VisionResult } from '@/features/scan/ScanToFillSheet';
import { useGpsLocation } from '@/features/inventory/useGpsLocation';
import { nanoid } from '@/lib/nanoid';

interface Props {
  mode: 'create' | 'edit';
}

interface FormState {
  sku: string;
  name: string;
  loc: string;
  zone: string;
  ean: string;
  stock: string;
  reorderAt: string;
  unit: string;
  imageUrl: string;
}

const EMPTY: FormState = { sku: '', name: '', loc: '', zone: '', ean: '', stock: '0', reorderAt: '0', unit: 'EA', imageUrl: '' };

export default function ItemFormScreen({ mode }: Props) {
  const t = useTheme();
  const nav = useNavigate();
  const { sku: routeSku } = useParams();
  const [search] = useSearchParams();
  const cleanParam = (key: string, fallback = ''): string => {
    const v = (search.get(key) ?? '').trim();
    if (!v || /^(null|undefined|none|n\/a)$/i.test(v)) return fallback;
    return v;
  };
  const initial = mode === 'create' ? {
    ...EMPTY,
    sku: cleanParam('sku'),
    name: cleanParam('name'),
    loc: cleanParam('loc'),
    zone: cleanParam('zone'),
    ean: cleanParam('ean'),
    stock: cleanParam('stock', '0'),
    reorderAt: cleanParam('reorderAt', '0'),
    unit: cleanParam('unit', 'EA'),
  } : EMPTY;
  const [form, setForm] = useState<FormState>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [aiHint, setAiHint] = useState<string | null>(null);
  const gps = useGpsLocation();
  const isEdit = mode === 'edit';

  // Auto-capture GPS on mount for new items so the location is always
  // the actual device position, no manual picking required.
  useEffect(() => {
    if (isEdit) return;
    if (form.loc) return; // respect any prefill or prior fix
    (async () => {
      const fix = await gps.capture();
      if (fix) setForm((s) => ({ ...s, loc: fix.address }));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isEdit || !routeSku) return;
    (async () => {
      const local = await db.items.get(routeSku);
      // For edit, always hit API so we get the full doc including imageUrl
      // (the list endpoint strips it).
      try {
        const remote = await api.items.get(routeSku);
        setForm({
          sku: remote.sku, name: remote.name, loc: remote.loc,
          zone: remote.zone ?? '', ean: remote.ean ?? '',
          stock: String(remote.stock),
          reorderAt: String(remote.reorderAt ?? 0),
          unit: remote.unit ?? 'EA',
          imageUrl: remote.imageUrl ?? '',
        });
      } catch {
        if (local) {
          setForm({
            sku: local.sku, name: local.name, loc: local.loc,
            zone: local.zone ?? '', ean: local.ean ?? '',
            stock: String(local.stock),
            reorderAt: String(local.reorderAt ?? 0),
            unit: local.unit ?? 'EA',
            imageUrl: local.imageUrl ?? '',
          });
        }
      }
    })();
  }, [isEdit, routeSku]);

  const set = (k: keyof FormState) => (v: string) => setForm((s) => ({ ...s, [k]: v }));

  const onScanResult = (r: VisionResult) => {
    // Reject Gemini's literal "null" / empty / whitespace strings so they never
    // leak into the form as the word 'null'.
    const clean = (v: unknown): string | null => {
      if (typeof v !== 'string') return null;
      const s = v.trim();
      if (!s) return null;
      if (/^(null|none|undefined|n\/a|-)$/i.test(s)) return null;
      return s;
    };
    const cleanNum = (v: unknown): number | null => {
      if (typeof v === 'number' && Number.isFinite(v) && v > 0) return Math.round(v);
      if (typeof v === 'string') {
        const n = Number(v);
        if (Number.isFinite(n) && n > 0) return Math.round(n);
      }
      return null;
    };

    const sku  = clean(r.sku);
    const name = clean(r.name);
    const ean  = clean(r.ean);
    const unit = clean(r.unit);
    const loc  = clean(r.location);
    const qty  = cleanNum(r.qty);

    const filled: string[] = [];
    const generated: string[] = [];
    setForm((s) => {
      const next = { ...s };

      if (!isEdit) {
        if (sku) { next.sku = sku; filled.push('SKU'); }
        else if (!next.sku) {
          next.sku = `ITM-${nanoid(6).toUpperCase()}`;
          generated.push('SKU');
        }
      }

      if (name) { next.name = name; filled.push('name'); }
      else if (!next.name) { next.name = 'Unknown item'; generated.push('name'); }

      // Location is owned by GPS — only let AI fill it when GPS produced nothing.
      if (!next.loc) {
        if (loc) { next.loc = loc; filled.push('location'); }
        else { next.loc = 'UNASSIGNED'; generated.push('location'); }
      }

      if (ean) { next.ean = ean; filled.push('EAN'); }
      if (qty != null) { next.stock = String(qty); filled.push('qty'); }
      if (unit) { next.unit = unit; filled.push('unit'); }
      else if (!next.unit) { next.unit = 'EA'; }

      // Attach the captured frame as the product image when creating.
      if (r.imageDataUrl && !next.imageUrl) {
        next.imageUrl = r.imageDataUrl;
        filled.push('image');
      }

      return next;
    });

    const confPct = (r.confidence * 100).toFixed(0);
    const parts: string[] = [];
    if (filled.length) parts.push(`AI filled ${filled.join(', ')}`);
    if (generated.length) parts.push(`auto-generated ${generated.join(', ')}`);
    if (!parts.length) parts.push('Nothing extracted — try again');
    setAiHint(`${parts.join(' · ')} · ${confPct}% conf`);
  };

  const submit = async () => {
    setError(null);
    if (!form.sku.trim() || !form.name.trim() || !form.loc.trim()) {
      setError('SKU, name, and location are required');
      return;
    }
    setBusy(true);
    try {
      const payload = {
        sku: form.sku.trim(),
        name: form.name.trim(),
        loc: form.loc.trim(),
        zone: form.zone.trim() || undefined,
        ean: form.ean.trim() || undefined,
        stock: Number(form.stock) || 0,
        reorderAt: Number(form.reorderAt) || 0,
        unit: form.unit.trim() || 'EA',
        imageUrl: form.imageUrl || undefined,
      };
      if (isEdit) {
        const { sku: _, ...patch } = payload;
        const saved = await api.items.update(form.sku, patch);
        await db.items.put({ ...saved, updatedAt: Date.now() });
      } else {
        const saved = await api.items.create(payload);
        await db.items.put({ ...saved, updatedAt: Date.now() });
      }
      nav(`/inv/${encodeURIComponent(form.sku)}`, { replace: true });
    } catch (e) {
      const msg = e instanceof ApiError ? `${e.status}: ${e.message}` : (e as Error).message;
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!isEdit || !routeSku) return;
    if (!confirm(`Delete ${routeSku}? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await api.items.remove(routeSku);
      await db.items.delete(routeSku);
      nav('/inv', { replace: true });
    } catch (e) {
      const msg = e instanceof ApiError ? `${e.status}: ${e.message}` : (e as Error).message;
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <TopBar title={isEdit ? 'Edit item' : 'New item'}/>

      <div style={{
        flex: 1, minHeight: 0, overflow: 'auto',
        padding: '4px 16px 12px',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        {!isEdit && (
          <button
            onClick={() => setScanOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '14px 16px', borderRadius: RADIUS.md,
              background: t.accent[500] + '14', border: `1px solid ${t.accent[500]}66`,
              color: t.text, cursor: 'pointer', width: '100%',
              fontFamily: 'inherit',
            }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: RADIUS.sm,
              background: t.accent[500], display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="camera" size={18} color="#fff"/>
            </div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Scan label with AI</div>
              <div style={{ fontSize: 11, color: t.textDim, marginTop: 2 }}>
                Auto-fills SKU, name, qty, unit, EAN, location
              </div>
            </div>
            <Icon name="chevron" size={16} color={t.textMute}/>
          </button>
        )}

        {form.imageUrl && (
          <div style={{ position: 'relative' }}>
            <img
              src={form.imageUrl}
              alt="Product"
              style={{
                width: '100%', maxHeight: 220, objectFit: 'cover',
                borderRadius: RADIUS.md, border: `1px solid ${t.divider}`,
                display: 'block',
              }}
            />
            <button
              type="button"
              onClick={() => setForm((s) => ({ ...s, imageUrl: '' }))}
              aria-label="Remove image"
              style={{
                position: 'absolute', top: 8, right: 8,
                width: 32, height: 32, borderRadius: 16,
                background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Icon name="x" size={16} color="#fff"/>
            </button>
          </div>
        )}

        {aiHint && (
          <div style={{
            padding: '10px 12px', borderRadius: RADIUS.md,
            background: t.accent[500] + '14', border: `1px solid ${t.accent[500]}44`,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <Icon name="bolt" size={14} color={t.accent[400]}/>
            <div style={{ flex: 1, fontSize: 12, color: t.textDim }}>{aiHint}</div>
            <button
              onClick={() => setAiHint(null)}
              aria-label="Dismiss"
              style={{ width: 28, height: 28, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name="x" size={14} color={t.textMute}/>
            </button>
          </div>
        )}

        <Field label="SKU" value={form.sku} editable={!isEdit} onChange={set('sku')} mono placeholder="e.g. MIL-11001" required/>
        <Field label="Name" value={form.name} editable onChange={set('name')} placeholder="Item name" required/>
        <Field label="EAN / Barcode" value={form.ean} editable onChange={set('ean')} mono placeholder="8, 12, or 13 digits"/>
        <Field
          label="Location"
          value={form.loc}
          editable
          onChange={set('loc')}
          placeholder={gps.loading ? 'Getting GPS…' : 'Auto-detected from device GPS'}
          required
          suffix={
            <button
              type="button"
              onClick={async () => {
                const fix = await gps.capture();
                if (fix) setForm((s) => ({ ...s, loc: fix.address }));
              }}
              aria-label="Refresh GPS"
              disabled={gps.loading}
              style={{
                width: 32, height: 32, borderRadius: RADIUS.sm, border: 'none',
                background: t.accent[500], color: '#fff', cursor: gps.loading ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: gps.loading ? 0.5 : 1,
              }}
            >
              <Icon name={gps.loading ? 'sync' : 'mapPin'} size={16} color="#fff"/>
            </button>
          }
        />
        {gps.error && (
          <div style={{ fontSize: 11, color: t.danger, paddingLeft: 2, marginTop: -4 }}>
            GPS: {gps.error}
          </div>
        )}
        <Field label="Zone" value={form.zone} editable onChange={set('zone')} placeholder="Optional — A / B / …"/>
        <Field label="Quantity on hand" value={form.stock} editable onChange={set('stock')} type="number" mono/>
        <Field label="Reorder threshold" value={form.reorderAt} editable onChange={set('reorderAt')} type="number" mono/>
        <Field label="Unit" value={form.unit} editable onChange={set('unit')} placeholder="EA / BOX / KG …"/>

        {error && (
          <div style={{
            padding: 12, borderRadius: RADIUS.md,
            background: t.danger + '22', color: t.danger,
            fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <Icon name="warn" size={16} color={t.danger}/>
            {error}
          </div>
        )}

        <div style={{ height: 8 }}/>
      </div>

      {/* Sticky bottom action bar — safe-area aware */}
      <div style={{
        flexShrink: 0, padding: '10px 16px calc(12px + env(safe-area-inset-bottom))',
        background: t.bg, borderTop: `1px solid ${t.divider}`,
        display: 'flex', gap: 10,
      }}>
        {isEdit && (
          <Btn kind="danger" size="lg" onClick={remove} style={{ flex: 1 }} icon="trash">Delete</Btn>
        )}
        <Btn kind="primary" size="lg" onClick={submit} style={{ flex: 2 }} icon="check">
          {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Create item'}
        </Btn>
      </div>

      <ScanToFillSheet
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        onResult={onScanResult}
      />
    </Screen>
  );
}

