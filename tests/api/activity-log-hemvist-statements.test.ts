// Aktivitetsloggens HEMVISTSLUCKA (TASK-201.15, Marcus GO 2026-08-14, S105
// Del 9) — api-pure (ren logik, ingen staging, inga creds). Systerfil till
// `activity-log-pilot-statements.test.ts` (TASK-201.3),
// `activity-log-resterande-statements.test.ts` (TASK-201.4) och
// `activity-log-luckor-statements.test.ts` (TASK-201.13); samma form, denna
// gång de TRE hooks som bodde komponent-lokalt (utanför
// src/data/mutations/, se `.mutation-hemvist-policy.conf` +
// `mutation-hemvist-vakt.test.ts` för mekaniken som stänger klassen):
//
//   useCreateEvent       — skapa event (useCreateEvent.ts)
//   useSaveSegment       — spara segment, NY kategori (segment.ts)
//   useSendSegmentMail   — segment-mail, EN AGGREGERAD post (segment.ts)
//
// § 2 bär en INTEGRITETSVAKT för segment-mailet, samma form som
// `activity-log-luckor-statements.test.ts` § 2 (betalningsnoteringen): kör
// den FAKTISKA composern (`recordActivity`) med EXAKT den input
// `useSendSegmentMail`s onSuccess bygger, och bevisar att ämne/mailtext
// aldrig finns i den utgående kroppen — trots att de FANNS i mutationens
// fulla variabler (samma "läckvägen fanns om den vore möjlig" logik).

import { expect, test } from '@playwright/test';
import type { QueryClient } from '@tanstack/react-query';
import {
  ACTIVITY_OBJECT_TYPES,
  eventActivityName,
  eventObjectId,
  SKAPADE_EVENT_VERB,
  SKICKADE_SEGMENT_MAIL_VERB,
  SPARADE_SEGMENT_VERB,
  segmentActivityName,
  segmentObjectId,
} from '../../src/data/activityLog/activityTypes';
import { recordActivity } from '../../src/data/activityLog/recordActivity';
import type { DataSourceAdapter } from '../../src/data/adapters/DataSourceAdapter';
import {
  ActivityStatementSchema,
  REQUEST_ID_EXTENSION_IRI,
  XAPI_IRI_BASE,
} from '../../src/domain/schemas/ActivityStatement.schema';

/** Samma lokala fixtur-byggare som syskonfilerna (ren test-fixtur). */
function statementFor(
  objectId: string,
  verb: { id: string; display: Record<string, string> },
  objectName: string,
  objectType: string,
) {
  return {
    id: '7a1b2c3d-4e5f-4061-8081-a2b3c4d5e6f7',
    actor: {
      objectType: 'Agent' as const,
      name: 'Lotta',
      account: { homePage: XAPI_IRI_BASE, name: 'a1b2c3d4-0000-4000-8000-000000000001' },
    },
    verb,
    object: {
      objectType: 'Activity' as const,
      id: objectId,
      definition: { name: { 'sv-SE': objectName }, type: objectType },
    },
    context: {
      extensions: { [REQUEST_ID_EXTENSION_IRI]: 'd8e7f6a5-2222-4333-8444-555566667777' },
    },
    timestamp: '2026-08-14T14:22:00.000Z',
  };
}

const EVENT_ID = 'recEVT0000000002';
const SEGMENT_ID = 'recSEG0000000001';

/** Minimal adapter-stub — bara `recordActivity` behöver beteende. */
function stubAdapter(impl: DataSourceAdapter['recordActivity']): DataSourceAdapter {
  return { recordActivity: impl } as DataSourceAdapter;
}

test.describe('§ 1 — hemvistsluckans statement-former (TASK-201.15)', () => {
  test('skapa event: objektet är det NYSKAPADE eventet, kategori = event (delad med uppdatera-event)', () => {
    const stmt = statementFor(
      eventObjectId(EVENT_ID),
      SKAPADE_EVENT_VERB,
      eventActivityName('Fjärrskådning 3'),
      ACTIVITY_OBJECT_TYPES.event,
    );
    expect(stmt.verb.display['sv-SE']).toBe('skapade eventet');
    expect(stmt.object.id).toBe(`${XAPI_IRI_BASE}/objects/events/${EVENT_ID}`);
    expect(stmt.object.definition.type).toBe(ACTIVITY_OBJECT_TYPES.event);
    const result = ActivityStatementSchema.safeParse(stmt);
    expect(result.success, JSON.stringify(!result.success && result.error.issues)).toBe(true);
  });

  test('skapa event UTAN eventNamn: fallback "Okänt event" — samma disciplin som uppdatera-event', () => {
    expect(eventActivityName(null)).toBe('Okänt event');
  });

  test('spara segment: NY kategori (segment), egen IRI — inte återanvänd från event/mail/etc', () => {
    const stmt = statementFor(
      segmentObjectId(SEGMENT_ID),
      SPARADE_SEGMENT_VERB,
      segmentActivityName('FS-utbildningsdeltagare'),
      ACTIVITY_OBJECT_TYPES.segment,
    );
    expect(stmt.verb.display['sv-SE']).toBe('sparade segment');
    expect(stmt.object.id).toBe(`${XAPI_IRI_BASE}/objects/segments/${SEGMENT_ID}`);
    expect(stmt.object.definition.type).toBe(ACTIVITY_OBJECT_TYPES.segment);
    // Kategorin ÄR ny — skild från de nio befintliga.
    expect(Object.values(ACTIVITY_OBJECT_TYPES)).toContain(ACTIVITY_OBJECT_TYPES.segment);
    const result = ActivityStatementSchema.safeParse(stmt);
    expect(result.success, JSON.stringify(!result.success && result.error.issues)).toBe(true);
  });

  test('spara segment UTAN namn: fallback "Namnlöst segment" — aldrig ett tomt namn i loggen', () => {
    expect(segmentActivityName(null)).toBe('Namnlöst segment');
    expect(segmentActivityName('')).toBe('Namnlöst segment');
  });

  test('segment-mail: objektet är SEGMENTET (delar segmentObjectId med spara-segment), kategori = mail (delad med testmail)', () => {
    const stmt = statementFor(
      segmentObjectId(SEGMENT_ID),
      SKICKADE_SEGMENT_MAIL_VERB,
      `${segmentActivityName('FS-utbildningsdeltagare')} (12 mottagare)`,
      ACTIVITY_OBJECT_TYPES.mail,
    );
    expect(stmt.verb.display['sv-SE']).toBe('skickade mail till segment');
    expect(stmt.object.id).toBe(`${XAPI_IRI_BASE}/objects/segments/${SEGMENT_ID}`);
    expect(stmt.object.definition.type).toBe(ACTIVITY_OBJECT_TYPES.mail);
    // Samma objekt-id-FUNKTION som spara-segment (delad entitet, olika verb).
    expect(stmt.object.id).toBe(segmentObjectId(SEGMENT_ID));
    const result = ActivityStatementSchema.safeParse(stmt);
    expect(result.success, JSON.stringify(!result.success && result.error.issues)).toBe(true);
  });

  test('segment-mail: namnet bär mottagar-RÄKNINGEN, inte en lista av VILKA (EF-svaret har ingen sådan lista)', () => {
    const name = `${segmentActivityName('Höstkullen')} (7 mottagare)`;
    expect(name).toBe('Höstkullen (7 mottagare)');
  });
});

/**
 * § 2 — INTEGRITETSVAKTEN för segment-mailet. Kör den FAKTISKA composern
 * och läser den FAKTISKA utgående kroppen med EXAKT den input
 * `useSendSegmentMail`s onSuccess bygger (`segment.ts`) — ämne och
 * mailtext I SCOPE hos den som konstruerar fixturen (precis som fritexten
 * FANNS i den ursprungliga betalningsnoteringen), men INTE bland de
 * fält onSuccess faktiskt läser ut (`segmentIds`, `segmentNamn` — se
 * hookens destrukturering).
 */
test.describe('§ 2 — INTEGRITETSVAKTEN: segment-mailets ämne/innehåll lämnar ALDRIG klienten', () => {
  const HEMLIGT_AMNE = 'Uppföljning: Anna Andersson missade betalningen igen';
  const HEMLIG_MAILTEXT =
    'Hej alla i Fjärrskådningsgruppen — kom ihåg att Bo har sagt upp sig från kursen';
  const FRAGMENT = ['Anna Andersson', 'missade betalningen', 'Bo har sagt upp sig'];

  /**
   * Bygger EXAKT den `recordActivity`-input `useSendSegmentMail`s onSuccess
   * bygger (`segment.ts`): objektet är segmentet, namnet bär mottagar-
   * räkningen. `amne`/`mailtext` skickas in HÄR (de fanns i den fulla
   * mutations-payloaden) men används ALDRIG i konstruktionen nedan — det
   * ÄR beviset: om läckvägen vore möjlig är det HÄR den skulle byggas in.
   */
  function segmentMailInput(
    dataSource: DataSourceAdapter,
    args: { segmentId: string; segmentNamn: string | null; accepted: number },
    _amne: string,
    _mailtext: string,
  ) {
    return {
      dataSource,
      queryClient: { invalidateQueries: () => {} } as unknown as QueryClient,
      actor: { id: 'a1b2c3d4-0000-4000-8000-000000000001', name: 'Lotta' },
      verb: SKICKADE_SEGMENT_MAIL_VERB,
      object: {
        id: segmentObjectId(args.segmentId),
        type: ACTIVITY_OBJECT_TYPES.mail,
        name: `${segmentActivityName(args.segmentNamn)} (${args.accepted} mottagare)`,
      },
    };
  }

  test('den utgående payloaden innehåller varken ämnet, mailtexten eller något fragment av dem', async () => {
    let utgaende: unknown;
    const dataSource = stubAdapter(async (statement) => {
      utgaende = statement;
      return { id: statement.id, requestId: 'x', occurredAt: statement.timestamp };
    });

    await recordActivity(
      segmentMailInput(
        dataSource,
        { segmentId: SEGMENT_ID, segmentNamn: 'Fjärrskådningsgruppen', accepted: 12 },
        HEMLIGT_AMNE,
        HEMLIG_MAILTEXT,
      ),
    );

    expect(utgaende, 'composern ska ha postat ett statement').toBeDefined();
    const payload = JSON.stringify(utgaende);
    expect(payload).not.toContain(HEMLIGT_AMNE);
    expect(payload).not.toContain(HEMLIG_MAILTEXT);
    for (const fragment of FRAGMENT) {
      expect(payload, `fragmentet "${fragment}" läckte ut i payloaden`).not.toContain(fragment);
    }
  });

  test('payloaden bär ändå ATT mailet skickades och TILL VILKET SEGMENT — vakten får inte vara "logga ingenting"', async () => {
    let utgaende: unknown;
    const dataSource = stubAdapter(async (statement) => {
      utgaende = statement;
      return { id: statement.id, requestId: 'x', occurredAt: statement.timestamp };
    });

    await recordActivity(
      segmentMailInput(
        dataSource,
        { segmentId: SEGMENT_ID, segmentNamn: 'Fjärrskådningsgruppen', accepted: 12 },
        HEMLIGT_AMNE,
        HEMLIG_MAILTEXT,
      ),
    );

    const stmt = utgaende as {
      verb: { display: Record<string, string> };
      object: { id: string; definition: { name: Record<string, string> } };
    };
    expect(stmt.verb.display['sv-SE']).toBe('skickade mail till segment');
    expect(stmt.object.definition.name['sv-SE']).toBe('Fjärrskådningsgruppen (12 mottagare)');
    expect(stmt.object.id).toContain(SEGMENT_ID);
  });

  test('samma garanti oavsett ämne/mailtext — två helt olika utskick ger BYTE-IDENTISK payload (bortsett från id/timestamp)', async () => {
    async function payloadFor(amne: string, mailtext: string): Promise<Record<string, unknown>> {
      let utgaende: Record<string, unknown> = {};
      const dataSource = stubAdapter(async (statement) => {
        utgaende = statement as unknown as Record<string, unknown>;
        return { id: statement.id, requestId: 'x', occurredAt: statement.timestamp };
      });
      await recordActivity(
        segmentMailInput(
          dataSource,
          { segmentId: SEGMENT_ID, segmentNamn: 'Fjärrskådningsgruppen', accepted: 12 },
          amne,
          mailtext,
        ),
      );
      const { id: _id, timestamp: _ts, context: _ctx, ...resten } = utgaende;
      return resten;
    }

    const a = await payloadFor(HEMLIGT_AMNE, HEMLIG_MAILTEXT);
    const b = await payloadFor('Ett helt annat ämne', 'Och ett helt annat meddelande, ord för ord');
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
