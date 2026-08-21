// get-persons — sök-PARITET mellan EF:ens SEARCH()-formel och klientfiltret
// (ADR-123 beslut 2, TASK-286.2 AC #3 / DoD #5), skarpt mot staging-EF och
// staging-basen.
//
// KORTETS EGET KRAV (task-286.2 § PARITETSTESTET): "samma termlista … körs
// mot EF:ens filterbyggare (formeln mot staging-fixturen) och mot
// klientfiltret på samma fixtur; träffmängderna ska vara identiska. Avviker
// de: STOPPA och rapportera vilken term — bygg aldrig vidare på en gissad
// semantik."
//
// METOD: registret hämtas EN gång (`?register=true`, ADR-123 beslut 1).
// SAMMA `filtreraPersonregister` som `PersonsList.tsx` faktiskt importerar
// (`src/lib/person-sok.ts`) körs mot registret för varje term — detta är
// alltså inte en omskriven kopia av klientlogiken, det ÄR klientlogiken.
// Parallellt anropas EF:ens egen sök-/cursor-gren (`?search=<term>`) för
// SAMMA term. Träffmängderna (person-ID:n, sorterade) jämförs för LIKHET.
//
// FIXTUR: hela staging-Personer-tabellen (basfiltrerad, ~60 poster
// 2026-08-21 — se `TASK-286` § Ytterligare anteckningar). INGEN ny fixtur
// skapas eller ändras av detta test (read-only mot basen). Termlistan är
// medvetet vald mot REDAN BEFINTLIGT, mätt innehåll:
//
//   · 'åsa'/'asa'/'ås'   — `recJoNC9kGJD145XQ` "Åsa-ZZ-Bokstavsindex Fixture"
//                           (TASK-283-fixturen ADR-123:s egen diakritik-
//                           mätning använde). Diakritik-KÄNSLIGHETEN är
//                           kärnan i beslut 2 — utan en verklig å-bärande
//                           post i basen bevisar 'asa'/'åsa' bara "båda gav
//                           noll träffar", vilket INTE är samma sak som
//                           "klienten är diakritik-känslig".
//   · 'ej till'          — `recX4xCNB2negjqQk` "Ej tillgängligt" (namnlös-
//                           sentinelen, `data-model.md` fälla 43/51).
//   · '070'/'070-'/'070 1' — `recxF88ZKUbP9JUs1` Sofia Isaksson, ENDA
//                           posten med ifylld Telefon ("070-233 14 56") vid
//                           mätningstillfället (`list_records` via
//                           Airtable-MCP, 2026-08-21). '070 1' saknar en
//                           motsvarande delsträng i det numret — testet
//                           bevisar då att BÅDA sidor enas om NOLL träffar,
//                           lika giltigt som ett positivt fynd.
//   · 'falköping'        — en verklig, upprepad Ort i basfiltrets mängd.
//   · 'example.com'      — en verklig e-postdomän (RFC 2606) som bärs av
//                           flera poster.
//   · 'anna'/'ANNA'      — MÄTT att INGEN nuvarande post innehåller
//                           delsträngen (kortets egen minimilista kräver
//                           termen ändå) — ett giltigt noll=noll-
//                           parbevis för skiftlägesokänsligheten, inte ett
//                           positivt träffbevis. Se p.p. citatet ovan: ett
//                           enda "0=0"-utfall bevisar bara att TERMEN i sig
//                           inte råkar träffa något just nu, inte att
//                           skiftläget hanteras rätt — 'ANNA' vs 'anna' ger
//                           samma (tomma) mängd på BÅDA sidor oavsett, så
//                           den positiva skiftlägesproven bärs i stället av
//                           `tests/api/person-sok.test.ts` (pure, kontrollerad
//                           fixtur) — denna svit bevisar bara att en REAL
//                           körning mot staging inte AVVIKER för termen.
//   · ''                 — tom sträng, EF:ens egen falsy-check (`if (search)`)
//                           degraderar till "inget filter" på samma sätt
//                           klientens `filtreraPersonregister('', …)` gör.
//
// KÄND, BOKFÖRD KANT (ej testad här): EF:en söker Ort via
// `ARRAYJOIN({Ort})` (kommaseparerad sträng), klienten via "något element"
// (`person-sok.ts`s filhuvud, ADR-123 beslut 2 PRD-valet). En söksträng
// konstruerad för att spänna över just kommaseparatorn (t.ex.
// `", "`-gränsen mellan två Ort-värden) skulle kunna divergera — ingen sådan
// term ingår i kortets minimilista, och ingen post i det mätta urvalet
// (2026-08-21) har den formen naturligt. Flaggat, inte gissat bort.

import { type APIRequestContext, expect, test } from '@playwright/test';
import type { z } from 'zod';
import type { PersonSchema } from '../../src/domain/schemas';
import { filtreraPersonregister } from '../../src/lib/person-sok';
import { type ApiConfig, getApiConfig, getValidUserJWT } from './helpers';

type RawPerson = z.infer<typeof PersonSchema>;

async function hamtaRegister(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
): Promise<RawPerson[]> {
  const url = new URL(`${config.baseUrl}/functions/v1/get-persons`);
  url.searchParams.set('register', 'true');

  const res = await request.get(url.toString(), {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  expect(res.status(), 'get-persons?register=true ska svara 200').toBe(200);

  const body = (await res.json()) as { persons: RawPerson[] };
  return body.persons;
}

/**
 * EF:ens sök-/cursor-gren, EN sida (pageSize 100 — staging bär ~60
 * basfilter-träffar totalt, väl under taket). `nextCursor` asserteras null
 * så antagandet "en sida räcker" håller mekaniskt i stället för att tystas.
 */
async function hamtaEfSoktraffar(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  term: string,
): Promise<string[]> {
  const url = new URL(`${config.baseUrl}/functions/v1/get-persons`);
  url.searchParams.set('search', term);
  url.searchParams.set('pageSize', '100');

  const res = await request.get(url.toString(), {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  expect(res.status(), `get-persons?search=${JSON.stringify(term)} ska svara 200`).toBe(200);

  const body = (await res.json()) as {
    persons: Array<{ id: string }>;
    nextCursor: string | null;
  };
  expect(
    body.nextCursor,
    `get-persons?search=${JSON.stringify(term)} gav fler träffar än EN sida (pageSize 100) rymmer — paritetstestets "en sida räcker"-antagande håller inte längre, höj pageSize eller sidnumrera.`,
  ).toBeNull();

  return body.persons.map((p) => p.id).sort();
}

/** Kortets egen minimilista (task-286.2 § PARITETSTESTET), ordagrant. */
const TERMLISTA = [
  'anna',
  'ANNA',
  'åsa',
  'asa',
  'ås',
  'ej till',
  '070',
  '070-',
  '070 1',
  'falköping',
  'example.com',
  '',
] as const;

test.describe('get-persons — sök-paritet: EF:ens SEARCH() vs klientfiltret (ADR-123 beslut 2)', () => {
  for (const term of TERMLISTA) {
    const etikett = term === '' ? '(tom sträng)' : term;

    test(`"${etikett}" — klientfiltret och EF:ens SEARCH() enas om exakt samma personer`, async ({
      request,
    }) => {
      const config = getApiConfig();
      const jwt = await getValidUserJWT(request, config);

      const [register, efTraffar] = await Promise.all([
        hamtaRegister(request, config, jwt),
        hamtaEfSoktraffar(request, config, jwt, term),
      ]);

      const klientTraffar = filtreraPersonregister(register, term)
        .map((p) => p.id)
        .sort();

      expect(
        klientTraffar,
        `term ${JSON.stringify(term)} — klientfiltrets träffmängd (${klientTraffar.length}) avviker från EF:ens SEARCH()-formel (${efTraffar.length}). Bygg ALDRIG vidare på en gissad semantik (kortets egen instruktion) — diagnostisera denna termen specifikt innan koden ändras.`,
      ).toEqual(efTraffar);
    });
  }
});
