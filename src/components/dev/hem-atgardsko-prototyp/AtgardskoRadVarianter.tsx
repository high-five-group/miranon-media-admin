import { createLink } from '@tanstack/react-router';
import { ChevronRight, Link2Off } from 'lucide-react';
import type { ComponentType, ReactNode } from 'react';
import {
  Button as AriaButton,
  Link as AriaLink,
  type LinkProps as AriaLinkProps,
} from 'react-aria-components';
import { bevakningDagarText, type EventinfoBevakningRad } from '@/components/hem/hem-derivations';
import type { Event } from '@/domain/models/Event';

/**
 * [TASK-291 AC #1, amenderad TASK-303] Divergens-varianter av åtgärdskö-
 * radens INNEHÅLL — QA-fynd 284.5: raden bar NOLL visuell särskiljning mot
 * eventinfo-raden (samma `--mm-navcard-*`-tokens, samma chevron, ingen
 * ikon, `Bevakningsrad.tsx:232-248` mot `:191`, båda radnumren
 * disk-verifierade 2026-08-22). Tre sätt att särskilja raden UTAN att låna
 * notistrappans varningsfärg/ikon (ADR-122 beslut 8, DESIGN-SYSTEM-SPEC
 * §22 — arbetsobjekt/notis-familjegränsen). Varje variant bär skillnaden i
 * minst en ICKE-FÄRG-kanal (284.4 AC #5-golvet, icke förhandlingsbart):
 *
 *   A "Ikon"     — ledande fylld ikon-platta (`Link2Off`). Kanal: IKONFORM.
 *   B "Etikett"  — rubrikraden ÄR etiketten ("Kräver åtgärd"). Kanal: TEXT.
 *   C "Räknare"  — ledande fylld platta med SIFFRAN.       Kanal: FORM.
 *
 * MARCUS VAL (kortets Implementation Notes, 2026-08-22): variant A, med en
 * amendering — "ikonen bakgrundsfärg ... knappens bakgrundsfärg" i stället
 * för att färga hela radens kortyta (som ADR-122 beslut 8 avvisar — en
 * färgad kortyta är notisfamiljens grepp). Ikonens BEHÅLLARE fylls i
 * stället, med `--mm-atgardsko-markor-bg/-text`
 * (`src/styles/tokens/components.css`) — se den tokenkommentaren för
 * kontrastmätningarna.
 *
 * [TASK-303, tillagd 2026-08-23 mitt i skivans bygge — Marcus verbatim via
 * orkestreraren: "du bygger en prototyp som vi kan promovera till skarpa
 * bevakningrad.tsx nu va? För det tar vi tag i direkt, problemet med höjd
 * och radbrytning."] Bevakningsradens höjd varierade tidigare med copyns
 * längd (båda radtyperna bar `line-clamp-2`, TASK-303-fyndet). BESLUTAD
 * VÄG (Marcus, TASK-303-kortet, verbatim: "Jag står vid dina
 * rekommendationer på alla punkter"): ANATOMI i stället för radbrytning —
 * rubrikrad + undertext, ALLTID båda renderade, samma form som
 * personlistans radanatomi (`src/components/persons/PersonsList.tsx`
 * ~rad 1052-1188: ledande cirkel · text-block med `truncate`-rader,
 * ALDRIG villkorat bort · en trailing-badge med RESERVERAD plats,
 * `invisible` när den inte gäller, aldrig avmonterad). Delad byggsten
 * `RadInnehall`/`RadBadge` nedan bär samma anatomi för BÅDA radtyperna
 * (eventinfo OCH åtgärdskö) — se `EventinfoRadAnatomi` längst ned i denna
 * fil, konsumerad av routens referensrad i variant-läge.
 *
 * TALET SOM BADGE (TASK-303 AC #3): den varierande siffran ligger ALDRIG
 * längre inbakad i en mening — den bärs av `RadBadge`, en egen,
 * bredd-reserverad platta (`tabular-nums`, fast `min-w`). Kvarvarande text
 * (rubrik + undertext) blir därmed KONSTANT oavsett datan, vilket är
 * SKÄLET till att en enda `truncate`-rad (i stället för `line-clamp-2`)
 * är trygg här: den konstanta texten är mätt för att rymmas på en rad vid
 * 375px (se `EventinfoRadAnatomi`s docblock för siffrorna) — till
 * skillnad från eventnamnet (äkta, obegränsad användardata), som ÄRVER
 * personlistans egna `truncate`-hantering av långa namn (samma avvägning
 * `PersonsList.tsx` redan gör för långa namn, inte en ny regel).
 *
 * VARIANT C:s UNDANTAG, ÖPPET BOKFÖRT: C:s ledande platta BÄR redan talet
 * (dess ursprungliga koncept) — den får därför INGEN separat trailing-
 * badge (`badge` utelämnad), annars skulle samma tal synas två gånger på
 * samma rad. Plattan är av samma skäl INTE `aria-hidden` (till skillnad
 * från A:s rent dekorativa ikon) — annars skulle talet försvinna helt ur
 * tillgänglighetsträdet sedan rubrik/undertext blev konstant text.
 *
 * DELAD SKAL (`AtgardskoRadSkal`): identisk yttre form som produktionens
 * `AtgardskoRadLink` (`Bevakningsrad.tsx`) — samma `--mm-navcard-*`-yta,
 * samma chevron, samma länk-primitiv (`AriaLink`+`createLink`,
 * `NavCard`-mönstret som `Bevakningsrad.tsx` redan följer). Ingen variant
 * lånar `bg-warning-bg`/`text-warning`/`TriangleAlert`/`CircleAlert`
 * (notisfamiljens paletter, se `StatusBadge.tsx` ton="warning" för vad som
 * INTE återanvänds här).
 *
 * FRISTÅENDE, INGEN IMPORT FRÅN `dev/hem-prototyp/`: TASK-226-substratets
 * `demoData.ts`/`VariantRo.tsx` m.fl. bär sitt EGET throwaway-kontrakt
 * (rivs med förlorarna/vid facit-skrivning) och är dessutom under aktiv
 * ändring av en parallell agent (TASK-299.1, `InitialAvatar.tsx`-flytten)
 * vid tidpunkten denna fil ursprungligen skrevs — noll beroende dit håller
 * båda passen fria från varandra. `hem-derivations.ts` (den SKARPA
 * härledningsmodulen) importeras däremot fritt — den är redan Bevaknings-
 * radens egen källa och rörs inte av denna fil.
 *
 * THROWAWAY-KONTRAKT (marcus-system:prototype-skillen, UI-gren): denna fil
 * hör till DIVERGENSFASEN. Förlorarna rivs efter Marcus val (AC #2); den
 * vinnande formen promoveras till `Bevakningsrad.tsx`s `AtgardskoRadLink`
 * OCH `EventinfoRad` i ett SEPARAT kort (AC #3/TASK-303 AC #7) — INTE
 * denna commit. Skarp yta (`Bevakningsrad.tsx`) är HELT ORÖRD av denna
 * fil.
 */

type AtgardskoInnehallProps = {
  /** Räknat antal (aldrig gissat) — se TASK-303 AC #3, badgen nedan. */
  antal: number;
};

/** 99+-taket för variant C:s ledande siffer-platta (`antal > 99 ? '99+'`).
    Bar tidigare även A/B:s trailing-badge; den är riven (Marcus 2026-08-23,
    talet flyttat tillbaka in i meningen), så C är enda konsumenten kvar. */
function badgeVarde(antal: number): string {
  return antal > 99 ? '99+' : String(antal);
}

/**
 * [TASK-303 AC #2, omarbetad på Marcus order 2026-08-23] Den DELADE
 * radanatomin — rubrikrad + undertext, ALLTID båda renderade (aldrig
 * villkorat bort, exakt personlistans höjdlås-disciplin). `marker`
 * (ledande ikon/siffra) är valfri så samma byggsten bär variant B (utan
 * marker) lika enkelt som A och C.
 *
 * MARCUS ÄNDRING, verbatim: "jag vill ta bort siffer-pillen och sätta
 * chevronen centrerat. Istället för siffer-pillen på bevakningsraden så
 * vill jag att vi skriver ut '3 nya deltagare saknar deltagarinfo',
 * siffran ska alltså in i meningen."
 *
 * VARFÖR FLEX HÄR, TROTS ATT GRIDEN INFÖRDES FÖR ATT LÖSA EN MÄTT BUGG.
 * Den tidigare formen hade badge OCH chevron INNE i textblocket, på rad 1.
 * En naiv `flex-col` gav då undertexten bara ~179-227px vid 375px
 * (`scrollWidth` översteg `clientWidth` med 45-60px = klippning mitt i ord,
 * det AC #4 och `Bevakningsrad.tsx`s ursprungliga `line-clamp-2`-motivering
 * förbjuder), och griden fanns för att låta rad 2 återta bredden under dem.
 *
 * Med badgen RIVEN och chevronen flyttad UT ur textblocket — den är nu
 * syskon till textblocket i förälderns `flex items-center` — konkurrerar
 * ingenting längre om rad 1:s bredd. Båda raderna får samma bredd, och det
 * finns inget att återta. Det är dessutom exakt Hems listanatomi
 * (`NyaAnmalningar.tsx`: avatar · `flex-col`-textblock · högerställd meta),
 * som Marcus i samma besked pekade ut som formen anmälningslistan ska ha —
 * två ytor, en anatomi.
 *
 * CHEVRONEN CENTRERAS MOT HELA RADEN av förälderns `items-center`, inte mot
 * rubrikraden som griden gjorde med `self-center` i `row-start-1`.
 *
 * HÖJDLÅSET vilar nu på att undertexten ryms på EN rad: talet är tillbaka i
 * meningen och `deltagarinfo` är tre tecken längre än `eventinfo`, så raden
 * växte. Mätt vid 375px med 1-, 2- och 3-siffriga tal — siffrorna står i
 * commit-meddelandet, inte upprepade här som en andra kopierbar källa.
 */
function RadInnehall({
  marker,
  header,
  subtext,
}: {
  marker?: ReactNode;
  header: string;
  subtext: string;
}) {
  return (
    <>
      {marker}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-semibold text-body">{header}</span>
        <span className="truncate text-caption text-text-secondary">{subtext}</span>
      </span>
      <ChevronRight
        aria-hidden="true"
        size={18}
        className="text-(color:--mm-navcard-icon) shrink-0"
      />
    </>
  );
}

function AtgardskoRadSkal({
  children,
  ...props
}: Omit<AriaLinkProps, 'children' | 'className' | 'style'> & {
  children: React.ReactNode;
}) {
  return (
    <AriaLink
      {...props}
      className="text-(color:--mm-navcard-text) flex min-h-14 w-full items-center gap-3 rounded-2xl border border-(--mm-navcard-border) bg-(--mm-navcard-bg) px-4 py-3 text-left hover:bg-bg-emphasized motion-safe:transition-colors contrast-more:border-(--mm-navcard-border-contrast)"
    >
      {children}
    </AriaLink>
  );
}
const AtgardskoLinkSkal = createLink(AtgardskoRadSkal);

/**
 * VARIANT A — "Ikon": en ledande fylld cirkel-platta (`Link2Off`, "bruten
 * länk" — matchar felets natur: anmälningen kunde inte KOPPLAS till rätt
 * event) före textblocket. Icke-färg-kanalen är IKONENS FORM (synlig i
 * gråskala/high-contrast). Plattans fyllnad är `--mm-atgardsko-markor-bg`
 * (Marcus amendering, se filhuvudet) — mätt 13,38:1 mot radytan, 14,60:1
 * mot ikonen, se `components.css`. Rubrik/undertext är KONSTANT text
 * (TASK-303) — talet bärs av den trailing badgen.
 */
export function AtgardskoRadIkon({ antal }: AtgardskoInnehallProps) {
  return (
    <AtgardskoLinkSkal to="/mer/anmalningar" search={{ visa: 'atgardskon' }}>
      <RadInnehall
        marker={
          <span
            aria-hidden="true"
            className="text-(color:--mm-atgardsko-markor-text) flex size-8 shrink-0 items-center justify-center rounded-full bg-(--mm-atgardsko-markor-bg) contrast-more:border contrast-more:border-(--mm-navcard-border-contrast)"
          >
            <Link2Off size={16} />
          </span>
        }
        header="Kräver åtgärd"
        subtext={`${antal} anmälningar kunde inte kopplas till rätt event`}
      />
    </AtgardskoLinkSkal>
  );
}

/**
 * VARIANT B — "Etikett": ingen ledande markör — rubrikraden SJÄLV är
 * etiketten ("Kräver åtgärd", samma text som A:s rubrik nu bär, se
 * filhuvudets ärliga bokföring av att anatomin drar innehållet närmare
 * varandra). Icke-färg-kanalen är TEXTEN SJÄLV, aldrig `aria-hidden` —
 * skiljer sig från A/C:s dekorativa markörer.
 */
export function AtgardskoRadEtikett({ antal }: AtgardskoInnehallProps) {
  return (
    <AtgardskoLinkSkal to="/mer/anmalningar" search={{ visa: 'atgardskon' }}>
      <RadInnehall
        header="Kräver åtgärd"
        subtext={`${antal} anmälningar kunde inte kopplas till rätt event`}
      />
    </AtgardskoLinkSkal>
  );
}

/**
 * VARIANT C — "Räknare": en ledande fylld cirkel-platta med SIFFRAN i
 * stället för en ikon. Icke-färg-kanalen är FORMEN (cirkel + siffra).
 * UNDANTAGET (öppet bokfört i filhuvudet): plattan BÄR redan talet, så
 * denna variant får INGEN separat trailing-badge — och plattan är därför
 * INTE `aria-hidden` (annars försvinner talet ur tillgänglighetsträdet
 * helt, sedan rubrik/undertext blev konstant text under TASK-303).
 */
export function AtgardskoRadRaknare({ antal }: AtgardskoInnehallProps) {
  return (
    <AtgardskoLinkSkal to="/mer/anmalningar" search={{ visa: 'atgardskon' }}>
      <RadInnehall
        marker={
          <span className="text-(color:--mm-atgardsko-markor-text) flex size-8 shrink-0 items-center justify-center rounded-full bg-(--mm-atgardsko-markor-bg) font-semibold text-small tabular-nums contrast-more:border contrast-more:border-(--mm-navcard-border-contrast)">
            {badgeVarde(antal)}
          </span>
        }
        header="Kräver åtgärd"
        subtext="Kunde inte kopplas till rätt event"
      />
    </AtgardskoLinkSkal>
  );
}

export type AtgardskoVariantKey = 'a' | 'b' | 'c';

/** Route-hemvisten slår upp variant-komponenten via denna karta i stället
    för en switch-sats — en ny variant kräver bara en rad här. */
export const ATGARDSKO_VARIANTER: Record<
  AtgardskoVariantKey,
  ComponentType<AtgardskoInnehallProps>
> = {
  a: AtgardskoRadIkon,
  b: AtgardskoRadEtikett,
  c: AtgardskoRadRaknare,
};

/**
 * [TASK-303] Eventinfo-radens NYA anatomi — prototyp-parallell till
 * `Bevakningsrad.tsx`s `EventinfoRad` (som är ORÖRD, § filhuvudet).
 * Samma interaktionsmodell (äkta `AriaButton`, `onPress` öppnar
 * eventinfo-svepet, ADR-114) och `<li>` som originalet — bara den INRE
 * anatomin byts mot den delade `RadInnehall`.
 *
 * RUBRIK = eventnamnet (äkta, obegränsad data) — `truncate`, EN rad,
 * samma avvägning `PersonsList.tsx`s namn-länk redan gör.
 *
 * UNDERTEXT = `"{dagar} · {statuskonstant}"`. Talet (`antalUtanEventinfo`)
 * är INTE längre inbakat — det bärs av `RadBadge`. Kvarvarande text är
 * KONSTANT (varierar aldrig med N) — bredden vid 375px är LIVE-mätt via
 * `getBoundingClientRect`/`scrollWidth` mot renderad dev-server-yta,
 * siffrorna står i agentens slutrapport (inte upprepade här som en andra,
 * kopierbar källa — samma disciplin `CLAUDE.md` § "npm run check:docs"
 * kräver för mätetal).
 *
 * BADGEN är `dold` (reserverad, osynlig) för `ej-skickad`-läget — det
 * lägets copy ("Eventinfo saknas") har ALDRIG burit ett tal, och TASK-303s
 * sträng-divergensbeslut (AC #5) rör bara eftersläntrare-formen. Att
 * plötsligt visa `antalUtanEventinfo` där hade ändrat lägets BETYDELSE,
 * inte bara dess form — ett beslut denna commit inte tar åt Marcus.
 *
 * STRÄNG-DIVERGENSEN (TASK-303, flaggad EJ avgjord i AC #5-mening):
 * skarpa appen (`hem-derivations.ts:319`) säger
 * `"N nya deltagare saknar eventinfo"`; prototypens tidigare substrat
 * (`dev/hem-prototyp/data.ts:312`) säger `"N deltagare saknar eventinfo"`
 * (utan "nya"). Denna komponent använder den SKARPA formens fulla text
 * ("Nya deltagare saknar eventinfo") per uttrycklig instruktion — ordet
 * "nya" friar Lotta från en falsk glömske-signal (grillningens beslut 4,
 * `2026-08-10-session-102.md:726-727`). AC #5 KVARSTÅR ÖPPEN: detta är EJ
 * det formella avgörandet av vilken sträng som vinner, bara vilken som
 * används HÄR — Marcus citat daterat på TASK-303-kortet krävs innan de två
 * ytorna räknas som synkade.
 *
 * VERSALEN på "Nya" (rättad efter orkestrerarens observation mitt i
 * bygget, 2026-08-23): badge-extraktionen (AC #3) flyttar talet UT ur
 * meningen, så "· nya deltagare ..." läste som ett avhugget fragment i
 * stället för en mening — samma ord som förut hängde ihop ("3 nya
 * deltagare saknar eventinfo") stod plötsligt löst. "·" behandlas som en
 * klausul-avskiljare (samma konvention som ett semikolon eller tankstreck)
 * — varje klausul inleds med versal. Ordet "nya" SJÄLVT är orört (Marcus
 * motivering står kvar, se ovan); bara begynnelsebokstaven ändrades.
 */
export function EventinfoRadAnatomi({
  rad,
  onOppna,
}: {
  rad: EventinfoBevakningRad;
  onOppna: (event: Event) => void;
}) {
  const dagar = bevakningDagarText(rad.dagarTillStart);
  const ejSkickad = rad.lage === 'ej-skickad';
  const subtext = ejSkickad
    ? `${dagar} · Deltagarinfo saknas`
    : `${dagar} · ${rad.antalUtanEventinfo} nya deltagare saknar deltagarinfo`;
  return (
    <li>
      <AriaButton
        type="button"
        onPress={() => onOppna(rad.event)}
        className="text-(color:--mm-navcard-text) flex min-h-14 w-full items-center gap-3 rounded-2xl border border-(--mm-navcard-border) bg-(--mm-navcard-bg) px-4 py-3 text-left hover:bg-bg-emphasized motion-safe:transition-colors contrast-more:border-(--mm-navcard-border-contrast)"
      >
        <RadInnehall header={rad.eventNamn} subtext={subtext} />
      </AriaButton>
    </li>
  );
}
