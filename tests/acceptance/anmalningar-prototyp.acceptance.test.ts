import AxeBuilder from '@axe-core/playwright';
import type { NetworkFixture } from '@msw/playwright';
import { http } from 'msw';
import type { z } from 'zod';
import type { RegistrationSchema } from '../../src/domain/schemas';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from './support/acceptance-bas';

/**
 * TASK-299.3 — anmälningssidans divergens-prototyp (`/dev/anmalningar-
 * prototyp`, tre varianter × tre lägen). Prototypen är THROWAWAY (ADR-102/
 * 103) och rivs med hela `dev/anmalningar-prototyp/`-katalogen när Marcus
 * valt variant (AC #6) — den här filen rivs i SAMMA landning, TASK-299.4
 * skriver konvergensens riktiga acceptance-täckning från grunden.
 *
 * Täckning mot kortets Hårda krav: DoD #5 (axe 0 på varje ny/ändrad yta i
 * ALLA fyra tillstånd — lista/filtrerat/tomt/fel — per variant) + DoD #6
 * (höjdlåset som BETEENDE, inte påstående) + AC #4 (raden är sin egen
 * trigger, aldrig ett separat knappelement).
 *
 * Samma hermetiska fixturvärld och `EF('get-registrations')`-överskuggning
 * som `mer-anmalningar.acceptance.test.ts` — dev-routen läser samma
 * `queryKeys.registrations.all` → samma EF, event-lösa gren.
 */

type Row = z.infer<typeof RegistrationSchema>;

function reg(overrides: Partial<Row> = {}): Row {
  return {
    id: `recR${Math.random().toString(36).slice(2, 10)}`,
    namn: null,
    fornamn: 'Anna',
    efternamn: 'Andersson',
    email: 'anna@example.se',
    telefon: '070-1111111',
    eventNamn: 'Resor i medvetandet 1',
    ort: 'Skövde',
    status: 'Bekräftad (mail skickat)',
    flagga: 'Ny anmälan',
    anmalningsavgift: 'Mottagen',
    slutbetalning: 'Ej mottagen',
    betalningspaminnelseSkickad: null,
    inskickad: '2026-06-20T10:00:00.000Z',
    motivering: null,
    tidigareErfarenhet: null,
    antalPlatser: 1,
    notering: null,
    eventId: 'recEvent1',
    personId: 'recPerson1',
    eventmatchning: 'OK',
    ...overrides,
  };
}

function mockRegistrations(
  network: NetworkFixture,
  rows: Row[],
  { status = 200 }: { status?: number } = {},
): void {
  network.use(
    http.get(EF('get-registrations'), () =>
      status === 200 ? json({ registrations: rows }) : json({ error: 'x' }, status),
    ),
  );
}

/** Blandad datamängd — en OK-rad, en Avviker-rad, en Utan-event-rad. Täcker
    samtliga tre eventmatchning-lägen i EN körning. */
function blandadeRader(): Row[] {
  return [
    reg({
      fornamn: 'Carl',
      efternamn: 'Carlsson',
      eventmatchning: 'OK',
      inskickad: '2026-06-22T10:00:00.000Z',
    }),
    reg({
      fornamn: 'Bo',
      efternamn: 'Bengtsson',
      eventmatchning: 'Avviker',
      inskickad: '2026-06-21T10:00:00.000Z',
    }),
    reg({
      fornamn: 'Eva',
      efternamn: 'Ek',
      eventId: null,
      eventNamn: null,
      eventmatchning: 'Utan event',
      inskickad: '2026-06-19T10:00:00.000Z',
    }),
  ];
}

const VARIANTER = ['a', 'b', 'c'] as const;

test.describe('Anmälningssidans divergens-prototyp (TASK-299.3 — /dev/anmalningar-prototyp)', () => {
  for (const variant of VARIANTER) {
    test.describe(`Variant ${variant.toUpperCase()}`, () => {
      test(`lista-läget renderar rader och axe 0 (variant ${variant})`, async ({
        page,
        network,
      }) => {
        mockRegistrations(network, blandadeRader());
        await page.goto(`/dev/anmalningar-prototyp?variant=${variant}&lage=lista`);

        await expect(page.getByRole('heading', { level: 1, name: 'Anmälningar' })).toBeVisible();
        await expect(page.getByText('Carl Carlsson')).toBeVisible();
        await expect(page.getByText('Bo Bengtsson')).toBeVisible();
        await expect(page.getByText('Eva Ek')).toBeVisible();
        // Ofiltrerat läge visar ALLA tre — ingen atgardskon-filtrering.
        await expect(page.getByText('3 anmälningar')).toBeVisible();

        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
          .analyze();
        expect(results.violations).toEqual([]);
      });

      test(`åtgärdskö-läget filtrerar till behoverAtgard och axe 0 (variant ${variant})`, async ({
        page,
        network,
      }) => {
        mockRegistrations(network, blandadeRader());
        await page.goto(`/dev/anmalningar-prototyp?variant=${variant}&lage=atgardskon`);

        await expect(page.getByRole('heading', { level: 1, name: 'Anmälningar' })).toBeVisible();
        // Endast Bo (Avviker) och Eva (Utan event) — Carl (OK) filtreras bort.
        await expect(page.getByText('Bo Bengtsson')).toBeVisible();
        await expect(page.getByText('Eva Ek')).toBeVisible();
        await expect(page.getByText('Carl Carlsson')).toHaveCount(0);
        await expect(
          page.getByText('2 anmälningar kunde inte kopplas till rätt event'),
        ).toBeVisible();

        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
          .analyze();
        expect(results.violations).toEqual([]);
      });

      test(`tomt läge visar vänlig text, inga fel, axe 0 (variant ${variant})`, async ({
        page,
        network,
      }) => {
        mockRegistrations(network, blandadeRader());
        await page.goto(`/dev/anmalningar-prototyp?variant=${variant}&lage=tomt`);

        await expect(page.getByRole('heading', { level: 1, name: 'Anmälningar' })).toBeVisible();
        await expect(page.getByText('Inga anmälningar än.')).toBeVisible();
        await expect(page.getByRole('alert')).toHaveCount(0);

        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
          .analyze();
        expect(results.violations).toEqual([]);
      });

      test(`fel (4xx) visar role=alert, axe 0 (variant ${variant})`, async ({ page, network }) => {
        mockRegistrations(network, [], { status: 404 });
        await page.goto(`/dev/anmalningar-prototyp?variant=${variant}&lage=lista`);

        await expect(page.getByRole('alert')).toContainText('Kunde inte hämta anmälningarna');

        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
          .analyze();
        expect(results.violations).toEqual([]);
      });
    });
  }

  test.describe('AC #4 — raden är sin egen trigger, inget separat knappelement', () => {
    test('variant A: en åtgärdsrad har EXAKT en interaktiv yta (knappen) och den öppnar resolutionen', async ({
      page,
      network,
    }) => {
      mockRegistrations(network, blandadeRader());
      await page.goto('/dev/anmalningar-prototyp?variant=a&lage=lista');

      const lista = page.getByRole('list', { name: 'Anmälningar' });
      const bosRad = lista.locator('li', { hasText: 'Bo Bengtsson' });
      // Exakt EN knapp, noll länkar — ingen separat "Koppla till event"-knapp
      // UTANFÖR raden (den gamla formen), och ingen nästlad interaktivitet.
      await expect(bosRad.getByRole('button')).toHaveCount(1);
      await expect(bosRad.getByRole('link')).toHaveCount(0);

      await bosRad.getByRole('button').click();
      await expect(page.getByRole('dialog', { name: 'Koppla till rätt event' })).toBeVisible();
    });

    test('variant B: en OK-rad är en riktig länk till eventet, ingen knapp i raden', async ({
      page,
      network,
    }) => {
      mockRegistrations(network, blandadeRader());
      await page.goto('/dev/anmalningar-prototyp?variant=b&lage=lista');

      const lista = page.getByRole('list', { name: 'Anmälningar' });
      const carlsRad = lista.locator('li', { hasText: 'Carl Carlsson' });
      await expect(carlsRad.getByRole('link')).toHaveCount(1);
      await expect(carlsRad.getByRole('button')).toHaveCount(0);

      await carlsRad.getByRole('link').click();
      await expect(page).toHaveURL(/\/event\/recEvent1\/anmalda/);
    });

    test('variant C: en åtgärdsrad (Utan event) är en knapp som öppnar resolutionen, ingen separat knapp', async ({
      page,
      network,
    }) => {
      mockRegistrations(network, blandadeRader());
      await page.goto('/dev/anmalningar-prototyp?variant=c&lage=lista');

      const evasRad = page.locator('li', { hasText: 'Eva Ek' });
      await expect(evasRad.getByRole('button')).toHaveCount(1);
      await expect(evasRad.getByRole('link')).toHaveCount(0);

      await evasRad.getByRole('button').click();
      await expect(page.getByRole('dialog', { name: 'Koppla till event' })).toBeVisible();
    });
  });

  test('DoD #6 — höjdlåset: kort med och utan avviker-badge har samma höjd (variant A)', async ({
    page,
    network,
  }) => {
    // Variant A är den yta där höjdlåset FAKTISKT riskerar att brytas:
    // badgen sitter på en EGEN rad under namn/undertext (Roselli-kortets
    // stack), så villkorad rendering hade adderat en hel textrad — till
    // skillnad från variant B/C, där badgen är en flex-SYSKON-kolumn och
    // aldrig kan påverka radens höjd oavsett rendering (mätt: en avsiktlig
    // negativkontroll som tog bort variant C:s `invisible`-reservation gav
    // INGEN mätbar höjdskillnad där, just för att badgen aldrig var den
    // höjd-avgörande sidan av flex-raden).
    mockRegistrations(network, blandadeRader());
    await page.goto('/dev/anmalningar-prototyp?variant=a&lage=lista');

    const lista = page.getByRole('list', { name: 'Anmälningar' });
    const okKort = lista.locator('li', { hasText: 'Carl Carlsson' });
    const avvikerKort = lista.locator('li', { hasText: 'Bo Bengtsson' });

    const okBox = await okKort.boundingBox();
    const avvikerBox = await avvikerKort.boundingBox();
    expect(okBox).not.toBeNull();
    expect(avvikerBox).not.toBeNull();
    expect(Math.abs((okBox?.height ?? 0) - (avvikerBox?.height ?? 0))).toBeLessThanOrEqual(1);
  });

  test('DoD #6 — höjdlåset: rader med och utan åtgärdsbehov har samma höjd (variant B)', async ({
    page,
    network,
  }) => {
    mockRegistrations(network, blandadeRader());
    await page.goto('/dev/anmalningar-prototyp?variant=b&lage=lista');

    const lista = page.getByRole('list', { name: 'Anmälningar' });
    // Carl = OK (ingen status/åtgärd), Bo = Avviker (status+åtgärd synlig).
    const okRad = lista.locator('li', { hasText: 'Carl Carlsson' });
    const atgardRad = lista.locator('li', { hasText: 'Bo Bengtsson' });

    const okBox = await okRad.boundingBox();
    const atgardBox = await atgardRad.boundingBox();
    expect(okBox).not.toBeNull();
    expect(atgardBox).not.toBeNull();
    // ≤1px tolerans (inte exakt likhet): statuskolumnen reserverar sin plats
    // med `invisible`, aldrig villkorad rendering, så DOM-strukturen är
    // IDENTISK mellan raderna — men mätt (debug-pass, 2026-08-22) kan två
    // organiskt flödande textrader av olika längd fortfarande ge ±1px
    // sub-pixel-avrundning i webbläsarens radbox (Chrome/Chromium,
    // headless), utan att `borderTopWidth`/`padding` skiljer (verifierat:
    // `border-top` var 0px på ALLA rader — det var INTE `divide-y`s
    // "inte-första-barn"-kant, hypotesen prövades och föll). Detta är
    // brus i textrendering, inte en datadriven höjdskillnad — samma
    // tolerans-princip som visual-sviten redan bär (playwright.config.ts
    // `maxDiffPixelRatio`).
    expect(Math.abs((okBox?.height ?? 0) - (atgardBox?.height ?? 0))).toBeLessThanOrEqual(1);
  });

  test('DoD #6 — höjdlåset gäller även variant C (grupperad)', async ({ page, network }) => {
    mockRegistrations(network, blandadeRader());
    await page.goto('/dev/anmalningar-prototyp?variant=c&lage=lista');

    const okRad = page.locator('li', { hasText: 'Carl Carlsson' });
    const atgardRad = page.locator('li', { hasText: 'Bo Bengtsson' });

    const okBox = await okRad.boundingBox();
    const atgardBox = await atgardRad.boundingBox();
    expect(okBox).not.toBeNull();
    expect(atgardBox).not.toBeNull();
    // Samma ≤1px sub-pixel-tolerans som variant B ovan (mätt 1px skillnad
    // här, borderTop 0px på alla rader — textrendering, inte DOM-strukturen).
    expect(Math.abs((okBox?.height ?? 0) - (atgardBox?.height ?? 0))).toBeLessThanOrEqual(1);
  });

  test('AC #3 — variant B bär personlistans radanatomi med anmälningsdata', async ({
    page,
    network,
  }) => {
    mockRegistrations(network, blandadeRader());
    await page.goto('/dev/anmalningar-prototyp?variant=b&lage=lista');

    const lista = page.getByRole('list', { name: 'Anmälningar' });
    const carlsRad = lista.locator('li', { hasText: 'Carl Carlsson' });
    // Namnet som länk.
    await expect(carlsRad.getByRole('link', { name: 'Carl Carlsson' })).toBeVisible();
    // Undertext: "N dagar sedan · Eventnamn" (eller en finare relativ tidsform).
    await expect(carlsRad).toContainText('Resor i medvetandet 1');
    // Statuskolumnen finns i DOM:en (reserverad, osynlig för OK-rader).
    await expect(carlsRad.getByText('Behöver kopplas')).toBeAttached();
    await expect(carlsRad.getByText('Behöver kopplas')).toBeHidden();

    const bosRad = lista.locator('li', { hasText: 'Bo Bengtsson' });
    await expect(bosRad.getByText('Behöver kopplas')).toBeVisible();
  });

  test('AC #5 — statusen bär text/ikon, aldrig färg ensam (variant B)', async ({
    page,
    network,
  }) => {
    mockRegistrations(network, blandadeRader());
    await page.goto('/dev/anmalningar-prototyp?variant=b&lage=atgardskon');

    // Två synliga "Behöver kopplas"-badgar (Bo + Eva) — TEXT bär betydelsen,
    // inte enbart en färgplatta.
    await expect(page.getByText('Behöver kopplas')).toHaveCount(2);
  });
});
