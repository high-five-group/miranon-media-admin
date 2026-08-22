import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

/**
 * "Installera appen" — Mer-flikens install-yta (task-126.3; PRD task-126,
 * ADR-094). Datalös produktvy (11/10/10) byggd direkt ovanpå task-126.2:s
 * render-prop-läge (InstallPrompt.tsx: "den väg task-126.3 använder för att
 * bygga sin pedagogiska Mer-flik-yta ovanpå samma hook-tillstånd") — noll
 * nätverksanrop, per konstruktion, exakt install-prompt.test.ts:s egen
 * klassificeringsgrund (ADR-094 Beslut 2: "har testet ett databeteende att
 * bevisa formen av? ... Nej på båda → webblasarbeteende").
 *
 * Kör mot `/dev/installera-appen` — en dev-guardad demo-route, INTE
 * `/mer/installera-appen`: den äkta routen ligger bakom `_authenticated`, och
 * att seeda en fejkad session (hermetic.ts:s teknik) hade dragit in
 * acceptance-klassens fixturvärld-maskineri i en klass som per konstruktion
 * ska vara oberoende av den (se routens egen kommentar för hela
 * resonemanget).
 *
 * Bevisar AC 1 (plattformens väg dominerar överst, övriga NÅS men dominerar
 * inte) och AC 3 (Chromium-knappen installerar på riktigt — övergången till
 * redan-installerad-läget). AC 4 (bekräftelse i stället för instruktion)
 * verifieras strukturellt (rätt block renderas/uteblir). AC 2:s PEDAGOGISKA
 * kvalitet (Gunilla-principen) är Marcus-grinden (DoD 5, öppen) — dessa
 * tester bevisar bara att rätt TEXTBLOCK visas för rätt plattform, inte att
 * texten är begriplig.
 */

async function satt(
  page: Page,
  opts: {
    userAgent?: string;
    platform?: string;
    maxTouchPoints?: number;
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
  }, opts);
  await page.goto('/dev/installera-appen');
  await page.getByRole('heading', { level: 1 }).waitFor();
}

/**
 * Skjuter Chromiums installationshändelse UPPREPAT tills knappen syns i
 * DOM:en (mount-race-robust — samma teknik som install-prompt.test.ts,
 * se den filens huvudkommentar Runda 3–4 för varför en engångsdispatch
 * racar mot Reacts useEffect-mount). Kollen är NAMN-scopad (`textContent`),
 * inte `document.querySelector('button')` rakt av: dev-servern monterar
 * TanStack Router/Query Devtools-knapparna (lazy, asynkront) på VARJE
 * `/dev/*`-sida, och en obetingad `button`-sökning kan träffa dem i stället
 * för vår egen (mätt skarpt i a11y-klassens motsvarande fil, där den extra
 * väntan på `<h1>` innan testkroppen kör gav devtools-knapparna tid att
 * hinna montera före dispatchen).
 */
async function skjutBeforeInstallPrompt(page: Page, utfall: 'accepted' | 'dismissed') {
  await page.waitForFunction(
    (utfallArg) => {
      const knappFinns = Array.from(document.querySelectorAll('button')).some((b) =>
        b.textContent?.includes('Installera appen'),
      );
      if (knappFinns) return true;
      const event = new Event('beforeinstallprompt', { cancelable: true }) as Event & {
        prompt: () => Promise<void>;
        userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
      };
      event.prompt = () => Promise.resolve();
      event.userChoice = Promise.resolve({ outcome: utfallArg, platform: 'web' });
      window.dispatchEvent(event);
      return false;
    },
    utfall,
    { timeout: 15_000, polling: 50 },
  );
}

test.describe('Installera appen — plattformens väg dominerar överst, övriga nås (AC 1)', () => {
  test('Desktop Chrome (Playwrights riktiga UA, ingen override): chromium-prompt primär', async ({
    page,
  }) => {
    await page.goto('/dev/installera-appen');
    await expect(
      page.getByRole('heading', { level: 2, name: 'Så installerar du i den här webbläsaren' }),
    ).toBeVisible();
    // Sekundära vägar NÅS (summary-raden synlig och klickbar)...
    await expect(
      page.locator('summary', { hasText: 'Har du en iPhone eller iPad?' }),
    ).toBeVisible();
    // ...men DOMINERAR INTE: innehållet är kollapsat (details utan open).
    await expect(page.getByText('Öppna Safari.')).not.toBeVisible();
  });

  test('iPhone (UA-sträng): ios-manuell primär, hela instruktionen synlig', async ({ page }) => {
    await satt(page, {
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
      platform: 'iPhone',
      maxTouchPoints: 5,
    });
    await expect(
      page.getByRole('heading', {
        level: 2,
        name: 'Så installerar du på din iPhone eller iPad',
      }),
    ).toBeVisible();
    await expect(page.getByText('Öppna Safari.')).toBeVisible();
    await expect(page.getByText('Tryck på Dela-knappen.')).toBeVisible();
  });

  test('macOS Safari (Macintosh UA, 0 touch-points, Safari utan Chrome): macos-safari-dock primär', async ({
    page,
  }) => {
    await satt(page, {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
      platform: 'MacIntel',
      maxTouchPoints: 0,
    });
    await expect(
      page.getByRole('heading', { level: 2, name: 'Så installerar du på din Mac' }),
    ).toBeVisible();
    await expect(page.getByText('Öppna menyn "Arkiv".')).toBeVisible();
  });

  test('sekundär väg NÅS: att öppna iOS-details på en Chromium-sida visar hela instruktionen', async ({
    page,
  }) => {
    await page.goto('/dev/installera-appen');
    await page.locator('summary', { hasText: 'Har du en iPhone eller iPad?' }).click();
    await expect(page.getByText('Öppna Safari.')).toBeVisible();
    await expect(page.getByText('Klart!').first()).toBeVisible();
  });

  test('sekundär väg NÅS: att öppna Mac-details på en Chromium-sida visar hela instruktionen', async ({
    page,
  }) => {
    await page.goto('/dev/installera-appen');
    await page.locator('summary', { hasText: 'Har du en Mac?' }).click();
    await expect(page.getByText('Öppna menyn "Arkiv".')).toBeVisible();
  });
});

test.describe('Installera appen — redan installerad ger bekräftelse, ingen instruktion (AC 4)', () => {
  test('matchMedia display-mode:standalone → bekräftelse-läge, inga instruktionsrubriker/-vägar', async ({
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
    await page.goto('/dev/installera-appen');
    await expect(page.getByText('Appen är redan installerad')).toBeVisible();
    await expect(page.getByText('Du behöver inte göra något mer.')).toBeVisible();
    // AC 4: INGEN instruktion kvar — varken primär (h2) eller sekundär
    // (Andra enheter-blocket/details).
    await expect(page.getByRole('heading', { level: 2 })).toHaveCount(0);
    await expect(page.getByText('Andra enheter')).toHaveCount(0);
  });
});

test.describe('Installera appen — Chromium-knappen installerar på riktigt (AC 3)', () => {
  test('beforeinstallprompt fångad → knapp synlig → klick → accepted → redan-installerad-läget visas', async ({
    page,
  }) => {
    await page.goto('/dev/installera-appen');
    await expect(page.getByRole('button', { name: 'Installera appen' })).toHaveCount(0);

    await skjutBeforeInstallPrompt(page, 'accepted');
    const knapp = page.getByRole('button', { name: 'Installera appen' });
    await expect(knapp).toBeVisible();

    await knapp.click();
    // Ingen reload, ingen mellanliggande sida — samma render-cykel växlar
    // hela ytan till bekräftelse-läget (AC 3).
    await expect(page.getByText('Appen är redan installerad')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Installera appen' })).toHaveCount(0);
  });

  test('beforeinstallprompt avvisad (dismissed) → fallback-guidningen visas igen, ingen övergång', async ({
    page,
  }) => {
    await page.goto('/dev/installera-appen');
    await skjutBeforeInstallPrompt(page, 'dismissed');
    const knapp = page.getByRole('button', { name: 'Installera appen' });
    await expect(knapp).toBeVisible();

    await knapp.click();
    // Engångshändelsen är förbrukad → knappen försvinner, fallback-texten
    // (adressfältets ikon/menyn) visas igen i stället.
    await expect(page.getByRole('button', { name: 'Installera appen' })).toHaveCount(0);
    await expect(page.getByText('Leta efter en installationsikon')).toBeVisible();
    await expect(page.getByText('Appen är redan installerad')).toHaveCount(0);
  });
});

/**
 * SIDKROM (TASK-299.9, PRD `TASK-299` § OMFATTNINGEN LÅST) — installera-
 * appens FÖRSTA behavioral-skarv för den promoverade `SidRam`-chevronen.
 *
 * PLACERING, MEDVETET AVVÄGD: kortets AC #5 säger "acceptance-skarv", men
 * `InstalleraAppen` har NOLL databeteende (filhuvudet ovan, ADR-094) —
 * `hermetik-sjalvtest.mjs` kräver att VARJE test i `acceptance`-projektet
 * fäller med `OmockadRequestError` när normalläget töms (ADR-080 beslut 3).
 * Ett test som aldrig gör ett nätverksanrop överlever ALLTID den tömningen
 * och skulle fälla självtestets eget villkor — exakt det öde som mötte de
 * 11 install-prompt-testerna ADR-094s Kontext beskriver. Denna fils klass
 * (`webblasarbeteende`) är den ADR-094-korrekta hemvisten för chrome-
 * beteende på en datalös yta; se `MailLog.tsx`s SidRam-svit i
 * `tests/acceptance/mer-maillogg.acceptance.test.ts` för motsvarande skarv
 * på en yta som FAKTISKT har databeteende att hänga mockningen på.
 *
 * Körs mot `/dev/installera-appen` (samma dev-guardade demo-route som
 * filens övriga tester) — `SidRam`s DOM (chevron, `aria-label`, `href`) är
 * identisk oavsett `AppShell`/auth-kontext, så chrome-verifieringen behöver
 * ingen seedad session. Klick-igenom (verklig navigering) provas i stället
 * på den RIKTIGA autentiserade routen, se `mer-maillogg.acceptance.test.ts`.
 */
test.describe('Installera appen — SidRam-sidkrom (TASK-299.9)', () => {
  test('chevronen bär namnet "Tillbaka till Mer" och länkar till /mer — ingen textlänk kvar', async ({
    page,
  }) => {
    await page.goto('/dev/installera-appen');
    await expect(page.getByRole('heading', { level: 1, name: 'Installera appen' })).toBeVisible();

    // SidRam (TASK-299.9): namnet är EXAKT `tillbakaEtikett` — ingen "←"-
    // prefix, det var den äldre textlänkens form. Chevronen bär det
    // tillgängliga namnet ensam (ikon-ENSAM knapp).
    const tillbaka = page.getByRole('link', { name: 'Tillbaka till Mer' });
    await expect(tillbaka).toBeVisible();
    await expect(tillbaka).toHaveAttribute('href', '/mer');

    // Den äldre textlänken ("← Tillbaka till Mer") ska inte längre finnas.
    await expect(page.getByRole('link', { name: '← Tillbaka till Mer' })).toHaveCount(0);
  });
});
