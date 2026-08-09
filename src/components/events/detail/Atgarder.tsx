import { Link } from '@tanstack/react-router';
import { ChevronRight, type LucideIcon, Printer, Send, UserCheck } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/primitives/Button';

/**
 * Check-in-ingången + åtgärds-ytan (task-18.3; S73-facit K19–K26, K47, K72;
 * amenderad av task-18.15). Nyskriven mot facit-bilagan (throwaway-kontraktet —
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
 * i `CheckInKort` och delvis i `AtgarderKort` (samma `RAD_KLASS`).
 * [RIVEN, TASK-145.6] Variant-villkoret/switcher-monteringen/`?variant`-
 * maskineriet i övrigt (registret, `PrototypeSwitcher`) — ORÖRT av denna
 * skiva — är nu riven i sin helhet (ADR-103 B2 steg 4, efter Marcus
 * godkännande). Se `EventDetail.tsx`/`Deltagare.tsx`/`Betalningar.tsx` för
 * rivningen.
 */
const RAD_KLASS =
  '-mx-2 flex w-auto items-center gap-2 rounded-lg px-2 py-1.5 text-left font-medium text-body hover:bg-bg-emphasized motion-safe:transition-colors';

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
 * (nedan) består oförändrad — `CheckInKort`s enda konsument är orörd.
 */

/** Åtgärdsradens länkform — samma renderade grammatik som knappraden (K26:
    samma överallt), som router-typad länk; ledande slot per Ledande-unionen. */
function HandlingsLank({
  to,
  eventId,
  children,
  ...ledande
}: Ledande & {
  to: '/event/$eventId/ny-anmalan' | '/event/$eventId/narvaro';
  eventId: string;
  children: string;
}) {
  return (
    <div className="flex flex-col py-1.5">
      <Link to={to} params={{ eventId }} className={RAD_KLASS}>
        {ledande.nummer !== undefined ? (
          <NumRuta n={ledande.nummer} />
        ) : (
          <ledande.ikon aria-hidden="true" size={16} className="shrink-0" />
        )}
        {children}
        <ChevronRight
          aria-hidden="true"
          size={18}
          className="ml-auto shrink-0 text-text-secondary"
        />
      </Link>
    </div>
  );
}

/**
 * Check-in-ingången (K23–K26): eventdagens PRIMÄRHANDLING som eget framhävt
 * kort ÖVER åtgärds-ytan (Eventbrite/Luma-klassen; sedan TASK-162.2
 * `AtgarderKort` + `SkrivUtKort`, tidigare den rubricerade Åtgärds-gruppen),
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

/**
 * [PROTOTYPE] [S93] ITERATIONSVÅG (Marcus 2026-08-05, punkt 4) — Åtgärds-gruppens
 * ERSÄTTARE i variant-läge: "Åtgärdsgruppen högst upp måste in på åtgärdssidan.
 * Vi kanske ska lägga till en likadan 'knapp' som 'Gå till check-in' som heter
 * 'Gå till åtgärder' direkt under."
 *
 * VAD SOM FLYTTAR, OCH VARFÖR JUST DET: gruppens rader 2–5 (bekräftelsemail ·
 * betalningspåminnelse · markera betalda · eventinfo) är utskick eller
 * bulkmutationer — Del 3 beslut 1 lägger ALLA utskick på åtgärds-sidan, och
 * samtliga fyra är dessutom `aria-disabled` idag (aldrig kopplade). Rad 1
 * (Lägg till manuell anmälan) följer med på Marcus beslut: "tänkte väl kolla
 * hur de blir att lägga in den på åtgärdssidan … vill hon komma snabbt till
 * manuell-anmälan så kommer det senare finnas direkt knapp på hem-vyn."
 *
 * RAD 6 (Skriv ut) STANNAR, som eget kort — Marcus: "i sidans utskrift kommer
 * ju eventinfo och allt med, det kan väl vara bra att ha två varianter."
 * Registrets EGEN utskrift (den filtrerade listan) är en ANNAN utskrift och
 * bor i filterpanelen, se `ArbetsKo`.
 *
 * LÄNKMÅLET ÄR INTERIM, precis som check-in-ingångens: åtgärds-sidan finns inte
 * ännu (eget divergens-pass, Del 3 beslut 8). En chevron hade lovat en
 * navigation som inte finns, så knappen fäller ut en platshållare i stället —
 * samma ärlighet som batch-barens "Åtgärder"-knapp, och samma text, så Marcus
 * ser att BÅDA ingångarna leder till samma kommande yta.
 *
 * [TASK-162.2, ADR-103 B2 steg 1] PROMOVERAD: rubriken ovan säger
 * "i variant-läge" — det gällde till och med denna skiva. `EventDetail.tsx`
 * renderar sedan denna commit `AtgarderKort` OVILLKORLIGT (`?variant=a` styr
 * inte längre om kortet visas). Innehållet, platshållaren och länkmåls-
 * interimet ovan är ORÖRDA — bara VILLKORET för render är rivet.
 */
export function AtgarderKort() {
  const [oppen, setOppen] = useState(false);
  return (
    <div
      data-testid="atgarder-kort"
      className="rounded-2xl border border-transparent bg-bg-muted px-4 contrast-more:border-border-strong"
    >
      <div className="flex flex-col py-1.5">
        <button
          type="button"
          onClick={() => setOppen(!oppen)}
          aria-expanded={oppen}
          className={RAD_KLASS}
        >
          <Send aria-hidden="true" size={16} className="shrink-0" />
          Gå till åtgärder
          <ChevronRight
            aria-hidden="true"
            size={18}
            className="ml-auto shrink-0 text-text-secondary"
          />
        </button>
      </div>
      {oppen && (
        <p className="pb-3 text-small text-text-secondary">
          Åtgärds-sidan - eget prototyp-pass. Härifrån går utskicken: bekräftelse,
          betalningspåminnelse, eventinfo, fritt utskick - och manuell anmälan.
        </p>
      )}
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
