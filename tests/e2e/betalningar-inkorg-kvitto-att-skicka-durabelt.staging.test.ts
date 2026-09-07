import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, type Route, test } from '../support/test-bas';
import { mockValjarLista, valjarRad } from './helpers/valjar-lista';

/**
 * TASK-367 — "kvitto att skicka" härleds ur Postgres, inte flikens minne.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * FYNDET (S115 Del 2, 2026-09-03)
 * ═══════════════════════════════════════════════════════════════════════════
 * Marcus registrerade en inbetalning i prod, bytte flik, och raden var borta
 * ur betalningsinkorgen. Inkorgens serverfunktion listar bara anmälningar med
 * `Saknas (kr) > 0`; betalningen täckte hela priset, så raden föll ur
 * listan. Listan över väntande kvitton ("Skicka N kvitton") byggdes samtidigt
 * enbart av React-state (`vantande`, riven med fliken) — ingen mail gick,
 * men ingenting i appen visade det längre.
 *
 * DENNA SVIT BEVISAR ATT DET INTE LÄNGRE HÄNDER: en fullbetald anmälan med
 * en aktiv inbetalning som saknar kvitto och köad jobbrad SKA visas i den nya
 * "Kvitto att skicka"-sektionen (`hamta-oppna-betalningar/index.ts` §
 * "KVITTO ATT SKICKA", `OppenBetalning.oskickadeKvitton`) — helt oberoende av
 * om DENNA fliken registrerade betalningen.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VARFÖR EN FÄRSK SIDLADDNING ÄR SAMMA BEVIS SOM "BYTTE FLIK OCH LADDADE OM"
 * ═══════════════════════════════════════════════════════════════════════════
 * `registrerade`/`vantande` (`BetalningsInkorg.tsx`s React-state) är TOMMA
 * vid varje mount, oavsett om det beror på en `page.reload()` eller på att
 * sidan aldrig besökts i denna flik. Att mocka EF-svaret med en redan
 * "orphanad" rad (registrerad NÅGON ANNANSTANS, aldrig skickad) och sedan
 * ladda sidan är därför STRUKTURELLT samma test som "registrera, byt flik,
 * ladda om" — och billigare: ingen riktig Postgres-skrivning krävs för att
 * bevisa KLIENTENS härledning. Den explicita `page.reload()` i andra testet
 * finns för att namnge scenariot ordagrant, inte för att den tillför en
 * annan bevisbörda.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * TVÅSIDIGT — RÖTT MOT DEN GAMLA HÄRLEDNINGEN
 * ═══════════════════════════════════════════════════════════════════════════
 * Mot koden FÖRE denna skiva finns varken `section[aria-label="Kvitto att
 * skicka"]` eller `OppenBetalning.oskickadeKvitton` — mocken skulle ha
 * levererat ett fält den gamla klienten aldrig läser, och sektionens
 * `toBeVisible()`-assertion hade timeoutat rött. Kontrollerat: `git stash`
 * (repots eget "kör aldrig" — se `CLAUDE.md` § AFK-regeln) är inte vägen;
 * i stället kördes denna fil mot den FÖREGÅENDE commiten
 * (`git checkout HEAD -- <ändrade filer>`, körning, återställning) — se
 * PR-kroppens Verifiering-avsnitt för resultatet.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * MEDVETET UTANFÖR DENNA SVITS RÄCKVIDD
 * ═══════════════════════════════════════════════════════════════════════════
 * Hem-kortets räkning ("K kvitton att skicka") — `BetalningarKort`, den yta
 * PRD TASK-346 § Inkorgen beskriver, är RIVEN (Marcus dom 2026-09-01,
 * `Hem.tsx` § "4. FÖRFALLNA BETALNINGAR"). Det talet existerar därför inte
 * någonstans i appen i dag, oberoende av denna skiva — se PR-kroppens
 * Divergens-avsnitt.
 */

const HAMTA_OPPNA_BETALNINGAR = '**/functions/v1/hamta-oppna-betalningar*';
const KOA_KVITTON = '**/functions/v1/koa-kvitton';
const HAMTA_JOBBSTATUS = '**/functions/v1/hamta-jobbstatus*';
const REGISTRERA_INBETALNING = '**/functions/v1/registrera-inbetalning';

const EVENT_ID = 'recTASK367EVENT01';
const ANMALAN_ID = 'recTASK367ANMALN1';
const ANMALAN_ID_2 = 'recTASK367ANMALN2';
const INBETALNING_ID = 'a1b2c3d4-0367-4367-8367-000000000001';
const INBETALNING_ID_2 = 'a1b2c3d4-0367-4367-8367-000000000003';
const JOBB_ID = 'a1b2c3d4-0367-4367-8367-000000000002';

type Json = Record<string, unknown>;

/**
 * En anmälan som är FULLBETALD (`saknas: 0`) men bär ETT oskickat kvitto —
 * exakt fyndets scenario. `oskickadeKvitton` är fältet EF:en härleder ur
 * Postgres (`hamta-oppna-betalningar/index.ts` § "KVITTO ATT SKICKA");
 * `kvittonAttSkicka` (kö-talet, redan köat) är MEDVETET 0 — ingen har
 * tryckt "Skicka" än, det är precis vad testet bevisar.
 */
function fullbetaldMedOskickatKvitto(overrides: Json = {}): Json {
  return {
    anmalanRecordId: ANMALAN_ID,
    personNamn: 'Task367 Testsson',
    personEpost: null,
    personTelefon: null,
    eventId: EVENT_ID,
    eventNamn: 'Task367-kurs',
    eventStartdatum: '2099-06-01',
    eventTyp: 'Utbildning',
    anmalanStatus: 'Bekräftad (mail skickat)',
    saknas: 0,
    gallandePris: 500,
    anmalningsavgift: null,
    summaInbetalt: 500,
    summaInbetaltSpegel: 500,
    spegelIFas: true,
    deadlineSlutbetalning: null,
    kvittonAttSkicka: 0,
    oskickadeKvitton: [{ inbetalningId: INBETALNING_ID, belopp: 500 }],
    ...overrides,
  };
}

/**
 * [TASK-367 review runda 1, FYND 2] En ÖPPEN anmälan (`saknas > 0`) — den
 * ordinarie inkorgs-listans form, med "Registrera betalning" tillgänglig.
 * Används av de två registrerings-testerna nedan: de öppnar formuläret,
 * registrerar, och verifierar VAD SOM SKICKADES (`medKvitto`) — inte hur
 * raden ser ut EFTER, som `fullbetaldMedOskickatKvitto` (ovan) redan äger.
 */
function oppenAnmalanAttRegistrera(overrides: Json = {}): Json {
  return {
    anmalanRecordId: ANMALAN_ID_2,
    personNamn: 'Task367 Kryssrutsson',
    personEpost: null,
    personTelefon: null,
    eventId: EVENT_ID,
    eventNamn: 'Task367-kurs',
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
    oskickadeKvitton: [],
    ...overrides,
  };
}

/**
 * Mockar precis den yta `/mer/betalningar` läser för detta scenario:
 * eventväljaren, listan och kvittokön. `radLista` är en FUNKTION (inte en
 * array) så ett test kan byta ut svaret MELLAN sidladdningar utan att
 * registrera en ny route.
 */
async function mocka(page: Page, radLista: () => Json[]): Promise<{ koadeIds: string[] }> {
  await mockValjarLista(page, [
    valjarRad({ id: EVENT_ID, namn: 'Task367-kurs', startdatum: '2099-06-01' }),
  ]);

  await page.route(HAMTA_OPPNA_BETALNINGAR, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ betalningar: radLista(), forfallna: 0 }),
    });
  });

  const utfall = { koadeIds: [] as string[] };

  await page.route(KOA_KVITTON, async (route: Route) => {
    const body = route.request().postDataJSON() as { inbetalningIds: string[] };
    utfall.koadeIds = body.inbetalningIds;
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

  // `hamta-jobbstatus` anropas så fort `jobbId` sätts (efter `koa-kvitton`s
  // svar) — ett tomt-men-giltigt svar räcker, testet mäter INTE
  // sändningsutfallets rendering (det är `betalningar-inkorg-
  // utskicksflode.staging.test.ts`s räckvidd).
  await page.route(HAMTA_JOBBSTATUS, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        jobb: null,
        rader: [],
        sammanfattning: { totalt: 0, skickade: 0, fel: 0, kvar: 0 },
      }),
    });
  });

  return utfall;
}

test.describe('TASK-367 — kvitto att skicka härleds ur Postgres, inte flikens minne', () => {
  test('en anmälan utan denna flikens registrerings-historik syns i "Kvitto att skicka" — INTE i "Registrerat nu" — och "Skicka N kvitton" bygger sin lista ur samma härledning', async ({
    page,
  }) => {
    const utfall = await mocka(page, () => [fullbetaldMedOskickatKvitto()]);
    await page.goto('/mer/betalningar');

    // DEN GAMLA MEKANISMEN HAR INGENTING ATT VISA. `RegistreratNuBlock`s
    // underlag (`registrerade`) är session-state och tomt på en FÄRSK
    // sidladdning — blocket returnerar `null` (dess egen tidiga return).
    // Det ÄR precis symptomet TASK-367 fångar: en rad som bara fanns i
    // flikens minne existerar inte här.
    await expect(page.locator('section[aria-label="Registrerat nu"]')).toHaveCount(0);

    // DEN NYA, DURABLA SEKTIONEN VISAR RADEN. `getByRole('region', {name})`
    // — inte en `aria-label`-attributselektor — eftersom sektionen sedan
    // review-fynd 3 (runda 1) namnges via `aria-labelledby` mot sin synliga
    // `<h2>`, inte via `aria-label` direkt. Rollbaserad matchning läser den
    // BERÄKNADE tillgängliga namnet oavsett vilkendera formen som bär det.
    const block = page.getByRole('region', { name: 'Kvitto att skicka' });
    await expect(block).toBeVisible();
    await expect(block.getByText('Task367 Testsson')).toBeVisible();
    const knapp = block.getByRole('button', { name: 'Skicka 1 kvitto' });
    await expect(knapp).toBeVisible();

    // AxeBuilder `.include()` tar bara CSS-selektorer (ingen roll/namn-
    // matchning), därav `data-testid` i stället för `aria-label` som krok.
    const axeResultat = await new AxeBuilder({ page })
      .include('[data-testid="kvitto-att-skicka"]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(axeResultat.violations).toEqual([]);

    // "SKICKA N KVITTON" BYGGER SIN LISTA UR SAMMA HÄRLEDNING (kortets egen
    // beslutsgrund): knappen ska köa EXAKT den `inbetalningId` EF:en
    // levererade i `oskickadeKvitton`, aldrig en session-lokal gissning.
    await knapp.click();
    await expect.poll(() => utfall.koadeIds).toEqual([INBETALNING_ID]);
  });

  test('flikbyte/omladdning tappar aldrig raden', async ({ page }) => {
    await mocka(page, () => [fullbetaldMedOskickatKvitto()]);
    await page.goto('/mer/betalningar');
    await expect(page.getByRole('region', { name: 'Kvitto att skicka' })).toBeVisible();

    // OMLADDNING — fyndets ordagranna scenario (S115 Del 2): "bytte flik".
    // Sidan monteras om från noll: `registrerade`/`vantande` initieras tomma
    // igen (`useState<[]>([])`). Framgången är att sektionen ÄNDÅ finns
    // kvar, eftersom den läser EF:ens Postgres-svar, aldrig React-state.
    await page.reload();
    const block = page.getByRole('region', { name: 'Kvitto att skicka' });
    await expect(block).toBeVisible();
    await expect(block.getByText('Task367 Testsson')).toBeVisible();
    await expect(block.getByRole('button', { name: 'Skicka 1 kvitto' })).toBeVisible();
  });
});

test.describe('TASK-367 review runda 1, FYND 2 — "Skicka kvitto"-kryssrutan skickas till servern', () => {
  /**
   * TVÅSIDIGT BEVIS PÅ KLIENT-TRÅDNINGEN (server-uteslutningen bevisas skarpt
   * i `tests/api/hamta-oppna-betalningar-kvitto-avbojt.staging.test.ts`, mot
   * verklig staging-data). `RegistreraForm.tsx` skickade tidigare ALDRIG
   * `medKvitto` till `registrera-inbetalning` — fältet levde bara i
   * `props.onKlar({..., medKvitto, ...})`, alltså i UI-svaret. Dessa två
   * test fångar exakt DEN regressionen: de fångar POST-kroppen
   * `registrera-inbetalning` faktiskt tar emot, oavsett vad servern (mockad
   * här) sedan gör med den.
   *
   * Andra halvan av varje test — att en efterföljande sidladdning visar/
   * döljer raden i "Kvitto att skicka" — är en KONSEKVENS av `oskickadeKvitton`
   * (redan bevisad ovan), simulerad här genom att mocken svarar som den
   * RIKTIGA servern skulle: `kvitto_avbojt = true` ⇒ tomt array.
   */
  test('kryssrutan URTAGEN: medKvitto: false skickas, och raden syns INTE efter omladdning', async ({
    page,
  }) => {
    let radLista = [oppenAnmalanAttRegistrera()];
    let sistaMedKvitto: unknown;

    await mockValjarLista(page, [
      valjarRad({ id: EVENT_ID, namn: 'Task367-kurs', startdatum: '2099-06-01' }),
    ]);
    await page.route(HAMTA_OPPNA_BETALNINGAR, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ betalningar: radLista, forfallna: 0 }),
      });
    });
    await page.route(REGISTRERA_INBETALNING, async (route: Route) => {
      const body = route.request().postDataJSON() as { medKvitto: unknown };
      sistaMedKvitto = body.medKvitto;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          inbetalning: {
            id: INBETALNING_ID_2,
            anmalanRecordId: ANMALAN_ID_2,
            ogonblicksbildNamn: 'Task367 Kryssrutsson',
            ogonblicksbildEvent: 'Task367-kurs',
            ogonblicksbildEventdatum: '2099-06-01',
            belopp: 500,
            betalsatt: 'Swish',
            betalningsdatum: '2026-09-06',
            typ: 'inbetalning',
            status: 'aktiv',
            makuleradSkal: null,
            makuleradNar: null,
            bankreferens: null,
            kvittoId: null,
            notering: null,
            skapadAv: 'staging-user@miranon.test',
            skapadNar: '2026-09-06T00:00:00.000Z',
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

    await page.goto('/mer/betalningar');
    await page.getByRole('button', { name: 'Registrera betalning' }).click();
    const formulär = page.getByRole('form', { name: /Registrera betalning för/ });
    await expect(formulär).toBeVisible();

    // TANGENTBORD, INTE PEKARE — mätt, dokumenterad fälla i
    // `betalningar-inkorg-utskicksflode.staging.test.ts` (samma kryssruta):
    // den dekorativa ikon-`<span>` ovanpå den nativa `<input>` fångar
    // Playwrights pekar-baserade `.click()` ("intercepts pointer events").
    // `.focus()` + `Space` är den robusta vägen, samma fix som den filen.
    const kryssruta = formulär.getByRole('checkbox', { name: 'Skicka kvitto' });
    await kryssruta.focus();
    await page.keyboard.press(' ');
    await expect(kryssruta).not.toBeChecked();
    await formulär.getByRole('button', { name: 'Registrera', exact: true }).click();
    await expect.poll(() => sistaMedKvitto).toBe(false);

    // Fullbetald (mockens `harledning.saknas: 0`) OCH kvitto_avbojt=true på
    // servern (simulerat): nästa hämtning ska INTE räkna raden som "kvitto
    // att skicka".
    radLista = [oppenAnmalanAttRegistrera({ saknas: 0, summaInbetalt: 500, oskickadeKvitton: [] })];
    await page.reload();
    await expect(page.getByRole('region', { name: 'Kvitto att skicka' })).toHaveCount(0);
  });

  test('kryssrutan IKRYSSAD (default): medKvitto: true skickas, och raden syns efter omladdning', async ({
    page,
  }) => {
    let radLista = [oppenAnmalanAttRegistrera()];
    let sistaMedKvitto: unknown;

    await mockValjarLista(page, [
      valjarRad({ id: EVENT_ID, namn: 'Task367-kurs', startdatum: '2099-06-01' }),
    ]);
    await page.route(HAMTA_OPPNA_BETALNINGAR, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ betalningar: radLista, forfallna: 0 }),
      });
    });
    await page.route(REGISTRERA_INBETALNING, async (route: Route) => {
      const body = route.request().postDataJSON() as { medKvitto: unknown };
      sistaMedKvitto = body.medKvitto;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          inbetalning: {
            id: INBETALNING_ID_2,
            anmalanRecordId: ANMALAN_ID_2,
            ogonblicksbildNamn: 'Task367 Kryssrutsson',
            ogonblicksbildEvent: 'Task367-kurs',
            ogonblicksbildEventdatum: '2099-06-01',
            belopp: 500,
            betalsatt: 'Swish',
            betalningsdatum: '2026-09-06',
            typ: 'inbetalning',
            status: 'aktiv',
            makuleradSkal: null,
            makuleradNar: null,
            bankreferens: null,
            kvittoId: null,
            notering: null,
            skapadAv: 'staging-user@miranon.test',
            skapadNar: '2026-09-06T00:00:00.000Z',
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

    await page.goto('/mer/betalningar');
    await page.getByRole('button', { name: 'Registrera betalning' }).click();
    const formulär = page.getByRole('form', { name: /Registrera betalning för/ });
    await expect(formulär).toBeVisible();

    // Kryssrutan RÖRS INTE — default är ikryssad.
    await formulär.getByRole('button', { name: 'Registrera', exact: true }).click();
    await expect.poll(() => sistaMedKvitto).toBe(true);

    // Fullbetald OCH kvitto_avbojt=false (default): nästa hämtning SKA
    // räkna raden som "kvitto att skicka".
    radLista = [
      oppenAnmalanAttRegistrera({
        saknas: 0,
        summaInbetalt: 500,
        oskickadeKvitton: [{ inbetalningId: INBETALNING_ID_2, belopp: 500 }],
      }),
    ];
    await page.reload();
    const block = page.getByRole('region', { name: 'Kvitto att skicka' });
    await expect(block).toBeVisible();
    await expect(block.getByText('Task367 Kryssrutsson')).toBeVisible();
  });
});
