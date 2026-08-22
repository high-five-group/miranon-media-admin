import AxeBuilder from '@axe-core/playwright';
import type { NetworkFixture } from '@msw/playwright';
import { http } from 'msw';
import type { z } from 'zod';
import type { PersonDetailSchema } from '../../src/domain/schemas';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from './support/acceptance-bas';

/**
 * Fas 6a L5a — Persondetalj (aggregerande get-person, full kurshistorik).
 *
 * ACCEPTANCE-KLASSEN (task-59.4, ADR-080): filen flyttades hit ur e2e-sviten
 * med hela sitt bevisinnehåll intakt — a11y-assertionerna inkluderade.
 * Klassningen är HÄRLEDD ur hermetik-mätningen (`.hermetik/rapport.jsonl`): 18
 * restanrop, samtliga typsnitt, noll skarpa.
 *
 * **Deterministisk via `network.use()`** — en överskuggning på fixturvärldens
 * delade normalläge, inte `page.route`. Page-routes prövas FÖRE MSW:s
 * context-routes, så en page.route-mock hade lagt en andra avlyssningsmekanism
 * ovanpå den fixturvärlden bär — precis den tudelning task-54.2 tog bort.
 *
 * PREFIX-KOLLISIONEN ÄR LÖST AV MÖNSTERFORMEN, INTE AV ETT FRÅGETECKEN. Den
 * gamla regexen `/get-person\?/` bar frågetecknet enbart för att en `page.route`-
 * substrängsmatchning annars hade svalt `get-persons`. `EF('get-person')` matchar
 * hela sista path-segmentet (MSW/path-to-regexp) och kan därför per konstruktion
 * inte träffa `get-persons` — samma sak som skiljer `get-event` från
 * `get-events` i normalläget. En egenskriven sträng hade i stället kunnat drifta
 * ifrån normalläget och tyst falla igenom till det (den tysta fällan,
 * `hermetic.ts` § Överskugga en delad handler).
 *
 * ÖVERSKUGGNINGEN BEHÖVS trots att normalläget bär en `get-person`-resolver:
 * dess kuraterade personer (`fixture-data.ts` § Personer-världen) är två fasta
 * fall, medan denna fil prövar sex olika svarsformer — namnlös med och utan
 * e-post, 404, 400, parkerat svar och glesa tomtillstånd. Svaren behåller
 * EF:ens egen form (`{ person }`, PersonDetailSchema) — snittet ligger kvar vid
 * protokollet.
 *
 * Täckning: full-historik-rendering, kontakt/leads/flaggor, namnlös-fallback,
 * loading aria-busy, fel-state, NOT-FOUND (404 → ej-funnen-UI), fokus→<h1> +
 * aria-live-annonsering, axe 0.
 */

const PERSON_ID = 'recDETAIL0000001';

/** Härledd ur schemat, ej beskriven bredvid det (TASK-63) — se `acceptance-bas.ts` § fogen. */
type PersonDetailMock = z.infer<typeof PersonDetailSchema>;

function personDetail(overrides: Partial<PersonDetailMock> = {}): PersonDetailMock {
  return {
    id: PERSON_ID,
    namn: 'Anna Andersson',
    fornamn: 'Anna',
    efternamn: 'Andersson',
    email: 'anna@example.test',
    telefon: '070-1234567',
    ort: ['Skövde'],
    manuellFlagga: null,
    aiFlagga: 'Erfaren',
    anteckningar: 'Viktig kontakt — ring före nästa event.',
    antalAnmalningar: 3,
    antalDeltaganden: 5,
    erfarenhetsniva: 'Genomfört RIM steg 1–2',
    erfarenhetsbadge: 'Resenär steg 1–2',
    senasteInteraktion: 'RIM 2',
    senasteInteraktionDatum: '2026-03-01',
    dagarSedanSenaste: 100,
    harAktivAnmalan: 'Aktiv',
    ejGodkandMail: false,
    radSkapad: '2026-01-01T00:00:00.000Z',
    anmalningIds: ['recANM0000000001'],
    deltagandeIds: ['recDLT0000000001', 'recDLT0000000002'],
    aterkommande: 'Ja',
    nastaEvent: 'RIM 2 — Skövde',
    antalGenomfordaEvent: 2,
    senasteDeltagandeDatum: '2026-03-01',
    antalHamtningar: 1,
    allaHamtningar: ['Gratis meditation'],
    motivering: ['Vill utvecklas vidare.'],
    // S103 steg 2: samma innehåll som allaHamtningar/motivering ovan, nu som
    // strukturerade poster (id + datum + erbjudande/event) bredvid.
    hamtningar: [
      {
        id: 'recTP0000000001',
        erbjudande: 'Gratis meditation',
        typ: 'Angett e-post för att ta del av ett erbjudande',
        datum: '2026-01-20',
      },
    ],
    motiveringar: [
      {
        id: 'recANM0000000001',
        motivering: 'Vill utvecklas vidare.',
        event: 'Resor i medvetandet 2',
        datum: '2026-02-20T09:00:00.000Z',
        eventDatum: '2026-03-14',
        ort: 'Skövde',
        eventId: 'recEVT0000000001',
      },
    ],
    flagga: null,
    inbjudenCommunity: true,
    skapatKontoCommunity: false,
    historik: [
      {
        id: 'recDLT0000000002',
        kursnamn: 'Resor i medvetandet 2',
        eventLabel: 'RIM 2 — Göteborg 2026-03-01',
        datum: '2026-03-01',
        session: 'Dag 1',
        status: 'Frånvarande',
        narvaro: false,
        ort: 'Göteborg',
        typ: 'Utbildning',
        // Länkmålets halvor (S103 2026-08-12) — null: båda posterna är
        // HISTORISKA, och historiska event-poster länkas med avsikt inte
        // (deras anmälan nås via strömmens egen anmälnings-post).
        eventId: null,
        registrationId: null,
      },
      {
        id: 'recDLT0000000001',
        kursnamn: 'Resor i medvetandet 1',
        eventLabel: 'RIM 1 — Skövde 2026-02-01',
        datum: '2026-02-01',
        session: 'Dag 1',
        status: 'Närvarande',
        narvaro: true,
        ort: 'Skövde',
        typ: 'Utbildning',
        eventId: null,
        registrationId: null,
      },
    ],
    ...overrides,
  };
}

/**
 * Överskuggar `get-person` för ETT test och returnerar gatens släpp-funktion.
 *
 * manualRelease (opt-in): håll EF-svaret öppet tills testet kallar release().
 * Gör loading-fönstret DETERMINISTISKT i stället för att racea en fast delay mot
 * realtid under parallell worker-last (T26 Landning B). Parkeringen bärs sedan
 * task-59.4 av ett obesvarat löfte i MSW-resolvern i stället för av ett
 * uppskjutet Playwright-Route-objekt — samma bevis, en avlyssningsmekanism.
 * Callers utan flaggan är orörda: release() är då en no-op de ignorerar.
 *
 * (Den tidigare `delayMs`-grenen följde INTE med. Ingen caller använde den, och
 * den var uttryckligen den race-benägna väg `manualRelease` ersatte — att bära
 * den vidare in i en hermetisk klass hade varit att bevara en foot-gun.)
 */
function mockPerson(
  network: NetworkFixture,
  body: PersonDetailMock,
  { status = 200, manualRelease = false }: { status?: number; manualRelease?: boolean } = {},
): () => void {
  let release = () => {};
  const gate = manualRelease ? new Promise<void>((resolve) => (release = resolve)) : null;
  network.use(
    http.get(EF('get-person'), async () => {
      if (gate) await gate;
      return status === 200 ? json({ person: body }) : json({ error: 'x' }, status);
    }),
  );
  return release;
}

test.describe('Persondetalj (Fas 6a L5a — aggregerande get-person)', () => {
  test('full historik + kontakt/leads/flaggor renderas; fokus → <h1>', async ({
    page,
    network,
  }) => {
    mockPerson(network, personDetail());
    await page.goto(`/personer/${PERSON_ID}`);

    // <h1> = namn, fokuserad efter async-laddning.
    const heading = page.getByRole('heading', { level: 1, name: 'Anna Andersson' });
    await expect(heading).toBeVisible();

    // Stabil data-gate FÖRE fokus-assertionen: aria-live-annonsen renderas bara i
    // det laddade tillståndet (PersonDetail.tsx:154-155) → fokus-useEffect
    // (PersonDetail.tsx:98-104) har då körts. Gör toBeFocused-väntan deterministisk
    // i stället för att racea loading→loaded-monteringen under parallell last (T26).
    await expect(page.getByText('Persondetaljer för Anna Andersson laddade.')).toHaveCount(1);
    await expect(heading).toBeFocused();

    // COPY-MIGRERAD 2026-08-12 (ADR-103 B2 steg 1, D-formens promovering).
    // Listan heter `Eventhistorik, senaste först` — inte `Kurshistorik` — och
    // raderna bär KURSNAMNET, inte eventLabel-strängen. Ordningen (senaste
    // först) är fortfarande löftet aria-label ger, och den prövas av
    // `.first()` nedan.
    const history = page.getByRole('list', { name: /Eventhistorik/ });
    await expect(history.getByRole('listitem')).toHaveCount(2);
    await expect(history.getByRole('listitem').first()).toContainText('Resor i medvetandet 2');
    await expect(history.getByRole('listitem').last()).toContainText('Resor i medvetandet 1');

    // Kontakt + leads. Hämtningen SCOPAS till sitt eget block: D visar den
    // både i interaktionsströmmen och under "Hämtade erbjudanden" (medvetet —
    // strömmen behåller hela sitt innehåll, blocken är fördjupningar), så en
    // oscopad getByText fäller på strict mode med två träffar.
    await expect(page.getByText('anna@example.test')).toBeVisible();
    await expect(
      page.getByLabel('Hämtade erbjudanden').getByText('Gratis meditation'),
    ).toBeVisible();

    // AI-FLAGGAN ASSERTERAS INTE LÄNGRE — den finns inte i D. Marcus lyfte ut
    // den 2026-08-10: *"AI flagga avvaktar vi med, den borde egentligen in i
    // anmälningsdetalj-sidan, inte här"* (se `flaggorD` i komponenten). Raden
    // är BORTTAGEN, inte tystad: en assertion på en yta som medvetet inte
    // finns hade blivit vakuöst grön den dag strängen försvann helt.
    await expect(page.getByText('AI-flagga: Erfaren')).toHaveCount(0);

    // Anteckningar (READ-ONLY i L5a).
    await expect(page.getByText('Viktig kontakt — ring före nästa event.')).toBeVisible();
  });

  test('namnlös person → e-post-särskiljd fallback, ingen krasch', async ({ page, network }) => {
    mockPerson(network, personDetail({ namn: null, fornamn: null, efternamn: null }));
    await page.goto(`/personer/${PERSON_ID}`);
    // P4: e-post särskiljer namnlösa leads → unik h1/flik-titel.
    await expect(
      page.getByRole('heading', { level: 1, name: 'Namnlös person - anna@example.test' }),
    ).toBeVisible();
  });

  test('namnlös person UTAN e-post → generisk fallback', async ({ page, network }) => {
    mockPerson(network, personDetail({ namn: null, fornamn: null, efternamn: null, email: null }));
    await page.goto(`/personer/${PERSON_ID}`);
    await expect(page.getByRole('heading', { level: 1, name: 'Namnlös person' })).toBeVisible();
  });

  test('NOT-FOUND (404) → ej-funnen-UI via role=alert', async ({ page, network }) => {
    mockPerson(network, personDetail(), { status: 404 });
    await page.goto(`/personer/${PERSON_ID}`);
    const alert = page.getByRole('alert');
    await expect(alert).toContainText('Personen hittades inte');
  });

  test('övrigt fel (icke-404) → generisk fel-UI via role=alert', async ({ page, network }) => {
    // 400 (klient-fel) → ingen retry (varken fetchWithRetry eller useQuery
    // retryar 4xx) → deterministiskt, snabbt fel. Skiljt från 404-grenen ovan.
    mockPerson(network, personDetail(), { status: 400 });
    await page.goto(`/personer/${PERSON_ID}`);
    await expect(page.getByRole('alert')).toContainText('Kunde inte hämta persondetaljer');
  });

  test('loading-state är tillgängligt (aria-busy + status)', async ({ page, network }) => {
    // Håll EF-svaret öppet → loading-tillståndet är deterministiskt synligt medan
    // route:n hålls (ingen realtids-race mot en fast delayMs under parallell last).
    const release = mockPerson(network, personDetail(), { manualRelease: true });
    await page.goto(`/personer/${PERSON_ID}`);
    // Innan svaret släpps: synlig + sr-tillgänglig laddnings-status.
    await expect(page.getByText('Laddar persondetaljer…')).toBeVisible();
    // Släpp svaret → laddat tillstånd renderas och laddningen försvinner.
    release();
    await expect(page.getByRole('heading', { level: 1, name: 'Anna Andersson' })).toBeVisible();
  });

  test('axe 0 violations på den renderade detaljvyn', async ({ page, network }) => {
    mockPerson(network, personDetail());
    await page.goto(`/personer/${PERSON_ID}`);
    await expect(page.getByRole('heading', { level: 1, name: 'Anna Andersson' })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('GLES data (tom kontakt + inga leads) → axe 0 (empty-state UTANFÖR <dl>)', async ({
    page,
    network,
  }) => {
    // Glest mock exercerar empty-state-vägarna i Kontakt + Leads. Tidigare låg
    // dessa <p> som direkta barn i <dl> → axe `definition-list`/`only-dlitems`
    // (dl får bara dt/dd/div). Rikt mock (ovan) dolde buggen; detta glesa
    // mock bevisar fixen i sin egen svit. Invers-komplement till L142.
    mockPerson(
      network,
      personDetail({
        email: null,
        telefon: null,
        ort: [],
        antalHamtningar: 0,
        allaHamtningar: [],
        motivering: [],
        // De NYA poster-arrayerna måste nollas med, annars är tomläget inte
        // glest (S103 2026-08-12): `allaHamtningar`/`motivering` är de gamla
        // platta rollup-formerna som variant A/B/C läste. D läser `hamtningar`
        // och `motiveringar` — riktiga poster ur get-persons batch — och de
        // ärvde fortfarande basfixturens innehåll, så hämtnings- och
        // motiveringsblocken renderade fyllda i ett test vars hela syfte är
        // tomlägena.
        hamtningar: [],
        motiveringar: [],
      }),
    );
    await page.goto(`/personer/${PERSON_ID}`);
    await expect(page.getByRole('heading', { level: 1, name: 'Anna Andersson' })).toBeVisible();

    // Empty-states renderas (som syskon till <dl>, inte dl-barn).
    // COPY-MIGRERAD 2026-08-12: D delade upp det gamla samlade lead-blocket i
    // två egna block med var sitt tomläge — hämtningarna ("Inga hämtade
    // erbjudanden registrerade.") och motiveringarna ("Inga motiveringar
    // registrerade."). Den gamla strängen "Inga lead-magnet-hämtningar
    // registrerade." finns inte längre någonstans. BÅDA asserteras, så en halv
    // rendering inte passerar som grön.
    await expect(page.getByText('Inga kontaktuppgifter registrerade.')).toBeVisible();
    await expect(page.getByText('Inga hämtade erbjudanden registrerade.')).toBeVisible();
    await expect(page.getByText('Inga motiveringar registrerade.')).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});

/**
 * TASK-299.1 — dev-växeln `?sidram=ny` (AC #4): den delade `SidRam`-
 * primitiven i husets kant-i-kant-dialekt, bakom `import.meta.env.DEV`.
 * UTAN parametern är ytan oförändrad — bevisat av svitens övriga tester
 * ovan, ingen navigerar med flaggan. Rivs igen med växeln (TASK-299.2/
 * 299.6, ADR-103 B2 steg 4).
 */
test.describe('Persondetalj — TASK-299.1 dev-växel `?sidram=ny`', () => {
  test('axe 0 violations med den nya sidramen synlig', async ({ page, network }) => {
    mockPerson(network, personDetail());
    await page.goto(`/personer/${PERSON_ID}?sidram=ny`);
    await expect(page.getByRole('heading', { level: 1, name: 'Anna Andersson' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Tillbaka till personer' })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
