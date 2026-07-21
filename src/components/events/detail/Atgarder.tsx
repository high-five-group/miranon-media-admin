import { Link } from '@tanstack/react-router';
import {
  BadgeCheck,
  ChevronRight,
  type LucideIcon,
  Mail,
  Plus,
  Printer,
  UserCheck,
} from 'lucide-react';
import { DetaljGrupp } from './DetaljGrupp';

/**
 * Åtgärds-gruppen + check-in-ingången (task-18.3; S73-facit K19–K26, K47, K72).
 * Nyskriven mot facit-bilagan (throwaway-kontraktet — prototypkod absorberas
 * aldrig); facit-referenserna (K-stegen) pekar på den låsta konvergens-trailen.
 *
 * Radformen (K20/K25/K72): VÄNSTERSTÄLLDA rader med ikon-kolumn (16 px),
 * chevron höger (18 px — chevron betyder att raden leder vidare; den gamla
 * ingen-chevron-regeln revs öppet i denna skiva, spec §14) och hover-PLATTAN
 * (K56-grammatiken: -mx-2 px-2 rounded-lg + bg-emphasized + motion-safe) —
 * plattan skjuter 8 px utanför kortets 16 px-inset utan att texten flyttas.
 * Radens totalhöjd är konstant (wrapper py-1.5 + knapp py-1.5 = 12 px lodrätt
 * kring 24 px-textraden); wrappern är flex-col så flex-stretchen ger knappen
 * full bredd trots w-auto (K54-vakten: aldrig w-full ihop med -mx-2).
 */
const RAD_KLASS =
  '-mx-2 flex w-auto items-center gap-2 rounded-lg px-2 py-1.5 text-left font-medium text-body hover:bg-bg-emphasized motion-safe:transition-colors';

/** Åtgärdsradens knappform. `ariaDisabled`: raden renderar per facit men dess
    flöde finns ännu inte — tillståndet annonseras ärligt för hjälpmedel tills
    flödet kopplas (öppet bokfört interim; se Atgarder nedan). */
function HandlingsRad({
  ikon: Ikon,
  onPress,
  ariaDisabled,
  children,
}: {
  ikon: LucideIcon;
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
        <Ikon aria-hidden="true" size={16} className="shrink-0" />
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

/** Åtgärdsradens länkform — samma renderade grammatik som knappraden
    (K26/K47: samma överallt), som router-typad länk. */
function HandlingsLank({
  ikon: Ikon,
  to,
  eventId,
  children,
}: {
  ikon: LucideIcon;
  to: '/event/$eventId/ny-anmalan' | '/event/$eventId/narvaro';
  eventId: string;
  children: string;
}) {
  return (
    <div className="flex flex-col py-1.5">
      <Link to={to} params={{ eventId }} className={RAD_KLASS}>
        <Ikon aria-hidden="true" size={16} className="shrink-0" />
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
 * Åtgärds-gruppen (K19–K21): sidans operativa handlingar samlade ÖVERST före
 * datagrupperna (Omedelbarhet — på eventdagar är åtgärderna sidans poäng),
 * i frekvensordning med Lägg till manuell anmälan först (K21: vanligaste
 * handlingen närmast handen; länken går till manuell anmälan-sidan, K16/K17 —
 * skarp form byggs i 18.12). Kuvert-grammatiken (K47): Mail på VARJE skicka
 * mail-handling; BadgeCheck för markera-handlingen; Printer för utskriften.
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
      <HandlingsLank ikon={Plus} to="/event/$eventId/ny-anmalan" eventId={eventId}>
        Lägg till manuell anmälan
      </HandlingsLank>
      <HandlingsRad ikon={Mail} ariaDisabled>
        Skicka bekräftelsemail till obekräftade
      </HandlingsRad>
      <HandlingsRad ikon={Mail} ariaDisabled>
        Skicka betalningspåminnelse till obetalda
      </HandlingsRad>
      <HandlingsRad ikon={BadgeCheck} ariaDisabled>
        Markera alla obetalda som betalda
      </HandlingsRad>
      <HandlingsRad ikon={Mail} ariaDisabled>
        Skicka eventinfo till alla anmälda
      </HandlingsRad>
      <HandlingsRad ikon={Printer} onPress={() => window.print()}>
        Skriv ut denna detaljsida
      </HandlingsRad>
    </DetaljGrupp>
  );
}
