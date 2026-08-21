import { expect, test } from '@playwright/test';

/**
 * PROMOVERINGS-GRINDEN (TASK-285.3, ADR-103 B4) — ariaSnapshot-par för
 * appfel-sidans fallback.
 *
 * FACIT: `tasks/sessions/bilagor/s109-meddelandefamiljen-konvergens/facit.json`
 * ytan `appfel-sidan` — formen låst i `AppErrorPrototyp.tsx` (varv 4).
 *
 * "FÖRE" = `AppErrorPrototyp`, OFÖRÄNDRAD, visad på `/dev/notis-prototyp?variant=1`
 * (prototyp-substratet rivs FÖRST i TASK-285.11 efter Marcus godkännande,
 * ADR-102 B3 — denna skiva rör varken filen eller routen). "EFTER" =
 * `AppErrorFallback`, den promoverade komponenten
 * (`src/components/ErrorBoundary/AppErrorFallback.tsx`), visad på
 * `/dev/primitives` (kortets egen motivering: så att primitiv-sidan kan visa
 * den och axe-sviten nå den utan att krascha appen).
 *
 * BÅDA SIDOR SCANNAS I INBÄDDAT LÄGE (`inbaddad`) — samma kontrakt
 * (`role={inbaddad ? undefined : 'alert'}`) på båda komponenterna, så
 * jämförelsen är äpplen mot äpplen (skillnaden mellan inbäddad/skarp form
 * rör bara `role`, inte formen facit låser).
 *
 * PROTOTYP-SIDANS LOKATOR RÖR INTE PROTOTYP-FILEN: `notis-prototyp.tsx` bär
 * ingen `data-testid` på AppError-demots wrapper-div (rad ~122,
 * `className="rounded border border-border border-dashed bg-bg-subtle p-4"`)
 * — denna skiva lägger ingen till, för att inte röra en delad prototyp-fil
 * som andra TASK-285-skivor (MessageBox/Notis-primitiven) också berör i
 * andra rader. `border-dashed` förekommer EXAKT en gång på den routen
 * (grep-verifierat: `grep -c border-dashed src/routes/dev/notis-prototyp.tsx`
 * → 1) och scopar därför träffsäkert utan ändring av prototyp-koden.
 */
test.describe('appfel-sidan — promoverings-grind (TASK-285.3, ADR-103 B4)', () => {
  test('referens — prototypformen (AppErrorPrototyp, /dev/notis-prototyp?variant=1)', async ({
    page,
  }) => {
    await page.goto('/dev/notis-prototyp?variant=1');
    await page.getByRole('heading', { level: 1, name: 'Meddelanden' }).waitFor();

    const kort = page.locator('.border-dashed');
    await expect(kort.getByRole('heading', { name: 'Appen kunde inte visas' })).toBeVisible();
    await expect(kort).toMatchAriaSnapshot({ name: 'appfel-fallback.aria.yml' });
  });

  test('skarp — promoverad AppErrorFallback matchar referensen (/dev/primitives)', async ({
    page,
  }) => {
    await page.goto('/dev/primitives');
    await page
      .getByRole('heading', { level: 1, name: 'Primitiver - demo (endast dev-läge)' })
      .waitFor();

    const kort = page.getByTestId('appfel-fallback');
    await expect(kort.getByRole('heading', { name: 'Appen kunde inte visas' })).toBeVisible();
    await expect(kort).toMatchAriaSnapshot({ name: 'appfel-fallback.aria.yml' });
  });
});
