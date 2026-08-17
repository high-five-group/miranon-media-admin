import { ChevronDown } from 'lucide-react';
import { useId, useState } from 'react';
import { displayName } from '@/components/registrations/registration-display';
import type { SvepEventGrupp } from './types';

/** Namn-preview-gränsen (samma tal som Åtgärds-sidans `PREVIEW_GRANS`,
    `AtgardsSida.tsx` — Pinterest-mönstret, forskningsbelagt 2026-08-07). */
const PREVIEW_GRANS = 7;

/**
 * [TASK-241.2] Trygghetstriadens FÖRSTA led — adresslista grupperad per
 * event (ADR-114 beslut 2, tummas aldrig), kopplad mot VERKLIG data
 * (AC #2). PROMOVERAD ur prototypens `dev/svep-prototyp/Adresslista.tsx`
 * (TASK-241.1 konvergensvarv 2, Marcus-godkänd — se facit-manifestet).
 * Formen är BYTE-IDENTISK med prototypens (samma klasser, samma
 * accordion-grammatik, samma en-visuell-nivå-regel); den enda ändringen är
 * datakällan: `Registration`/`displayName` i stället för prototypens egna
 * `SimMottagare`. `avgiftstyp`-suffixet i prototypens rad-grammatik utelämnas
 * här AVSIKTLIGT — bekräftelsesvepets facit-mottagare bär ingen avgiftstyp
 * (den hör till påminnelseformen, TASK-241.4:s scope).
 */
export function Adresslista({ eventGrupper }: { eventGrupper: SvepEventGrupp[] }) {
  return (
    <>
      {eventGrupper.map((grupp) => (
        <EventGruppSektion key={grupp.event.id} grupp={grupp} />
      ))}
    </>
  );
}

function EventGruppSektion({ grupp }: { grupp: SvepEventGrupp }) {
  const [oppen, setOppen] = useState(false);
  const panelId = useId();
  const pillar = grupp.mottagare.slice(0, PREVIEW_GRANS);
  const rest = grupp.mottagare.length - pillar.length;
  const eventNamn = grupp.event.eventNamn ?? grupp.event.eventlabel ?? 'Namnlöst event';

  return (
    <div className="py-3">
      {/* RUBRIKEN ÄR KNAPPEN — `MottagarYta`-grammatiken (`AtgardsSida.tsx`):
          eventnamnet fet, ort och antal som dämpad caption under. */}
      <button
        type="button"
        aria-expanded={oppen}
        aria-controls={panelId}
        onClick={() => setOppen((v) => !v)}
        className="-mx-2 flex w-[calc(100%+1rem)] items-center justify-between gap-4 rounded-lg px-2 py-1 text-left hover:bg-bg-emphasized motion-safe:transition-colors"
      >
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-semibold text-body">{eventNamn}</span>
          <span className="truncate text-caption text-text-muted">
            {grupp.event.ort} · <span className="tabular-nums">{grupp.mottagare.length}</span>{' '}
            mottagare
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

      {/* STÄNGD: namnen direkt i sektionen, ingen inramad platta omkring.
          Pill-formen är Åtgärds-sidans egen (`AtgardsSida.tsx`). Nycklas på
          `m.id` (INTE namnet, som prototypens fixtur kunde göra riskfritt
          — riktig data kan bära dubblettnamn). */}
      {!oppen && pillar.length > 0 && (
        <div aria-hidden="true" className="mt-2 flex flex-wrap items-center gap-1.5">
          {pillar.map((m) => (
            <span
              key={m.id}
              className="rounded-full bg-surface px-2 py-0.5 font-medium text-caption text-text-secondary contrast-more:border contrast-more:border-border-strong"
            >
              {displayName(m)}
            </span>
          ))}
          {rest > 0 && <span className="text-caption text-text-muted">och {rest} till</span>}
        </div>
      )}

      {/* ÖPPEN: personlistans radgrammatik — namn + e-post, tunna avdelare. */}
      <div id={panelId} hidden={!oppen} className="mt-1 flex flex-col divide-y divide-border">
        {grupp.mottagare.map((m) => (
          <div key={m.id} className="flex min-w-0 flex-col gap-0.5 py-2">
            <span className="truncate font-medium text-body">{displayName(m)}</span>
            <span className="truncate text-caption text-text-muted">{m.email}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
