// Kontraktstest för `senasteInteraktion`s GRAMMATIK — den SKARPA halvan
// (ADR-108). Pinnar de två permanenta staging-personerna mot LIVE
// Airtable-formeltext.
//
// VARFÖR SKARPT, INTE HERMETISKT (motivering enligt uppdraget): meningen
// komponeras helt i Airtable-formler som lever UTANFÖR git — inget
// versionerat schema-as-code, ingen diff, ingen CI-granskning av
// formeltexten (`airtable-constraints.md` P25). En hermetisk fixtur
// (`tests/support/fixturvarld/fixture-data.ts`) är en handskriven
// TypeScript-literal som ALDRIG anropar Airtable — den kan bara bevaka att
// NÅGON råkar redigera fixturfilen fel, inte att formeln själv regredierar
// (fel SWITCH-gren, borttappad IF, en RIM-kortform som slutar mappas). Bara
// ett skarpt anrop mot en känd, permanent post bevisar att formeln FORTFARANDE
// producerar rätt form. Den billiga halvan av kontraktet —
// `senaste-interaktion-grammatik.test.ts` (api-pure) — bevisar att
// matcharna själva är korrekta (fäller gammal form, godkänner ny); detta
// test bevisar att den LIVE datan matchar dem.
//
// Auth via getValidUserJWT → password-grant (samma mönster som övriga
// *.staging.test.ts). Lokalt skip:as sviten utan TEST_USER-creds; det
// skarpa beviset körs i CI (STAGING_REQUIRED=1).
//
// TVÅ PERMANENTA FIXTURER, TVÅ AV FYRA ANMÄLNINGS-KOMBINATIONER:
//   - `ZZ-Arbetsko Person 01` (ARBETSKO_PERSON_ID): kurs OCH ort.
//   - `ZZ-History Person 01` (HISTORY_PERSON_ID): ort men INGEN kurs — ett
//     kantfall uppdraget inte räknade upp, hittat genom att faktiskt läsa
//     denna posts live-värde (se ADR-108).
// ÖPPEN LUCKA, BOKFÖRD (ej tyst): ingen av de nuvarande 27 Personerna i
// staging (mätt 2026-08-10) har DELTAGANDE som vinnande gren i
// `Senaste interaktion (text)` — tie-break-regeln favoriserar anmälan så
// länge en sådan finns (data-model.md §"Tie-break"). Deltagandegrenens
// grammatik bevisas därför bara i api-pure-testet, mot LIVE-hämtade men
// hårdkodade litteraler (se den filens docblock) — inte skarpt här. Uppstår
// en framtida permanent fixtur där deltagande vinner är detta rätt ställe
// att lägga till den tredje pin-posten.

import { type APIRequestContext, expect, test } from '@playwright/test';
import { PersonDetailSchema } from '../../src/domain/schemas';
import { ANMALAN_MENING, GAMMALT_DATUMPREFIX } from '../support/senasteInteraktionGrammatik';
import { ARBETSKO_PERSON_ID, HISTORY_PERSON_ID } from './fixtures';
import { type ApiConfig, getApiConfig, getValidUserJWT } from './helpers';

async function callGetPerson(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  id: string,
) {
  return request.get(`${config.baseUrl}/functions/v1/get-person?id=${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
}

test.describe('senasteInteraktion — skarp pin mot permanenta staging-fixturer (ADR-108)', () => {
  test('ZZ-Arbetsko Person 01: kurs+ort-kombinationen, exakt värde', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await callGetPerson(request, config, jwt, ARBETSKO_PERSON_ID);
    expect(res.status()).toBe(200);

    const body = (await res.json()) as { person: unknown };
    const person = PersonDetailSchema.parse(body.person);

    // Exakt pin — denna fixtur är permanent och orörd (fixtures.ts), så
    // värdet ska vara stabilt. Regredierar formeln (fel SWITCH-gren, tappad
    // ort-klausul) fäller EXAKT-jämförelsen innan grammatik-regexen ens
    // hinner köras.
    expect(person.senasteInteraktion).toBe('Anmälde sig till Fjärrskådning i ZZ-arbetsko-fixtur');
    expect(person.senasteInteraktion && ANMALAN_MENING.test(person.senasteInteraktion)).toBe(true);
    expect(person.senasteInteraktion && GAMMALT_DATUMPREFIX.test(person.senasteInteraktion)).toBe(
      false,
    );
  });

  test('ZZ-History Person 01: ort-utan-kurs-kombinationen, exakt värde', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await callGetPerson(request, config, jwt, HISTORY_PERSON_ID);
    expect(res.status()).toBe(200);

    const body = (await res.json()) as { person: unknown };
    const person = PersonDetailSchema.parse(body.person);

    // Denna person har en Anmälan utan länkat Event-kurs (ort finns, kurs
    // saknas) — formelns " till "-klausul ska då utebli helt, inte falla
    // tillbaka på ett tomt " till ". Live-verifierat 2026-08-10.
    expect(person.senasteInteraktion).toBe('Anmälde sig i ZZ-Göteborg');
    expect(person.senasteInteraktion && ANMALAN_MENING.test(person.senasteInteraktion)).toBe(true);
    expect(person.senasteInteraktion?.includes(' till ')).toBe(false);
  });
});
