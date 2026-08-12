import type { DataSourceAdapter } from '@/data/adapters/DataSourceAdapter';
import type { ActivityStatement, ActivityVerb } from '@/domain/schemas';
import { ActivityStatementSchema, REQUEST_ID_EXTENSION_IRI, XAPI_IRI_BASE } from '@/domain/schemas';

/**
 * Aktivitetsloggens skrivväg — klientsidan av datalagret, VIA ADAPTERN
 * (TASK-201.3 AC #1, ADR-110/ADR-111). Bygger ett Zod-validerat xAPI-
 * statement och postar det fire-and-forget till `log-activity`-EF:en.
 *
 * FIRE-AND-FORGET ÄR KONTRAKTET, INTE EN OPTIMERING: en fallerad loggning
 * (nätverksfel, EF nere, valideringsfel i en framtida omskrivning) FÅR
 * ALDRIG fälla Lottas faktiska mutation. Därför fångas varje fel härinne —
 * `recordActivity` kastar ALDRIG. Anropas alltid från en mutations
 * `onSuccess` (EFTER att den riktiga skrivningen redan lyckats), aldrig från
 * `mutationFn` — då hade ett loggningsfel kunnat kopplas in i samma
 * Promise-kedja som den riktiga skrivningen.
 */

export interface ActivityActorInput {
  /** Supabase auth-användarens UUID (`session.user.id`). */
  id: string;
  /**
   * Svenskt visningsnamn. `null` när `AuthUser.displayName` saknas —
   * `log-activity`-EF:en är den AUKTORITATIVA källan för det slutliga
   * `actor_name`-värdet (samma "kan aldrig komma från klienten"-princip som
   * `create-person-note`/`create-event-note` redan använder för
   * anteckningars författare, ADR-075): den härleder namnet SERVER-SIDE ur
   * JWT:ns `user_metadata.display_name` och skriver över detta fält innan
   * insert. Värdet här behöver bara vara en icke-tom sträng för att
   * schemat ska validera klient-sidan.
   */
  name: string | null;
}

export interface ActivityObjectInput {
  /** IRI för den SPECIFIKA entiteten (t.ex. `registrationObjectId(id)`). */
  id: string;
  /** IRI för entitetens KATEGORI (filterradens kategori-axel, `activityTypes.ts`). */
  type: string;
  /** Svenskt visningsnamn, formen "Anna Andersson (Fjärrskådning 2)" (Gunilla). */
  name: string;
}

export interface RecordActivityInput {
  dataSource: DataSourceAdapter;
  actor: ActivityActorInput;
  verb: ActivityVerb;
  object: ActivityObjectInput;
}

/** Icke-tom sträng-grind — schemat kräver `.min(1)`, men `displayName` kan vara `null`. */
function actorName(name: string | null): string {
  return name && name.trim() !== '' ? name.trim() : 'Okänd användare';
}

export async function recordActivity(input: RecordActivityInput): Promise<void> {
  try {
    const requestId = crypto.randomUUID();
    const statement: ActivityStatement = {
      id: crypto.randomUUID(),
      actor: {
        objectType: 'Agent',
        name: actorName(input.actor.name),
        account: { homePage: XAPI_IRI_BASE, name: input.actor.id },
      },
      verb: input.verb,
      object: {
        objectType: 'Activity',
        id: input.object.id,
        definition: { name: { 'sv-SE': input.object.name }, type: input.object.type },
      },
      context: { extensions: { [REQUEST_ID_EXTENSION_IRI]: requestId } },
      timestamp: new Date().toISOString(),
    };
    // Klient-sidans validering (defensiv — samma schema som EF:en, se
    // AC #2). Fångas av try/catch nedan precis som ett nätverksfel: ett
    // trasigt statement ska aldrig fälla mutationen, bara loggas bort.
    const parsed = ActivityStatementSchema.parse(statement);
    await input.dataSource.recordActivity(parsed);
  } catch (error) {
    // Strukturerad, men ALDRIG kastad vidare — se filhuvudets kontrakt.
    console.error('[recordActivity] loggning misslyckades - mutationen påverkas inte', error);
  }
}
