import { Link } from '@tanstack/react-router';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Skeleton } from '@/components/primitives/Skeleton';
import {
  atgardskoText,
  behoverAtgard,
  displayName,
  inskickadDatum,
} from '@/components/registrations/registration-display';
import { StatusBadge } from '@/components/registrations/StatusBadge';
import { AnmalningRadResolution } from './AnmalningRadResolution';
import type { VariantProps } from './types';

/**
 * [PROTOTYPE, TASK-299.3] VARIANT A — "Idag" (AC #1: utgångsläget är en
 * EXAKT KOPIA av nuvarande `/mer/anmalningar`, aldrig ett tomt blad).
 *
 * Markup, ordval, klasser och tillstånd (laddar/fel/tomt/lista) är en
 * verbatim kopia av `registrations/AnmalningarList.tsx` — samma tonala
 * ETT-KORT-PER-RAD-lista, samma skelett, samma copy. Skillnaden mot
 * originalet är UTESLUTANDE datakällan (props i stället för egen
 * `useQuery`+`visaAtgardskon`, eftersom routen hämtar en gång och delar med
 * alla tre varianter, ADR-074/hem-prototyp-precedentet) OCH resolutionens
 * BÄRARE (AC #4, "I VARJE variant leder en rad … inget separat
 * knappelement" — den gamla fristående `KopplaTillEventDialog`-knappen
 * UNDER kortet är ersatt av `AnmalningRadResolution`, som gör HELA raden
 * till triggern) OCH höjdlåset (DoD #6 — statusbadgen reserverar sin plats
 * med `invisible` i stället för villkorad rendering, så kortets höjd inte
 * längre beror på om raden bär en "Avviker"-badge). Det är de TVÅ enda
 * avsiktliga avvikelserna från en bokstavlig kopia — öppet bokförda i
 * slutrapporten, eftersom AC #4/DoD #6 annars hade stått i strid med AC #1
 * för just denna variant.
 *
 * Tillbaka-länken ("← Tillbaka till Mer") bor på ROUTEN, delad av alla tre
 * varianter — se `routes/dev/anmalningar-prototyp.tsx`. Fokusflytt till
 * `<h1>` vid datalandning (produktionens facit) är MEDVETET UTELÄMNAD här:
 * en dev-prototyps jobb är att visa PRESENTATIONEN, inte att bevisa
 * a11y-mekanik som redan är byggd och testad i den skarpa
 * `AnmalningarList.tsx` — den riktiga konvergensen (TASK-299.4) återinför
 * den för den vinnande formen. Statusrollen/`aria-live`/`role=alert`
 * (DoD #5s axe-golv) ÄR med i alla tre, eftersom de faktiskt påverkar
 * axe-resultatet.
 */
export function VariantA({ rader, lage, isPending, isError, error }: VariantProps) {
  if (isPending) {
    return (
      <div role="status" aria-live="polite" aria-busy="true" className="flex flex-col gap-4 p-4">
        <span className="sr-only">Laddar anmälningarna…</span>
        <div className="flex flex-col gap-1">
          <Skeleton variant="text" className="w-32 text-2xl" />
          <Skeleton variant="text" className="w-24 text-small" />
        </div>
        <div className="flex flex-col gap-2">
          {['a', 'b', 'c'].map((k) => (
            <div
              key={k}
              className="flex flex-col gap-0.5 rounded-2xl border border-transparent bg-bg-muted p-4"
            >
              <Skeleton variant="text" className="w-2/5" />
              <Skeleton variant="text" className="w-3/5 text-small" />
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
        <ul aria-label="Anmälningar" className="flex flex-col gap-2">
          {rader.map((reg) => {
            const datum = inskickadDatum(reg);
            const kortYta =
              'flex break-inside-avoid flex-col gap-0.5 rounded-2xl border border-transparent bg-bg-muted p-4 contrast-more:border-border-strong print:border-border-strong';
            const behoverKoppling = behoverAtgard(reg);
            const innehall = (
              <>
                <span className="font-medium group-hover:underline">{displayName(reg)}</span>
                <span className="text-small text-text-muted">
                  {reg.eventId
                    ? [reg.eventNamn, datum].filter(Boolean).join(' · ') || 'Uppgift saknas'
                    : ['Utan event', datum].filter(Boolean).join(' · ')}
                </span>
                {/* Höjdlåset (DoD #6): badgen RENDERAS ALLTID och döljs med
                    `invisible` när raden inte avviker — aldrig villkorad
                    rendering. Annars varierar kortets höjd med statusen,
                    exakt det förbudet gäller (samma teknik som
                    `PersonsList.tsx`s `Pill dold`-breddlås). */}
                <span
                  className={`mt-0.5 self-start ${reg.eventmatchning === 'Avviker' ? '' : 'invisible'}`}
                  aria-hidden={reg.eventmatchning === 'Avviker' ? undefined : true}
                >
                  <StatusBadge ton="warning" storlek="sm">
                    Avviker från eventet
                  </StatusBadge>
                </span>
              </>
            );
            return (
              <li key={reg.id} className="flex flex-col items-start gap-1.5">
                {behoverKoppling ? (
                  <AnmalningRadResolution registration={reg}>
                    <span className={`group ${kortYta}`}>{innehall}</span>
                  </AnmalningRadResolution>
                ) : reg.eventId ? (
                  <Link
                    to="/event/$eventId/anmalda"
                    params={{ eventId: reg.eventId }}
                    className={`group ${kortYta}`}
                  >
                    {innehall}
                  </Link>
                ) : (
                  <div className={kortYta}>{innehall}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
