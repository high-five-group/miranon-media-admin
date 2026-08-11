import { z } from 'zod';

/**
 * xAPI (Experience API) statement-schema — ADL xAPI 1.0.3-konformt profil.
 * Fält-form verifierad mot https://github.com/adlnet/xAPI-Spec/blob/master/
 * xAPI-Data.md (TASK-201.1, 2026-08-11): `actor`/`verb`/`object` obligatoriska
 * på statement-nivå per spec; `context`/`timestamp` är spec-OPTIONELLA men
 * GÖRS obligatoriska i VÅR profil (se motiv per fält nedan) — striktare än
 * spec-golvet, aldrig löST.
 *
 * Endast delmängden vi faktiskt använder är modellerad. Spec-fält vi INTE
 * bär: `result` (ingen scoring/completion i denna feature — adaptiv lärning
 * är Passionslyftets jobb, ej vårt, PRD `TASK-201` § Utanför omfattningen),
 * `stored`/`authority` (satta av en LRS; vi ÄR inte en fullständig LRS —
 * `created_at` i migrationsfilen fyller samma roll), `attachments` (oanvänt),
 * `context.registration`/`instructor`/`team`/`contextActivities`/`platform`/
 * `language`/`statement` (oanvänt i v1 — ingen spekulativ modellering av fält
 * utan en faktisk konsument).
 *
 * Lagringsval: ADR-110 (Supabase `activity_log`, inte Airtable).
 * Korrelations-ID: ADR-111 (`requestId` är enda korrelations-ID:t, buret här
 * i `context.extensions` under en dedikerad IRI-nyckel — inget `trace_id`).
 *
 * Svenska display-strängar genomgående (Gunilla-principen — Lotta läser
 * aldrig tekniska termer eller engelska); IRI-identifierare (verb/object/
 * extensions) bär den maskinläsbara identiteten under huven, per
 * användarberättelse #15 (strikt xAPI-konformans som Open Badges-/adaptiv
 * lärning-förberedelse, PRD § Implementationsbeslut).
 */

/** Bas-IRI för samtliga verb/aktivitetstyper/extensions vi definierar (ADR-091: `admin.miranon.dev` är appens driftsatta domän). */
export const XAPI_IRI_BASE = 'https://admin.miranon.dev/xapi' as const;

/**
 * IRI-nyckeln `requestId` bärs under i `context.extensions` (ADR-111).
 * Exporterad för återanvändning av skrivvägen (`TASK-201.3`s `recordActivity`)
 * och läsvägen (`TASK-201.5`s `get-activity-log`-EF) — definieras EN gång,
 * aldrig omskriven på två håll.
 */
export const REQUEST_ID_EXTENSION_IRI = `${XAPI_IRI_BASE}/extensions/requestId` as const;

/**
 * xAPI Language Map — BCP 47-taggade strängar (`sv-SE`, `en-US`, eller `und`
 * för odeterminerat språk) mappade till text. Vi EMITTERAR alltid endast
 * `sv-SE` (Gunilla-principen), men VALIDERAR generiskt mot spec-formen —
 * inte hårdkodat till exakt en nyckel — så en framtida Passionslyftet-
 * konsument som skickar/läser fler språk inte kräver ett schema-brott.
 * Minst en nyckel krävs (en tom Language Map är meningslös och strider mot
 * hela syftet: en sammanfattning MÅSTE gå att visa för Lotta).
 */
const LanguageMapSchema = z
  .record(z.string().min(2), z.string().min(1))
  .refine((map) => Object.keys(map).length > 0, {
    message: 'Language Map måste ha minst en språk-nyckel',
  });

/** xAPI Agent — vår enda aktör-form (aldrig Group; appen har inga grupp-aktörer). */
const ActivityActorAccountSchema = z.object({
  /** IRL som identifierar tjänsten kontot tillhör (xAPI account-IFI). */
  homePage: z.string().url(),
  /**
   * Supabase auth-användarens ID (UUID, `session.user.id` — `src/auth/
   * AuthProvider.tsx`). MEDVETET inte `mbox` (mailto-IFI): en `account`-IFI
   * undviker att upprepa Lottas/Rogers/Marcus e-postadress i varenda
   * loggrad — samma dataminimerings-motiv som antecknings-loggningens
   * "logga ATT, aldrig innehållet" (PRD § Implementationsbeslut).
   */
  name: z.string().uuid(),
});

const ActivityActorSchema = z.object({
  objectType: z.literal('Agent'),
  /** Svenskt visningsnamn ("Lotta", "Roger", "Marcus") — `AuthUser.displayName`. */
  name: z.string().min(1),
  account: ActivityActorAccountSchema,
});

/** xAPI Verb — IRI-identifierad handling ("markerade som betald", "bekräftade anmälan", …). */
const ActivityVerbSchema = z.object({
  id: z.string().url(),
  display: LanguageMapSchema,
});

/**
 * xAPI Activity `definition` — vi kräver `name` + `type` (spec gör båda
 * optionella; vi gör dem obligatoriska eftersom UI:t alltid behöver ett
 * mänskligt namn OCH filterraden alltid behöver en kategori-IRI, PRD §
 * Vy-form). `description`/`moreInfo`/`extensions` på definition-nivå är
 * oanvända och därför inte modellerade (ingen spekulativ komplexitet).
 */
const ActivityObjectDefinitionSchema = z.object({
  name: LanguageMapSchema,
  /** IRI som klassificerar OBJEKTETS typ (t.ex. "en anmälan", "en betalning") — filterradens kategori-axel. */
  type: z.string().url(),
});

/** xAPI Activity (statement.object) — vi emitterar aldrig Agent/Group/SubStatement/StatementRef som objekt. */
const ActivityObjectSchema = z.object({
  objectType: z.literal('Activity'),
  id: z.string().url(),
  definition: ActivityObjectDefinitionSchema,
});

/**
 * xAPI `context.extensions` — IRI-nycklad (spec-krav). `requestId` är
 * OBLIGATORISK (ADR-111 — Marcus användarberättelse #13, korrelation mot
 * serverloggarna); `.catchall()` håller formen öppen för framtida
 * extensions (t.ex. en event-referens) utan att bryta detta schema när de
 * tillkommer i en senare skiva.
 */
const ActivityContextExtensionsSchema = z
  .object({
    [REQUEST_ID_EXTENSION_IRI]: z.string().uuid(),
  })
  .catchall(z.unknown());

const ActivityContextSchema = z.object({
  extensions: ActivityContextExtensionsSchema,
});

/**
 * Ett komplett xAPI-statement, vår profil. `id` och `timestamp` är
 * spec-OPTIONELLA (en LRS får generera/sätta dem) men obligatoriska här: VI
 * är producenten, och genererar dem alltid själva (symmetriskt med
 * `generateRequestId()`/`idempotencyKey`-mönstret i `supabase/functions/
 * _shared/errors.ts` och `src/data/mutations/*.ts`) — det finns ingen LRS
 * som fyller i dem åt oss.
 */
export const ActivityStatementSchema = z.object({
  id: z.string().uuid(),
  actor: ActivityActorSchema,
  verb: ActivityVerbSchema,
  object: ActivityObjectSchema,
  context: ActivityContextSchema,
  /** ISO 8601 med explicit offset (alltid `new Date().toISOString()` → `Z`-suffix hos producenten). */
  timestamp: z.string().datetime({ offset: true }),
});

export type ActivityStatement = z.infer<typeof ActivityStatementSchema>;
export type ActivityActor = z.infer<typeof ActivityActorSchema>;
export type ActivityVerb = z.infer<typeof ActivityVerbSchema>;
export type ActivityObject = z.infer<typeof ActivityObjectSchema>;
export type ActivityObjectDefinition = z.infer<typeof ActivityObjectDefinitionSchema>;
export type ActivityContext = z.infer<typeof ActivityContextSchema>;
