import AxeBuilder from '@axe-core/playwright';
import { HttpResponse, http } from 'msw';
import { expect, test } from './acceptance-bas';

/**
 * Begär-återställning-sidan `/glomt-losenord` (TASK-127.7, ADR-093) —
 * DATABEROENDE tester: att sidan beter sig rätt GIVET ETT SVAR AV RÄTT FORM
 * från `/auth/v1/recover` (bakom `resetPasswordForEmail`). ADR-094 Beslut 2:
 * "har testet ett databeteende att bevisa formen av?" — ja, samtliga tester
 * nedan konsumerar ett mockat nätverkssvar.
 *
 * DEN KLIENT-ENDA VALIDERINGEN (tomt fält, blockerar FÖRE nätverket) hör
 * hemma i `tests/webblasarbeteende/glomt-losenord.test.ts` i stället — samma
 * gräns som `valkommen.acceptance.test.ts`/`valkommen.test.ts` redan drog
 * (TASK-127.6).
 *
 * KÄRNAN I AC #1 (enumeration-neutralitet): sidans kod har INGEN signal att
 * förgrena på — `resetPasswordForEmail` returnerar `error: null` oavsett om
 * adressen finns (verifierat mot Supabase-dokumentationen, se
 * `src/routes/glomt-losenord.tsx`s docblock). Testerna nedan bevisar därför
 * INTE "känd" mot "okänd adress" (klienten kan aldrig se den skillnaden) —
 * de bevisar det STARKARE påståendet att UI:t visar EXAKT SAMMA bekräftelse
 * oavsett vad API:t svarar (200 ELLER 5xx), vilket är den enda platsen en
 * enumeration-läckande gren skulle kunna smygas in.
 */
const RECOVER_PATTERN = '*/auth/v1/recover';

test.describe('/glomt-losenord — enumeration-neutralt svar (AC #1)', () => {
  test('lyckat API-svar (200) → samma bekräftelse oavsett vilken adress som skrevs in', async ({
    page,
    network,
  }) => {
    network.use(http.post(RECOVER_PATTERN, () => new HttpResponse(null, { status: 200 })));
    await page.goto('/glomt-losenord');

    await page.getByLabel('E-postadress').fill('roger@miranon.se');
    await page.getByRole('button', { name: 'Skicka återställningslänk' }).click();

    await expect(page.getByRole('heading', { level: 1, name: 'Kolla din inkorg' })).toBeVisible();
    await expect(page.getByText('roger@miranon.se')).toBeVisible();
    // Enumeration-neutral copy: varken bekräftar eller dementerar att kontot finns.
    await expect(page.getByText(/hör till ett konto hos oss/)).toBeVisible();
  });

  test('API-fel (500) → EXAKT SAMMA bekräftelse som vid ett lyckat svar (fail-open, AC #1)', async ({
    page,
    network,
  }) => {
    // Detta är den skarpa hermetik-provokationen: MEDVETET inget lyckat svar
    // mockat. Om koden någonsin lägger till en gren som visar ett annat
    // meddelande vid ett API-fel öppnar den en tänkbar enumeration-korrelerad
    // sidokanal (rate-limit är känd-per-adress i GoTrue) — testet fäller då.
    network.use(
      http.post(RECOVER_PATTERN, () =>
        HttpResponse.json({ code: 500, error_code: 'unexpected_failure' }, { status: 500 }),
      ),
    );
    await page.goto('/glomt-losenord');

    await page.getByLabel('E-postadress').fill('okand.adress@miranon.se');
    await page.getByRole('button', { name: 'Skicka återställningslänk' }).click();

    await expect(page.getByRole('heading', { level: 1, name: 'Kolla din inkorg' })).toBeVisible();
    await expect(page.getByText(/hör till ett konto hos oss/)).toBeVisible();
  });

  test('nätverksfel (anropet kraschar) → EXAKT SAMMA bekräftelse (fail-open genom hela vägen)', async ({
    page,
    network,
  }) => {
    network.use(http.post(RECOVER_PATTERN, () => HttpResponse.error()));
    await page.goto('/glomt-losenord');

    await page.getByLabel('E-postadress').fill('annan.okand@miranon.se');
    await page.getByRole('button', { name: 'Skicka återställningslänk' }).click();

    await expect(page.getByRole('heading', { level: 1, name: 'Kolla din inkorg' })).toBeVisible();
  });

  test('axe 0 violations på bekräftelseläget', async ({ page, network }) => {
    network.use(http.post(RECOVER_PATTERN, () => new HttpResponse(null, { status: 200 })));
    await page.goto('/glomt-losenord');

    await page.getByLabel('E-postadress').fill('roger@miranon.se');
    await page.getByRole('button', { name: 'Skicka återställningslänk' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Kolla din inkorg' })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
