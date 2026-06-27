// Kontraktstest för bulk-send-orkestratorn (Fas 6h L2b, ADR-067 D3/D5/D7/D8).
//
// api-pure (ren logik, ingen staging, inga creds, NOLL riktig Resend/Airtable): båda
// I/O-gränserna (BatchSender, LogWriter) injiceras som mockar → konformans-kärnan bevisas
// in-memory. Täcker: lastbärande icke-prod-spärr (vägran + env-gating), partial-failure-
// status (aldrig binär), räknar-pass-through från prepareBulkSend, deterministisk batch-
// idempotens-nyckel (<jobId>/b<index>), multipart-render (html+text), samt allowlist
// deny/allow (SSOT). Asserterar mot ADR-067:s definitioner, ej fixturens form (L193).
//
// EJ här (kräver deployad EF — L2c, "deploy + test-adress-integration"): HTTP auth 401 /
// metod 405 / Idempotency-Key-UUID-400 / RIKTIG Utskickslogg-merge mot staging /
// idempotens-rerun-samma-rad. api-staging-modellen är HTTP-mot-deployad; send-email
// deployas i L2c (denna landnings uppgiftsgräns: ingen deploy).

import { expect, test } from '@playwright/test';
import {
  findDisallowedField,
  getOperation,
} from '../../supabase/functions/_shared/field-allowlists';
import type { SegmentMember } from '../../supabase/functions/_shared/prepare-bulk-send';
import {
  type BatchOutcome,
  type BatchSender,
  type LogWriter,
  NonProdAddressError,
  RESEND_TEST_ADDRESSES,
  type RunBulkSendInput,
  renderHtml,
  runBulkSend,
} from '../../supabase/functions/_shared/send-bulk';

const JOB_ID = '11111111-1111-4111-8111-111111111111';
const TEST_ADDR = 'delivered@resend.dev';

function member(id: string, email: string | null, ejGodkandMail = false): SegmentMember {
  return { id, namn: null, email, ejGodkandMail };
}

// Mock-sender: registrerar varje anrop (batch + ctx) och accepterar alla — om inte en
// rejectSet ges (då hamnar de e-posterna i rejected). NOLL riktig Resend.
function mockSender(rejectSet: Set<string> = new Set()): BatchSender & {
  calls: {
    emails: string[];
    idempotencyKey: string;
    html: string;
    text: string;
    subject: string;
  }[];
} {
  const calls: {
    emails: string[];
    idempotencyKey: string;
    html: string;
    text: string;
    subject: string;
  }[] = [];
  const sender = async (
    batch: Parameters<BatchSender>[0],
    ctx: Parameters<BatchSender>[1],
  ): Promise<BatchOutcome> => {
    calls.push({
      emails: batch.map((s) => s.email),
      idempotencyKey: ctx.idempotencyKey,
      html: ctx.html,
      text: ctx.text,
      subject: ctx.subject,
    });
    const accepted: { email: string }[] = [];
    const rejected: { email: string; reason: string }[] = [];
    for (const spec of batch) {
      if (rejectSet.has(spec.email)) rejected.push({ email: spec.email, reason: 'mock-reject' });
      else accepted.push({ email: spec.email });
    }
    return { accepted, rejected };
  };
  return Object.assign(sender, { calls });
}

// Mock-logg-writer: registrerar entries, returnerar deterministiskt id. NOLL riktig Airtable.
function mockLogWriter(): LogWriter & { entries: Parameters<LogWriter>[0][] } {
  const entries: Parameters<LogWriter>[0][] = [];
  const writer = async (entry: Parameters<LogWriter>[0]): Promise<string> => {
    entries.push(entry);
    return 'recMOCKLOG000000001';
  };
  return Object.assign(writer, { entries });
}

function baseInput(members: SegmentMember[], isProd: boolean): RunBulkSendInput {
  return {
    members,
    amne: 'Hej',
    mailtext: 'Rad1\nRad2',
    jobId: JOB_ID,
    isProd,
    filterSnapshot: 'seg',
  };
}

test.describe('runBulkSend — icke-prod-spärr (D5/GOLV, lastbärande)', () => {
  test('icke-prod + riktig adress → VÄGRAR hela sändningen (noll sänt, ingen logg)', async () => {
    const sender = mockSender();
    const log = mockLogWriter();
    const members = [member('p1', 'riktig@kund.se'), member('p2', TEST_ADDR)];

    await expect(
      runBulkSend(baseInput(members, false), { batchSender: sender, writeLog: log }),
    ).rejects.toThrow(NonProdAddressError);

    expect(sender.calls, 'noll Resend-anrop vid vägran').toHaveLength(0);
    expect(log.entries, 'ingen Utskickslogg-rad vid vägran').toHaveLength(0);
  });

  test('icke-prod + endast test-adresser → SLÄPPER IGENOM', async () => {
    const sender = mockSender();
    const log = mockLogWriter();
    const res = await runBulkSend(baseInput([member('p1', TEST_ADDR)], false), {
      batchSender: sender,
      writeLog: log,
    });
    expect(res.status).toBe('sent');
    expect(sender.calls).toHaveLength(1);
  });

  test('prod + riktig adress → INGEN vägran (spärren är env-gated)', async () => {
    const sender = mockSender();
    const log = mockLogWriter();
    const res = await runBulkSend(baseInput([member('p1', 'riktig@kund.se')], true), {
      batchSender: sender,
      writeLog: log,
    });
    expect(res.status).toBe('sent');
    expect(res.accepted).toBe(1);
  });
});

test.describe('runBulkSend — partial-failure-status (D3, aldrig binär)', () => {
  test('alla accepterade → sent', async () => {
    const res = await runBulkSend(
      baseInput([member('p1', TEST_ADDR), member('p2', 'bounced@resend.dev')], false),
      { batchSender: mockSender(), writeLog: mockLogWriter() },
    );
    expect(res.status).toBe('sent');
    expect(res.accepted).toBe(2);
    expect(res.rejected).toBe(0);
  });

  test('en avvisad → partial (rejections bärs)', async () => {
    const res = await runBulkSend(
      baseInput([member('p1', TEST_ADDR), member('p2', 'bounced@resend.dev')], false),
      { batchSender: mockSender(new Set(['bounced@resend.dev'])), writeLog: mockLogWriter() },
    );
    expect(res.status).toBe('partial');
    expect(res.accepted).toBe(1);
    expect(res.rejected).toBe(1);
    expect(res.rejections).toEqual([{ email: 'bounced@resend.dev', reason: 'mock-reject' }]);
  });

  test('alla avvisade (attempted>0, accepted=0) → failed', async () => {
    const res = await runBulkSend(baseInput([member('p1', TEST_ADDR)], false), {
      batchSender: mockSender(new Set([TEST_ADDR])),
      writeLog: mockLogWriter(),
    });
    expect(res.status).toBe('failed');
    expect(res.accepted).toBe(0);
    expect(res.rejected).toBe(1);
  });
});

test.describe('runBulkSend — räknar-pass-through + logg (D3/D7)', () => {
  test('counts speglar prepareBulkSend; logg får accepterade person-ID', async () => {
    const log = mockLogWriter();
    const members = [
      member('p1', TEST_ADDR), // attempted + accepted
      member('p2', TEST_ADDR), // deduped (samma e-post)
      member('p3', 'spärr@kund.se', true), // suppressedConsent (consent → räknas ej no-email)
      member('p4', null), // suppressedNoEmail
      member('p5', 'bounced@resend.dev'), // attempted + accepted
    ];
    const res = await runBulkSend(baseInput(members, false), {
      batchSender: mockSender(),
      writeLog: log,
    });
    expect(res.requested).toBe(5);
    expect(res.suppressedConsent).toBe(1);
    expect(res.suppressedNoEmail).toBe(1);
    expect(res.deduped).toBe(1);
    expect(res.attempted).toBe(2);
    // Invariant (ADR-067 D3).
    expect(res.suppressedConsent + res.suppressedNoEmail + res.deduped + res.attempted).toBe(
      res.requested,
    );
    expect(res.logRecordId).toBe('recMOCKLOG000000001');
    expect(log.entries).toHaveLength(1);
    expect(log.entries[0].acceptedPersonIds.sort()).toEqual(['p1', 'p5']);
    expect(log.entries[0].jobId).toBe(JOB_ID);
  });

  test('tom/allt-suppressad input → attempted 0, sent, noll sänt, logg ändå skriven (audit)', async () => {
    const sender = mockSender();
    const log = mockLogWriter();
    const res = await runBulkSend(baseInput([member('p1', null, true)], false), {
      batchSender: sender,
      writeLog: log,
    });
    expect(res.attempted).toBe(0);
    expect(res.status).toBe('sent');
    expect(sender.calls).toHaveLength(0);
    expect(log.entries).toHaveLength(1);
    expect(log.entries[0].acceptedPersonIds).toEqual([]);
  });
});

test.describe('runBulkSend — batch-idempotens-nyckel + multipart (D4/D8)', () => {
  test('idempotencyKey = <jobId>/b<index> per batch (101 → b0,b1)', async () => {
    const sender = mockSender();
    const members = Array.from({ length: 101 }, (_, i) =>
      member(`p${i}`, `u${String(i).padStart(4, '0')}@resend.dev`),
    );
    // OBS: dessa är *@resend.dev men EJ de fyra test-adresserna → icke-prod-spärren skulle
    // vägra. Kör i prod-läge för att isolera batch-nyckel-beteendet.
    await runBulkSend(baseInput(members, true), { batchSender: sender, writeLog: mockLogWriter() });
    expect(sender.calls).toHaveLength(2);
    expect(sender.calls[0].idempotencyKey).toBe(`${JOB_ID}/b0`);
    expect(sender.calls[1].idempotencyKey).toBe(`${JOB_ID}/b1`);
    expect(sender.calls[0].emails).toHaveLength(100);
    expect(sender.calls[1].emails).toHaveLength(1);
  });

  test('multipart: sender får BÅDE html (escaped, <br>) och text (D8)', async () => {
    const sender = mockSender();
    await runBulkSend(
      { ...baseInput([member('p1', TEST_ADDR)], false), mailtext: 'A<b>\nB' },
      { batchSender: sender, writeLog: mockLogWriter() },
    );
    expect(sender.calls[0].text).toBe('A<b>\nB');
    expect(sender.calls[0].html).toBe('<p>A&lt;b&gt;<br>B</p>');
    expect(sender.calls[0].subject).toBe('Hej');
  });

  test('renderHtml escapar XSS + radbryter', () => {
    expect(renderHtml('<script>x</script>')).toBe('<p>&lt;script&gt;x&lt;/script&gt;</p>');
  });
});

test.describe('send-email allowlist (SSOT, defense-in-depth)', () => {
  test('ALLOW: de 6 allowlistade fälten passerar', () => {
    const op = getOperation('send-email');
    expect(op).not.toBeNull();
    if (!op) return;
    expect(op.tableId).toBe('Utskickslogg');
    const fields = {
      'Namn på utskick': 'x',
      'Skickat till': ['recA'],
      'Filter snapshot': 'seg',
      'Mailutskick copy': 'x',
      'Utskicks-ID': ['recB'],
      Idempotensnyckel: JOB_ID,
    };
    expect(findDisallowedField(op, fields)).toBeNull();
  });

  test('DENY: formel-fält (Antal skickade) utanför allowlist fälls', () => {
    const op = getOperation('send-email');
    if (!op) throw new Error('operation saknas');
    expect(findDisallowedField(op, { 'Antal skickade': 5 })).toBe('Antal skickade');
  });

  test('RESEND_TEST_ADDRESSES = auktoritativa fyra', () => {
    expect([...RESEND_TEST_ADDRESSES].sort()).toEqual([
      'bounced@resend.dev',
      'complained@resend.dev',
      'delivered@resend.dev',
      'suppressed@resend.dev',
    ]);
  });
});
