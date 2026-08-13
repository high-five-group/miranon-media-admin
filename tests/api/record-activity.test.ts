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
import type { QueryClient } from '@tanstack/react-query';
import { recordActivity } from '../../src/data/activityLog/recordActivity';
import type { DataSourceAdapter } from '../../src/data/adapters/DataSourceAdapter';
import {
  EVENT_ID_EXTENSION_IRI,
  PERSON_ID_EXTENSION_IRI,
  REQUEST_ID_EXTENSION_IRI,
} from '../../src/domain/schemas/ActivityStatement.schema';
import { queryKeys } from '../../src/queries/keys';

/** Minimal `DataSourceAdapter`-stub — bara `recordActivity` behöver ett
 * konkret beteende, resten är oanvänd av testet (aldrig anropad). */
function stubAdapter(recordActivityImpl: DataSourceAdapter['recordActivity']): DataSourceAdapter {
  return {
    recordActivity: recordActivityImpl,
  } as DataSourceAdapter;
}

/**
 * No-op-`QueryClient` för de tester som inte prövar invalideringen (TASK-210).
 * Samma injektionsmönster som `stubAdapter` ovan — bara den metod funktionen
 * faktiskt rör behöver ett beteende.
 */
function stubQueryClient(): QueryClient {
  return { invalidateQueries: () => {} } as unknown as QueryClient;
}

/**
 * Spion-`QueryClient` (TASK-210): fångar VARJE `invalidateQueries`-anrops
 * filter-argument i anropsordning, så både ATT den kallas och MED VAD kan
 * mätas — och lika viktigt: att den INTE kallas när loggningen fallerade.
 * `impl` låter ett test byta ut beteendet (kasta, eller aldrig resolva).
 */
function spionQueryClient(impl?: () => unknown): {
  queryClient: QueryClient;
  anrop: unknown[];
} {
  const anrop: unknown[] = [];
  const queryClient = {
    invalidateQueries: (filters: unknown) => {
      anrop.push(filters);
      return impl ? impl() : undefined;
    },
  } as unknown as QueryClient;
  return { queryClient, anrop };
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

    await expect(
      recordActivity({ dataSource, queryClient: stubQueryClient(), ...VALID_INPUT }),
    ).resolves.toBeUndefined();

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
    await expect(
      recordActivity({ dataSource, queryClient: stubQueryClient(), ...VALID_INPUT }),
    ).resolves.toBeUndefined();
  });

  test('riktning 2/2b: dataSource.recordActivity avvisar (rejected promise, inte throw) → samma garanti', async () => {
    const dataSource = stubAdapter(() => Promise.reject(new Error('EF avvisade: 500')));

    await expect(
      recordActivity({ dataSource, queryClient: stubQueryClient(), ...VALID_INPUT }),
    ).resolves.toBeUndefined();
  });

  test('försvar: ett ogiltigt actor-namn (tom sträng) faller tillbaka till en icke-tom platshållare — statementet är fortfarande giltigt', async () => {
    let mottagetStatement: unknown;
    const dataSource = stubAdapter(async (statement) => {
      mottagetStatement = statement;
      return { id: statement.id, requestId: 'x', occurredAt: statement.timestamp };
    });

    await recordActivity({
      dataSource,
      queryClient: stubQueryClient(),
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

    await recordActivity({
      dataSource,
      queryClient: stubQueryClient(),
      ...VALID_INPUT,
      eventId: 'recEVENT00000001',
    });

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

    await recordActivity({ dataSource, queryClient: stubQueryClient(), ...VALID_INPUT });

    const stmt = mottagetStatement as {
      context: { extensions: Record<string, string> };
    };
    expect(Object.hasOwn(stmt.context.extensions, EVENT_ID_EXTENSION_IRI)).toBe(false);
  });

  // TASK-201.12: stänger 201.6s öppna personnavigerings-gap — se
  // recordActivity.ts's `personId`-fält. EXAKT samma bevis-form som
  // EVENT_ID_EXTENSION_IRI-testerna ovan (BÅDA riktningarna).
  test('PERSON_ID_EXTENSION_IRI riktning 1/2: personId angivet → buret i context.extensions under RÄTT nyckel', async () => {
    let mottagetStatement: unknown;
    const dataSource = stubAdapter(async (statement) => {
      mottagetStatement = statement;
      return { id: statement.id, requestId: 'test-request-id', occurredAt: statement.timestamp };
    });

    await recordActivity({
      dataSource,
      queryClient: stubQueryClient(),
      ...VALID_INPUT,
      personId: 'recPER0000000001',
    });

    const stmt = mottagetStatement as {
      context: { extensions: Record<string, string> };
    };
    expect(stmt.context.extensions[PERSON_ID_EXTENSION_IRI]).toBe('recPER0000000001');
    // RAK STRÄNG, inte en URL-inpackad form — samma disciplin som
    // EVENT_ID_EXTENSION_IRI-testet ovan förklarar (matchar en framtida
    // `.contains()`-filter EXAKT om läsvägen någon gång bygger ett).
  });

  test('PERSON_ID_EXTENSION_IRI riktning 2/2: personId UTELÄMNAT → nyckeln saknas helt (aldrig en tom sträng eller undefined-VÄRDE)', async () => {
    let mottagetStatement: unknown;
    const dataSource = stubAdapter(async (statement) => {
      mottagetStatement = statement;
      return { id: statement.id, requestId: 'test-request-id', occurredAt: statement.timestamp };
    });

    await recordActivity({ dataSource, queryClient: stubQueryClient(), ...VALID_INPUT });

    const stmt = mottagetStatement as {
      context: { extensions: Record<string, string> };
    };
    expect(Object.hasOwn(stmt.context.extensions, PERSON_ID_EXTENSION_IRI)).toBe(false);
  });

  test('PERSON_ID_EXTENSION_IRI och EVENT_ID_EXTENSION_IRI samexisterar oberoende — vardera buren eller utelämnad efter sitt eget fält', async () => {
    let mottagetStatement: unknown;
    const dataSource = stubAdapter(async (statement) => {
      mottagetStatement = statement;
      return { id: statement.id, requestId: 'test-request-id', occurredAt: statement.timestamp };
    });

    await recordActivity({
      dataSource,
      queryClient: stubQueryClient(),
      ...VALID_INPUT,
      eventId: 'recEVENT00000001',
      personId: 'recPER0000000001',
    });

    const stmt = mottagetStatement as {
      context: { extensions: Record<string, string> };
    };
    expect(stmt.context.extensions[EVENT_ID_EXTENSION_IRI]).toBe('recEVENT00000001');
    expect(stmt.context.extensions[PERSON_ID_EXTENSION_IRI]).toBe('recPER0000000001');
  });

  // TASK-210 (Marcus-order 2026-08-13 "Lös det!"): hem-spalten serverade
  // cachad data i upp till fem minuter efter en loggad handling. BÅDA
  // riktningarna, samma disciplin som fire-and-forget-testerna ovan — plus
  // två tester som skyddar själva kontraktet mot den nya raden.
  test('invalidering riktning 1/2: loggningen LYCKAS → aktivitetsloggens gren invalideras EXAKT en gång, på PREFIXET', async () => {
    const { queryClient, anrop } = spionQueryClient();
    const dataSource = stubAdapter(async (statement) => ({
      id: statement.id,
      requestId: 'test-request-id',
      occurredAt: statement.timestamp,
    }));

    await recordActivity({ dataSource, queryClient, ...VALID_INPUT });

    // EXAKT en gång — ingen kaskad.
    expect(anrop).toHaveLength(1);
    // PREFIXET, inte `latest`-nyckeln ensam: en ny post gör HELA loggen
    // inaktuell, och hem-spalten (`latest`) respektive historikvyn
    // (`history`) delar bara detta prefix. Literal, inte härledd via
    // spread — hade testet skrivit `queryKeys.activityLog.all` på båda
    // sidor vore det en tautologi.
    expect(anrop[0]).toEqual({ queryKey: ['activityLog'] });
    // ... och nyckelmodulen bär faktiskt den formen (bindningen prövad separat).
    expect(queryKeys.activityLog.all).toEqual(['activityLog']);
  });

  test('invalidering riktning 2/2: loggningen KASTAR → INGEN invalidering (ingen omhämtning för en post som aldrig skrevs)', async () => {
    const { queryClient, anrop } = spionQueryClient();
    const dataSource = stubAdapter(async () => {
      throw new Error('Simulerat nätverksfel — log-activity-EF nere');
    });

    // Kontraktet håller alltjämt: resolvar trots felet.
    await expect(
      recordActivity({ dataSource, queryClient, ...VALID_INPUT }),
    ).resolves.toBeUndefined();

    // DEN KRITISKA ASSERTIONEN: noll anrop. Invalideringen ligger EFTER
    // `await`:en i try-blocket, så en fallerad skrivning kan aldrig utlösa
    // ett nätverksanrop för data som inte förändrats.
    expect(anrop).toHaveLength(0);
  });

  test('kontraktet överlever en TRASIG cache-yta: invalidateQueries kastar → recordActivity resolvar ändå', async () => {
    const { queryClient } = spionQueryClient(() => {
      throw new Error('Simulerat fel inuti invalidateQueries');
    });
    const dataSource = stubAdapter(async (statement) => ({
      id: statement.id,
      requestId: 'x',
      occurredAt: statement.timestamp,
    }));

    // Invalideringen ligger INNE i try-blocket → dess fel fångas som allt
    // annat och når aldrig den anropande mutationen.
    await expect(
      recordActivity({ dataSource, queryClient, ...VALID_INPUT }),
    ).resolves.toBeUndefined();
  });

  test('invalideringen BLOCKERAR INTE: en aldrig-resolvande invalidateQueries fördröjer inte recordActivity', async () => {
    // Ett promise som ALDRIG resolvar. Hade raden `await`:ats skulle
    // recordActivity hänga för evigt och testet falla på timeout — detta är
    // det mekaniska beviset för att fire-and-forget-kontraktet står orört.
    const { queryClient, anrop } = spionQueryClient(() => new Promise<void>(() => {}));
    const dataSource = stubAdapter(async (statement) => ({
      id: statement.id,
      requestId: 'x',
      occurredAt: statement.timestamp,
    }));

    await expect(
      recordActivity({ dataSource, queryClient, ...VALID_INPUT }),
    ).resolves.toBeUndefined();
    // Den anropades faktiskt — testet passerar inte av att raden hoppades över.
    expect(anrop).toHaveLength(1);
  });
});
