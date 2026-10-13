import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

type Props = { label?: string; expanded: boolean; onToggle: () => void; children: ReactNode };

export default function FixedPreview({ label = 'プレビュー', expanded, onToggle, children }: Props) {
  return createPortal(
    <section className={`fixed-preview${expanded ? ' is-expanded' : ''}`} aria-label={label}>
      <button className="fixed-preview-toggle" onClick={onToggle} aria-expanded={expanded}>{label} <span aria-hidden="true">{expanded ? '▼' : '▲'}</span></button>
      <div className="fixed-preview-content" aria-hidden={!expanded}>{children}</div>
    </section>,
    document.body,
  );
}
