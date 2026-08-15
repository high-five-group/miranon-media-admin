import { Link } from '@tanstack/react-router';
import { CalendarDays, CircleAlert, CircleCheck, ReceiptText } from 'lucide-react';
import { type ReactNode, useMemo } from 'react';
import { useAuth } from '@/auth/useAuth';
import { MessageBox, Skeleton } from '@/components/primitives';
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

/** Chip-formen — räknar-chipsens gemensamma yta (task-226: "räknar-chips överst"). */
function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-bg-muted px-3 py-1 font-medium text-small tabular-nums">
      {children}
    </span>
  );
}

/**
 * [PROTOTYPE, TASK-226] V2 "Kommandocentralen" — räknar-chips överst,
 * prominenta svep-knappar som primärhandlingar, tät, allt väsentligt inom en
 * skärmhöjd i mobil. WOW = KONTROLL.
 *
 * Identitetens medel: en chip-rad direkt under hälsningen sammanfattar
 * status INNAN blocken (samma sex block i SAMMA ordning följer nedanför —
 * chipsen lägger inget nytt block, de komprimerar det som redan finns till
 * ett ögonkast); täta rader (`py-1.5`/`gap-3` i stället för V1:s `py-3`/
 * `gap-12`); svep-knapparna flyttar FÖRE listorna och renderas `size="lg"`
 * `emphasis="solid"` — de ÄR den mest prominenta ytan i varje block, till
 * skillnad från V1:s tillbakadragna eftertanke. Bredare läskolumn (`max-w-3xl`)
 * än V1, ingen mosaik som V3 — kontroll är TÄT LINJÄR, inte spretig.
 */
export function VariantKontroll({ eventsQuery, registrationsQuery, nuMs }: VariantProps) {
  const { user } = useAuth();
  const namn = user?.displayName ? fornamn(user.displayName) : null;

  const idagStart = useMemo(() => dagsStart(nuMs), [nuMs]);
  const evMap = useMemo(() => eventsById(eventsQuery.data), [eventsQuery.data]);
  const nasta = useMemo(
    () => velNastaEvent(eventsQuery.data, idagStart),
    [eventsQuery.data, idagStart],
  );

  const anmalDataPending = registrationsQuery.isPending || eventsQuery.isPending;
  const anmalningar = useMemo(
    () => obekraftadeAnmalningar(registrationsQuery.data, evMap, 6),
    [registrationsQuery.data, evMap],
  );
  const forfallna = useMemo(
    () => forfallnaBetalningar(registrationsQuery.data, evMap, nuMs, 6),
    [registrationsQuery.data, evMap, nuMs],
  );

  const belagda = nasta?.antalAnmalda ?? 0;
  const maxPlatser = nasta?.maxPlatser ?? null;
  const andel = belaggningAndel(belagda, maxPlatser);
  const nastaStatus =
    nasta?.startdatum != null
      ? dagarKvarText(new Date(nasta.startdatum).getTime(), idagStart)
      : null;

  return (
    <section className="mx-auto flex min-w-0 max-w-3xl flex-col gap-5 p-4 pt-6 pb-24 sm:p-6 lg:pt-10">
      {/* 1. FRI HÄLSNING — ingen platta, kompakt. RÄKNAR-CHIPSEN hör till
          samma öppningsblock (task-226 "chips överst"): de summerar de
          BLOCK som följer, de lägger inte till ett nytt. */}
      <div className="flex flex-col gap-3">
        <h1 className="font-semibold text-2xl">{namn ? `Hej ${namn}` : 'Hej'}</h1>
        {/* Ingen egen ARIA-grupp: varje chip bär sin egen läsbara text (ingen
            information som bara syns visuellt), och en `role="group"` hade
            per Biomes a11y-regel bytts mot `<fieldset>` — fel semantik för
            en läsbar statussammanfattning, inte ett formulär. */}
        <div className="flex flex-wrap gap-2">
          <Chip>
            <CalendarDays aria-hidden="true" size={14} className="shrink-0" />
            {eventsQuery.isPending
              ? 'Nästa event…'
              : nasta == null
                ? 'Inget kommande event'
                : `Nästa: ${nastaStatus}`}
          </Chip>
          <Chip>
            <CircleCheck aria-hidden="true" size={14} className="shrink-0 text-primary" />
            {anmalDataPending ? '…' : `${anmalningar.total} att bekräfta`}
          </Chip>
          <Chip>
            <CircleAlert aria-hidden="true" size={14} className="shrink-0 text-accent" />
            {anmalDataPending ? '…' : `${forfallna.total} förfallna`}
          </Chip>
        </div>
      </div>

      {/* 2. NÄSTA EVENT — fullbredd, TÄT rad-form: allt på en gång, inte ett hero. */}
      <section
        aria-labelledby="ko-nasta-event"
        className="flex min-w-0 flex-col gap-2 rounded-xl border border-transparent bg-primary-tint px-4 py-3 contrast-more:border-border-strong print:border-border-strong"
      >
        <h2 id="ko-nasta-event" className="font-semibold text-small text-text-secondary">
          Nästa event
        </h2>
        {eventsQuery.isPending ? (
          <div role="status" aria-busy="true" className="flex flex-col gap-1.5">
            <span className="sr-only">Laddar nästa event…</span>
            <Skeleton variant="text" className="w-1/2" />
            <Skeleton variant="text" className="h-1.5 w-full rounded-full" />
          </div>
        ) : eventsQuery.isError ? (
          <MessageBox intent="error" title="Kunde inte hämta event">
            {eventsQuery.error instanceof Error ? eventsQuery.error.message : 'Okänt fel.'}
          </MessageBox>
        ) : nasta == null ? (
          <p className="text-small text-text-secondary">Inga kommande event.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
              <Link
                to="/event/$eventId"
                params={{ eventId: nasta.id }}
                className="font-semibold text-body underline-offset-2 hover:underline"
              >
                {nasta.eventNamn ?? nasta.eventlabel ?? 'Namnlöst event'}
              </Link>
              <span className="shrink-0 rounded-full bg-surface px-2 py-0.5 font-medium text-caption">
                {nastaStatus}
              </span>
            </div>
            <p className="text-caption text-text-secondary">
              {[
                nasta.ort,
                nasta.startdatum
                  ? new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'short' }).format(
                      new Date(nasta.startdatum),
                    )
                  : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
            {maxPlatser != null ? (
              <div className="flex items-center gap-2">
                <div aria-hidden="true" className="h-1.5 flex-1 rounded-full bg-surface">
                  <div
                    className="h-full rounded-full bg-primary-muted"
                    style={{ width: `${andel}%` }}
                  />
                </div>
                <span className="shrink-0 text-caption text-text-secondary tabular-nums">
                  {belagda}/{maxPlatser}
                </span>
              </div>
            ) : null}
          </div>
        )}
      </section>

      {/* 3. NYA ANMÄLNINGAR — svepknappen FÖRST (primärhandling), sedan den
          täta initial-listan. */}
      <section aria-labelledby="ko-nya" className="flex min-w-0 flex-col gap-2">
        <div className="flex items-baseline justify-between gap-2">
          <h2 id="ko-nya" className="font-semibold text-body">
            {anmalDataPending ? (
              <Skeleton variant="text" className="w-40" />
            ) : (
              `${anmalningar.total} nya anmälningar att bekräfta`
            )}
          </h2>
        </div>
        <DodIngang
          label={`Bekräfta alla (${anmalningar.total})`}
          icon={CircleCheck}
          intent="primary"
          size="lg"
        />
        {registrationsQuery.isError ? (
          <MessageBox intent="error" title="Kunde inte hämta anmälningar">
            {registrationsQuery.error instanceof Error
              ? registrationsQuery.error.message
              : 'Okänt fel.'}
          </MessageBox>
        ) : anmalDataPending ? (
          <div role="status" aria-busy="true" className="flex flex-col gap-1.5">
            <span className="sr-only">Laddar nya anmälningar…</span>
            <Skeleton variant="listRow" />
          </div>
        ) : anmalningar.rows.length === 0 ? (
          <p className="text-small text-text-secondary">Inga anmälningar väntar.</p>
        ) : (
          <ul
            aria-label="Nya anmälningar att bekräfta"
            className="max-h-52 flex-col overflow-y-auto rounded-xl border border-transparent bg-bg-muted px-3 contrast-more:border-border-strong print:border-border-strong"
          >
            {anmalningar.rows.map((rad, i) => (
              <li
                key={rad.reg.id}
                className={
                  i > 0
                    ? 'border-border-light border-t contrast-more:border-border-strong'
                    : undefined
                }
              >
                {rad.reg.eventId ? (
                  <Link
                    to="/event/$eventId"
                    params={{ eventId: rad.reg.eventId }}
                    className="group flex items-center gap-2.5 py-1.5"
                  >
                    <InitialAvatar
                      namn={rad.namn}
                      className="flex size-7 shrink-0 items-center justify-center rounded-full bg-bg-emphasized font-semibold text-caption text-text-secondary"
                    />
                    <span className="flex min-w-0 flex-1 items-baseline gap-2">
                      <span className="truncate font-medium text-small group-hover:underline">
                        {rad.namn}
                      </span>
                      <span className="truncate text-caption text-text-muted">{rad.identitet}</span>
                    </span>
                  </Link>
                ) : (
                  <div className="flex items-center gap-2.5 py-1.5">
                    <InitialAvatar
                      namn={rad.namn}
                      className="flex size-7 shrink-0 items-center justify-center rounded-full bg-bg-emphasized font-semibold text-caption text-text-secondary"
                    />
                    <span className="flex min-w-0 flex-1 items-baseline gap-2">
                      <span className="truncate font-medium text-small">{rad.namn}</span>
                      <span className="truncate text-caption text-text-muted">{rad.identitet}</span>
                    </span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 4. FÖRFALLNA BETALNINGAR — samma täta grammatik. */}
      <section aria-labelledby="ko-forfallna" className="flex min-w-0 flex-col gap-2">
        <h2 id="ko-forfallna" className="font-semibold text-body">
          {anmalDataPending ? (
            <Skeleton variant="text" className="w-40" />
          ) : (
            `${forfallna.total} förfallna betalningar`
          )}
        </h2>
        <DodIngang
          label={`Skicka påminnelse till alla (${forfallna.total})`}
          icon={ReceiptText}
          intent="primary"
          size="lg"
        />
        {registrationsQuery.isError ? (
          <MessageBox intent="error" title="Kunde inte hämta betalningar">
            {registrationsQuery.error instanceof Error
              ? registrationsQuery.error.message
              : 'Okänt fel.'}
          </MessageBox>
        ) : anmalDataPending ? (
          <div role="status" aria-busy="true" className="flex flex-col gap-1.5">
            <span className="sr-only">Laddar förfallna betalningar…</span>
            <Skeleton variant="listRow" />
          </div>
        ) : forfallna.rows.length === 0 ? (
          <p className="text-small text-text-secondary">Inga förfallna betalningar.</p>
        ) : (
          <ul
            aria-label="Förfallna betalningar"
            className="max-h-52 flex-col overflow-y-auto rounded-xl border border-accent bg-bg-muted px-3"
          >
            {forfallna.rows.map((rad, i) => (
              <li
                key={`${rad.reg.id}-${rad.avgiftstyp}`}
                className={
                  i > 0
                    ? 'border-border-light border-t contrast-more:border-border-strong'
                    : undefined
                }
              >
                <div className="flex items-center gap-2.5 py-1.5">
                  <InitialAvatar
                    namn={rad.namn}
                    className="flex size-7 shrink-0 items-center justify-center rounded-full bg-bg-emphasized font-semibold text-caption text-text-secondary"
                  />
                  <span className="flex min-w-0 flex-1 items-baseline gap-2">
                    <span className="truncate font-medium text-small">{rad.namn}</span>
                    <span className="truncate text-caption text-text-muted">
                      {rad.avgiftstyp} · {rad.eventNamn}
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
      </section>

      {/* 5. GENVÄGAR — 2-kolumns grid, tätt. */}
      <Genvagar
        visual="kontroll"
        headingId="ko-genvagar"
        headingClassName="font-semibold text-body"
      />

      {/* 6. SENASTE AKTIVITET — kompakt, alla bredder. */}
      <SenasteAktivitetKompakt
        visual="kontroll"
        headingId="ko-aktivitet"
        headingClassName="font-semibold text-body"
      />
    </section>
  );
}
