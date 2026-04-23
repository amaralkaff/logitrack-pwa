import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Screen } from '@/ui/layout/Screen';
import { Btn } from '@/ui/Btn';
import { Field } from '@/ui/Field';
import { Icon } from '@/design/icons/Icon';
import { useTheme } from '@/design/theme';
import { RADIUS } from '@/design/tokens';
import { useApp } from '@/app/store';
import { usersRepo } from '@/data/repos/users';

export default function LoginScreen() {
  const t = useTheme();
  const nav = useNavigate();
  const signIn = useApp((s) => s.signIn);
  const [operatorId, setOperatorId] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    const id = operatorId.trim().toUpperCase();
    if (!id) { setError('Operator ID required'); return; }

    const existing = await usersRepo.get(id);
    if (!existing) {
      if (!name.trim()) { setError('Name required for first sign-in'); return; }
      await usersRepo.put({ operatorId: id, name: name.trim(), role: 'Operator' });
    }
    signIn(id);
    nav('/home', { replace: true });
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
            AI vision + offline-first. Capture label → auto-fill → log.
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
          <Field label="Operator ID" value={operatorId} editable onChange={setOperatorId} mono placeholder="e.g. LT-0482" autoFocus/>
          <Field label="Name (first sign-in)" value={name} editable onChange={setName} placeholder="Your full name"/>
          {error && (
            <div style={{ fontSize: 12, color: t.danger, padding: '0 4px' }}>{error}</div>
          )}
          <div style={{ height: 4 }}/>
          <Btn kind="primary" size="lg" block onClick={submit}>Sign in</Btn>
        </div>
      </div>
    </Screen>
  );
}
