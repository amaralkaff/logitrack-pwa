import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Screen } from '@/ui/layout/Screen';
import { Btn } from '@/ui/Btn';
import { Field } from '@/ui/Field';
import { Icon } from '@/design/icons/Icon';
import { useTheme } from '@/design/theme';
import { RADIUS } from '@/design/tokens';
import { useApp } from '@/app/store';
import { api, ApiError } from '@/data/api';
import { db } from '@/data/db';
import { hydrateFromServer } from '@/sync/hydrate';

export default function LoginScreen() {
  const t = useTheme();
  const nav = useNavigate();
  const signIn = useApp((s) => s.signIn);
  const [operatorId, setOperatorId] = useState('');
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    const id = operatorId.trim().toUpperCase();
    if (!id) { setError('Operator ID required'); return; }
    if (!/^\d{4,8}$/.test(pin)) { setError('PIN must be 4–8 digits'); return; }

    setBusy(true);
    try {
      const { token, user } = await api.auth.signin({ operatorId: id, pin });
      signIn(user.operatorId, user.name, token);
      await db.users.put(user);
      await hydrateFromServer();
      nav('/home', { replace: true });
    } catch (e) {
      const msg = e instanceof ApiError
        ? (e.status === 401 ? 'Invalid credentials'
          : e.status === 429 ? e.message.replace(/^.*error.:"/, '').replace(/".*/, '') || 'Too many attempts'
          : `${e.status}: ${e.message.slice(0, 120)}`)
        : (e as Error).message;
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <div style={{ flex: 1, padding: '40px 24px 24px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: t.accent[500],
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="package" size={20} color="#fff"/>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5 }}>LogiTrack</div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 20 }}>
          <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.1, letterSpacing: -0.8 }}>
            Track goods<br/>
            <span style={{ color: t.accent[400] }}>without typing.</span>
          </div>
          <div style={{ fontSize: 15, color: t.textDim, lineHeight: 1.5 }}>
            AI vision + offline-first. Scan label → auto-fill → log.
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            {([
              { icon: 'camera', label: 'AI scan' },
              { icon: 'keyboard', label: 'Manual' },
            ] as const).map((f) => (
              <div key={f.label} style={{
                flex: 1, padding: 12, borderRadius: RADIUS.md,
                background: t.surface, border: `1px solid ${t.divider}`,
                display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start',
              }}>
                <Icon name={f.icon} size={18} color={t.accent[400]}/>
                <div style={{ fontSize: 11, fontWeight: 600, color: t.textDim }}>{f.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Field label="Operator ID" value={operatorId} editable onChange={setOperatorId} mono placeholder="e.g. OP-001" autoFocus/>
          <Field label="PIN" value={pin} editable onChange={setPin} mono type="password" placeholder="4–8 digits"/>
          {error && (
            <div style={{ fontSize: 12, color: t.danger, padding: '0 4px' }}>{error}</div>
          )}
          <div style={{ height: 4 }}/>
          <Btn kind="primary" size="lg" block onClick={submit}>
            {busy ? 'Signing in…' : 'Sign in'}
          </Btn>
        </div>
      </div>
    </Screen>
  );
}
