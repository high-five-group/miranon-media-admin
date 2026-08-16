import { ChevronDown } from 'lucide-react';
import { useId, useState } from 'react';
import { InitialAvatar } from '@/components/dev/hem-prototyp/ui';
import type { SimEventGrupp } from './types';

/** Namn-preview-gränsen (samma tal som Åtgärds-sidans `PREVIEW_GRANS`,
    `AtgardsSida.tsx` § `namnPreview` — Pinterest-mönstret, forskningsbelagt
    2026-08-07). Egen, mindre kopia: sändytans preview är ren dekoration utan
    accordion-rummets sr-only-mening (raden nedan bär redan hela listan i
    DOM:en när panelen är öppen). */
const PREVIEW_GRANS = 7;

/**
 * [PROTOTYPE, TASK-241.1] Trygghetstriadens FÖRSTA led — adresslista
 * grupperad per event (ADR-114 beslut 2, tummas aldrig). Varje event är sin
 * egen infälld accordion, samma räknar-rad-grammatik som `MottagarYta`
 * (`AtgardsSida.tsx`): rubriken ÄR knappen, en namn-preview under den när
 * gruppen är stängd, full lista när den är öppen.
 */
export function Adresslista({ eventGrupper }: { eventGrupper: SimEventGrupp[] }) {
  return (
    <div className="flex flex-col gap-3">
      {eventGrupper.map((grupp) => (
        <EventGruppRad key={grupp.eventId} grupp={grupp} />
      ))}
    </div>
  );
}

function EventGruppRad({ grupp }: { grupp: SimEventGrupp }) {
  const [oppen, setOppen] = useState(false);
  const panelId = useId();
  const namn = grupp.mottagare.map((m) => m.namn);
  const pillar = namn.slice(0, PREVIEW_GRANS);
  const rest = namn.length - pillar.length;

  return (
    <div className="rounded-2xl border border-(--mm-navcard-border) bg-surface p-3 contrast-more:border-(--mm-navcard-border-contrast)">
      <button
        type="button"
        aria-expanded={oppen}
        aria-controls={panelId}
        onClick={() => setOppen((v) => !v)}
        className="-mx-1 flex w-auto items-center justify-between gap-4 rounded-lg px-1 py-1.5 text-left hover:bg-bg-emphasized motion-safe:transition-colors"
      >
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-semibold text-body">{grupp.eventNamn}</span>
          <span className="truncate text-caption text-text-muted">
            {grupp.ort} · <span className="tabular-nums">{grupp.mottagare.length}</span> mottagare
          </span>
        </span>
        <ChevronDown
          aria-hidden="true"
          size={18}
          className={`shrink-0 text-text-secondary motion-safe:transition-transform ${
            oppen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {!oppen && namn.length > 0 && (
        <div
          aria-hidden="true"
          className="mt-2 flex flex-wrap items-center gap-1.5 rounded-xl border border-(--mm-navcard-border) bg-bg-muted p-2 contrast-more:border-(--mm-navcard-border-contrast)"
        >
          {pillar.map((n) => (
            <span
              key={n}
              className="inline-flex items-center rounded-full border border-transparent bg-surface px-2 py-0.5 font-medium text-caption text-text-secondary contrast-more:border-border-strong"
            >
              {n}
            </span>
          ))}
          {rest > 0 && <span className="text-caption text-text-muted">och {rest} till</span>}
        </div>
      )}

      <div id={panelId} hidden={!oppen} className="mt-2 flex flex-col divide-y divide-border">
        {grupp.mottagare.map((m) => (
          <div key={m.id} className="flex items-center gap-3 py-2.5">
            <InitialAvatar namn={m.namn} />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-medium text-body">{m.namn}</span>
              <span className="truncate text-caption text-text-muted">
                {m.epost}
                {m.avgiftstyp ? ` · ${m.avgiftstyp}` : ''}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
