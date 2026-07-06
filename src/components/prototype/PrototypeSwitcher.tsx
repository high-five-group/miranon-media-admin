import { useEffect } from 'react';

/**
 * [PROTOTYPE] Flytande variantväxlare — delad av UI-prototyper (underform A/B,
 * prototype-skillen S47 Del 13). Kastbar kod under throwaway-kontraktet; raderas
 * när prototyp-frågan är besvarad.
 *
 * Hög kontrast + skugga så raden uppenbart INTE är del av designen som
 * utvärderas. Piltangenter ←/→ växlar (loopar), men aldrig när input/textarea/
 * contenteditable har fokus. Placeras ovanför tabbaren (bottom-20).
 *
 * Återställd verbatim ur divergens-passets `bf705f2` (S52) för T65:s
 * konvergens-pass (S55) — återupplivningsvägen per prototype-skillen.
 */
export function PrototypeSwitcher({
  variants,
  current,
  label,
  onChange,
}: {
  variants: readonly string[];
  current: string;
  label: string;
  onChange: (variant: string) => void;
}) {
  const idx = Math.max(0, variants.indexOf(current));
  const prev = variants[(idx - 1 + variants.length) % variants.length];
  const next = variants[(idx + 1) % variants.length];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const t = e.target;
      if (
        t instanceof HTMLElement &&
        (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)
      ) {
        return;
      }
      onChange(e.key === 'ArrowLeft' ? prev : next);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prev, next, onChange]);

  if (!import.meta.env.DEV) return null;

  return (
    <div className="text-(color:--mm-btn-primary-text) fixed bottom-20 left-4 z-50 flex items-center gap-1 rounded-full bg-(--mm-btn-primary-bg) py-1 pr-4 pl-1 shadow-xl">
      <button
        type="button"
        aria-label="Föregående variant"
        onClick={() => onChange(prev)}
        className="flex size-9 items-center justify-center rounded-full hover:bg-(--mm-btn-primary-hover)"
      >
        <span aria-hidden="true">←</span>
      </button>
      <button
        type="button"
        aria-label="Nästa variant"
        onClick={() => onChange(next)}
        className="flex size-9 items-center justify-center rounded-full hover:bg-(--mm-btn-primary-hover)"
      >
        <span aria-hidden="true">→</span>
      </button>
      <span className="whitespace-nowrap font-medium text-small">{label}</span>
    </div>
  );
}
