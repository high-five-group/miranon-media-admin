// Bulk-send-ORKESTRATOR (Fas 6h L2b, ADR-067 D3/D5/D8). Dependency-injicerad och
// Deno-global-fri i sin yta → Node-importerbar för api-pure-kontraktstest (mockade
// gränser) OCH Deno-importerbar av send-email-EF (riktiga gränser). Den orkestrerar
// den OÅTERKALLELIGA delen men äger inget I/O själv: medlems-upplösning, Resend-sänd
// och Utskickslogg-write injiceras (BatchSender, LogWriter) så testet kör noll riktig
// Resend/Airtable och EF:en kör de skarpa.
//
// Konsumerar L1:s rena prepareBulkSend (consent/dedup/chunk/räkning) — reimplementerar
// INGET av det. Lägger ovanpå: (1) den lastbärande icke-prod-spärren (GOLV), (2) Resend-
// neutral batch-iteration med deterministisk idempotens-nyckel per batch, (3) partial-
// failure-status (aldrig binär), (4) revisionslogg-write via injicerad merge-writer.

import { prepareBulkSend, type SegmentMember, type SendSpec } from './prepare-bulk-send.ts';

/**
 * Auktoritativa Resend-test-adresser (resend.com/docs/knowledge-base/what-email-
 * addresses-to-use-for-testing) — de ENDA adresser icke-prod får skicka till.
 */
export const RESEND_TEST_ADDRESSES: readonly string[] = [
  'delivered@resend.dev',
  'bounced@resend.dev',
  'complained@resend.dev',
  'suppressed@resend.dev',
];

/** Icke-prod-spärren vägrade: en upplöst mottagare var ingen Resend-test-adress. */
export class NonProdAddressError extends Error {
  readonly offending: string[];
  constructor(offending: string[]) {
    super(
      `Non-prod environment: bulk-send tillåter ENDAST Resend-test-adresser. ` +
        `Icke-test-adress(er) upplöst(a): ${offending.join(', ')}. Sändning vägrad (noll skickat).`,
    );
    this.name = 'NonProdAddressError';
    this.offending = offending;
  }
}

/**
 * [TASK-274, Marcus beslut B 2026-08-17] Utskicks-spärrens explicita
 * "öppet"-värde. Fail-closed ÅT RÄTT HÅLL (AC #3): frånvarande hemlighet
 * ELLER EXAKT detta värde = öppet (dagens beteende oförändrat); VARJE annat
 * värde (felstavning, "på", "true", "1", tomsträng) = blockerat. En felskriven
 * flip ska hellre blockera än släppa igenom.
 */
export const UTSKICK_SPARR_AV = 'av';

/**
 * Ren klassificering av `UTSKICK_SPARR`-hemlighetens råa värde — Deno-global-
 * FRI (denna fil måste förbli Node-importerbar för api-pure-kontraktstestet,
 * se filhuvudet). `Deno.env.get('UTSKICK_SPARR')` läses PER ANROP i VARJE
 * EF:s `index.ts` (samma per-EF-läsemönster som `isProd`, se
 * `RunBulkSendInput.isProd`s docstring) — aldrig här. EF:en skickar det redan
 * klassificerade booleanet vidare som orkestratorns `utskickSparrat`-input.
 */
export function isUtskickSparrat(varde: string | undefined): boolean {
  return varde !== undefined && varde !== UTSKICK_SPARR_AV;
}

/**
 * [TASK-274] Utskicks-spärren (Marcus beslut B) vägrade — en CENTRAL
 * kill-switch, oberoende av miljö (AC #2: fäller "oavsett miljö"). Samtliga
 * fyra utskicks-EF:er (åtgärdsmail/segmentutskick/kvitto/anmälningsbekräftelse)
 * kastar DENNA klass, ALDRIG en egen kopia — se `RunBulkSendInput.
 * utskickSparrat` och motsvarande fält i `send-action-email.ts`/`send-
 * receipt.ts`/`confirm-registrations.ts` för var den konsumeras.
 */
export class UtskickSparratError extends Error {
  constructor() {
    super('Utskick är blockerade just nu.');
    this.name = 'UtskickSparratError';
  }
}

/** Normaliserat utfall av ETT batch-anrop — Resend-SDK-formen stannar i EF:ens sender. */
export type BatchOutcome = {
  accepted: { email: string }[];
  rejected: { email: string; reason: string }[];
};

/** Injicerad sänd-gräns. EF:en ger en riktig Resend-sender; testet en mock. */
export type BatchSender = (
  batch: readonly SendSpec[],
  ctx: { idempotencyKey: string; subject: string; html: string; text: string },
) => Promise<BatchOutcome>;

/** Injicerad logg-writer (Utskickslogg merge-upsert). Returnerar logg-rad-ID. */
export type LogWriter = (entry: {
  jobId: string;
  amne: string;
  mailtext: string;
  acceptedPersonIds: string[];
  filterSnapshot: string;
}) => Promise<string>;

export type BulkSendStatus = {
  /**
   * D3-utfall, aldrig binärt. `skipped` = NOLL-LEVERANS (`attempted === 0`): tomt
   * segment eller alla undertryckta (consent/e-post) → ingen sändning skedde och
   * INGEN Utskickslogg-rad skrevs. Skiljs ärligt från `sent` (minst en accepterad)
   * så ett noll-utfall aldrig maskeras som framgång (6h arch-audit-fynd, ADR-067-not).
   */
  status: 'sent' | 'partial' | 'failed' | 'skipped';
  requested: number;
  suppressedConsent: number;
  suppressedNoEmail: number;
  deduped: number;
  attempted: number;
  accepted: number;
  rejected: number;
  rejections: { email: string; reason: string }[];
  logRecordId: string | null;
};

export type RunBulkSendInput = {
  members: readonly SegmentMember[];
  amne: string;
  mailtext: string;
  /** Klientens Idempotency-Key (UUID v4) — batch-nycklar härleds <jobId>/b<index>. */
  jobId: string;
  /** ENVIRONMENT === 'production'. Fail-closed: allt annat → false (EF:ens ansvar). */
  isProd: boolean;
  /**
   * [TASK-274] `isUtskickSparrat(Deno.env.get('UTSKICK_SPARR'))` — klassificerat
   * i EF:en, samma per-EF-läsmönster som `isProd`. Sant → `runBulkSend` kastar
   * `UtskickSparratError` FÖRE allt annat, oberoende av `isProd`.
   */
  utskickSparrat: boolean;
  /** "Vilka fick" — segment/filter-ögonblicksbild för Utskickslogg. */
  filterSnapshot: string;
};

export type RunBulkSendDeps = { batchSender: BatchSender; writeLog: LogWriter };

/** Minimal HTML-escape (XSS-säker plain→html). Render-KÄLLA (mall) låses L3. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Plain mailtext → minimal multipart-html (D8 — aldrig text-only/html-only). */
export function renderHtml(mailtext: string): string {
  return `<p>${escapeHtml(mailtext).replace(/\r?\n/g, '<br>')}</p>`;
}

/**
 * Orkestrera ett bulk-utskick (ADR-067). Ordning är lastbärande:
 *  0. [TASK-274] UTSKICKS-SPÄRR (Marcus-flip) FÖRE ALLT — central kill-switch,
 *     oberoende av miljö: `input.utskickSparrat` sant → kasta `UtskickSparratError`
 *     (noll räkning, noll sändning, noll logg-rad).
 *  1. prepareBulkSend (L1): consent/no-email/dedup/chunk + räkning.
 *  2. ICKE-PROD-SPÄRR (GOLV) FÖRE varje sänd-anrop: i icke-prod måste VARJE upplöst
 *     adress vara en Resend-test-adress; en enda icke-test-adress → kasta
 *     NonProdAddressError (noll skickat, ingen logg-rad). Nyckel-OBEROENDE.
 *  3. batchSender per batch med idempotencyKey=`<jobId>/b<index>` (deterministisk →
 *     stabil Resend-cache-träff vid retry). Sender kastar ej för rad-fel; utfallet
 *     bär accepted/rejected.
 *  4. Status (D3, aldrig binär): failed om attempted>0 & accepted=0; partial om
 *     rejected>0; annars sent.
 *  5. Revisionslogg-write (merge på jobId) — accepted Personers record-ID → Skickat till.
 */
export async function runBulkSend(
  input: RunBulkSendInput,
  deps: RunBulkSendDeps,
): Promise<BulkSendStatus> {
  // 0) Utskicks-spärren — FÖRE allt annat, oberoende av miljö.
  if (input.utskickSparrat) {
    throw new UtskickSparratError();
  }

  const { batches, counts } = prepareBulkSend(input.members);

  // 2) Lastbärande icke-prod-spärr — före all sändning.
  if (!input.isProd) {
    const offending = new Set<string>();
    for (const batch of batches) {
      for (const spec of batch) {
        if (!RESEND_TEST_ADDRESSES.includes(spec.email)) offending.add(spec.email);
      }
    }
    if (offending.size > 0) {
      throw new NonProdAddressError([...offending]);
    }
  }

  const subject = input.amne;
  const text = input.mailtext;
  const html = renderHtml(input.mailtext);

  // accepted-email → personId (för Utskickslogg Skickat till-länkning).
  const personIdByEmail = new Map<string, string>();
  for (const batch of batches) {
    for (const spec of batch) personIdByEmail.set(spec.email, spec.personId);
  }

  // 3) Sänd per batch (deterministisk idempotens-nyckel).
  const acceptedPersonIds: string[] = [];
  const rejections: { email: string; reason: string }[] = [];
  let acceptedCount = 0;
  for (let i = 0; i < batches.length; i += 1) {
    const outcome = await deps.batchSender(batches[i], {
      idempotencyKey: `${input.jobId}/b${i}`,
      subject,
      html,
      text,
    });
    for (const ok of outcome.accepted) {
      acceptedCount += 1;
      const personId = personIdByEmail.get(ok.email);
      if (personId) acceptedPersonIds.push(personId);
    }
    rejections.push(...outcome.rejected);
  }

  // 4) Status (D3, aldrig binär). attempted===0 → NOLL-LEVERANS ('skipped'), aldrig
  //    'sent' — ett tomt/allt-undertryckt utskick maskeras inte som framgång.
  const rejectedCount = rejections.length;
  let status: BulkSendStatus['status'];
  if (counts.attempted === 0) status = 'skipped';
  else if (acceptedCount === 0) status = 'failed';
  else if (rejectedCount > 0) status = 'partial';
  else status = 'sent';

  // 5) Revisionslogg (merge på jobId → exakt-en-gång-loggrad vid retry). NOLL-LEVERANS
  //    (attempted===0) skriver INGEN rad — ingen fantom-Utskickslogg för ett tomt utskick.
  //    Idempotens-konsistent: tomt → ingen rad → re-run → fortfarande ingen rad.
  const logRecordId =
    counts.attempted === 0
      ? null
      : await deps.writeLog({
          jobId: input.jobId,
          amne: input.amne,
          mailtext: input.mailtext,
          acceptedPersonIds,
          filterSnapshot: input.filterSnapshot,
        });

  return {
    status,
    requested: counts.requested,
    suppressedConsent: counts.suppressedConsent,
    suppressedNoEmail: counts.suppressedNoEmail,
    deduped: counts.deduped,
    attempted: counts.attempted,
    accepted: acceptedCount,
    rejected: rejectedCount,
    rejections,
    logRecordId,
  };
}
