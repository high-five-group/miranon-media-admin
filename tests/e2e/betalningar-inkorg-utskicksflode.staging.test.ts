import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, type Route, test } from '../support/test-bas';
import { mockValjarLista, valjarRad } from './helpers/valjar-lista';

/**
 * TASK-362 — Betalningsinkorgens utskicksflöde är RENT: raden vilar när
 * kvittot är skickat, bekräftelsen är stängbar och nollställs vid nästa
 * handling, EN statusyta med reserverad höjd genom köat→klart.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VARFÖR STAGING-E2E OCH INTE ACCEPTANCE-KLASSEN
 * ═══════════════════════════════════════════════════════════════════════════
 * Samma skäl som `persondetalj-betalningar-fellage.staging.test.ts` (dess
 * eget filhuvud, läst FÖRE denna fil skrevs) redan bokför:
 * `VITE_FEATURE_BETALNINGAR` är explicit `'av'` för HELA den delade
 * acceptance/visual/webblasarbeteende/manifest-screenshots-fixturvärlden
 * (`playwright.config.ts`, kommentaren vid `VITE_FEATURE_BETALNINGAR: 'av'`)
 * — att slå på den DÄR utan att samtidigt mocka `JobbLyssnare`s Supabase
 * Realtime-kanal fäller VARJE autentiserad test i den delade klassen
 * (mätt 48/48, samma kommentar). Att flippa den delade flaggan för en enda
 * skiva är en bred, riskfylld ändring TASK-346.7 AC #6 äger — inte detta UI-
 * polerings-kort. Staging bär redan `VITE_FEATURE_BETALNINGAR=pa`
 * (`.env.staging`), och `chromium-authenticated` kör mot verklig staging med
 * en verklig inloggad session. Sviten följer `atgarder-kvitto.staging.
 * test.ts`s och `persondetalj-betalningar-fellage.staging.test.ts`s
 * ETABLERADE mönster: deterministisk via `page.route`, ALDRIG
 * `network.use()` — ingen delad staging-data rörs, `get-events`/
 * `hamta-oppna-betalningar`/`registrera-inbetalning`/`koa-kvitton`/
 * `hamta-jobbstatus` mockas alla lokalt per test.
 *
 * DIVERGENS FRÅN UPPDRAGET, ÖPPET BOKFÖRD (ADR-086): uppdraget bad om ett
 * "acceptance-test" för denna vy. Repots Acceptance-klass (hermetisk MSW-
 * fixturvärld) kan STRUKTURELLT INTE rendera `/mer/betalningar` i dag — se
 * skälet ovan, verifierat mot `playwright.config.ts` innan denna fil
 * skrevs. Denna svit bevisar samma tre AC-punkter, i den klass repots egna
 * betalningsdomän-tester redan använder för exakt detta strukturella hinder.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VAD SVITEN BEVISAR, OCH VAD DEN MEDVETET INTE GÖR
 * ═══════════════════════════════════════════════════════════════════════════
 * BEVISAS:
 *   A. Granskningsblockets ton (bakgrundsfärg) växlar från AKTIV
 *      (`--mm-primary-tint`, guld) till VILA (`--mm-bg-muted`, neutral) när
 *      jobbraden går från köad till `skickat` — mätt med
 *      `getComputedStyle(...).backgroundColor`, inte klassnamn (samma
 *      teknik som `dokument-lista-hojdlas.acceptance.test.ts` § "kortet bär
 *      INGEN hover-ton").
 *   B. Statusytans höjd (`getBoundingClientRect().height` på
 *      `<section aria-label="Registrerat nu">`) är IDENTISK i det köade
 *      läget (knappen "Skicka 1 kvitto" synlig) och i det klara läget
 *      (bekräftelserad + kryss synlig) — AC #3:s kärnpåstående, mätt
 *      direkt, inte antaget.
 *   C. Bekräftelsen kan stängas med kryss OCH nollställs automatiskt av
 *      NÄSTA registrering, utan manuellt klick.
 *
 * MEDVETET UTANFÖR DENNA SVITS RÄCKVIDD, bokfört i stället för dolt:
 * en LIVE `köat → pågår → skickat`-övergång inom EN sidladdning. Skälet är
 * strukturellt: `useJobbstatus` pollar ALDRIG (`refetchOnMount: 'always'`
 * plus Postgres Realtime-push, `useJobbstatus.ts` § filhuvud) — utan en
 * verklig databasändring finns ingen andra, senare fetch att skilja från
 * den första. Att fejka det hade krävt att man fångar den riktiga Supabase
 * Realtime-websocketen (`page.routeWebSocket`) och konstruerar ett giltigt
 * Postgres Changes-meddelande för hand — en helt egen, spekulativ
 * mekanism för en händelse som i verkligheten varar millisekunder för EN
 * mottagare. I stället bevisas `pagar`-radens tillhörighet till SAMMA
 * `min-h-10`-slot STRUKTURELLT: `BetalningsInkorg.tsx`s kompakta statusrad
 * (`role="status"`, inte `MessageBox`) renderas för VARJE `utfall.intent
 * !== 'warning'`, och `inkorg-harledningar.ts`s `jobbDelutfall` ger `pagar`
 * samma `intent: 'info'` som `vantar` — läsbart direkt ur källan, ingen
 * separat DOM-mätning behövs för att veta att den delar formen. Se
 * `tests/api/betalningar-inkorg-statusyta-form.test.ts` för den
 * källkodsnivå-grinden.
 */

const HAMTA_OPPNA_BETALNINGAR = '**/functions/v1/hamta-oppna-betalningar*';
const REGISTRERA_INBETALNING = '**/functions/v1/registrera-inbetalning';
const KOA_KVITTON = '**/functions/v1/koa-kvitton';
const HAMTA_JOBBSTATUS = '**/functions/v1/hamta-jobbstatus*';

const EVENT_ID = 'recTASK362EVENT1';
const ANMALAN_ID = 'recTASK362ANMALN';
const ANMALAN_ID_2 = 'recTASK362ANMALN2';
const INBETALNING_ID = 'a1b2c3d4-0001-4001-8001-000000000001';
const INBETALNING_ID_2 = 'a1b2c3d4-0004-4004-8004-000000000004';
const JOBB_ID = 'a1b2c3d4-0002-4002-8002-000000000002';

/** Guld/varning-tonen — `--mm-primary-tint` = `--p-gold-100` = `#fbf3e0`
    (`src/styles/tokens/primitives.css` rad 158, `semantic.css` rad 5). */
const TON_AKTIV = 'rgb(251, 243, 224)';
/** Vila-tonen — `--mm-bg-muted` = `--p-neutral-50` = `#f5f5f3`
    (`primitives.css` rad 176, `semantic.css` rad 23) — SAMMA konvention som
    `PersonDetail.tsx`s `kortKlass` redan bär för sitt "Just nu"-block. */
const TON_VILA = 'rgb(245, 245, 243)';

type Json = Record<string, unknown>;

function oppenBetalning(overrides: Json = {}): Json {
  return {
    anmalanRecordId: ANMALAN_ID,
    personNamn: 'Task362 Testsson',
    personEpost: null,
    personTelefon: null,
    eventId: EVENT_ID,
    eventNamn: 'Task362-kurs',
    eventStartdatum: '2099-06-01',
    eventTyp: 'Utbildning',
    anmalanStatus: 'Bekräftad (mail skickat)',
    saknas: 500,
    gallandePris: 500,
    anmalningsavgift: null,
    summaInbetalt: 0,
    summaInbetaltSpegel: 0,
    spegelIFas: true,
    deadlineSlutbetalning: null,
    kvittonAttSkicka: 0,
    ...overrides,
  };
}

/** Anmälan → (inbetalningsId, namn) — `registrera-inbetalning`-mocken slår
    upp rätt svar ur DENNA tabell i stället för att alltid svara samma
    rad, så flera rader i samma test kan registreras var för sig
    (behövs av tredje testet, "nollställs av nästa registrering"). */
const ANMALAN_TILL_SVAR: Record<string, { inbetalningId: string; namn: string }> = {
  [ANMALAN_ID]: { inbetalningId: INBETALNING_ID, namn: 'Task362 Testsson' },
  [ANMALAN_ID_2]: { inbetalningId: INBETALNING_ID_2, namn: 'Task362 Andrasson' },
};

/**
 * Mockar precis den yta `/mer/betalningar` faktiskt läser: eventväljaren,
 * listan, registreringen, kvittokön och jobbstatus. `hamta-jobbstatus`
 * besvaras `jobb: null` tills `koa-kvitton` satt ett jobbId (se
 * `jobbstatusSvar`s `let`) — matchar `useJobbstatus`s EGET villkor
 * (`aktiv: jobbId !== undefined`, `BetalningsInkorg.tsx` rad 445): innan en
 * sändning finns inget `hamta-jobbstatus`-anrop alls att mocka fel svar på.
 *
 * `rows` DEFAULTAR TILL EN RAD (`ANMALAN_ID`). Tredje testet ger TVÅ rader
 * — annars blir `getByRole('button', { name: 'Registrera betalning' })`
 * tvetydig (Playwrights strict mode) så fort en andra registrering ska
 * ske i samma test.
 */
async function mocka(page: Page, rows: Json[] = [oppenBetalning()]): Promise<void> {
  await mockValjarLista(page, [
    valjarRad({ id: EVENT_ID, namn: 'Task362-kurs', startdatum: '2099-06-01' }),
  ]);

  await page.route(HAMTA_OPPNA_BETALNINGAR, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ betalningar: rows, forfallna: 0 }),
    });
  });

  await page.route(REGISTRERA_INBETALNING, async (route: Route) => {
    const nu = new Date().toISOString();
    const body = route.request().postDataJSON() as { anmalanRecordId: string };
    const svar = ANMALAN_TILL_SVAR[body.anmalanRecordId];
    if (!svar) {
      await route.fulfill({
        status: 400,
        body: `okänd anmalanRecordId i testfixturen: ${body.anmalanRecordId}`,
      });
      return;
    }
    // KVARSTÅENDE RAD I "LISTAN" EFTER REGISTRERINGEN, MED AVSIKT:
    // `saknas: 0` gör raden KLAR (`InkorgsRad.klar`), men `rows` rörs
    // aldrig här — samma klient-patch (`skrivHarledningTillOppna`) som
    // skarpa flödet redan gör, ur SERVERNS `harledning`. Testerna mäter
    // granskningsblockets EGEN yta, inte "listan"s tomläge.
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        inbetalning: {
          id: svar.inbetalningId,
          anmalanRecordId: body.anmalanRecordId,
          ogonblicksbildNamn: svar.namn,
          ogonblicksbildEvent: 'Task362-kurs',
          ogonblicksbildEventdatum: '2099-06-01',
          belopp: 500,
          betalsatt: 'Swish',
          betalningsdatum: nu.slice(0, 10),
          typ: 'inbetalning',
          status: 'aktiv',
          makuleradSkal: null,
          makuleradNar: null,
          bankreferens: null,
          kvittoId: null,
          notering: null,
          skapadAv: 'staging-user@miranon.test',
          skapadNar: nu,
        },
        harledning: {
          summa: 500,
          gallandePris: 500,
          saknas: 0,
          avgiftKlar: true,
          alltKlart: true,
          arForelasning: false,
        },
        spegel: { skrivet: true, forsok: 1, skal: null },
      }),
    });
  });

  /** `null` tills `koa-kvitton` satt ett jobbId (se `mocka`s docblock). */
  let jobbstatusSvar: Json = {
    jobb: null,
    rader: [],
    sammanfattning: { totalt: 0, skickade: 0, fel: 0, kvar: 0 },
  };

  await page.route(KOA_KVITTON, async (route: Route) => {
    const nu = new Date().toISOString();
    const body = route.request().postDataJSON() as { inbetalningIds: string[] };
    // JOBBET ÄR "SKICKAT" DIREKT I MOCKEN — se filhuvudets § "MEDVETET
    // UTANFÖR" för varför en transient `pagar`-fas inte simuleras här.
    jobbstatusSvar = {
      jobb: {
        id: JOBB_ID,
        jobbtyp: 'kvitto',
        status: 'avslutat',
        skapadAv: 'staging-user@miranon.test',
        skapadNar: nu,
        avslutadNar: nu,
      },
      rader: body.inbetalningIds.map((id, i) => ({
        id: `b1c2d3e4-0003-4003-8003-00000000000${i}`,
        jobbId: JOBB_ID,
        jobbtyp: 'kvitto',
        objektId: id,
        status: 'skickat',
        skal: null,
        forsok: 1,
        skapadNar: nu,
        paborjadNar: nu,
        avslutadNar: nu,
        uppdateradNar: nu,
        kvittonummer: 'MM-2026-1001',
      })),
      sammanfattning: {
        totalt: body.inbetalningIds.length,
        skickade: body.inbetalningIds.length,
        fel: 0,
        kvar: 0,
      },
    };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        jobbId: JOBB_ID,
        koade: body.inbetalningIds.length,
        hoppade: [],
        kickad: true,
      }),
    });
  });

  await page.route(HAMTA_JOBBSTATUS, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(jobbstatusSvar),
    });
  });
}

const REGION = 'Registrerat nu';

test.describe('TASK-362 — betalningsinkorgens utskicksflöde', () => {
  test('raden vilar (neutral ton) när kvittot är skickat; blocket är AKTIVT (guld) medan kön väntar', async ({
    page,
  }) => {
    await mocka(page);
    await page.goto('/mer/betalningar');

    await page.getByRole('button', { name: 'Registrera betalning' }).click();
    const formulär = page.getByRole('form', { name: /Registrera betalning för/ });
    await expect(formulär).toBeVisible();
    // "Skicka kvitto" är förkryssad (`RegistreraForm.tsx` rad 219) — ingen
    // egen interaktion behövs.
    await formulär.getByRole('button', { name: 'Registrera', exact: true }).click();

    const block = page.locator(`section[aria-label="${REGION}"]`);
    await expect(block).toBeVisible();
    // KÖAT: knappen "Skicka 1 kvitto" är blockets bevis för aktiv ton.
    await expect(block.getByRole('button', { name: 'Skicka 1 kvitto' })).toBeVisible();
    await expect(block).toHaveCSS('background-color', TON_AKTIV);

    await block.getByRole('button', { name: 'Skicka 1 kvitto' }).click();

    // KLART: raden säger "Kvitto skickat · MM-2026-1001", och blocket har
    // vilat till neutral ton.
    await expect(block.getByText('Kvitto skickat · MM-2026-1001')).toBeVisible();
    await expect(block).toHaveCSS('background-color', TON_VILA);

    // Makuleringsvägens sekundärtext syns fortfarande (ingen information
    // togs bort — den flyttade bara till vila-läget, TASK-362 AC #1).
    await expect(
      block.getByText(
        'Kvittot är på väg eller skickat. Ångra genom att makulera inbetalningen på anmälans betalningsrader.',
      ),
    ).toBeVisible();
  });

  test('EN statusyta, reserverad höjd — blockets höjd är IDENTISK köat och klart', async ({
    page,
  }) => {
    await mocka(page);
    await page.goto('/mer/betalningar');

    await page.getByRole('button', { name: 'Registrera betalning' }).click();
    await page
      .getByRole('form', { name: /Registrera betalning för/ })
      .getByRole('button', { name: 'Registrera', exact: true })
      .click();

    const block = page.locator(`section[aria-label="${REGION}"]`);
    await expect(block.getByRole('button', { name: 'Skicka 1 kvitto' })).toBeVisible();
    const kootHojd = await block.evaluate((el) => el.getBoundingClientRect().height);

    await block.getByRole('button', { name: 'Skicka 1 kvitto' }).click();
    await expect(block.getByText('Kvitto skickat · MM-2026-1001')).toBeVisible();
    const klarHojd = await block.evaluate((el) => el.getBoundingClientRect().height);

    // Toleransen är 0 — `min-h-10` gör slotten exakt lika hög i båda
    // lägena (Button.tsx `size.md: 'min-h-10'`), och radens EGEN
    // tillväxt (två reserverade rader från start) tillför inget extra.
    expect(klarHojd).toBe(kootHojd);
  });

  test('bekräftelsen (grön, "1 kvitto skickat") kan stängas med kryss OCH nollställs av nästa registrering', async ({
    page,
  }) => {
    // TVÅ RADER — annars blir "Registrera betalning" tvetydigt (Playwrights
    // strict mode) så fort en ANDRA registrering görs i samma test, se
    // `mocka`s docblock.
    await mocka(page, [
      oppenBetalning(),
      oppenBetalning({ anmalanRecordId: ANMALAN_ID_2, personNamn: 'Task362 Andrasson' }),
    ]);
    // HÖGRE VIEWPORT — PRE-EXISTENT, OFÖRÄNDRAT AV DENNA SKIVA. Vid
    // standardhöjden (720 px) hamnar formulärets "Skicka kvitto"-kryssruta
    // bakom den fasta bottennavigeringen (Hem/Event/Personer/Mer) när det
    // ANDRA formuläret öppnas under det redan skickade kvittots granskade
    // rad — mätt via en misslyckad körnings skärmdump
    // (`test-results/…/test-failed-1.png`, denna sviths första körning):
    // klicket landade på navigeringsfältets `pointer-events`, inte på
    // kryssrutan. Samma klass som en riktig, kort webbläsarruta skulle möta;
    // testet ger sig själv rum i stället för att låta en oberoende layout-
    // detalj fälla ett test som inte handlar om den.
    await page.setViewportSize({ width: 1280, height: 1400 });
    await page.goto('/mer/betalningar');

    const rad1 = page.getByRole('listitem').filter({ hasText: 'Task362 Testsson' });
    await rad1.getByRole('button', { name: 'Registrera betalning' }).click();
    await page
      .getByRole('form', { name: /Registrera betalning för/ })
      .getByRole('button', { name: 'Registrera', exact: true })
      .click();

    const block = page.locator(`section[aria-label="${REGION}"]`);
    await block.getByRole('button', { name: 'Skicka 1 kvitto' }).click();

    const bekraftelse = block.getByText('1 kvitto skickat');
    await expect(bekraftelse).toBeVisible();

    const kryss = block.getByRole('button', { name: 'Stäng bekräftelse' });
    await expect(kryss).toBeVisible();
    await kryss.click();
    await expect(bekraftelse).not.toBeVisible();

    // NÄSTA HANDLING (en ny registrering, på den ANDRA, tidigare orörda
    // raden) gör en ÅTERKOMMEN bekräftelse inaktuell — bevisar att
    // `vidRegistrerad` nollställer `bekraftelseSynlig` OVILLKORLIGT
    // (`BetalningsInkorg.tsx` § TASK-362 vid `vidRegistrerad`), inte bara
    // när ett nytt jobb faktiskt startar. Kvittot avmarkeras för denna andra
    // registrering — testet mäter bara att den GAMLA bekräftelsen inte
    // kommer tillbaka, inte ett nytt utskick.
    const rad2 = page.getByRole('listitem').filter({ hasText: 'Task362 Andrasson' });
    await rad2.getByRole('button', { name: 'Registrera betalning' }).click();
    const formulär2 = page.getByRole('form', { name: /Registrera betalning för/ });
    // TANGENTBORD, INTE PEKARE — mätt PRE-EXISTENT fälla, oberoende av
    // denna skivas ändringar: "rå RAC-Checkbox" (`RegistreraForm.tsx` rad
    // 885, kopierad ur `events/detail/Betalningar.tsx` § BetalKryss) ritar
    // en dekorativ ikon-`<span>` ovanpå den NATIVA `<input>`, och Playwrights
    // pekar-baserade `.click()`/`.uncheck()` fastnar båda på den (mätt:
    // "intercepts pointer events", första körningen av denna svit, samma
    // fel med och utan viewport-höjden ovan). Kryssrutan är en RIKTIG
    // `<input type="checkbox">` och fullt tangentbordsstyrd (samma tab-stopp
    // som Enter/Space redan använder på formulärets övriga fält) — `.focus()`
    // + `Space` är den ROBUSTA vägen förbi en pekar-specifik brist i en
    // annan komponent än den denna skiva rör.
    const kvittokryss = formulär2.getByRole('checkbox', { name: 'Skicka kvitto' });
    await kvittokryss.focus();
    await page.keyboard.press(' ');
    await expect(kvittokryss).not.toBeChecked();
    await formulär2.getByRole('button', { name: 'Registrera', exact: true }).click();

    await expect(bekraftelse).not.toBeVisible();
  });

  test('axe: 0 fel på granskningsblocket i BÅDA tillstånden — aktivt (köat) och vila (klart)', async ({
    page,
  }) => {
    await mocka(page);
    await page.goto('/mer/betalningar');

    await page.getByRole('button', { name: 'Registrera betalning' }).click();
    await page
      .getByRole('form', { name: /Registrera betalning för/ })
      .getByRole('button', { name: 'Registrera', exact: true })
      .click();

    const block = page.locator(`section[aria-label="${REGION}"]`);
    await expect(block.getByRole('button', { name: 'Skicka 1 kvitto' })).toBeVisible();

    // AKTIVT (köat): knappen, radens makuleringsplatshållare (dold via
    // `invisible`/`aria-hidden`, TASK-362) och rad-texten.
    const aktivtResultat = await new AxeBuilder({ page })
      .include(`section[aria-label="${REGION}"]`)
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(aktivtResultat.violations).toEqual([]);

    await block.getByRole('button', { name: 'Skicka 1 kvitto' }).click();
    await expect(block.getByText('Kvitto skickat · MM-2026-1001')).toBeVisible();

    // VILA (klart): den kompakta statusraden + dess kryss ("Stäng
    // bekräftelse") och den nu vila-tonade blockramen.
    const vilaResultat = await new AxeBuilder({ page })
      .include(`section[aria-label="${REGION}"]`)
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(vilaResultat.violations).toEqual([]);
  });
});
