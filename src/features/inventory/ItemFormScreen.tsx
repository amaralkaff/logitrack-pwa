import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Screen } from '@/ui/layout/Screen';
import { TopBar } from '@/ui/TopBar';
import { Field } from '@/ui/Field';
import { Btn } from '@/ui/Btn';
import { useTheme } from '@/design/theme';
import { RADIUS } from '@/design/tokens';
import { api, ApiError } from '@/data/api';
import { db } from '@/data/db';

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
  const [form, setForm] = useState<FormState>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = mode === 'edit';

  useEffect(() => {
    if (!isEdit || !routeSku) return;
    (async () => {
      const local = await db.items.get(routeSku);
      if (local) {
        setForm({
          sku: local.sku,
          name: local.name,
          loc: local.loc,
          zone: local.zone ?? '',
          ean: local.ean ?? '',
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
      <TopBar title={isEdit ? 'Edit item' : 'New item'}/>
      <div style={{ padding: '0 20px 16px', flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
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

        <div style={{ flex: 1 }}/>

        <div style={{ display: 'flex', gap: 10, paddingTop: 12 }}>
          {isEdit && (
            <Btn kind="danger" size="lg" onClick={remove} style={{ flex: 1 }} icon="trash">Delete</Btn>
          )}
          <Btn kind="primary" size="lg" onClick={submit} style={{ flex: 2 }} icon="check">
            {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Create item'}
          </Btn>
        </div>
      </div>
    </Screen>
  );
}
