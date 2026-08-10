// Kontraktstest för kvittots sändorkestrator (TASK-147.7, ADR-109).
//
// api-pure (ren logik, ingen staging, inga creds, NOLL riktig Resend/Airtable):
// alla FYRA I/O-gränserna (ledger, buildPdf, sendEmail, finalizeReceipt)
// injiceras som mockar → konformans-kärnan bevisas in-memory. Speglar
// send-action-email.test.ts-formen (TASK-147.1) för kvittots egen vertikal.
//
// TÄCKER: idempotensnyckelns DETERMINISM (samma jobId/registrationId/betalning
// → samma nyckel, ALLTID; olika indata → olika nyckel — receiptIdempotencyKey
// § "api-pure för nummerserien/idempotens" i uppdraget), icke-prod-spärren
// ÅTERANVÄND ur send-bulk (GOLV, aldrig kringgången — och FÖRE allokering: ett
// nummer ska aldrig förbrukas för ett mail som inte kan skickas i miljön),
// atomiciteten (finalizeReceipt anropas ENDAST vid accepterad sändning — en
// avvisad sändning lämnar INGEN finaliserad Kvitton-post), och att ett
// verkligt NUMMER faktiskt allokeras och returneras vid lyckad sändning.
//
// EJ HÄR (kräver deployad EF, samma "ingen deploy denna landning"-gräns som
// send-action-email.test.ts drar): HTTP auth/metod/input-validering, RIKTIG
// Airtable-/Resend-/pdf-lib-integration. Samtidighets-beviset för sjävla
// NUMRERINGEN bor i tests/api/receipt-numbering.test.ts (AC #2 huvudbeviset)
// — inte upprepat här.

import { expect, test } from '@playwright/test';
import type { ReceiptAllocationDeps } from '../../supabase/functions/_shared/receipt-numbering';
import { NonProdAddressError } from '../../supabase/functions/_shared/send-bulk';
import {
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

    const result = await sendReceipt(input(), {
      ledger,
      buildPdf: makeBuildPdf(pdfCalls),
      sendEmail: makeSender({ accepted: true }, sendCalls),
      finalizeReceipt: makeFinalizer(finalizeCalls),
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

    const result = await sendReceipt(input(), {
      ledger,
      buildPdf: makeBuildPdf(),
      sendEmail: makeSender({ accepted: false, reason: 'Bounced' }),
      finalizeReceipt: makeFinalizer(finalizeCalls),
    });

    expect(result).toEqual({ status: 'failed', reason: 'Bounced' });
    expect(finalizeCalls).toHaveLength(0);
  });

  test('avvisat mail lämnar en OFINALISERAD reservationsrad i ledgern — numret återanvänds ALDRIG av nästa allokering', async () => {
    const ledger = makeLedger();
    await sendReceipt(input(), {
      ledger,
      buildPdf: makeBuildPdf(),
      sendEmail: makeSender({ accepted: false, reason: 'Bounced' }),
      finalizeReceipt: makeFinalizer(),
    });

    // Nästa, NYA sändning (t.ex. Lotta försöker igen) allokerar nästa lediga
    // nummer — 1002, INTE 1001 igen (ingen retroaktiv omnumrering/återbruk).
    const nasta = await sendReceipt(input(), {
      ledger,
      buildPdf: makeBuildPdf(),
      sendEmail: makeSender({ accepted: true }),
      finalizeReceipt: makeFinalizer(),
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
    });
    expect(result.status).toBe('sent');
  });
});
