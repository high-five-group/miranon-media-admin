import { Link } from '@tanstack/react-router';
import { ChevronRight } from 'lucide-react';
import { relativTid } from '@/components/hem/relativ-tid';
import { InitialAvatar } from '@/components/primitives';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Skeleton } from '@/components/primitives/Skeleton';
import {
  atgardskoText,
  behoverAtgard,
  displayName,
  inskickadTid,
} from '@/components/registrations/registration-display';
import { StatusBadge } from '@/components/registrations/StatusBadge';
import { AnmalningRadResolution } from './AnmalningRadResolution';
import type { VariantProps } from './types';

/**
 * [PROTOTYPE, TASK-299.3] VARIANT B — "Scanlista" (PRD `TASK-299` AC #3:
 * bär personlistans radanatomi med anmälningsdata).
 *
 * Radanatomin är ÄRVD ur `persons/PersonsList.tsx` k13/k14/k15-facitet, INTE
 * uppfunnen: initialcirkel `size-9` (`InitialAvatar`-primitiven, TASK-299.1)
 * · namnet `font-medium text-body` som HELRADS-länk (`after:absolute
 * after:inset-0`-tricket — den synliga länktexten är bara namnet, klickytan
 * är hela raden) · statusen som EGEN kolumn med RESERVERAD plats
 * (`invisible` i stället för villkorad rendering, PersonsList `Pill dold`-
 * tekniken) · chevron 18 px. Samma tonala `divide-y`-lista, INTE fristående
 * kort per rad (PersonsList k03-lås: en scanlista för hundratals rader).
 *
 * ANMÄLNINGSDATAN (i stället för personlistans kontaktrad): undertexten är
 * "N dagar sedan · Eventnamn" (AC #3s exakta citat). Tidsformen ÅTERANVÄNDER
 * `relativTid` (hem/relativ-tid.ts, redan delad av två hem-kort) i stället
 * för en tredje parallell formatterare — samma familj av strängar
 * ("nyss"/"för N tim sedan"/"igår HH:MM"/"för N dagar sedan"), där "N dagar
 * sedan"-formen (AC #3s bokstav) är den som visas för allt äldre än
 * gårdagen. En anmälan yngre än så visar en FINARE relativ tid i stället för
 * "0 dagar sedan" — en avsiktlig, källbelagd precisering av AC #3s exempel,
 * bokförd i slutrapporten.
 *
 * HÖJDLÅSET (DoD #6): namn- och undertextraden RENDERAS ALLTID (aldrig
 * villkorad på om eventNamn/status finns), så radens höjd är en funktion av
 * layouten, aldrig av datan.
 *
 * AC #4 (raden leder till resolutionen, inget separat knappelement):
 * `AnmalningRadResolution` triggas av EXAKT det element som annars hade
 * varit `<Link>`-namnet (`triggerClassName` bär samma `after:absolute
 * after:inset-0`), så den ENDA interaktiva ytan per rad är antingen en
 * riktig länk (OK-rader) eller en riktig knapp (åtgärdsrader) — aldrig
 * båda, aldrig nästlade.
 */
export function VariantB({ rader, lage, isPending, isError, error, nuMs }: VariantProps) {
  if (isPending) {
    return (
      <div role="status" aria-live="polite" aria-busy="true" className="flex flex-col gap-3 p-4">
        <span className="sr-only">Laddar anmälningarna…</span>
        <Skeleton variant="text" className="w-40 text-small" />
        <div className="flex flex-col gap-3 rounded-2xl border border-transparent bg-bg-muted p-4">
          {['a', 'b', 'c'].map((k) => (
            <div key={k} className="flex items-center gap-3">
              <Skeleton variant="text" className="size-9 shrink-0 rounded-full" />
              <div className="flex flex-1 flex-col gap-1">
                <Skeleton variant="text" className="w-2/5" />
                <Skeleton variant="text" className="w-3/5 text-small" />
              </div>
            </div>
          ))}
        </div>
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
        <ul
          aria-label="Anmälningar"
          className="divide-y divide-border rounded-2xl border border-transparent bg-bg-muted px-4 contrast-more:border-border-strong"
        >
          {rader.map((reg) => {
            const namn = displayName(reg);
            const tid = inskickadTid(reg);
            const relTid = Number.isFinite(tid) ? relativTid(tid, nuMs) : null;
            const eventText = reg.eventId ? reg.eventNamn : 'Utan event';
            const undertext = [relTid, eventText].filter(Boolean).join(' · ') || ' ';
            const behoverKoppling = behoverAtgard(reg);
            const namnKlass =
              'min-w-0 truncate font-medium text-body underline-offset-2 after:absolute after:inset-0 hover:underline';

            // Triggerns cva-bas (Button.tsx) lägger `inline-flex`/padding/
            // min-höjd/bakgrund för sin `md`-standardstorlek — samtliga
            // neutraliseras här (tailwind-merge löser konflikten, `cn`
            // applicerar `className` SIST) så knappen läser som radens
            // vanliga namn-länk, inte som en knapp-pill.
            const namnTriggerKlass = `min-h-0 justify-start gap-0 rounded-none p-0 hover:bg-transparent data-[hovered]:bg-transparent data-[pressed]:bg-transparent ${namnKlass}`;

            const namnElement = behoverKoppling ? (
              <AnmalningRadResolution registration={reg} triggerClassName={namnTriggerKlass}>
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
              // Kan inte inträffa i praktiken (UTAN_EVENT ⇒ behoverAtgard),
              // men golvet är explicit: aldrig en död länk.
              <span className="min-w-0 truncate font-medium text-body">{namn}</span>
            );

            return (
              <li key={reg.id} className="relative flex items-center gap-3 py-2.5">
                <InitialAvatar namn={namn} />
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex min-w-0 items-center gap-2">{namnElement}</div>
                  <span className="truncate text-caption text-text-muted">{undertext}</span>
                </div>
                {/* Statuskolumnen — EGEN kolumn, RESERVERAD plats (AC #3 +
                    DoD #6). Ikon+ord, aldrig färg ensam (AC #5). */}
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
      )}
    </div>
  );
}
