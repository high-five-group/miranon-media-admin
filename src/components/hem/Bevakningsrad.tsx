import { ChevronRight } from 'lucide-react';
import { type BevakningRad, bevakningDagarText, bevakningStatusText } from './hem-derivations';

/**
 * Bevakningsraden (ORDLISTA.md "Bevakningsrad") — Morgonkollens yta för
 * sällsynta men tidskritiska härledda uppgifter (TASK-243.1, promoverad ur
 * `dev/hem-prototyp/VariantRo.tsx` BevakningsRadItem, S102 Del 10 beslut
 * 2–4). HELT OSYNLIG vid noll träffar — ingen wrapper, ingen rubrik, inget
 * kvitto (till skillnad från block, som alltid står kvar med positivt
 * kvitto vid noll) — asymmetrin är Marcus-låst.
 *
 * En RIKTIG `<button>` utan `onPress`: sändflödet finns inte byggt än
 * (svep-PRD:n task-241) — samma no-op-mönster som bulk-knapparna
 * (`BulkAtgardsknapp.tsx`), men UTAN den knappens disabled-semantik: raden
 * leder framåt (chevron) mot en framtida destination, den utför inget
 * skarpt just nu.
 */
export function Bevakningsrad({ rader }: { rader: BevakningRad[] }) {
  if (rader.length === 0) return null;
  return (
    <ul aria-label="Bevakningar" className="flex min-w-0 flex-col gap-2">
      {rader.map((rad) => (
        <BevakningsradRad key={rad.event.id} rad={rad} />
      ))}
    </ul>
  );
}

function BevakningsradRad({ rad }: { rad: BevakningRad }) {
  const status = bevakningStatusText(rad);
  return (
    <li>
      <button
        type="button"
        className="text-(color:--mm-navcard-text) flex min-h-12 w-full items-center gap-3 rounded-2xl border border-(--mm-navcard-border) bg-(--mm-navcard-bg) px-4 py-3 text-left hover:bg-bg-emphasized motion-safe:transition-colors contrast-more:border-(--mm-navcard-border-contrast)"
      >
        {/* line-clamp-2 i stället för truncate — en lång rad bryter till max
            två rader i stället för att klippas med ellipsis mitt i ett ord
            (Gunilla-principen: en klippt mening är obegriplig). */}
        <span className="line-clamp-2 min-w-0 flex-1 text-body">
          <span className="font-semibold">{rad.eventNamn}</span>
          {` · ${bevakningDagarText(rad.dagarTillStart)} · ${status}`}
        </span>
        <ChevronRight
          aria-hidden="true"
          size={18}
          className="text-(color:--mm-navcard-icon) shrink-0"
        />
      </button>
    </li>
  );
}
