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
import {
  type ConfirmSendOutcome,
  type ConfirmSpec,
  FALT_BEKRAFTELSE_SKICKAD,
  FALT_STATUS,
  INAKTIVA_STATUSAR,
  parseConfirmOutcome,
  STATUS_BEKRAFTAD,
} from './confirm-registrations.ts';
import { NonProdAddressError, RESEND_TEST_ADDRESSES, renderHtml } from './send-bulk.ts';

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

export type ActionSendInput = {
  actionType: ActionType;
  targets: readonly ActionTarget[];
  /** Eventet urvalet är bundet till (SCOPE-KÄRNAN: åtgärdssidans urval är event-bundet). */
  event: EventContext;
  /** Redigerad ämnesrad-MALL (kan bära {förnamn}/{event}/{datum}/{ort}/{deadline}). */
  amne: string;
  /** Redigerad brödtext-MALL (samma platshållar-set). */
  mailtext: string;
  /** Klientens Idempotency-Key (UUID v4) — sänd-nyckeln härleds `<jobId>/<actionType>`. */
  jobId: string;
  /** ENVIRONMENT === 'production'. Fail-closed: allt annat → false (EF:ens ansvar). */
  isProd: boolean;
  /** Tidsstämpeln som skrivs (injicerad så testet slipper systemklockan). */
  nu: string;
};

export type ActionSendDeps = { sender: ActionSender; writeFields: ActionFieldWriter };

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

/**
 * Kör ett åtgärdsutskick (enskild mottagare = längd 1; hela urvalet = längd N
 * — SAMMA operation). Ordning är lastbärande:
 *  1. Partitionering: inaktiv (avbokad/inställt, delad golv-lista med
 *     confirm-registrations.ts) → (bekräftelse-specifikt: redan bekräftad) →
 *     e-post-lös hamnar bland `skipped` MED SKÄL; resten försöks.
 *  2. ICKE-PROD-SPÄRR (GOLV) FÖRE sändning: en enda icke-test-adress → kasta
 *     NonProdAddressError (noll mail, noll skrivning). Nyckel-OBEROENDE.
 *  3. Sänd EN gång för hela urvalet med deterministisk idempotens-nyckel.
 *  4. Skriv stämpel-fälten ENDAST för accepterade (atomicitets-kontraktet);
 *     `stampFieldsFor` kan returnera `null` (fritt / paminnelse-utan-
 *     kvarstående-skuld) → räknas som `completed` utan Airtable-anrop.
 *  5. Status (aldrig binär): attempted 0 → 'skipped'; inget klart → 'failed';
 *     något föll → 'partial'; annars 'sent'.
 */
export async function runActionSend(
  input: ActionSendInput,
  deps: ActionSendDeps,
): Promise<ActionSendResult> {
  const skipped: { registrationId: string; reason: SkipReason }[] = [];
  const specs: ActionSpec[] = [];
  const targetByRegId = new Map<string, ActionTarget>();

  // 1) Partitionering — varje mottagare landar i EXAKT en hink.
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
