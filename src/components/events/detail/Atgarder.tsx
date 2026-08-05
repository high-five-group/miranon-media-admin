import { Link } from '@tanstack/react-router';
import { ChevronRight, type LucideIcon, Printer, Send, UserCheck } from 'lucide-react';
import { useState } from 'react';
import { DetaljGrupp } from './DetaljGrupp';

/**
 * Åtgärds-gruppen + check-in-ingången (task-18.3; S73-facit K19–K26, K47, K72;
 * amenderad av task-18.15). Nyskriven mot facit-bilagan (throwaway-kontraktet —
 * prototypkod absorberas aldrig); facit-referenserna (K-stegen) pekar på den
 * låsta konvergens-trailen.
 *
 * Radformen (K20/K25/K72): VÄNSTERSTÄLLDA rader med ledande kolumn (radnummer
 * i Åtgärds-gruppen sedan 18.15; check-in-ingången behåller sin 16 px-ikon),
 * chevron höger (18 px — chevron betyder att raden leder vidare; den gamla
 * ingen-chevron-regeln revs öppet i denna skiva, spec §14) och hover-PLATTAN
 * (K56-grammatiken: -mx-2 px-2 rounded-lg + bg-emphasized + motion-safe) —
 * plattan skjuter 8 px utanför kortets 16 px-inset utan att texten flyttas.
 * Radens totalhöjd är konstant (wrapper py-1.5 + knapp py-1.5 = 12 px lodrätt
 * kring 24 px-textraden — numrutans 24 px fyller raden utan att höja den);
 * wrappern är flex-col så flex-stretchen ger knappen full bredd trots w-auto
 * (K54-vakten: aldrig w-full ihop med -mx-2).
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

/** Åtgärdsradens knappform — numrerad sedan 18.15 (Åtgärds-gruppens enda
    knappform; ikonvarianten utgick med rivningen). `ariaDisabled`: raden
    renderar per facit men dess flöde finns ännu inte — tillståndet annonseras
    ärligt för hjälpmedel tills flödet kopplas (öppet bokfört interim; se
    Atgarder nedan). */
function HandlingsRad({
  nummer,
  onPress,
  ariaDisabled,
  children,
}: {
  nummer: number;
  onPress?: () => void;
  ariaDisabled?: boolean;
  children: string;
}) {
  return (
    <div className="flex flex-col py-1.5">
      <button
        type="button"
        onClick={onPress}
        aria-disabled={ariaDisabled || undefined}
        className={RAD_KLASS}
      >
        <NumRuta n={nummer} />
        {children}
        <ChevronRight
          aria-hidden="true"
          size={18}
          className="ml-auto shrink-0 text-text-secondary"
        />
      </button>
    </div>
  );
}

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
 * kort ÖVER Åtgärds-gruppen (Eventbrite/Luma-klassen), aldrig en rad i den.
 * Kortet bär EXAKT åtgärdsradens form i ett eget kort-skal UTAN rubrik (K26) —
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
          Åtgärds-sidan — eget prototyp-pass. Härifrån går utskicken: bekräftelse,
          betalningspåminnelse, eventinfo, fritt utskick — och manuell anmälan.
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
 * `bg-surface` (lyft mot tonal botten), `px-3.5 py-2`, Printer i 18 px, texten
 * "Skriv ut". Första försöket bar radformen (`RAD_KLASS`, 16 px-ikon, hel
 * mening) i ett eget kort; det var åtgärdsradens grammatik, inte
 * utskriftsknappens, och läste som ännu en navigation.
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
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center gap-1.5 rounded-full bg-bg-muted px-3.5 py-2 font-medium text-small hover:bg-bg-emphasized motion-safe:transition-colors"
      >
        <Printer aria-hidden="true" size={18} className="shrink-0" />
        Skriv ut denna detaljsida
      </button>
    </div>
  );
}

/**
 * Åtgärds-gruppen (K19–K21): sidans operativa handlingar samlade ÖVERST före
 * datagrupperna (Omedelbarhet — på eventdagar är åtgärderna sidans poäng),
 * i frekvensordning med Lägg till manuell anmälan först (K21: vanligaste
 * handlingen närmast handen; länken går till manuell anmälan-sidan, K16/K17 —
 * skarp form byggd i 18.12).
 *
 * RIVNINGSNOT (task-18.15, FACIT-REVIDERING AV S73-K47, riven ÖPPET per
 * 18.3-precedenten): kuvert-grammatikens LEDANDE ikoner (Mail på varje
 * skicka-handling, BadgeCheck för markera, Printer för utskriften) är
 * ersatta av RADNUMMER 1–6 — referentbarhet vann ("gå till åtgärd 4" i
 * instruktioner och manualer är entydigt, Gunilla-principen: numrerade steg
 * förstås utan förkunskaper). Kuvert-grammatiken BESTÅR i övriga ytor
 * (Deltagare-kortens Mail/MailCheck; check-in-kortets UserCheck orörd).
 * Numren följer frekvensordningen och ändras ej (byggkrav 1).
 *
 * Kopplingsläget per rad (kortets spec: "Skriv ut är skarp; utskicks-raderna
 * kopplas till sina flöden när de finns"):
 * - Skriv ut: SKARP (window.print — utskriften bor här sedan K19-flytten).
 * - Bekräftelsemail: kopplas i 18.6 (hantera-flödets bulk-form).
 * - Betalningspåminnelse + Markera betalda: kopplas i 18.8 (arbetsytan).
 * - Eventinfo: kopplas när utskicks-styrningen byggs (PRD beslut 14).
 * Okopplade rader bär aria-disabled (ärligt AT-tillstånd) men behåller
 * facit-formens hover-platta — interimet löses upp skiva för skiva.
 */
export function Atgarder({ eventId }: { eventId: string }) {
  return (
    <DetaljGrupp id="grupp-atgarder" rubrik="Åtgärder">
      <HandlingsLank nummer={1} to="/event/$eventId/ny-anmalan" eventId={eventId}>
        Lägg till manuell anmälan
      </HandlingsLank>
      <HandlingsRad nummer={2} ariaDisabled>
        Skicka bekräftelsemail till obekräftade
      </HandlingsRad>
      <HandlingsRad nummer={3} ariaDisabled>
        Skicka betalningspåminnelse till obetalda
      </HandlingsRad>
      <HandlingsRad nummer={4} ariaDisabled>
        Markera alla obetalda som betalda
      </HandlingsRad>
      <HandlingsRad nummer={5} ariaDisabled>
        Skicka eventinfo till alla anmälda
      </HandlingsRad>
      <HandlingsRad nummer={6} onPress={() => window.print()}>
        Skriv ut denna detaljsida
      </HandlingsRad>
    </DetaljGrupp>
  );
}
