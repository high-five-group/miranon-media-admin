import { createLink } from '@tanstack/react-router';
import { ChevronRight } from 'lucide-react';
import {
  Button as AriaButton,
  Link as AriaLink,
  type LinkProps as AriaLinkProps,
} from 'react-aria-components';
import type { Event } from '@/domain/models/Event';
import {
  atgardskoText,
  type BevakningRad,
  bevakningDagarText,
  bevakningStatusText,
  type EventinfoBevakningRad,
} from './hem-derivations';

/**
 * Bevakningsraden (ORDLISTA.md "Bevakningsrad") — Morgonkollens yta för
 * sällsynta men tidskritiska härledda uppgifter (TASK-243.1, promoverad ur
 * `dev/hem-prototyp/VariantRo.tsx` BevakningsRadItem, S102 Del 10 beslut
 * 2–4). HELT OSYNLIG vid noll träffar — ingen wrapper, ingen rubrik, inget
 * kvitto (till skillnad från block, som alltid står kvar med positivt
 * kvitto vid noll) — asymmetrin är Marcus-låst.
 *
 * [TASK-284.4] TVÅ RADTYPER sedan Eventlänkens vakt (ADR-122 beslut 7, §22
 * Åtgärdskön): `'eventinfo'` (allt nedan i denna docblock, ORÖRD) och den
 * NYA `'atgardsko'` — en enda global räknad rad (ingen `event`-referens,
 * ingen dagar-kvar-kolumn), se `AtgardskoRadLink` längre ned i filen. De
 * delar `<ul aria-label="Bevakningar">` och samma `--mm-navcard-*`-kortyta,
 * men interaktions-elementet skiljer sig med avsikt: eventinfo-raden ÖPPNAR
 * ett svep PÅ Hem (`AriaButton`, ADR-114 "Hem PEKAR, svepet SKICKAR"),
 * åtgärdskö-raden NAVIGERAR BORT till åtgärdsytan (`/mer/anmalningar`,
 * förfiltrerad via `?visa=atgardskon`) eftersom resolutionen (TASK-284.3,
 * eventväljaren) inte är ett Hem-scopat svep — samma `createLink`+`AriaLink`-
 * mönster `NavCard.tsx` bär, av samma skäl (en riktig länk-primitiv för
 * Enter/Space + höger-klicka-öppna-i-ny-flik, inte en knapp som simulerar
 * navigation via JS). ORDNING när båda kan förekomma: åtgärdskö-raden FÖRST
 * (en app-bred datakorrekthetsflagga väger tyngre än en per-event
 * tids-observation) — inget i ADR-122/PRD task-284 låser ordningen
 * explicit, så detta är ett omdömesval, öppet bokfört (TASK-284.4
 * slutrapport), inte en Marcus-order.
 *
 * [TASK-241.8] `onPress` ÄR SKARPT NU: klicket öppnar sändytan
 * (`SvepOverlay`, `svepTyp='eventinfo'`) förifiltrerad på exakt de
 * bekräftade som saknar Deltagarinfo-stämpeln FÖR DET KLICKADE eventet
 * (S102-grillningens beslut 4, `2026-08-10-session-102.md:726-727`) — se
 * `Hem.tsx` § SÄNDYTAN för montering/state. Elementet är `react-aria-
 * components`s `Button` (INTE husets styrda CVA-`Button`-primitiv, som
 * hade tvingat på en av intent/emphasis-variantformerna ovanpå denna
 * radens EGNA `--mm-navcard-*`-form) — samma val NavCard gör för sin
 * `AriaLink` (`NavCard.tsx`), av samma skäl: en riktig interaktiv-
 * primitiv för Enter/Space + pekar/touch-semantik, med klassnamnen orörda.
 * `hover:bg-bg-emphasized` är äkta CSS `:hover` (inte react-arias
 * `data-hovered`) — samma etablerade blandning `NavCardLink` redan bär.
 *
 * KOLUMN-FORM (TASK-247, fynd c) — MEDVETEN FACIT-AMENDERING, inte en
 * avvikelse-rättning: den promoverade formen (facit
 * `tasks/sessions/bilagor/s102-hem-konvergens/facit.json`, "godkand": null,
 * ännu ej Marcus-stämplad via 243.4) visar Eventnamn/dagar-kvar/status som
 * EN sammanhängande textrad (`{namn} · {dagar} · {status}`). Marcus gav en
 * uttrycklig designorder (S102 sjätte paus, prod-granskning): raderna ska
 * DELAS i kolumner så samma tre delar alignar rakt över varandra mellan
 * rader — ett avsteg från den låsta prototypformen, tillåtet under ADR-102
 * B2 ("Avsteg är tillåtna endast som ett uttryckligt, bokfört
 * Marcus-beslut"). BOKFÖRING AV SJÄLVA FACIT-AMENDERINGEN (facit.json/
 * facit-bilderna) är ÖPPEN — se TASK-247 slutrapport: ADR-102/103
 * beskriver promoveringskontraktet men ingen av dem ger en mekanik för att
 * amendera ett LÅST-MEN-EJ-STÄMPLAT facit (`lasning` satt, `godkand: null`)
 * mitt i granskningsfönstret före 243.4 — formen nedan är kodad per ordern,
 * facit-registret är INTE rört av denna commit.
 *
 * Grid i stället för sammanhängande text — NÄSTLAD och RESPONSIV, inte en
 * enda platt 4-kolumnsrad. En första platt version (`2fr 7rem
 * minmax(9rem,1fr) auto` på hela knappen) mättes trasig på mobil: vid
 * 390px räckte bredden exakt för de tre fasta/minmax-kolumnerna + chevron
 * (112+144+36(gap)+18 ≈ 310px = precis knappens fulla innehållsbredd på
 * den vyporten), och eventnamn-kolumnen (`min-w-0` tar bort dess
 * innehålls-minimum) kollapsade till 0 — "Fjärrskådning" försvann helt ur
 * renderingen (screenshot `task-247-hem-mobil.png` FÖRE denna rättning).
 * Löst med en YTTRE 2-kolumns grid (`minmax(0,1fr) auto` — innehåll +
 * chevron, aldrig färre än två fungerande kolumner) och en INRE grid för
 * själva de tre bevakningsdelarna: under `sm` (640px) staplas den till en
 * kolumn (eventnamn egen rad, "dagar · status" i en flex-rad därunder,
 * SAMMA form originalets sammanhängande textrad hade — ingenting nytt
 * kollapsar). Från `sm` och uppåt blir samma inre wrapper `sm:contents`
 * (barnen "adopteras" som riktiga grid-celler av den yttre) med
 * `sm:grid-cols-[2fr_7rem_minmax(9rem,1fr)]` — SAMMA värden på varje rad
 * (ingen `auto`/`max-content` som varierar per rads eget innehåll) ger
 * pixel-identiska kolumngränser mellan rader utan subgrid. `7rem` rymmer
 * "21 dagar kvar" (fönstrets maxvärde, `EVENTINFO_FONSTER_DAGAR` i
 * hem-derivations.ts). `line-clamp-2` sitter på eventnamn- och
 * status-kolumnen (skyddsnätet gäller fortfarande — aldrig ellips på
 * meningsbärande text); "·"-separatorn syns bara i den staplade
 * mobilformen (`sm:hidden`, `aria-hidden` — rent dekorativ, försvinner
 * helt ur DOM-flödet vid `sm:contents` så den aldrig äter en grid-cell
 * på desktop).
 *
 * TASK-243.2 AC #3-VERIFIERING (kortcopy-modulen `bevakningStatusText`/
 * `bevakningDagarText` + line-clamp-2-skyddsnätet, PR #1388 varv 4):
 * `hem-derivations.ts` bar funktionerna BYTE-IDENTISKT ur `data.ts` (diff
 * mot commit `f14d8ee9`, 0 avvikelser) VID DEN TIDPUNKTEN — inget nytt att
 * promovera, redan levererat med TASK-243.1:s helträds-kopiering. INTE
 * LÄNGRE sant för `bevakningStatusText`: TASK-241.8 (Marcus beslut
 * 2026-08-18, mitt i skivans bygge) återinförde ordet "nya" i
 * eftersläntrare-formen — se funktionens EGEN docblock i
 * `hem-derivations.ts` för hela motiveringen, inte upprepad här.
 *
 * [TASK-241.8] "NYA"-COPYNS GEOMETRI, LIVE MÄTT (`scrollHeight`/
 * `clientHeight`, `tests/acceptance/hem.acceptance.test.ts` § "'nya'-
 * copyns geometri vid värsta fall", SAMMA permanenta värsta-fall-form som
 * ovan — 91-tecken eventnamn + tvåsiffrigt antal, X=12): status-kolumnens
 * `line-clamp-2`-span ("12 nya deltagare saknar deltagarinfo") klipper INTE
 * vid NÅGON av de två viewporten — `scrollHeight` === `clientHeight` i
 * båda: **24px/24px vid 375px** (radad EN rad i den staplade mobilformen,
 * som får nästan hela radbredden), **48px/48px vid 1440px** (radad TVÅ
 * rader — desktop-gridets `minmax(9rem,1fr)`-kolumn är SMALARE än
 * mobilformens fulla bredd, trots det bredare viewportet, eftersom
 * kolumnen delar `Hem`s ≈568px-innehållskolumn med namn- och
 * dagar-kolumnerna). Exakt likhet (ingen marginal kvar) vid 1440px betyder
 * att X=12 är gränsen denna form bär UTAN ny klippning — ett tredje
 * siffertecken (X≥100) är overifierat. Ingen layoutändring krävdes: den
 * redan befintliga `line-clamp-2` (byggd för just detta ändamål, TASK-247)
 * bar den längre strängen utan att någon extra rad behövde adderas.
 *
 * KÄND, ICKE-BLOCKERANDE GRÄNSFALL (live mätt, `getBoundingClientRect`/
 * `scrollHeight` vs `clientHeight`, 375px OCH 1440px): PR #1388:s egen
 * PERMANENTA "värsta fall"-fixtur (`demoData.ts` `demo-event-bevakning-
 * varsta-fall`, "Demo: Fördjupningskurs i konflikthantering och medling
 * för föreningsledare i Västerbotten", 91 tecken) klipper FORTFARANDE med
 * webkit-ellipsis efter två rader i eventnamn-kolumnen — `scrollHeight`
 * 72–96px mot `clientHeight` 48px (375px respektive 1440px). Detta är INTE
 * en promoveringsregression: samma exakta sträng klipper HÅRDARE i den
 * LÅSTA prototypens egen rendering (`VariantRo.tsx`, en sammanhängande
 * sträng utan kolumnseparation) — `scrollHeight` 120px mot `clientHeight`
 * 48px vid 375px, dvs den skarpa grid-formen klipper MINDRE innehåll än
 * facit självt gör för samma extremfall. Realistiska namn ("Fjärrskådning",
 * "Demo: Sommarläger Örnsköldsvik", "Demo: Höstkurs Umeå") klipper INTE —
 * mätt live i samma pass. Skyddsnätets syfte (max två rader i stället för
 * en klippt/mitt-i-ordet trunkering, ADR-102) är därmed uppfyllt för det
 * realistiska intervallet; det avsiktligt extrema stresstestet är ett känt,
 * redan-i-facit-accepterat gränsfall — ADR-102 B2 kräver ett uttryckligt
 * Marcus-beslut för ett åtgärdande avsteg, denna commit tar inte det
 * beslutet åt honom (samma disciplin som `ForfallnaBetalningar.tsx`s
 * badge-squeeze-fynd, TASK-243.1 slutrapport).
 */
export function Bevakningsrad({
  rader,
  onOppnaEventinfo,
}: {
  rader: BevakningRad[];
  /** [TASK-241.8 AC #1] Klickad rads FULLA `Event` — `Hem.tsx` öppnar
      eventinfo-svepet förifiltrerat på just det eventet. Anropas ENDAST
      för `'eventinfo'`-rader; `'atgardsko'`-raden navigerar bort via
      `AtgardskoRadLink` i stället (se filens docblock § TVÅ RADTYPER). */
  onOppnaEventinfo: (event: Event) => void;
}) {
  if (rader.length === 0) return null;
  return (
    <ul aria-label="Bevakningar" className="flex min-w-0 flex-col gap-2">
      {rader.map((rad) =>
        rad.typ === 'atgardsko' ? (
          <li key="atgardsko">
            <AtgardskoLink
              to="/mer/anmalningar"
              search={{ visa: 'atgardskon' }}
              antal={rad.antal}
            />
          </li>
        ) : (
          <EventinfoRad key={rad.event.id} rad={rad} onOppna={onOppnaEventinfo} />
        ),
      )}
    </ul>
  );
}

function EventinfoRad({
  rad,
  onOppna,
}: {
  rad: EventinfoBevakningRad;
  onOppna: (event: Event) => void;
}) {
  const status = bevakningStatusText(rad);
  const dagar = bevakningDagarText(rad.dagarTillStart);
  return (
    <li>
      <AriaButton
        type="button"
        onPress={() => onOppna(rad.event)}
        className="text-(color:--mm-navcard-text) grid min-h-12 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 rounded-2xl border border-(--mm-navcard-border) bg-(--mm-navcard-bg) px-4 py-3 text-left hover:bg-bg-emphasized motion-safe:transition-colors contrast-more:border-(--mm-navcard-border-contrast)"
      >
        <span className="grid min-w-0 gap-y-0.5 sm:grid-cols-[2fr_7rem_minmax(9rem,1fr)] sm:items-center sm:gap-x-3">
          {/* line-clamp-2 i stället för truncate — en lång rad bryter till
              max två rader i stället för att klippas med ellipsis mitt i
              ett ord (Gunilla-principen: en klippt mening är obegriplig). */}
          <span className="line-clamp-2 min-w-0 font-semibold text-body">{rad.eventNamn}</span>
          <span className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 text-body text-text-secondary sm:contents">
            <span className="min-w-0">{dagar}</span>
            <span aria-hidden="true" className="sm:hidden">
              ·
            </span>
            <span className="line-clamp-2 min-w-0">{status}</span>
          </span>
        </span>
        <ChevronRight
          aria-hidden="true"
          size={18}
          className="text-(color:--mm-navcard-icon) shrink-0"
        />
      </AriaButton>
    </li>
  );
}

// className/style/children är förseglade (NavCard-precedentets mönster,
// `NavCard.tsx` rad ~17): åtgärdskö-radens form är styrd av `antal` allena,
// konsumenten komponerar inte om den.
interface AtgardskoRadLinkProps extends Omit<AriaLinkProps, 'children' | 'className' | 'style'> {
  /** Antal anmälningar som behöver kopplas om (AC #3 — räknat, aldrig gissat). */
  antal: number;
}

/**
 * Åtgärdskö-radens innehåll (TASK-284.4) — samma `--mm-navcard-*`-kortyta
 * och chevron som eventinfo-raden ovan, men EN enkel textrad (ingen
 * event-/dagar-kolumn: raden är global, inte per-event) och en RIKTIG länk
 * i stället för en knapp (se filens docblock § TVÅ RADTYPER för varför).
 * `line-clamp-2` av samma skäl som eventinfo-radens kolumner: en lång rad
 * bryter till max två rader, klipps aldrig mitt i ett ord.
 */
function AtgardskoRadLink({ antal, ...props }: AtgardskoRadLinkProps) {
  return (
    <AriaLink
      {...props}
      className="text-(color:--mm-navcard-text) flex min-h-12 w-full items-center gap-3 rounded-2xl border border-(--mm-navcard-border) bg-(--mm-navcard-bg) px-4 py-3 text-left hover:bg-bg-emphasized motion-safe:transition-colors contrast-more:border-(--mm-navcard-border-contrast)"
    >
      <span className="line-clamp-2 min-w-0 grow font-semibold text-body">
        {atgardskoText(antal)}
      </span>
      <ChevronRight
        aria-hidden="true"
        size={18}
        className="text-(color:--mm-navcard-icon) shrink-0"
      />
    </AriaLink>
  );
}

/**
 * `createLink` (NavCard-primitivens exakta mekanism, `NavCard.tsx` § docblock):
 * `to`/`search` typas mot registrerade routes — en länk mot en obefintlig
 * route eller ett search-schema som inte matchar `/mer/anmalningar`s
 * `validateSearch` är ett typfel, inte ett runtime-fel.
 */
const AtgardskoLink = createLink(AtgardskoRadLink);
