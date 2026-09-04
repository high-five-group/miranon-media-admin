import AxeBuilder from '@axe-core/playwright';
import { http } from 'msw';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from './acceptance-bas';

/**
 * TASK-309.7 AC #1/#2/#4 — Mer-sidans Eventinnehåll-yta (/mer/eventinnehall).
 *
 * Täckning: AC #1 (Mer-sidans verktygsgrupp bär raden, samma radform som
 * Dokument-grannen — sidan bevisar egenkroppen; NavCard-formen är redan
 * generellt provad av `mer.acceptance.test.ts`), AC #2 (listan, block-
 * dialogen — samma `BlockDialog` som genereringsvyn, textfält OCH
 * agendafält), AC #4 (fokusordning/tangentbord, ariaSnapshot via
 * `locator.ariaSnapshot()` — samma lättviktsmönster som
 * `persons-list.acceptance.test.ts` AC #4 — och axe 0 violations).
 *
 * `get-event-contents`/`save-event-content` ligger UTANFÖR den delade
 * fixturvärldens normalläge (`handlers.ts`) — varje test överskuggar
 * explicit, samma disciplin som `mer-aktivitetshistorik.acceptance.test.ts`
 * redan etablerar för sin egen EF.
 */

const KOMBINATION_A = {
  id: 'recEventinnehallA01',
  namn: 'Resor i medvetandet 1 · Utbildning',
  event: 'Resor i medvetandet 1',
  typ: 'Utbildning',
  falt: {
    tid: 'kl. 10:00 - 17:00',
    pris: '2500',
    anmalningsavgift: '1000',
    resterandeBelopp: '1500',
    beskrivning: 'En fördjupande utbildning i medvetandet.',
    forberedelser: null,
    tagMed: null,
    rokning: null,
    parfym: null,
    mat: null,
    overnattning: null,
    utrustning: null,
  },
  agenda: {
    dag1: [{ text: 'Välkomna', tid: '', meditation: false }],
    dag2: [],
  },
};

const KOMBINATION_B = {
  id: 'recEventinnehallB02',
  namn: 'Psionautics · Utbildning',
  event: 'Psionautics',
  typ: 'Utbildning',
  falt: {
    tid: null,
    pris: null,
    anmalningsavgift: null,
    resterandeBelopp: null,
    beskrivning: null,
    forberedelser: null,
    tagMed: null,
    rokning: null,
    parfym: null,
    mat: null,
    overnattning: null,
    utrustning: null,
  },
  agenda: { dag1: [], dag2: [] },
};

test.describe('Mer — Eventinnehåll (TASK-309.7)', () => {
  test('AC #2: listar kombinationerna, öppnar ett textblock via block-dialogen och sparar', async ({
    page,
    network,
  }) => {
    network.use(
      http.get(EF('get-event-contents'), () =>
        json({ eventinnehall: [KOMBINATION_A, KOMBINATION_B] }),
      ),
    );
    let sparaBody: Record<string, unknown> | null = null;
    network.use(
      http.post(EF('save-event-content'), async ({ request }) => {
        sparaBody = (await request.json()) as Record<string, unknown>;
        return json({ ok: true, record: null, agenda: null });
      }),
    );

    await page.goto('/mer/eventinnehall');

    await expect(page.getByRole('heading', { level: 1, name: 'Eventinnehåll' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Tillbaka till Mer' })).toBeVisible();
    await expect(page.getByRole('button', { name: KOMBINATION_A.namn })).toBeVisible();
    await expect(page.getByRole('button', { name: KOMBINATION_B.namn })).toBeVisible();

    await page.getByRole('button', { name: KOMBINATION_A.namn }).click();
    await expect(page.getByRole('heading', { level: 2, name: KOMBINATION_A.namn })).toBeVisible();
    await expect(page.getByRole('button', { name: '‹ Alla kombinationer' })).toBeVisible();

    // Blockraden för Beskrivning öppnar block-dialogen.
    await page.getByRole('button', { name: 'Beskrivning' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Beskrivning' })).toBeVisible();
    await expect(
      dialog.getByText('Standardtext för samtliga event av den här typen.'),
    ).toBeVisible();

    const faltyta = dialog.getByRole('textbox');
    await expect(faltyta).toHaveValue(KOMBINATION_A.falt.beskrivning ?? '');
    await faltyta.fill('En helt ny beskrivning.');
    await dialog.getByRole('button', { name: 'Spara' }).click();

    await expect(dialog).toBeHidden();
    expect(sparaBody).toEqual({
      eventinnehallId: KOMBINATION_A.id,
      falt: { beskrivning: 'En helt ny beskrivning.' },
    });
  });

  test('AC #2: agenda-blocket öppnar samma block-dialog och listar befintliga punkter', async ({
    page,
    network,
  }) => {
    network.use(http.get(EF('get-event-contents'), () => json({ eventinnehall: [KOMBINATION_A] })));

    await page.goto('/mer/eventinnehall');
    await page.getByRole('button', { name: KOMBINATION_A.namn }).click();
    await page.getByRole('button', { name: 'Agenda, dag 1' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Agenda, dag 1' })).toBeVisible();
    await expect(dialog.getByText('Välkomna')).toBeVisible();
  });

  test('AC #4: tangentbord (Escape stänger dialogen, fokus återgår) + ariaSnapshot + axe 0 violations', async ({
    page,
    network,
  }) => {
    network.use(http.get(EF('get-event-contents'), () => json({ eventinnehall: [KOMBINATION_A] })));

    await page.goto('/mer/eventinnehall');
    await page.getByRole('button', { name: KOMBINATION_A.namn }).click();

    const rad = page.getByRole('button', { name: 'Beskrivning' });
    await rad.focus();
    await page.keyboard.press('Enter');

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Playwrights ariaSnapshot ÄR tillgänglighetsträdet (samma lättvikts-
    // mönster som persons-list.acceptance.test.ts AC #4) — bevisar att
    // dialogen bär en riktig `role=dialog`, en tillgänglig titel och
    // Spara/Avbryt-knapparna, utan en extern baslinjefil.
    const trad = await dialog.ariaSnapshot();
    expect(trad).toContain('dialog "Beskrivning"');
    expect(trad).toContain('button "Avbryt"');
    expect(trad).toContain('button "Spara"');

    await dialog.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(rad).toBeFocused();

    const resultat = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(resultat.violations).toEqual([]);
  });
});
