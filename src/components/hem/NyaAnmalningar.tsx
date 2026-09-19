import { Link } from '@tanstack/react-router';
import { CircleCheck } from 'lucide-react';
import { InitialAvatar, MessageBox, Skeleton } from '@/components/primitives';
import { inskickadTid } from '@/components/registrations/registration-display';
import { BulkAtgardsknapp } from './BulkAtgardsknapp';
import type { AnmalningarVy, AnmalningRad } from './hem-derivations';
import { relativTid } from './relativ-tid';
import type { useDashboardRegistrations } from './useDashboardData';

/**
 * Skeletonradens anatomi är IDENTISK med den riktiga radens icke-länk-form
 * (`<div className="flex items-center gap-3 py-3">` nedan — TASK-416.18,
 * samma felklass som TASK-416.17 löste för Maillogg/Väntelista): `Skeleton
 * variant="listRow"` (`h-[3lh]`) matchade varken anatomin (avatar-cirkel +
 * namn/identitet-kolumn + valfri relativ-tid-pill) eller den riktiga radens
 * boundingBox (TASK-416.13:s mätning: {width:568,height:72} skelett mot
 * {width:545,height:66} riktig rad). `InitialAvatar`-cirkelns platshållare
 * (`size-9 shrink-0 rounded-full`, samma mönster som `WaitlistSkeletonRow`)
 * har FAST höjd och dominerar radens `items-center`-höjd precis som den
 * riktiga cirkeln; namn/identitet är TVÅ staplade `Skeleton`-textrader med
 * EXPLICITA `text-body`/`text-caption`-storleksklasser (samma två storlekar
 * som `{rad.namn}`/`{rad.identitet}` bär) i en `flex-col`-kolumn UTAN gap —
 * identisk stapling mot `<span className="flex min-w-0 flex-1 flex-col">`.
 * Höjden 66 px = 12+12 px (`py-3`) + 24+18 px (`text-body`/`text-caption`
 * line-height 1.5 vid 1rem/0.75rem) — matchar exakt, avatarens 36 px är
 * kortare än kolumnens 42 px och avgör alltså inte radens höjd. Den
 * högerställda platshållaren mot `{relTid}`-spannet är med av samma skäl som
 * `MailLogSkeletonRow`s fyra fält: `inskickad` sätts av varje anmälan
 * (`reg()`-fixturen), så relativ-tid är i praktiken TYPRADEN framåt.
 *
 * OMSLAGET runt sista platshållaren (review-fynd runda 1+2, PR #2419):
 * `Skeleton` renderar ett TOMT, självstängande element — bakgrunden
 * (`bg-(--mm-skeleton-block)`) målas direkt på ELEMENTET SJÄLVT, och
 * `box-sizing: border-box` (`base.css`) gör att en breddklass som `w-16`
 * blir TOTALbredden. Ett `pl-2` satt direkt PÅ Skeleton-blocket (runda 1:s
 * första försök) äter alltså 8 px av en innehållsbox som ändå är tom — den
 * målade rektangeln fyller fortsatt hela 64 px från samma vänsterkant, till
 * skillnad från den riktiga `{relTid}`-spannet (rad ~168/179), som saknar
 * egen breddklass och därför FAKTISKT skjuts inåt av sitt `pl-2`. Den
 * riktiga fixen är ett separat OMSLAG (`<span className="shrink-0 pl-2">`)
 * runt en `Skeleton` UTAN egen `pl-2`, med bredden nedskalad
 * (`w-14` = 56 px) så att omslagets `pl-2` (8 px) + den målade rektangelns
 * 56 px tillsammans ger SAMMA yttre 64 px som förut — men nu sitter rektangeln
 * FÖRSKJUTEN 8 px från omslagets vänsterkant, där den riktiga relTid-texten
 * faktiskt hamnar, i stället för att fylla hela boxen. Radens EGEN yttre
 * boundingBox (AC #1) är opåverkad i båda formerna, eftersom `flex-1`-
 * namnkolumnen absorberar mellanskillnaden — mätt oförändrat i alla fyra
 * viewports efter denna rättning.
 *
 * BREDDEN (568→545, 23 px för bred) satt INTE på raden själv: raden är ett
 * block-element utan egen breddklass och stretchar till sin FLEX-förälders
 * innehållsbredd (samma stretch-mekanik som en `<li>` i en `flex-col`-`<ul>`
 * ger sitt barn). Skillnaden satt i den LADDANDE containerns klasser —
 * `flex flex-col gap-3` saknade den riktiga `<ul>`s `pr-3` (12 px) OCH
 * `scrollbar-inline`s `scrollbar-gutter: stable` (reserverar bredd för en
 * scrollmarkör som aldrig visas vid två rader, men ÄNDÅ tar plats i den
 * riktiga listan). Containern nedan bär nu SAMMA breddpåverkande klasser som
 * `<ul>` (minus `tabIndex`/`focus-ring-inset`/`aria-label` — containern är
 * inte fokuserbar, den är en dekorativ platshållare). Mätt (boundingBox,
 * `toEqual`, ±0 px): `hem-laddlage.acceptance.test.ts`.
 */
function NyaAnmalanSkeletonRad() {
  return (
    <div data-testid="nya-anmalningar-skeleton-rad" className="flex items-center gap-3 py-3">
      <Skeleton variant="text" className="size-9 shrink-0 rounded-full" />
      <span className="flex min-w-0 flex-1 flex-col">
        <Skeleton variant="text" className="w-2/5 text-body" />
        <Skeleton variant="text" className="w-1/3 text-caption" />
      </span>
      <span className="shrink-0 pl-2">
        <Skeleton variant="text" className="w-14 text-caption" />
      </span>
    </div>
  );
}

/**
 * "Nya anmälningar" — Morgonkollens tredje block (TASK-243.1, promoverad ur
 * `dev/hem-prototyp/VariantRo.tsx`, facit "hem-vyn V1 Lugna morgonen"):
 * räknar-rubrik + initial-lista (namn / eventidentitet / relativ tid) +
 * "Bekräfta alla" som bulk-ingång (AC #4 — disabladt tills sändflödet finns).
 *
 * Inline-rullning, ALLA rader (AC #5) — ingen kapad lista, ingen extern
 * "Visa alla →"-länk: `max-h-96 overflow-y-auto` bär hela skrollansvaret.
 * `tabIndex={0}` gör ULEN till scrollytans tab-stopp (WCAG 2.1.1, axe
 * scrollable-region-focusable — rader utan `reg.eventId` har ingen egen
 * länk och nås annars aldrig med tangentbord).
 *
 * SKICKAT-MARKÖRERNA (TASK-241.3 AC #3): `nyligenSkickade` är `Hem.tsx`s
 * session-lokala minne av VAD svepet just bekräftade (se dess docblock för
 * hela motivet — status flippar bort från OBEKRAFTAD server-side, så raden
 * annars bara försvinner). Renderas som EGNA rader, sist i samma lista, med
 * en grön bock i stället för relativ tid — samma radgrammatik i övrigt
 * (avatar/namn/identitet), ingen ny visuell nivå. `synligaRader` filtrerar
 * bort ett ID som råkar finnas i BÅDA listorna (ett kort fönster innan
 * query-cachen hunnit refetcha efter svepet) — markörraden vinner alltid,
 * aldrig en dubblettrad med samma nyckel.
 */
export function NyaAnmalningar({
  anmalDataPending,
  regsError,
  registrationsQuery,
  anmalningar,
  nuMs,
  onBekraftaAlla,
  nyligenSkickade,
}: {
  anmalDataPending: boolean;
  regsError: boolean;
  registrationsQuery: ReturnType<typeof useDashboardRegistrations>;
  anmalningar: AnmalningarVy;
  nuMs: number;
  /** [TASK-241.2] Öppnar bekräftelsesvepets sändyta (`Hem.tsx`s `svepOppen`).
      Threading, ingen egen logik här — se `BulkAtgardsknapp.tsx`s docblock
      för de två lägena en `onPress` styr. */
  onBekraftaAlla: () => void;
  /** [TASK-241.3 AC #3] Registreringar svepet FAKTISKT bekräftade denna
      session — `Hem.tsx`s `nyligenSkickadeRader`. Tom array (alltid given
      av `Hem.tsx`) före första svepet. */
  nyligenSkickade: AnmalningRad[];
}) {
  const skickadeIds = new Set(nyligenSkickade.map((rad) => rad.reg.id));
  const synligaRader = anmalningar.rows.filter((rad) => !skickadeIds.has(rad.reg.id));
  const visarNagot = synligaRader.length > 0 || nyligenSkickade.length > 0;

  return (
    <section aria-labelledby="hem-nya-anmalningar" className="flex min-w-0 flex-col gap-4">
      <h2 id="hem-nya-anmalningar" className="font-semibold text-2xl">
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
            : 'Inget felmeddelande angavs.'}
        </MessageBox>
      ) : anmalDataPending ? (
        <div
          role="status"
          aria-busy="true"
          className="scrollbar-inline flex max-h-96 flex-col gap-1 overflow-y-auto pr-3"
        >
          <span className="sr-only">Laddar nya anmälningar…</span>
          <NyaAnmalanSkeletonRad />
        </div>
      ) : !visarNagot ? (
        <p className="flex items-center gap-2 text-body text-text-secondary">
          <CircleCheck aria-hidden="true" size={20} className="shrink-0 text-success" />
          Inga nya anmälningar att bekräfta, läget är under kontroll.
        </p>
      ) : (
        <ul
          // biome-ignore lint/a11y/noNoninteractiveTabindex: fokuserbar scrollregion är WCAG 2.1.1-golvet (axe scrollable-region-focusable) — samma motiv som NyaAnmalningarCard.tsx k112.
          tabIndex={0}
          aria-label="Nya anmälningar att bekräfta"
          className="focus-ring-inset scrollbar-inline flex max-h-96 flex-col gap-1 overflow-y-auto pr-3"
        >
          {synligaRader.map((rad, i) => {
            const inskickadMs = inskickadTid(rad.reg);
            const relTid = Number.isFinite(inskickadMs) ? relativTid(inskickadMs, nuMs) : null;
            return (
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
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-medium text-body group-hover:underline">
                        {rad.namn}
                      </span>
                      <span className="truncate text-caption text-text-muted">{rad.identitet}</span>
                    </span>
                    {relTid ? (
                      <span className="shrink-0 pl-2 text-caption text-text-muted">{relTid}</span>
                    ) : null}
                  </Link>
                ) : (
                  <div className="flex items-center gap-3 py-3">
                    <InitialAvatar namn={rad.namn} />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-medium text-body">{rad.namn}</span>
                      <span className="truncate text-caption text-text-muted">{rad.identitet}</span>
                    </span>
                    {relTid ? (
                      <span className="shrink-0 pl-2 text-caption text-text-muted">{relTid}</span>
                    ) : null}
                  </div>
                )}
              </li>
            );
          })}
          {nyligenSkickade.map((rad, i) => (
            <li
              key={rad.reg.id}
              className={
                synligaRader.length + i > 0
                  ? 'border-border-light border-t contrast-more:border-border-strong'
                  : undefined
              }
            >
              <div className="flex items-center gap-3 py-3 opacity-70">
                <InitialAvatar namn={rad.namn} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium text-body">{rad.namn}</span>
                  <span className="truncate text-caption text-text-muted">{rad.identitet}</span>
                </span>
                <span className="flex shrink-0 items-center gap-1.5 pl-2 text-caption text-success">
                  <CircleCheck aria-hidden="true" size={14} className="shrink-0" />
                  Bekräftelse skickad
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
      {/* [TASK-451.7] MEDVETET INGEN SKELETON-RESERVATION FÖR KNAPPEN.
          Övervägd och AVVISAD: en fast knapp-platshållare hade tagit bort
          den `utanY()`-dokumenterade Y-förskjutningen NÄR sektionen landar
          icke-tom (`anmalningar.total > 0`) — men de två skeleton-raderna
          ovan är REDAN en approximation (ett känt, av PRD:n Marcus-avvägt
          "Öppna frågor"-gap, se `medMatningsdata()`s docblock i
          `hem-laddlage.acceptance.test.ts`): landar sektionen i STÄLLET i
          sitt tomläge ("Inga nya anmälningar…", en `<p>`-rad) skulle en
          TILLAGD knapp-platshållare göra den redan kända krympningen ÄNNU
          större — exakt det AC #3 förbjuder ("tomlägen får inte ge större
          hopp än tröskeln"). Att lägga till en reservation här hade alltså
          löst EN sidas problem (fylld lista) genom att förvärra en ANNAN,
          minst lika vanlig sida (tomt läge). Den kvarstående Y-skillnaden
          i det fyllda fallet är därför en NAMNGIVEN, mätt kvarstående
          skillnad (se `hem-laddlage.acceptance.test.ts`s
          sektionsnivå-boundingBox-test, TASK-451.7) — inte tyst
          bortstruken, bara inte "löst" med en reservation som skulle
          skadat mer än den hjälpt. */}
      {anmalningar.total > 0 ? (
        <div className="pt-1">
          <BulkAtgardsknapp label="Bekräfta alla" onPress={onBekraftaAlla} />
        </div>
      ) : null}
    </section>
  );
}
