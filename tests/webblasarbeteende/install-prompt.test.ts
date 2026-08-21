import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

/**
 * InstallPrompt — externt beteende (task-126.2, TASK-131, ADR-094).
 *
 * FLYTTAD UR acceptance-KLASSEN (TASK-131). PRD task-126 §Testbeslut sade
 * ursprungligen "testas i acceptance-skarven — hermetiskt, utan staging", och
 * de 11 testerna nedan landade där (PR #628, commit 5b28b6ca). `scripts/
 * hermetik-sjalvtest.mjs` (ADR-080 beslut 3, VILLKOR för klassens existens)
 * fällde alla 11: de överlever utan fixturvärldens svar, eftersom
 * `InstallPrompt`/`useInstallPrompt` har NOLL databeteende — hooken läser
 * `navigator.userAgent`, `navigator.platform`, `matchMedia` och lyssnar på
 * webbläsar-events, aldrig ett nätverkssvar. Vakten gjorde rätt (inget av
 * detta bevisar något om appens databeteende); placeringen var fel. ADR-094
 * ger den sortens test en egen klass — `webblasarbeteende` — i stället för
 * att urholka acceptance-vakten med ett undantag. Se ADR-094 + CONTRIBUTING.md
 * § Webbläsarbeteende-klassen för fullständig motivering och alternativ som
 * övervägdes.
 *
 * Kör mot `/dev/primitives` (ADR-044-demoytan, dev-guardad men nåbar i
 * klassens egen `npm run dev`-server, port 5499) — konsumentytan (Mer-fliken)
 * är TASK-126.3, en separat beroende skiva som inte finns än. Detta är
 * bibliotekskomponentens EGEN bevisyta.
 *
 * Plattformarna simuleras hermetiskt via `page.addInitScript`. OBS mot
 * `SlideToConfirm.spec.ts` § stubbaWebAudio-mönstret: den tekniken avslutar
 * med `page.reload()`, vilket kräver att sidan redan är navigerad en gång —
 * a11y-projektets auto-navigate-fixture ger det gratis. Denna klass saknar
 * den fixturen (sidan är `about:blank` tills testet gör sitt EGET första
 * `goto`), så `satt()` här avslutar med `page.goto()`, aldrig `reload()`, för
 * just den första navigeringen.
 *
 * Playwrights Desktop Chrome-device ÄR redan en riktig Chromium-webbläsare,
 * så chromium-prompt-vägens DEFAULT-detektering testas utan någon override
 * alls. `beforeinstallprompt`/`appinstalled` simuleras med syntetiska
 * `Event`-objekt dispatchade direkt på `window` — hooken lyssnar på
 * händelsenamnet, inte på ett specifikt konstruktor-ursprung, så detta är en
 * trogen simulering, inte en genväg.
 *
 * AVVIKELSE FRÅN STRIKT PER-BETEENDE RÖD→GRÖN (dokumenterad, ej tyst):
 * hookens interna tillstånd delar ETT useEffect/useState-block (plattforms-
 * detektering, den fångade `beforeinstallprompt`-händelsen och `appinstalled`-
 * övergången hänger ihop i samma tillståndsmaskin). Att stubba ut delar av
 * den för att tvinga fram mikro-cykler per test hade skapat konstlade
 * mellansteg utan verkligt värde.
 *
 * FYRA RÖD→GRÖN-RUNDOR, ALLA ÄRLIGT BOKFÖRDA (exakta kommandon/tidsstämplar
 * i slutrapportens TDD-bevisrad). Alla fixar efter Runda 1 var TESTKODENS
 * egna fel — noll produktionskodsändringar krävdes efter Runda 1:
 *   RUNDA 1 — ren röd baseline (implementationen medvetet `git stash`:ad ur
 *     trädet): 9/9 röda, `element(s) not found` — sektionen fanns inte.
 *   RUNDA 2 — implementationen återställd: 2/9 gröna direkt, 7/9 röda.
 *     Grundorsak: `satt()`s `page.reload()` mot en aldrig navigerad
 *     `about:blank`-sida (5 tester) — se `satt()` ovan.
 *   RUNDA 3 — efter reload→goto-fixen: 8/9 gröna, 1 röd (`--repeat-each=3`
 *     bekräftade 3/3 deterministiskt rött, ingen flake). Grundorsak: en EN
 *     GÅNGS synkron `dispatchEvent('beforeinstallprompt')` racade mot Reacts
 *     `useEffect`-mount — komponenten renderar `null` BÅDE före och efter
 *     att effekten körts, så en "knappen syns inte än"-assertion bevisar
 *     INGET om att lyssnaren faktiskt registrerats; hinner dispatchen före
 *     lyssnaren är eventet förlorat för gott (ingen ny dispatch kommer).
 *     En parallell bugg i samma runda: `appinstalled`-kaskaden var kedjad på
 *     `userChoice`-PROMISEN (`Promise.resolve(...).then(...)`), som kör sin
 *     callback på nästa mikrotask OAVSETT om något awaitar den — eventet sköts
 *     alltså omedelbart vid KONSTRUKTION, inte vid `prompt()`-ANROPET.
 *   RUNDA 4 — `skjutBeforeInstallPrompt()` skriven om till en
 *     `page.waitForFunction`-RETRY-loop (dispatchar tills knappen syns i
 *     DOM:en) + `appinstalled`-kaskaden flyttad in i `prompt()`, som bara
 *     körs vid ett faktiskt klick: 9/9 gröna, `--repeat-each=3` bekräftade
 *     27/27 gröna (0 flake). Detta är racet mot ett TESTETS syntetiska
 *     engångsdispatch — riktiga webbläsare skjuter `beforeinstallprompt`
 *     efter att sidan bevisligen blivit interaktiv, så fenomenet existerar
 *     inte i produktion; fixen gör simuleringen robust utan att ändra vad
 *     som faktiskt bevisas.
 */

const DEFAULT_INSTANS = '[data-testid="installprompt-default"]';
const INSPEKTIONS_INSTANS = '[data-testid="installprompt-inspect"]';
const VAG_VARDE = '[data-testid="installprompt-path-value"]';

/**
 * Registrerar navigator-överskuggningar FÖRE första navigeringen och
 * navigerar dit (denna klass saknar a11y-projektets auto-navigate-fixture —
 * sidan är `about:blank` tills testet själv gör sitt FÖRSTA `goto`; ett
 * `reload()` här reloadar `about:blank`, inte demoytan — det var den
 * ursprungliga bugg som gjorde alla plattforms-tester röda av fel skäl, kvar
 * som historik från tiden testerna låg i acceptance-klassen).
 */
async function satt(
  page: Page,
  opts: {
    userAgent?: string;
    platform?: string;
    maxTouchPoints?: number;
    standalone?: boolean;
  },
) {
  await page.addInitScript((o) => {
    if (o.userAgent !== undefined) {
      Object.defineProperty(window.navigator, 'userAgent', {
        get: () => o.userAgent,
        configurable: true,
      });
    }
    if (o.platform !== undefined) {
      Object.defineProperty(window.navigator, 'platform', {
        get: () => o.platform,
        configurable: true,
      });
    }
    if (o.maxTouchPoints !== undefined) {
      Object.defineProperty(window.navigator, 'maxTouchPoints', {
        get: () => o.maxTouchPoints,
        configurable: true,
      });
    }
    if (o.standalone !== undefined) {
      Object.defineProperty(window.navigator, 'standalone', {
        get: () => o.standalone,
        configurable: true,
      });
    }
  }, opts);
  await page.goto('/dev/primitives');
  // .first(): sidans EGEN rubrik är alltid FÖRST i DOM-ordning — sedan
  // TASK-285.3 bär /dev/primitives ytterligare två h1-rubriker längre ner
  // (AppError-fallbackens demo-sektion, facit-formen), så ett oscopat
  // getByRole('heading', { level: 1 }) blir en strict-mode-krock.
  await page.getByRole('heading', { level: 1 }).first().waitFor();
}

/**
 * Skjuter Chromiums installationshändelse (web.dev-kontraktet) UPPREPAT tills
 * knappen faktiskt syns i DOM:en — inte en enda gång. `appinstalled`-
 * kaskaden (vid `utfall: 'accepted'`) sitter i `prompt()`-ANROPET, inte i
 * konstruktionen — se filhuvudets Runda 3–4 för varför båda formerna
 * (engångsdispatch resp. konstruktions-kedjad kaskad) var röda av fel skäl.
 */
async function skjutBeforeInstallPrompt(
  page: Page,
  { utfall }: { utfall: 'accepted' | 'dismissed' },
) {
  await page.waitForFunction(
    (utfallArg) => {
      if (document.querySelector('[data-testid="installprompt-default"] button')) return true;
      const event = new Event('beforeinstallprompt', { cancelable: true }) as Event & {
        prompt: () => Promise<void>;
        userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
      };
      // Slutet `anropad`-tillstånd PER EVENT-OBJEKT (inte per anrop) — en
      // riktig `BeforeInstallPromptEvent` kan bara accepteras EN gång
      // (web.dev-kontraktet); ett andra `.prompt()`-anrop på SAMMA
      // objektreferens (t.ex. från en syskoninstans som delar samma fångade
      // event men inte samma lokala React-state, review-fynd task-126.2)
      // ska kasta precis som riktiga Chromium-implementationer gör
      // (`InvalidStateError`) — annars bevisar testet inget om
      // `promptToInstall()`s catch-gren.
      let anropad = false;
      event.prompt = () => {
        if (anropad) {
          return Promise.reject(
            new DOMException(
              'Detta installations-event är redan konsumerat — kan bara accepteras en gång',
              'InvalidStateError',
            ),
          );
        }
        anropad = true;
        if (utfallArg === 'accepted') {
          // MDN "Window: appinstalled event" — webbläsaren skjuter den som
          // en direkt följd av att INSTALLATIONEN faktiskt utlöses (dvs.
          // prompt()-anropet), inte av att händelsen fångades.
          queueMicrotask(() => window.dispatchEvent(new Event('appinstalled')));
        }
        return Promise.resolve();
      };
      event.userChoice = Promise.resolve({ outcome: utfallArg, platform: 'web' });
      window.dispatchEvent(event);
      return false;
    },
    utfall,
    { timeout: 15_000, polling: 50 },
  );
}

async function skjutAppInstalled(page: Page) {
  await page.evaluate(() => window.dispatchEvent(new Event('appinstalled')));
}

test.describe('InstallPrompt — plattformsdetektering (AC 1)', () => {
  test('Desktop Chrome (Playwrights riktiga UA, ingen override): chromium-prompt, ingen död knapp', async ({
    page,
  }) => {
    await page.goto('/dev/primitives');
    await expect(page.locator(VAG_VARDE)).toHaveText('chromium-prompt');
    await expect(page.locator(INSPEKTIONS_INSTANS)).toContainText('ingen prompt tillgänglig');
    // AC 2: default-instansen renderar INGEN knapp innan händelsen fångats.
    await expect(page.locator(DEFAULT_INSTANS).getByRole('button')).toHaveCount(0);
  });

  test('iPhone (UA-sträng): ios-manuell', async ({ page }) => {
    await satt(page, {
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
      platform: 'iPhone',
      maxTouchPoints: 5,
    });
    await expect(page.locator(VAG_VARDE)).toHaveText('ios-manuell');
  });

  test('iPad på iPadOS 13+ (UA maskerad som Macintosh + touch-points > 1): ios-manuell', async ({
    page,
  }) => {
    // Research 2026-08-02 (aworkinprogress.dev, getsentry/sentry-javascript#12127):
    // iPadOS 13+ skickar en UA identisk med desktop-Safari på Mac. Det
    // dokumenterade knepet som skiljer dem: navigator.platform === 'MacIntel'
    // OCH maxTouchPoints > 1 (riktiga Mac-datorer saknar touchskärm helt).
    await satt(page, {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
      platform: 'MacIntel',
      maxTouchPoints: 5,
    });
    await expect(page.locator(VAG_VARDE)).toHaveText('ios-manuell');
  });

  test('macOS Safari (Macintosh UA, 0 touch-points, Safari-token utan Chrome): macos-safari-dock', async ({
    page,
  }) => {
    await satt(page, {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
      platform: 'MacIntel',
      maxTouchPoints: 0,
    });
    await expect(page.locator(VAG_VARDE)).toHaveText('macos-safari-dock');
  });

  test('macOS Chrome (Macintosh UA MEN bär "Chrome"): faller till chromium-prompt, inte macos-safari-dock', async ({
    page,
  }) => {
    await satt(page, {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      platform: 'MacIntel',
      maxTouchPoints: 0,
    });
    await expect(page.locator(VAG_VARDE)).toHaveText('chromium-prompt');
  });

  test('redan installerad (matchMedia display-mode: standalone) — vinner över UA', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const original = window.matchMedia.bind(window);
      window.matchMedia = ((query: string) => {
        if (query.includes('display-mode: standalone')) {
          return {
            matches: true,
            media: query,
            onchange: null,
            addListener() {},
            removeListener() {},
            addEventListener() {},
            removeEventListener() {},
            dispatchEvent: () => true,
          } as unknown as MediaQueryList;
        }
        return original(query);
      }) as typeof window.matchMedia;
    });
    await satt(page, {
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
    });
    await expect(page.locator(VAG_VARDE)).toHaveText('redan-installerad');
  });
});

test.describe('InstallPrompt — prompt-flödet (AC 2)', () => {
  test('beforeinstallprompt fångad → knappen blir tillgänglig; klick → accepted → onInstalled', async ({
    page,
  }) => {
    await page.goto('/dev/primitives');
    await expect(page.locator(DEFAULT_INSTANS).getByRole('button')).toHaveCount(0);

    await skjutBeforeInstallPrompt(page, { utfall: 'accepted' });
    const knapp = page.locator(DEFAULT_INSTANS).getByRole('button');
    await expect(knapp).toHaveCount(1);
    await expect(page.locator(INSPEKTIONS_INSTANS)).toContainText('prompt tillgänglig');

    await knapp.click();
    await expect(page.getByTestId('senast-tryckt')).toHaveText('installprompt: installerad');
    // Efter 'accepted' är händelsen konsumerad och läget är redan-installerad
    // (AC 3: rapporteras som eget läge omedelbart, utan reload).
    await expect(page.locator(VAG_VARDE)).toHaveText('redan-installerad');
    await expect(page.locator(DEFAULT_INSTANS).getByRole('button')).toHaveCount(0);
  });

  test('beforeinstallprompt avvisad (dismissed) → knappen försvinner igen, ingen redan-installerad-övergång', async ({
    page,
  }) => {
    await page.goto('/dev/primitives');
    await expect(page.locator(DEFAULT_INSTANS).getByRole('button')).toHaveCount(0);
    await skjutBeforeInstallPrompt(page, { utfall: 'dismissed' });
    const knapp = page.locator(DEFAULT_INSTANS).getByRole('button');
    await expect(knapp).toHaveCount(1);
    await knapp.click();
    // Engångshändelsen är förbrukad → knappen är strukturellt borta igen
    // (AC 2: ingen död knapp kan uppstå kvar efter ett avvisat val).
    await expect(page.locator(DEFAULT_INSTANS).getByRole('button')).toHaveCount(0);
    await expect(page.locator(VAG_VARDE)).toHaveText('chromium-prompt');
  });
});

test.describe('InstallPrompt — redan-installerad-övergång (AC 3)', () => {
  test('appinstalled-händelsen (t.ex. installerad via webbläsarens egen meny) → redan-installerad', async ({
    page,
  }) => {
    await page.goto('/dev/primitives');
    await expect(page.locator(VAG_VARDE)).toHaveText('chromium-prompt');
    await skjutAppInstalled(page);
    await expect(page.locator(VAG_VARDE)).toHaveText('redan-installerad');
  });
});

/**
 * Review-fynd (task-126.2, oberoende granskningspass): två `InstallPrompt`-
 * instanser på samma sida har VARSIN lokal `useInstallPrompt()`-state (inget
 * delat, per Reacts hook-modell) men kan referera samma underliggande
 * engångshändelse när `beforeinstallprompt` dispatchas globalt. Dessa två
 * tester bevisar `promptToInstall()`s BÅDA försvarslinjer direkt mot
 * render-prop-instansens ovillkorliga testknapp (`InstallPromptTsx`s
 * kommentar om att render-prop-läget INTE bär den strukturella garantin).
 */
test.describe('InstallPrompt — promptToInstall()-kontraktets försvarslinjer (review-fynd)', () => {
  test('anropad utan någonsin fångad händelse: kastar (invariant), fångas av konsumenten', async ({
    page,
  }) => {
    await page.goto('/dev/primitives');
    await page
      .locator(INSPEKTIONS_INSTANS)
      .getByRole('button', { name: 'Testa promptToInstall() direkt (bibliotekskontraktet)' })
      .click();
    await expect(page.getByTestId('senast-tryckt')).toHaveText(
      'installprompt: direkt-anrop kastade',
    );
  });

  test('en syskoninstans har redan konsumerat samma engångshändelse: degraderar graciöst till "dismissed", hänger aldrig', async ({
    page,
  }) => {
    await page.goto('/dev/primitives');
    await skjutBeforeInstallPrompt(page, { utfall: 'dismissed' });

    // Instans A (default) konsumerar händelsen först.
    await page.locator(DEFAULT_INSTANS).getByRole('button').click();
    await expect(page.locator(DEFAULT_INSTANS).getByRole('button')).toHaveCount(0);

    // Instans B (render-prop-inspektören) höll KVAR sin egen referens till
    // samma nu-förbrukade event (ingen delad state) — dess ovillkorliga
    // testknapp anropar promptToInstall() på den, vilket UTAN review-fixen
    // hade blivit en osynkad rejection (en synligt död knapp). Med fixen
    // nollställs lokalt state och utfallet degraderar graciöst till
    // 'dismissed' i stället för att hänga eller tystna.
    await page
      .locator(INSPEKTIONS_INSTANS)
      .getByRole('button', { name: 'Testa promptToInstall() direkt (bibliotekskontraktet)' })
      .click();
    await expect(page.getByTestId('senast-tryckt')).toHaveText(
      'installprompt: direkt-anrop dismissed',
    );
  });
});
