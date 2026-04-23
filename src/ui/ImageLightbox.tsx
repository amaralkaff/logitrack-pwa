import { useEffect, useState } from 'react';
import { Icon } from '@/design/icons/Icon';

interface LightboxProps {
  src: string | null;
  onClose: () => void;
}

function Lightbox({ src, onClose }: LightboxProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!src) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'env(safe-area-inset-top) 0 env(safe-area-inset-bottom) 0',
      }}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        aria-label="Close"
        style={{
          position: 'absolute', top: 'calc(12px + env(safe-area-inset-top))', right: 12, zIndex: 2,
          width: 40, height: 40, borderRadius: 20,
          background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Icon name="x" color="#fff" size={22}/>
      </button>
      <img
        src={src}
        alt="Full view"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '96vw', maxHeight: '96vh',
          objectFit: 'contain', borderRadius: 8,
        }}
      />
    </div>
  );
}

/** Render a thumbnail that opens a fullscreen lightbox when tapped. */
export function ImageWithLightbox({
  src, alt = '', style,
}: { src: string; alt?: string; style?: React.CSSProperties }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <img
        src={src}
        alt={alt}
        onClick={() => setOpen(true)}
        style={{ cursor: 'zoom-in', ...style }}
      />
      {open && <Lightbox src={src} onClose={() => setOpen(false)}/>}
    </>
  );
}
