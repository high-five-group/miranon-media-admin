import { Link } from '@tanstack/react-router';
import { type LucideIcon, Printer, Send, UserCheck } from 'lucide-react';
import { Button } from '@/components/primitives/Button';
import {
  HANDLINGSRAD_KLASS,
  HANDLINGSRAD_OMSLAG_KLASS,
  HandlingsRadInnehall,
} from '@/components/primitives/HandlingsRad';

/**
 * [TASK-147.8, NAMNBYTE] Check-in-ingången + GENVÄGAR-ytan (tidigare kallad
 * "åtgärds-ytan" i denna fils och sviternas historik — task-18.3; S73-facit
 * K19–K26, K47, K72; amenderad av task-18.15). MARCUS-BESLUT 2026-08-10 (S102,
 * namnkollisionen, kortets Implementation Notes): två ytor bar samma namn —
 * DENNA lilla kortkedja på eventsidan (genvägar UT till andra sidor: check-in,
 * åtgärdssidan, utskrift) och den RIKTIGA åtgärds-sidan
 * (`src/components/events/atgarder/AtgardsSida.tsx`, "den enda platsen där
 * något verkställs"). Beslutet: åtgärds-sidan behåller namnet "Åtgärder";
 * DENNA ytas informella namn (kommentarer, testtitlar) är nu "genvägar-ytan"
 * — inget rendera UI ändras (ingen gemensam rubrik fanns att döpa om; se
 * `EventDetail.tsx`s docblock för varför en NY rubrik hade varit en
 * obehörig formändring mot det låsta facit, `eventsida-promoverings-
 * grind.spec.ts`). Nyskriven mot facit-bilagan (throwaway-kontraktet —
 * prototypkod absorberas aldrig); facit-referenserna (K-stegen) pekar på den
 * låsta konvergens-trailen.
 *
 * Radformen (K20/K25/K72): VÄNSTERSTÄLLDA rader med ledande kolumn (ikon för
 * check-in-ingången, 16 px), chevron höger (18 px — chevron betyder att raden
 * leder vidare; den gamla ingen-chevron-regeln revs öppet i denna skiva, spec
 * §14) och hover-PLATTAN (K56-grammatiken: -mx-2 px-2 rounded-lg +
 * bg-emphasized + motion-safe) — plattan skjuter 8 px utanför kortets
 * 16 px-inset utan att texten flyttas. Radens totalhöjd är konstant (wrapper
 * py-1.5 + knapp py-1.5 = 12 px lodrätt kring 24 px-textraden); wrappern är
 * flex-col så flex-stretchen ger knappen full bredd trots w-auto (K54-vakten:
 * aldrig w-full ihop med -mx-2).
 *
 * [TASK-162.2, ADR-103 B2 steg 1] Åtgärds-GRUPPEN (den rubricerade sektionen
 * med numrerade rader, `Atgarder`, tidigare nedan i filen) är PROMOVERAD
 * BORT: `AtgarderKort` ("Gå till åtgärder") + `SkrivUtKort` (fristående
 * "Skriv ut"-knapp) är sedan denna skiva den OVILLKORLIGA formen på
 * eventsidan (`EventDetail.tsx`) — den gamla grenen fanns bakom
 * `?variant=a`-villkoret, nu riven (git bevarar, senast i main före denna
 * commit; se rivningsnoterna nedan). Radformen ovan (K20/K25/K72) lever kvar
 * i `CheckInKort` OCH `AtgarderKort` — båda via samma `HandlingsLank`
 * (TASK-147.8 kopplade `AtgarderKort`s länkmål skarpt; se dess egen docblock).
 * [RIVEN, TASK-145.6] Variant-villkoret/switcher-monteringen/`?variant`-
 * maskineriet i övrigt (registret, `PrototypeSwitcher`) — ORÖRT av denna
 * skiva — är nu riven i sin helhet (ADR-103 B2 steg 4, efter Marcus
 * godkännande). Se `EventDetail.tsx`/`Deltagare.tsx`/`Betalningar.tsx` för
 * rivningen.
 */
// Formen bor sedan S107 i primitiven `HandlingsRad` — hem-vyns Genvägar
// konsumerar SAMMA sträng och samma innehållsgrammatik, så de två ytorna
// inte kan glida isär igen (de hade gjort det: se primitivens doc-block).
const RAD_KLASS = HANDLINGSRAD_KLASS;

/**
 * Radnumret i vit ruta (18.15-facitet; S83 konvergens-pass 2, Marcus-låst
 * 2026-07-24): 24×24 (size-6) i radens/hover-plattans radie-språk (rounded-lg,
 * K56 — kortets YTTERradie är 16 px och en annan skala) och
 * bg-surface — VIT, får ALDRIG dela färg med radens hover-platta
 * bg-emphasized (den grå rutan föll på exakt den hover-kollisionen i
 * konvergensen; färgvalet är beslutsgrundat). aria-hidden: numret är VISUELL
 * referens ("gå till åtgärd 4" i instruktioner och manualer,
 * Gunilla-principen) — radNAMNET är oförändrat (AT-pariteten, AC 2).
 */
function NumRuta({ n }: { n: number }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex size-6 shrink-0 items-center justify-center rounded-lg bg-surface font-semibold text-caption text-text-secondary"
    >
      {n}
    </span>
  );
}

/** Radens ledande slot — exakt EN form per rad: åtgärds-raderna bär RADNUMMER
    (18.15), check-in-ingången behåller sin ikon (berörs ej av skivan). */
type Ledande = { nummer: number; ikon?: never } | { ikon: LucideIcon; nummer?: never };

/**
 * [RIVEN, TASK-162.2, ADR-103 B2 steg 1] `HandlingsRad` (Åtgärds-gruppens
 * numrerade KNAPP-rad — "Skriv ut denna detaljsida" var dess enda
 * anropsplats) bodde här. Riven med hela gruppen (`Atgarder`, tidigare
 * nedan): dess enda konsument är borta, och `SkrivUtKort` (som ersätter
 * utskriftsraden i den promoverade formen) är en helt annan radform
 * (`Button`-primitiven, inte `RAD_KLASS`-raden). Git bevarar
 * implementationen (senast i main före denna commit). `HandlingsLank`
 * (nedan) består oförändrad — `CheckInKort`s konsumtion är orörd; TASK-147.8
 * gav den en ANDRA konsument (`AtgarderKort`, nedan) utan att ändra formen.
 */

/** Åtgärdsradens länkform — samma renderade grammatik som knappraden (K26:
    samma överallt), som router-typad länk; ledande slot per Ledande-unionen. */
function HandlingsLank({
  to,
  eventId,
  children,
  ...ledande
}: Ledande & {
  to: '/event/$eventId/ny-anmalan' | '/event/$eventId/narvaro' | '/event/$eventId/atgarder';
  eventId: string;
  children: string;
}) {
  return (
    <div className={HANDLINGSRAD_OMSLAG_KLASS}>
      <Link to={to} params={{ eventId }} className={RAD_KLASS}>
        <HandlingsRadInnehall
          ledande={
            ledande.nummer !== undefined ? (
              <NumRuta n={ledande.nummer} />
            ) : (
              <ledande.ikon aria-hidden="true" size={16} className="shrink-0" />
            )
          }
        >
          {children}
        </HandlingsRadInnehall>
      </Link>
    </div>
  );
}

/**
 * Check-in-ingången (K23–K26): eventdagens PRIMÄRHANDLING som eget framhävt
 * kort ÖVER genvägar-ytan (Eventbrite/Luma-klassen; sedan TASK-162.2
 * `AtgarderKort` + `SkrivUtKort`, tidigare den rubricerade Åtgärder-gruppen),
 * aldrig en rad i den. Kortet bär EXAKT åtgärdsradens form i ett eget
 * kort-skal UTAN rubrik (K26) —
 * det speciella bärs av placeringen + ensamheten, inte av avvikande mått.
 *
 * LÄNKMÅLET ÄR BELAGT-INTERIM (öppet avgjort i skivan, PRD beslut 18-mönstret):
 * check-in-SIDAN (dörr-optimerad närvaro-write) byggs i eget framtida pass —
 * tills dess leder ingången till den befintliga närvaro-ytan, dagens närmaste
 * yta för dörr-arbetet. Chevron-semantiken (raden leder vidare) hålls därmed
 * sann. Målet pekas om när check-in-sidan föds.
 */
export function CheckInKort({ eventId }: { eventId: string }) {
  return (
    <div
      data-testid="checkin-kort"
      className="rounded-2xl border border-transparent bg-bg-muted px-4 contrast-more:border-border-strong"
    >
      <HandlingsLank ikon={UserCheck} to="/event/$eventId/narvaro" eventId={eventId}>
        Gå till check-in
      </HandlingsLank>
    </div>
  );
}
// Kortskalet ovan är den form `HandlingsRadKort` (primitiven) bär — hem-vyns
// Genvägar konsumerar den. Kvar som literal HÄR med avsikt: `data-testid`
// och den exakta noden är facit-/testlåst yta på eventsidan (S83), och en
// omskrivning hit hade rört ett lås denna fix inte har ärende i.

/**
 * [TASK-147.8, KOPPLAD] Ingången till åtgärds-sidan (`/event/$eventId/atgarder`)
 * — riktig router-typad navigation sedan denna skiva, samma `HandlingsLank`-
 * grammatik som `CheckInKort` ovan (chevron höger = raden leder verkligen
 * vidare, K26-formen).
 *
 * HISTORIKEN, FÖR SPÅRBARHETEN (git bevarar hela ordalydelsen, `git log -p --
 * src/components/events/detail/Atgarder.tsx`): kortet föddes som en
 * [PROTOTYPE]-rad i [S93] ITERATIONSVÅGEN (Marcus 2026-08-05, punkt 4) —
 * gruppens fyra utskicksrader (bekräftelsemail · betalningspåminnelse ·
 * markera betalda · eventinfo, samtliga då `aria-disabled`, aldrig kopplade)
 * flyttade hit som EN gemensam ingång i stället för fyra döda rader; "Lägg
 * till manuell anmälan" följde med på samma Marcus-beslut. Länkmålet var
 * DÅ belagt-interim eftersom åtgärds-sidan inte fanns: en chevron hade lovat
 * en navigation utan mål, så knappen föll ut en platshållartext i stället
 * (samma ärlighet som check-in-ingångens dåvarande interim-mål). TASK-162.2
 * (ADR-103 B2 steg 1) promoverade kortet till OVILLKORLIGT — `EventDetail.tsx`
 * renderar det sedan dess alltid, inte bara bakom `?variant=a`.
 *
 * INTERIMET ÄR FÖRBRUKAT. Åtgärds-sidan finns nu (skarp sedan TASK-147.2–
 * 147.5/TASK-171.5s promovering), och Marcus verifierade 2026-08-10 att ingen
 * väg dit fanns från eventdetaljen — exakt det TASK-147.8 stänger.
 * Platshållartexten och `oppen`-disclosuren är RIVNA (aldrig produktionskod,
 * bara en väntande ärlighet), inte tonade ned: kortet är nu en riktig länk
 * med `href="/event/$eventId/atgarder"`, identisk mekanik med
 * `CheckInKort` ovan.
 *
 * DET SOM INTE ÄR KOPPLAT ÄN: det markerade urvalet från eventdetaljens
 * register följer INTE med över navigationen — det är TASK-171.6 AC #1s
 * uttryckliga scope ("Eventsidans kort navigerar till åtgärdssidan MED
 * MARKERAT URVAL MEDFÖRT"), en dep på just detta kort som denna skiva
 * avblockar men inte utför. Åtgärds-sidan seedar sitt eget urval tills dess
 * (`AtgardsSida.tsx` § `AtgardsSida`, "obekräftade eller obetalda").
 */
export function AtgarderKort({ eventId }: { eventId: string }) {
  return (
    <div
      data-testid="atgarder-kort"
      className="rounded-2xl border border-transparent bg-bg-muted px-4 contrast-more:border-border-strong"
    >
      <HandlingsLank ikon={Send} to="/event/$eventId/atgarder" eventId={eventId}>
        Gå till åtgärder
      </HandlingsLank>
    </div>
  );
}

/**
 * [PROTOTYPE] [S93] ITERATIONSVÅG (Marcus 2026-08-05, andra vändan): "Istället
 * för 'Skriv ut denna detaljsida rad-knappen' ersätt den med exakt den skriv
 * ut-knapp som sitter i filtreringen på eventsidan. Blir nog visuellt snyggare."
 *
 * FORMEN ÄR KOPIERAD VERBATIM ur `EventsList.tsx`s panelfot — piller på
 * `bg-surface`, `px-3.5 py-2`, Printer i 18 px, texten "Skriv ut". Första
 * försöket bar radformen (`RAD_KLASS`, 16 px-ikon, hel mening) i ett eget kort;
 * det var åtgärdsradens grammatik, inte utskriftsknappens.
 *
 * ANDRA VÄNDAN (Marcus 2026-08-06): "ALLA Skriv ut-knappar ska se EXAKT
 * likadana ut, samma storlek, samma allting, och den som sitter i eventsidans
 * filtrering är facit." Två avvikelser rättade: texten var "Skriv ut denna
 * detaljsida" (facit säger bara "Skriv ut") och plattan var `bg-bg-muted` i
 * stället för facits `bg-surface`.
 *
 * TREDJE VÄNDAN (Marcus 2026-08-06, iterationsvåg 3 punkt 1): "ALLA Skriv
 * ut-knappar måste ha samma hörnrundning som Markera-knappen." FACIT FLYTTAR
 * — från eventlistans piller till `Button`-primitiven, och andra vändans
 * "filtreringen är facit" är därmed RIVEN, inte glömd. Skälet är att pillret
 * aldrig var en referens: det är en handrullad form (`rounded-full`, ~37 px)
 * som divergerar från varje knapp som går via primitiven (`rounded` 4 px,
 * 32 px). Att jaga likhet mot den var att standardisera på undantaget.
 *
 * BÅDA Skriv ut-knapparna blev `intent="ghost"`, inte bara registrets.
 * Punkt 3 gällde ordagrant "Anmälda blockets filtrering", men andra vändans
 * princip — alla Skriv ut identiska — är fortfarande Marcus, och att låta
 * denna behålla en fylld platta hade brutit den för att lyda den andra
 * bokstavstroget. Öppet val, synligt i browsern: kortet självt bär
 * avgränsningen här, så knappen tappar ingen affordans den behövde.
 *
 * Att texten inte längre säger VILKEN utskrift det är: knappens plats bär det
 * i stället — denna sitter vid sidans ingångar, registrets i registrets
 * filterpanel. Facit-likheten vann över självförklarande text, på Marcus ord.
 *
 * Detta är SIDANS utskrift (hela detaljsidan med eventinfo och alla block) —
 * `window.print()`, oförändrad från gruppens rad 6. Registrets EGEN utskrift
 * (den filtrerade listan) är en annan knapp i registrets filterpanel; båda
 * behövs enligt Marcus ("i sidans utskrift kommer ju eventinfo och allt med").
 *
 * `print:hidden`: en utskriftsknapp på papper är meningslös — samma
 * GOV.UK-blacklist som eventlistans filterrad följer.
 */
export function SkrivUtKort() {
  return (
    <div data-testid="skriv-ut-kort" className="flex justify-end print:hidden">
      <Button intent="ghost" size="sm" onPress={() => window.print()}>
        <Printer aria-hidden="true" size={18} className="shrink-0" />
        Skriv ut
      </Button>
    </div>
  );
}

/**
 * [RIVEN, TASK-162.2, ADR-103 B2 steg 1] Åtgärds-gruppen (`Atgarder`,
 * K19–K21; amenderad task-18.15/TASK-145.5) bodde här — en rubricerad sektion
 * (`DetaljGrupp id="grupp-atgarder" rubrik="Åtgärder"`) med två numrerade
 * rader (Lägg till manuell anmälan · Skriv ut denna detaljsida). Den fanns
 * bakom `?variant=a`-villkoret sedan Marcus iterationsvåg 2026-08-05 (citerad
 * ordagrant i `AtgarderKort` ovan) lade dagens `AtgarderKort`/`SkrivUtKort`
 * som ERSÄTTARE i variant-läget — se den öppna frågan git-historiken bär:
 * *"Åtgärdsgruppen högst upp måste in på åtgärdssidan"*, alltså även raden som
 * denna grupp behöll. `EventDetail.tsx` renderar sedan denna skiva
 * `AtgarderKort` + `SkrivUtKort` OVILLKORLIGT i stället — den formen Marcus
 * beställde, tidigare bara nåbar bakom flaggan. "Lägg till manuell anmälan"
 * har ingen ersättande länk på eventsidan under tiden (den flyttar in i
 * `AtgarderKort`s hopkoppling när åtgärds-sidan byggs, eget kort efter S100),
 * per samma order. Git bevarar hela historiken (senast i main före denna
 * commit) — rivningsnoterna för de fyra grå löftena (TASK-145.5) och
 * radnumrerings-omnumreringen (18.15) finns kvar där, sökbara via
 * `git log -p -- src/components/events/detail/Atgarder.tsx`.
 */
