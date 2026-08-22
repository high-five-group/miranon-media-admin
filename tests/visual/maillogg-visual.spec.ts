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
