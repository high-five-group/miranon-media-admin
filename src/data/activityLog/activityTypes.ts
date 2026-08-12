import type { ActivityVerb, SendActionEmailInput } from '@/domain/schemas';
import { XAPI_IRI_BASE } from '@/domain/schemas';
import { PaymentStatus, type PaymentStatusValue } from '@/domain/types/Status';

/**
 * xAPI-verb + aktivitetstyp-IRI:er. TASK-201.3s TRE pilotmutationer (markera
 * betalning, bekräfta anmälan, mail-åtgärd) avtäckte MÖNSTRET (ADR-110/
 * ADR-111); TASK-201.4 rullar ut det mekaniskt över resten av mutationsytan
 * (skapa anmälan, boende, kvitto, uppdatera event, person-flagga,
 * event-/person-anteckningar) — kategorierna nedan speglar PRD TASK-201s
 * användarberättelse 9 ordagrant ("betalningar, bekräftelser, anmälningar,
 * boende, mail, kvitton, event-ändringar, flaggor och anteckningar" — nio
 * substantiv, nio kategorier).
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
  /** TASK-201.4: skapa anmälan (useCreateRegistration). "Lade till person"
   * ingår HÄR tills person-skapande får egen mutation (PRD § Implementations-
   * beslut) — ingen separat person-kategori mintas för det. */
  anmalan: `${XAPI_IRI_BASE}/activity-types/anmalan`,
  /** TASK-201.4: Bor över-krysset (useSetBorOver, registrationLodging.ts). */
  boende: `${XAPI_IRI_BASE}/activity-types/boende`,
  /** TASK-201.4: kvittosändning (useSendReceipt, receipts.ts). */
  kvitto: `${XAPI_IRI_BASE}/activity-types/kvitto`,
  /** TASK-201.4: eventets fält ändrade (useUpdateEvent) — OBJEKTET är eventet
   * självt, inte en anmälan (se `eventObjectId` nedan). */
  event: `${XAPI_IRI_BASE}/activity-types/event`,
  /** TASK-201.4: Lottas fritext-flagga på en person (useUpdatePersonFlag). */
  flagga: `${XAPI_IRI_BASE}/activity-types/flagga`,
  /** TASK-201.4: DELAD kategori för event-anteckning (create) och
   * person-anteckning (create OCH update) — samma ATT-antecknade-handling,
   * bara olika objekt (event kontra person, AC #2: aldrig innehåll). */
  anteckning: `${XAPI_IRI_BASE}/activity-types/anteckning`,
} as const;

/** Objekt-IRI för en specifik anmälan — samma id oavsett vilket verb
 * (betalning/bekräftelse/mail/anmälan/boende/kvitto) som pekar på den (en
 * anmälan är en anmälan). */
export function registrationObjectId(registrationId: string): string {
  return `${XAPI_IRI_BASE}/objects/registrations/${registrationId}`;
}

/** Objekt-IRI för ett specifikt event (TASK-201.4: uppdatera event,
 * event-anteckning — de enda två verben vars objekt ÄR eventet, inte en
 * anmälan som råkar tillhöra det). */
export function eventObjectId(eventId: string): string {
  return `${XAPI_IRI_BASE}/objects/events/${eventId}`;
}

/** Objekt-IRI för en specifik person (TASK-201.4: person-flagga,
 * person-anteckning skapa/uppdatera). */
export function personObjectId(personId: string): string {
  return `${XAPI_IRI_BASE}/objects/persons/${personId}`;
}

/**
 * Gunilla-namnet för ett event-objekt — `null`/tom sträng faller tillbaka på
 * en tydlig platshållare (samma disciplin som `actorName` i
 * `recordActivity.ts`, ALDRIG ett tomt/null-namn i loggen). Egen liten
 * funktion (inte inline på varje anropsplats som pilotmutationernas
 * `registration.eventNamn ?? 'okänt event'`): TVÅ nya mutationer
 * (uppdatera-event, event-anteckning) delar EXAKT samma härledning, och en
 * delad, testbar funktion är den strukturella garanten för AC #2 (event-
 * anteckningens sammanfattning kan bara någonsin bli namnet — ingen
 * anropsplats har ens tillgång till anteckningstexten här).
 */
export function eventActivityName(eventNamn: string | null): string {
  return eventNamn && eventNamn.trim() !== '' ? eventNamn : 'Okänt event';
}

/** Gunilla-namnet för ett person-objekt — samma disciplin som
 * `eventActivityName` ovan, delad av person-flagga och BÅDA
 * person-anteckningsverben (skapa/uppdatera). */
export function personActivityName(personNamn: string | null): string {
  return personNamn && personNamn.trim() !== '' ? personNamn : 'Okänd person';
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

/**
 * TASK-201.4 — resterande mutationers verb. Samma stil som pilotens tre:
 * statiska konstanter där handlingen bara har EN riktning, en funktion där
 * den har två (mönstret `betalningVerb` etablerade).
 */

/** Skapa-anmälan-verbet — `useCreateRegistration.ts`. "Lade till person"
 * ingår HÄR (PRD § Implementationsbeslut) — inget eget verb för det. */
export const SKAPADE_ANMALAN_VERB: ActivityVerb = {
  id: `${XAPI_IRI_BASE}/verbs/skapade-anmalan`,
  display: { 'sv-SE': 'skapade anmälan' },
};

/** Bor över-verbet — TVÅ riktningar (kryssa i/ur, `registrationLodging.ts`
 * § `useSetBorOver`), samma "avmarkerade"-vokabulär som `betalningVerb`. */
export function boendeVerb(borOver: boolean): ActivityVerb {
  return borOver
    ? {
        id: `${XAPI_IRI_BASE}/verbs/markerade-bor-over`,
        display: { 'sv-SE': 'markerade bor över' },
      }
    : {
        id: `${XAPI_IRI_BASE}/verbs/avmarkerade-bor-over`,
        display: { 'sv-SE': 'avmarkerade bor över' },
      };
}

/** Kvittoverbet — `receipts.ts` § `useSendReceipt`. EN riktning (ett kvitto
 * skickas, det finns ingen "ångra kvitto"). */
export const SKICKADE_KVITTO_VERB: ActivityVerb = {
  id: `${XAPI_IRI_BASE}/verbs/skickade-kvitto`,
  display: { 'sv-SE': 'skickade kvitto' },
};

/** Uppdatera-event-verbet — `useUpdateEvent.ts`. Täcker "Om eventet" OCH
 * Beläggningens Ändra-läge (hooken delas, se dess docblock) — ingen
 * fält-specifik gren, samma nivå av detalj som pilotens övriga statiska verb. */
export const UPPDATERADE_EVENT_VERB: ActivityVerb = {
  id: `${XAPI_IRI_BASE}/verbs/uppdaterade-event`,
  display: { 'sv-SE': 'uppdaterade eventet' },
};

/** Person-flagga-verbet — `useUpdatePersonFlag.ts`. Samma verb oavsett om
 * flaggan sätts eller rensas (fritext, ingen på/av-semantik att särskilja). */
export const UPPDATERADE_FLAGGA_VERB: ActivityVerb = {
  id: `${XAPI_IRI_BASE}/verbs/uppdaterade-flagga`,
  display: { 'sv-SE': 'uppdaterade flagga' },
};

/** Antecknade-verbet — DELAT av `useCreateEventNote.ts` och
 * `useCreatePersonNote.ts` (samma handling, olika objekt — se
 * `ACTIVITY_OBJECT_TYPES.anteckning`). AC #2: statisk konstant, tar aldrig
 * emot anteckningstexten — strukturellt omöjligt att läcka innehåll härifrån. */
export const ANTECKNADE_VERB: ActivityVerb = {
  id: `${XAPI_IRI_BASE}/verbs/antecknade`,
  display: { 'sv-SE': 'antecknade' },
};

/** Uppdaterade-anteckning-verbet — `useUpdatePersonNote.ts` (edit-in-place av
 * det gamla odelade `Personer.Anteckningar`-fältet, SKILT från
 * `ANTECKNADE_VERB` ovan som gäller den nya antecknings-STRÖMMEN). Samma
 * innehålls-fria garanti som `ANTECKNADE_VERB`. */
export const UPPDATERADE_ANTECKNING_VERB: ActivityVerb = {
  id: `${XAPI_IRI_BASE}/verbs/uppdaterade-anteckning`,
  display: { 'sv-SE': 'uppdaterade anteckning' },
};
