// Enhetstest för Resend permissive-svar-parsningen (Fas 6h L2d, ADR-067 D3).
//
// api-pure (ren logik, ingen staging, NOLL riktig Resend): parseBatchOutcome får KONSTRUERADE
// data-fixturer matchande förstaparts-SDK-formen (CreateBatchSuccessResponse permissive) och
// asserteras mot ADR-067:s definitioner (accepted = batch MINUS errors[].index; rejected =
// errors[].index → batch[index].email + message), EJ mot fixturens form (L193).
//
// TASK-111 AC2-BEVIS (2026-08-02): describe-blocket "partial (errors med NOLLBASERAT index,
// schema-bekräftad)" nedan ÄR det avvikande-fall-beviset kortet kräver — normalfallet
// ("full-accept") bevisar ingenting eftersom strict och permissive ger IDENTISKT resultat när
// alla rader är giltiga (STEG 0-fällan: den gamla `resend@4`-pinnen gjorde att API:et alltid
// körde strict, så ett tidigare "live"-observerat 2/2-giltiga-svar såg ut att bekräfta permissive
// men bekräftade i själva verket bara strict-defaultet). Batchen med ≥1 ogiltig rad nedan visar
// den GENUINA semantiken: partiell leverans, errors[].index-vägen levande i parsningen.
//
// ⚠️ PARTIAL-FORMEN (errors-grenen) är SCHEMA-BEKRÄFTAD mot Resend-doc OCH käll-verifierad mot
// resend-node 6.1.0/6.18.1:s SDK-typ (`CreateBatchSuccessResponse`) — EJ LIVE-FRAMKALLBAR, men av
// en ANNAN anledning än pin-defekten (som är löst, se resend-batch.ts-headern): icke-prod-spärren
// (send-bulk.ts) blockerar varje icke-test-adress FÖRE Resend-anropet, och de fyra Resend-test-
// adresserna är alla välformade — en valideringsfel-utlösande input kan alltså aldrig nå den
// riktiga gränsen i icke-prod, oavsett SDK-version. Partial-grenen låses därför med fixtur, nu
// bevisad mot den väg (bumpad SDK) som faktiskt kan producera den i produktion. errors =
// VALIDERINGSfel (ej leverans-utfall).

import { expect, test } from '@playwright/test';
import {
  buildBatchPayload,
  parseBatchOutcome,
  type ResendBatchData,
} from '../../supabase/functions/_shared/resend-batch';

const batchOf = (...emails: string[]) => emails.map((email) => ({ email }));

test.describe('parseBatchOutcome — normalfallet (alla giltiga, bevisar INGET om semantik — STEG-0-fällan)', () => {
  test('alla giltiga → accepted=alla, rejected=tom (errors undefined)', () => {
    const batch = batchOf('delivered@resend.dev', 'bounced@resend.dev');
    // Denna form är IDENTISK i strict och permissive — TASK-111:s STEG-0-fälla. Beviset för
    // vald semantik ligger i describe-blocket nedan (≥1 ogiltig rad), inte här.
    const data: ResendBatchData = { data: [{ id: 'a' }, { id: 'b' }] };
    const out = parseBatchOutcome(batch, data);
    expect(out.accepted).toEqual([
      { email: 'delivered@resend.dev' },
      { email: 'bounced@resend.dev' },
    ]);
    expect(out.rejected).toEqual([]);
  });

  test('errors = tom array (defensiv ekvivalens med undefined) → accepted=alla', () => {
    const batch = batchOf('delivered@resend.dev');
    const out = parseBatchOutcome(batch, { data: [{ id: 'a' }], errors: [] });
    expect(out.accepted).toEqual([{ email: 'delivered@resend.dev' }]);
    expect(out.rejected).toEqual([]);
  });
});

test.describe('parseBatchOutcome — AVVIKANDE FALLET, TASK-111 AC2-bevis (errors med NOLLBASERAT index)', () => {
  test('en ogiltig rad (index 1) → korrekt accepted/rejected-split per index', () => {
    // 3 rader; index 1 ogiltig. data.data bär de 2 GILTIGA (kompakterat), errors bär rad 1.
    const batch = batchOf('a@resend.dev', 'trasig', 'c@resend.dev');
    const data: ResendBatchData = {
      data: [{ id: 'id-a' }, { id: 'id-c' }],
      errors: [{ index: 1, message: 'Invalid `to` field.' }],
    };
    const out = parseBatchOutcome(batch, data);
    expect(out.accepted).toEqual([{ email: 'a@resend.dev' }, { email: 'c@resend.dev' }]);
    expect(out.rejected).toEqual([{ email: 'trasig', reason: 'Invalid `to` field.' }]);
  });

  test('flera ogiltiga (index 0 + 2) → de två fälls per sitt index, mitten accepteras', () => {
    const batch = batchOf('x', 'b@resend.dev', 'y');
    const data: ResendBatchData = {
      data: [{ id: 'id-b' }],
      errors: [
        { index: 0, message: 'bad-0' },
        { index: 2, message: 'bad-2' },
      ],
    };
    const out = parseBatchOutcome(batch, data);
    expect(out.accepted).toEqual([{ email: 'b@resend.dev' }]);
    expect(out.rejected).toEqual([
      { email: 'x', reason: 'bad-0' },
      { email: 'y', reason: 'bad-2' },
    ]);
  });

  test('tom message → defensivt fallback-skäl (aldrig tomt rejected.reason)', () => {
    const out = parseBatchOutcome(batchOf('a', 'b'), {
      data: [{ id: 'id-a' }],
      errors: [{ index: 1, message: '' }],
    });
    expect(out.rejected).toEqual([{ email: 'b', reason: 'Resend validation error' }]);
  });
});

test.describe('parseBatchOutcome — defensiva kanter (struktur-drift, fabricerar aldrig)', () => {
  test('index utanför intervall → rejection UTAN fabricerad e-post, accepted oförändrat', () => {
    const out = parseBatchOutcome(batchOf('a@resend.dev'), {
      data: [{ id: 'id-a' }],
      errors: [{ index: 9, message: 'drift' }],
    });
    // Index 9 finns ej i batch → ingen riktig rad fälls; e-post fabriceras ALDRIG.
    expect(out.accepted).toEqual([{ email: 'a@resend.dev' }]);
    expect(out.rejected).toEqual([{ email: '(okänd — index utanför intervall)', reason: 'drift' }]);
  });

  test('data null/undefined → tolkas som inga errors (accepted=alla)', () => {
    expect(parseBatchOutcome(batchOf('a', 'b'), null).accepted).toEqual([
      { email: 'a' },
      { email: 'b' },
    ]);
    expect(parseBatchOutcome(batchOf('a'), undefined).rejected).toEqual([]);
  });

  test('data.data-längd != index-komplement → index-komplementet är auktoritativt (varnar)', () => {
    // data.data ljuger (0 rader) men inga errors → vi litar på index-komplementet = alla accepterade.
    const out = parseBatchOutcome(batchOf('a@resend.dev', 'b@resend.dev'), { data: [] });
    expect(out.accepted).toEqual([{ email: 'a@resend.dev' }, { email: 'b@resend.dev' }]);
    expect(out.rejected).toEqual([]);
  });
});

const sendCtx = { subject: 'Ämne', html: '<p>hej</p>', text: 'hej' };

test.describe('buildBatchPayload — reply_to närvaro (Fas 1, secret-drivet)', () => {
  test('RESEND_REPLY_TO satt → replyTo (camelCase) NÄRVARANDE på varje rad', () => {
    const payload = buildBatchPayload(
      batchOf('delivered@resend.dev', 'bounced@resend.dev'),
      sendCtx,
      {
        from: 'onboarding@resend.dev',
        replyTo: 'lotta@outsidereality.se',
      },
    );
    expect(payload).toEqual([
      {
        from: 'onboarding@resend.dev',
        to: ['delivered@resend.dev'],
        subject: 'Ämne',
        html: '<p>hej</p>',
        text: 'hej',
        replyTo: 'lotta@outsidereality.se',
      },
      {
        from: 'onboarding@resend.dev',
        to: ['bounced@resend.dev'],
        subject: 'Ämne',
        html: '<p>hej</p>',
        text: 'hej',
        replyTo: 'lotta@outsidereality.se',
      },
    ]);
  });

  test('RESEND_REPLY_TO ej satt (undefined) → replyTo UTELÄMNAS (nuvarande beteende bevaras)', () => {
    const payload = buildBatchPayload(batchOf('delivered@resend.dev'), sendCtx, {
      from: 'onboarding@resend.dev',
      replyTo: undefined,
    });
    expect(payload).toEqual([
      {
        from: 'onboarding@resend.dev',
        to: ['delivered@resend.dev'],
        subject: 'Ämne',
        html: '<p>hej</p>',
        text: 'hej',
      },
    ]);
    expect('replyTo' in payload[0]).toBe(false);
  });

  test('RESEND_REPLY_TO tom/whitespace → replyTo UTELÄMNAS (graceful, ej tomt fält)', () => {
    for (const empty of ['', '   ', null]) {
      const payload = buildBatchPayload(batchOf('delivered@resend.dev'), sendCtx, {
        from: 'onboarding@resend.dev',
        replyTo: empty,
      });
      expect('replyTo' in payload[0]).toBe(false);
    }
  });
});
