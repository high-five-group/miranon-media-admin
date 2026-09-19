import { AlertTriangle } from 'lucide-react';

/**
 * [TASK-436] "Basen släpar" — spegelns eftersläpning sagd rakt ut (ADR-128
 * beslut 5: den SYNS I APPEN i stället för att tystas). Flyttad ur inkorgens
 * `RadInnehall` vid andra konsumenten (eventdetaljens "Öppna detaljer",
 * där fliken läser basens spegel medan beloppet läser Postgres — exakt det
 * läge där de två kan säga olika saker). Formen är inkorgens, orörd.
 */
export function BasenSlaparPill() {
  return (
    <span
      className="inline-flex items-center gap-1 rounded border border-transparent bg-bg px-2 py-0.5 text-caption text-text-muted"
      title="Basen har inte hunnit uppdateras än"
    >
      <AlertTriangle aria-hidden size={13} />
      Basen släpar
    </span>
  );
}
