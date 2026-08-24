import AxeBuilder from '@axe-core/playwright';
import { http } from 'msw';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from '../support/fixturvarld/hermetic';

/**
 * Maillogg — visual-baslinje-FÖRBEREDELSE (TASK-299.9 AC #4).
 *
 * SPEC-FILEN FINNS, BASLINJEN TAS INTE HÄR (samma regel som
 * `notis-visual.spec.ts`/`offline-visual.spec.ts` — se den förstnämndas
 * filhuvud för den fullständiga motiveringen; `CONTRIBUTING.md` §
 * Visuell regression: "Baselines föds i CI, aldrig lokalt"). Ingen
 * `-linux.png` checkas in av denna skiva — den föds via
 * `visual-baselines.yml` (avfyrbar) EFTER granskning, precis som
 * notis-/offline-parets.
 *
 * YTAN: den PROMOVERADE sidramen (`SidRam`, kant-i-kant-dialekten,
 * TASK-299.9) på den RIKTIGA, autentiserade routen `/mer/maillogg` —
 * ersätter den äldre textlänken ("← Tillbaka till Mer") och den
 * dubblerade sidmarginalen (`MailLog.tsx`s filhuvud har hela historiken).
 * IFYLLD vy (två rader): sidkrom + rubrik + lista i samma bild, så
 * indraget mellan chevron/rubrik och den kant-i-kanta listan syns.
 *
 * DESKTOP + MOBIL: samma spec körs under BÅDA `visual-desktop` (1440×900)
 * och `visual-mobile` (375×812) — projektmatrisen i `playwright.config.ts`
 * ger de två vyporterna utan att testet skriver dem själv.
 */
test('maillogg (SidRam-sidkrom, ifylld vy) — /mer/maillogg', async ({ page, network }) => {
  network.use(
    http.get(EF('get-mail-log'), () =>
      json({
        maillog: [
          {
            id: 'recML0001',
            utskicksNamn: 'Vårnyhetsbrev',
            utskicksIds: ['recBULK01'],
            skickatTill: ['recPER01', 'recPER02'],
            antalSkickade: 2,
            datum: '2026-05-02T10:00:00.000Z',
            oppningsgrad: 0.5,
            filterSnapshot: 'Segment: aktiva deltagare',
            mailutskickCopy: null,
          },
          {
            id: 'recML0002',
            utskicksNamn: 'Höstkampanj',
            utskicksIds: ['recBULK02'],
            skickatTill: ['recPER03'],
            antalSkickade: 5,
            datum: '2026-05-01T09:00:00.000Z',
            oppningsgrad: 0.2,
            filterSnapshot: null,
            mailutskickCopy: null,
          },
        ],
      }),
    ),
  );

  await page.goto('/mer/maillogg');
  await expect(page.getByRole('heading', { level: 1, name: 'Maillogg' })).toBeVisible();
  await expect(page.getByText('Vårnyhetsbrev')).toBeVisible();

  await expect(page).toHaveScreenshot('maillogg-ifylld.png', { fullPage: true });
});

/**
 * [TASK-314, 299.10 steg 10] prefers-contrast: more. Samma `emulateMedia`-
 * mönster som `dorrlista-promoverings-grind.spec.ts` rad ~746-782.
 *
 * UPPGRADERAD TILL TOKEN-PROBE (TASK-317, Marcus-beslut 2026-08-24):
 * maillogg-radens (`MailLog.tsx`) `<li>` bar tidigare INGEN egen
 * `contrast-more:`-klass — raddelaren var en STATISK `border-text-muted/20
 * border-b`, redan synlig i normalläget, så grinden kunde bara bevisa att
 * gränsen förblev renderad (solid, bredd > 0), inte att kontrastläget
 * faktiskt gjorde något. TASK-317 lade till
 * `contrast-more:border-border-strong` på raden — samma token-kedja
 * (`--mm-border-strong`) dörrlistans/`AnmalningarSida.tsx`s referens prövar.
 * Probeteknik identisk med `anmalningssidan-promoverings-grind.spec.ts`:
 * DOM-löst token jämfört mot den faktiskt renderade kantfärgen, plus en
 * fullsides pixel-baseline (samma idiom som filens ordinarie test ovan) och
 * axe 0.
 */
test('maillogg — hög-kontrast-läge (prefers-contrast: more)', async ({ page, network }) => {
  const WCAG_TAGGAR = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

  await page.emulateMedia({ contrast: 'more' });
  network.use(
    http.get(EF('get-mail-log'), () =>
      json({
        maillog: [
          {
            id: 'recMLKontrast001',
            utskicksNamn: 'Vårnyhetsbrev',
            utskicksIds: ['recBULK01'],
            skickatTill: ['recPER01', 'recPER02'],
            antalSkickade: 2,
            datum: '2026-05-02T10:00:00.000Z',
            oppningsgrad: 0.5,
            filterSnapshot: 'Segment: aktiva deltagare',
            mailutskickCopy: null,
          },
        ],
      }),
    ),
  );

  await page.goto('/mer/maillogg');
  await expect(page.getByRole('heading', { level: 1, name: 'Maillogg' })).toBeVisible();
  await expect(page.getByText('Vårnyhetsbrev')).toBeVisible();

  const rad = page.getByRole('list').getByRole('listitem').first();
  const kant = await rad.evaluate((el) => {
    const s = getComputedStyle(el);
    return { bredd: s.borderBottomWidth, stil: s.borderBottomStyle, farg: s.borderBottomColor };
  });
  expect(kant.stil).toBe('solid');
  expect(Number.parseFloat(kant.bredd)).toBeGreaterThan(0);

  const strongToken = await page.evaluate(() => {
    const probe = document.createElement('span');
    probe.style.color = 'var(--mm-border-strong)';
    document.body.appendChild(probe);
    const c = getComputedStyle(probe).color;
    probe.remove();
    return c;
  });
  expect(kant.farg).toBe(strongToken);

  const resultat = await new AxeBuilder({ page }).withTags(WCAG_TAGGAR).analyze();
  expect(resultat.violations).toEqual([]);

  await expect(page).toHaveScreenshot('maillogg-kontrast.png', { fullPage: true });
});
