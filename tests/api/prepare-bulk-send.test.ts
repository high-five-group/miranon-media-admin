// Uttömmande enhetstest för bulk-send-förberedelsen (Fas 6h L1, ADR-067 D2–D6).
//
// api-pure (ren logik, ingen staging, inga creds, ingen Resend/Airtable) → körs
// lokalt + CI. Låser konformans-kärnan in-memory: consent-gate (D5), e-post-
// hygien (D6: dedup + e-post-lös-exkludering), batch-chunkning (D2/D4) och
// status-räkning (D3) — INKL. räknar-invarianten requested == suppressedConsent
// + suppressedNoEmail + deduped + attempted. Asserterar mot ADR-067:s
// räknardefinitioner, ej mot fixturens incidentella form (L193).

import { expect, test } from '@playwright/test';
import {
  prepareBulkSend,
  RESEND_BATCH_MAX,
  type SegmentMember,
} from '../../supabase/functions/_shared/prepare-bulk-send';

// Kortform: member(id, email, ejGodkandMail?, namn?). Default consent-OK (false).
function member(
  id: string,
  email: string | null,
  ejGodkandMail = false,
  namn: string | null = null,
): SegmentMember {
  return { id, namn, email, ejGodkandMail };
}

// Räknar-invarianten (ADR-067 D3) — varje medlem landar i exakt en hink.
function assertCountInvariant(counts: ReturnType<typeof prepareBulkSend>['counts']): void {
  expect(
    counts.suppressedConsent + counts.suppressedNoEmail + counts.deduped + counts.attempted,
  ).toBe(counts.requested);
}

test.describe('prepareBulkSend — consent-gate (D5, GOLV)', () => {
  test('ejGodkandMail === true exkluderas + räknas (aldrig tyst)', () => {
    const { batches, counts } = prepareBulkSend([member('p1', 'a@x.se', true)]);
    expect(counts.suppressedConsent).toBe(1);
    expect(counts.attempted).toBe(0);
    expect(batches).toEqual([]);
    assertCountInvariant(counts);
  });

  test('ejGodkandMail === false inkluderas', () => {
    const { counts } = prepareBulkSend([member('p1', 'a@x.se', false)]);
    expect(counts.suppressedConsent).toBe(0);
    expect(counts.attempted).toBe(1);
    assertCountInvariant(counts);
  });

  test('blandad lista partitioneras korrekt', () => {
    const { counts } = prepareBulkSend([
      member('p1', 'a@x.se', false),
      member('p2', 'b@x.se', true),
      member('p3', 'c@x.se', false),
      member('p4', 'd@x.se', true),
    ]);
    expect(counts.suppressedConsent).toBe(2);
    expect(counts.attempted).toBe(2);
    assertCountInvariant(counts);
  });
});

test.describe('prepareBulkSend — e-post-hygien: e-post-lös (D6, GOLV)', () => {
  test('null e-post exkluderas + räknas', () => {
    const { counts } = prepareBulkSend([member('p1', null)]);
    expect(counts.suppressedNoEmail).toBe(1);
    expect(counts.attempted).toBe(0);
    assertCountInvariant(counts);
  });

  test('tom + whitespace-only e-post exkluderas + räknas', () => {
    const { counts } = prepareBulkSend([member('p1', ''), member('p2', '   ')]);
    expect(counts.suppressedNoEmail).toBe(2);
    expect(counts.attempted).toBe(0);
    assertCountInvariant(counts);
  });

  test('e-post utan "@" exkluderas + räknas (speglar SKOOL normalizeEmail)', () => {
    const { counts } = prepareBulkSend([member('p1', 'inte-en-epost')]);
    expect(counts.suppressedNoEmail).toBe(1);
    expect(counts.attempted).toBe(0);
    assertCountInvariant(counts);
  });

  test('consent-spärrad e-post-lös räknas som consent, EJ no-email (D5 före D6)', () => {
    const { counts } = prepareBulkSend([member('p1', null, true)]);
    expect(counts.suppressedConsent).toBe(1);
    expect(counts.suppressedNoEmail).toBe(0);
    assertCountInvariant(counts);
  });
});

test.describe('prepareBulkSend — dedup (D6, SKOOL b7-arv)', () => {
  test('samma e-post olika casing → en mottagare, deduped räknad', () => {
    const { batches, counts } = prepareBulkSend([
      member('p1', 'Anna@X.se'),
      member('p2', 'anna@x.se'),
    ]);
    expect(counts.attempted).toBe(1);
    expect(counts.deduped).toBe(1);
    expect(batches[0]).toHaveLength(1);
    expect(batches[0][0].email).toBe('anna@x.se'); // normaliserad
    assertCountInvariant(counts);
  });

  test('samma e-post olika whitespace → en mottagare', () => {
    const { counts } = prepareBulkSend([member('p1', '  bo@x.se '), member('p2', 'bo@x.se')]);
    expect(counts.attempted).toBe(1);
    expect(counts.deduped).toBe(1);
    assertCountInvariant(counts);
  });

  test('dedup behåller FÖRSTA förekomstens personId', () => {
    const { batches } = prepareBulkSend([member('first', 'z@x.se'), member('second', 'z@x.se')]);
    expect(batches[0][0].personId).toBe('first');
  });
});

test.describe('prepareBulkSend — batch-chunkning + determinism (D2/D4)', () => {
  // N consent-OK medlemmar med unika e-poster.
  function manyMembers(n: number): SegmentMember[] {
    return Array.from({ length: n }, (_, i) =>
      // Noll-padda så stränglexikografisk sort = numerisk (determinism-test stabilt).
      member(`p${i}`, `u${String(i).padStart(4, '0')}@x.se`),
    );
  }

  test('100 mottagare → 1 batch', () => {
    const { batches, counts } = prepareBulkSend(manyMembers(100));
    expect(counts.attempted).toBe(100);
    expect(counts.batchCount).toBe(1);
    expect(batches).toHaveLength(1);
    expect(batches[0]).toHaveLength(100);
    assertCountInvariant(counts);
  });

  test('101 mottagare → 2 batchar (100 + 1)', () => {
    const { batches, counts } = prepareBulkSend(manyMembers(101));
    expect(counts.batchCount).toBe(2);
    expect(batches[0]).toHaveLength(RESEND_BATCH_MAX);
    expect(batches[1]).toHaveLength(1);
    assertCountInvariant(counts);
  });

  test('0 sändbara → 0 batchar (ingen krasch)', () => {
    const { batches, counts } = prepareBulkSend([member('p1', 'a@x.se', true)]);
    expect(counts.batchCount).toBe(0);
    expect(batches).toEqual([]);
    assertCountInvariant(counts);
  });

  test('determinism: samma input två körningar → identisk batch-ordning', () => {
    const input = manyMembers(150);
    expect(prepareBulkSend(input)).toEqual(prepareBulkSend(input));
  });

  test('determinism: omkastad input → identisk batch-payload (sort på normaliserad e-post)', () => {
    const input = manyMembers(150);
    const reversed = [...input].reverse();
    expect(prepareBulkSend(reversed)).toEqual(prepareBulkSend(input));
  });
});

test.describe('prepareBulkSend — status-invariant + tom input (D3)', () => {
  test('tom input → allt-noll, inga batchar, ingen krasch', () => {
    const { batches, counts } = prepareBulkSend([]);
    expect(counts).toEqual({
      requested: 0,
      suppressedConsent: 0,
      suppressedNoEmail: 0,
      deduped: 0,
      attempted: 0,
      batchCount: 0,
    });
    expect(batches).toEqual([]);
    assertCountInvariant(counts);
  });

  test('full blandning: invariant håller över alla hinkar samtidigt', () => {
    const { counts } = prepareBulkSend([
      member('p1', 'a@x.se', false), // attempted
      member('p2', 'a@x.se', false), // deduped (samma som p1)
      member('p3', 'b@x.se', true), // suppressedConsent
      member('p4', null, false), // suppressedNoEmail
      member('p5', 'ogiltig', false), // suppressedNoEmail (saknar @)
      member('p6', 'c@x.se', false), // attempted
    ]);
    expect(counts.requested).toBe(6);
    expect(counts.suppressedConsent).toBe(1);
    expect(counts.suppressedNoEmail).toBe(2);
    expect(counts.deduped).toBe(1);
    expect(counts.attempted).toBe(2);
    expect(counts.batchCount).toBe(1);
    assertCountInvariant(counts);
  });

  test('SendSpec bär normaliserad e-post + personId (det L2 behöver)', () => {
    const { batches } = prepareBulkSend([member('person-x', '  Foo@Bar.SE ')]);
    expect(batches[0][0]).toEqual({ personId: 'person-x', email: 'foo@bar.se' });
  });
});
