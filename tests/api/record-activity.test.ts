// recordActivity — fire-and-forget-kontraktet (TASK-201.3 AC #1), api-pure
// (ren logik, ingen staging, inga creds, ingen browser). `recordActivity.ts`
// har inga browser-only-beroenden (crypto.randomUUID/console.error finns i
// Node) — ett injicerat `DataSourceAdapter`-stub räcker för att pröva
// funktionen isolerat, samma injektionsmönster som `send-receipt.test.ts`/
// `send-action-email.test.ts` (api-pure, injicerade gränser).
//
// BÅDA RIKTNINGARNA (AC #1s egen parentes):
//   1. dataSource.recordActivity LYCKAS → recordActivity() resolvar utan fel.
//   2. dataSource.recordActivity KASTAR (nätverksfel/EF-avvisning) →
//      recordActivity() resolvar ÄNDÅ utan fel — aldrig ett rejected promise.
// Ingendera fäller den anropande mutationen (som `void`-anropar denna
// funktion i onSuccess, aldrig awaitar den).

import { expect, test } from '@playwright/test';
import { recordActivity } from '../../src/data/activityLog/recordActivity';
import type { DataSourceAdapter } from '../../src/data/adapters/DataSourceAdapter';
import {
  EVENT_ID_EXTENSION_IRI,
  REQUEST_ID_EXTENSION_IRI,
} from '../../src/domain/schemas/ActivityStatement.schema';

/** Minimal `DataSourceAdapter`-stub — bara `recordActivity` behöver ett
 * konkret beteende, resten är oanvänd av testet (aldrig anropad). */
function stubAdapter(recordActivityImpl: DataSourceAdapter['recordActivity']): DataSourceAdapter {
  return {
    recordActivity: recordActivityImpl,
  } as DataSourceAdapter;
}

const VALID_INPUT = {
  actor: { id: 'a1b2c3d4-0000-4000-8000-000000000001', name: 'Lotta' },
  verb: {
    id: 'https://admin.miranon.dev/xapi/verbs/markerade-betalning',
    display: { 'sv-SE': 'markerade betalning' },
  },
  object: {
    id: 'https://admin.miranon.dev/xapi/objects/registrations/recANM0000000001',
    type: 'https://admin.miranon.dev/xapi/activity-types/betalning',
    name: 'Anna Andersson (Fjärrskådning 2)',
  },
};

test.describe('recordActivity — fire-and-forget (TASK-201.3 AC #1)', () => {
  test('riktning 1/2: dataSource.recordActivity LYCKAS → resolvar utan fel, korrekt statement byggt', async () => {
    let mottagetStatement: unknown;
    const dataSource = stubAdapter(async (statement) => {
      mottagetStatement = statement;
      return { id: statement.id, requestId: 'test-request-id', occurredAt: statement.timestamp };
    });

    await expect(recordActivity({ dataSource, ...VALID_INPUT })).resolves.toBeUndefined();

    expect(mottagetStatement).toBeDefined();
    const stmt = mottagetStatement as {
      actor: { name: string; account: { name: string } };
      verb: { display: Record<string, string> };
      object: { definition: { name: Record<string, string> } };
      context: { extensions: Record<string, string> };
    };
    expect(stmt.actor.name).toBe('Lotta');
    expect(stmt.actor.account.name).toBe(VALID_INPUT.actor.id);
    expect(stmt.verb.display['sv-SE']).toBe('markerade betalning');
    expect(stmt.object.definition.name['sv-SE']).toBe('Anna Andersson (Fjärrskådning 2)');
    expect(stmt.context.extensions[REQUEST_ID_EXTENSION_IRI]).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  test('riktning 2/2: dataSource.recordActivity KASTAR (nätverksfel) → recordActivity() resolvar ÄNDÅ — ALDRIG ett rejected promise', async () => {
    const dataSource = stubAdapter(async () => {
      throw new Error('Simulerat nätverksfel — log-activity-EF nere');
    });

    // DEN KRITISKA ASSERTIONEN: .resolves, inte .rejects. Om recordActivity
    // någonsin lät felet propagera skulle detta test fälla — och en
    // anropande mutations `void recordActivity(...)` skulle bli ett
    // unhandled promise rejection i produktion.
    await expect(recordActivity({ dataSource, ...VALID_INPUT })).resolves.toBeUndefined();
  });

  test('riktning 2/2b: dataSource.recordActivity avvisar (rejected promise, inte throw) → samma garanti', async () => {
    const dataSource = stubAdapter(() => Promise.reject(new Error('EF avvisade: 500')));

    await expect(recordActivity({ dataSource, ...VALID_INPUT })).resolves.toBeUndefined();
  });

  test('försvar: ett ogiltigt actor-namn (tom sträng) faller tillbaka till en icke-tom platshållare — statementet är fortfarande giltigt', async () => {
    let mottagetStatement: unknown;
    const dataSource = stubAdapter(async (statement) => {
      mottagetStatement = statement;
      return { id: statement.id, requestId: 'x', occurredAt: statement.timestamp };
    });

    await recordActivity({
      dataSource,
      ...VALID_INPUT,
      actor: { id: VALID_INPUT.actor.id, name: null },
    });

    const stmt = mottagetStatement as { actor: { name: string } } | undefined;
    expect(stmt?.actor.name).toBe('Okänd användare');
  });

  // TASK-201.4: betalar 201.3s deferrade EVENT_ID_EXTENSION_IRI-skuld — se
  // recordActivity.ts's `eventId`-fält. BÅDA riktningarna, samma disciplin
  // som fire-and-forget-testerna ovan.
  test('EVENT_ID_EXTENSION_IRI riktning 1/2: eventId angivet → buret i context.extensions under RÄTT nyckel', async () => {
    let mottagetStatement: unknown;
    const dataSource = stubAdapter(async (statement) => {
      mottagetStatement = statement;
      return { id: statement.id, requestId: 'test-request-id', occurredAt: statement.timestamp };
    });

    await recordActivity({ dataSource, ...VALID_INPUT, eventId: 'recEVENT00000001' });

    const stmt = mottagetStatement as {
      context: { extensions: Record<string, string> };
    };
    expect(stmt.context.extensions[EVENT_ID_EXTENSION_IRI]).toBe('recEVENT00000001');
    // RAK STRÄNG, inte en URL-inpackad form — matchar `get-activity-log`s
    // `.contains()`-filter EXAKT (`supabase/functions/get-activity-log/
    // index.ts`: `context: { extensions: { [EVENT_ID_EXTENSION_IRI]: eventId } }`,
    // rätt om värdet vore omskrivet till en IRI hade filtret aldrig matchat).
  });

  test('EVENT_ID_EXTENSION_IRI riktning 2/2: eventId UTELÄMNAT → nyckeln saknas helt (aldrig en tom sträng eller undefined-VÄRDE)', async () => {
    let mottagetStatement: unknown;
    const dataSource = stubAdapter(async (statement) => {
      mottagetStatement = statement;
      return { id: statement.id, requestId: 'test-request-id', occurredAt: statement.timestamp };
    });

    await recordActivity({ dataSource, ...VALID_INPUT });

    const stmt = mottagetStatement as {
      context: { extensions: Record<string, string> };
    };
    expect(Object.hasOwn(stmt.context.extensions, EVENT_ID_EXTENSION_IRI)).toBe(false);
  });
});
