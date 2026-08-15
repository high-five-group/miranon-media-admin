import { Link } from '@tanstack/react-router';
import { CalendarDays, CircleCheck, MapPin, ReceiptText } from 'lucide-react';
import { useQueryState } from 'nuqs';
import { useMemo } from 'react';
import { useAuth } from '@/auth/useAuth';
import { MessageBox, Skeleton } from '@/components/primitives';
import type { Registration } from '@/domain/models/Registration';
import {
  belaggningAndel,
  dagarKvarText,
  dagsStart,
  eventsById,
  forfallnaBetalningar,
  fornamn,
  obekraftadeAnmalningar,
  paminnelsedatumText,
  velNastaEvent,
} from './data';
import type { VariantProps } from './types';
import { DodIngang, Genvagar, InitialAvatar, SenasteAktivitetKompakt } from './ui';

/** Stabil referens (ingen ny array-identitet varje render) för `?data=tom`
    (task-226 konvergensvarv 1, punkt 1). */
const TOM_LISTA: Registration[] = [];

/**
 * [PROTOTYPE, TASK-226] V1 "Lugna morgonen" — redaktionell, luftig, stor fri
 * typografi, stillsamt hero, mycket andrum. WOW = RO.
 *
 * Identitetens medel: EN läskolumn (`max-w-2xl`, oförändrad från mobil till
 * desktop — ingen bredare grid tar över när skärmen växer, det är precis
 * poängen med "ro"), stor typografi utan versaler-brus, generösa gap-10/12,
 * och tonala ytor uteslutande i `bg-primary-tint`/`bg-bg-muted` — inga
 * skarpa konturer, inga chips, ingen tät rad-rytm. Kontrasten mot V2/V3 ÄR
 * designen: samma sex block, en tystare röst.
 */
export function VariantRo({ eventsQuery, registrationsQuery, nuMs }: VariantProps) {
  const { user } = useAuth();
  const namn = user?.displayName ? fornamn(user.displayName) : null;
  // [TASK-226 konvergensvarv 1, punkt 1] "?data=tom" i URL:en nollställer
  // registreringarna INNAN block 3/4 räknar sina tal, så tomt läge är
  // granskningsbart utan kodändring. "Nästa event" (events-driven) och
  // Senaste aktivitet (eget datalager) är OBERÖRDA. Verklig data är
  // fortsatt default (ingen param -> registrationsQuery.data oförändrat).
  // Delar query-nyckeln "data" med PrototypeSwitcher-railens "verklig
  // data"-checkbox (sätter "verklig"/null, oläst av hem-prototypen idag) --
  // en tom-URL som sedan togglas via den checkboxen skrivs över, medvetet
  // accepterat (se task-226-slutrapporten).
  const [dataParam] = useQueryState('data');
  const tomtLage = dataParam === 'tom';

  const idagStart = useMemo(() => dagsStart(nuMs), [nuMs]);
  const evMap = useMemo(() => eventsById(eventsQuery.data), [eventsQuery.data]);

  const nasta = useMemo(
    () => velNastaEvent(eventsQuery.data, idagStart),
    [eventsQuery.data, idagStart],
  );

  const anmalDataPending = registrationsQuery.isPending || eventsQuery.isPending;
  const regsForListor = tomtLage ? TOM_LISTA : registrationsQuery.data;
  const anmalningar = useMemo(
    () => obekraftadeAnmalningar(regsForListor, evMap, 6),
    [regsForListor, evMap],
  );
  const forfallna = useMemo(
    () => forfallnaBetalningar(regsForListor, evMap, nuMs, 6),
    [regsForListor, evMap, nuMs],
  );

  const idagLangt = useMemo(
    () =>
      kapitalisera(
        new Intl.DateTimeFormat('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' }).format(
          nuMs,
        ),
      ),
    [nuMs],
  );

  const belagda = nasta?.antalAnmalda ?? 0;
  const maxPlatser = nasta?.maxPlatser ?? null;
  const andel = belaggningAndel(belagda, maxPlatser);

  return (
    <section className="mx-auto flex min-w-0 max-w-2xl flex-col gap-12 p-6 pt-10 pb-24 sm:p-8 lg:pt-16">
      {/* 1. FRI HÄLSNING — ingen platta, stor redaktionell rubrik + en varm
          dagsrad som gör hela hero-ytan mjukare utan att lägga till en ny
          datakälla (bara dagens datum, klientsidan). */}
      <div className="flex flex-col gap-2">
        <p className="text-body text-text-secondary">{idagLangt}</p>
        <h1 className="font-semibold text-4xl tracking-tight lg:text-5xl">
          {namn ? `Hej ${namn}` : 'Hej'}
        </h1>
      </div>

      {/* 2. NÄSTA EVENT — fullbredd, hero-ton, status (dagar-kvar) + beläggning. */}
      <section
        aria-labelledby="ro-nasta-event"
        className="flex min-w-0 flex-col gap-4 rounded-3xl border border-transparent bg-primary-tint p-8 contrast-more:border-border-strong print:border-border-strong"
      >
        <h2
          id="ro-nasta-event"
          className="font-medium text-caption text-text-secondary uppercase tracking-wide"
        >
          Nästa event
        </h2>
        {eventsQuery.isPending ? (
          <div role="status" aria-busy="true" className="flex flex-col gap-3">
            <span className="sr-only">Laddar nästa event…</span>
            <Skeleton variant="text" className="w-3/4 text-3xl" />
            <Skeleton variant="text" className="w-1/2" />
            <Skeleton variant="text" className="h-1.5 w-full rounded-full" />
          </div>
        ) : eventsQuery.isError ? (
          <MessageBox intent="error" title="Kunde inte hämta event">
            {eventsQuery.error instanceof Error ? eventsQuery.error.message : 'Okänt fel.'}
          </MessageBox>
        ) : nasta == null ? (
          <p className="text-body text-text-secondary">Inga kommande event just nu.</p>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <Link
                to="/event/$eventId"
                params={{ eventId: nasta.id }}
                className="font-semibold text-3xl underline-offset-4 hover:underline"
              >
                {nasta.eventNamn ?? nasta.eventlabel ?? 'Namnlöst event'}
              </Link>
              <span className="font-medium text-body text-text-secondary">
                {nasta.startdatum
                  ? dagarKvarText(new Date(nasta.startdatum).getTime(), idagStart)
                  : null}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-body text-text-secondary">
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

      {/* 3. NYA ANMÄLNINGAR — räknar-rubrik + initial-lista (personlistans
          radanatomi) + bekräftelsesvep som DÖD ingång. */}
      <section aria-labelledby="ro-nya" className="flex min-w-0 flex-col gap-4">
        <h2 id="ro-nya" className="font-semibold text-2xl">
          {anmalDataPending ? (
            <Skeleton variant="text" className="w-2/3" />
          ) : (
            `${anmalningar.total} ${anmalningar.total === 1 ? 'ny anmälan' : 'nya anmälningar'} att bekräfta`
          )}
        </h2>
        {registrationsQuery.isError ? (
          <MessageBox intent="error" title="Kunde inte hämta anmälningar">
            {registrationsQuery.error instanceof Error
              ? registrationsQuery.error.message
              : 'Okänt fel.'}
          </MessageBox>
        ) : anmalDataPending ? (
          <div role="status" aria-busy="true" className="flex flex-col gap-3">
            <span className="sr-only">Laddar nya anmälningar…</span>
            <Skeleton variant="listRow" />
            <Skeleton variant="listRow" />
          </div>
        ) : anmalningar.rows.length === 0 ? (
          <p className="text-body text-text-secondary">
            Inga anmälningar väntar på bekräftelse. Skönt.
          </p>
        ) : (
          <>
            {/* [TASK-226 konvergensvarv 1, punkt 2] Fast maxhöjd (~6 rader) +
                overflow-y-auto — listan växer aldrig sidans layout, den
                skrollar internt. `tabIndex` GÖR ULEN till scrollytans
                tab-stopp (SAMMA facit-mönster som `NyaAnmalningarCard.tsx`
                k112/`AtgardsSida.tsx` — WCAG 2.1.1, axe
                scrollable-region-focusable: raderna utan `reg.eventId` har
                ingen egen länk och nås annars aldrig med tangentbord).
                `focus-ring-inset` skyddar radernas EGNA fokusringar (Link)
                mot att klippas av overflow (task-4.7 S67-fyndet);
                `scrollbar-inline` är den token-baserade scrollmarkören
                (K10-facit). */}
            <ul
              // biome-ignore lint/a11y/noNoninteractiveTabindex: fokuserbar scrollregion är WCAG 2.1.1-golvet (axe scrollable-region-focusable) — samma motiv som NyaAnmalningarCard.tsx:112.
              tabIndex={0}
              aria-label="Nya anmälningar att bekräfta"
              className="focus-ring-inset scrollbar-inline flex max-h-96 flex-col gap-1 overflow-y-auto pr-3"
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
                      className="group flex items-center gap-3 py-3"
                    >
                      <InitialAvatar namn={rad.namn} />
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate font-medium text-body group-hover:underline">
                          {rad.namn}
                        </span>
                        <span className="truncate text-caption text-text-muted">
                          {rad.identitet}
                        </span>
                      </span>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-3 py-3">
                      <InitialAvatar namn={rad.namn} />
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate font-medium text-body">{rad.namn}</span>
                        <span className="truncate text-caption text-text-muted">
                          {rad.identitet}
                        </span>
                      </span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
            {anmalningar.total > anmalningar.rows.length ? (
              <Link
                to="/atgarder"
                className="self-start font-medium text-caption underline-offset-2 hover:underline"
              >
                Visa alla {anmalningar.total} <span aria-hidden="true">→</span>
              </Link>
            ) : null}
          </>
        )}
        <DodIngang label="Bekräfta alla" icon={CircleCheck} className="pt-1" skarp />
      </section>

      {/* 4. FÖRFALLNA BETALNINGAR — antal + initial-lista + avgiftstyp per
          rad + skickat-markör + påminnelsesvep som DÖD ingång. */}
      <section aria-labelledby="ro-forfallna" className="flex min-w-0 flex-col gap-4">
        <h2 id="ro-forfallna" className="font-semibold text-2xl">
          {anmalDataPending ? (
            <Skeleton variant="text" className="w-2/3" />
          ) : (
            `${forfallna.total} ${forfallna.total === 1 ? 'förfallen betalning' : 'förfallna betalningar'}`
          )}
        </h2>
        {registrationsQuery.isError ? (
          <MessageBox intent="error" title="Kunde inte hämta betalningar">
            {registrationsQuery.error instanceof Error
              ? registrationsQuery.error.message
              : 'Okänt fel.'}
          </MessageBox>
        ) : anmalDataPending ? (
          <div role="status" aria-busy="true" className="flex flex-col gap-3">
            <span className="sr-only">Laddar förfallna betalningar…</span>
            <Skeleton variant="listRow" />
            <Skeleton variant="listRow" />
          </div>
        ) : forfallna.rows.length === 0 ? (
          <p className="text-body text-text-secondary">
            Inga förfallna betalningar. Allt är i fas.
          </p>
        ) : (
          <>
            {/* [TASK-226 konvergensvarv 1, punkt 2] Samma inline-scroll-
                mönster (`tabIndex` på `<ul>`) som "Nya anmälningar" ovan —
                se motivering där. */}
            <ul
              // biome-ignore lint/a11y/noNoninteractiveTabindex: fokuserbar scrollregion är WCAG 2.1.1-golvet (axe scrollable-region-focusable) — samma motiv som NyaAnmalningarCard.tsx:112.
              tabIndex={0}
              aria-label="Förfallna betalningar"
              className="focus-ring-inset scrollbar-inline flex max-h-96 flex-col gap-1 overflow-y-auto pr-3"
            >
              {forfallna.rows.map((rad, i) => {
                // [TASK-226 konvergensvarv 1, punkt 4] "Påmind" ersatt av
                // datumbadgen — inget "Påminnelse 1/2", datamodellen bär
                // ingen räkning (bara SENASTE tidsstämpeln per avgiftstyp).
                const paminnelsedatum = paminnelsedatumText(rad.paminnelseSkickadIso);
                return (
                  <li
                    key={`${rad.reg.id}-${rad.avgiftstyp}`}
                    className={
                      i > 0
                        ? 'border-border-light border-t contrast-more:border-border-strong'
                        : undefined
                    }
                  >
                    <div className="flex items-center gap-3 py-3">
                      <InitialAvatar namn={rad.namn} />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate font-medium text-body">{rad.namn}</span>
                        <span className="truncate text-caption text-text-muted">
                          {rad.avgiftstyp} · {rad.eventNamn}
                        </span>
                      </span>
                      {paminnelsedatum ? (
                        <span className="shrink-0 rounded-full bg-surface px-2.5 py-0.5 text-caption text-text-secondary">
                          Påminnelse skickad {paminnelsedatum}
                        </span>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
            {forfallna.total > forfallna.rows.length ? (
              <Link
                to="/atgarder"
                className="self-start font-medium text-caption underline-offset-2 hover:underline"
              >
                Visa alla {forfallna.total} <span aria-hidden="true">→</span>
              </Link>
            ) : null}
          </>
        )}
        <DodIngang label="Skicka påminnelse till alla" icon={ReceiptText} className="pt-1" skarp />
      </section>

      {/* 5. GENVÄGAR */}
      <Genvagar visual="ro" headingId="ro-genvagar" headingClassName="font-semibold text-2xl" />

      {/* 6. SENASTE AKTIVITET — kompakt, alla bredder. */}
      <SenasteAktivitetKompakt
        visual="ro"
        headingId="ro-aktivitet"
        headingClassName="font-semibold text-2xl"
      />
    </section>
  );
}

function kapitalisera(s: string): string {
  return s.length === 0 ? s : s[0].toUpperCase() + s.slice(1);
}
