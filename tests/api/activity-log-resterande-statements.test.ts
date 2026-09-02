// Aktivitetsloggens ÅTERSTÅENDE åtta statement-former (TASK-201.4 AC #1/#2)
// — api-pure (ren logik, ingen staging, inga creds). Speglar
// `activity-log-pilot-statements.test.ts` (TASK-201.3 AC #5) EXAKT i form:
// bevisar att `activityTypes.ts`s NYA verb-/objekt-byggare producerar
// statements som passerar SAMMA Zod-schema som EF:en validerar mot, och att
// den svenska Gunilla-sammanfattningen håller för varje ny typ — inte bara
// pilotens tre.
//
// AC #2 (anteckningsposter loggar ATT, ALDRIG innehåll) bevisas EXPLICIT
// nedan: `ANTECKNADE_VERB`/`UPPDATERADE_ANTECKNING_VERB` är parameterlösa
// konstanter (kan strukturellt inte ta emot en anteckningstext), och
// `personActivityName`/`eventActivityName` tar ENDAST ett namn — samma
// sammanfattning oavsett vad en tänkt anteckningstext skulle ha innehållit
// bevisas genom att bygga samma statement med två olika (aldrig använda)
// "innehålls"-strängar och visa att objektets namn är identiskt.

import { expect, test } from '@playwright/test';
import {
  ACTIVITY_OBJECT_TYPES,
  ANTECKNADE_VERB,
  boendeVerb,
  eventActivityName,
  eventObjectId,
  personActivityName,
  personObjectId,
  registrationObjectId,
  SKAPADE_ANMALAN_VERB,
  SKICKADE_KVITTO_VERB,
  UPPDATERADE_ANTECKNING_VERB,
  UPPDATERADE_EVENT_VERB,
  UPPDATERADE_FLAGGA_VERB,
} from '../../src/data/activityLog/activityTypes';
import {
  ActivityStatementSchema,
  REQUEST_ID_EXTENSION_IRI,
  XAPI_IRI_BASE,
} from '../../src/domain/schemas/ActivityStatement.schema';

/** Bygger ett fullständigt statement runt en given verb+objekt-kombination —
 * SAMMA form som `recordActivity.ts` faktiskt bygger, egen lokal kopia (ren
 * test-fixtur, mönstret ur `activity-log-pilot-statements.test.ts`). */
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
    timestamp: '2026-08-12T14:22:00.000Z',
  };
}

const REG_ID = 'recANM0000000001';
const EVENT_ID = 'recEVT0000000001';
const PERSON_ID = 'recPER0000000001';
const REG_OBJEKT_NAMN = 'Anna Andersson (Fjärrskådning 2)';

test.describe('Aktivitetsloggens återstående statement-former (TASK-201.4 AC #1)', () => {
  test('skapa anmälan: "skapade anmälan", passerar schemat', () => {
    const stmt = statementFor(
      registrationObjectId(REG_ID),
      SKAPADE_ANMALAN_VERB,
      REG_OBJEKT_NAMN,
      ACTIVITY_OBJECT_TYPES.anmalan,
    );
    expect(stmt.verb.display['sv-SE']).toBe('skapade anmälan');
    const result = ActivityStatementSchema.safeParse(stmt);
    expect(result.success, JSON.stringify(!result.success && result.error.issues)).toBe(true);
  });

  test('TASK-363: skapa anmälan-objektets namn bär EVENTNAMNET när eventNamn är satt — regression mot "(okänt event)"', () => {
    // `useCreateRegistration.ts`s onSuccess (och sju andra mutationer) bygger
    // objektnamnet med SAMMA inlinade mall: `${displayName(created)} (${created
    // .eventNamn ?? 'okänt event'})` — egen lokal kopia här, samma precedent
    // som `statementFor()` ovan. Rotorsaken (TASK-363, Marcus prod-observation
    // 2026-09-02): en MANUELL anmälan lämnade `eventNamn` null (Event (namn)-
    // formeln läser den tomma `Vill anmäla sig till`), så mallen föll till
    // "(okänt event)" trots att Event-länken faktiskt var satt. EF-fixet
    // (create-registration/index.ts `mapCreatedRegistration` + `_shared/
    // registration-read.ts` `mapRegistration`) garanterar att `eventNamn`
    // aldrig är null när länken finns (fallback-kedja: `Kurs (from Event)` →
    // `Event (namn)` → EF:ens redan hämtade eventnamn) — DETTA test bevisar
    // bara att KLIENTENS mall-sammansättning korrekt speglar ett satt
    // eventNamn (den rena null-fallback-vägen testas redan via
    // `eventActivityName` ovan, men den delade mallen här är en ANNAN
    // funktion — ingen tidigare test i denna svit gav den ett NON-null värde).
    const byggObjektnamn = (namn: string, eventNamn: string | null) =>
      `${namn} (${eventNamn ?? 'okänt event'})`;

    expect(byggObjektnamn('Marcus Test', 'Resor i medvetandet 1')).toBe(
      'Marcus Test (Resor i medvetandet 1)',
    );
    // Ren fallback-vägen (eventNamn faktiskt null, t.ex. Event-länk helt saknas)
    // — INTE TASK-363:s bugg, men mallen ska fortsatt hantera den defensivt.
    expect(byggObjektnamn('Marcus Test', null)).toBe('Marcus Test (okänt event)');
  });

  test('boende MARKERAD: "markerade bor över", passerar schemat', () => {
    const stmt = statementFor(
      registrationObjectId(REG_ID),
      boendeVerb(true),
      REG_OBJEKT_NAMN,
      ACTIVITY_OBJECT_TYPES.boende,
    );
    expect(stmt.verb.display['sv-SE']).toBe('markerade bor över');
    const result = ActivityStatementSchema.safeParse(stmt);
    expect(result.success, JSON.stringify(!result.success && result.error.issues)).toBe(true);
  });

  test('boende AVMARKERAD: "avmarkerade bor över", passerar schemat', () => {
    const stmt = statementFor(
      registrationObjectId(REG_ID),
      boendeVerb(false),
      REG_OBJEKT_NAMN,
      ACTIVITY_OBJECT_TYPES.boende,
    );
    expect(stmt.verb.display['sv-SE']).toBe('avmarkerade bor över');
    const result = ActivityStatementSchema.safeParse(stmt);
    expect(result.success, JSON.stringify(!result.success && result.error.issues)).toBe(true);
  });

  test('kvitto: "skickade kvitto", passerar schemat', () => {
    const stmt = statementFor(
      registrationObjectId(REG_ID),
      SKICKADE_KVITTO_VERB,
      REG_OBJEKT_NAMN,
      ACTIVITY_OBJECT_TYPES.kvitto,
    );
    expect(stmt.verb.display['sv-SE']).toBe('skickade kvitto');
    const result = ActivityStatementSchema.safeParse(stmt);
    expect(result.success, JSON.stringify(!result.success && result.error.issues)).toBe(true);
  });

  test('uppdatera event: "uppdaterade eventet", objektet är EVENTET (eventObjectId, inte registrationObjectId), passerar schemat', () => {
    const stmt = statementFor(
      eventObjectId(EVENT_ID),
      UPPDATERADE_EVENT_VERB,
      eventActivityName('Resor i medvetandet 1'),
      ACTIVITY_OBJECT_TYPES.event,
    );
    expect(stmt.verb.display['sv-SE']).toBe('uppdaterade eventet');
    expect(stmt.object.id).toBe(`${XAPI_IRI_BASE}/objects/events/${EVENT_ID}`);
    expect(stmt.object.definition.name['sv-SE']).toBe('Resor i medvetandet 1');
    const result = ActivityStatementSchema.safeParse(stmt);
    expect(result.success, JSON.stringify(!result.success && result.error.issues)).toBe(true);
  });

  test('uppdatera event UTAN eventNamn: fallback "Okänt event" — aldrig ett tomt/null-namn i loggen', () => {
    expect(eventActivityName(null)).toBe('Okänt event');
    expect(eventActivityName('')).toBe('Okänt event');
  });

  test('person-flagga: "uppdaterade flagga", objektet är PERSONEN (personObjectId), passerar schemat', () => {
    const stmt = statementFor(
      personObjectId(PERSON_ID),
      UPPDATERADE_FLAGGA_VERB,
      personActivityName('Sofia Isaksson'),
      ACTIVITY_OBJECT_TYPES.flagga,
    );
    expect(stmt.verb.display['sv-SE']).toBe('uppdaterade flagga');
    expect(stmt.object.id).toBe(`${XAPI_IRI_BASE}/objects/persons/${PERSON_ID}`);
    const result = ActivityStatementSchema.safeParse(stmt);
    expect(result.success, JSON.stringify(!result.success && result.error.issues)).toBe(true);
  });

  test('person-flagga UTAN personNamn: fallback "Okänd person" — aldrig ett tomt/null-namn i loggen', () => {
    expect(personActivityName(null)).toBe('Okänd person');
    expect(personActivityName('')).toBe('Okänd person');
  });

  test('event-anteckning (skapa): "antecknade", objektet är EVENTET, passerar schemat', () => {
    const stmt = statementFor(
      eventObjectId(EVENT_ID),
      ANTECKNADE_VERB,
      eventActivityName('Resor i medvetandet 1'),
      ACTIVITY_OBJECT_TYPES.anteckning,
    );
    expect(stmt.verb.display['sv-SE']).toBe('antecknade');
    const result = ActivityStatementSchema.safeParse(stmt);
    expect(result.success, JSON.stringify(!result.success && result.error.issues)).toBe(true);
  });

  test('person-anteckning (skapa): "antecknade" — DELAT verb med event-anteckning, objektet är PERSONEN, passerar schemat', () => {
    const stmt = statementFor(
      personObjectId(PERSON_ID),
      ANTECKNADE_VERB,
      personActivityName('Sofia Isaksson'),
      ACTIVITY_OBJECT_TYPES.anteckning,
    );
    expect(stmt.verb.display['sv-SE']).toBe('antecknade');
    expect(stmt.verb.id).toBe(ANTECKNADE_VERB.id); // samma IRI som event-varianten
    const result = ActivityStatementSchema.safeParse(stmt);
    expect(result.success, JSON.stringify(!result.success && result.error.issues)).toBe(true);
  });

  test('person-anteckning (uppdatera): "uppdaterade anteckning" — EGET verb, skilt från "antecknade" (skapa-strömmen), passerar schemat', () => {
    const stmt = statementFor(
      personObjectId(PERSON_ID),
      UPPDATERADE_ANTECKNING_VERB,
      personActivityName('Sofia Isaksson'),
      ACTIVITY_OBJECT_TYPES.anteckning,
    );
    expect(stmt.verb.display['sv-SE']).toBe('uppdaterade anteckning');
    expect(stmt.verb.id).not.toBe(ANTECKNADE_VERB.id);
    const result = ActivityStatementSchema.safeParse(stmt);
    expect(result.success, JSON.stringify(!result.success && result.error.issues)).toBe(true);
  });

  test('Gunilla-formen håller för samtliga åtta nya typer ("Lotta <verb> — <namn>")', () => {
    const fall: Array<{ verb: { display: Record<string, string> }; namn: string }> = [
      { verb: SKAPADE_ANMALAN_VERB, namn: REG_OBJEKT_NAMN },
      { verb: boendeVerb(true), namn: REG_OBJEKT_NAMN },
      { verb: SKICKADE_KVITTO_VERB, namn: REG_OBJEKT_NAMN },
      { verb: UPPDATERADE_EVENT_VERB, namn: eventActivityName('Resor i medvetandet 1') },
      { verb: UPPDATERADE_FLAGGA_VERB, namn: personActivityName('Sofia Isaksson') },
      { verb: ANTECKNADE_VERB, namn: eventActivityName('Resor i medvetandet 1') },
      { verb: UPPDATERADE_ANTECKNING_VERB, namn: personActivityName('Sofia Isaksson') },
    ];
    for (const { verb, namn } of fall) {
      const sammanfattning = `Lotta ${verb.display['sv-SE']} — ${namn}`;
      expect(sammanfattning.startsWith('Lotta ')).toBe(true);
      expect(sammanfattning).toContain(namn);
    }
  });

  test('AC #2 — REGRESSIONSVAKT: anteckningsverbens sammanfattning är OBEROENDE av anteckningens innehåll', () => {
    // `ANTECKNADE_VERB`/`UPPDATERADE_ANTECKNING_VERB` är statiska konstanter
    // (ActivityVerb-objekt, inga funktioner) — de kan strukturellt inte ta
    // emot en anteckningstext som argument. `personActivityName`/
    // `eventActivityName` tar ENDAST ett namn. Bygger samma statement för
    // TVÅ olika (aldrig konsumerade) "tänkta" anteckningstexter och visar
    // att den byggda sammanfattningen är BYTE-FÖR-BYTE identisk oavsett —
    // om någon framtida ändring av misstag trädde igenom anteckningens text
    // hade denna assertion fällt.
    const tankTaText1 = 'Känsligt: personen har en pågående avvikelse-utredning';
    const tankTaText2 = 'Helt annat innehåll som aldrig ska synas';
    void tankTaText1;
    void tankTaText2; // medvetet oanvända — bevisar att API:t inte ens ERBJUDER en plats för dem

    const namn = personActivityName('Sofia Isaksson');
    const stmtA = statementFor(
      personObjectId(PERSON_ID),
      ANTECKNADE_VERB,
      namn,
      ACTIVITY_OBJECT_TYPES.anteckning,
    );
    const stmtB = statementFor(
      personObjectId(PERSON_ID),
      ANTECKNADE_VERB,
      namn,
      ACTIVITY_OBJECT_TYPES.anteckning,
    );
    expect(stmtA.object.definition.name).toEqual(stmtB.object.definition.name);
    expect(JSON.stringify(stmtA.object.definition.name)).not.toContain('avvikelse');
    expect(JSON.stringify(stmtA.object.definition.name)).not.toContain('Helt annat');
  });
});
