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

/**
 * TASK-201.13 — de FYRA sista luckornas verb (Marcus-order 2026-08-13: "Jag
 * vill inte ha en enda lucka"). Upphäver TASK-201.4s bokförda avgränsning,
 * som vilade på ett RÄKNINGS-argument (PRD:ns "~11" räknade inte in dem) —
 * PRD TASK-201s användarberättelse 9 (Lotta ska aldrig behöva tvivla på att
 * appen minns) är ett FÖRTROENDE-argument, och det slår räkningen.
 *
 * INGEN NY OBJEKT-KATEGORI mintas: betalningsnotering och påminnelse är
 * `ACTIVITY_OBJECT_TYPES.betalning` (de HANDLAR om en betalning), testmailet
 * är `ACTIVITY_OBJECT_TYPES.mail` (det ÄR ett mail). Verbkatalogen bar redan
 * rätt kategori-axel — bara verben saknades.
 */

/**
 * Betalningens identitet i verb-texten — strukturellt identisk med
 * `Betalning` (`registrationPayments.ts`), MEDVETET återdeklarerad här i
 * stället för importerad: filhuvudets regel förbjuder import från
 * `data/mutations/*` (mutationsfilerna importerar HÄRIFRÅN — en import åt
 * andra hållet stänger en cirkulär kedja). TypeScripts strukturella typning
 * gör att mutationens egen `Betalning` passar rakt in utan konvertering.
 */
type BetalningsSlag = 'avgift' | 'slut';

/** Bestämd form för verb-texten ("noteringen för anmälningsavgiften") —
 * skild från `BETALNING_LABEL`s obestämda rubrikform i mutationsfilen. */
const BETALNINGS_ORD: Record<BetalningsSlag, string> = {
  avgift: 'anmälningsavgiften',
  slut: 'slutbetalningen',
};

/**
 * Betalningsnoteringens verb — `registrationPayments.ts` §
 * `useUpdatePaymentNote`. TVÅ varianter (avgift/slut), samma suffixade-IRI-
 * form som `mailVerb` redan etablerar för en fler-värd axel.
 *
 * INTEGRITETEN ÄR STRUKTURELL, INTE EN KONVENTION: funktionen tar ENDAST
 * betalningens identitet — noteringens FRITEXT har ingen parameter att komma
 * in genom, exakt samma garanti som `ANTECKNADE_VERB` bär för anteckningar
 * (S105 Del 2 beslut 2: loggen bär ATT en notering ändrades, ALDRIG vad den
 * säger). Payload-nivå-beviset: `tests/api/activity-log-luckor-statements.ts`
 * § INTEGRITETSVAKTEN, som läser den faktiska utgående kroppen.
 */
export function betalningsnoteringVerb(betalning: BetalningsSlag): ActivityVerb {
  return {
    id: `${XAPI_IRI_BASE}/verbs/uppdaterade-betalningsnotering/${betalning}`,
    display: { 'sv-SE': `uppdaterade noteringen för ${BETALNINGS_ORD[betalning]}` },
  };
}

/**
 * Påminnelse-loggens verb — `registrationPayments.ts` §
 * `useLogPaymentReminder`. "antecknade", inte "skickade": mutationen skriver
 * en TIDSSTÄMPEL och öppnar Lottas mailklient (mailto) — appen kan aldrig
 * observera att mailet faktiskt lämnade datorn, och ett "skickade" hade varit
 * exakt den stämplingslögn `useLogPaymentReminder`s eget docblock och
 * `AtgardsSida.tsx` § "mailto-eran" river. MEDVETET skilt från
 * `mailVerb('paminnelse')` ("skickade betalningspåminnelse"), som gäller den
 * SERVER-SIDA sändvägen där sändningen faktiskt är observerad.
 */
export function betalningspaminnelseVerb(betalning: BetalningsSlag): ActivityVerb {
  return {
    id: `${XAPI_IRI_BASE}/verbs/antecknade-betalningspaminnelse/${betalning}`,
    display: { 'sv-SE': `antecknade påminnelse om ${BETALNINGS_ORD[betalning]}` },
  };
}

/**
 * Testmailets verb — `actionEmail.ts` § `useSendActionTestEmail`. Objektet är
 * EVENTET (`eventObjectId`), inte en anmälan: testgrenen skriver strukturellt
 * inget fält på någon anmälan (`_shared/send-action-email.ts` §
 * `runActionTestSend`), och mailet går till Lottas EGEN inkorg — att peka
 * statementet på mottagar-platshållarens anmälan hade påstått att en
 * anmälan berördes. "till sig själv" i klartext så historiken aldrig kan
 * förväxlas med ett skarpt utskick till en deltagare.
 */
export const SKICKADE_TESTMAIL_VERB: ActivityVerb = {
  id: `${XAPI_IRI_BASE}/verbs/skickade-testmail`,
  display: { 'sv-SE': 'skickade testmail till sig själv' },
};
