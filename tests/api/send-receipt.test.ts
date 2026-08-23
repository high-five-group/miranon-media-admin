// Kontraktstest för kvittots sändorkestrator (TASK-147.7, ADR-109).
//
// api-pure (ren logik, ingen staging, inga creds, NOLL riktig Resend/Airtable):
// alla FEM I/O-gränserna (ledger, buildPdf, sendEmail, finalizeReceipt,
// cleanupDraft [TASK-302.3]) injiceras som mockar → konformans-kärnan bevisas
// in-memory. Speglar send-action-email.test.ts-formen (TASK-147.1) för
// kvittots egen vertikal.
//
// TÄCKER: idempotensnyckelns DETERMINISM (samma jobId/registrationId/betalning
// → samma nyckel, ALLTID; olika indata → olika nyckel — receiptIdempotencyKey
// § "api-pure för nummerserien/idempotens" i uppdraget), icke-prod-spärren
// ÅTERANVÄND ur send-bulk (GOLV, aldrig kringgången — och FÖRE allokering: ett
// nummer ska aldrig förbrukas för ett mail som inte kan skickas i miljön),
// atomiciteten (finalizeReceipt anropas ENDAST vid accepterad sändning — en
// avvisad sändning lämnar INGEN finaliserad Kvitton-post), att ett verkligt
// NUMMER faktiskt allokeras och returneras vid lyckad sändning, och
// [TASK-302.3] att `cleanupDraft` anropas MED RÄTT eventId EFTER en lyckad
// sändning men ALDRIG vid en avvisad — och att ett KASTAT fel i `cleanupDraft`
// inte gör en redan lyckad sändning se ut som misslyckad (ADR-124 § Beslut 2).
//
// EJ HÄR (kräver deployad EF, samma "ingen deploy denna landning"-gräns som
// send-action-email.test.ts drar): HTTP auth/metod/input-validering, RIKTIG
// Airtable-/Resend-/pdf-lib-integration. Samtidighets-beviset för sjävla
// NUMRERINGEN bor i tests/api/receipt-numbering.test.ts (AC #2 huvudbeviset)
// — inte upprepat här.

import { expect, test } from '@playwright/test';
import type { ReceiptAllocationDeps } from '../../supabase/functions/_shared/receipt-numbering';
import {
  NonProdAddressError,
  UtskickSparratError,
} from '../../supabase/functions/_shared/send-bulk';
import {
  type ReceiptDraftCleaner,
  type ReceiptFinalizer,
  type ReceiptPdfBuilder,
  type ReceiptSender,
  type ReceiptSendInput,
  receiptIdempotencyKey,
  sendReceipt,
} from '../../supabase/functions/_shared/send-receipt';

const TEST_ADDR = 'delivered@resend.dev';
const NU = '2026-08-10T10:00:00.000Z';

function input(overrides: Partial<ReceiptSendInput> = {}): ReceiptSendInput {
  return {
    registrationId: 'recReg0000000001',
    eventId: 'recEvent000000001',
    betalning: 'avgift',
    belopp: 1250,
    betalsatt: 'Swish',
    kundnamn: 'Anna Andersson',
    email: TEST_ADDR,
    eventNamn: 'Utbildning Skövde',
    jobId: '11111111-1111-4111-8111-111111111111',
    isProd: false,
    utskickSparrat: false,
    nu: NU,
    ...overrides,
  };
}

function makeLedger(): ReceiptAllocationDeps {
  let rader: { id: string; lopnummer: number; ar: number }[] = [];
  let nasta = 0;
  return {
    async listByYear(ar) {
      return rader.filter((r) => r.ar === ar).map((r) => ({ ...r }));
    },
    async create(ar, lopnummer) {
      nasta += 1;
      const id = `rec${String(nasta).padStart(8, '0')}`;
      rader.push({ id, ar, lopnummer });
      return { id };
    },
    async remove(id) {
      rader = rader.filter((r) => r.id !== id);
    },
  };
}

function makeBuildPdf(calls: unknown[] = []): ReceiptPdfBuilder {
  return async (spec) => {
    calls.push(spec);
    return { filename: `${spec.kvittonummer}.pdf`, contentBase64: 'YQ==' };
  };
}

function makeSender(
  outcome: { accepted: boolean; reason?: string },
  calls: unknown[] = [],
): ReceiptSender {
  return async (spec, ctx) => {
    calls.push({ spec, ctx });
    return outcome;
  };
}

function makeFinalizer(calls: unknown[] = []): ReceiptFinalizer {
  return async (id, fields) => {
    calls.push({ id, fields });
  };
}

/**
 * [TASK-302.3] Städaren — no-op i standardfallet (`calls` bara loggar
 * anropen). `rejectWith` låter ett test bevisa att `sendReceipt` FÅNGAR ett
 * kastat cleanupDraft-fel i stället för att låta det propagera (docblockets
 * steg 7 i `_shared/send-receipt.ts`).
 */
function makeCleanupDraft(calls: string[] = [], rejectWith?: Error): ReceiptDraftCleaner {
  return async (eventId: string) => {
    calls.push(eventId);
    if (rejectWith) throw rejectWith;
  };
}

test.describe('receiptIdempotencyKey — determinism (AC #2 "idempotens")', () => {
  test('samma jobId/registrationId/betalning → EXAKT samma nyckel', () => {
    const a = receiptIdempotencyKey('job-1', 'recABC', 'avgift');
    const b = receiptIdempotencyKey('job-1', 'recABC', 'avgift');
    expect(a).toBe(b);
    expect(a).toBe('job-1/kvitto/recABC/avgift');
  });

  test('olika registrationId → olika nyckel', () => {
    const a = receiptIdempotencyKey('job-1', 'recABC', 'avgift');
    const b = receiptIdempotencyKey('job-1', 'recXYZ', 'avgift');
    expect(a).not.toBe(b);
  });

  test('olika betalning (samma person) → olika nyckel — avgift och slutbetalning kvitteras oberoende', () => {
    const a = receiptIdempotencyKey('job-1', 'recABC', 'avgift');
    const b = receiptIdempotencyKey('job-1', 'recABC', 'slut');
    expect(a).not.toBe(b);
  });

  test('namnrymden är SKILD från åtgärdsutskickens (<jobId>/<actionType>/<registrationId>) och testmailets (<jobId>/test)', () => {
    const key = receiptIdempotencyKey('job-1', 'recABC', 'avgift');
    expect(key).not.toBe('job-1/bekraftelse/recABC');
    expect(key).not.toBe('job-1/test');
  });
});

test.describe('sendReceipt — lyckad sändning', () => {
  test('allokerar ett verkligt nummer, bygger PDF, sänder EN gång, finaliserar', async () => {
    const ledger = makeLedger();
    const pdfCalls: unknown[] = [];
    const sendCalls: unknown[] = [];
    const finalizeCalls: unknown[] = [];

    const cleanupCalls: string[] = [];

    const result = await sendReceipt(input(), {
      ledger,
      buildPdf: makeBuildPdf(pdfCalls),
      sendEmail: makeSender({ accepted: true }, sendCalls),
      finalizeReceipt: makeFinalizer(finalizeCalls),
      cleanupDraft: makeCleanupDraft(cleanupCalls),
    });

    expect(result).toEqual({
      status: 'sent',
      kvittonummer: 'MM-2026-1001',
      lopnummer: 1001,
      ar: 2026,
      receiptId: expect.any(String),
    });

    expect(pdfCalls).toHaveLength(1);
    expect(sendCalls).toHaveLength(1);
    expect(finalizeCalls).toHaveLength(1);
    // [TASK-302.3] cleanupDraft anropas EN gång, med EXAKT input.eventId.
    expect(cleanupCalls).toEqual(['recEvent000000001']);

    // Idempotensnyckeln som faktiskt gick till sändaren — EXAKT den deterministiska formen.
    const sentCtx = (sendCalls[0] as { ctx: { idempotencyKey: string } }).ctx;
    expect(sentCtx.idempotencyKey).toBe(
      receiptIdempotencyKey('11111111-1111-4111-8111-111111111111', 'recReg0000000001', 'avgift'),
    );

    // Finaliseringen skriver den ALLOKERADE radens id, med rätt betalnings-etikett.
    const finalized = finalizeCalls[0] as { id: string; fields: Record<string, unknown> };
    expect(finalized.id).toBe(result.status === 'sent' ? result.receiptId : '');
    expect(finalized.fields.registrationId).toBe('recReg0000000001');
    expect(finalized.fields.betalning).toBe('avgift');
    expect(finalized.fields.belopp).toBe(1250);
    expect(finalized.fields.betalsatt).toBe('Swish');
  });

  test('året härleds ur input.nu, INTE systemklockan', async () => {
    const ledger = makeLedger();
    const result = await sendReceipt(input({ nu: '2027-01-01T00:00:00.000Z' }), {
      ledger,
      buildPdf: makeBuildPdf(),
      sendEmail: makeSender({ accepted: true }),
      finalizeReceipt: makeFinalizer(),
      cleanupDraft: makeCleanupDraft(),
    });
    expect(result.status).toBe('sent');
    if (result.status === 'sent') {
      expect(result.ar).toBe(2027);
      expect(result.kvittonummer).toBe('MM-2027-1001');
    }
  });
});

test.describe('sendReceipt — avvisad sändning (atomicitet)', () => {
  test('avvisat mail → status "failed", finalizeReceipt anropas ALDRIG', async () => {
    const ledger = makeLedger();
    const finalizeCalls: unknown[] = [];
    const cleanupCalls: string[] = [];

    const result = await sendReceipt(input(), {
      ledger,
      buildPdf: makeBuildPdf(),
      sendEmail: makeSender({ accepted: false, reason: 'Bounced' }),
      finalizeReceipt: makeFinalizer(finalizeCalls),
      cleanupDraft: makeCleanupDraft(cleanupCalls),
    });

    expect(result).toEqual({ status: 'failed', reason: 'Bounced' });
    expect(finalizeCalls).toHaveLength(0);
    // [TASK-302.3] En avvisad sändning rör ALDRIG utkastet — det ska finnas
    // kvar om Lotta försöker igen (ADR-124 § Beslut 2).
    expect(cleanupCalls).toHaveLength(0);
  });

  test('avvisat mail lämnar en OFINALISERAD reservationsrad i ledgern — numret återanvänds ALDRIG av nästa allokering', async () => {
    const ledger = makeLedger();
    await sendReceipt(input(), {
      ledger,
      buildPdf: makeBuildPdf(),
      sendEmail: makeSender({ accepted: false, reason: 'Bounced' }),
      finalizeReceipt: makeFinalizer(),
      cleanupDraft: makeCleanupDraft(),
    });

    // Nästa, NYA sändning (t.ex. Lotta försöker igen) allokerar nästa lediga
    // nummer — 1002, INTE 1001 igen (ingen retroaktiv omnumrering/återbruk).
    const nasta = await sendReceipt(input(), {
      ledger,
      buildPdf: makeBuildPdf(),
      sendEmail: makeSender({ accepted: true }),
      finalizeReceipt: makeFinalizer(),
      cleanupDraft: makeCleanupDraft(),
    });
    expect(nasta.status).toBe('sent');
    if (nasta.status === 'sent') {
      expect(nasta.lopnummer).toBe(1002);
    }
  });
});

test.describe('sendReceipt — icke-prod-spärren (GOLV, återanvänd ur send-bulk.ts)', () => {
  test('icke-test-adress i icke-prod → NonProdAddressError, INGEN allokering görs (numret förbrukas aldrig förgäves)', async () => {
    const ledger = makeLedger();
    const pdfCalls: unknown[] = [];

    await expect(
      sendReceipt(input({ email: 'roger@miranonmedia.se', isProd: false }), {
        ledger,
        buildPdf: makeBuildPdf(pdfCalls),
        sendEmail: makeSender({ accepted: true }),
        finalizeReceipt: makeFinalizer(),
        cleanupDraft: makeCleanupDraft(),
      }),
    ).rejects.toBeInstanceOf(NonProdAddressError);

    // Spärren körde FÖRE allokeringen — inget nummer förbrukat, ingen PDF byggd.
    expect(pdfCalls).toHaveLength(0);
    expect(await ledger.listByYear(2026)).toHaveLength(0);
  });

  test('prod (isProd: true) tillåter en icke-test-adress', async () => {
    const ledger = makeLedger();
    const result = await sendReceipt(input({ email: 'roger@miranonmedia.se', isProd: true }), {
      ledger,
      buildPdf: makeBuildPdf(),
      sendEmail: makeSender({ accepted: true }),
      finalizeReceipt: makeFinalizer(),
      cleanupDraft: makeCleanupDraft(),
    });
    expect(result.status).toBe('sent');
  });
});

test.describe('sendReceipt — utskicks-spärren (TASK-274, Marcus beslut B, central kill-switch)', () => {
  test('utskickSparrat: true → VÄGRAR, INGEN allokering görs, oavsett miljö (prod)', async () => {
    const ledger = makeLedger();
    const pdfCalls: unknown[] = [];

    await expect(
      sendReceipt(input({ utskickSparrat: true, isProd: true }), {
        ledger,
        buildPdf: makeBuildPdf(pdfCalls),
        sendEmail: makeSender({ accepted: true }),
        finalizeReceipt: makeFinalizer(),
        cleanupDraft: makeCleanupDraft(),
      }),
    ).rejects.toBeInstanceOf(UtskickSparratError);

    // Spärren körde FÖRE ALLT — även före allokeringen (samma golv som icke-prod-spärren).
    expect(pdfCalls).toHaveLength(0);
    expect(await ledger.listByYear(2026)).toHaveLength(0);
  });

  test('utskickSparrat: false (default) → INGEN vägran, dagens beteende oförändrat', async () => {
    const ledger = makeLedger();
    const result = await sendReceipt(input(), {
      ledger,
      buildPdf: makeBuildPdf(),
      sendEmail: makeSender({ accepted: true }),
      finalizeReceipt: makeFinalizer(),
      cleanupDraft: makeCleanupDraft(),
    });
    expect(result.status).toBe('sent');
  });
});

test.describe('sendReceipt — cleanupDraft (TASK-302.3, ADR-124 § Beslut 2)', () => {
  test('kastat fel i cleanupDraft fäller INTE en redan lyckad sändning', async () => {
    const ledger = makeLedger();
    const cleanupCalls: string[] = [];

    const result = await sendReceipt(input(), {
      ledger,
      buildPdf: makeBuildPdf(),
      sendEmail: makeSender({ accepted: true }),
      finalizeReceipt: makeFinalizer(),
      cleanupDraft: makeCleanupDraft(cleanupCalls, new Error('Storage nere')),
    });

    // sendReceipt FÅNGADE felet (docblockets steg 7) — resultatet är
    // fortfarande 'sent', inte ett kastat undantag.
    expect(result.status).toBe('sent');
    expect(cleanupCalls).toEqual(['recEvent000000001']);
  });
});
