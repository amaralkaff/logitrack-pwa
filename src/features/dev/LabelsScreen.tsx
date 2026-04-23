import { useLiveQuery } from 'dexie-react-hooks';
import { Screen } from '@/ui/layout/Screen';
import { TopBar } from '@/ui/TopBar';
import { useTheme } from '@/design/theme';
import { TYPE, RADIUS } from '@/design/tokens';
import { db } from '@/data/db';
import { Btn } from '@/ui/Btn';

/** Printable / on-screen OCR test labels. Open on a separate screen
 *  or print and point the phone OCR at the cards. */
export default function LabelsScreen() {
  const t = useTheme();
  const items = useLiveQuery(() => db.items.orderBy('name').toArray(), [], []) ?? [];

  const print = () => window.print();

  return (
    <Screen>
      <TopBar
        title="OCR test labels"
        subtitle="Scan these with /scan/ocr"
        trailing={<Btn kind="subtle" size="sm" icon="edit" onClick={print}>Print</Btn>}
      />
      <div className="lt-labels" style={{ flex: 1, overflow: 'auto', padding: 16, display: 'grid', gap: 16 }}>
        <style>{`
          @media print {
            @page { size: A4; margin: 12mm; }
            html, body { background: #fff !important; }
            .lt-app, .lt-shell { width: 100% !important; height: auto !important; min-height: 0 !important; border: none !important; border-radius: 0 !important; box-shadow: none !important; max-width: none !important; }
            .lt-top-bar-hide-on-print, nav, header, .lt-no-print { display: none !important; }
            .lt-labels { grid-template-columns: 1fr 1fr !important; padding: 0 !important; gap: 12mm !important; }
            .lt-label { background: #fff !important; color: #000 !important; border: 2px solid #000 !important; break-inside: avoid; }
            .lt-label * { color: #000 !important; }
          }
        `}</style>
        {items.map((it) => (
          <div
            key={it.sku}
            className="lt-label"
            style={{
              background: '#fff',
              color: '#000',
              padding: 20,
              borderRadius: RADIUS.md,
              border: `2px solid ${t.divider}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, color: '#555' }}>PART</div>
            <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.1 }}>{it.name}</div>

            <div style={{ height: 8 }}/>

            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, color: '#555' }}>SKU</div>
            <div style={{ fontFamily: TYPE.mono, fontSize: 40, fontWeight: 700, letterSpacing: 2, lineHeight: 1 }}>
              {it.sku}
            </div>

            {it.ean && (
              <>
                <div style={{ height: 6 }}/>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, color: '#555' }}>EAN</div>
                <div style={{ fontFamily: TYPE.mono, fontSize: 24, fontWeight: 600, letterSpacing: 1 }}>
                  {it.ean}
                </div>
              </>
            )}

            <div style={{ height: 6 }}/>
            <div style={{ display: 'flex', gap: 16, fontFamily: TYPE.mono, fontSize: 14 }}>
              <div>LOC {it.loc}</div>
              <div>QTY {it.stock} {it.unit}</div>
            </div>
          </div>
        ))}
      </div>
    </Screen>
  );
}
