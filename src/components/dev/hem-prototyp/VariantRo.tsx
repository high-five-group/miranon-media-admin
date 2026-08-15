import { Link } from '@tanstack/react-router';
import { CalendarDays, ChevronRight, CircleCheck, MapPin, ReceiptText } from 'lucide-react';
import { useQueryState } from 'nuqs';
import { useMemo } from 'react';
import { useAuth } from '@/auth/useAuth';
import { MessageBox, Skeleton } from '@/components/primitives';
import type { Event } from '@/domain/models/Event';
import type { Registration } from '@/domain/models/Registration';
import {
  type BevakningRad,
  belaggningAndel,
  bevakningar,
  dagarKvarText,
  dagsStart,
  eventsById,
  type ForfallenRad,
  forfallenGrupp,
  forfallnaBetalningar,
  fornamn,
  kortDatum,
  obekraftadeAnmalningar,
  paminnelsedatumText,
  velNastaEvent,
} from './data';
import { demoUniversum } from './demoData';
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
  //
  // [TASK-226 konvergensvarv 2, punkt 3] "?data=demo" — tredje läget. Ett
  // SJÄLVSTÄNDIGT syntetiskt universum (`demoData.ts`) ersätter BÅDE events
  // OCH registreringar (till skillnad från tomtLage, som bara nollställer
  // registreringarna) — bevakningsraden behöver konsekventa event↔regs-
  // länkar för att visa båda sina lägen samtidigt, och en blandning av
  // riktiga+syntetiska event hade riskerat en demo-registrering som pekar
  // på ett eventId som inte finns i den riktiga eventskartan. Väntar INTE
  // in de riktiga queriesen (`anmalDataPending`/`eventsPending` nedan är
  // alltid `false` i demoläget) — hela poängen är att granskningen inte ska
  // bero på vad staging råkar svara.
  const [dataParam] = useQueryState('data');
  const tomtLage = dataParam === 'tom';
  const demoLage = dataParam === 'demo';

  const demo = useMemo(() => (demoLage ? demoUniversum(nuMs) : null), [demoLage, nuMs]);
  const eventsForVy: Event[] | undefined = demoLage ? demo?.events : eventsQuery.data;

  const idagStart = useMemo(() => dagsStart(nuMs), [nuMs]);
  const evMap = useMemo(() => eventsById(eventsForVy), [eventsForVy]);

  const nasta = useMemo(() => velNastaEvent(eventsForVy, idagStart), [eventsForVy, idagStart]);

  const eventsPending = !demoLage && eventsQuery.isPending;
  const eventsError = !demoLage && eventsQuery.isError;
  const regsError = !demoLage && registrationsQuery.isError;
  const anmalDataPending = !demoLage && (registrationsQuery.isPending || eventsQuery.isPending);
  const regsForListor: Registration[] | undefined = tomtLage
    ? TOM_LISTA
    : demoLage
      ? demo?.registrations
      : registrationsQuery.data;
  const anmalningar = useMemo(
    () => obekraftadeAnmalningar(regsForListor, evMap, 6),
    [regsForListor, evMap],
  );
  // [TASK-226 konvergensvarv 2, punkt 2] `Number.POSITIVE_INFINITY` i stället
  // för varv 1:s "6" — V1 grupperar nu ALLA förfallna rader i tre
  // tillståndssektioner (nedan), var och en sin egen inline-scroll, så den
  // tidigare gemensamma "Visa alla N →"-länken utgår för V1 (total===visat
  // alltid). LOKAL ändring i detta anropsställe — den delade funktionens
  // signatur/semantik är orörd, V2/V3 fortsätter skicka sina egna tal (6/5).
  const forfallna = useMemo(
    () => forfallnaBetalningar(regsForListor, evMap, nuMs, Number.POSITIVE_INFINITY),
    [regsForListor, evMap, nuMs],
  );
  const forfallnaGrupper = useMemo(() => {
    const attPaminna: ForfallenRad[] = [];
    const vantar: ForfallenRad[] = [];
    const dagsAttRinga: ForfallenRad[] = [];
    for (const rad of forfallna.rows) {
      const grupp = forfallenGrupp(rad, nuMs);
      if (grupp === 'att-paminna') attPaminna.push(rad);
      else if (grupp === 'vantar') vantar.push(rad);
      else dagsAttRinga.push(rad);
    }
    return { attPaminna, vantar, dagsAttRinga };
  }, [forfallna.rows, nuMs]);
  const bevakningRader = useMemo(
    () => bevakningar(eventsForVy, regsForListor, idagStart),
    [eventsForVy, regsForListor, idagStart],
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
        {eventsPending ? (
          <div role="status" aria-busy="true" className="flex flex-col gap-3">
            <span className="sr-only">Laddar nästa event…</span>
            <Skeleton variant="text" className="w-3/4 text-3xl" />
            <Skeleton variant="text" className="w-1/2" />
            <Skeleton variant="text" className="h-1.5 w-full rounded-full" />
          </div>
        ) : eventsError ? (
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

      {/* BEVAKNINGSRAD — TASK-226 konvergensvarv 2, punkt 1 (S102 Del 10
          beslut 2–4). Placerad MELLAN "Nästa event" och "Nya anmälningar"
          (Marcus-låst blockordning). TILL SKILLNAD FRÅN BLOCKEN nedan (som
          alltid visar en rubrik + positivt kvitto vid noll): denna yta är
          HELT OSYNLIG vid noll träffar — ingen wrapper, ingen rubrik, inget
          kvitto (ORDLISTA.md "Bevakningsrad", asymmetrin Marcus-låst). */}
      {bevakningRader.length > 0 ? (
        <ul aria-label="Bevakningar" className="flex min-w-0 flex-col gap-2">
          {bevakningRader.map((rad) => (
            <BevakningsRadItem key={rad.event.id} rad={rad} />
          ))}
        </ul>
      ) : null}

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
        {regsError ? (
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

      {/* 4. FÖRFALLNA BETALNINGAR — TASK-226 konvergensvarv 2, punkt 2:
          en-påminnelse-modellens TRE tillståndsgrupper (S102 Del 10 beslut
          7–8), avdelade sektioner inom blocket. Totalrubriken oförändrad
          från varv 1. Svepknappen flyttad in i Att påminna-sektionen ENSAM
          (Marcus-låst: svep opererar aldrig på väntar/ring-rader). */}
      <section aria-labelledby="ro-forfallna" className="flex min-w-0 flex-col gap-4">
        <h2 id="ro-forfallna" className="font-semibold text-2xl">
          {anmalDataPending ? (
            <Skeleton variant="text" className="w-2/3" />
          ) : (
            `${forfallna.total} ${forfallna.total === 1 ? 'förfallen betalning' : 'förfallna betalningar'}`
          )}
        </h2>
        {regsError ? (
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
          <div className="flex min-w-0 flex-col gap-6">
            {forfallnaGrupper.attPaminna.length > 0 ? (
              <div className="flex min-w-0 flex-col gap-3">
                <h3
                  id="ro-forfallna-paminna"
                  className="font-medium text-caption text-text-secondary uppercase tracking-wide"
                >
                  Att påminna · {forfallnaGrupper.attPaminna.length}
                </h3>
                {/* [TASK-226 konvergensvarv 1, punkt 2] Samma inline-scroll-
                    mönster (`tabIndex` på `<ul>`) som "Nya anmälningar" ovan —
                    se motivering där. Nu PER GRUPP i stället för hela blocket. */}
                <ul
                  // biome-ignore lint/a11y/noNoninteractiveTabindex: fokuserbar scrollregion är WCAG 2.1.1-golvet (axe scrollable-region-focusable) — samma motiv som NyaAnmalningarCard.tsx:112.
                  tabIndex={0}
                  aria-labelledby="ro-forfallna-paminna"
                  className="focus-ring-inset scrollbar-inline flex max-h-96 flex-col gap-1 overflow-y-auto pr-3"
                >
                  {forfallnaGrupper.attPaminna.map((rad, i) => (
                    <li
                      key={`${rad.reg.id}-${rad.avgiftstyp}`}
                      className={
                        i > 0
                          ? 'border-border-light border-t contrast-more:border-border-strong'
                          : undefined
                      }
                    >
                      <ForfallenRadInnehall rad={rad} />
                    </li>
                  ))}
                </ul>
                <DodIngang
                  label="Skicka påminnelse till alla"
                  icon={ReceiptText}
                  className="pt-1"
                  skarp
                />
              </div>
            ) : null}

            {forfallnaGrupper.vantar.length > 0 ? (
              <div className="flex min-w-0 flex-col gap-3">
                <h3
                  id="ro-forfallna-vantar"
                  className="font-medium text-caption text-text-secondary uppercase tracking-wide"
                >
                  Väntar · {forfallnaGrupper.vantar.length}
                </h3>
                <ul
                  // biome-ignore lint/a11y/noNoninteractiveTabindex: fokuserbar scrollregion är WCAG 2.1.1-golvet (axe scrollable-region-focusable) — samma motiv som NyaAnmalningarCard.tsx:112.
                  tabIndex={0}
                  aria-labelledby="ro-forfallna-vantar"
                  className="focus-ring-inset scrollbar-inline flex max-h-96 flex-col gap-1 overflow-y-auto pr-3"
                >
                  {forfallnaGrupper.vantar.map((rad, i) => (
                    <li
                      key={`${rad.reg.id}-${rad.avgiftstyp}`}
                      className={
                        i > 0
                          ? 'border-border-light border-t contrast-more:border-border-strong'
                          : undefined
                      }
                    >
                      <ForfallenRadInnehall rad={rad} />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {forfallnaGrupper.dagsAttRinga.length > 0 ? (
              <div className="flex min-w-0 flex-col gap-3">
                <h3
                  id="ro-forfallna-ringa"
                  className="font-medium text-caption text-text-secondary uppercase tracking-wide"
                >
                  Dags att ringa · {forfallnaGrupper.dagsAttRinga.length}
                </h3>
                <ul
                  // biome-ignore lint/a11y/noNoninteractiveTabindex: fokuserbar scrollregion är WCAG 2.1.1-golvet (axe scrollable-region-focusable) — samma motiv som NyaAnmalningarCard.tsx:112.
                  tabIndex={0}
                  aria-labelledby="ro-forfallna-ringa"
                  className="focus-ring-inset scrollbar-inline flex max-h-96 flex-col gap-1 overflow-y-auto pr-3"
                >
                  {forfallnaGrupper.dagsAttRinga.map((rad, i) => (
                    <li
                      key={`${rad.reg.id}-${rad.avgiftstyp}`}
                      className={
                        i > 0
                          ? 'border-border-light border-t contrast-more:border-border-strong'
                          : undefined
                      }
                    >
                      <RingRadInnehall rad={rad} />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}
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

/**
 * [TASK-226 konvergensvarv 2, punkt 1] Bevakningsradens enskilda rad.
 * V1-LOKAL (inte i `ui.tsx`) — ytan är V1-ENDA per Del 10 beslut 2 ("V1-
 * täckningen"), och `ui.tsx`s eget kontrakt är uttryckligen "INNEHÅLLSMÄSSIGT
 * identiska i alla tre varianter"; en ensam konsument hör inte hemma där
 * (över-engineering-vakten).
 *
 * Visuellt lånad ur `NavCard`-primitivens rad-grammatik (chevron höger =
 * "raden leder vidare", samma komponent-tokens) — men en RIKTIG `<button>`
 * utan `onClick`, inte en länk: sändflödet finns inte byggt än
 * (svep-PRD:n). Samma no-op-mönster som `DodIngang`s `skarp`-läge (ui.tsx)
 * — fokuserbar, ser aktiv ut, klicket gör bokstavligen ingenting.
 */
function BevakningsRadItem({ rad }: { rad: BevakningRad }) {
  const status =
    rad.lage === 'ej-skickad'
      ? 'eventinfo inte skickad'
      : `${rad.antalUtanEventinfo} nya deltagare saknar eventinfo`;
  return (
    <li>
      <button
        type="button"
        className="text-(color:--mm-navcard-text) flex min-h-12 w-full items-center gap-3 rounded-2xl border border-(--mm-navcard-border) bg-(--mm-navcard-bg) px-4 py-3 text-left contrast-more:border-(--mm-navcard-border-contrast)"
      >
        <span className="min-w-0 flex-1 truncate text-body">
          <span className="font-semibold">{rad.eventNamn}</span>
          {` · startar om ${rad.dagarTillStart} dagar · ${status}`}
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

/**
 * [TASK-226 konvergensvarv 2, punkt 2] Rad-innehållet delat av "Att
 * påminna"- och "Väntar"-grupperna — EXAKT samma template varv 1 redan
 * byggde (badgen visas bara när `paminnelsedatum` finns, vilket redan skiljer
 * de två gruppernas rader åt utan någon ny gren här).
 */
function ForfallenRadInnehall({ rad }: { rad: ForfallenRad }) {
  const paminnelsedatum = paminnelsedatumText(rad.paminnelseSkickadIso);
  return (
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
  );
}

/**
 * [TASK-226 konvergensvarv 2, punkt 2] "Dags att ringa"-radens innehåll
 * (S102 Del 10 beslut 8, Marcus ordagrant): KONSTATERANDE copy, aldrig
 * kommenderande — "Påmind {kortdatum} · obetald" + telefonnummer +
 * personens notering FÖR AVGIFTSTYPEN om satt. `kortDatum` är samma
 * formaterare som event-identitetens datumkolumn (data.ts), inte en ny
 * parallell. `rad.reg.telefon`/`noteringAnmalningsavgift`/
 * `noteringSlutbetalning` läses direkt av `reg` — inga nya `ForfallenRad`-
 * fält behövs, den fulla `Registration` följer redan med raden.
 */
function RingRadInnehall({ rad }: { rad: ForfallenRad }) {
  const datum = kortDatum(rad.paminnelseSkickadIso);
  const notering =
    rad.avgiftstyp === 'Anmälningsavgift'
      ? rad.reg.noteringAnmalningsavgift
      : rad.reg.noteringSlutbetalning;
  return (
    <div className="flex items-start gap-3 py-3">
      <InitialAvatar namn={rad.namn} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate font-medium text-body">{rad.namn}</span>
        <span className="truncate text-caption text-text-muted">
          {rad.avgiftstyp} · {rad.eventNamn}
        </span>
        <span className="text-caption text-text-secondary">
          {datum ? `Påmind ${datum} · obetald` : 'Obetald'}
          {rad.reg.telefon ? ` · ${rad.reg.telefon}` : ''}
        </span>
        {notering ? (
          <span className="truncate text-caption text-text-muted italic">{notering}</span>
        ) : null}
      </span>
    </div>
  );
}
