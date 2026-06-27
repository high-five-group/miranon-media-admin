// Ren bulk-send-förberedelse (Fas 6h L1, ADR-067 D2–D6). NOLL Resend/Airtable-
// import, inget I/O → isolerat enhetstestbar (samma klass som segment-membership.ts
// + coerce.ts). KONFORMANS-KÄRNAN: consent-gate (D5), e-post-hygien (D6: dedup +
// e-post-lös-exkludering), batch-chunkning (D2/D4) och status-räkning (D3). De
// impura delarna — Resend /emails/batch-anropet, Utskickslogg-write och idempotens
// MOT Resend — hör L2 till och rör ALDRIG denna modul.
//
// Lever i _shared så BÅDE EF:n (Deno, L2) OCH api-pure-testet (Playwright/Node)
// kan importera den (runtime-gräns: src/ är Vite-sidan, onåbar från en Deno-EF —
// jfr segment-membership.ts ↔ src/domain).
//
// Pipeline (ordning bär räkningen — varje medlem landar i EXAKT en hink):
//   requested → [consent-gate D5] → [e-post-hygien D6: tom/ogiltig] → [dedup D6]
//   → attempted → [sortera kanoniskt + chunka ≤100 D2/D4] → batches.
// Invariant (ADR-067 D3): requested == suppressedConsent + suppressedNoEmail
//                                      + deduped + attempted.

/**
 * Segment-medlem ur compute-segment-resultatets `members` (ADR-067-indata).
 * Strukturellt identisk med compute-segment/index.ts:43-48:s lokala `SegmentMember`
 * — definieras + exporteras HÄR som den delade _shared-formen så att både L2:s EF
 * och detta test importerar EN form (compute-segment kan senare importera härifrån;
 * den unifieringen är ej L1-scope).
 */
export type SegmentMember = {
  id: string;
  namn: string | null;
  email: string | null;
  ejGodkandMail: boolean;
};

/**
 * Vad L2 behöver per mottagare: normaliserad e-post (Resend-request) + person-id
 * (Utskickslogg `Skickat till` → Personer-länk). INGEN Resend-SDK-form här —
 * L2 mappar SendSpec → Resend-batch-request.
 */
export type SendSpec = {
  personId: string;
  /** Normaliserad e-post (trim + lowercase) — dedup-nyckeln OCH send-adressen. */
  email: string;
};

/**
 * Räknar-objekt som ALDRIG kollapsar binärt (D3). `accepted`/`rejected` fylls i
 * L2 ur Resend-svaret — L1 producerar allt UTOM dem.
 */
export type BulkSendCounts = {
  /** Totalt antal inkomna medlemmar. */
  requested: number;
  /** Exkluderade av consent-gaten (ejGodkandMail === true). */
  suppressedConsent: number;
  /** Exkluderade p.g.a. saknad/ogiltig e-post (efter consent-gaten). */
  suppressedNoEmail: number;
  /** Kollapsade dubbletter på normaliserad e-post (behåller första). */
  deduped: number;
  /** Faktiska unika mottagare som ska skickas till. */
  attempted: number;
  /** Antal batchar (attempted chunkad ≤ RESEND_BATCH_MAX). */
  batchCount: number;
};

export type PreparedBulkSend = {
  batches: SendSpec[][];
  counts: BulkSendCounts;
};

/** Resend /emails/batch-tak (≤100 mail/anrop, ADR-067 D2). */
export const RESEND_BATCH_MAX = 100;

/**
 * Normaliserad e-post för dedup + giltighets-grind: trim + lowercase. Tomt
 * (whitespace-only) eller uppenbart ogiltigt (saknar '@') → null (exkluderas
 * + räknas som suppressedNoEmail). SPEGLAR EXAKT src/lib/segment-export.ts:40
 * `normalizeEmail` (SKOOL-exportens form, ADR-062) — samma e-post-hygien över
 * SKOOL-access-strömmen och 6h-mailströmmen. Speglad (ej delad import) p.g.a.
 * runtime-gränsen Deno(_shared) ↔ Vite(src); håll formerna i synk vid ändring.
 * Ingen tyngre validering än '@' — målet är uppenbart tomma/trasiga, ej RFC.
 */
function normalizeEmail(raw: string | null): string | null {
  if (raw === null) return null;
  const trimmed = raw.trim().toLowerCase();
  if (trimmed.length === 0) return null;
  if (!trimmed.includes('@')) return null;
  return trimmed;
}

/** Dela en lista i chunkar av högst `size` (bevarar ordning). */
function chunk<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

/**
 * Förbered ett bulk-mailutskick ur ett segments medlemmar (ADR-067 D2–D6). Ren
 * funktion: deterministisk, sidoeffektfri, inget I/O.
 *
 * Ordning (D5 före D6 — en consent-spärrad medlem räknas ALDRIG också som
 * e-post-lös; varje medlem hamnar i exakt en hink):
 *  1. Consent-gate (D5, GOLV/GDPR): ejGodkandMail === false → sändbar; === true
 *     → suppressedConsent (exkluderad + räknad, aldrig tyst).
 *  2. E-post-hygien (D6, GOLV): normalizeEmail; null → suppressedNoEmail.
 *  3. Dedup (D6, SKOOL b7-arv): kollapsa på normaliserad e-post, behåll första;
 *     antalet kollapsade → deduped.
 *  4. Determinism (D4 KRITISK): sortera mottagarna på normaliserad e-post så
 *     batch-payloaden är STABIL över retries (Resend hashar payloaden för
 *     idempotensen — instabil ordning bryter den).
 *  5. Chunka ≤ RESEND_BATCH_MAX (D2).
 */
export function prepareBulkSend(members: readonly SegmentMember[]): PreparedBulkSend {
  let suppressedConsent = 0;
  let suppressedNoEmail = 0;
  let deduped = 0;

  const seen = new Set<string>();
  const recipients: SendSpec[] = [];

  for (const member of members) {
    // 1) Consent-gate (D5).
    if (member.ejGodkandMail !== false) {
      suppressedConsent += 1;
      continue;
    }
    // 2) E-post-hygien (D6) — tom/ogiltig exkluderas + räknas.
    const email = normalizeEmail(member.email);
    if (email === null) {
      suppressedNoEmail += 1;
      continue;
    }
    // 3) Dedup (D6) — behåll första förekomsten.
    if (seen.has(email)) {
      deduped += 1;
      continue;
    }
    seen.add(email);
    recipients.push({ personId: member.id, email });
  }

  // 4) Kanonisk ordning (D4) — stabil batch-payload över retries.
  recipients.sort((a, b) => (a.email < b.email ? -1 : a.email > b.email ? 1 : 0));

  // 5) Chunka (D2).
  const batches = chunk(recipients, RESEND_BATCH_MAX);

  return {
    batches,
    counts: {
      requested: members.length,
      suppressedConsent,
      suppressedNoEmail,
      deduped,
      attempted: recipients.length,
      batchCount: batches.length,
    },
  };
}
