import type { Page } from '@playwright/test';

/**
 * Mäter Cumulative Layout Shift (`PerformanceObserver`, `layout-shift`,
 * `hadRecentInput`-filtrerad — samma metod som web.dev/cls beskriver för
 * en `LayoutShift`-summa) på `/dev/primitives`-demosidan under en given
 * handling. Delad mellan `app-update-banner.test.ts` (TASK-285.1, AC #3)
 * och `offline-notis.test.ts` (TASK-285.6, AC #2) sedan `TASK-307`
 * (2026-08-26) — duplicerad `matCLS`-kod i båda filerna var själv en del
 * av rotorsaken: en fix landad i EN fils kopia (ursprungsdiagnosen nedan,
 * PR #1702) propagerade aldrig automatiskt till den andra.
 *
 * ROTORSAK TILL DEN ÅTERKOMMANDE CI-FÄLLNINGEN (`TASK-307`, S112 resume 1,
 * 2026-08-26), diagnostiserad och bevisad, inte gissad:
 *
 * Ursprungsdiagnosen (PR #1702, jobb `96775581049`, kommentaren i
 * `app-update-banner.test.ts` innan denna extraktion) fastslog redan att
 * KÄLLAN till förskjutningen aldrig är notiskortet självt — `entry.sources[]`
 * pekade uteslutande på `/dev/primitives`-demosidans EGNA
 * `<h2 class="text-xl">`-rubriker, som byter typsnitt (fallback → Inter)
 * NÄR Google Fonts-svaret (`@import` i `src/styles/base.css`) hinner fram.
 * Fixen då: vänta in `document.fonts.ready` innan observatören startas.
 *
 * Den fixen var NÖDVÄNDIG men inte TILLRÄCKLIG — bevisat av att BÅDA
 * testfilerna (båda med `document.fonts.ready`-väntan redan på plats)
 * ändå föll igen, bit-identiskt, i flera oberoende `merge_group`-körningar
 * (`32935931123` för #2000, `32936468038` för #1992, plus `32636138454`
 * för #1857 — `offline-notis.test.ts:207`, samma klass). Mätt lokalt
 * (TASK-307, `zzz-task307-diag.test.ts`, körning mot dev-servern på
 * `/dev/primitives`) VARFÖR: Vite DEV-läge levererar `base.css` INTE som
 * en `<link rel="stylesheet">` i den initiala HTML:en utan injicerar den
 * som ett JS-genererat `<style>`-element (`styleDelivery.linkTags: []`,
 * `styleTagsWithImport: 1`) — och nätverksanropet till
 * `fonts.googleapis.com` visade sig starta på EXAKT samma millisekund som
 * webbläsarens `domcontentloaded`-event (`1120 ms` i den lokala mätningen,
 * request och event i samma logg-rad). Det är precis förutsättningen för
 * en dokumenterad klass av FontFaceSet-race: webbläsarens CSS-loader-
 * observatör kan koppla bort VID `domcontentloaded` innan en stilmall som
 * upptäcks i samma ögonblick hinner registrera sina `@font-face`-regler
 * (Mozilla bug 1162850,
 * https://bugzilla.mozilla.org/show_bug.cgi?id=1162850: *"we remove a
 * FontFaceSet's nsICSSLoaderObserver right after we receive the
 * document's DOMContentLoaded event ... [så] document.fonts.ready
 * resolves prematurely"*; samma klass i W3C csswg-drafts #13538,
 * https://lists.w3.org/Archives/Public/public-css-archive/2026Feb/0738.html,
 * *"FontFaceSet.ready promise isn't resolved if no FontFaces are added"*).
 * Är importen inte redan känd av `FontFaceSet` i det ögonblicket kan
 * `document.fonts.ready` fullgöras FÖRE typsnittsbytet, och det sena,
 * omätta bytet ger exakt den observerade, per-viewport DETERMINISTISKA
 * (samma flyttal varje gång racet slår till: `0.002406863042591828` vid
 * 390 px, `~0.0064xx` vid 1280 px) men TIDSMÄSSIGT flaky förskjutningen.
 *
 * FIXEN väntar in NÄTVERKET i stället för att lita på FontFaceSet-API:ts
 * `ready`-semantik: `page.waitForLoadState('networkidle')` bryr sig inte
 * om VAD webbläsaren "vet" om typsnittet, bara om att inga nätverksanrop
 * längre pågår — den täcker därmed BÅDA hoppen i Google Fonts-kedjan
 * (CSS-svaret från `fonts.googleapis.com` OCH den efterföljande
 * `woff2`-hämtningen från `fonts.gstatic.com`) oavsett racets utfall.
 * `document.fonts.ready` behålls DÄREFTER som ett andra, i praktiken
 * kostnadsfritt skyddslager. Bevisat lokalt (samma diagnostik-fil, tre
 * körningar): med typsnitts-nätverket artificiellt fördröjt (1200 ms) via
 * `page.route` visar `document.fonts.status` redan `"loaded"` FÖRE
 * `document.fonts.ready`-anropet så fort `networkidle` väntats in först —
 * mot `"loading"` utan den väntan. `networkidle` hänger inte i denna app
 * trots Vite HMR:s öppna websocket (mätt: samtliga diagnostik-körningar
 * med `networkidle` löstes ut på 4,5–6,2 s, långt under 30 s-timeouten).
 *
 * INTE VALT: en tolerans-tröskel (`toBeLessThan(ε)`). Rotorsaken är en
 * FIXBAR mät-race, inte ett genuint, opåverkbart mätbrus — samma princip
 * ursprungsdiagnosen redan slog fast ("gör mätningen ärlig i stället för
 * att lätta på assertionen"). En tröskel hade dolt en framtida, RIKTIG
 * layoutförskjutning av notisen lika tyst som `toBeLessThan(0.1)` hade
 * gjort då.
 *
 * KÄND GRÄNS: den exakta CI-racen (Linux, kall nätverkscache) kunde INTE
 * 100-procentigt repliceras lokalt (macOS) trots artificiell nätverks-
 * fördröjning — se `TASK-307`s Final Summary för fullständig mätserie.
 * Beviset för fixen vilar därför på (a) den uppmätta race-FÖRUTSÄTTNINGEN
 * (request och `domcontentloaded` på samma millisekund), (b) den externa
 * bug-klass-bekräftelsen ovan, och (c) att `networkidle` lokalt bevisligen
 * stänger racets fönster — inte på en direkt lokal reproduktion av själva
 * CI-fällningen.
 */
export async function matCLS(
  page: Page,
  viewport: { width: number; height: number },
  utlosOchVantaSynlig: (page: Page) => Promise<void>,
): Promise<number> {
  await page.setViewportSize(viewport);
  await page.goto('/dev/primitives');
  // .first(): sidan bär flera h1-rubriker sedan TASK-285.3 (AppError-
  // fallbackens demo-sektion, facit-formen) — samma scopning som
  // testfilernas egna `oppnaAppen`.
  await page.getByRole('heading', { level: 1 }).first().waitFor();

  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);

  await page.evaluate(() => {
    (window as unknown as { __mmClsSum: number }).__mmClsSum = 0;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as unknown as Array<{
        value: number;
        hadRecentInput: boolean;
      }>) {
        if (!entry.hadRecentInput) {
          (window as unknown as { __mmClsSum: number }).__mmClsSum += entry.value;
        }
      }
    });
    observer.observe({ type: 'layout-shift', buffered: false } as PerformanceObserverInit);
  });

  await utlosOchVantaSynlig(page);

  return page.evaluate(() => (window as unknown as { __mmClsSum: number }).__mmClsSum);
}
