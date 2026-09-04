import AxeBuilder from '@axe-core/playwright';
import { http } from 'msw';
import type { PlaceListItem } from '../../src/domain/schemas';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from './acceptance-bas';

/**
 * TASK-309.7 AC #1/#3/#4 — Mer-sidans Platser-yta (/mer/platser).
 *
 * Täckning: AC #3 (listan, block-dialogen — samma `BlockDialog` som
 * genereringsvyn och Eventinnehåll-ytan, redigering av ett fält, och den
 * TVÅSTEGADE "ny plats"-flödet: namn → tom shell → redigera via samma
 * block-lista), AC #4 (tangentbord/ariaSnapshot/axe).
 *
 * `get-places`/`save-place-standard` ligger UTANFÖR den delade
 * fixturvärldens normalläge — varje test överskuggar explicit, samma
 * disciplin som `mer-eventinnehall.acceptance.test.ts`.
 */

const RONNINGE: PlaceListItem = {
  id: 'recPlatsRonninge01',
  namn: 'Rönninge',
  falt: {
    adress: 'Uttringe Hages väg 17, Rönninge',
    parkering: '15 parkeringsplatser.',
    transport: 'Vi kan hämta på stationen.',
    klader: 'Mjukiskläder.',
  },
};

test.describe('Mer — Platser (TASK-309.7)', () => {
  test('AC #3: listar platser, öppnar ett fält via block-dialogen och sparar', async ({
    page,
    network,
  }) => {
    network.use(http.get(EF('get-places'), () => json({ places: [RONNINGE] })));
    let sparaBody: Record<string, unknown> | null = null;
    network.use(
      http.post(EF('save-place-standard'), async ({ request }) => {
        sparaBody = (await request.json()) as Record<string, unknown>;
        return json({ ok: true, plats: { id: RONNINGE.id, namn: RONNINGE.namn, skapad: false } });
      }),
    );

    await page.goto('/mer/platser');

    await expect(page.getByRole('heading', { level: 1, name: 'Platser' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Tillbaka till Mer' })).toBeVisible();
    await expect(page.getByRole('button', { name: RONNINGE.namn })).toBeVisible();

    await page.getByRole('button', { name: RONNINGE.namn }).click();
    await expect(page.getByRole('heading', { level: 2, name: RONNINGE.namn })).toBeVisible();

    await page.getByRole('button', { name: 'Parkering' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Parkering' })).toBeVisible();
    await expect(dialog.getByText('Platsens standarduppgift.')).toBeVisible();

    const faltyta = dialog.getByRole('textbox');
    await expect(faltyta).toHaveValue(RONNINGE.falt.parkering ?? '');
    await faltyta.fill('20 platser numera.');
    await dialog.getByRole('button', { name: 'Spara' }).click();

    await expect(dialog).toBeHidden();
    expect(sparaBody).toEqual({ platsId: RONNINGE.id, falt: { parkering: '20 platser numera.' } });
  });

  test('AC #3: "Ny plats" skapar en shell-rad i två steg (namn, sedan fält via block-dialogen)', async ({
    page,
    network,
  }) => {
    let listan: PlaceListItem[] = [RONNINGE];
    network.use(http.get(EF('get-places'), () => json({ places: listan })));
    let skapaBody: Record<string, unknown> | null = null;
    network.use(
      http.post(EF('save-place-standard'), async ({ request }) => {
        skapaBody = (await request.json()) as Record<string, unknown>;
        const ny: PlaceListItem = {
          id: 'recNyPlats001',
          namn: 'Uppsala',
          falt: { adress: null, parkering: null, transport: null, klader: null },
        };
        listan = [...listan, ny];
        return json({ ok: true, plats: { id: ny.id, namn: ny.namn, skapad: true } });
      }),
    );

    await page.goto('/mer/platser');
    await page.getByRole('button', { name: 'Ny plats' }).click();

    const namnfalt = page.getByLabel('Namn på ny plats');
    await expect(namnfalt).toBeFocused();
    await namnfalt.fill('Uppsala');
    await page.getByRole('button', { name: 'Skapa' }).click();

    expect(skapaBody).toEqual({ namn: 'Uppsala' });
    // Formuläret stängs och listan (nu omhämtad) visar den nya platsen.
    await expect(page.getByRole('button', { name: 'Ny plats' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Uppsala' })).toBeVisible();
  });

  test('AC #4: tangentbord (Escape stänger dialogen, fokus återgår) + ariaSnapshot + axe 0 violations', async ({
    page,
    network,
  }) => {
    network.use(http.get(EF('get-places'), () => json({ places: [RONNINGE] })));

    await page.goto('/mer/platser');
    await page.getByRole('button', { name: RONNINGE.namn }).click();

    const rad = page.getByRole('button', { name: 'Adress' });
    await rad.focus();
    await page.keyboard.press('Enter');

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    const trad = await dialog.ariaSnapshot();
    expect(trad).toContain('dialog "Adress"');
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
