// Bekräftelse-ORKESTRATOR (task-18.6; PRD task-18 beslut 7). Dependency-injicerad och
// Deno-global-fri i sin yta → Node-importerbar för api-pure-kontraktstest (mockade
// gränser) OCH Deno-importerbar av send-registration-confirmation-EF:en (riktiga
// gränser). Samma form som _shared/send-bulk.ts (Fas 6h L2b) — repots andra mail-vertikal
// ärver dess bevisade uppdelning i stället för att uppfinna en egen.
//
// KONTRAKTET (ORDLISTA: Bekräftad ⟺ anmälningsbekräftelsen är skickad, S73 K53):
// mailet och status-flippen är EN operation server-side. Ordningen är lastbärande —
// mailet FÖRST, flippen bara för den vars mail faktiskt accepterades. En anmälan som
// inte fick sitt mail lämnas ORÖRD: basen får aldrig påstå "bekräftad" om inget mail gick.
//
// ICKE-PROD-SPÄRREN ÅTERANVÄNDS ur send-bulk.ts (GOLV, ADR-067 D-klassen) — den kopieras
// aldrig och kringgås aldrig: i icke-prod måste VARJE upplöst mottagare vara en
// Resend-test-adress, annars vägras hela operationen (noll mail, noll flip).

import type { ResendBatchData } from './resend-batch.ts';
import { NonProdAddressError, RESEND_TEST_ADDRESSES, renderHtml, UtskickSparratError } from './send-bulk.ts';

/** Basens Status-ord (data-model.md §Status-värden — Anmälningar). */
const STATUS_OBEKRAFTAD = 'Obekräftad';
export const STATUS_BEKRAFTAD = 'Bekräftad (mail skickat)';
/**
 * Statusar där en bekräftelse ALDRIG får gå ut (avbokad person / inställt event).
 * EXPORTERAD (TASK-147.1): send-action-email.ts återanvänder samma defensiva golv
 * för ALLA fyra åtgärdstyperna (bekräftelse/påminnelse/eventinfo/fritt) — ingen
 * åtgärd ska gå till en avbokad/inställd anmälan. En delad konstant, inte en
 * andra hårdkodad kopia som kan glida.
 */
export const INAKTIVA_STATUSAR = ['Avbokad/Ombokad', 'Inställt'];

/** Airtable-fältnamnen operationen skriver (allowlist-SSOT: field-allowlists.ts). */
export const FALT_STATUS = 'Status';
export const FALT_BEKRAFTELSE_SKICKAD = 'Bekräftelse skickad';

/**
 * En anmälan som EF:en läst upp SERVER-SIDE ur basen (klienten skickar bara record-ID:n —
 * aldrig adress, namn eller status: mottagaren får aldrig komma från klienten).
 */
export type ConfirmTarget = {
  id: string;
  email: string | null;
  namn: string | null;
  status: string | null;
  eventNamn: string | null;
};

/** Vad sändaren behöver per mottagare — rendering sker här, nätverket i EF:en. */
export type ConfirmSpec = {
  registrationId: string;
  email: string;
  subject: string;
  html: string;
  text: string;
};

/** Normaliserat utfall av sänd-anropet (Resend-SDK-formen stannar i EF:ens sender). */
export type ConfirmSendOutcome = {
  accepted: { registrationId: string }[];
  rejected: { registrationId: string; reason: string }[];
};

/** Injicerad sänd-gräns. EF:en ger en riktig Resend-sender; testet en mock. */
export type ConfirmationSender = (
  specs: readonly ConfirmSpec[],
  ctx: { idempotencyKey: string },
) => Promise<ConfirmSendOutcome>;

/** Injicerad Airtable-gräns: sätt Status + Bekräftelse skickad på EN anmälan. */
export type StatusFlipper = (registrationId: string, tidpunkt: string) => Promise<void>;

/** Varför en anmälan hoppades över — aldrig tyst, alltid med skäl. */
export type SkipReason = 'inactive' | 'already_confirmed' | 'no_email';

export type ConfirmRegistrationsResult = {
  /**
   * Aldrig binär (send-bulk D3-formen). `skipped` = NOLL-LEVERANS (`attempted === 0`):
   * inget mail skickades och ingen anmälan ändrades. `failed` = allt försökt föll.
   */
  status: 'sent' | 'partial' | 'failed' | 'skipped';
  requested: number;
  attempted: number;
  /** Anmälningar som fick BÅDE mail och status-flip. */
  confirmed: string[];
  skipped: { registrationId: string; reason: SkipReason }[];
  failed: { registrationId: string; reason: string }[];
  /** ISO-tidsstämpeln som skrevs till 'Bekräftelse skickad' (null om inget skrevs). */
  bekraftelseSkickad: string | null;
};

export type ConfirmRegistrationsInput = {
  targets: readonly ConfirmTarget[];
  /** Klientens Idempotency-Key (UUID v4) — sänd-nyckeln härleds `<jobId>/bekraftelse`. */
  jobId: string;
  /** ENVIRONMENT === 'production'. Fail-closed: allt annat → false (EF:ens ansvar). */
  isProd: boolean;
  /**
   * [TASK-274] `isUtskickSparrat(Deno.env.get('UTSKICK_SPARR'))` — klassificerat
   * i EF:en, samma per-EF-läsmönster som `isProd`. Sant → `confirmRegistrations`
   * kastar `UtskickSparratError` FÖRE allt annat, oberoende av `isProd`.
   */
  utskickSparrat: boolean;
  /** Tidsstämpeln som skrivs (injicerad så testet slipper systemklockan). */
  nu: string;
};

export type ConfirmRegistrationsDeps = {
  sender: ConfirmationSender;
  flipStatus: StatusFlipper;
};

/**
 * Bekräftelsemailets innehåll (mail 1 i Lottas flöde). Byggs SERVER-SIDE — klienten
 * skickar aldrig text. Plain text + minimal html är syskon (multipart, aldrig
 * html-only); html:en escapas via send-bulks renderHtml så ett namn med markup-tecken
 * aldrig kan läcka som markup.
 *
 * ÖPPEN PUNKT (bokförd på kortet): Lottas kanoniska copy bor idag i Resend-mallen
 * `medveten-kontakt-bekraftelse`, som är en broadcast-mall och INTE nåbar via
 * batch-send-vägen. Texten här är den neutrala, sanna första versionen — den lovar
 * inget om betalning (belopp/konto ägs inte av appen) och byts ut när mall-vägen
 * beslutas. Prod-deploy av EF:en är ändå en separat auktoriserad handling.
 */
export function renderConfirmationMail(target: { namn: string | null; eventNamn: string | null }): {
  subject: string;
  text: string;
  html: string;
} {
  const eventDel = target.eventNamn ? ` — ${target.eventNamn}` : '';
  const subject = `Bekräftelse på din anmälan${eventDel}`;
  const hälsning = target.namn ? `Hej ${target.namn},` : 'Hej,';
  const vad = target.eventNamn ? `din anmälan till ${target.eventNamn}` : 'din anmälan';
  const text =
    `${hälsning}\n\n` +
    `Vi har tagit emot ${vad} och den är nu bekräftad.\n\n` +
    `Cirka två veckor före start skickar vi ett mail med all praktisk information ` +
    `— plats, tider och vad du behöver ta med dig.\n\n` +
    `Har du frågor är det bara att svara på det här mailet.\n\n` +
    `Varma hälsningar\nRoger och Lotta\nMiranon Media`;
  return { subject, text, html: renderHtml(text) };
}

/**
 * Resend permissive-svar → ConfirmSendOutcome, RAD-EXAKT via `errors[].index`
 * (nollbaserat mot originalpayloaden). Samma index-semantik som resend-batch.ts
 * `parseBatchOutcome`, men nyckeln är REGISTRATION-ID i stället för e-post: två
 * anmälningar kan dela e-postadress (en +1-anmälan på huvudanmälarens adress), och
 * en e-post-nyckel hade då flippat fel rad. Ren (ingen SDK-import, inget I/O).
 */
export function parseConfirmOutcome(
  specs: readonly ConfirmSpec[],
  data: ResendBatchData | null | undefined,
): ConfirmSendOutcome {
  const errors = Array.isArray(data?.errors) ? data.errors : [];
  const rejectedIdx = new Set<number>();
  const rejected: { registrationId: string; reason: string }[] = [];
  for (const e of errors) {
    const idx = typeof e?.index === 'number' ? e.index : -1;
    const reason =
      typeof e?.message === 'string' && e.message.length > 0 ? e.message : 'Resend validation error';
    if (idx >= 0 && idx < specs.length) {
      rejectedIdx.add(idx);
      rejected.push({ registrationId: specs[idx].registrationId, reason });
    } else {
      // Index utanför intervall (struktur-drift) — fäll synligt, fabricera ingen rad.
      console.warn(`[confirm-registrations] errors[].index utanför intervall: ${idx}`);
      rejected.push({ registrationId: '(okänd — index utanför intervall)', reason });
    }
  }
  return {
    accepted: specs
      .filter((_, i) => !rejectedIdx.has(i))
      .map((s) => ({ registrationId: s.registrationId })),
    rejected,
  };
}

/**
 * Bekräfta en eller flera anmälningar (enskild = längd 1; Bekräfta alla = längd N —
 * SAMMA operation, kontrollfrågan bor i UI:t). Ordning är lastbärande:
 *  0. [TASK-274] UTSKICKS-SPÄRR (Marcus-flip) FÖRE ALLT — `input.utskickSparrat`
 *     sant → kasta `UtskickSparratError`, oberoende av miljö.
 *  1. Partitionering: inaktiv (avbokad/inställt) → redan bekräftad → e-post-lös
 *     hamnar bland `skipped` med SKÄL; endast Obekräftad med e-post försöks.
 *  2. ICKE-PROD-SPÄRR (GOLV) FÖRE sändning: en enda icke-test-adress → kasta
 *     NonProdAddressError (noll mail, noll flip). Nyckel-OBEROENDE.
 *  3. Sänd EN gång för hela urvalet med deterministisk idempotens-nyckel.
 *  4. Flippa Status + Bekräftelse skickad ENDAST för accepterade (atomicitets-
 *     kontraktet). Ett flip-fel rapporteras som `failed` — aldrig tyst.
 *  5. Status (aldrig binär): attempted 0 → 'skipped'; inget bekräftat → 'failed';
 *     något föll → 'partial'; annars 'sent'.
 */
export async function confirmRegistrations(
  input: ConfirmRegistrationsInput,
  deps: ConfirmRegistrationsDeps,
): Promise<ConfirmRegistrationsResult> {
  if (input.utskickSparrat) {
    throw new UtskickSparratError();
  }

  const skipped: { registrationId: string; reason: SkipReason }[] = [];
  const specs: ConfirmSpec[] = [];

  // 1) Partitionering — varje anmälan landar i EXAKT en hink.
  for (const t of input.targets) {
    if (t.status !== null && INAKTIVA_STATUSAR.includes(t.status)) {
      skipped.push({ registrationId: t.id, reason: 'inactive' });
      continue;
    }
    if (t.status !== STATUS_OBEKRAFTAD) {
      skipped.push({ registrationId: t.id, reason: 'already_confirmed' });
      continue;
    }
    const email = typeof t.email === 'string' ? t.email.trim() : '';
    if (!email) {
      skipped.push({ registrationId: t.id, reason: 'no_email' });
      continue;
    }
    const mail = renderConfirmationMail(t);
    specs.push({ registrationId: t.id, email, ...mail });
  }

  // 2) Lastbärande icke-prod-spärr — FÖRE all sändning (samma GOLV som bulk-send).
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
      confirmed: [],
      skipped,
      failed: [],
      bekraftelseSkickad: null,
    };
  }

  // 3) Sänd (deterministisk idempotens-nyckel → stabil Resend-cache-träff vid retry).
  const outcome = await deps.sender(specs, { idempotencyKey: `${input.jobId}/bekraftelse` });

  const failed: { registrationId: string; reason: string }[] = [
    ...outcome.rejected.map((r) => ({ registrationId: r.registrationId, reason: r.reason })),
  ];

  // 4) Flippa ENDAST accepterade (atomicitets-kontraktet).
  const confirmed: string[] = [];
  for (const ok of outcome.accepted) {
    try {
      await deps.flipStatus(ok.registrationId, input.nu);
      confirmed.push(ok.registrationId);
    } catch (error) {
      failed.push({
        registrationId: ok.registrationId,
        reason: `Mailet skickades men status kunde inte uppdateras: ${
          error instanceof Error ? error.message : String(error)
        }`,
      });
    }
  }

  // 5) Status — aldrig binär.
  let status: ConfirmRegistrationsResult['status'];
  if (confirmed.length === 0) status = 'failed';
  else if (failed.length > 0) status = 'partial';
  else status = 'sent';

  return {
    status,
    requested: input.targets.length,
    attempted: specs.length,
    confirmed,
    skipped,
    failed,
    bekraftelseSkickad: confirmed.length > 0 ? input.nu : null,
  };
}
