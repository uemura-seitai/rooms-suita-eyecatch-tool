import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type Props = { label?: string; expanded: boolean; onToggle: () => void; children: ReactNode };

export default function FixedPreview({ label = 'プレビュー', expanded, onToggle, children }: Props) {
  const [cleared, setCleared] = useState(false);

  // Every editor uses the same clear-button class. Removing the portal (not
  // merely hiding it) releases its canvas from the visible document and makes
  // a late canvas draw from an earlier request harmless.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if ((event.target as HTMLElement | null)?.closest('.clear-inputs')) {
        setCleared(true);
        window.dispatchEvent(new Event('rooms:preview-cleared'));
      }
    };
    const onInput = (event: Event) => {
      if (!(event.target as HTMLElement | null)?.closest('.clear-inputs') && cleared) {
        setCleared(false);
        // Let React mount the new canvas before editors start their next draw.
        window.setTimeout(() => window.dispatchEvent(new Event('rooms:preview-restored')), 0);
      }
    };
    document.addEventListener('click', onClick);
    document.addEventListener('input', onInput);
    document.addEventListener('change', onInput);
    return () => { document.removeEventListener('click', onClick); document.removeEventListener('input', onInput); document.removeEventListener('change', onInput); };
  }, [cleared]);

  if (cleared) return null;
  return createPortal(
    <section className={`fixed-preview${expanded ? ' is-expanded' : ''}`} aria-label={label}>
      <button className="fixed-preview-toggle" onClick={onToggle} aria-expanded={expanded}>{label} <span aria-hidden="true">{expanded ? '▼' : '▲'}</span></button>
      <div className="fixed-preview-content" aria-hidden={!expanded}>{children}</div>
    </section>,
    document.body,
  );
}
