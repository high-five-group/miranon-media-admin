import { ChevronDown } from 'lucide-react';
import { useId, useState } from 'react';
import type { SimEventGrupp } from './types';

/** Namn-preview-gränsen (samma tal som Åtgärds-sidans `PREVIEW_GRANS`,
    `AtgardsSida.tsx:331` — Pinterest-mönstret, forskningsbelagt 2026-08-07). */
const PREVIEW_GRANS = 7;

/**
 * [PROTOTYPE, TASK-241.1] Trygghetstriadens FÖRSTA led — adresslista
 * grupperad per event (ADR-114 beslut 2, tummas aldrig).
 *
 * VARV 2 — EN VISUELL NIVÅ (Marcus-fynd 3, varv 1 underkänt). Varv 1 staplade
 * TRE inramningar på varandra: `DetaljGrupp`s kort (`bg-bg-muted`) → en egen
 * `rounded-2xl border bg-surface`-platta per event → ytterligare en
 * `rounded-xl border bg-bg-muted`-platta runt namn-chipsen. Åtgärds-sidans
 * granskningsvy har som mest TVÅ (`AtgardsSida.tsx:2583-2600`), och husets
 * `DetaljGrupp` bär redan avdelarna själv
 * (`DetaljGrupp.tsx:31` — `divide-y divide-border`).
 *
 * Grupperna returneras därför som ett FRAGMENT av rena sektioner utan egen
 * ram eller bakgrund, monterade som DIREKTA barn till `DetaljGrupp` — då
 * faller husets `divide-y` mellan dem av sig själv, precis som mellan
 * Ämne/Bilagor/Testmail-raderna på Åtgärds-sidan. Namnen är husets egen
 * pill-form (`AtgardsSida.tsx:690-692`, verbatim klasser) DIREKT i
 * sektionen.
 *
 * Avataren är BORTTAGEN i varv 2: Åtgärds-sidans granskningsvy har ingen
 * (`AtgardsSida.tsx:658-699` — namn + e-post, ingen avatar), och den var
 * dessutom prototypens enda import ur `hem-prototyp/ui.tsx`. Ett
 * rivningsberoende färre inför `task-243.5`.
 */
export function Adresslista({ eventGrupper }: { eventGrupper: SimEventGrupp[] }) {
  return (
    <>
      {eventGrupper.map((grupp) => (
        <EventGruppSektion key={grupp.eventId} grupp={grupp} />
      ))}
    </>
  );
}

function EventGruppSektion({ grupp }: { grupp: SimEventGrupp }) {
  const [oppen, setOppen] = useState(false);
  const panelId = useId();
  const namn = grupp.mottagare.map((m) => m.namn);
  const pillar = namn.slice(0, PREVIEW_GRANS);
  const rest = namn.length - pillar.length;

  return (
    <div className="py-3">
      {/* RUBRIKEN ÄR KNAPPEN — `MottagarYta`-grammatiken (`AtgardsSida.tsx:908-913`):
          eventnamnet fet, ort och antal som dämpad caption under. */}
      <button
        type="button"
        aria-expanded={oppen}
        aria-controls={panelId}
        onClick={() => setOppen((v) => !v)}
        className="-mx-2 flex w-[calc(100%+1rem)] items-center justify-between gap-4 rounded-lg px-2 py-1 text-left hover:bg-bg-emphasized motion-safe:transition-colors"
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

      {/* STÄNGD: namnen direkt i sektionen, ingen inramad platta omkring.
          Pill-formen är Åtgärds-sidans egen (`AtgardsSida.tsx:690-692`). */}
      {!oppen && namn.length > 0 && (
        <div aria-hidden="true" className="mt-2 flex flex-wrap items-center gap-1.5">
          {pillar.map((n) => (
            <span
              key={n}
              className="rounded-full bg-surface px-2 py-0.5 font-medium text-caption text-text-secondary contrast-more:border contrast-more:border-border-strong"
            >
              {n}
            </span>
          ))}
          {rest > 0 && <span className="text-caption text-text-muted">och {rest} till</span>}
        </div>
      )}

      {/* ÖPPEN: personlistans radgrammatik — namn + e-post, tunna avdelare. */}
      <div id={panelId} hidden={!oppen} className="mt-1 flex flex-col divide-y divide-border">
        {grupp.mottagare.map((m) => (
          <div key={m.id} className="flex min-w-0 flex-col gap-0.5 py-2">
            <span className="truncate font-medium text-body">{m.namn}</span>
            <span className="truncate text-caption text-text-muted">
              {m.epost}
              {m.avgiftstyp ? ` · ${m.avgiftstyp}` : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
