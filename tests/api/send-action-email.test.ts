// Kontraktstest för åtgärdsutskicks-orkestratorn (TASK-147.1, ADR-067-revisionen).
//
// api-pure (ren logik, ingen staging, inga creds, NOLL riktig Resend/Airtable): båda
// I/O-gränserna (ActionSender, ActionFieldWriter) injiceras som mockar → konformans-
// kärnan bevisas in-memory. Speglar confirm-registrations.test.ts/send-bulk.test.ts-
// formen (repots första + andra mail-vertikal) för den TREDJE.
//
// Täcker kontraktet: de FYRA åtgärdstypernas stämpel-fält (bekräftelse: Status+
// tidsstämpel; eventinfo: Deltagarinfo skickad; paminnelse: VILLKORAT på mottagarens
// eget betalningsläge; fritt: inget fält), ATOMICITETEN (fält-skrivningen sker ENDAST
// för den vars mail accepterades), icke-prod-spärren ÅTERANVÄND ur send-bulk (GOLV —
// aldrig kringgången, aldrig kopierad), inaktiv-status-golvet DELAT med confirm-
// registrations, bekräftelse-idempotensen (redan bekräftad hoppas över), e-post-lös
// mottagare hoppas över, aldrig-binär status (sent/partial/failed/skipped), platshållar-
// renderingen (mirror-kontraktet mot AtgardsSida.tsx) samt allowlist-SSOT (deny/allow).
//
// EJ här (kräver deployad EF, "ingen deploy"-uppgiftsgräns — send-bulk.test.ts:s
// precedent, L2c-mönstret): HTTP auth 401 / metod 405 / input-400 / eventId-mismatch-400
// / RIKTIG Airtable-skrivning mot staging. Bokfört öppet i landningens slutrapport —
// samma "ingen deploy denna landning"-gräns send-email/send-registration-confirmation
// följde före sina egna staging-test-landningar.

import { expect, test } from '@playwright/test';
import {
  findDisallowedField,
  getOperation,
} from '../../supabase/functions/_shared/field-allowlists';
import {
  type ActionSender,
  type ActionSendInput,
  type ActionTarget,
  type ActionTestSendInput,
  type EventContext,
  isActionType,
  runActionSend,
  runActionTestSend,
} from '../../supabase/functions/_shared/send-action-email';
import { NonProdAddressError } from '../../supabase/functions/_shared/send-bulk';

const TEST_ADDR = 'delivered@resend.dev';
const TEST_ADDR_2 = 'bounced@resend.dev';
const NU = '2026-08-10T10:00:00.000Z';

function target(overrides: Partial<ActionTarget> & { id: string }): ActionTarget {
  return {
    email: TEST_ADDR,
    fornamn: 'Anna',
    status: 'Obekräftad',
    anmalningsavgift: 'Ej mottagen',
    slutbetalning: 'Ej mottagen',
    ...overrides,
  };
}

function event(overrides: Partial<EventContext> = {}): EventContext {
  return {
    eventNamn: 'Resor i medvetandet 1',
    ort: 'Skövde',
    startdatum: '2026-09-01',
    ...overrides,
  };
}

/** Mock-sender: registrerar varje anrop och accepterar alla utom rejectSet. NOLL riktig Resend. */
function mockSender(rejectSet: Set<string> = new Set()): ActionSender & {
  calls: {
    registrationIds: string[];
    emails: string[];
    subjects: string[];
    texts: string[];
    idempotencyKey: string;
  }[];
} {
  const calls: {
    registrationIds: string[];
    emails: string[];
    subjects: string[];
    texts: string[];
    idempotencyKey: string;
  }[] = [];
  const sender: ActionSender = async (specs, ctx) => {
    calls.push({
      registrationIds: specs.map((s) => s.registrationId),
      emails: specs.map((s) => s.email),
      subjects: specs.map((s) => s.subject),
      texts: specs.map((s) => s.text),
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

/** Mock-writer: registrerar varje fält-skrivning. NOLL riktig Airtable. */
function mockWriter(failFor: Set<string> = new Set()): ((
  registrationId: string,
  fields: Record<string, unknown>,
) => Promise<void>) & {
  writes: { registrationId: string; fields: Record<string, unknown> }[];
} {
  const writes: { registrationId: string; fields: Record<string, unknown> }[] = [];
  const writer = async (registrationId: string, fields: Record<string, unknown>) => {
    if (failFor.has(registrationId)) throw new Error('mock-airtable-fel');
    writes.push({ registrationId, fields });
  };
  return Object.assign(writer, { writes });
}

function input(overrides: Partial<ActionSendInput> = {}): ActionSendInput {
  return {
    actionType: 'bekraftelse',
    targets: [target({ id: 'rec1' })],
    event: event(),
    amne: 'Din plats är bekräftad',
    mailtext: 'Hej {förnamn}, din plats är bekräftad.',
    jobId: '11111111-1111-4111-8111-111111111111',
    isProd: false,
    nu: NU,
    ...overrides,
  };
}

test.describe('runActionSend — åtgärdsutskickens orkestrator (TASK-147.1)', () => {
  test('isActionType: exakt de fyra nycklarna är giltiga, inget annat', () => {
    expect(isActionType('bekraftelse')).toBe(true);
    expect(isActionType('paminnelse')).toBe(true);
    expect(isActionType('eventinfo')).toBe(true);
    expect(isActionType('fritt')).toBe(true);
    expect(isActionType('okand')).toBe(false);
    expect(isActionType(undefined)).toBe(false);
    expect(isActionType(null)).toBe(false);
    expect(isActionType(1)).toBe(false);
  });

  test('bekräftelse: mail skickas OCH Status+tidsstämpel skrivs i samma operation', async () => {
    const sender = mockSender();
    const writer = mockWriter();

    const result = await runActionSend(input(), { sender, writeFields: writer });

    expect(result.status).toBe('sent');
    expect(result.requested).toBe(1);
    expect(result.attempted).toBe(1);
    expect(result.completed).toEqual(['rec1']);
    expect(writer.writes).toEqual([
      {
        registrationId: 'rec1',
        fields: { Status: 'Bekräftad (mail skickat)', 'Bekräftelse skickad': NU },
      },
    ]);
  });

  test('eventinfo: skriver ENDAST "Deltagarinfo skickad" — ingen Status-rörning', async () => {
    const sender = mockSender();
    const writer = mockWriter();

    const result = await runActionSend(
      input({
        actionType: 'eventinfo',
        targets: [target({ id: 'rec1', status: 'Bekräftad (mail skickat)' })],
      }),
      { sender, writeFields: writer },
    );

    expect(result.status).toBe('sent');
    expect(writer.writes).toEqual([
      { registrationId: 'rec1', fields: { 'Deltagarinfo skickad': NU } },
    ]);
  });

  test('påminnelse: skriver BÅDA fälten när båda betalningarna saknas', async () => {
    const sender = mockSender();
    const writer = mockWriter();

    const result = await runActionSend(
      input({
        actionType: 'paminnelse',
        targets: [
          target({
            id: 'rec1',
            status: 'Bekräftad (mail skickat)',
            anmalningsavgift: 'Ej mottagen',
            slutbetalning: 'Ej mottagen',
          }),
        ],
      }),
      { sender, writeFields: writer },
    );

    expect(result.status).toBe('sent');
    expect(writer.writes).toEqual([
      {
        registrationId: 'rec1',
        fields: {
          'Påminnelse anmälningsavgift skickad': NU,
          'Påminnelse slutbetalning skickad': NU,
        },
      },
    ]);
  });

  test('påminnelse: skriver ENDAST det fält vars betalning faktiskt saknas', async () => {
    const sender = mockSender();
    const writer = mockWriter();

    await runActionSend(
      input({
        actionType: 'paminnelse',
        targets: [
          target({
            id: 'recAvgift',
            status: 'Bekräftad (mail skickat)',
            anmalningsavgift: 'Ej mottagen',
            slutbetalning: 'Mottagen',
          }),
        ],
      }),
      { sender, writeFields: writer },
    );
    expect(writer.writes).toEqual([
      { registrationId: 'recAvgift', fields: { 'Påminnelse anmälningsavgift skickad': NU } },
    ]);
  });

  test('påminnelse: BÅDA betalningarna redan klara ⇒ inget fält skrivs, mailet ensamt räcker för "completed"', async () => {
    const sender = mockSender();
    const writer = mockWriter();

    const result = await runActionSend(
      input({
        actionType: 'paminnelse',
        targets: [
          target({
            id: 'recKlar',
            status: 'Bekräftad (mail skickat)',
            anmalningsavgift: 'Mottagen',
            slutbetalning: 'Mottagen',
          }),
        ],
      }),
      { sender, writeFields: writer },
    );

    expect(result.status).toBe('sent');
    expect(result.completed).toEqual(['recKlar']);
    expect(writer.writes).toEqual([]); // Mailet gick — men NOLL Airtable-anrop.
  });

  test('fritt: mailet ensamt är hela handlingen — INGET fält skrivs, ingen allowlist-friktion', async () => {
    const sender = mockSender();
    const writer = mockWriter();

    const result = await runActionSend(
      input({ actionType: 'fritt', amne: 'Viktig info', mailtext: 'Ett fritt formulerat mail.' }),
      { sender, writeFields: writer },
    );

    expect(result.status).toBe('sent');
    expect(result.completed).toEqual(['rec1']);
    expect(writer.writes).toEqual([]);
  });

  test('ATOMICITET: avvisat mail ⇒ INGEN fält-skrivning för den mottagaren', async () => {
    const sender = mockSender(new Set([TEST_ADDR_2]));
    const writer = mockWriter();

    const result = await runActionSend(
      input({
        targets: [
          target({ id: 'recOk', email: TEST_ADDR }),
          target({ id: 'recFel', email: TEST_ADDR_2 }),
        ],
      }),
      { sender, writeFields: writer },
    );

    expect(result.status).toBe('partial');
    expect(result.completed).toEqual(['recOk']);
    expect(result.failed).toEqual([{ registrationId: 'recFel', reason: 'mock-reject' }]);
    expect(writer.writes.map((w) => w.registrationId)).toEqual(['recOk']);
  });

  test('DELUTFALL PRÖVAT SOM DELUTFALL: tre mottagare, en faller ⇒ ärligt "partial", de andra två klara', async () => {
    const sender = mockSender(new Set(['c@example.com']));
    const writer = mockWriter();

    const result = await runActionSend(
      input({
        targets: [
          target({ id: 'rec1', email: 'a@example.com' }),
          target({ id: 'rec2', email: 'b@example.com' }),
          target({ id: 'rec3', email: 'c@example.com' }),
        ],
        isProd: true, // prod-läge så godtyckliga adresser tillåts i detta scenario
      }),
      { sender, writeFields: writer },
    );

    expect(result.status).toBe('partial');
    expect(result.requested).toBe(3);
    expect(result.attempted).toBe(3);
    expect(result.completed).toEqual(['rec1', 'rec2']);
    expect(result.failed).toEqual([{ registrationId: 'rec3', reason: 'mock-reject' }]);
    // Delutfallet är INTE bara ett tal — vilka som föll är läsbart i svaret.
    expect(result.failed.map((f) => f.registrationId)).not.toContain('rec1');
    expect(result.failed.map((f) => f.registrationId)).not.toContain('rec2');
  });

  test('ICKE-PROD-SPÄRREN (GOLV, återanvänd ur send-bulk): icke-test-adress ⇒ NOLL skickat', async () => {
    const sender = mockSender();
    const writer = mockWriter();

    await expect(
      runActionSend(
        input({
          targets: [
            target({ id: 'rec1', email: TEST_ADDR }),
            target({ id: 'rec2', email: 'lotta@example.com' }),
          ],
        }),
        { sender, writeFields: writer },
      ),
    ).rejects.toThrow(NonProdAddressError);

    // Vägran är TOTAL: varken mail eller fält-skrivning skedde för NÅGON mottagare.
    expect(sender.calls).toHaveLength(0);
    expect(writer.writes).toHaveLength(0);
  });

  test('prod-läge: spärren gäller inte (riktiga adresser tillåts)', async () => {
    const sender = mockSender();
    const writer = mockWriter();

    const result = await runActionSend(
      input({ isProd: true, targets: [target({ id: 'rec1', email: 'lotta@example.com' })] }),
      { sender, writeFields: writer },
    );

    expect(result.status).toBe('sent');
    expect(sender.calls[0].emails).toEqual(['lotta@example.com']);
  });

  test('IDEMPOTENS (bekräftelse): redan bekräftad hoppas över — inget mail, inget fält', async () => {
    const sender = mockSender();
    const writer = mockWriter();

    const result = await runActionSend(
      input({
        targets: [
          target({ id: 'recNy' }),
          target({ id: 'recRedan', status: 'Bekräftad (mail skickat)' }),
        ],
      }),
      { sender, writeFields: writer },
    );

    expect(result.completed).toEqual(['recNy']);
    expect(result.skipped).toEqual([{ registrationId: 'recRedan', reason: 'already_confirmed' }]);
    expect(sender.calls[0].registrationIds).toEqual(['recNy']);
  });

  test('IDEMPOTENS (omkörning): samma jobId körd två gånger ger SAMMA deterministiska idempotens-nyckel — Resend-lagret hindrar dubblett', async () => {
    const sender = mockSender();
    const writer = mockWriter();

    await runActionSend(input({ jobId: 'abc123' }), { sender, writeFields: writer });
    await runActionSend(input({ jobId: 'abc123' }), { sender, writeFields: writer });

    // Två anrop, men BÅDA bär exakt samma idempotencyKey — Resends 24h-fönster
    // (ADR-067 D4a) gör den andra körningen till en cache-träff, inte ett andra mail.
    expect(sender.calls).toHaveLength(2);
    expect(sender.calls[0].idempotencyKey).toBe(sender.calls[1].idempotencyKey);
    expect(sender.calls[0].idempotencyKey).toBe('abc123/bekraftelse');
  });

  test('deterministisk idempotens-nyckel bär åtgärdstypen (skiljer bekräftelse från paminnelse på samma jobId)', async () => {
    const sender = mockSender();
    const writer = mockWriter();
    await runActionSend(input({ jobId: 'x', actionType: 'bekraftelse' }), {
      sender,
      writeFields: writer,
    });
    await runActionSend(
      input({
        jobId: 'x',
        actionType: 'paminnelse',
        targets: [target({ id: 'rec1', status: 'Bekräftad (mail skickat)' })],
      }),
      { sender, writeFields: writer },
    );
    expect(sender.calls[0].idempotencyKey).toBe('x/bekraftelse');
    expect(sender.calls[1].idempotencyKey).toBe('x/paminnelse');
  });

  test('avbokad/inställd mottagare hoppas över (delat golv med confirm-registrations) — för ALLA fyra åtgärdstyperna', async () => {
    const sender = mockSender();
    const writer = mockWriter();

    for (const actionType of ['bekraftelse', 'paminnelse', 'eventinfo', 'fritt'] as const) {
      const result = await runActionSend(
        input({ actionType, targets: [target({ id: 'recAvbokad', status: 'Avbokad/Ombokad' })] }),
        { sender, writeFields: writer },
      );
      expect(result.status).toBe('skipped');
      expect(result.attempted).toBe(0);
      expect(result.skipped).toEqual([{ registrationId: 'recAvbokad', reason: 'inactive' }]);
    }
    expect(sender.calls).toHaveLength(0);
  });

  test('e-post-lös mottagare hoppas över — aldrig ett mail i tomma luften', async () => {
    const sender = mockSender();
    const writer = mockWriter();

    const result = await runActionSend(
      input({ actionType: 'fritt', targets: [target({ id: 'recUtanMail', email: null })] }),
      { sender, writeFields: writer },
    );

    expect(result.status).toBe('skipped');
    expect(result.skipped).toEqual([{ registrationId: 'recUtanMail', reason: 'no_email' }]);
    expect(sender.calls).toHaveLength(0);
  });

  test('fält-skrivfel efter accepterat mail rapporteras som failed (aldrig tyst)', async () => {
    const sender = mockSender();
    const writer = mockWriter(new Set(['rec1']));

    const result = await runActionSend(input(), { sender, writeFields: writer });

    expect(result.status).toBe('failed');
    expect(result.completed).toEqual([]);
    expect(result.failed[0].registrationId).toBe('rec1');
    expect(result.failed[0].reason).toContain('mock-airtable-fel');
  });

  test('mall-renderingen: platshållarna fylls PER MOTTAGARE (olika förnamn ⇒ olika text), ofyllda lämnas literalt', async () => {
    const sender = mockSender();
    const writer = mockWriter();

    await runActionSend(
      input({
        actionType: 'fritt',
        amne: 'Hej {förnamn}',
        mailtext: 'Hej {förnamn}, vi ses i {event}. Sista dag är {deadline}.',
        event: event({ eventNamn: null }), // {event} olöst hos BÅDA — {deadline} löst (startdatum finns)
        targets: [
          target({ id: 'rec1', fornamn: 'Anna' }),
          target({ id: 'rec2', fornamn: 'Bertil' }),
        ],
      }),
      { sender, writeFields: writer },
    );

    expect(sender.calls[0].subjects).toEqual(['Hej Anna', 'Hej Bertil']);
    expect(sender.calls[0].texts[0]).toContain('Hej Anna,');
    expect(sender.calls[0].texts[1]).toContain('Hej Bertil,');
    // {event} kunde inte lösas (eventNamn null) ⇒ lämnas LITERALT, aldrig blankad.
    expect(sender.calls[0].texts[0]).toContain('{event}');
    // {deadline} KUNDE lösas (startdatum finns) ⇒ ersatt, inte literalt kvar.
    expect(sender.calls[0].texts[0]).not.toContain('{deadline}');
  });

  test('mall utan platshållare (fritt-utskickets normalfall) skickas oförändrad till alla', async () => {
    const sender = mockSender();
    const writer = mockWriter();

    await runActionSend(
      input({
        actionType: 'fritt',
        amne: 'Viktig uppdatering',
        mailtext: 'Detta är ett helt fritt formulerat meddelande utan mallord.',
        targets: [
          target({ id: 'rec1', fornamn: 'Anna' }),
          target({ id: 'rec2', fornamn: 'Bertil' }),
        ],
      }),
      { sender, writeFields: writer },
    );

    expect(sender.calls[0].texts[0]).toBe(
      'Detta är ett helt fritt formulerat meddelande utan mallord.',
    );
    expect(sender.calls[0].texts[0]).toBe(sender.calls[0].texts[1]);
  });

  test('NOLL-LEVERANS: samtliga hoppade över ⇒ status "skipped", attempted 0, sändaren anropas aldrig', async () => {
    const sender = mockSender();
    const writer = mockWriter();

    const result = await runActionSend(
      input({
        actionType: 'eventinfo',
        targets: [target({ id: 'rec1', email: null }), target({ id: 'rec2', status: 'Inställt' })],
      }),
      { sender, writeFields: writer },
    );

    expect(result.status).toBe('skipped');
    expect(result.attempted).toBe(0);
    expect(sender.calls).toHaveLength(0);
    expect(writer.writes).toHaveLength(0);
  });
});

// ============================================================================
// runActionTestSend — "Skicka test till mig" (TASK-147.10, ADR-067 D10/T53
// väg C). SAMMA `ActionSender`-mock (`mockSender`) och SAMMA `target`/`event`-
// byggare som ovan — testgrenen delar renderingen (`renderFor`) och GOLVet
// (icke-prod-spärren) med `runActionSend`, den prövas alltså inte om här.
//
// STRUKTURELLT BEVIS FÖR AC #2 ("ingen anmälan i urvalet berörs"): varje test
// nedan anropar `runActionTestSend` med `{ sender }` — INGET `writeFields` i
// deps-objektet. `ActionTestSendDeps` (`_shared/send-action-email.ts`) har
// ingen `ActionFieldWriter`-nyckel i sin typ, så en fält-skrivning är omöjlig
// att uttrycka här, inte bara oanvänd i denna kod — TypeScript vägrar
// kompilera ett anrop som försöker skicka ett `writeFields`.
// ============================================================================
test.describe('runActionTestSend — testmailets orkestrator (TASK-147.10)', () => {
  function testInput(overrides: Partial<ActionTestSendInput> = {}): ActionTestSendInput {
    return {
      target: target({ id: 'recForsta', fornamn: 'Anna', email: 'anna.riktig@example.com' }),
      event: event(),
      amne: 'Din plats är bekräftad',
      mailtext: 'Hej {förnamn}, din plats på {event} är bekräftad. Vi ses {datum} i {ort}.',
      testRecipientEmail: TEST_ADDR,
      jobId: '22222222-2222-4222-8222-222222222222',
      isProd: false,
      ...overrides,
    };
  }

  test('adressen mailet FAKTISKT går till är testRecipientEmail — ALDRIG target.email (AC #2)', async () => {
    const sender = mockSender();

    const result = await runActionTestSend(
      testInput({
        target: target({ id: 'recForsta', email: 'anna.riktig@example.com' }),
        testRecipientEmail: TEST_ADDR,
        isProd: true, // prod-läge så target.email (icke-Resend-test-adress) inte fäller GOLV-spärren
      }),
      { sender },
    );

    expect(result.status).toBe('sent');
    expect(sender.calls).toHaveLength(1);
    expect(sender.calls[0].emails).toEqual([TEST_ADDR]);
    expect(sender.calls[0].emails).not.toContain('anna.riktig@example.com');
  });

  test('ämnesraden TEST-prefixas (AC #1) — mailtextens rendering är OFÖRÄNDRAD', async () => {
    const sender = mockSender();

    await runActionTestSend(
      testInput({
        amne: 'Din plats är bekräftad',
        target: target({ id: 'recForsta', fornamn: 'Anna' }),
      }),
      { sender },
    );

    expect(sender.calls[0].subjects).toEqual(['TEST: Din plats är bekräftad']);
  });

  test('platshållarna fylls ur target/event — SAMMA renderFor som runActionSend (mirror-kontraktet)', async () => {
    const sender = mockSender();

    await runActionTestSend(
      testInput({
        target: target({ id: 'recForsta', fornamn: 'Bertil' }),
        event: event({
          eventNamn: 'Resor i medvetandet 1',
          ort: 'Skövde',
          startdatum: '2026-09-01',
        }),
        mailtext: 'Hej {förnamn}, din plats på {event} är bekräftad. Vi ses {datum} i {ort}.',
      }),
      { sender },
    );

    expect(sender.calls[0].texts[0]).toContain('Hej Bertil,');
    expect(sender.calls[0].texts[0]).toContain('Resor i medvetandet 1');
    expect(sender.calls[0].texts[0]).toContain('Skövde');
  });

  test('ICKE-PROD-SPÄRREN (GOLV, återanvänd): gäller testRecipientEmail — target.email är IRRELEVANT för spärren', async () => {
    const sender = mockSender();

    // target.email ÄR en Resend-test-adress, men testRecipientEmail är det INTE
    // — spärren ska ändå fälla, för adressen som FAKTISKT kontaktas är
    // testRecipientEmail.
    await expect(
      runActionTestSend(
        testInput({
          target: target({ id: 'recForsta', email: TEST_ADDR }),
          testRecipientEmail: 'lotta@example.com',
          isProd: false,
        }),
        { sender },
      ),
    ).rejects.toThrow(NonProdAddressError);
    expect(sender.calls).toHaveLength(0);
  });

  test('icke-prod: testRecipientEmail SOM Resend-test-adress går igenom oavsett target.email', async () => {
    const sender = mockSender();

    const result = await runActionTestSend(
      testInput({
        target: target({ id: 'recForsta', email: 'nagon.helt.annan@example.com' }),
        testRecipientEmail: TEST_ADDR,
        isProd: false,
      }),
      { sender },
    );

    expect(result.status).toBe('sent');
    expect(sender.calls[0].emails).toEqual([TEST_ADDR]);
  });

  test('prod-läge: spärren gäller inte — godtycklig testRecipientEmail tillåts', async () => {
    const sender = mockSender();

    const result = await runActionTestSend(
      testInput({ testRecipientEmail: 'lotta@example.com', isProd: true }),
      { sender },
    );

    expect(result.status).toBe('sent');
    expect(sender.calls[0].emails).toEqual(['lotta@example.com']);
  });

  test('idempotens-nyckeln är <jobId>/test — namnrymd-separerad från runActionSends <jobId>/<actionType>', async () => {
    const sender = mockSender();

    await runActionTestSend(testInput({ jobId: 'x' }), { sender });

    expect(sender.calls[0].idempotencyKey).toBe('x/test');
  });

  test('avvisat mail ⇒ status "failed" med Resends skäl (fri text, passthrough)', async () => {
    const sender = mockSender(new Set([TEST_ADDR]));

    const result = await runActionTestSend(testInput({ testRecipientEmail: TEST_ADDR }), {
      sender,
    });

    expect(result.status).toBe('failed');
    expect(result.reason).toBe('mock-reject');
  });

  test('accepterat mail ⇒ status "sent", inget "reason"-fält', async () => {
    const sender = mockSender();

    const result = await runActionTestSend(testInput(), { sender });

    expect(result.status).toBe('sent');
    expect(result.reason).toBeUndefined();
  });

  test('FÖRSTA mottagaren utan egen e-post — testmailet skickas ändå (adressen kommer ALDRIG från target)', async () => {
    const sender = mockSender();

    const result = await runActionTestSend(
      testInput({ target: target({ id: 'recForsta', email: null }), isProd: true }),
      { sender },
    );

    expect(result.status).toBe('sent');
    expect(sender.calls[0].emails).toEqual([TEST_ADDR]);
  });
});

test.describe('allowlist-SSOT (TASK-147.1)', () => {
  test('allowlist-SSOT: operationen tillåter EXAKT unionen av de fyra åtgärdstypernas fält', () => {
    const operation = getOperation('send-action-email');
    expect(operation).not.toBeNull();
    if (!operation) return;
    expect(operation.tableId).toBe('Anmälningar');
    expect(findDisallowedField(operation, { Status: 'Bekräftad (mail skickat)' })).toBeNull();
    expect(findDisallowedField(operation, { 'Bekräftelse skickad': NU })).toBeNull();
    expect(findDisallowedField(operation, { 'Deltagarinfo skickad': NU })).toBeNull();
    expect(
      findDisallowedField(operation, { 'Påminnelse anmälningsavgift skickad': NU }),
    ).toBeNull();
    expect(findDisallowedField(operation, { 'Påminnelse slutbetalning skickad': NU })).toBeNull();
    // Utanför listan → fälls (deny-by-default; gamla odelade fältet rörs aldrig).
    expect(findDisallowedField(operation, { 'Betalningspåminnelse skickad': NU })).toBe(
      'Betalningspåminnelse skickad',
    );
    expect(findDisallowedField(operation, { Notering: 'x' })).toBe('Notering');
    expect(findDisallowedField(operation, { Anmälningsavgift: 'Mottagen' })).toBe(
      'Anmälningsavgift',
    );
  });
});
