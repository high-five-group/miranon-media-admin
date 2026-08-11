// Kontrakts-svit för ActivityStatementSchema (xAPI-statement, TASK-201.1 AC #4).
//
// api-pure (ren logik, ingen staging) → körs lokalt + CI utan creds. Bevisar
// BÅDA riktningarna (rött-först-disciplinen, ADR-071): giltiga xAPI-statements
// PASSERAR parse, och varenda avvikelse från vår profil (actor/verb/object/
// context/timestamp, IRI-nycklat verb + extensions, obligatorisk `requestId`
// under en dedikerad IRI-nyckel) AVVISAS — ett ogiltigt statement får aldrig
// nå `activity_log` (DoD #6). Formen speglar `attendance-schema.test.ts`
// (PRD `TASK-201` § Testbeslut: "förebild attendance-schema-testet").

import { expect, test } from '@playwright/test';
import {
  ActivityStatementSchema,
  REQUEST_ID_EXTENSION_IRI,
  XAPI_IRI_BASE,
} from '../../src/domain/schemas/ActivityStatement.schema';

/** Ett komplett, giltigt xAPI-statement — "Lotta markerade en anmälan som betald". */
function activityStatement(overrides: Record<string, unknown> = {}) {
  return {
    id: '5f2c9b1a-6b0e-4b8a-9b8f-1a2b3c4d5e6f',
    actor: {
      objectType: 'Agent',
      name: 'Lotta',
      account: {
        homePage: 'https://admin.miranon.dev',
        name: 'a1b2c3d4-0000-4000-8000-000000000001',
      },
    },
    verb: {
      id: `${XAPI_IRI_BASE}/verbs/markera-betald`,
      display: { 'sv-SE': 'markerade som betald' },
    },
    object: {
      objectType: 'Activity',
      id: `${XAPI_IRI_BASE}/entities/anmalningar/recANM0000000001`,
      definition: {
        name: { 'sv-SE': 'Anna Andersson — Fjärrskådning 2' },
        type: `${XAPI_IRI_BASE}/activities/betalning`,
      },
    },
    context: {
      extensions: {
        [REQUEST_ID_EXTENSION_IRI]: 'c9d8e7f6-1111-4222-8333-444455556666',
      },
    },
    timestamp: '2026-08-11T14:22:00.000Z',
    ...overrides,
  };
}

test.describe('ActivityStatementSchema — giltiga statements passerar (TASK-201.1 AC #4)', () => {
  test('ett komplett, giltigt statement parsar rakt av', () => {
    const parsed = ActivityStatementSchema.parse(activityStatement());
    expect(parsed.actor.name).toBe('Lotta');
    expect(parsed.verb.display['sv-SE']).toBe('markerade som betald');
    expect(parsed.object.definition.type).toBe(`${XAPI_IRI_BASE}/activities/betalning`);
    expect(parsed.context.extensions[REQUEST_ID_EXTENSION_IRI]).toBe(
      'c9d8e7f6-1111-4222-8333-444455556666',
    );
  });

  test('Language Map med FLER språknycklar (framtida Passionslyftet-konsument) parsar', () => {
    const parsed = ActivityStatementSchema.parse(
      activityStatement({
        verb: {
          id: `${XAPI_IRI_BASE}/verbs/markera-betald`,
          display: { 'sv-SE': 'markerade som betald', 'en-US': 'marked as paid' },
        },
      }),
    );
    expect(parsed.verb.display['en-US']).toBe('marked as paid');
  });

  test('extra (okänd) extension-nyckel utöver requestId tillåts (öppen catchall)', () => {
    const parsed = ActivityStatementSchema.parse(
      activityStatement({
        context: {
          extensions: {
            [REQUEST_ID_EXTENSION_IRI]: 'c9d8e7f6-1111-4222-8333-444455556666',
            'https://admin.miranon.dev/xapi/extensions/eventId': 'recEVT0000000001',
          },
        },
      }),
    );
    expect(parsed.context.extensions['https://admin.miranon.dev/xapi/extensions/eventId']).toBe(
      'recEVT0000000001',
    );
  });
});

test.describe('ActivityStatementSchema — ogiltiga statements AVVISAS (TASK-201.1 AC #4 + DoD #6)', () => {
  test('actor SAKNAS helt → parse FAILAR', () => {
    const { actor: _omit, ...utan } = activityStatement();
    expect(() => ActivityStatementSchema.parse(utan)).toThrow();
  });

  test('actor.objectType fel literal (inte "Agent") → parse FAILAR', () => {
    expect(() =>
      ActivityStatementSchema.parse(
        activityStatement({
          actor: {
            objectType: 'Group',
            name: 'Lotta',
            account: {
              homePage: 'https://admin.miranon.dev',
              name: 'a1b2c3d4-0000-4000-8000-000000000001',
            },
          },
        }),
      ),
    ).toThrow();
  });

  test('actor.account.name inte en giltig UUID → parse FAILAR', () => {
    expect(() =>
      ActivityStatementSchema.parse(
        activityStatement({
          actor: {
            objectType: 'Agent',
            name: 'Lotta',
            account: { homePage: 'https://admin.miranon.dev', name: 'lotta' },
          },
        }),
      ),
    ).toThrow();
  });

  test('verb.id inte en giltig IRI (ej URL) → parse FAILAR', () => {
    expect(() =>
      ActivityStatementSchema.parse(
        activityStatement({
          verb: { id: 'markera-betald', display: { 'sv-SE': 'markerade som betald' } },
        }),
      ),
    ).toThrow();
  });

  test('verb.display tom Language Map → parse FAILAR', () => {
    expect(() =>
      ActivityStatementSchema.parse(
        activityStatement({
          verb: { id: `${XAPI_IRI_BASE}/verbs/markera-betald`, display: {} },
        }),
      ),
    ).toThrow();
  });

  test('object.definition SAKNAS → parse FAILAR', () => {
    const stmt = activityStatement();
    const { definition: _omit, ...objectUtanDefinition } = stmt.object as Record<string, unknown>;
    expect(() =>
      ActivityStatementSchema.parse({ ...stmt, object: objectUtanDefinition }),
    ).toThrow();
  });

  test('object.objectType fel literal (inte "Activity") → parse FAILAR', () => {
    const stmt = activityStatement();
    expect(() =>
      ActivityStatementSchema.parse({
        ...stmt,
        object: { ...(stmt.object as Record<string, unknown>), objectType: 'Agent' },
      }),
    ).toThrow();
  });

  test('context.extensions SAKNAR requestId-nyckeln → parse FAILAR', () => {
    expect(() =>
      ActivityStatementSchema.parse(activityStatement({ context: { extensions: {} } })),
    ).toThrow();
  });

  test('context.extensions[requestId] inte en giltig UUID → parse FAILAR', () => {
    expect(() =>
      ActivityStatementSchema.parse(
        activityStatement({
          context: { extensions: { [REQUEST_ID_EXTENSION_IRI]: 'inte-en-uuid' } },
        }),
      ),
    ).toThrow();
  });

  test('id (statementets eget) inte en giltig UUID → parse FAILAR', () => {
    expect(() => ActivityStatementSchema.parse(activityStatement({ id: 'abc123' }))).toThrow();
  });

  test('timestamp inte ISO 8601 → parse FAILAR', () => {
    expect(() =>
      ActivityStatementSchema.parse(activityStatement({ timestamp: '11 augusti 2026' })),
    ).toThrow();
  });
});
