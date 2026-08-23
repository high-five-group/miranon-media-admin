// Aktivitetsloggens TRE pilot-statement-former (TASK-201.3 AC #5) — api-pure
// (ren logik, ingen staging, inga creds). Bevisar att `activityTypes.ts`s
// verb-/objekt-byggare producerar statements som passerar SAMMA Zod-schema
// som EF:en validerar mot (`ActivityStatementSchema`), och att den svenska
// sammanfattningsformen (Gunilla-principen, PRD § Lösning: "Lotta markerade
// betalning — Anna Andersson (Fjärrskådning 2)") faktiskt hålls av VARJE
// pilot — inte bara betalnings-exemplet PRD-prosan råkar citera.
//
// SÄRSKILT VIKTIG FÖR PILOT 2 (bekräfta anmälan): `useSendConfirmationFromDetail`
// (`registrationConfirmation.ts`) saknar egen e2e-täckning i denna skiva
// (AnmalanDetail.tsx har ingen existerande get-registration-mock-infrastruktur
// att bygga på — källmärkt gap, se PR-beskrivningen/slutrapporten). Detta
// test är den bevisade ersättningen för STATEMENT-FORMEN (inte för
// onSuccess-kopplingen, som type-checkas men inte körs här) tills en
// framtida skiva bygger den ytans e2e-infrastruktur.
//
// Formen speglar `activity-statement-schema.test.ts` (TASK-201.1): api-pure,
// rött-först redan bevisat DÄR för schemat självt — detta testet bevisar
// PRODUCENTERNA (activityTypes.ts), inte schemat.

import { expect, test } from '@playwright/test';
import {
  ACTIVITY_OBJECT_TYPES,
  BEKRAFTADE_ANMALAN_VERB,
  betalningVerb,
  mailVerb,
  registrationObjectId,
} from '../../src/data/activityLog/activityTypes';
import {
  ActivityStatementSchema,
  REQUEST_ID_EXTENSION_IRI,
  XAPI_IRI_BASE,
} from '../../src/domain/schemas/ActivityStatement.schema';
import { PaymentStatus } from '../../src/domain/types/Status';

/** Bygger ett fullständigt statement runt en given verb+objekt-kombination —
 * SAMMA form som `recordActivity.ts` faktiskt bygger, egen lokal kopia (ren
 * test-fixtur, inte en import av produktionskoden — den kräver en
 * `DataSourceAdapter` för att köra, vilket är EXAKT vad detta pure-test
 * medvetet undviker). */
function statementFor(
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
      id: registrationObjectId('recANM0000000001'),
      definition: { name: { 'sv-SE': objectName }, type: objectType },
    },
    context: {
      extensions: { [REQUEST_ID_EXTENSION_IRI]: 'c9d8e7f6-1111-4222-8333-444455556666' },
    },
    timestamp: '2026-08-12T14:22:00.000Z',
  };
}

const OBJEKT_NAMN = 'Anna Andersson (Fjärrskådning 2)';

test.describe('Aktivitetsloggens pilot-statement-former (TASK-201.3 AC #5)', () => {
  test('pilot 1/3 — betalning MOTTAGEN: "markerade betalning", passerar schemat', () => {
    const stmt = statementFor(
      betalningVerb(PaymentStatus.MOTTAGEN),
      OBJEKT_NAMN,
      ACTIVITY_OBJECT_TYPES.betalning,
    );
    expect(stmt.verb.display['sv-SE']).toBe('markerade betalning');
    const result = ActivityStatementSchema.safeParse(stmt);
    expect(result.success, JSON.stringify(!result.success && result.error.issues)).toBe(true);
  });

  test('pilot 1/3 — betalning EJ MOTTAGEN (avmarkering): "avmarkerade betalning", passerar schemat', () => {
    const stmt = statementFor(
      betalningVerb(PaymentStatus.EJ_MOTTAGEN),
      OBJEKT_NAMN,
      ACTIVITY_OBJECT_TYPES.betalning,
    );
    expect(stmt.verb.display['sv-SE']).toBe('avmarkerade betalning');
    const result = ActivityStatementSchema.safeParse(stmt);
    expect(result.success, JSON.stringify(!result.success && result.error.issues)).toBe(true);
  });

  test('pilot 2/3 — bekräfta anmälan: "bekräftade anmälan", passerar schemat (källmärkt: enda beviset för denna pilots statement-form, se filhuvud)', () => {
    const stmt = statementFor(
      BEKRAFTADE_ANMALAN_VERB,
      OBJEKT_NAMN,
      ACTIVITY_OBJECT_TYPES.bekraftelse,
    );
    expect(stmt.verb.display['sv-SE']).toBe('bekräftade anmälan');
    const result = ActivityStatementSchema.safeParse(stmt);
    expect(result.success, JSON.stringify(!result.success && result.error.issues)).toBe(true);
  });

  test('pilot 3/3 — mail-åtgärd, samtliga fyra actionTypes: rätt dåtidsform, passerar schemat', () => {
    const forvantat: Record<string, string> = {
      bekraftelse: 'skickade bekräftelsemail',
      paminnelse: 'skickade betalningspåminnelse',
      eventinfo: 'skickade deltagarinformation',
      fritt: 'skickade mail',
    };
    for (const actionType of ['bekraftelse', 'paminnelse', 'eventinfo', 'fritt'] as const) {
      const stmt = statementFor(mailVerb(actionType), OBJEKT_NAMN, ACTIVITY_OBJECT_TYPES.mail);
      expect(stmt.verb.display['sv-SE']).toBe(forvantat[actionType]);
      const result = ActivityStatementSchema.safeParse(stmt);
      expect(result.success, JSON.stringify(!result.success && result.error.issues)).toBe(true);
    }
  });

  test('Gunilla-formen (AC #5): "Lotta <verb> — Anna Andersson (Fjärrskådning 2)" håller för alla tre pilotobjekt-namn', () => {
    const stmt = statementFor(
      betalningVerb(PaymentStatus.MOTTAGEN),
      OBJEKT_NAMN,
      ACTIVITY_OBJECT_TYPES.betalning,
    );
    const sammanfattning = `${stmt.actor.name} ${stmt.verb.display['sv-SE']} — ${stmt.object.definition.name['sv-SE']}`;
    expect(sammanfattning).toBe('Lotta markerade betalning — Anna Andersson (Fjärrskådning 2)');
  });
});
