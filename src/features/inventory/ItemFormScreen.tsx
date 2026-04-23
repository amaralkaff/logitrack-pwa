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
}

const EMPTY: FormState = { sku: '', name: '', loc: '', zone: '', ean: '', stock: '0', reorderAt: '0', unit: 'EA' };

export default function ItemFormScreen({ mode }: Props) {
  const t = useTheme();
  const nav = useNavigate();
  const { sku: routeSku } = useParams();
  const [search] = useSearchParams();
  const initial = mode === 'create' ? {
    ...EMPTY,
    sku: search.get('sku') ?? '',
    name: search.get('name') ?? '',
    loc: search.get('loc') ?? '',
    zone: search.get('zone') ?? '',
    ean: search.get('ean') ?? '',
    stock: search.get('stock') ?? '0',
    reorderAt: search.get('reorderAt') ?? '0',
    unit: search.get('unit') ?? 'EA',
  } : EMPTY;
  const [form, setForm] = useState<FormState>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [aiHint, setAiHint] = useState<string | null>(null);
  const isEdit = mode === 'edit';

  useEffect(() => {
    if (!isEdit || !routeSku) return;
    (async () => {
      const local = await db.items.get(routeSku);
      if (local) {
        setForm({
          sku: local.sku, name: local.name, loc: local.loc,
          zone: local.zone ?? '', ean: local.ean ?? '',
          stock: String(local.stock),
          reorderAt: String(local.reorderAt ?? 0),
          unit: local.unit ?? 'EA',
        });
      } else {
        try {
          const remote = await api.items.get(routeSku);
          setForm({
            sku: remote.sku, name: remote.name, loc: remote.loc,
            zone: remote.zone ?? '', ean: remote.ean ?? '',
            stock: String(remote.stock),
            reorderAt: String(remote.reorderAt ?? 0),
            unit: remote.unit ?? 'EA',
          });
        } catch (e) {
          setError((e as Error).message);
        }
      }
    })();
  }, [isEdit, routeSku]);

  const set = (k: keyof FormState) => (v: string) => setForm((s) => ({ ...s, [k]: v }));

  const onScanResult = (r: VisionResult) => {
    setForm((s) => ({
      sku:       (!isEdit && r.sku)                  ? r.sku : s.sku,
      name:      r.name      ? r.name      : s.name,
      loc:       r.location  ? r.location  : s.loc,
      zone:      s.zone,
      ean:       r.ean       ? r.ean       : s.ean,
      stock:     r.qty != null ? String(r.qty) : s.stock,
      reorderAt: s.reorderAt,
      unit:      r.unit      ? r.unit      : s.unit,
    }));
    setAiHint(`AI filled ${[r.sku && 'SKU', r.name && 'name', r.qty != null && 'qty', r.ean && 'EAN', r.unit && 'unit', r.location && 'location'].filter(Boolean).join(', ')} · ${(r.confidence * 100).toFixed(0)}% conf`);
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
      <TopBar
        title={isEdit ? 'Edit item' : 'New item'}
        trailing={
          !isEdit ? (
            <button
              onClick={() => setScanOpen(true)}
              style={{
                height: 36, padding: '0 12px', borderRadius: RADIUS.pill,
                background: t.accent[500], color: '#fff', border: 'none',
                display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                fontWeight: 700, fontSize: 12, marginRight: 8,
              }}
            >
              <Icon name="camera" size={14} color="#fff"/>
              AI scan
            </button>
          ) : undefined
        }
      />

      <div style={{
        flex: 1, minHeight: 0, overflow: 'auto',
        padding: '4px 20px 16px',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
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
              style={{ background: 'transparent', border: 'none', color: t.textMute, cursor: 'pointer' }}
            >
              <Icon name="x" size={14} color={t.textMute}/>
            </button>
          </div>
        )}

        <Field label="SKU" value={form.sku} editable={!isEdit} onChange={set('sku')} mono placeholder="MIL-11001" required/>
        <Field label="Name" value={form.name} editable onChange={set('name')} required/>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Location" value={form.loc} editable onChange={set('loc')} mono required/>
          <Field label="Zone" value={form.zone} editable onChange={set('zone')}/>
        </div>
        <Field label="EAN / Barcode" value={form.ean} editable onChange={set('ean')} mono/>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <Field label="Stock" value={form.stock} editable onChange={set('stock')} type="number" mono/>
          <Field label="Reorder @" value={form.reorderAt} editable onChange={set('reorderAt')} type="number" mono/>
          <Field label="Unit" value={form.unit} editable onChange={set('unit')}/>
        </div>

        {error && (
          <div style={{
            padding: 10, borderRadius: RADIUS.md,
            background: t.danger + '22', color: t.danger,
            fontSize: 12, fontWeight: 600,
          }}>{error}</div>
        )}

        <div style={{ height: 16 }}/>
      </div>

      {/* Sticky bottom action bar — safe-area aware */}
      <div style={{
        flexShrink: 0, padding: '10px 20px calc(12px + env(safe-area-inset-bottom))',
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
