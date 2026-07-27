import { expect, test } from './support/hermetic';

/**
 * Grind för fixturvärldens catch-all-handler (task-54.1).
 *
 * En omockad Edge Function ska svara 501 med namnet i klartext — aldrig gå ut
 * på nätet. Skyddet är inte självklart: bindningens `onUnhandledRequest` har
 * defaultvärdet `bypass`, och hermetik-vakten släpper igenom
 * `/functions/v1/`-mönstret för att MSW ska nå det överhuvudtaget. Utan
 * catch-all-handlern vore en glömd handler alltså en TYST nätverksläcka i
 * stället för ett synligt fel.
 *
 * Detta testar handler-lagret. Vakten för anrop UTANFÖR EF-mönstret — som ska
 * fälla testet med lista över vad som var mockat — är task-54.2 och har sitt
 * eget rött-först-bevis.
 */
test('omockad EF svarar 501 i klartext i stället för att nå nätet', async ({ page }) => {
  await page.goto('/');

  const utfall = await page.evaluate(async () => {
    const res = await fetch('https://visual-fixture.supabase.co/functions/v1/finns-inte-alls');
    return { status: res.status, body: await res.text() };
  });

  expect(utfall.status).toBe(501);
  expect(utfall.body).toContain('finns-inte-alls');
});
