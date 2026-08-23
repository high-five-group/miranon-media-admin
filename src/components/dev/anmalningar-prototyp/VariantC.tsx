import { Link } from '@tanstack/react-router';
import { ChevronRight } from 'lucide-react';
import { useMemo } from 'react';
import { relativTid } from '@/components/hem/relativ-tid';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Skeleton } from '@/components/primitives/Skeleton';
import {
  atgardskoText,
  behoverAtgard,
  displayName,
  inskickadTid,
} from '@/components/registrations/registration-display';
import { StatusBadge } from '@/components/registrations/StatusBadge';
import type { Registration } from '@/domain/models/Registration';
import { AnmalningRadResolution } from './AnmalningRadResolution';
import type { VariantProps } from './types';

interface Grupp {
  nyckel: string;
  rubrik: string;
  rader: Registration[];
}

/**
 * Grupperar på anmälans EGET `eventNamn` (vad anmälan CLAIMAR, inte det
 * länkade eventets facit — samma fält `KopplaTillEventDialog.tsx` visar
 * under "Anmälan säger:") — ingen ny EF, inget join mot eventlistan (PRD
 * beslut 12: datavägen är oförändrad). Grupper senaste-anmälan-först,
 * "Utan event" alltid sist (samma sentinel-position som basens övriga
 * namnlösa hinkar).
 */
function grupperaPaEvent(rader: Registration[]): Grupp[] {
  const kartor = new Map<string, Registration[]>();
  for (const reg of rader) {
    const nyckel = reg.eventId ? (reg.eventNamn ?? 'Namnlöst event') : 'Utan event';
    const lista = kartor.get(nyckel);
    if (lista) lista.push(reg);
    else kartor.set(nyckel, [reg]);
  }
  const grupper: Grupp[] = Array.from(kartor.entries()).map(([nyckel, gruppRader]) => ({
    nyckel,
    rubrik: nyckel,
    rader: gruppRader,
  }));
  grupper.sort((a, b) => {
    if (a.nyckel === 'Utan event') return 1;
    if (b.nyckel === 'Utan event') return -1;
    return inskickadTid(b.rader[0]) - inskickadTid(a.rader[0]);
  });
  return grupper;
}

/**
 * [PROTOTYPE, TASK-299.3] VARIANT C — "Grupperad efter event". Radikalt
 * annan INFORMATIONSHIERARKI mot A (platt kortlista) och B (platt
 * scanlista): anmälningarna delas upp i sektioner per event Lotta kan
 * skanna kurs för kurs, i stället för en enda lång tidslinje. Detta är den
 * primära skillnaden mot variant B, som redan bär personlistans radanatomi
 * (AC #3) — C testar en helt annan gruppering/primär-handling i stället för
 * att nyansera samma lista (T66/UI.md: "radikalt olika … inte tre nyanser").
 *
 * Varje sektion är en egen namngiven lista (`aria-label={rubrik}`), samma
 * tonala `divide-y`-form som variant B men UTAN initialcirkel (grupperingen
 * på event gör den identiteten mindre central — namnet och tiden bär raden).
 *
 * AC #4/#5/DoD #6 gäller identiskt: raden är sin egen trigger (länk ELLER
 * `AnmalningRadResolution`, aldrig båda), statuskolumnen reserverar sin
 * plats (ikon+ord), och rad-höjden är oberoende av statusen.
 */
export function VariantC({ rader, lage, isPending, isError, error, nuMs }: VariantProps) {
  const grupper = useMemo(() => grupperaPaEvent(rader), [rader]);

  if (isPending) {
    return (
      <div role="status" aria-live="polite" aria-busy="true" className="flex flex-col gap-3 p-4">
        <span className="sr-only">Laddar anmälningarna…</span>
        <Skeleton variant="text" className="w-40 text-small" />
        {['a', 'b'].map((k) => (
          <div key={k} className="flex flex-col gap-2">
            <Skeleton variant="text" className="w-1/3 text-small" />
            <div className="flex flex-col gap-2 rounded-2xl border border-transparent bg-bg-muted p-4">
              <Skeleton variant="text" className="w-2/5" />
              <Skeleton variant="text" className="w-3/5 text-small" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4">
        <MessageBox intent="error" title="Kunde inte hämta anmälningarna">
          {error instanceof Error ? error.message : 'Inget felmeddelande angavs.'}
        </MessageBox>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <p className="sr-only" role="status" aria-live="polite">
        Anmälningarna laddade.
      </p>

      <header className="flex flex-col gap-1">
        <h1 className="font-semibold text-2xl">Anmälningar</h1>
        <p className="text-small text-text-muted">
          {lage === 'atgardskon'
            ? atgardskoText(rader.length)
            : `${rader.length} ${rader.length === 1 ? 'anmälan' : 'anmälningar'}`}
        </p>
      </header>

      {rader.length === 0 ? (
        <p className="text-small text-text-muted">
          {lage === 'atgardskon' ? 'Inga anmälningar behöver kopplas om.' : 'Inga anmälningar än.'}
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          {grupper.map((grupp) => (
            <section key={grupp.nyckel} className="flex flex-col gap-1.5">
              <h2 className="px-1 font-semibold text-small text-text-secondary">
                {grupp.rubrik}
                <span className="ml-1.5 font-normal text-text-muted">({grupp.rader.length})</span>
              </h2>
              <ul
                aria-label={grupp.rubrik}
                className="divide-y divide-border rounded-2xl border border-transparent bg-bg-muted px-4 contrast-more:border-border-strong"
              >
                {grupp.rader.map((reg) => {
                  const namn = displayName(reg);
                  const tid = inskickadTid(reg);
                  const relTid = Number.isFinite(tid) ? relativTid(tid, nuMs) : ' ';
                  const behoverKoppling = behoverAtgard(reg);
                  const namnKlass =
                    'min-w-0 truncate font-medium text-body underline-offset-2 after:absolute after:inset-0 hover:underline';
                  const triggerKlass = `min-h-0 justify-start gap-0 rounded-none p-0 hover:bg-transparent data-[hovered]:bg-transparent data-[pressed]:bg-transparent ${namnKlass}`;

                  const namnElement = behoverKoppling ? (
                    <AnmalningRadResolution registration={reg} triggerClassName={triggerKlass}>
                      {namn}
                    </AnmalningRadResolution>
                  ) : reg.eventId ? (
                    <Link
                      to="/event/$eventId/anmalda"
                      params={{ eventId: reg.eventId }}
                      className={namnKlass}
                    >
                      {namn}
                    </Link>
                  ) : (
                    <span className="min-w-0 truncate font-medium text-body">{namn}</span>
                  );

                  return (
                    <li key={reg.id} className="relative flex items-center gap-3 py-2.5">
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex min-w-0 items-center gap-2">{namnElement}</div>
                        <span className="truncate text-caption text-text-muted">{relTid}</span>
                      </div>
                      <span
                        className={`shrink-0 ${behoverKoppling ? '' : 'invisible'}`}
                        aria-hidden={behoverKoppling ? undefined : true}
                      >
                        <StatusBadge ton="warning" storlek="sm">
                          Behöver kopplas
                        </StatusBadge>
                      </span>
                      <ChevronRight
                        aria-hidden="true"
                        size={18}
                        className="shrink-0 text-text-secondary"
                      />
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
