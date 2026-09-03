import type { NetworkFixture } from '@msw/playwright';
import { http } from 'msw';
import type { z } from 'zod';
import type { IntresseradSchema } from '../../src/domain/schemas';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from './acceptance-bas';

/**
 * Intresserade-listans B3-konvergensform (`/mer/intresserade?variant=a`) —
 * TASK-374.1 AC #3, tillagd i runda 2 av review-grinden (`ADR-105`, PR #2248,
 * utlåtande fynd 3: AC #3 klassad "felställd" eftersom dess ordalydelse
 * — "acceptance-sviten hävdar annonseringen" — pekade på en assertion som i
 * runda 1 bara låg i `tests/visual/intresserade-promoverings-grind.spec.ts`,
 * en svit som inte körs av blockerande CI).
 *
 * DENNA FIL GÖR AC #3 SANN i stället för att AC-texten omformulerades: den
 * hävdar EXAKT samma två saker som grind-specens eget AC #3-block
 * (`aria-live="polite"` + `aria-atomic="true"` på träffräknaren, och att
 * texten faktiskt uppdateras vid en sökning) men i Acceptance-klassen, som
 * FÄLLER en PR (`CONTRIBUTING.md` § Acceptance-klassen).
 *
 * VARFÖR EN NY FIL OCH INTE ETT NYTT DESCRIBE I `mer-intresserade.
 * acceptance.test.ts`: den filen låser K0-baslinjen (den SKARPA, villkorslösa
 * vyn på `/mer/intresserade` utan query) och rörs uttryckligen INTE av denna
 * skiva (skrivs om i `374.2` när konvergensformen blir den enda vyn). En
 * separat fil håller de två låsen — K0 kontra B3-konvergensen bakom
 * `?variant=a` — åtskilda så ingen av dem behöver ändras när den andra gör
 * det.
 *
 * DEV-ANTAGANDET ÄR VERIFIERAT, INTE ANTAGET. `?variant=a` renderar bara när
 * `import.meta.env.DEV` är sant (`IntresseradeKonvergens.tsx` via
 * `src/routes/_authenticated/mer/intresserade.tsx`). Acceptance-projektet
 * delar SAMMA `webServer`-gren som `visual` i `playwright.config.ts`
 * (`isVisualRun || isAcceptanceRun || isWebblasarbeteendeRun ||
 * isManifestScreenshotsRun` ⇒ `npm run dev`, aldrig en produktionsbuild) —
 * `import.meta.env.DEV` är alltså sant i BÅDA projekten. Skarpt prövat: en
 * riktad körning av denna sorts navigering under
 * `PLAYWRIGHT_ACCEPTANCE_DEV_SERVER=1 npx playwright test --project=acceptance`
 * bekräftade att `intresserade-yta`-ankaret och räknaren renderar identiskt
 * med hur de gör i `visual`-projektet, innan denna fil skrevs på riktigt.
 *
 * LIVSLÄNGD: hela `?variant=a`-grenen rivs i `374.4`. Denna fil rivs i samma
 * commit (samma öde som grind-specens variant-beroende halva).
 */

type Row = z.infer<typeof IntresseradSchema>;

/** Samma fält-form som `mer-intresserade.acceptance.test.ts`s `row()` och
 * `intresserade-promoverings-grind.spec.ts`s `row()` — IntresseradSchema =
 * PersonSchema.extend + antalHamtningar/allaHamtningar. */
function row(overrides: Partial<Row> = {}): Row {
  return {
    id: `recINTKONV${Math.random().toString(36).slice(2, 10)}`,
    namn: 'Anna Andersson',
    fornamn: 'Anna',
    efternamn: 'Andersson',
    email: 'anna@example.se',
    telefon: '070-1234567',
    ort: [],
    manuellFlagga: null,
    aiFlagga: null,
    anteckningar: null,
    antalAnmalningar: 0,
    antalDeltaganden: 0,
    erfarenhetsniva: null,
    erfarenhetsbadge: null,
    senasteInteraktion: 'Laddade ner guide',
    senasteInteraktionDatum: '2026-05-01',
    dagarSedanSenaste: 5,
    harAktivAnmalan: null,
    ejGodkandMail: false,
    radSkapad: '2026-05-01T10:00:00.000Z',
    anmalningIds: [],
    deltagandeIds: [],
    antalHamtningar: 2,
    allaHamtningar: ['Gratis guide', 'Webinar'],
    ...overrides,
  };
}

function mockLeads(network: NetworkFixture, rows: Row[]): void {
  network.use(http.get(EF('get-leads'), () => json({ intresserade: rows, nextCursor: null })));
}

test.describe('Intresserade — B3-konvergensformen (?variant=a) — AC #3: träffantalets live-region', () => {
  test('räknaren bär aria-live/aria-atomic (inte role=status) och texten uppdateras vid sökning', async ({
    page,
    network,
  }) => {
    mockLeads(network, [
      row({ namn: 'Anna Andersson', email: 'anna@example.se' }),
      row({
        id: 'recINTKONVnamnlos',
        namn: null,
        fornamn: null,
        efternamn: null,
        email: 'bo@example.se',
      }),
    ]);
    await page.goto('/mer/intresserade?variant=a');
    await expect(page.getByTestId('intresserade-yta')).toBeVisible();

    const raknare = page.getByText('2 intresserade');
    await expect(raknare).toBeVisible();
    await expect(raknare).toHaveAttribute('aria-live', 'polite');
    await expect(raknare).toHaveAttribute('aria-atomic', 'true');
    // Rollen är ORÖRD ("paragraph") — role="status" hade dubbelannonserat
    // (samma teknik som DokumentYta.tsx, se IntresseradeKonvergens.tsx §
    // TRÄFFANTALET SOM ARTIG LIVE-REGION).
    await expect(raknare).not.toHaveAttribute('role', 'status');

    await page.getByRole('searchbox', { name: 'Sök intresserad' }).fill('Anna');
    const traffRaknare = page.getByText('1 träffar av 2 intresserade');
    await expect(traffRaknare).toBeVisible();
    await expect(page.getByText('Namnlös intresserad')).toHaveCount(0);
    await expect(traffRaknare).toHaveAttribute('aria-live', 'polite');
    await expect(traffRaknare).toHaveAttribute('aria-atomic', 'true');
  });
});
