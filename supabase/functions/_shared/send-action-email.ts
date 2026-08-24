// Åtgärdsutskicks-ORKESTRATOR (TASK-147.1 — Sändvägs-EF:n, bilage-fri gren;
// ADR-067-revisionen). Dependency-injicerad och Deno-global-fri i sin yta →
// Node-importerbar för api-pure-kontraktstest (mockade gränser) OCH
// Deno-importerbar av send-action-email-EF:en (riktiga gränser). SAMMA
// UPPDELNING som _shared/send-bulk.ts (Fas 6h) och _shared/confirm-registrations.ts
// (task-18.6) — repots TREDJE mail-vertikal ärver den bevisade formen i stället
// för att uppfinna en egen (confirm-registrations.ts:s egen docblock-princip).
//
// SCOPE (task-147.1, EJ 147.2/147.3/147.4): den GENERISKA sändvägen för de fyra
// åtgärdstyperna (bekräftelse/påminnelse/eventinfo/fritt) på ETT event-bundet
// mottagarurval (registration-ID:n — INTE segmentIds). UI-koppling (vilken knapp
// anropar detta, urvalsfilter, granskningsytan) hör till 147.2/147.3.
// Betalningsavprickningen (mark-fee-paid m.fl.) hör till 147.4.
//
// KONTRAKTET (mail + fält-skrivning är EN operation server-side, atomicitet ärvd
// ur confirm-registrations.ts): mailet FÖRST, fält-skrivningen ENDAST för den
// vars mail faktiskt accepterades. En mottagare som inte fick sitt mail lämnas
// ORÖRD — basen får aldrig påstå "skickat" om inget gick.
//
// ICKE-PROD-SPÄRREN ÅTERANVÄNDS ur send-bulk.ts (GOLV, ADR-067 D-klassen) — den
// kopieras aldrig och kringgås aldrig: i icke-prod måste VARJE upplöst mottagare
// vara en Resend-test-adress, annars vägras HELA operationen (noll mail, noll
// skrivning).
//
// KONSENT-GATEN (ADR-067 D5, Personer.`Ej godkänd för mailutskick`) ÄR MEDVETET
// INTE IMPLEMENTERAD HÄR — se ADR-067-revisionens § Avvisade alternativ för
// resonemanget (kort: samma icke-implementerade läge som den redan byggda
// send-registration-confirmation-vertikalen; registrerings-bundna åtgärds-
// utskick delar den klassen, till skillnad från segmentets marknads-utskick).
// Öppen punkt, bokförd — inte tyst utelämnad.
//
// PLACEHOLDER-RENDERINGEN speglar AtgardsSida.tsx:s `fyllPlatshallare` EXAKT
// (_shared/action-mail-template.ts) — granskningen Lotta ser och mailet som
// faktiskt går ut måste vara SAMMA algoritm, annars är granskningen en lögn.

import { dagManad, deadlineDatum, fillPlaceholders, type TemplateVars } from './action-mail-template.ts';
import { scalarString, selectName } from './coerce.ts';
import {
  type ConfirmSendOutcome,
  type ConfirmSpec,
  FALT_BEKRAFTELSE_SKICKAD,
  FALT_STATUS,
  INAKTIVA_STATUSAR,
  parseConfirmOutcome,
  STATUS_BEKRAFTAD,
} from './confirm-registrations.ts';
import { NonProdAddressError, RESEND_TEST_ADDRESSES, renderHtml, UtskickSparratError } from './send-bulk.ts';

/** De fyra åtgärdstyperna (task-147.1-kortet + AtgardsSida.tsx `ATGARDER[].nyckel`). */
export type ActionType = 'bekraftelse' | 'paminnelse' | 'eventinfo' | 'fritt';

export const ACTION_TYPES: readonly ActionType[] = [
  'bekraftelse',
  'paminnelse',
  'eventinfo',
  'fritt',
];

export function isActionType(value: unknown): value is ActionType {
  return typeof value === 'string' && (ACTION_TYPES as readonly string[]).includes(value);
}

/** Airtable-fältnamnen den nya operationen kan skriva (allowlist-SSOT: field-allowlists.ts). */
export const FALT_DELTAGARINFO_SKICKAD = 'Deltagarinfo skickad';
export const FALT_PAMINNELSE_AVGIFT = 'Påminnelse anmälningsavgift skickad';
export const FALT_PAMINNELSE_SLUT = 'Påminnelse slutbetalning skickad';

/** Basens betalnings-ord (data-model.md §Schema cheat sheet — Anmälningsavgift/Slutbetalning). */
const PAYMENT_EJ_MOTTAGEN = 'Ej mottagen';

/**
 * En anmälan som EF:en läst upp SERVER-SIDE ur basen (klienten skickar bara
 * record-ID:n — aldrig adress, namn eller status: mottagaren kan aldrig komma
 * från klienten). Fältmängden är EXAKT vad de fyra åtgärdstyperna behöver:
 * `fornamn` (platshållaren {förnamn}), `anmalningsavgift`/`slutbetalning`
 * (avgör VILKET av de två påminnelse-fälten som stämplas).
 */
export type ActionTarget = {
  id: string;
  email: string | null;
  fornamn: string | null;
  status: string | null;
  anmalningsavgift: string | null;
  slutbetalning: string | null;
};

/**
 * [TASK-147-fix, S102] REN fält-mappning: rå Airtable `fields` (Anmälningar-
 * tabellen) → `ActionTarget` + dess Event-länk-ID:n. Extraherad ur
 * `send-action-email/index.ts`:s `readRegistration` OFÖRÄNDRAD i beteende —
 * flytten görs INTE för sin egen skull utan för att göra fältnamnen
 * Node-testbara: `index.ts` är en Deno-EF (esm.sh-imports, `@ts-nocheck`) och
 * kan inte importeras av ett Playwright/Node-test, men DENNA fil är redan
 * dual-importable (se filhuvudet) — samma mönster som
 * `_shared/registration-read.ts`:s `mapRegistration` följer för sin vertikal.
 *
 * Länkfältet heter `Event` (Anmälningar, `fldi3enUaMdbuGSlm` — data-model.md
 * §Kritiska länkfält, live-verifierat `describe_table` mot staging
 * `apphjj8Q7lkXCMsL4`/`tbloOcrppVoyrHbrq`) — INTE `Event (länk)` (den strängen
 * förekommer bara som en beskrivande "Syfte"-etikett i data-model.md:s Schema
 * cheat sheet, aldrig som ett faktiskt fältnamn i basen).
 */
export function mapRegistrationFields(
  id: string,
  fields: Record<string, unknown>,
): { target: ActionTarget; eventIds: string[] } {
  const eventLink = fields['Event'];
  const eventIds = Array.isArray(eventLink)
    ? eventLink.filter((v): v is string => typeof v === 'string')
    : [];
  return {
    target: {
      id,
      email: scalarString(fields['E-post']),
      fornamn: scalarString(fields['Förnamn']),
      status: selectName(fields['Status'] ?? null),
      anmalningsavgift: selectName(fields['Anmälningsavgift'] ?? null),
      slutbetalning: selectName(fields['Slutbetalning'] ?? null),
    },
    eventIds,
  };
}

/** Eventet mottagarurvalet är bundet till — bär de fyra ÖVRIGA platshållarna. */
export type EventContext = {
  eventNamn: string | null;
  ort: string | null;
  startdatum: string | null;
};

/** Vad sändaren behöver per mottagare — DELAD FORM med confirm-registrations.ts. */
export type ActionSpec = ConfirmSpec;
/** Normaliserat utfall av sänd-anropet — DELAD FORM (TASK-111 AC2-bevisad rad-exakt parsning). */
export type ActionSendOutcome = ConfirmSendOutcome;
/** Rad-exakt parsning av Resends permissive-svar — ÅTERANVÄND, ej omimplementerad. */
export const parseActionOutcome = parseConfirmOutcome;

/** Injicerad sänd-gräns. EF:en ger en riktig Resend-sender; testet en mock. */
export type ActionSender = (
  specs: readonly ActionSpec[],
  ctx: { idempotencyKey: string },
) => Promise<ActionSendOutcome>;

/** Injicerad Airtable-gräns: sätt åtgärdens stämpel-fält på EN anmälan. */
export type ActionFieldWriter = (
  registrationId: string,
  fields: Record<string, unknown>,
) => Promise<void>;

/** Varför en anmälan hoppades över — aldrig tyst, alltid med skäl. */
export type SkipReason = 'inactive' | 'already_confirmed' | 'no_email';

export type ActionSendResult = {
  /** Aldrig binär (send-bulk/confirm-registrations D3-formen). */
  status: 'sent' | 'partial' | 'failed' | 'skipped';
  requested: number;
  attempted: number;
  /** Anmälningar som fick BÅDE mail och (om åtgärden har en) fält-skrivning. */
  completed: string[];
  skipped: { registrationId: string; reason: SkipReason }[];
  failed: { registrationId: string; reason: string }[];
};

/**
 * [TASK-147.5, ADR-067 D9] En bilaga vald i väljaren, RESOLVED server-side
 * INNAN orkestratorn nås — send-action-email/index.ts:s jobb (existens +
 * event-ägarskap + Lagringsnyckel-närvaro), inte orkestratorns. Samma
 * uppdelning som `registrationIds` → `ActionTarget[]`: HTTP-validering utanför,
 * ren logik inuti.
 */
export type ResolvedAttachment = { id: string; namn: string; lagringsnyckel: string };

/** Bilagans bytes, redan hämtade + bas64-kodade — klara att bifogas på Resends `attachments[].content`. */
export type AttachmentPayload = { filename: string; contentBase64: string };

/**
 * Härleder Content-Type ur filändelsen (TASK-193, `send-action-email/
 * index.ts`s `makeRealSingleSender`). Resends Node/TS-SDK (samma
 * `resend.emails.send()`-form skriptet använder) tar emot `contentType` som
 * camelCase-fält på attachment-objektet — bekräftat via context7 mot
 * resend.com/docs/examples' Express-exempel: `attachments: [{ filename,
 * content, contentType, cid }]` (2026-08-24). UTAN fältet faller Resend
 * tillbaka till `application/octet-stream` i stället för filens verkliga
 * typ — exakt kortets symptom (mail b1e1b27b-e579-4c39-960d-f0a0cc8b7ea1,
 * PDF-innehållet var intakt men servades med fel Content-Type).
 *
 * Alla bilagor `send-action-email` någonsin skickar är PDF:er —
 * `generate-event-attachment/index.ts` och `_shared/receipt-content.ts`
 * genererar ENDAST `.pdf`-filnamn (se respektive filhuvud). Härledningen
 * täcker därför `.pdf` explicit och faller tillbaka till samma
 * `application/octet-stream` som var det ENDA beteendet innan denna fix,
 * för en filändelse som aldrig förekommer i dag — ingen gissad mime-typ
 * för ett fall vi inte kan bevisa.
 *
 * Placerad HÄR (inte i `_shared/attachments.ts`, inte i `index.ts`) av två
 * skäl, båda EMPIRISKT bevisade, inte antagna: (1) `index.ts`-filer
 * importeras aldrig direkt av tester i detta repo (mönstret finns inte
 * någonstans i `tests/api/`); (2) `_shared/attachments.ts` importerar `z`
 * FRÅN `https://esm.sh/zod@4` (Deno-URL-import) — ett första försök att
 * lägga funktionen där fällde HELA testsviten i Node med `Only URLs with a
 * scheme in: file and data are supported by the default ESM loader`. Denna
 * fil (`_shared/send-action-email.ts`) importeras REDAN av
 * `tests/api/send-action-email.test.ts` utan problem — bevisat
 * Deno-URL-fritt genom att sviten faktiskt kör.
 */
export function deriveContentType(filename: string): string {
  return filename.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream';
}

/**
 * Injicerad Storage-läsare: given de RESOLVED bilagorna + eventId, hämta
 * bytesen. EF:en ger en riktig Supabase-Storage-`.download()`-läsare
 * (service-role); testet en mock — NOLL riktig Storage/Airtable i api-pure-
 * kontraktstestet.
 */
export type AttachmentReader = (
  attachments: readonly ResolvedAttachment[],
  eventId: string,
) => Promise<AttachmentPayload[]>;

/**
 * Injicerad SINGEL-sänd-gräns — EN mottagare per anrop, med bilagor bifogade.
 * Skild från `ActionSender` (batch): Resends `/emails/batch`-ändpunkt stödjer
 * INTE bilagor alls (tyst brist, ADR-067 D9) — `/emails` (singel) gör det.
 * Kastar INTE för radfel; utfallet är `{accepted, reason?}` (no-throw-
 * inspektion, samma disciplin som `ActionSender`s batch-utfall).
 */
export type ActionSingleSender = (
  spec: ActionSpec,
  ctx: { idempotencyKey: string; attachments: readonly AttachmentPayload[] },
) => Promise<{ accepted: boolean; reason?: string }>;

export type ActionSendInput = {
  actionType: ActionType;
  targets: readonly ActionTarget[];
  /** Eventet urvalet är bundet till (SCOPE-KÄRNAN: åtgärdssidans urval är event-bundet). */
  event: EventContext;
  /**
   * [TASK-147.5] Eventets record-ID — bär den bilage-bärande grenens
   * Storage-path-prefix (`<eventId>/<lagringsnyckel>`). `EventContext` bär
   * bara VISNINGSDATA (namn/ort/datum), inget record-ID — additivt fält,
   * oanvänt av den bilage-fria grenen.
   */
  eventId: string;
  /** Redigerad ämnesrad-MALL (kan bära {förnamn}/{event}/{datum}/{ort}/{deadline}). */
  amne: string;
  /** Redigerad brödtext-MALL (samma platshållar-set). */
  mailtext: string;
  /** Klientens Idempotency-Key (UUID v4) — sänd-nyckeln härleds `<jobId>/<actionType>`. */
  jobId: string;
  /** ENVIRONMENT === 'production'. Fail-closed: allt annat → false (EF:ens ansvar). */
  isProd: boolean;
  /**
   * [TASK-274] `isUtskickSparrat(Deno.env.get('UTSKICK_SPARR'))` — klassificerat
   * i EF:en, samma per-EF-läsmönster som `isProd`. Sant → `runActionSend` kastar
   * `UtskickSparratError` FÖRE allt annat, oberoende av `isProd`.
   */
  utskickSparrat: boolean;
  /** Tidsstämpeln som skrivs (injicerad så testet slipper systemklockan). */
  nu: string;
  /**
   * [TASK-147.5, AC #1] Bilagor valda i väljaren — RESOLVED server-side.
   * TOM/frånvarande ⇒ bilage-fri batchgren (grenvalet är AUTOMATISKT: denna
   * fils egen `runActionSend` avgör, anroparen behöver inte veta vilken
   * mekanism som används).
   */
  attachments?: readonly ResolvedAttachment[];
};

export type ActionSendDeps = {
  sender: ActionSender;
  writeFields: ActionFieldWriter;
  /** Krävs ENDAST när `input.attachments` är icke-tom (den bilage-bärande grenen). */
  singleSender?: ActionSingleSender;
  /** Krävs ENDAST när `input.attachments` är icke-tom. */
  readAttachments?: AttachmentReader;
};

/**
 * [TASK-147.10, ADR-067 D10/T53 väg C] Testmail-till-mig — SAMMA sändväg
 * (`renderFor`, samma icke-prod-GOLV, samma `ActionSender`), men EN mottagare
 * och INGEN fält-skrivning. `target` är alltid den FÖRSTA mottagaren i
 * granskningens urval (källan till platshållar-data ENDAST) — mailet går
 * ALDRIG till `target.email`. Adressen är alltid `testRecipientEmail`, som
 * EF:en (`send-action-email/index.ts`) sätter till den AUTENTISERADE
 * anropar-identitetens egen e-post (`requireUser`), aldrig klient-buren —
 * samma "mottagaren kan aldrig komma från klienten"-princip som resten av
 * filen, fast i motsatt riktning: här är det den KÄNDA anroparen, inte en
 * anmälan, som är destinationen.
 *
 * INGEN `ActionFieldWriter` I DEPS — strukturellt omöjligt att stämpla ett
 * fält härifrån (jfr `runActionSend` steg 4). Ett testmail är diagnostik, inte
 * en åtgärd: urvalets anmälan lämnas ORÖRD oavsett utfall (AC #2).
 */
export type ActionTestSendInput = {
  /** Den FÖRSTA mottagaren i urvalet — endast platshållar-data (fornamn m.fl.) läses. */
  target: ActionTarget;
  event: EventContext;
  /** Redigerad ämnesrad-MALL — TEST-prefixas innan sändning (AC #1). */
  amne: string;
  mailtext: string;
  /** Den inloggade anroparens egen adress (`requireUser`-resultatet), ALDRIG klient-buren. */
  testRecipientEmail: string;
  /** Klientens Idempotency-Key (UUID v4) — testnyckeln härleds `<jobId>/test`. */
  jobId: string;
  /** ENVIRONMENT === 'production'. Fail-closed: allt annat → false (EF:ens ansvar). */
  isProd: boolean;
  /**
   * [TASK-274] `isUtskickSparrat(Deno.env.get('UTSKICK_SPARR'))` — samma
   * fält/kontrakt som `ActionSendInput.utskickSparrat`. Sant → `runActionTestSend`
   * kastar `UtskickSparratError` FÖRE allt annat.
   */
  utskickSparrat: boolean;
};

export type ActionTestSendResult = {
  status: 'sent' | 'failed';
  /** Endast satt vid `failed` — Resends radavvisnings-skäl, fri text (passthrough). */
  reason?: string;
};

/**
 * Kör ETT testmail (längd 1, `ActionTestSendInput.target`). Ordning speglar
 * `runActionSend` minus partitionerings- och fält-skrivningsstegen (irrelevanta
 * för diagnostik):
 *  0. [TASK-274] UTSKICKS-SPÄRR (Marcus-flip) FÖRE ALLT — `input.utskickSparrat`
 *     sant → kasta `UtskickSparratError`, oberoende av miljö.
 *  1. Rendera mailet ur `target`s platshållar-data (SAMMA `renderFor` som den
 *     verkliga sändvägen — granskningen Lotta ser och testmailet hon FÅR är
 *     samma algoritm).
 *  2. TEST-prefixa ämnesraden (AC #1: "tydligt TEST-märkt ämnesrad").
 *  3. ICKE-PROD-SPÄRR (GOLV, ÅTERANVÄND — ALDRIG kringgången): i icke-prod
 *     måste `testRecipientEmail` SJÄLV vara en Resend-test-adress, annars
 *     `NonProdAddressError` (noll skickat). E2E/acceptance-mönstret för detta:
 *     en testadress-inloggad staging-user, eller mockad EF-rand.
 *  4. Sänd EN gång med idempotens-nyckeln `<jobId>/test` (namnrymds-separerad
 *     från `runActionSend`s `<jobId>/<actionType>` — samma jobId kan alltså
 *     bära BÅDE ett testmail och ett verkligt utskick utan nyckel-krock).
 *  5. Status: accepterad ⇒ 'sent'; avvisad ⇒ 'failed' + Resends skäl.
 */
export async function runActionTestSend(
  input: ActionTestSendInput,
  deps: { sender: ActionSender },
): Promise<ActionTestSendResult> {
  // 0) Utskicks-spärren — FÖRE allt annat, oberoende av miljö.
  if (input.utskickSparrat) {
    throw new UtskickSparratError();
  }

  const mail = renderFor(input.amne, input.mailtext, input.target, input.event);
  const email = input.testRecipientEmail.trim();

  if (!input.isProd && !RESEND_TEST_ADDRESSES.includes(email)) {
    throw new NonProdAddressError([email]);
  }

  const spec: ActionSpec = {
    registrationId: input.target.id,
    email,
    subject: `TEST: ${mail.subject}`,
    text: mail.text,
    html: mail.html,
  };

  const outcome = await deps.sender([spec], { idempotencyKey: `${input.jobId}/test` });

  if (outcome.accepted.some((a) => a.registrationId === spec.registrationId)) {
    return { status: 'sent' };
  }
  const rejection = outcome.rejected.find((r) => r.registrationId === spec.registrationId);
  return { status: 'failed', reason: rejection?.reason ?? 'Okänt fel — mailet avvisades.' };
}

/**
 * Vilka fält som stämplas för EN accepterad mottagare, per åtgärdstyp — `null`
 * = inget att skriva (mailet ensamt är hela handlingen).
 *
 *  · bekraftelse: Status→Bekräftad + tidsstämpel (ORDLISTA: Bekräftad ⟺
 *    bekräftelsen skickad, S73 K53 — EXAKT send-registration-confirmation-
 *    kontraktet, nu generaliserat in i denna sändväg).
 *  · eventinfo: 'Deltagarinfo skickad' (redan visad i AtgardsSida.tsx:s
 *    deltagarkort — `reg.deltagarinfoSkickad`).
 *  · paminnelse: de TVÅ additiva per-betalnings-fälten (task-18.8), VILLKORAT
 *    på mottagarens EGNA betalningsläge — `useLogPaymentReminder`s docblock
 *    (src/data/mutations/registrationPayments.ts) pekar UTTRYCKLIGEN ut dessa
 *    fält som målet för "ett framtida server-side-utskick (18.6:s EF-mönster)
 *    [som] kan ersätta mailto utan att fälten ändrar form" — detta ÄR den
 *    ersättningen. Saknas BÅDA (mottagaren redan betald) skrivs inget.
 *  · fritt: inget fält finns i basens grammatik för ett fritt utskick — mailet
 *    är hela handlingen.
 */
function stampFieldsFor(
  actionType: ActionType,
  target: ActionTarget,
  nu: string,
): Record<string, unknown> | null {
  switch (actionType) {
    case 'bekraftelse':
      return { [FALT_STATUS]: STATUS_BEKRAFTAD, [FALT_BEKRAFTELSE_SKICKAD]: nu };
    case 'eventinfo':
      return { [FALT_DELTAGARINFO_SKICKAD]: nu };
    case 'paminnelse': {
      const fields: Record<string, unknown> = {};
      if (target.anmalningsavgift === PAYMENT_EJ_MOTTAGEN) fields[FALT_PAMINNELSE_AVGIFT] = nu;
      if (target.slutbetalning === PAYMENT_EJ_MOTTAGEN) fields[FALT_PAMINNELSE_SLUT] = nu;
      return Object.keys(fields).length > 0 ? fields : null;
    }
    case 'fritt':
      return null;
    default:
      return null;
  }
}

/** Rendera EN mottagares mail ur mallarna — platshållar-mirrorn (action-mail-template.ts). */
function renderFor(
  amneMall: string,
  mailtextMall: string,
  target: ActionTarget,
  event: EventContext,
): { subject: string; text: string; html: string } {
  // {datum} och {deadline} HÄRLEDS ur eventets startdatum — de läses inte som
  // egna fält (samma regel som AtgardsSida.tsx:s `fyllPlatshallare`-anropare:
  // {deadline} = 14 dagar före start, {datum} = startdatumet självt, sv-SE
  // 'd MMMM'-format). Ändras uträkningen ändras BÅDA ställena samtidigt.
  const vars: TemplateVars = {
    förnamn: target.fornamn,
    event: event.eventNamn,
    datum: dagManad(event.startdatum),
    ort: event.ort,
    deadline: deadlineDatum(event.startdatum),
  };
  const subject = fillPlaceholders(amneMall, vars).text;
  const text = fillPlaceholders(mailtextMall, vars).text;
  return { subject, text, html: renderHtml(text) };
}

/** Delad partitionering — se `runActionSend` steg 1. Ren, ingen I/O. */
type Partitioned = {
  skipped: { registrationId: string; reason: SkipReason }[];
  specs: ActionSpec[];
  targetByRegId: Map<string, ActionTarget>;
};

function partitionTargets(input: ActionSendInput): Partitioned {
  const skipped: { registrationId: string; reason: SkipReason }[] = [];
  const specs: ActionSpec[] = [];
  const targetByRegId = new Map<string, ActionTarget>();

  for (const t of input.targets) {
    if (t.status !== null && INAKTIVA_STATUSAR.includes(t.status)) {
      skipped.push({ registrationId: t.id, reason: 'inactive' });
      continue;
    }
    if (input.actionType === 'bekraftelse' && t.status !== 'Obekräftad') {
      skipped.push({ registrationId: t.id, reason: 'already_confirmed' });
      continue;
    }
    const email = typeof t.email === 'string' ? t.email.trim() : '';
    if (!email) {
      skipped.push({ registrationId: t.id, reason: 'no_email' });
      continue;
    }
    const mail = renderFor(input.amne, input.mailtext, t, input.event);
    specs.push({ registrationId: t.id, email, ...mail });
    targetByRegId.set(t.id, t);
  }

  return { skipped, specs, targetByRegId };
}

/**
 * [TASK-147.5, AC #1] Grenvalet — AUTOMATISKT, anroparen (send-action-email/
 * index.ts) behöver inte veta vilken mekanism som används. Icke-tom
 * `input.attachments` ⇒ den bilage-bärande grenen (loopad singelsändning,
 * ADR-067 D9); annars den bilage-fria batchgrenen (D2, oförändrad).
 *
 * [TASK-274] UTSKICKS-SPÄRREN (Marcus-flip) kastas HÄR, FÖRE grenvalet —
 * `input.utskickSparrat` sant → `UtskickSparratError`, oberoende av miljö. EN
 * check täcker BÅDA grenarna (ingen kan skicka förbi via vare sig den
 * bilage-fria eller den bilage-bärande vägen).
 */
export async function runActionSend(
  input: ActionSendInput,
  deps: ActionSendDeps,
): Promise<ActionSendResult> {
  if (input.utskickSparrat) {
    throw new UtskickSparratError();
  }

  const partitioned = partitionTargets(input);
  const attachments = input.attachments ?? [];
  if (attachments.length > 0) {
    return runActionSendWithAttachments(input, attachments, partitioned, deps);
  }
  return runActionSendBatch(input, partitioned, deps);
}

/**
 * Bilage-FRI gren (ADR-067 D9, D2 oförändrad) — kör ett åtgärdsutskick via
 * batch (enskild mottagare = längd 1; hela urvalet = längd N — SAMMA
 * operation). Ordning är lastbärande:
 *  1. Partitionering (ovan, DELAD med attachment-grenen).
 *  2. ICKE-PROD-SPÄRR (GOLV) FÖRE sändning: en enda icke-test-adress → kasta
 *     NonProdAddressError (noll mail, noll skrivning). Nyckel-OBEROENDE.
 *  3. Sänd EN gång för hela urvalet med deterministisk idempotens-nyckel.
 *  4. Skriv stämpel-fälten ENDAST för accepterade (atomicitets-kontraktet);
 *     `stampFieldsFor` kan returnera `null` (fritt / paminnelse-utan-
 *     kvarstående-skuld) → räknas som `completed` utan Airtable-anrop.
 *  5. Status (aldrig binär): attempted 0 → 'skipped'; inget klart → 'failed';
 *     något föll → 'partial'; annars 'sent'.
 */
async function runActionSendBatch(
  input: ActionSendInput,
  { skipped, specs, targetByRegId }: Partitioned,
  deps: ActionSendDeps,
): Promise<ActionSendResult> {
  // 2) Lastbärande icke-prod-spärr — FÖRE all sändning (samma GOLV som bulk-send
  //    och confirm-registrations, ALDRIG kringgången).
  if (!input.isProd) {
    const offending = [
      ...new Set(specs.filter((s) => !RESEND_TEST_ADDRESSES.includes(s.email)).map((s) => s.email)),
    ];
    if (offending.length > 0) {
      throw new NonProdAddressError(offending);
    }
  }

  if (specs.length === 0) {
    return {
      status: 'skipped',
      requested: input.targets.length,
      attempted: 0,
      completed: [],
      skipped,
      failed: [],
    };
  }

  // 3) Sänd (deterministisk idempotens-nyckel → stabil Resend-cache-träff vid retry).
  const outcome = await deps.sender(specs, {
    idempotencyKey: `${input.jobId}/${input.actionType}`,
  });

  const failed: { registrationId: string; reason: string }[] = [
    ...outcome.rejected.map((r) => ({ registrationId: r.registrationId, reason: r.reason })),
  ];

  // 4) Skriv stämpel-fälten ENDAST för accepterade (atomicitets-kontraktet).
  const completed: string[] = [];
  for (const ok of outcome.accepted) {
    const target = targetByRegId.get(ok.registrationId);
    const fields = target ? stampFieldsFor(input.actionType, target, input.nu) : null;
    if (fields === null) {
      // Inget att skriva (fritt-mail, eller paminnelse där mottagaren redan
      // saknar kvarstående skuld) — mailet ENSAMT är hela handlingen.
      completed.push(ok.registrationId);
      continue;
    }
    try {
      await deps.writeFields(ok.registrationId, fields);
      completed.push(ok.registrationId);
    } catch (error) {
      failed.push({
        registrationId: ok.registrationId,
        reason: `Mailet skickades men fältet kunde inte uppdateras: ${
          error instanceof Error ? error.message : String(error)
        }`,
      });
    }
  }

  // 5) Status — aldrig binär.
  let status: ActionSendResult['status'];
  if (completed.length === 0) status = 'failed';
  else if (failed.length > 0) status = 'partial';
  else status = 'sent';

  return {
    status,
    requested: input.targets.length,
    attempted: specs.length,
    completed,
    skipped,
    failed,
  };
}

/**
 * [TASK-147.5, ADR-067 D9] Bilage-BÄRANDE gren — loopad SINGELsändning, ETT
 * `/emails`-anrop per mottagare (Resends `/emails/batch` stödjer inte
 * bilagor alls, tyst brist). Delar partitionering, icke-prod-GOLV och
 * stämpel-fältslogik ORÖRT med batchgrenen (`stampFieldsFor`,
 * `partitionTargets`) — bara SÄNDMEKANIKEN skiljer, per uppdraget
 * ("INGEN omdesign").
 *
 * Ordning:
 *  1. Partitionering (DELAD, se ovan).
 *  2. ICKE-PROD-SPÄRR (GOLV, SAMMA plats i ordningen som batchgrenen).
 *  3. Hämta bilagornas bytes EN gång (delade av ALLA mottagare — klass A/B,
 *     inte klass C:s per-mottagare-generering, utanför denna skivas scope).
 *  4. Sänd EN gång PER MOTTAGARE, idempotensnyckel
 *     `<jobId>/<actionType>/<registrationId>` — DETERMINISTISK PER MOTTAGARE
 *     (AC #3), skild från batchgrenens jobb-nivå-nyckel och testgrenens
 *     `<jobId>/test`. Ett kastat fel (nätverk) för EN mottagare fångas och
 *     räknas som `failed` för just den — en transient nätverksglitch på
 *     mottagare N ska inte förlora N-1 redan lyckade sändningar (loopens
 *     motsvarighet till D3:s "aldrig binärt delutfall": batchens ENDA anrop
 *     är atomiskt på transportnivå, loopens N anrop är det INTE, så samma
 *     ärlighetsprincip kräver att en enskild request-krasch inte välter hela
 *     körningen).
 *  5. Skriv stämpel-fälten ENDAST för accepterade (atomicitets-kontraktet,
 *     SAMMA `stampFieldsFor` som batchgrenen).
 *  6. Status (aldrig binär) — SAMMA regel som batchgrenen.
 */
async function runActionSendWithAttachments(
  input: ActionSendInput,
  attachments: readonly ResolvedAttachment[],
  { skipped, specs, targetByRegId }: Partitioned,
  deps: ActionSendDeps,
): Promise<ActionSendResult> {
  if (!deps.singleSender || !deps.readAttachments) {
    throw new Error(
      'runActionSendWithAttachments kräver singleSender + readAttachments i deps — ' +
        'anroparen bad om en bilage-bärande sändning utan att koppla in mekanismen.',
    );
  }

  // 2) Lastbärande icke-prod-spärr — SAMMA plats i ordningen som batchgrenen.
  if (!input.isProd) {
    const offending = [
      ...new Set(specs.filter((s) => !RESEND_TEST_ADDRESSES.includes(s.email)).map((s) => s.email)),
    ];
    if (offending.length > 0) {
      throw new NonProdAddressError(offending);
    }
  }

  if (specs.length === 0) {
    return {
      status: 'skipped',
      requested: input.targets.length,
      attempted: 0,
      completed: [],
      skipped,
      failed: [],
    };
  }

  // 3) Bilagornas bytes — EN hämtning, delad av alla mottagare i loopen.
  const attachmentPayloads = await deps.readAttachments(attachments, input.eventId);

  // 4) Sänd EN gång PER MOTTAGARE (deterministisk per-mottagare-nyckel, AC #3).
  const failed: { registrationId: string; reason: string }[] = [];
  const acceptedSpecs: ActionSpec[] = [];
  for (const spec of specs) {
    let outcome: { accepted: boolean; reason?: string };
    try {
      outcome = await deps.singleSender(spec, {
        idempotencyKey: `${input.jobId}/${input.actionType}/${spec.registrationId}`,
        attachments: attachmentPayloads,
      });
    } catch (error) {
      // Se docblockens punkt 4 — en request-krasch är INTE en batch-avvisning
      // och ska inte förlora tidigare mottagares redan lyckade sändningar.
      outcome = { accepted: false, reason: error instanceof Error ? error.message : String(error) };
    }
    if (outcome.accepted) {
      acceptedSpecs.push(spec);
    } else {
      failed.push({
        registrationId: spec.registrationId,
        reason: outcome.reason ?? 'Okänt fel — mailet avvisades.',
      });
    }
  }

  // 5) Skriv stämpel-fälten ENDAST för accepterade (atomicitets-kontraktet, DELAD logik).
  const completed: string[] = [];
  for (const ok of acceptedSpecs) {
    const target = targetByRegId.get(ok.registrationId);
    const fields = target ? stampFieldsFor(input.actionType, target, input.nu) : null;
    if (fields === null) {
      completed.push(ok.registrationId);
      continue;
    }
    try {
      await deps.writeFields(ok.registrationId, fields);
      completed.push(ok.registrationId);
    } catch (error) {
      failed.push({
        registrationId: ok.registrationId,
        reason: `Mailet skickades men fältet kunde inte uppdateras: ${
          error instanceof Error ? error.message : String(error)
        }`,
      });
    }
  }

  // 6) Status — aldrig binär (SAMMA regel som batchgrenen).
  let status: ActionSendResult['status'];
  if (completed.length === 0) status = 'failed';
  else if (failed.length > 0) status = 'partial';
  else status = 'sent';

  return {
    status,
    requested: input.targets.length,
    attempted: specs.length,
    completed,
    skipped,
    failed,
  };
}
