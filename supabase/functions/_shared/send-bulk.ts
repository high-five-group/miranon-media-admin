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
  status: 'sent' | 'partial' | 'failed';
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

  // 4) Status (D3).
  const rejectedCount = rejections.length;
  const status: BulkSendStatus['status'] =
    counts.attempted > 0 && acceptedCount === 0
      ? 'failed'
      : rejectedCount > 0
        ? 'partial'
        : 'sent';

  // 5) Revisionslogg (merge på jobId → exakt-en-gång-loggrad vid retry).
  const logRecordId = await deps.writeLog({
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
