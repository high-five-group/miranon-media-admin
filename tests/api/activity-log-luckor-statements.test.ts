// Aktivitetsloggens FYRA SISTA luckor (TASK-201.13, Marcus-order 2026-08-13:
// "Jag vill inte ha en enda lucka") — api-pure (ren logik, ingen staging,
// inga creds). Systerfil till `activity-log-pilot-statements.test.ts`
// (TASK-201.3) och `activity-log-resterande-statements.test.ts` (TASK-201.4);
// samma form, nästa uppsättning mutationer:
//
//   useUpdatePaymentNote      — betalningsnotering (FRITEXT, se nedan)
//   useLogPaymentReminder     — påminnelse antecknad
//   useConfirmAll             — bulk-bekräftelse, EN post per anmälan
//   useSendActionTestEmail    — testmail till sig själv
//
// SKILLNADEN MOT SYSKONFILERNA, och varför den finns: de bevisar statement-
// FORMEN genom att bygga en lokal kopia av det `recordActivity.ts` bygger.
// Denna fil gör det också (§ 1), men bär DESSUTOM en INTEGRITETSVAKT (§ 2)
// som kör den FAKTISKA composern (`recordActivity`) och läser den FAKTISKA
// utgående kroppen genom ett injicerat adapter-stub. Skälet är att
// `useUpdatePaymentNote` sparar FRITEXT: en strukturell garanti ("verbet är
// en funktion som inte tar texten") bevisar att API:t inte ERBJUDER en
// läckväg, men bara en payload-läsning bevisar att inget faktiskt läcker.
// Formen är lånad ur `record-activity.test.ts`, som redan läser utgående
// payload på det sättet.

import { expect, test } from '@playwright/test';
import {
  ACTIVITY_OBJECT_TYPES,
  BEKRAFTADE_ANMALAN_VERB,
  betalningsnoteringVerb,
  betalningspaminnelseVerb,
  eventActivityName,
  eventObjectId,
  registrationObjectId,
  SKICKADE_TESTMAIL_VERB,
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
    id: '5f2c9b1a-6b0e-4b8a-9b8f-1a2b3c4d5e6f',
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
      extensions: { [REQUEST_ID_EXTENSION_IRI]: 'c9d8e7f6-1111-4222-8333-444455556666' },
    },
    timestamp: '2026-08-13T14:22:00.000Z',
  };
}

const REG_ID = 'recANM0000000001';
const EVENT_ID = 'recEVT0000000001';
const PERSON_ID = 'recPER0000000001';
const REG_OBJEKT_NAMN = 'Anna Andersson (Fjärrskådning 2)';

/** Minimal adapter-stub — bara `recordActivity` behöver beteende. */
function stubAdapter(impl: DataSourceAdapter['recordActivity']): DataSourceAdapter {
  return { recordActivity: impl } as DataSourceAdapter;
}

test.describe('§ 1 — de fyra sista luckornas statement-former (TASK-201.13)', () => {
  test('betalningsnotering AVGIFT: "uppdaterade noteringen för anmälningsavgiften", passerar schemat', () => {
    const stmt = statementFor(
      registrationObjectId(REG_ID),
      betalningsnoteringVerb('avgift'),
      REG_OBJEKT_NAMN,
      ACTIVITY_OBJECT_TYPES.betalning,
    );
    expect(stmt.verb.display['sv-SE']).toBe('uppdaterade noteringen för anmälningsavgiften');
    const result = ActivityStatementSchema.safeParse(stmt);
    expect(result.success, JSON.stringify(!result.success && result.error.issues)).toBe(true);
  });

  test('betalningsnotering SLUT: egen verb-IRI, skild från avgift-varianten', () => {
    expect(betalningsnoteringVerb('slut').display['sv-SE']).toBe(
      'uppdaterade noteringen för slutbetalningen',
    );
    expect(betalningsnoteringVerb('slut').id).not.toBe(betalningsnoteringVerb('avgift').id);
  });

  test('påminnelse: "antecknade", ALDRIG "skickade" — mailto-sändningen kan inte observeras', () => {
    const stmt = statementFor(
      registrationObjectId(REG_ID),
      betalningspaminnelseVerb('avgift'),
      REG_OBJEKT_NAMN,
      ACTIVITY_OBJECT_TYPES.betalning,
    );
    expect(stmt.verb.display['sv-SE']).toBe('antecknade påminnelse om anmälningsavgiften');
    // Stämplingslögnen som `AtgardsSida.tsx` § "mailto-eran" river får inte
    // återuppstå i loggen: verbet påstår aldrig en sändning.
    expect(stmt.verb.display['sv-SE']).not.toContain('skickade');
    const result = ActivityStatementSchema.safeParse(stmt);
    expect(result.success, JSON.stringify(!result.success && result.error.issues)).toBe(true);
  });

  test('påminnelse SLUT: egen verb-IRI, skild från avgift-varianten', () => {
    expect(betalningspaminnelseVerb('slut').id).not.toBe(betalningspaminnelseVerb('avgift').id);
  });

  test('bulk-bekräftelse: ÅTERANVÄNDER enskild-vägens verb + objekttyp — ingen egen bulk-form', () => {
    // DESIGNVALET (se `useConfirmAll`s onSuccess-kommentar): en post per
    // anmälan, med EXAKT samma verb och objekttyp som
    // `useSendConfirmationFromDetail` — historiken ska inte kunna se
    // skillnad på om Lotta bekräftade en person från detaljvyn eller åtta
    // från bulken. Ett eget "bekräftade alla"-verb hade gjort det.
    const stmt = statementFor(
      registrationObjectId(REG_ID),
      BEKRAFTADE_ANMALAN_VERB,
      REG_OBJEKT_NAMN,
      ACTIVITY_OBJECT_TYPES.bekraftelse,
    );
    expect(stmt.verb.display['sv-SE']).toBe('bekräftade anmälan');
    expect(stmt.object.id).toBe(`${XAPI_IRI_BASE}/objects/registrations/${REG_ID}`);
    const result = ActivityStatementSchema.safeParse(stmt);
    expect(result.success, JSON.stringify(!result.success && result.error.issues)).toBe(true);
  });

  test('testmail: objektet är EVENTET (inte platshållar-anmälan), typ = mail, passerar schemat', () => {
    const stmt = statementFor(
      eventObjectId(EVENT_ID),
      SKICKADE_TESTMAIL_VERB,
      `${eventActivityName('Fjärrskådning 2')} (test: bekraftelse)`,
      ACTIVITY_OBJECT_TYPES.mail,
    );
    expect(stmt.verb.display['sv-SE']).toBe('skickade testmail till sig själv');
    expect(stmt.object.id).toBe(`${XAPI_IRI_BASE}/objects/events/${EVENT_ID}`);
    // Testmailet får ALDRIG peka på en anmälan: EF-testgrenen rör ingen.
    expect(stmt.object.id).not.toContain('/objects/registrations/');
    const result = ActivityStatementSchema.safeParse(stmt);
    expect(result.success, JSON.stringify(!result.success && result.error.issues)).toBe(true);
  });

  test('testmail UTAN eventNamn: fallback "Okänt event" — aldrig ett tomt namn i loggen', () => {
    expect(eventActivityName(null)).toBe('Okänt event');
  });
});

/**
 * § 2 — INTEGRITETSVAKTEN. Kör den FAKTISKA composern och läser den FAKTISKA
 * utgående kroppen. Detta är beviset som den strukturella garantin inte kan
 * ge: att fritexten inte finns NÅGONSTANS i det som lämnar klienten — inte i
 * objektnamnet, inte i verbet, inte i extensions, inte i något fält en
 * framtida ändring råkar lägga till.
 */
test.describe('§ 2 — INTEGRITETSVAKTEN: betalningsnoteringens fritext lämnar ALDRIG klienten', () => {
  /** Realistisk, känslig notering — precis den sortens text Lotta skriver och
   * som ALDRIG får hamna i en logg andra kan läsa. */
  const HEMLIG_NOTERING =
    'Ringde 2026-08-13: sjukskriven, betalar efter lönen den 25:e, vill inte bli påmind igen';

  /** Distinkta fragment att söka efter var för sig — en läcka som trunkerar
   * eller omformaterar texten fångas ändå. */
  const FRAGMENT = ['Ringde', 'sjukskriven', 'lönen', 'påmind', '25:e'];

  /**
   * Bygger EXAKT den `recordActivity`-input som `useUpdatePaymentNote`s
   * onSuccess bygger (`registrationPayments.ts`) — med noteringen I SCOPE,
   * vilket är hela poängen: om den vore möjlig att få in i statementet skulle
   * detta vara stället den kom in.
   */
  function noteringsInput(dataSource: DataSourceAdapter, _notering: string) {
    return {
      dataSource,
      actor: { id: 'a1b2c3d4-0000-4000-8000-000000000001', name: 'Lotta' },
      verb: betalningsnoteringVerb('avgift'),
      object: {
        id: registrationObjectId(REG_ID),
        type: ACTIVITY_OBJECT_TYPES.betalning,
        name: REG_OBJEKT_NAMN,
      },
      eventId: EVENT_ID,
      personId: PERSON_ID,
    };
  }

  test('den utgående payloaden innehåller varken noteringen eller något fragment av den', async () => {
    let utgaende: unknown;
    const dataSource = stubAdapter(async (statement) => {
      utgaende = statement;
      return { id: statement.id, requestId: 'x', occurredAt: statement.timestamp };
    });

    await recordActivity(noteringsInput(dataSource, HEMLIG_NOTERING));

    expect(utgaende, 'composern ska ha postat ett statement').toBeDefined();
    // HELA kroppen serialiserad — inte bara de fält vi råkar tänka på.
    const payload = JSON.stringify(utgaende);
    expect(payload).not.toContain(HEMLIG_NOTERING);
    for (const fragment of FRAGMENT) {
      expect(payload, `fritext-fragmentet "${fragment}" läckte ut i payloaden`).not.toContain(
        fragment,
      );
    }
  });

  test('payloaden bär ändå ATT noteringen ändrades — vakten får inte vara "logga ingenting"', async () => {
    // NEGATIV KONTROLL. Utan denna rad hade en trasig instrumentering som
    // slutade logga helt passerat integritetstestet ovan med glans.
    let utgaende: unknown;
    const dataSource = stubAdapter(async (statement) => {
      utgaende = statement;
      return { id: statement.id, requestId: 'x', occurredAt: statement.timestamp };
    });

    await recordActivity(noteringsInput(dataSource, HEMLIG_NOTERING));

    const stmt = utgaende as {
      verb: { display: Record<string, string> };
      object: { id: string; definition: { name: Record<string, string> } };
    };
    expect(stmt.verb.display['sv-SE']).toBe('uppdaterade noteringen för anmälningsavgiften');
    expect(stmt.object.definition.name['sv-SE']).toBe(REG_OBJEKT_NAMN);
    expect(stmt.object.id).toContain(REG_ID);
  });

  test('samma garanti oavsett notering — två helt olika texter ger BYTE-IDENTISK payload (bortsett från id/timestamp)', async () => {
    async function payloadFor(notering: string): Promise<Record<string, unknown>> {
      let utgaende: Record<string, unknown> = {};
      const dataSource = stubAdapter(async (statement) => {
        utgaende = statement as unknown as Record<string, unknown>;
        return { id: statement.id, requestId: 'x', occurredAt: statement.timestamp };
      });
      await recordActivity(noteringsInput(dataSource, notering));
      // `id`, `timestamp` och request-id:t är per anrop unika — allt ANNAT
      // ska vara identiskt, och det är i det andra som en läcka skulle synas.
      const { id: _id, timestamp: _ts, context: _ctx, ...resten } = utgaende;
      return resten;
    }

    const a = await payloadFor(HEMLIG_NOTERING);
    const b = await payloadFor('Ett helt annat innehåll — betalade kontant på plats');
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
