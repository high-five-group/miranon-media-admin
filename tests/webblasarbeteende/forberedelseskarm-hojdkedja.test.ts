import { expect, test } from '@playwright/test';

/**
 * Förberedelseskärmens HÖJDKEDJA (TASK-266) — DATALÖSA beteendetester
 * (ADR-094): ren layout, noll nätverksanrop.
 *
 * ═══ VAD SOM GICK SÖNDER ═══
 *
 * `Forberedelseskarm.tsx` bär MEDVETET `h-full min-h-full` (fyller SIN
 * FÖRÄLDER) i stället för login.tsx:s `min-h-dvh` — se komponentens doc-block
 * § LAYOUTANKARET: dev-showcasen (`/dev/primitives`) ramar in varje instans i
 * `h-72 overflow-hidden` för att visa tre förloppslägen sida vid sida, och
 * `min-h-dvh` i komponenten hade brutit ut ur den inramningen.
 *
 * Följden är ett KRAV PÅ ANROPAREN: `h-full` fyller sin förälder, alltså
 * måste föräldern ha en höjd. Kravet stod formulerat i dev-showcasen
 * ("anroparen sätter höjden") men var aldrig uppfyllt på någon av de två
 * PRODUKTIONS-anroparna — de renderade komponenten naken direkt under
 * `#root`. Eftersom `base.css` inte sätter höjd på html/body och `#root`
 * saknar CSS-regel kollapsade hela kedjan: uppmätt 1280×720 blev
 * html/body/#root/container ALLA 219 px, och `justify-center` centrerade
 * följaktligen i den kollapsade topplådan (logons mitt y=69 i stället för
 * 360). Marcus live-observation: "logo+loadingbar ocentrerade".
 *
 * ═══ MÄTMETODEN — POLLING VIA CONSOLE, INSAMLAD UTANFÖR SIDAN ═══
 *
 * Förberedelseskärmen är TRANSIENT i login-monteringen: `main.tsx`s gate
 * startar i `{typ:'vantar'}` (dess `useState`-initialvärde) och byts till
 * `'redo'` så fort auth-effekten löper. Fönstret är därför någon enstaka
 * frame.
 *
 * Grundformen är TASK-261-diagnosens: mät INUTI sidan, rapportera via
 * `console.log`, samla in UTANFÖR sidkontexten via `page.on('console')`. En
 * `window`-latch eller ett värde i `sessionStorage` läses tillbaka först
 * efter att skärmen försvunnit och ger FALSKT GRÖNT.
 *
 * TVÅ SKÄRPNINGAR mot 261:s `setInterval`, båda mätta fram här och inte
 * antagna (se kommentarerna vid respektive mekanism):
 *
 * 1. **MutationObserver, inte enbart en timer.** Mot en VARM dev-server
 *    fångade en `setInterval(4 ms)` noll prov — gate-bytet sker i en passiv
 *    effekt och ingen timer-callback hinner köra i gapet. Observern körs som
 *    mikrotask direkt efter Reacts commit och kan inte missa insättningen.
 * 2. **Insamlingen väntas in med `expect.poll`.** Console-leveransen går över
 *    CDP och är inte synkroniserad med sidans väntningar: en direkt avläsning
 *    fångade noll prov under 8 parallella workers, men 10/10 när filen kördes
 *    ensam.
 *
 * Testet fäller uttryckligen om INGEN mätning fångades — ett missat fönster
 * blir rött, aldrig tyst grönt. Motbevisat skarpt: med höjdkällan borttagen
 * fäller det på `Expected: 720, Received: 219`, alltså på buggens egna tal.
 */

/** En mätpunkt tagen medan Förberedelseskärmen är monterad. */
interface Hojdmatning {
  viewport: number;
  root: number | null;
  container: number | null;
  containerMitt: number | null;
  /** Kompositionsblockets (max-w-md) mitt — TASK-242:s layoutankare. */
  blockMitt: number | null;
}

const PROV_PREFIX = 'T266|';

/**
 * Installerar pollingen och returnerar arrayen som fylls på utanför
 * sidkontexten. Måste anropas FÖRE `page.goto`.
 */
async function samlaHojdmatningar(page: import('@playwright/test').Page): Promise<Hojdmatning[]> {
  const prov: Hojdmatning[] = [];

  page.on('console', (msg) => {
    const text = msg.text();
    if (!text.startsWith(PROV_PREFIX)) return;
    prov.push(JSON.parse(text.slice(PROV_PREFIX.length)) as Hojdmatning);
  });

  // Ett kastande init-skript ger noll prov och ser ut som ett missat fönster
  // — surfacea felet i stället för att felsöka symptomet.
  page.on('pageerror', (fel) => {
    console.error(`[T266] sidfel: ${fel.message}`);
  });

  await page.addInitScript(() => {
    // MutationObserver, INTE bara en timer. Fönstret är inte tillförlitligt
    // observerbart med polling: `gate`-bytet sker i en `useEffect` (passiv
    // effekt) och på en VARM dev-server hinner ingen timer-callback köra i
    // gapet — mätt, en `setInterval(4 ms)` fångade noll prov där, medan
    // samma polling fångade skärmen varje gång mot en KALL server (där
    // modulkompileringen råkade vidga fönstret). Observern körs däremot som
    // en mikrotask direkt efter att React committat noden, alltså FÖRE den
    // passiva effekten hinner byta gate — den kan inte missa insättningen.
    // `getBoundingClientRect()` tvingar synkron layout, så måtten är
    // giltiga redan i den mikrotasken.
    //
    // rAF-loopen nedan kompletterar med prov från varje målad frame skärmen
    // lever. Testet bedömer det SISTA provet (mest utsatta läget), men
    // kräver bara att MINST ett fångades — uteblivna prov ger rött, aldrig
    // tyst grönt.
    const matPunkt = () => {
      // Ankaret var `img[alt="Miranon Media"]` (logotypen) fram till
      // task-273.6 — den togs bort ur den renderade ytan
      // (Forberedelseskarm.tsx § BAKGRUNDSBILDEN). `data-testid` är nu det
      // stabila ankaret: container > block(`forberedelseskarm-block`,
      // max-w-xs). Samma två-nivås uppmätning som förut, bara annat urval.
      const block = document.querySelector('[data-testid="forberedelseskarm-block"]');
      if (!block) return false;
      const container = block.parentElement ?? null;
      const root = document.getElementById('root');
      const contRect = container?.getBoundingClientRect();
      const blockRect = block?.getBoundingClientRect();

      console.log(
        `T266|${JSON.stringify({
          viewport: window.innerHeight,
          root: root ? root.offsetHeight : null,
          container: container ? container.offsetHeight : null,
          containerMitt: contRect ? contRect.top + contRect.height / 2 : null,
          blockMitt: blockRect ? blockRect.top + blockRect.height / 2 : null,
        })}`,
      );
      return true;
    };

    const start = performance.now();
    const frame = () => {
      matPunkt();
      if (performance.now() - start < 15000) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);

    // Observera `document`, INTE `document.documentElement`: init-skriptet
    // körs vid document-start, då rot-elementet kan vara null — ett
    // `observe(null)` kastar och hade tystat hela skriptet (inklusive
    // rAF-loopen ovan, om den registrerats efteråt).
    new MutationObserver(() => {
      matPunkt();
    }).observe(document, { childList: true, subtree: true });
  });

  return prov;
}

test.describe('Förberedelseskärmens höjdkedja (TASK-266)', () => {
  test('login-monteringen: containern fyller viewporten och kompositionen centreras i den', async ({
    page,
  }) => {
    const prov = await samlaHojdmatningar(page);

    await page.goto('/login', { waitUntil: 'commit' });
    // Login-formuläret är beviset att gate-fönstret passerats — all polling
    // som skulle hinna ske har skett när denna väntan löst ut.
    await expect(page.getByRole('button', { name: 'Logga in', exact: true })).toBeVisible();

    // VÄNTA IN INSAMLINGEN, läs den inte direkt. `page.on('console')`
    // levereras över CDP och är INTE synkroniserad med sidans egna
    // väntningar: mätt fångade en direkt `expect(prov.length)` noll prov när
    // sviten kördes med 8 parallella workers (men 10/10 när filen kördes
    // ensam) — proven fanns, de hade bara inte hunnit fram. Det är ett race i
    // KANALEN, inte i mätningen, och `expect.poll` är rätt kur.
    await expect
      .poll(() => prov.length, {
        message: 'ingen mätning fångades — Förberedelseskärmen hittades aldrig under gate-fönstret',
        timeout: 10000,
      })
      .toBeGreaterThan(0);

    // Sista provet = skärmens mest settlade läge innan gaten öppnar.
    const m = prov[prov.length - 1];
    const viewport = m.viewport;

    // KÄRNAN: höjdkedjan får inte kollapsa. Före fixen var dessa 219 mot 720.
    expect(m.root, '#root ska bära viewportens höjd').toBe(viewport);
    expect(m.container, 'Förberedelseskärmens container ska fylla viewporten').toBe(viewport);

    // Följden: centreringen sker i viewporten, inte i en kollapsad topplåda.
    expect(m.containerMitt).toBeCloseTo(viewport / 2, 0);
    expect(
      m.blockMitt,
      'kompositionsblocket (TASK-242:s layoutankare) ska ligga i viewportens mitt',
    ).toBeCloseTo(viewport / 2, 0);
  });

  test('dev-showcasen: komponenten fyller sin INRAMNING, inte viewporten', async ({ page }) => {
    // Vaktar den andra riktningen: flyttas höjdkällan in i komponenten
    // (`min-h-dvh` på dess rot) bryter den ut ur `h-72 overflow-hidden` och
    // dev-showcasens tre förloppslägen går inte längre att jämföra sida vid
    // sida. Det är exakt skälet till att höjden bor hos ANROPAREN.
    await page.goto('/dev/primitives');

    const inramning = page.getByTestId('forberedelseskarm-0');
    await expect(inramning).toBeVisible();

    const hojder = await inramning.evaluate((ram) => {
      // Se kommentaren i samlaHojdmatningar() ovan — samma testid-ankare
      // sedan task-273.6, ersätter det borttagna `img[alt="Miranon Media"]`.
      const container = ram.querySelector('[data-testid="forberedelseskarm-block"]')?.parentElement;
      return {
        ram: ram.getBoundingClientRect().height,
        // Inramningen bär `border`, så komponenten fyller dess INNEHÅLLSBOX
        // (clientHeight), inte dess yttermått — 286 px, inte 288.
        ramInnehall: ram.clientHeight,
        container: container ? container.getBoundingClientRect().height : null,
        viewport: window.innerHeight,
      };
    });

    // h-72 = 18rem = 288 px vid rot-fontstorlek 16 px; minus 1 px ram per sida.
    expect(hojder.ram).toBe(288);
    expect(hojder.container, 'komponenten ska fylla inramningens innehållsbox').toBe(
      hojder.ramInnehall,
    );
    expect(hojder.container).not.toBe(hojder.viewport);
  });
});
