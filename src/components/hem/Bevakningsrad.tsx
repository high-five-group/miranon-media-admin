import { createLink } from '@tanstack/react-router';
import { ChevronRight, Link2Off } from 'lucide-react';
import type { ReactNode } from 'react';
import {
  Button as AriaButton,
  Link as AriaLink,
  type LinkProps as AriaLinkProps,
} from 'react-aria-components';
import type { Event } from '@/domain/models/Event';
import {
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
 * Åtgärdskön): `'eventinfo'` och `'atgardsko'`. De delar
 * `<ul aria-label="Bevakningar">`, samma `--mm-navcard-*`-kortyta och sedan
 * TASK-303 samma RADANATOMI (`RadInnehall` nedan), men interaktions-
 * elementet skiljer sig med avsikt: eventinfo-raden ÖPPNAR ett svep PÅ Hem
 * (`AriaButton`, ADR-114 "Hem PEKAR, svepet SKICKAR"), åtgärdskö-raden
 * NAVIGERAR BORT till åtgärdsytan (`/mer/anmalningar`, förfiltrerad via
 * `?visa=atgardskon`) eftersom resolutionen (TASK-284.3, eventväljaren)
 * inte är ett Hem-scopat svep — samma `createLink`+`AriaLink`-mönster
 * `NavCard.tsx` bär, av samma skäl (en riktig länk-primitiv för
 * Enter/Space + höger-klicka-öppna-i-ny-flik, inte en knapp som simulerar
 * navigation via JS). ORDNING när båda kan förekomma: åtgärdskö-raden FÖRST
 * (en app-bred datakorrekthetsflagga väger tyngre än en per-event
 * tids-observation) — inget i ADR-122/PRD task-284 låser ordningen
 * explicit, så detta är ett omdömesval, öppet bokfört (TASK-284.4
 * slutrapport), inte en Marcus-order.
 *
 * [TASK-241.8] `onPress` ÄR SKARPT: klicket öppnar sändytan (`SvepOverlay`,
 * `svepTyp='eventinfo'`) förifiltrerad på exakt de bekräftade som saknar
 * Deltagarinfo-stämpeln FÖR DET KLICKADE eventet (S102-grillningens beslut
 * 4, `2026-08-10-session-102.md:726-727`) — se `Hem.tsx` § SÄNDYTAN för
 * montering/state. Elementet är `react-aria-components`s `Button` (INTE
 * husets styrda CVA-`Button`-primitiv, som hade tvingat på en av
 * intent/emphasis-variantformerna ovanpå denna radens EGNA
 * `--mm-navcard-*`-form) — samma val NavCard gör för sin `AriaLink`, av
 * samma skäl. `hover:bg-bg-emphasized` är äkta CSS `:hover` (inte
 * react-arias `data-hovered`) — samma etablerade blandning `NavCardLink`
 * redan bär.
 *
 * ── PROMOVERAD FORM (TASK-291 AC #3 + TASK-303, 2026-08-23) ──────────────
 *
 * ADR-103 B2 steg 1: formen nedan är PROMOVERAD ur prototypen
 * `src/components/dev/hem-atgardsko-prototyp/AtgardskoRadVarianter.tsx`
 * (variant A + `EventinfoRadAnatomi`), inte omskriven ur minnet. Paret som
 * bevisar det är `tests/visual/hem-bevakningsrad-promoverings-grind.spec.ts`
 * (ADR-103 B4): referenserna fångades ur prototypens variant-läge FÖRE
 * flippen och är gröna mot denna yta EFTER den.
 *
 * Marcus godkännande, verbatim (S111 Del 5, 2026-08-23): *"Ser bra ut. Jag
 * godkänner bevakningsraden och åtgärdskö-raden nu."* Den godkända formen,
 * post för post ur Del 5-tabellen: siffer-pillen RIVEN och talet tillbaka i
 * texten (eventinfo-raden `3 nya saknar deltagarinfo`, åtgärdskö-radens tal
 * i RUBRIKEN `12 kräver åtgärd`) · chevronen centrerad mot HELA raden
 * (0,0 px avvikelse) · tiden centrerad i en vit pill (12 px till chevronen,
 * textkontrast 7,91:1) · höjden 70 px KONSTANT, till fyrsiffriga tal.
 * Åtgärdskö-radens ledande `Link2Off` i fylld cirkel är Marcus amendering
 * av variant A (TASK-291 kortets notes, 2026-08-22: *"ikonen bakgrundsfärg
 * kanske skulle vara knappens bakgrundsfärg istället?"*) — tokens
 * `--mm-atgardsko-markor-bg/-text`, mätt 13,38:1 mot kortytan och 14,60:1
 * mot ikonen (se `components.css`).
 *
 * VAD SOM REVS, ÖPPET: den tidigare KOLUMN-GRIDEN (TASK-247 fynd c —
 * eventnamn/dagar/status som tre alignade kolumner, `sm:contents` +
 * `sm:grid-cols-[2fr_7rem_minmax(9rem,1fr)]`) och dess `line-clamp-2`-
 * skyddsnät. Den formen kunde inte bära höjdlåset: TASK-303:s fynd är att
 * höjden VARIERADE med copyns längd, och `line-clamp-2` var själva
 * mekanismen som lät den göra det (mätt 2026-08-23 på `943639a4`:
 * `hem.acceptance` föll med `scrollHeight` 72 mot `clientHeight` 48 vid
 * 1440 px). Skyddsnätets syfte — aldrig en klippt MENING — bärs nu av
 * anatomin i stället: undertexten är en egen rad med egen full bredd, och
 * dess copy är kortad så den ryms (`hem-derivations.ts` §
 * `bevakningStatusText`).
 *
 * KVARSTÅENDE KLIPPNING, ÄRLIGT BOKFÖRD: RUBRIKEN (eventnamnet) bär
 * `truncate` och klipps därför med ellipsis för mycket långa namn — PR
 * #1388:s permanenta 91-teckens värsta-fall-fixtur (`demoData.ts`
 * `demo-event-bevakning-varsta-fall`) är ett sådant. Det är den avvägning
 * TASK-303-kortet självt namnger som olöslig ("TRE KRAV SOM INTE KAN HÅLLA
 * SAMTIDIGT"): höjden får inte variera, texten får inte klippas, ordet
 * "nya" ska stå kvar. Den godkända formen offrar klippnings-kravet för
 * RUBRIKEN (ett egennamn, inte en mening) och behåller det för UNDERTEXTEN
 * (meningen). TASK-303 AC #3 ("Ingen text klipps mitt i ett ord i något
 * läge") är därmed INTE sann för rubriken; kriteriet är inte bockat av
 * promoveringen och kräver Marcus ord, precis som kortets redan strukna
 * badge-kriterium gjorde.
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

/**
 * [TASK-303 AC #2] Den DELADE radanatomin för BÅDA radtyperna — rubrikrad +
 * undertext, ALLTID båda renderade (aldrig villkorat bort), samma form som
 * personlistans radanatomi (`PersonsList.tsx`). Höjden blir konstant av
 * KONSTRUKTION: två textrader som var för sig alltid är exakt en rad höga.
 *
 * TVÅRADIGT GRID, INTE `flex-col`. En naiv `flex-col` klämmer undertexten
 * (live-mätt i prototypen: `scrollWidth` över `clientWidth` vid 375 px, dvs
 * klippning mitt i ett ord). Griden låter i stället rubrikraden och
 * undertexten dela kolumn 1, medan meta-pillen och chevronen bor i egna
 * kolumner och SPÄNNER båda raderna (`row-span-2 self-center`) — det är vad
 * "centrerad mot hela raden" betyder, Marcus verbatim: *"Tiden måste ju
 * ligga centrerat lagom långt från chevronen."* `gap-x-3` ger de 12 px
 * mellan pillen och chevronen som Del 5-tabellen mäter.
 *
 * META-PILLEN lånar `PersonsList.tsx`s `Pill`-form rakt av (`rounded-full
 * px-2 py-0.5 font-medium text-caption`, `bg-surface text-text-secondary`)
 * — husets etablerade form, ingen ny uppfunnen. Marcus: *"Tiden behöver
 * dessutom ligga i en vit pill."*
 */
function RadInnehall({
  marker,
  header,
  subtext,
  meta,
}: {
  marker?: ReactNode;
  header: string;
  subtext: string;
  meta?: string;
}) {
  return (
    <>
      {marker}
      <span className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-3 gap-y-0.5">
        <span className="col-start-1 row-start-1 truncate font-semibold text-body">{header}</span>
        {meta && (
          <span className="col-start-2 row-span-2 row-start-1 shrink-0 self-center rounded-full bg-surface px-2 py-0.5 font-medium text-caption text-text-secondary">
            {meta}
          </span>
        )}
        <ChevronRight
          aria-hidden="true"
          size={18}
          className="text-(color:--mm-navcard-icon) col-start-3 row-span-2 row-start-1 shrink-0 self-center"
        />
        <span className="col-start-1 row-start-2 truncate text-caption text-text-secondary">
          {subtext}
        </span>
      </span>
    </>
  );
}

/** Radernas gemensamma yttre form — SAMMA klasslista på båda radtyperna, så
    en formändring inte kan träffa den ena utan den andra. `min-h-14` är ett
    GOLV, inte höjden: den faktiska höjden ges av anatomin (två enradiga
    textrader + `py-3`) och är mätt konstant, se filens docblock. */
const RAD_YTA =
  'text-(color:--mm-navcard-text) flex min-h-14 w-full items-center gap-3 rounded-2xl border border-(--mm-navcard-border) bg-(--mm-navcard-bg) px-4 py-3 text-left hover:bg-bg-emphasized motion-safe:transition-colors contrast-more:border-(--mm-navcard-border-contrast)';

function EventinfoRad({
  rad,
  onOppna,
}: {
  rad: EventinfoBevakningRad;
  onOppna: (event: Event) => void;
}) {
  return (
    <li>
      <AriaButton type="button" onPress={() => onOppna(rad.event)} className={RAD_YTA}>
        <RadInnehall
          header={rad.eventNamn}
          subtext={bevakningStatusText(rad)}
          meta={bevakningDagarText(rad.dagarTillStart)}
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
 * Åtgärdskö-radens innehåll (TASK-284.4, promoverad form TASK-291 AC #3).
 * Samma kortyta och samma anatomi som eventinfo-raden ovan, men med en
 * RIKTIG länk i stället för en knapp (se filens docblock § TVÅ RADTYPER)
 * och med en ledande MARKÖR som särskiljer radtypen — QA-fynd 284.5 var att
 * de två radtyperna bar NOLL visuell särskiljning.
 *
 * SÄRSKILJNINGEN BÄRS AV IKONFORMEN, inte av färg (TASK-284.4 AC #5-golvet:
 * aldrig betydelse enbart genom färg). `Link2Off` — "bruten länk" — matchar
 * felets natur: anmälningen kunde inte KOPPLAS till rätt event. Cirkeln
 * lånar ALDRIG notistrappans varningsfärg/ikon; familjegränsen mot
 * notisfamiljen (ADR-122 beslut 8, DESIGN-SYSTEM-SPEC §22) står orörd —
 * bevakningsraden är ett arbetsobjekt, tillståndsbundet.
 *
 * COPYN ÄR TVÅDELAD OCH LOKAL, inte `atgardskoText`. Rubriken bär talet
 * ("12 kräver åtgärd", Marcus Del 5) och undertexten bär orsaken. Den
 * delade `atgardskoText` ("N anmälningar kunde inte kopplas till rätt
 * event") är EN mening och kan därför inte fylla en tvådelad anatomi; den
 * lever kvar oförändrad på `/mer/anmalningar` (`AnmalningarSida.tsx` —
 * `AnmalningarList.tsx` riven/döpt om, `TASK-299.5`), som är den yta den
 * skrevs för. Samma tal, samma orsak, två ytors egna former
 * — se `registration-display.ts` § `atgardskoText`, vars docblock bär samma
 * bokföring från andra hållet.
 */
function AtgardskoRadLink({ antal, ...props }: AtgardskoRadLinkProps) {
  return (
    <AriaLink {...props} className={RAD_YTA}>
      <RadInnehall
        marker={
          <span
            aria-hidden="true"
            className="text-(color:--mm-atgardsko-markor-text) flex size-8 shrink-0 items-center justify-center rounded-full bg-(--mm-atgardsko-markor-bg) contrast-more:border contrast-more:border-(--mm-navcard-border-contrast)"
          >
            <Link2Off size={16} />
          </span>
        }
        header={`${antal} kräver åtgärd`}
        subtext="Kunde inte kopplas till rätt event"
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
