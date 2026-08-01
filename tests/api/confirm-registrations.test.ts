// Kontraktstest för bekräftelse-orkestratorn (task-18.6; PRD task-18 beslut 7).
//
// api-pure (ren logik, ingen staging, inga creds, NOLL riktig Resend/Airtable): båda
// I/O-gränserna (ConfirmationSender, StatusFlipper) injiceras som mockar → konformans-
// kärnan bevisas in-memory. Speglar send-bulk.test.ts-formen (Fas 6h L2b) för repots
// andra mail-vertikal.
//
// Täcker kontraktet: ATOMICITETEN (status-flippen sker ENDAST för den vars mail
// accepterades — ett avvisat mail lämnar anmälan orörd), icke-prod-spärren
// ÅTERANVÄND ur send-bulk (GOLV — aldrig kringgången, aldrig kopierad), idempotensen
// (redan bekräftad hoppas över utan mail), e-post-lös anmälan hoppas över,
// aldrig-binär status (sent/partial/failed/skipped) samt allowlist-SSOT (deny/allow).
//
// EJ här (kräver deployad EF): HTTP auth 401 / metod 405 / input-400 / RIKTIG
// Airtable-flip mot staging — det är tests/api/send-registration-confirmation.staging.test.ts.

import { expect, test } from '@playwright/test';
import {
  type ConfirmationSender,
  type ConfirmRegistrationsInput,
  type ConfirmTarget,
  confirmRegistrations,
  parseConfirmOutcome,
  renderConfirmationMail,
  type StatusFlipper,
} from '../../supabase/functions/_shared/confirm-registrations';
import {
  findDisallowedField,
  getOperation,
} from '../../supabase/functions/_shared/field-allowlists';
import { NonProdAddressError } from '../../supabase/functions/_shared/send-bulk';

const TEST_ADDR = 'delivered@resend.dev';
const TEST_ADDR_2 = 'bounced@resend.dev';
const NU = '2026-07-22T10:00:00.000Z';

function target(overrides: Partial<ConfirmTarget> & { id: string }): ConfirmTarget {
  return {
    email: TEST_ADDR,
    namn: 'Anna Ek',
    status: 'Obekräftad',
    eventNamn: 'Resor i medvetandet 1',
    ...overrides,
  };
}

/** Mock-sender: registrerar varje anrop och accepterar alla utom rejectSet. NOLL riktig Resend. */
function mockSender(rejectSet: Set<string> = new Set()): ConfirmationSender & {
  calls: { registrationIds: string[]; emails: string[]; idempotencyKey: string }[];
} {
  const calls: { registrationIds: string[]; emails: string[]; idempotencyKey: string }[] = [];
  const sender = async (
    specs: Parameters<ConfirmationSender>[0],
    ctx: Parameters<ConfirmationSender>[1],
  ) => {
    calls.push({
      registrationIds: specs.map((s) => s.registrationId),
      emails: specs.map((s) => s.email),
      idempotencyKey: ctx.idempotencyKey,
    });
    return {
      accepted: specs
        .filter((s) => !rejectSet.has(s.email))
        .map((s) => ({ registrationId: s.registrationId })),
      rejected: specs
        .filter((s) => rejectSet.has(s.email))
        .map((s) => ({ registrationId: s.registrationId, reason: 'mock-reject' })),
    };
  };
  return Object.assign(sender, { calls });
}

/** Mock-flipper: registrerar varje flip. NOLL riktig Airtable. */
function mockFlipper(failFor: Set<string> = new Set()): StatusFlipper & {
  flips: { registrationId: string; tidpunkt: string }[];
} {
  const flips: { registrationId: string; tidpunkt: string }[] = [];
  const flipper = async (registrationId: string, tidpunkt: string) => {
    if (failFor.has(registrationId)) throw new Error('mock-airtable-fel');
    flips.push({ registrationId, tidpunkt });
  };
  return Object.assign(flipper, { flips });
}

function input(overrides: Partial<ConfirmRegistrationsInput> = {}): ConfirmRegistrationsInput {
  return {
    targets: [target({ id: 'rec1' })],
    jobId: '11111111-1111-4111-8111-111111111111',
    isProd: false,
    nu: NU,
    ...overrides,
  };
}

test.describe('confirmRegistrations — bekräftelse-orkestratorn (task-18.6)', () => {
  test('lyckad väg: mail skickas OCH status flippas i samma operation', async () => {
    const sender = mockSender();
    const flipper = mockFlipper();

    const result = await confirmRegistrations(input(), {
      sender,
      flipStatus: flipper,
    });

    expect(result.status).toBe('sent');
    expect(result.requested).toBe(1);
    expect(result.attempted).toBe(1);
    expect(result.confirmed).toEqual(['rec1']);
    expect(result.bekraftelseSkickad).toBe(NU);
    // Mailet gick före flippen — och båda skedde för samma anmälan.
    expect(sender.calls).toHaveLength(1);
    expect(sender.calls[0].emails).toEqual([TEST_ADDR]);
    expect(flipper.flips).toEqual([{ registrationId: 'rec1', tidpunkt: NU }]);
  });

  test('ATOMICITET: avvisat mail ⇒ INGEN status-flip för den anmälan', async () => {
    const sender = mockSender(new Set([TEST_ADDR_2]));
    const flipper = mockFlipper();

    const result = await confirmRegistrations(
      input({
        targets: [
          target({ id: 'recOk', email: TEST_ADDR }),
          target({ id: 'recFel', email: TEST_ADDR_2, namn: 'Bertil Sund' }),
        ],
      }),
      { sender, flipStatus: flipper },
    );

    expect(result.status).toBe('partial');
    expect(result.confirmed).toEqual(['recOk']);
    expect(result.failed).toEqual([{ registrationId: 'recFel', reason: 'mock-reject' }]);
    // Den avvisade raden fick ALDRIG en flip — annars vore basen en osanning.
    expect(flipper.flips.map((f) => f.registrationId)).toEqual(['recOk']);
  });

  test('ICKE-PROD-SPÄRREN (GOLV, återanvänd ur send-bulk): icke-test-adress ⇒ NOLL skickat', async () => {
    const sender = mockSender();
    const flipper = mockFlipper();

    await expect(
      confirmRegistrations(
        input({
          targets: [
            target({ id: 'rec1', email: TEST_ADDR }),
            target({ id: 'rec2', email: 'lotta@example.com' }),
          ],
        }),
        { sender, flipStatus: flipper },
      ),
    ).rejects.toThrow(NonProdAddressError);

    // Vägran är TOTAL: varken mail eller flip skedde för NÅGON rad.
    expect(sender.calls).toHaveLength(0);
    expect(flipper.flips).toHaveLength(0);
  });

  test('prod-läge: spärren gäller inte (riktiga adresser tillåts)', async () => {
    const sender = mockSender();
    const flipper = mockFlipper();

    const result = await confirmRegistrations(
      input({
        isProd: true,
        targets: [target({ id: 'rec1', email: 'lotta@example.com' })],
      }),
      { sender, flipStatus: flipper },
    );

    expect(result.status).toBe('sent');
    expect(sender.calls[0].emails).toEqual(['lotta@example.com']);
  });

  test('IDEMPOTENS: redan bekräftad hoppas över — inget mail, ingen flip', async () => {
    const sender = mockSender();
    const flipper = mockFlipper();

    const result = await confirmRegistrations(
      input({
        targets: [
          target({ id: 'recNy' }),
          target({ id: 'recRedan', status: 'Bekräftad (mail skickat)' }),
        ],
      }),
      { sender, flipStatus: flipper },
    );

    expect(result.confirmed).toEqual(['recNy']);
    expect(result.skipped).toEqual([{ registrationId: 'recRedan', reason: 'already_confirmed' }]);
    expect(sender.calls[0].registrationIds).toEqual(['recNy']);
    expect(flipper.flips.map((f) => f.registrationId)).toEqual(['recNy']);
  });

  test('avbokad anmälan hoppas över (aldrig Lottas arbete)', async () => {
    const sender = mockSender();
    const flipper = mockFlipper();

    const result = await confirmRegistrations(
      input({
        targets: [target({ id: 'recAvbokad', status: 'Avbokad/Ombokad' })],
      }),
      { sender, flipStatus: flipper },
    );

    expect(result.status).toBe('skipped');
    expect(result.attempted).toBe(0);
    expect(result.skipped).toEqual([{ registrationId: 'recAvbokad', reason: 'inactive' }]);
    expect(sender.calls).toHaveLength(0);
  });

  test('e-post-lös anmälan hoppas över — aldrig ett mail i tomma luften', async () => {
    const sender = mockSender();
    const flipper = mockFlipper();

    const result = await confirmRegistrations(
      input({ targets: [target({ id: 'recUtanMail', email: null })] }),
      { sender, flipStatus: flipper },
    );

    expect(result.status).toBe('skipped');
    expect(result.skipped).toEqual([{ registrationId: 'recUtanMail', reason: 'no_email' }]);
    expect(sender.calls).toHaveLength(0);
    expect(flipper.flips).toHaveLength(0);
  });

  test('flip-fel efter accepterat mail rapporteras som failed (aldrig tyst)', async () => {
    const sender = mockSender();
    const flipper = mockFlipper(new Set(['rec1']));

    const result = await confirmRegistrations(input(), { sender, flipStatus: flipper });

    expect(result.status).toBe('failed');
    expect(result.confirmed).toEqual([]);
    expect(result.failed[0].registrationId).toBe('rec1');
    expect(result.failed[0].reason).toContain('mock-airtable-fel');
  });

  test('deterministisk idempotens-nyckel härledd ur jobId', async () => {
    const sender = mockSender();
    const flipper = mockFlipper();
    await confirmRegistrations(input({ jobId: 'abc' }), { sender, flipStatus: flipper });
    expect(sender.calls[0].idempotencyKey).toBe('abc/bekraftelse');
  });

  test('mail-renderingen: ämne bär eventet, texten bär namnet, html är multipart-syskonet', () => {
    const mail = renderConfirmationMail({ namn: 'Anna Ek', eventNamn: 'RIM 1' });
    expect(mail.subject).toContain('RIM 1');
    expect(mail.text).toContain('Anna Ek');
    expect(mail.html).toContain('Anna Ek');
    // HTML-escape: ett namn med < > får aldrig läcka som markup.
    const farligt = renderConfirmationMail({ namn: '<script>x</script>', eventNamn: null });
    expect(farligt.html).not.toContain('<script>');
  });

  test('svars-parsningen är RAD-EXAKT via index — två anmälningar med SAMMA e-post skiljs åt (TASK-111 AC2-bevis, repots andra mail-vertikal)', () => {
    const specs = [
      { registrationId: 'recHuvud', email: TEST_ADDR, subject: 's', html: 'h', text: 't' },
      { registrationId: 'recPlusEtt', email: TEST_ADDR, subject: 's', html: 'h', text: 't' },
    ];
    // AVVIKANDE FALLET (≥1 ogiltig index) — normalfallet (rad 268 nedan) bevisar ingen
    // semantik-skillnad (STEG-0-fällan, se resend-batch.ts-headern). Resend permissive:
    // errors[].index är NOLLBASERAT mot originalpayloaden.
    const outcome = parseConfirmOutcome(specs, {
      data: [{ id: 'e1' }],
      errors: [{ index: 1, message: 'invalid' }],
    });
    expect(outcome.accepted).toEqual([{ registrationId: 'recHuvud' }]);
    expect(outcome.rejected).toEqual([{ registrationId: 'recPlusEtt', reason: 'invalid' }]);

    // Inga rad-fel (errors FRÅNVARANDE, ej tom array) → alla accepterade.
    expect(parseConfirmOutcome(specs, { data: [{ id: 'e1' }, { id: 'e2' }] }).accepted).toEqual([
      { registrationId: 'recHuvud' },
      { registrationId: 'recPlusEtt' },
    ]);
  });

  test('allowlist-SSOT: operationen tillåter EXAKT status-fältet + tidsstämpeln', () => {
    const operation = getOperation('send-registration-confirmation');
    expect(operation).not.toBeNull();
    if (!operation) return;
    expect(operation.tableId).toBe('Anmälningar');
    expect(findDisallowedField(operation, { Status: 'Bekräftad (mail skickat)' })).toBeNull();
    expect(findDisallowedField(operation, { 'Bekräftelse skickad': NU })).toBeNull();
    // Utanför listan → fälls (deny-by-default; gamla odelade Notering rörs aldrig).
    expect(findDisallowedField(operation, { Notering: 'x' })).toBe('Notering');
    expect(findDisallowedField(operation, { Anmälningsavgift: 'Mottagen' })).toBe(
      'Anmälningsavgift',
    );
  });
});
