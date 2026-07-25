import { Copy } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/**
 * [BIBLIOTEKS-KANDIDAT] IdChip — mutat mono-ID-chip med klick-kopiering
 * (task-18.17 byggkrav 9; Stripe-idiomet: tekniska identiteter synliga men
 * nedtonade, kopierbara). Nyskriven mot facit (throwaway-kontraktet);
 * promoveras till primitives/ vid andra konsumenten.
 *
 * A11y (11): ID:t är TEXT (kopierbar även utan knappen — AT-golvet, byggkrav
 * 13); knappens tillgängliga namn är `${kopieraEtikett}: ${id}` (aldrig bara
 * "kopiera"); utfallet annonseras i en sr-only role="status"-region OCH
 * visuellt ("Kopierat!"). Saknas Clipboard-API:t (osäker kontext) uteblir
 * feedbacken — ID:t står kvar markerbart, aldrig en död affordans som ljuger.
 * motion-safe på färgövergången (prefers-reduced-motion respekteras).
 */
export function IdChip({
  id,
  kopieraEtikett = 'Kopiera ID',
}: {
  /** Identiteten som visas och kopieras (mono, mutad). */
  id: string;
  /** Sr-etikett för kopierings-handlingen (t.ex. "Kopiera formulär-ID"). */
  kopieraEtikett?: string;
}) {
  const [kopierad, setKopierad] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Städa timern vid unmount — en setState efter unmount är en läcka (11 teknik).
  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const kopiera = () => {
    navigator.clipboard
      ?.writeText(id)
      .then(() => {
        setKopierad(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setKopierad(false), 1600);
      })
      // Nekad clipboard-permission (F4): ingen feedback-flip — ID:t står
      // kvar som markerbar text (AT-golvet); en unhandled rejection vore
      // felet, inte avsaknaden av "Kopierat!".
      .catch(() => {});
  };

  return (
    <button
      type="button"
      onClick={kopiera}
      aria-label={`${kopieraEtikett}: ${id}`}
      className="inline-flex items-center gap-1.5 rounded-md border border-transparent bg-surface px-2 py-0.5 font-mono text-caption text-text-muted hover:bg-bg-emphasized motion-safe:transition-colors contrast-more:border-border-strong"
    >
      {kopierad ? 'Kopierat!' : id}
      <Copy aria-hidden="true" size={12} className="shrink-0" />
      <span role="status" className="sr-only">
        {kopierad ? 'Kopierat till urklipp' : ''}
      </span>
    </button>
  );
}
