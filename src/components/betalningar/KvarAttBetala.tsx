import { CircleCheck } from 'lucide-react';
import { visaKronor } from './belopp-inmatning';

/**
 * [TASK-436] "Kvar att betala" som VIKTAD RAD, med sina två lugna lägen —
 * ETT block, delat av anmälans detaljvy (`AnmalansBetalningar`) och
 * eventdetaljens "Öppna detaljer" (en rad per person).
 *
 * Formen och orden är `AnmalansBetalningar.tsx`s (TASK-346.14 designfynd
 * 3a/3b, ordvalet 2026-09-01, nolläget S120/TASK-391) — flyttade hit vid
 * andra konsumenten, inte omskrivna (ADR-126). Läs den filens docblock §
 * "KVAR ATT BETALA" SOM VIKTAD RAD för hela resonemanget: bara det FAKTISKT
 * öppna beloppet får radstrukturens vikt; de två lugna lägena är enkel text.
 *
 * `saknas === null` betyder "basen vet inte" — aldrig haft pris, eller helt
 * betald, ovisst vilket. Vet callern MER än så (eventdetaljen känner
 * eventets pris) säger den det på sin egen nivå, en gång, i stället för att
 * upprepa det per rad — se `detail/Betalningar.tsx` § PRISET SAKNAS.
 */
export function KvarAttBetala({ saknas }: { saknas: number | null }) {
  if (saknas === null) {
    return <p className="text-small text-text-muted">Inget att betala.</p>;
  }
  if (saknas > 0) {
    return (
      <div className="flex items-center justify-between gap-4 py-1">
        <span className="text-small text-text-muted">Kvar att betala</span>
        <span className="text-right font-semibold text-body">{`${visaKronor(saknas)} kr`}</span>
      </div>
    );
  }
  return (
    <p className="flex items-center gap-2 text-small text-text-secondary">
      <CircleCheck aria-hidden="true" size={16} className="shrink-0 text-success" />
      Allt betalt.
    </p>
  );
}
