import type { Locator, Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

/**
 * Notisfamiljen — "inget animeras" bevisat över HELA familjen i EN fil
 * (TASK-285.9, AC #3): "Inga transitions eller animationer på familjens
 * element (mätt med getAnimations och computed transition i testmiljön)."
 *
 * VARFÖR EN CENTRAL FIL OCH INTE SJU SPRIDDA ASSERTIONER: två av ytorna
 * (Uppdateringsnotis, OfflineIndicator) bär redan varsin
 * transitionDuration/animationName-kontroll i sin egen
 * `webblasarbeteende`-fil (`app-update-banner.test.ts`,
 * `offline-notis.test.ts`) — den bevisar samma sak, men i NORMALT medieläge
 * och utan `Element.getAnimations()`. Kortets AC #3 pekar uttryckligen ut
 * BÅDA mekanismerna (`getAnimations` OCH computed transition) — denna fil
 * är den EN plats där båda körs, för ALLA SJU ytorna, i BÅDA medielägena
 * (normalt och `prefers-reduced-motion: reduce`), så en läsare som vill
 * verifiera hela familjens rörelsefrihet har EN fil att läsa i stället för
 * att pussla ihop bevis ur sju.
 *
 * `getAnimations()` (Web Animations API) är det STARKARE beviset: en
 * `transition-duration`-computed-style kan vara > 0 utan att någon
 * `Animation`-instans någonsin skapas (transitioner triggas bara av en
 * FAKTISK propertyändring) — `getAnimations().length === 0` bevisar att
 * INGEN animation kör HÄR OCH NU, oavsett vad en teoretisk framtida
 * propertyändring skulle trigga. De två mätningarna kompletterar varandra:
 * computed transition/animation bevisar att inget ÄR KONFIGURERAT att
 * animera; `getAnimations()` bevisar att inget FAKTISKT animerar.
 *
 * MEDIA-BÅDA-VÄGAR: kortets egen beskrivning säger "Reduced-motion ändrar
 * ingenting eftersom inget animeras". Detta betyder INTE att computed
 * `transitionDuration` är BYTE-IDENTISK i de två lägena — `base.css`s egen
 * globala klampregel (`@media (prefers-reduced-motion: reduce) { *, ::before,
 * ::after { transition-duration: 0.01ms !important } }`) tvingar VARJE
 * element, även ett som aldrig konfigurerat en transition, till en omärkbar
 * `0.01ms`-duration i reducerat läge (mätt, TASK-285.9: `0s` normalt →
 * `1e-05s` reducerat, `matchMedia` bekräftar `true`). Det är regeln som
 * fungerar som avsett (samma bevisform som `svep-overgang-reduced-
 * motion.acceptance.test.ts`s eget filhuvud: "> 0 OCH < 0,001 … eftersom 0
 * hade betytt att regeln INTE ens träffade elementet"), inte ett fel i
 * familjens element. Varje yta mäts därför i BÅDA lägen mot OLIKA trösklar:
 * normalt läge kräver EXAKT 0 (inget är konfigurerat att animera över huvud
 * taget); reducerat läge kräver en OMÄRKBAR duration (< 1 ms) — aldrig en
 * riktig, synlig transition-tid. Bägge lägen kräver `getAnimations().length
 * === 0`: klampregeln ÄNDRAR en computed CSS-egenskap, den SKAPAR ingen
 * `Animation`-instans (ingen propertyändring sker – inget triggar en
 * faktisk transition).
 *
 * KLASSVALET (`webblasarbeteende`, inte `acceptance` eller `a11y`): samtliga
 * sju ytors underliggande mekanism har NOLL databeteende (samma resonemang
 * som varje syskonfils eget filhuvud) — `scripts/hermetik-sjalvtest.mjs`
 * (ADR-080 beslut 3) hade fällt den i acceptance-klassen. `a11y`-klassen
 * kör mot en ANNAN dev-server/port och äger axe-skanningen
 * (`tests/a11y/notisfamiljen.spec.ts`), inte computed-style-kontrakt.
 *
 * YTORNA (sju, kortets egen tabell) och hur var och en görs synlig — samma
 * händelse-simulering som redan etablerad i varje syskonfil, ingen ny
 * genväg uppfinns här:
 * 1. Notis-primitiven självt bär ingen egen demo-yta — dess FORM ärvs av
 *    (2) och (3) nedan, som är dess enda konsumenter.
 * 2. Uppdateringsnotis — `mm:app-uppdatering-tillganglig`.
 * 3. OfflineIndicator — `window` `offline`-event.
 * 4. ChunkBanner — `vite:preloadError`.
 * 5. Meddelanderutan (MessageBox), alla fyra intents — `/dev/primitives`s
 *    egen demo-sektion, text-filtrerad (samma lokator-mönster som
 *    `MessageBox.spec.ts`).
 * 6. SectionError — `/dev/sektionsfel`, båda felläges-varianterna.
 * 7. Appfel-fallbacken — `/dev/primitives`s "skarp"-instans (default-props,
 *    exakt vad `AppErrorBoundary` renderar).
 */

const NOTIS_KORT = '[data-testid="app-update-notis"]';
const NOTIS_LADDA_OM = '[data-testid="app-update-reload"]';
const OFFLINE_KORT = '[data-testid="offline-notis"]';
const CHUNK_BANNER = '[data-testid="app-reload-required-banner"]';
const CHUNK_LADDA_OM = '[data-testid="app-reload-required-reload"]';
const MESSAGEBOX_SEKTION = '[aria-labelledby="rubrik-messagebox"]';
const APPFEL_SKARP_ALERT = '[data-testid="appfel-fallback-skarp"] div[role="alert"]';

const MESSAGE_INTENTS = ['info', 'success', 'warning', 'error'] as const;

/** Går till demoytan och väntar tills React bevisligen har mountat. */
async function oppnaPrimitives(page: Page) {
  await page.goto('/dev/primitives');
  // .first(): sidans EGEN rubrik är alltid FÖRST i DOM-ordning (TASK-285.3
  // lägger till ytterligare h1-rubriker längre ner).
  await page.getByRole('heading', { level: 1 }).first().waitFor();
}

/** Skjuter appens uppdaterings-event UPPREPAT (samma retry-loop som syskonfilerna). */
async function skjutAppUppdatering(page: Page) {
  await page.waitForFunction(
    () => {
      if (document.querySelector('[data-testid="app-update-reload"]')) {
        return true;
      }
      window.dispatchEvent(new CustomEvent('mm:app-uppdatering-tillganglig'));
      return false;
    },
    undefined,
    { timeout: 15_000, polling: 50 },
  );
}

/** Skjuter Vites `vite:preloadError` UPPREPAT (samma retry-loop som syskonfilen). */
async function skjutPreloadError(page: Page) {
  await page.waitForFunction(
    () => {
      if (document.querySelector('[data-testid="app-reload-required-reload"]')) {
        return true;
      }
      window.dispatchEvent(new Event('vite:preloadError', { cancelable: true }));
      return false;
    },
    undefined,
    { timeout: 15_000, polling: 50 },
  );
}

/**
 * Läser BÅDA måtten på ett element: antalet aktiva `Animation`-instanser
 * (`Element.getAnimations()`) och computed `transitionDuration`/
 * `animationName`. `getAnimations({ subtree: true })` täcker även barn
 * (t.ex. knapparna i en actions-slot) i samma läsning.
 */
async function lasRorelse(handtag: Locator) {
  return handtag.evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      antalAnimationer: el.getAnimations({ subtree: true }).length,
      transitionDuration: s.transitionDuration,
      animationName: s.animationName,
    };
  });
}

/**
 * NORMALT LÄGE: familjens element konfigurerar ALDRIG en transition eller
 * animation — kräver alltså EXAKT 0, inte bara "omärkbart litet".
 */
function forvantaIngenRorelseNormalt(rorelse: {
  antalAnimationer: number;
  transitionDuration: string;
  animationName: string;
}) {
  expect(rorelse.antalAnimationer).toBe(0);
  expect(Number.parseFloat(rorelse.transitionDuration) || 0).toBe(0);
  expect(rorelse.animationName).toBe('none');
}

/**
 * REDUCERAT LÄGE (`prefers-reduced-motion: reduce`): `base.css`s globala
 * klampregel sätter `transition-duration: 0.01ms !important` på `*` —
 * VARJE element, även ett som (som familjens) aldrig själv konfigurerat en
 * transition. Tröskeln är därför "omärkbar" (< 1 ms), inte "exakt 0" — se
 * filhuvudets § MEDIA-BÅDA-VÄGAR för mätningen och precedentet
 * (`svep-overgang-reduced-motion.acceptance.test.ts`). `getAnimations()`
 * kräver ändå EXAKT 0 i båda lägena: klampregeln ändrar en computed
 * CSS-egenskap, den skapar ingen `Animation`-instans.
 */
function forvantaOmarktRorelseReducerat(rorelse: {
  antalAnimationer: number;
  transitionDuration: string;
  animationName: string;
}) {
  expect(rorelse.antalAnimationer).toBe(0);
  expect(Number.parseFloat(rorelse.transitionDuration) || 0).toBeLessThan(0.001);
  expect(rorelse.animationName).toBe('none');
}

/**
 * Väntar in TVÅ animationsramar. `page.emulateMedia()` löser ett
 * `Emulation.setEmulatedMedia`-CDP-anrop, men style-omräkningen och en
 * eventuell KVARDRÖJANDE `Animation`-instans (t.ex. en fokus-/hover-
 * övergång som var i gång från en precis genomförd `click()`, se filens
 * mätning TASK-285.9) städas inte bort förrän webbläsaren hunnit rita om.
 * Utan denna väntan mätt `getAnimations()` INTERMITTENT icke-noll — samma
 * övergångsklass (`transition-colors`, `Button.tsx`) som är en AVSEDD
 * micro-interaktion, inte en familjeregression — direkt efter en
 * medieläges-växling.
 */
async function vantaEnAnimationsram(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      }),
  );
}

/**
 * Kör mätningen i BÅDA medielägen och bevisar att ingendera visar en
 * märkbar animation. `no-preference` sätts explicit (inte antaget default)
 * så baslinjen är deterministisk oavsett värdmaskinens egna
 * tillgänglighetsinställningar.
 */
async function verifieraIngenRorelseIBadaLagen(page: Page, handtag: Locator) {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await vantaEnAnimationsram(page);
  const normalt = await lasRorelse(handtag);
  forvantaIngenRorelseNormalt(normalt);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await vantaEnAnimationsram(page);
  const reducerat = await lasRorelse(handtag);
  forvantaOmarktRorelseReducerat(reducerat);
  // "Ändrar ingenting" (kortets egen formulering) betyder att ingendera
  // läget ger en MÄRKBAR rörelse — INTE att de två lägenas rå
  // `transitionDuration`-sträng är byte-identisk (`base.css`s globala
  // klampregel ÄNDRAR den siffran avsiktligt till 0.01ms, se ovan). Det
  // observerbara beteendet (antal animationer, animationName) är däremot
  // identiskt i båda lägen — det jämförs explicit här.
  expect(reducerat.antalAnimationer).toBe(normalt.antalAnimationer);
  expect(reducerat.animationName).toBe(normalt.animationName);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
}

test.describe('Notisfamiljen — rörelsefrihet (TASK-285.9, AC #3)', () => {
  test('Uppdateringsnotis: 0 animationer, ingen transition, oförändrat under reduced-motion', async ({
    page,
  }) => {
    await oppnaPrimitives(page);
    await skjutAppUppdatering(page);
    await expect(page.locator(NOTIS_LADDA_OM)).toBeVisible();
    await verifieraIngenRorelseIBadaLagen(page, page.locator(NOTIS_KORT));
  });

  test('OfflineIndicator: 0 animationer, ingen transition, oförändrat under reduced-motion', async ({
    page,
  }) => {
    await oppnaPrimitives(page);
    await page.evaluate(() => window.dispatchEvent(new Event('offline')));
    await expect(page.locator(OFFLINE_KORT)).toBeVisible();
    await verifieraIngenRorelseIBadaLagen(page, page.locator(OFFLINE_KORT));
  });

  test('ChunkBanner: 0 animationer, ingen transition, oförändrat under reduced-motion', async ({
    page,
  }) => {
    await oppnaPrimitives(page);
    await skjutPreloadError(page);
    await expect(page.locator(CHUNK_LADDA_OM)).toBeVisible();
    await verifieraIngenRorelseIBadaLagen(page, page.locator(CHUNK_BANNER));
  });

  for (const intent of MESSAGE_INTENTS) {
    test(`Meddelanderutan (${intent}): 0 animationer, ingen transition, oförändrat under reduced-motion`, async ({
      page,
    }) => {
      await oppnaPrimitives(page);
      const roll = intent === 'success' || intent === 'info' ? 'status' : 'alert';
      const ruta = page
        .locator(MESSAGEBOX_SEKTION)
        .getByRole(roll)
        .filter({ hasText: `Rubrik (${intent})` });
      await expect(ruta).toBeVisible();
      await verifieraIngenRorelseIBadaLagen(page, ruta);
    });
  }

  test('SectionError (vanligt fel): 0 animationer, ingen transition, oförändrat under reduced-motion', async ({
    page,
  }) => {
    await page.goto('/dev/sektionsfel');
    await page.getByRole('heading', { level: 1, name: 'Sektionsfel (dev)' }).waitFor();
    await page.getByRole('button', { name: 'Kasta sektions-fel' }).click();
    const alert = page.getByRole('alert').filter({ hasText: 'Den här delen kunde inte visas' });
    await expect(alert).toBeVisible();
    await verifieraIngenRorelseIBadaLagen(page, alert);
  });

  test('SectionError (chunk-fel): 0 animationer, ingen transition, oförändrat under reduced-motion', async ({
    page,
  }) => {
    await page.goto('/dev/sektionsfel');
    await page.getByRole('heading', { level: 1, name: 'Sektionsfel (dev)' }).waitFor();
    await page.getByRole('button', { name: 'Kasta chunk-fel' }).click();
    const alert = page.getByRole('alert').filter({ hasText: 'Den här delen behöver laddas om' });
    await expect(alert).toBeVisible();
    await verifieraIngenRorelseIBadaLagen(page, alert);
  });

  test('Appfel-fallbacken (skarp form): 0 animationer, ingen transition, oförändrat under reduced-motion', async ({
    page,
  }) => {
    await oppnaPrimitives(page);
    const kort = page.locator(APPFEL_SKARP_ALERT);
    await expect(kort).toBeVisible();
    await verifieraIngenRorelseIBadaLagen(page, kort);
  });
});
