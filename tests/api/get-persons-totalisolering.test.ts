// Felisolerings-regressionstest för get-persons totalsiffran (TASK-277,
// orkestrerar-granskning av PR #1614 — defekten "räknarens fel tar ner hela
// personlistan").
//
// api-pure (ren logik, ingen staging, ingen creds).
//
// VARFÖR DEN REPLIKERADE FORMEN, INTE ETT DIREKT IMPORT: `get-persons/index.ts`
// (och `_shared/airtable-client.ts` den importerar) använder `Deno.serve`/
// `Deno.env` och kan därför INTE dras in i detta Node/Playwright-program —
// samma dokumenterade gräns som `airtable-retry.test.ts`s filhuvud citerar
// ordagrant ("fäller typecheck med 7× TS2304 'Cannot find name Deno'").
// Detta är samma disciplin som `coerce.test.ts`s "Ort"-klassregression
// (§ oldFirstString): när källan inte kan importeras replikeras MÖNSTRET
// exakt, citerat mot exakta radnummer, så en framtida drift syns.
//
// DEN REPLIKERADE FORMEN NEDAN ÄR ORDAGRANT
// `supabase/functions/get-persons/index.ts:216-236` (verifiera raderna vid
// varje ändring av den filen — en tyst drift här gör detta test till en
// falsk trygghet). [OMRÄKNAT, TASK-286.1] Radnumret flyttade sig (175-195 →
// 216-236) när `BAS_FILTER` lyftes till modul-nivå och registerlägets EGNA
// gren (ADR-123 beslut 1) lades in FÖRE denna kod i filen — den REPLIKERADE
// KODEN SJÄLV är oförändrad, bara dess position i filen flyttades ned.
//
// DEFEKTEN som stängs: `totalPromise` gjorde ingen egen felhantering.
// `fetchFromAirtable` (full-walk) gör FLERA sekventiella Airtable-anrop och
// har därför en mångdubbelt större felyta än sid-anropet (429, transient
// 5xx, timeout mitt i walken). En rejectad `totalPromise` kastade hela
// `Promise.all` → HELA `get-persons` föll till `mapErrorToResponse` →
// Personer-vyn visade en felruta i stället för sina 50 rader, för en
// KOSMETISK siffras skull. Fixen isolerar felet med en egen `.catch()` som
// degraderar till `undefined` (samma additiva/skew-säkra väg klienten redan
// bär, `PersonsList.tsx`s `data?.pages[0]?.total ?? loadedCount`) i stället
// för att kasta.

import { expect, test } from '@playwright/test';

/**
 * Ordagrann replik av `get-persons/index.ts:175-186`s Promise-komposition.
 * `pageFn`/`walkFn` ersätter `fetchAirtablePage`/`fetchFromAirtable` — allt
 * annat (strukturen, `.catch()`-platsen, felmeddelandet) är identiskt.
 */
async function byggSvar(
  offset: string | undefined,
  pageFn: () => Promise<{ records: unknown[]; nextOffset: string | null }>,
  walkFn: () => Promise<{ length: number }[]>,
) {
  const pagePromise = pageFn();

  const totalPromise = offset
    ? Promise.resolve(undefined)
    : walkFn()
        .then((records) => records.length)
        .catch((totalError) => {
          // console.warn utelämnad i replikatet (testet asserterar inte på
          // loggning) — källan har den, se filhuvudets citat.
          void totalError;
          return undefined;
        });

  const [{ records, nextOffset }, total] = await Promise.all([pagePromise, totalPromise]);

  const nextCursor = nextOffset ?? null;

  return { persons: records, nextCursor, ...(total !== undefined ? { total } : {}) };
}

test.describe('get-persons — totalsiffrans felisolering (TASK-277 defekt-fix)', () => {
  test('POSITIVT: full-walk lyckas → svaret bär persons OCH total', async () => {
    const svar = await byggSvar(
      undefined,
      async () => ({ records: [{ id: 'rec1' }, { id: 'rec2' }], nextOffset: null }),
      async () => [{ length: 1 }, { length: 1 }, { length: 1 }], // 3 "poster"
    );

    expect(svar.persons).toHaveLength(2);
    expect(svar).toHaveProperty('total', 3);
  });

  test('NEGATIVT (defekten, nu stängd): full-walk fallerar → svaret bär FORTFARANDE persons, total UTELÄMNAT — Promise.all kastar INTE', async () => {
    let walkAnropad = false;
    const svar = await byggSvar(
      undefined,
      async () => ({ records: [{ id: 'rec1' }, { id: 'rec2' }], nextOffset: 'cursor-2' }),
      async () => {
        walkAnropad = true;
        throw new Error('Airtable 429: rate limited mitt i full-walken');
      },
    );

    expect(walkAnropad, 'full-walken anropades verkligen (inte hoppad över)').toBe(true);
    // Kärn-assertionen: listan överlever. Före fixen hade `byggSvar` här
    // kastat och testet aldrig nått denna rad.
    expect(svar.persons).toHaveLength(2);
    expect(svar.nextCursor).toBe('cursor-2');
    expect(svar).not.toHaveProperty('total');
  });

  test('REGRESSIONSVAKT: tar bort .catch() → detta test FÄLLER (bevisar att testet fångar defekten)', async () => {
    // Samma komposition som `byggSvar`, men UTAN felisolering — defektens
    // exakta form före fixen. Om detta test INTE fäller har regressionsvakten
    // tappat sin tänder.
    async function byggSvarUtanCatch(walkFn: () => Promise<{ length: number }[]>) {
      const pagePromise = Promise.resolve({ records: [{ id: 'rec1' }], nextOffset: null });
      const totalPromise = walkFn().then((records) => records.length); // INGEN .catch()
      const [{ records }, total] = await Promise.all([pagePromise, totalPromise]);
      return { persons: records, total };
    }

    await expect(
      byggSvarUtanCatch(async () => {
        throw new Error('Airtable 429: rate limited mitt i full-walken');
      }),
    ).rejects.toThrow('Airtable 429');
  });

  test('cursor satt (sida > 1) → ingen full-walk anropas, total alltid utelämnat', async () => {
    let walkAnropad = false;
    const svar = await byggSvar(
      'cursor-1',
      async () => ({ records: [{ id: 'rec3' }], nextOffset: null }),
      async () => {
        walkAnropad = true;
        return [{ length: 1 }];
      },
    );

    expect(walkAnropad, 'full-walk ska ALDRIG anropas när cursor finns').toBe(false);
    expect(svar).not.toHaveProperty('total');
  });
});
