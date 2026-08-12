import type { ActivityVerb, SendActionEmailInput } from '@/domain/schemas';
import { XAPI_IRI_BASE } from '@/domain/schemas';
import { PaymentStatus, type PaymentStatusValue } from '@/domain/types/Status';

/**
 * xAPI-verb + aktivitetstyp-IRI:er för TASK-201.3s TRE pilotmutationer
 * (markera betalning, bekräfta anmälan, mail-åtgärd). Piloten avtäcker
 * MÖNSTRET (ADR-110/ADR-111) — de återstående ~8 mutationstyperna (boende,
 * kvitto, event-ändring, person-flagga, anteckningar, …) definieras i
 * TASK-201.4 när den mekaniska utrullningen sker, inte spekulativt här.
 *
 * Svenska display-strängar (Gunilla-principen); IRI:er är den maskinläsbara
 * identiteten under huven (PRD användarberättelse #15, xAPI-konformans).
 *
 * MEDVETET INGEN import från `data/mutations/*` här (motsatt riktning —
 * mutationsfilerna importerar DÄRIFRÅN detta modul): en import åt andra
 * hållet hade stängt en cirkulär beroende-kedja.
 */

/** Aktivitetstyp-IRI:er — filterradens KATEGORI-axel (PRD § Vy-form, TASK-201.8). */
export const ACTIVITY_OBJECT_TYPES = {
  betalning: `${XAPI_IRI_BASE}/activity-types/betalning`,
  bekraftelse: `${XAPI_IRI_BASE}/activity-types/bekraftelse`,
  mail: `${XAPI_IRI_BASE}/activity-types/mail`,
} as const;

/** Objekt-IRI för en specifik anmälan — samma id oavsett vilken av de tre
 * pilotverben som pekar på den (en anmälan är en anmälan). */
export function registrationObjectId(registrationId: string): string {
  return `${XAPI_IRI_BASE}/objects/registrations/${registrationId}`;
}

/**
 * Betalningsverbet — TVÅ riktningar (kryssa i/ur, `registrationPayments.ts`
 * § `useSetPaymentStatus`). "avmarkerade" speglar den etablerade
 * "avprickning"-vokabulären (samma fils TAKTVAKT-kommentar) i stället för en
 * påhittad motsats. Tar rå `PaymentStatusValue` (mutationens `value`-variabel)
 * direkt — ingen mellanliggande enum uppfinns för två fall.
 */
export function betalningVerb(value: PaymentStatusValue): ActivityVerb {
  return value === PaymentStatus.MOTTAGEN
    ? {
        id: `${XAPI_IRI_BASE}/verbs/markerade-betalning`,
        display: { 'sv-SE': 'markerade betalning' },
      }
    : {
        id: `${XAPI_IRI_BASE}/verbs/avmarkerade-betalning`,
        display: { 'sv-SE': 'avmarkerade betalning' },
      };
}

/** Bekräftelseverbet — `registrationConfirmation.ts` § `useSendConfirmationFromDetail`. */
export const BEKRAFTADE_ANMALAN_VERB: ActivityVerb = {
  id: `${XAPI_IRI_BASE}/verbs/bekraftade-anmalan`,
  display: { 'sv-SE': 'bekräftade anmälan' },
};

/** Svensk dåtidsform per åtgärdstyp — `actionEmail.ts` § `useSendActionEmail`.
 * Knapparnas etiketter (`ATGARDER` i `AtgardsSida.tsx`) är imperativ
 * ("Skicka bekräftelsemail"); loggen är dåtid (någon HAR redan gjort det). */
const MAIL_VERB_DISPLAY: Record<SendActionEmailInput['actionType'], string> = {
  bekraftelse: 'skickade bekräftelsemail',
  paminnelse: 'skickade betalningspåminnelse',
  eventinfo: 'skickade eventinformation',
  fritt: 'skickade mail',
};

export function mailVerb(actionType: SendActionEmailInput['actionType']): ActivityVerb {
  return {
    id: `${XAPI_IRI_BASE}/verbs/skickade-mail/${actionType}`,
    display: { 'sv-SE': MAIL_VERB_DISPLAY[actionType] },
  };
}
