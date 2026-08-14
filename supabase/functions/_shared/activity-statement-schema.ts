// @ts-nocheck — Deno Edge Function (esm.sh-import; typas vid deploy, se
// ADR-010 § Fas 7-åtagande). Samma undantags-mönster som send-receipt-email/
// index.ts m.fl.
//
// MÄTT INERT för `npm run typecheck` (S105, 2026-08-14): den enda importören
// är log-activity/index.ts, som själv aldrig ingår i tsconfig-grafen — se
// den filens huvud för hela resonemanget (samma slutsats gäller här:
// `npm run typecheck` förblir exit 0 med pragmat borttaget, pragmat behålls
// för Fas 7:s `deno check`).
import { z } from 'https://esm.sh/zod@4';

// log-activity — Deno-sidans Zod-schema (TASK-201.3 AC #2, ADR-110/ADR-111).
//
// MEDVETEN DUPLICERING av `src/domain/schemas/ActivityStatement.schema.ts`
// (TASK-201.1) — INTE en import av samma fil. Motivet, källmärkt:
//
//   1. Deno-runtimen (Supabase Edge Functions) kan inte resolva den delade
//      filens bara `import { z } from 'zod'`-specifier utan en NY import-map-
//      mekanism — ingen sådan finns i repot i dag. Samtliga befintliga
//      EF-imports är antingen fullständiga `https:`-URL:er eller relativa
//      `.ts`-sökvägar INOM `supabase/functions/`, aldrig cross-directory in i
//      `src/` (disk-verifierat, noll träffar på `npm:`/`jsr:`-specifierare
//      eller `../../../src`-imports i hela `supabase/functions/`,
//      `docs/research/task-103-deno-verktygskedjan-i-node-repo-2026-07-31.md`
//      § 2–3). Ett nytt import-map-lager är i sig en ny, oprövad
//      deploy-riskyta (`deno` finns inte lokalt i denna miljö för att
//      verifiera det före en skarp deploy) — fel avvägning för en
//      TRACER BULLET vars uttalade syfte är att avtäcka ett MEKANISKT
//      REPLIKERBART mönster åt TASK-201.4, inte att introducera ny
//      infrastruktur.
//   2. Risken duplicering annars bär (drift mellan klient- och
//      server-schemat) hanteras av `tests/api/log-activity.staging.test.ts`:
//      samma uppsättning giltiga/ogiltiga statement-fixturer valideras mot
//      BÅDA scheman (Zod client-side i testfilen, HTTP-kontraktet mot denna
//      EF server-side) — ett divergerande schema fäller testet, inte tyst.
//
// HÅLL SYNKRONISERAD FÖR HAND vid ändring av källschemat (fält, min/max,
// tvingande vs valfria nycklar). Se källfilens docblock för xAPI-fältens
// individuella motiv — de upprepas inte här.

export const XAPI_IRI_BASE = 'https://admin.miranon.dev/xapi';
export const REQUEST_ID_EXTENSION_IRI = `${XAPI_IRI_BASE}/extensions/requestId`;

const LanguageMapSchema = z
  .record(z.string().min(2), z.string().min(1))
  .refine((map) => Object.keys(map).length > 0, {
    message: 'Language Map måste ha minst en språk-nyckel',
  });

const ActivityActorAccountSchema = z.object({
  homePage: z.string().url(),
  name: z.string().uuid(),
});

const ActivityActorSchema = z.object({
  objectType: z.literal('Agent'),
  name: z.string().min(1),
  account: ActivityActorAccountSchema,
});

const ActivityVerbSchema = z.object({
  id: z.string().url(),
  display: LanguageMapSchema,
});

const ActivityObjectDefinitionSchema = z.object({
  name: LanguageMapSchema,
  type: z.string().url(),
});

const ActivityObjectSchema = z.object({
  objectType: z.literal('Activity'),
  id: z.string().url(),
  definition: ActivityObjectDefinitionSchema,
});

const ActivityContextExtensionsSchema = z
  .object({
    [REQUEST_ID_EXTENSION_IRI]: z.string().uuid(),
  })
  .catchall(z.unknown());

const ActivityContextSchema = z.object({
  extensions: ActivityContextExtensionsSchema,
});

export const ActivityStatementSchema = z.object({
  id: z.string().uuid(),
  actor: ActivityActorSchema,
  verb: ActivityVerbSchema,
  object: ActivityObjectSchema,
  context: ActivityContextSchema,
  timestamp: z.string().datetime({ offset: true }),
});
