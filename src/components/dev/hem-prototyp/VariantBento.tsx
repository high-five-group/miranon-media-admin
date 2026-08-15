import { Link } from '@tanstack/react-router';
import { CalendarDays, CircleCheck, MapPin, ReceiptText } from 'lucide-react';
import { useMemo } from 'react';
import { useAuth } from '@/auth/useAuth';
import { MessageBox, Skeleton } from '@/components/primitives';
import { kursfargForKurs } from '@/lib/kursfarg';
import {
  belaggningAndel,
  dagarKvarText,
  dagsStart,
  eventsById,
  forfallnaBetalningar,
  fornamn,
  obekraftadeAnmalningar,
  velNastaEvent,
} from './data';
import type { VariantProps } from './types';
import { DodIngang, Genvagar, InitialAvatar, SenasteAktivitetKompakt } from './ui';

/**
 * [PROTOTYPE, TASK-226] V3 "Bento" — asymmetrisk kortmosaik, nästa event som
 * hero med kursfärgs-accent, tonala ytor ur tolvstegsskalorna, framträdande
 * initial-avatarer. WOW = SKÖNHET.
 *
 * Identitetens medel: EN CSS-grid (`lg:grid-cols-3`) där brickornas OLIKA
 * `col-span`/`row-span` skapar asymmetrin — men INGEN `order:`-egenskap
 * någonstans. DOM-ordningen är blockordningen rakt av (task-226 hård ram),
 * så bricka-storleken styr LAYOUTEN, aldrig TAB-/LÄSORDNINGEN. Grid-
 * auto-placement (sparse, webbläsarens default) fyller därför luckorna i
 * samma ordning en skärmläsare redan hör dem i — mosaiken är gratis, inte
 * ett a11y-offer.
 *
 * Tonerna är råa 12-stegsskale-primitiver (`--p-<familj>-2`/`-4`,
 * `primitives.css`) — EN familj per bricka (gold=anmälningar,
 * red=förfallet, sage=genvägar, neutral=hero/aktivitet) läst direkt som
 * literaler i JSX (Tailwind v4 JIT kräver literaler i källan — ingen
 * runtime-konkatenerad klassträng, se `kursfarg.ts`s eget docblock för
 * samma disciplin). Kursfärgs-accenten på hero-brickan är ETT uppslag
 * (`kursfargForKurs`, `src/lib/kursfarg.ts`) — ingen egen namn-matchning.
 */
export function VariantBento({ eventsQuery, registrationsQuery, nuMs }: VariantProps) {
  const { user } = useAuth();
  const namn = user?.displayName ? fornamn(user.displayName) : null;

  const idagStart = useMemo(() => dagsStart(nuMs), [nuMs]);
  const evMap = useMemo(() => eventsById(eventsQuery.data), [eventsQuery.data]);
  const nasta = useMemo(
    () => velNastaEvent(eventsQuery.data, idagStart),
    [eventsQuery.data, idagStart],
  );
  const farg = useMemo(() => (nasta ? kursfargForKurs(nasta.eventNamn) : null), [nasta]);

  const anmalDataPending = registrationsQuery.isPending || eventsQuery.isPending;
  const anmalningar = useMemo(
    () => obekraftadeAnmalningar(registrationsQuery.data, evMap, 5),
    [registrationsQuery.data, evMap],
  );
  const forfallna = useMemo(
    () => forfallnaBetalningar(registrationsQuery.data, evMap, nuMs, 5),
    [registrationsQuery.data, evMap, nuMs],
  );

  const belagda = nasta?.antalAnmalda ?? 0;
  const maxPlatser = nasta?.maxPlatser ?? null;
  const andel = belaggningAndel(belagda, maxPlatser);
  const nastaStatus =
    nasta?.startdatum != null
      ? dagarKvarText(new Date(nasta.startdatum).getTime(), idagStart)
      : null;

  const storAvatar =
    'flex size-11 shrink-0 items-center justify-center rounded-full bg-surface font-semibold text-small text-text';

  return (
    <div className="mx-auto grid min-w-0 max-w-6xl grid-cols-1 gap-4 p-4 pt-6 pb-24 sm:p-6 lg:grid-cols-3 lg:gap-5 lg:pt-10">
      {/* 1. FRI HÄLSNING — ingen platta, full bredd i mosaiken. */}
      <div className="flex flex-col gap-1 lg:col-span-3">
        <h1 className="font-semibold text-3xl">{namn ? `Hej ${namn}` : 'Hej'}</h1>
        <p className="text-body text-text-secondary">Morgonkollen, allt på ett bräde.</p>
      </div>

      {/* 2. NÄSTA EVENT — HERO-brickan, dubbel bredd + dubbel höjd, kursfärgs-
          accent. Status (dagar-kvar) + beläggning. */}
      <section
        aria-labelledby="be-nasta-event"
        className="flex min-w-0 flex-col gap-4 overflow-hidden rounded-3xl border border-transparent bg-(--p-neutral-2) p-6 contrast-more:border-border-strong lg:col-span-2 lg:row-span-2 print:border-border-strong"
      >
        {farg ? (
          <span aria-hidden="true" className={`h-1.5 w-16 rounded-full ${farg.bgClass}`} />
        ) : null}
        <h2
          id="be-nasta-event"
          className="font-medium text-caption text-text-secondary uppercase tracking-wide"
        >
          Nästa event
        </h2>
        {eventsQuery.isPending ? (
          <div role="status" aria-busy="true" className="flex flex-col gap-3">
            <span className="sr-only">Laddar nästa event…</span>
            <Skeleton variant="text" className="w-2/3 text-2xl" />
            <Skeleton variant="text" className="w-1/2" />
            <Skeleton variant="text" className="h-1.5 w-full rounded-full" />
          </div>
        ) : eventsQuery.isError ? (
          <MessageBox intent="error" title="Kunde inte hämta event">
            {eventsQuery.error instanceof Error ? eventsQuery.error.message : 'Okänt fel.'}
          </MessageBox>
        ) : nasta == null ? (
          <p className="text-body text-text-secondary">Inga kommande event.</p>
        ) : (
          <div className="flex flex-1 flex-col justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {farg ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-0.5 text-caption text-text-secondary">
                    <span aria-hidden="true" className={`size-2 rounded-full ${farg.bgClass}`} />
                    {farg.etikett}
                  </span>
                ) : null}
                {nastaStatus ? (
                  <span className="rounded-full bg-surface px-2.5 py-0.5 font-medium text-caption">
                    {nastaStatus}
                  </span>
                ) : null}
              </div>
              <Link
                to="/event/$eventId"
                params={{ eventId: nasta.id }}
                className="font-semibold text-2xl underline-offset-4 hover:underline lg:text-3xl"
              >
                {nasta.eventNamn ?? nasta.eventlabel ?? 'Namnlöst event'}
              </Link>
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-body text-text-secondary">
                {nasta.ort ? (
                  <span className="flex items-center gap-1.5">
                    <MapPin aria-hidden="true" size={16} className="shrink-0" />
                    {nasta.ort}
                  </span>
                ) : null}
                <span className="flex items-center gap-1.5">
                  <CalendarDays aria-hidden="true" size={16} className="shrink-0" />
                  {nasta.startdatum
                    ? new Intl.DateTimeFormat('sv-SE', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      }).format(new Date(nasta.startdatum))
                    : 'Datum ej satt'}
                </span>
              </div>
            </div>
            {maxPlatser != null ? (
              <div className="flex flex-col gap-1.5">
                <span className="text-caption text-text-secondary">
                  {belagda} av {maxPlatser} platser reserverade
                </span>
                <div aria-hidden="true" className="h-1.5 rounded-full bg-surface">
                  <div
                    className="h-full rounded-full bg-primary-muted"
                    style={{ width: `${andel}%` }}
                  />
                </div>
              </div>
            ) : null}
          </div>
        )}
      </section>

      {/* 3. NYA ANMÄLNINGAR — bricka, gold-ton, framträdande avatarer. */}
      <section
        aria-labelledby="be-nya"
        className="flex min-w-0 flex-col gap-3 rounded-3xl border border-transparent bg-(--p-gold-2) p-5 contrast-more:border-border-strong print:border-border-strong"
      >
        <h2 id="be-nya" className="font-semibold text-lg">
          {anmalDataPending ? (
            <Skeleton variant="text" className="w-2/3" />
          ) : (
            `${anmalningar.total} nya att bekräfta`
          )}
        </h2>
        {registrationsQuery.isError ? (
          <MessageBox intent="error" title="Kunde inte hämta anmälningar">
            {registrationsQuery.error instanceof Error
              ? registrationsQuery.error.message
              : 'Okänt fel.'}
          </MessageBox>
        ) : anmalDataPending ? (
          <div role="status" aria-busy="true" className="flex flex-col gap-2">
            <span className="sr-only">Laddar nya anmälningar…</span>
            <Skeleton variant="listRow" />
          </div>
        ) : anmalningar.rows.length === 0 ? (
          <p className="text-small text-text-secondary">Inga anmälningar väntar.</p>
        ) : (
          <ul aria-label="Nya anmälningar att bekräfta" className="flex flex-col gap-1">
            {anmalningar.rows.slice(0, 4).map((rad, i) => (
              <li key={rad.reg.id} className={i > 0 ? 'border-(--p-gold-4) border-t' : undefined}>
                {rad.reg.eventId ? (
                  <Link
                    to="/event/$eventId"
                    params={{ eventId: rad.reg.eventId }}
                    className="group flex items-center gap-3 py-2"
                  >
                    <InitialAvatar namn={rad.namn} className={storAvatar} />
                    <span className="min-w-0 truncate font-medium text-body group-hover:underline">
                      {rad.namn}
                    </span>
                  </Link>
                ) : (
                  <div className="flex items-center gap-3 py-2">
                    <InitialAvatar namn={rad.namn} className={storAvatar} />
                    <span className="min-w-0 truncate font-medium text-body">{rad.namn}</span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        <DodIngang
          label="Bekräfta alla"
          icon={CircleCheck}
          intent="secondary"
          className="mt-auto pt-1"
        />
      </section>

      {/* 4. FÖRFALLNA BETALNINGAR — bricka, röd ton (samma familj som appens
          fel-semantik signalerar brådska, utan att låna Button-primitivens
          `danger`-intent — påminnelsen är ingen destruktiv handling). */}
      <section
        aria-labelledby="be-forfallna"
        className="flex min-w-0 flex-col gap-3 rounded-3xl border border-transparent bg-(--p-red-2) p-5 contrast-more:border-border-strong print:border-border-strong"
      >
        <h2 id="be-forfallna" className="font-semibold text-lg">
          {anmalDataPending ? (
            <Skeleton variant="text" className="w-2/3" />
          ) : (
            `${forfallna.total} förfallna betalningar`
          )}
        </h2>
        {registrationsQuery.isError ? (
          <MessageBox intent="error" title="Kunde inte hämta betalningar">
            {registrationsQuery.error instanceof Error
              ? registrationsQuery.error.message
              : 'Okänt fel.'}
          </MessageBox>
        ) : anmalDataPending ? (
          <div role="status" aria-busy="true" className="flex flex-col gap-2">
            <span className="sr-only">Laddar förfallna betalningar…</span>
            <Skeleton variant="listRow" />
          </div>
        ) : forfallna.rows.length === 0 ? (
          <p className="text-small text-text-secondary">Inga förfallna betalningar.</p>
        ) : (
          <ul aria-label="Förfallna betalningar" className="flex flex-col gap-1">
            {forfallna.rows.slice(0, 4).map((rad, i) => (
              <li
                key={`${rad.reg.id}-${rad.avgiftstyp}`}
                className={i > 0 ? 'border-(--p-red-4) border-t' : undefined}
              >
                <div className="flex items-center gap-3 py-2">
                  <InitialAvatar namn={rad.namn} className={storAvatar} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium text-body">{rad.namn}</span>
                    <span className="truncate text-caption text-text-secondary">
                      {rad.avgiftstyp}
                    </span>
                  </span>
                  {rad.skickat ? (
                    <span className="shrink-0 rounded-full bg-surface px-2 py-0.5 text-caption text-text-secondary">
                      Påmind
                    </span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
        <DodIngang
          label="Skicka påminnelse"
          icon={ReceiptText}
          intent="secondary"
          className="mt-auto pt-1"
        />
      </section>

      {/* 5. GENVÄGAR — egen tonal bricka (sage), full bredd. */}
      <div className="rounded-3xl border border-transparent bg-(--p-sage-2) p-5 contrast-more:border-border-strong lg:col-span-3 print:border-border-strong">
        <Genvagar visual="bento" headingId="be-genvagar" headingClassName="font-semibold text-lg" />
      </div>

      {/* 6. SENASTE AKTIVITET — kompakt, alla bredder, full bredd i mosaiken. */}
      <div className="lg:col-span-3">
        <SenasteAktivitetKompakt
          visual="bento"
          headingId="be-aktivitet"
          headingClassName="font-semibold text-lg"
        />
      </div>
    </div>
  );
}
