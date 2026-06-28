// Enhetstest för Resend permissive-svar-parsningen (Fas 6h L2d, ADR-067 D3).
//
// api-pure (ren logik, ingen staging, NOLL riktig Resend): parseBatchOutcome får KONSTRUERADE
// data-fixturer matchande förstaparts-SDK-formen (CreateBatchSuccessResponse permissive) och
// asserteras mot ADR-067:s definitioner (accepted = batch MINUS errors[].index; rejected =
// errors[].index → batch[index].email + message), EJ mot fixturens form (L193).
//
// ⚠️ PARTIAL-FORMEN (errors-grenen) är SCHEMA-BEKRÄFTAD mot Resend-doc, EJ LIVE-FRAMKALLBAR:
// icke-prod-spärren (send-bulk.ts) blockerar varje icke-test-adress FÖRE Resend-anropet, så
// en valideringsfel-utlösande input når aldrig den riktiga gränsen i staging. STEG 0 observerade
// happy-path-formen live (data.data[] + errors FRÅNVARANDE vid 2/2 giltiga); partial-grenen låses
// därför här med fixtur. errors = VALIDERINGSfel (ej leverans-utfall).

import { expect, test } from '@playwright/test';
import {
  parseBatchOutcome,
  type ResendBatchData,
} from '../../supabase/functions/_shared/resend-batch';

const batchOf = (...emails: string[]) => emails.map((email) => ({ email }));

test.describe('parseBatchOutcome — full-accept (errors FRÅNVARANDE, STEG-0-observerad form)', () => {
  test('alla giltiga → accepted=alla, rejected=tom (errors undefined)', () => {
    const batch = batchOf('delivered@resend.dev', 'bounced@resend.dev');
    // STEG 0-observerad form: { data: [{id},{id}] }, INGET errors-fält.
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

test.describe('parseBatchOutcome — partial (errors med NOLLBASERAT index, schema-bekräftad)', () => {
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
