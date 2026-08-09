import { VISUAL_EVENT_ID } from '../support/fixturvarld/fixture-data';
import { expect, test } from '../support/fixturvarld/hermetic';

/**
 * PROMOVERINGS-GRINDEN (TASK-171.1, ADR-103 B4) — ariaSnapshot-referenser
 * för åtgärds-/granskningsytan, FÅNGADE FÖRE NÅGON FLIP.
 *
 * FACIT-LÅSNINGEN (kortets AC #1) — Marcus, i klartext, 2026-08-09
 * (S93-resumen, kanonisk trail `tasks/sessions/2026-08-02-session-93.md`
 * Del 15; verbatim-citatet är bokfört i `task-171`s Implementation Notes):
 *
 *   "Du får göra bedömningen om granulariteten och beroendena. Och inget
 *   borde väl blockera nu, jag låser Åtgärdssidan och Granskningsidan (och
 *   granskningssidans olika ytor/lägen) som facit. Det är okej för v1, jag
 *   vill att de blir 'skarpa' sidor i appen nu."
 *
 * Låsningen täcker S100:s tidigare odömda formval (delutfallets
 * ruta-placering, fallna kortens gröna form, avmarkerings-beteendet,
 * hover-scopet) som de står, för v1 — referenstagningen nedan mäter alltså
 * mot ett GODKÄNT facit, inte mot en obedömd prototyp.
 *
 * DIVERGENS MOT UPPDRAGET, ÖPPET BOKFÖRD (ADR-086/premiss-passet): uppdraget
 * antog en `?variant=`-URL-mekanik analog med eventsidans (`PrototypeSwitcher`
 * + `ADR-074`s URL-state). Koden säger något annat, verifierat genom läsning
 * av `AtgardsSida.tsx` och båda routerna (`routes/_authenticated/atgarder.tsx`,
 * `routes/_authenticated/event/$eventId/atgarder.tsx`): `PrototypeSwitcher`
 * MONTERAS (DEV-grindad) och bär internt `useQueryState('variant')`, men
 * `PROTO_VARIANTS` har EN enda post (`key: 'a'`) och `AtgardsSida`/`Atgarder`-
 * routerna läser `variantParam` INGENSTANS (grep-verifierat, noll träffar) —
 * till skillnad från eventsidans `EventDetail.tsx`/`Deltagare.tsx`, som
 * FAKTISKT grenade på `isHallplatsVariant(variantParam)`. Åtgärds-/
 * granskningssidan har med andra ord ingen andra form att flippa MOT ännu;
 * den enda existerande renderingen ÄR variant-läget. Referenserna nedan tas
 * därför genom att navigera direkt till de skarpa URL:erna, utan query-param
 * — exakt vad `gotoAtgarder()` gör. TASK-171.2 äger den faktiska
 * villkors-flippen och avgör vad "före/efter" betyder för denna yta; den
 * bedömningen görs INTE här.
 *
 * VARFÖR ARIASNAPSHOT OCH INTE PIXLAR (ADR-103 B4): deterministiskt, noll nya
 * beroenden, jämför STRUKTUR OCH TILLGÄNGLIGT NAMN. Samma metod som
 * `eventsida-promoverings-grind.spec.ts` (TASK-162.1) etablerade.
 *
 * SCOPE — SEX REFERENSER, VALDA MOT KORTETS AC #2 (fyra namngivna lägen, tre
 * utfall):
 *   1. Tomt läge — `/atgarder` utan event, bara eventväljaren.
 *   2. Mottagarurval — mottagar-ytan med listan öppnad, seedad ur
 *      "obekräftad eller obetald" (`AtgardsSida`s egen seeding-regel):
 *      Anna, Björn, Cecilia, Filip markerade av fyra möjliga fem
 *      (David är obekräftad OCH betald i BÅDA avgifterna — utanför seedet,
 *      kvar som kandidat i plockaren). Verifierat mot
 *      `tests/support/fixturvarld/fixture-data.ts` `REGISTRATIONS_RESPONSE`,
 *      inte antaget.
 *   3. Granskningsläge — åtgärden "Skicka bekräftelsemail" (`urvalsfilter:
 *      obekraftad`) ÖPPNAS OCH GRANSKAS: filtret biter (4 markerade → 2 i
 *      urvalet, Anna + Björn), och mallens `{förnamn}`/`{event}`/`{datum}`/
 *      `{ort}` fylls fullt ur `VISUAL_EVENT_ID`s eventdata + första
 *      mottagaren — noll ofyllda platshållare, verifierat mot fixturen.
 *   4–6. De tre utfallslägena — åtgärden "Skicka betalningspåminnelse"
 *      (`urvalsfilter: obetald`, matchar alla fyra markerade — bredare
 *      urval ger en tydligare 3/1-delning i "delvis") körs igenom
 *      `PrototypRigg`s tre val. Samtliga fyra mottagare har e-post i
 *      fixturen, så utfallet är helt deterministiskt (`simuleraUtfall`,
 *      `AtgardsSida.tsx`): "allt" → 4 lyckade/0 fallna, "delvis" → 3
 *      lyckade/1 fallen (tackat nej), "inget" → 0 lyckade/4 fallna (ej
 *      levererat).
 *
 * VARFÖR `granskning-yta` EXKLUDERAR `PrototypRigg` (se anker-kommentaren i
 * `AtgardsSida.tsx`): riggen är simulerings-byggställning, inte formen —
 * dess egen docblock säger det rakt ut ("riggen, inte ytan"). En referens
 * som fångat debug-knapparna hade blivit ogiltig i onödan den dag riggen
 * byts mot en riktig sändväg (task-147) eller rivs.
 *
 * INGEN DATA-MUTATION: prototypens skrivytor (betalningsblocket) rörs
 * ALDRIG av dessa tester — samtliga sex körningar stannar i mottagar-ytan/
 * åtgärdsmenyn/granskningen, som är helt läsande och simulerande
 * (`simuleraUtfall` skickar noll nätverksanrop, se dess egen docblock).
 * Fixturvärlden är dessutom hermetisk: alla nätverksanrop mockas av
 * `tests/support/fixturvarld/handlers.ts`, och ett anrop som slinker förbi
 * fäller testet via hermetik-vakten.
 */

async function gotoAtgarder(page: import('@playwright/test').Page) {
  await page.goto(`/event/${VISUAL_EVENT_ID}/atgarder`);
  await expect(page.getByTestId('eventet-block')).toBeVisible();
}

/** Öppnar en namngiven åtgärd i menyn och går vidare till granskningen. */
async function oppnaOchGranska(page: import('@playwright/test').Page, atgardsnamn: string) {
  await page.getByRole('button', { name: new RegExp(atgardsnamn) }).click();
  await page.getByRole('button', { name: 'Granska och skicka' }).click();
}

/** Väljer utfallsläget i prototyp-riggen, armerar och skickar; väntar in resultatet. */
async function valjArmeraSkicka(page: import('@playwright/test').Page, utfallsEtikett: string) {
  await page.getByRole('button', { name: utfallsEtikett }).click();

  const vaxel = page.getByRole('switch', { name: 'Bekräfta utskicket' });
  await vaxel.focus();
  await vaxel.press('Enter');

  await page.getByRole('button', { name: /^Skicka till \d+/ }).click();
  await expect(page.getByRole('heading', { name: /Skickat|Inget skickades/ })).toBeVisible();
}

test.describe('promoverings-grinden — ariaSnapshot-referenser för åtgärds-/granskningsytan (ADR-103 B4, TASK-171.1)', () => {
  test('tomt läge — eventväljaren utan event', async ({ page }) => {
    await page.goto('/atgarder');
    await expect(page.getByTestId('atgardssida-tomt')).toBeVisible();
    await expect(page.getByTestId('atgardssida-tomt')).toMatchAriaSnapshot({
      name: 'atgardssida-tomt.aria.yml',
    });
  });

  test('mottagarurval — markerade deltagarkort medförda', async ({ page }) => {
    await gotoAtgarder(page);
    // Räknar-raden ÄR accordion-huvudet (se AtgardsSida.tsx § MottagarYta) —
    // listan är infälld från start, öppna den så deltagarkorten syns.
    await page.getByRole('button', { name: /deltagare markerade/ }).click();
    await expect(page.getByTestId('mottagar-kort')).toMatchAriaSnapshot({
      name: 'atgarder-mottagarurval.aria.yml',
    });
  });

  test('granskningsläge — urvalsfilter som biter, ifyllda platshållare', async ({ page }) => {
    await gotoAtgarder(page);
    await oppnaOchGranska(page, 'Skicka bekräftelsemail');
    await expect(page.getByTestId('granskning-yta')).toMatchAriaSnapshot({
      name: 'atgarder-granskning.aria.yml',
    });
  });

  test('utfallsläge — allt gick fram', async ({ page }) => {
    await gotoAtgarder(page);
    await oppnaOchGranska(page, 'Skicka betalningspåminnelse');
    await valjArmeraSkicka(page, 'Allt gick fram');
    await expect(page.getByTestId('granskning-yta')).toMatchAriaSnapshot({
      name: 'atgarder-utfall-allt.aria.yml',
    });
  });

  test('utfallsläge — delutfall', async ({ page }) => {
    await gotoAtgarder(page);
    await oppnaOchGranska(page, 'Skicka betalningspåminnelse');
    await valjArmeraSkicka(page, 'Delutfall');
    await expect(page.getByTestId('granskning-yta')).toMatchAriaSnapshot({
      name: 'atgarder-utfall-delvis.aria.yml',
    });
  });

  test('utfallsläge — inget gick fram', async ({ page }) => {
    await gotoAtgarder(page);
    await oppnaOchGranska(page, 'Skicka betalningspåminnelse');
    await valjArmeraSkicka(page, 'Inget gick fram');
    await expect(page.getByTestId('granskning-yta')).toMatchAriaSnapshot({
      name: 'atgarder-utfall-inget.aria.yml',
    });
  });
});
