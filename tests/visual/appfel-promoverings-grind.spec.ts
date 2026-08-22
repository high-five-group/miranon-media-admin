import { expect, test } from '@playwright/test';

/**
 * PROMOVERINGS-GRINDEN (TASK-285.3, ADR-103 B4) — ariaSnapshot-par för
 * appfel-sidans fallback.
 *
 * FACIT: `tasks/sessions/bilagor/s109-meddelandefamiljen-konvergens/facit.json`
 * ytan `appfel-sidan` — formen låst i `AppErrorPrototyp.tsx` (varv 4).
 *
 * "FÖRE" var `AppErrorPrototyp`, visad på `/dev/notis-prototyp?variant=1`.
 * DEN HALVAN ÄR RIVEN (TASK-285.11, 2026-08-22): Marcus stämplade
 * manifestet ("Vi kör på det, godkänner"), ADR-102 B3-spärren öppnades, och
 * rivningen tog både prototyp-komponenten och värdrouten. FÖRE-testet togs
 * bort i SAMMA landning — ett test som navigerar till en riven route är
 * inget bevis, bara ett rött jobb. Referensfilen under `__aria__/` står
 * kvar ORÖRD och är dessutom innehållslåst mot sha256 i facit-manifestet
 * (`check-facit.sh` invariant d); den är nu historikens enda bevis på att
 * promoveringen tog rätt form, exakt vad syskonfilerna
 * (`personer-`/`eventsida-`/`atgardssida-promoverings-grind.spec.ts`) redan
 * visar efter sina egna rivningar.
 *
 * "EFTER" = `AppErrorFallback`, den promoverade komponenten
 * (`src/components/ErrorBoundary/AppErrorFallback.tsx`), visad på
 * `/dev/primitives` (kortets egen motivering: så att primitiv-sidan kan visa
 * den och axe-sviten nå den utan att krascha appen). Testet nedan jämför
 * den mot SAMMA referensfil som FÖRE-halvan spelade in — kontraktet är
 * alltså oförändrat, bara det ena benet är borta.
 *
 * SCANNAS I INBÄDDAT LÄGE (`inbaddad`) — samma kontrakt
 * (`role={inbaddad ? undefined : 'alert'}`) som prototyp-komponenten bar, så
 * jämförelsen mot referensen förblir äpplen mot äpplen (skillnaden mellan
 * inbäddad/skarp form rör bara `role`, inte formen facit låser).
 */
test.describe('appfel-sidan — promoverings-grind (TASK-285.3, ADR-103 B4)', () => {
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
