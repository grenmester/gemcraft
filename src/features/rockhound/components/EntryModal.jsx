import { useEffect, useRef } from 'react';

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/** Shared layout primitives so every entry modal reads the same. */
export function Row({ label, children }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1">
      <span className="text-xs uppercase tracking-wide text-slate-500">{label}</span>
      <span className="text-sm text-slate-200 text-right">{children}</span>
    </div>
  );
}

export function Section({ title, children }) {
  return (
    <section className="border-t border-slate-700 px-5 py-3">
      <h4 className="mb-1 text-xs font-bold uppercase tracking-wider text-yellow-400">{title}</h4>
      {children}
    </section>
  );
}

/**
 * The dialog shell every entry modal shares: backdrop dismissal, Escape,
 * a labelled dialog, focus moved in on open and returned to the opener on
 * close, and Tab kept inside while open.
 */
export default function EntryModal({ titleId, onClose, children }) {
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const opener = document.activeElement;
    closeRef.current?.focus();

    const onKey = (e) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('keydown', onKey);
      // Return focus where the player left it rather than dumping it on <body>.
      if (opener instanceof HTMLElement && document.contains(opener)) opener.focus();
    };
    // Empty deps: this mount effect runs exactly once (and cleans up on
    // unmount only). Callers pass a fresh inline onClose on every render, so
    // keying this effect on it would re-run per render and re-steal focus;
    // onCloseRef is kept current above and Escape reads from it instead.
  }, []);

  const trapTab = (e) => {
    if (e.key !== 'Tab') return;
    const focusable = [...(dialogRef.current?.querySelectorAll(FOCUSABLE) ?? [])];
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || !dialogRef.current.contains(active))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && (active === last || !dialogRef.current.contains(active))) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={trapTab}
        className="my-8 w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-600 bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeRef}
          type="button"
          aria-label="Close entry"
          onClick={onClose}
          className="float-right px-3 pt-3 text-xl leading-none text-slate-400 hover:text-white"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}
