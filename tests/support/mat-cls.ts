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
 * 2026-08-26) — MÄTT där det går, INDIKERAD (inte bevisad end-to-end) där
 * CI:s exakta race inte gått att reproducera lokalt. Se "KÄND GRÄNS" nedan
 * för den ärliga gränsen mellan de två.
 *
 * Ursprungsdiagnosen (PR #1702, jobb `96775581049`, kommentaren i
 * `app-update-banner.test.ts` innan denna extraktion) fastslog redan att
 * KÄLLAN till förskjutningen aldrig är notiskortet självt — `entry.sources[]`
 * pekade uteslutande på `/dev/primitives`-demosidans EGNA
 * `<h2 class="text-xl">`-rubriker, som byter typsnitt (fallback → Inter)
 * NÄR Google Fonts-svaret (`@import` i `src/styles/base.css`) hinner fram.
 * Fixen då: vänta in `document.fonts.ready` innan observatören startas.
 *
 * Den fixen var NÖDVÄNDIG men inte TILLRÄCKLIG — bevisat (mätt, inte
 * gissat) av att BÅDA testfilerna (båda med `document.fonts.ready`-väntan
 * redan på plats) ändå föll igen, bit-identiskt, i flera oberoende
 * `merge_group`-körningar (`32935931123` för #2000, `32936468038` för
 * #1992, plus `32636138454` för #1857 — `offline-notis.test.ts:207`, samma
 * klass). Mätt lokalt (TASK-307, `zzz-task307-diag.test.ts`, körning mot
 * dev-servern på `/dev/primitives`) VARFÖR den existerande väntan inte
 * räcker: Vite DEV-läge levererar `base.css` INTE som en
 * `<link rel="stylesheet">` i den initiala HTML:en utan injicerar den som
 * ett JS-genererat `<style>`-element (`styleDelivery.linkTags: []`,
 * `styleTagsWithImport: 1`) — och nätverksanropet till
 * `fonts.googleapis.com` visade sig starta på EXAKT samma millisekund som
 * webbläsarens `domcontentloaded`-event (`1120 ms` i den lokala mätningen,
 * request och event i samma logg-rad). Denna TIDSLINJE är genuint mätt.
 *
 * Att en sen upptäckt av ett `@import`-typsnitt kan få
 * `document.fonts.ready` att fullgöras FÖR TIDIGT är en dokumenterad,
 * återkommande KLASS av bugg över flera motorer — inte spekulation, men
 * läs källorna noga för vad var och en FAKTISKT visar:
 *
 * - `w3c/csswg-drafts#1082`, "document.fonts.ready promise resolution
 *   time does not match implementations" (foolip, 2017-03-07,
 *   https://github.com/w3c/csswg-drafts/issues/1082): *"the promise can
 *   resolve before anything else interesting happens"* — rapportören
 *   reproducerade detta i BÅDE Chrome, Firefox och Safari (en megabyte
 *   extra innehåll för att fördröja typsnittsladdningen fick `ready` att
 *   lösa ut FÖRE fördröjningen, i alla tre). Detta är den mest direkt
 *   tillämpliga källan för DENNA klass, som kör Chromium via
 *   `devices['Desktop Chrome']` — den enda av källorna som explicit
 *   inkluderar Chrome.
 * - WebKit Bugzilla `#174030`, "document.fonts.ready is resolved too
 *   quickly" (Dima Voytenko,
 *   https://bugs.webkit.org/show_bug.cgi?id=174030): *"The promise
 *   document.fonts.ready is resolved immediately even before any of the
 *   initially used fonts have been resolved."* RESOLVED FIXED 2019-08
 *   (Youenn Fablet, väntade in första layouten) — uppföljande kommentarer
 *   visade fixen ofullständig (specen kräver vänta in HELA
 *   dokumentladdningen, inte bara första layouten). Uppföljare: WebKit
 *   `#225790`, "document.fonts.ready is sometimes still resolved too
 *   quickly" (https://bugs.webkit.org/show_bug.cgi?id=225790).
 * - BÅDA WebKit-buggarna är Safari/WebKit-SPECIFIKA, inte Chromium. De
 *   citeras här som belägg för att KLASSEN av race (för tidig `ready`
 *   relativt sent upptäckta typsnitt) är verklig och återkommande över
 *   flera motorer — inte som bevis för en aktuell Chromium-bugg. Det
 *   senare styrks i stället, cross-engine inklusive Chrome, av #1082 ovan.
 *
 * (Tidigare version av denna kommentar citerade Mozilla bug 1162850 och
 * W3C csswg-drafts #13538. Fel källor, rättade efter granskning (review
 * på PR #2009): 1162850 är Gecko-specifik, RESOLVED FIXED redan i Firefox
 * 41, och beskriver att `fonts.ready` ALDRIG uppfylls — hänger — för en
 * sent tillkommen stilmall, motsatt riktning mot vårt problem (FÖR TIDIG
 * resolution). `#13538` är samma motsatta riktning: ett mejllista-inlägg
 * om att `ready`-löftet aldrig uppfylls för en TOM `FontFaceSet`. Ingen av
 * de två stödjer påståendet de tidigare citerades för.)
 *
 * Är `@import`-typsnittet inte redan känt av `FontFaceSet` i det ögonblick
 * `document.fonts.ready` avläses KAN — indikerat av källorna ovan, INTE
 * bevisat i just detta fall (se "KÄND GRÄNS") — löftet fullgöras FÖRE
 * typsnittsbytet, och det sena, omätta bytet ger den observerade,
 * per-viewport DETERMINISTISKA (samma flyttal varje gång racet slår till:
 * `0.002406863042591828` vid 390 px, `~0.0064xx` vid 1280 px) men
 * TIDSMÄSSIGT flaky förskjutningen.
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
 * mot `"loading"` utan den väntan.
 *
 * `networkidle` ÄR DOKUMENTERAT AVRÅTT av Playwright för test-readiness,
 * ordagrant: *"'networkidle' - DISCOURAGED consider operation to be
 * finished when there are no network connections for at least 500 ms.
 * Don't use this method for testing, rely on web assertions to assess
 * readiness instead."* (playwright.dev/docs/api/class-page,
 * `waitForLoadState`). Avrådan gäller GENERELL test-readiness (t.ex. "är
 * sidan redo att interageras med?"), där bakgrundstrafik (analytics,
 * polling, öppna websockets) kan hindra `networkidle` från att någonsin
 * slå in. Här används den till något SMALARE: mätFÖRBEREDELSE i en klass
 * som (`CONTRIBUTING.md` § Webbläsarbeteende-klassen) MEDVETET INTE
 * pinnar Google Fonts (till skillnad från
 * `tests/support/fixturvarld/hermetic.ts`s pinnade Inter v20 för
 * visual/acceptance) och som saknar bakgrundstrafik att vänta ut — mätt:
 * samtliga diagnostik-körningar med `networkidle` löstes ut på 4,5–6,2 s,
 * långt under 30 s-timeouten, trots Vite HMR:s öppna websocket.
 * Alternativet `document.fonts.load()` avvisades: enligt CSS Font Loading
 * Module Level 3s egen algoritm för `FontFaceSet.load()`
 * (https://www.w3.org/TR/css-font-loading-3/#font-face-set-load) matchas
 * anropet mot REDAN KÄNDA `@font-face`-regler — hittas ingen matchande
 * regel (exakt vårt race: importen inte upptäckt än) fullgörs löftet
 * OMEDELBART med en TOM lista, utan fel. Ett sådant anrop hade alltså
 * kunnat bli en TYST NO-OP i precis den situation vi vill skydda mot, i
 * stället för att faktiskt vänta.
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
 * Fixens grund är alltså INDIKERAD, inte bevisad end-to-end: (a) den
 * uppmätta race-FÖRUTSÄTTNINGEN är genuint mätt (request och
 * `domcontentloaded` på samma millisekund), (b) den dokumenterade
 * bug-KLASSEN ovan är verklig och cross-engine — inklusive Chrome, #1082
 * — men inte en direkt observation av en Chromium-bugg just nu, och (c)
 * att `networkidle` lokalt bevisligen stänger racets fönster mot en
 * ARTIFICIELL fördröjning är mätt. (a)+(b)+(c) tillsammans är ett starkt
 * indicium, inte en direkt lokal reproduktion av själva CI-fällningen.
 *
 * ESKALERING OM SYMPTOMET ÅTERKOMMER EN TREDJE GÅNG: nästa steg är att
 * PINNA Google Fonts (samma mönster som visual/acceptance-klassernas
 * `tests/support/fixturvarld/hermetic.ts`, Inter v20) ENBART för denna
 * mät-helper — inte för hela `webblasarbeteende`-klassen, som medvetet
 * kör mot RIKTIGA typsnitt/nätverk (se filhuvudena i
 * `app-update-banner.test.ts`/`offline-notis.test.ts`). En pinnad font
 * eliminerar racet strukturellt (inget nätverksberoende typsnittsbyte kvar
 * att mäta in) på bekostnad av att just denna mätning slutar pröva mot
 * verkliga Google Fonts-förhållanden. Bokfört i `TASK-307`s kort-notes.
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
