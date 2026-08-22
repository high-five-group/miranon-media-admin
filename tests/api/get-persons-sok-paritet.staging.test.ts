// get-persons — sök-LIKVÄRDIGHET mellan eventväljarens filter och
// personlistans klientfilter (ADR-123 beslut 2 + § Updates 2026-08-22,
// TASK-286.7 AC #2), skarpt mot staging-basen.
//
// ═══ FACIT-KÄLLAN BYTTE, 2026-08-22 ═══
//
// Filen krävde tidigare att klientfiltrets träffmängd var IDENTISK med EF:ens
// `SEARCH()`-formel (task-286.2 § PARITETSTESTET). Marcus beslutade
// breddningen 2026-08-22 (TASK-286.5, JA): personsökningen ska vara
// diakritik-TOLERANT, precis som eventväljaren. Hans motivering, ordagrant:
// paritet med Airtables `SEARCH()` var "en mätning av dagens läge, aldrig ett
// mål", och träffmängden växer åt rätt håll — fler namn, aldrig färre.
//
// NYA FACIT: klientfiltret ska ge SAMMA träffmängd som eventväljarens filter,
// alltså `useFilter({ sensitivity: 'base' })`-semantiken
// (`react-aria-components`, `EventValjare.tsx` rad 177 → 393), applicerad på
// de fyra sökfälten Namn, E-post, Telefon och Ort ("något element" för Ort —
// PRD-valet, oförändrat).
//
// EF:EN ÄR INTE LÄNGRE FACIT, OCH TAPPAR INGEN TÄCKNING. `?search=`-grenen
// anropas inte längre härifrån. Den är fortsatt testad — `tests/api/
// get-persons.staging.test.ts` kör dess cursor-conformance (ADR-056) mot
// `?search=<fixturprefix>` skarpt mot samma staging-bas. Det som togs bort är
// ett FACIT-anspråk, inte en testyta (kontrollerat före rivningen).
//
// ═══ METOD ═══
//
// Registret hämtas EN gång (`?register=true`, ADR-123 beslut 1) — VERKLIGA
// svenska namn, orter och e-postadresser ur staging-basen, vilket är hela
// skälet att provet bor i en staging-svit i stället för på en syntetisk
// fixtur. För varje term körs två filtreringar över SAMMA register:
//
//   1. SAMMA `filtreraPersonregister` som `PersonsList.tsx` faktiskt
//      importerar (`src/lib/person-sok.ts`) — inte en omskriven kopia av
//      klientlogiken, det ÄR klientlogiken.
//   2. `eventvaljarFilter()` nedan — en OBEROENDE replik av eventväljarens
//      matchning, skriven ur `useFilter`s egen källa (`react-aria` 3.51.0,
//      `dist/private/i18n/useFilter.mjs` + `useCollator.mjs`) och medvetet
//      INTE importerad ur `person-sok.ts`. Repliken är poängen: importerade
//      den implementationen den ska pröva vore varje utfall grönt per
//      konstruktion.
//
// Träffmängderna (person-ID:n, sorterade) jämförs för LIKHET.
//
// FIXTUR: hela staging-Personer-tabellen (basfiltrerad, ~60 poster
// 2026-08-21 — se `TASK-286` § Ytterligare anteckningar). INGEN ny fixtur
// skapas eller ändras av detta test (read-only mot basen). Termlistan är
// medvetet vald mot REDAN BEFINTLIGT, mätt innehåll:
//
//   · 'åsa'/'asa'/'ås'   — `recJoNC9kGJD145XQ` "Åsa-ZZ-Bokstavsindex Fixture"
//                           (TASK-283-fixturen ADR-123:s egen diakritik-
//                           mätning använde). Diakritik-TOLERANSEN är kärnan
//                           i det nya facit — utan en verklig å-bärande post
//                           i basen bevisar 'asa'/'åsa' bara "båda gav noll
//                           träffar", vilket INTE är samma sak som att
//                           klienten viker diakritiker. Därav det egna,
//                           skärpta testet sist i filen.
//   · 'ej till'          — `recX4xCNB2negjqQk` "Ej tillgängligt" (namnlös-
//                           sentinelen, `data-model.md` fälla 43/51).
//   · '070'/'070-'/'070 1' — `recxF88ZKUbP9JUs1` Sofia Isaksson, ENDA
//                           posten med ifylld Telefon ("070-233 14 56") vid
//                           mätningstillfället (`list_records` via
//                           Airtable-MCP, 2026-08-21). '070 1' saknar en
//                           motsvarande delsträng i det numret — testet
//                           bevisar då att BÅDA sidor enas om NOLL träffar,
//                           lika giltigt som ett positivt fynd. Breddningen
//                           rör diakritiker, inte skiljetecken, så termen är
//                           opåverkad av bytet.
//   · 'falköping'        — en verklig, upprepad Ort i basfiltrets mängd.
//   · 'example.com'      — en verklig e-postdomän (RFC 2606) som bärs av
//                           flera poster.
//   · 'anna'/'ANNA'      — MÄTT att INGEN nuvarande post innehåller
//                           delsträngen (kortets egen minimilista kräver
//                           termen ändå) — ett giltigt noll=noll-
//                           parbevis för skiftlägesokänsligheten, inte ett
//                           positivt träffbevis. Ett enda "0=0"-utfall
//                           bevisar bara att TERMEN i sig inte råkar träffa
//                           något just nu, inte att skiftläget hanteras rätt
//                           — 'ANNA' vs 'anna' ger samma (tomma) mängd på
//                           BÅDA sidor oavsett, så den positiva
//                           skiftlägesproven bärs i stället av
//                           `tests/api/person-sok.test.ts` (pure, kontrollerad
//                           fixtur) — denna svit bevisar bara att en REAL
//                           körning mot staging inte AVVIKER för termen.
//   · ''                 — tom sträng: BÅDA sidor degraderar till "inget
//                           filter" (`if (!rawTerm) return true` respektive
//                           `useFilter`s egen `if (substring.length === 0)
//                           return true`).
//
// De diakritik-fria termerna ovan ('anna', 'ANNA', 'ej till', '070', '070-',
// '070 1', 'falköping' som helord, 'example.com', '') är opåverkade av bytet
// — de mätte samma sak före och efter, bara mot ett annat facit.
//
// KANTEN SOM FÖRSVANN MED EF-FACIT: den gamla headern flaggade att EF:en
// söker Ort via `ARRAYJOIN({Ort})` medan klienten kör "något element", så en
// söksträng som spänner kommaseparatorn kunde divergera. Den kanten var en
// EF-vs-klient-fråga och är inte längre detta tests sak — repliken nedan
// tillämpar "något element" på exakt samma sätt som klienten. `ARRAYJOIN`-
// beteendet står kvar bokfört i `person-sok.ts`s historik och i ADR-123.

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
 * EVENTVÄLJARENS FILTER, oberoende replik — facit-källan sedan TASK-286.7.
 *
 * Skriven ur `useFilter`s egen källa (`react-aria` 3.51.0,
 * `dist/private/i18n/useFilter.mjs`), inte ur `person-sok.ts`. Hooken kan inte
 * anropas här (den kräver render-kontext), men dess `contains` är ren
 * beräkning: NFC-normalisera båda sidor, glid sedan ett fönster med
 * söktermens längd genom texten och fråga en `usage: 'search'`-collator med
 * `sensitivity: 'base'` om de är lika.
 *
 * LOKALEN ÄR MEDVETET SAMMA SOM KLIENTENS vikningslokal, och det är en
 * verklig avvägning värd att veta om: `useFilter` tar sin lokal ur
 * `useLocale()`, som utan en `I18nProvider` faller tillbaka på
 * `navigator.language` — eventväljaren monteras inte under någon sådan
 * provider (`ManuellAnmalanForm`, `EventDetail`, `AtgardsSida`), så DESS
 * tolerans följer webbläsarens språk. Personlistan pinnar i stället lokalen
 * (`person-sok.ts` § LOKALEN ÄR MÄTT), eftersom en svensk `navigator.language`
 * ger NOLL diakritik-tolerans — Å/Ä/Ö är egna bokstäver i svensk kollation.
 * Repliken speglar därför den semantik beslutet FASTSTÄLLDE, inte den
 * lokalberoende variant eventväljaren råkar få i en viss webbläsare.
 */
const EVENTVALJAR_KOLLATION = new Intl.Collator('en-US', {
  usage: 'search',
  sensitivity: 'base',
});

function eventvaljarContains(text: string, delstrang: string): boolean {
  if (delstrang.length === 0) return true;
  const hostack = text.normalize('NFC');
  const nal = delstrang.normalize('NFC');
  for (let start = 0; start + nal.length <= hostack.length; start++) {
    if (EVENTVALJAR_KOLLATION.compare(nal, hostack.slice(start, start + nal.length)) === 0) {
      return true;
    }
  }
  return false;
}

/** Samma fyra sökfält som klienten, "något element" för Ort (PRD-valet). */
function eventvaljarFilter(register: RawPerson[], term: string): string[] {
  if (!term) return register.map((p) => p.id).sort();
  return register
    .filter(
      (p) =>
        (typeof p.namn === 'string' && eventvaljarContains(p.namn, term)) ||
        (typeof p.email === 'string' && eventvaljarContains(p.email, term)) ||
        (typeof p.telefon === 'string' && eventvaljarContains(p.telefon, term)) ||
        p.ort.some((ort) => eventvaljarContains(ort, term)),
    )
    .map((p) => p.id)
    .sort();
}

/**
 * Kortets egen minimilista (task-286.2 § PARITETSTESTET), ordagrant och
 * OFÖRÄNDRAD av TASK-286.7 — samma termer, nytt facit (AC #2).
 */
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

/** TASK-283-fixturen "Åsa-ZZ-Bokstavsindex Fixture" — basens å-bärande post. */
const ASA_FIXTUR_ID = 'recJoNC9kGJD145XQ';

test.describe('get-persons — sök-likvärdighet: eventväljarens filter vs klientfiltret (ADR-123 beslut 2, TASK-286.7)', () => {
  for (const term of TERMLISTA) {
    const etikett = term === '' ? '(tom sträng)' : term;

    test(`"${etikett}" — klientfiltret och eventväljarens filter enas om exakt samma personer`, async ({
      request,
    }) => {
      const config = getApiConfig();
      const jwt = await getValidUserJWT(request, config);
      const register = await hamtaRegister(request, config, jwt);

      const klientTraffar = filtreraPersonregister(register, term)
        .map((p) => p.id)
        .sort();
      const eventvaljarTraffar = eventvaljarFilter(register, term);

      expect(
        klientTraffar,
        `term ${JSON.stringify(term)} — klientfiltrets träffmängd (${klientTraffar.length}) avviker från eventväljarens filter (${eventvaljarTraffar.length}). Bygg ALDRIG vidare på en gissad semantik — diagnostisera denna termen specifikt innan koden ändras.`,
      ).toEqual(eventvaljarTraffar);
    });
  }

  /**
   * AC #2:s SKÄRPTA facit — det likvärdighetsloopen ovan ensam inte kan visa.
   *
   * Loopen jämför två implementationer med varandra; blev BÅDA
   * diakritik-känsliga igen vore varje term fortsatt grön. Detta test mäter i
   * stället EGENSKAPEN mot verklig staging-data: 'asa' och 'åsa' ska ge exakt
   * samma, ICKE-TOMMA mängd. Före TASK-286.7 gav de olika mängder — det var
   * hela poängen med beslut 2:s ursprungliga formulering.
   *
   * VARFÖR 'ås' PRÖVAS SOM DELMÄNGDS-RELATION OCH INTE SOM LIKHET: kortets
   * AC #2 skriver "'ås' ger samma mängd som de två". Den likheten är en
   * förutsägelse om staging-DATAN, inte en egenskap hos semantiken — 'ås'
   * viks till 'as', som är ett ÄKTA prefix av 'asa', så mängden kan bara växa
   * (varje 'asa'-träff är en 'as'-träff, aldrig tvärtom).
   *
   * OCH DEN FÖRUTSÄGELSEN ÄR FALSIFIERAD, inte bara teoretiskt skör. Mätt mot
   * staging 2026-08-22 (60 poster i registret), samma register före och efter
   * breddningen:
   *
   *   term     före  efter
   *   'asa'       0      1   ← beslutets kärna: Åsa hittas nu utan diakritik
   *   'åsa'       1      1
   *   'ås'        1     11   ← 'as' finns i Astrid, Hassan, Rasmus, Tobias …
   *
   * Att låsa 'ås' till likhet hade alltså gjort sviten röd i samma commit som
   * genomförde beslutet. Superset-relationen plus fixturens närvaro är
   * däremot mekaniskt sann och fäller allt breddningen faktiskt kan gå
   * sönder på. Övriga termer i TERMLISTA mätte identiskt före och efter
   * ('anna' 0=0, 'ej till' 1=1, '070' 1=1, 'falköping' 15=15,
   * 'example.com' 18=18) — precis som AC #2 förutsäger för dem.
   */
  test('AC #2 — "asa" och "åsa" ger EXAKT samma, icke-tomma mängd; "ås" är dess superset', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const register = await hamtaRegister(request, config, jwt);

    const traffar = (term: string) =>
      filtreraPersonregister(register, term)
        .map((p) => p.id)
        .sort();

    const utanDiakritik = traffar('asa');
    const medDiakritik = traffar('åsa');
    const prefix = traffar('ås');

    expect(
      utanDiakritik,
      `"asa" och "åsa" ska ge samma träffmängd sedan TASK-286.7 (Marcus JA 2026-08-22). Skiljer de sig är vikningen borta — se person-sok.ts § LOKALEN ÄR MÄTT.`,
    ).toEqual(medDiakritik);

    expect(
      utanDiakritik,
      `Mängden är TOM. Då bevisar likheten ovan ingenting (0 = 0). Basens å-bärande post ${ASA_FIXTUR_ID} ("Åsa-ZZ-Bokstavsindex Fixture") saknas eller föll ur basfiltret — laga fixturen, tysta inte testet.`,
    ).toContain(ASA_FIXTUR_ID);

    expect(
      prefix,
      `"ås" viks till "as" och måste därför träffa minst allt "asa" träffar (äkta prefix).`,
    ).toEqual(expect.arrayContaining(utanDiakritik));
  });
});
