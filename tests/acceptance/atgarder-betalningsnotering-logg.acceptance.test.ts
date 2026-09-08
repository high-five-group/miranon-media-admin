import { http } from 'msw';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from './acceptance-bas';

/**
 * TASK-201.13 — betalningsnoteringens integritetsgaranti, ände-till-ände
 * genom den RIKTIGA hooken (`useRegistreraInbetalning`,
 * `data/mutations/inbetalningar.ts`).
 *
 * [RIVET, TASK-435, 2026-09-08] SKRIVEN OM. Filen testade tidigare
 * `AtgardsSida.tsx`s numera rivna `SkrivRad`/`useUpdatePaymentNote` — den
 * gamla skrivvägen till Anmälningars `Notering anmälningsavgift`/
 * `Notering slutbetalning` (se `data/mutations/registrationPayments.ts`s
 * kvarvarande docblock för den historien). Marcus dom 2026-09-01 flyttade
 * noteringsplatsen: *"det är HÄR lotta noterar något, inte på pricka av-
 * blocket"* (`RegistreraForm.tsx` § NOTERINGSFÄLTET) — noteringen bor nu på
 * INBETALNINGEN, skriven av `RegistreraForm` via `useRegistreraInbetalning`.
 *
 * ARKITEKTUREN ÄR STRUKTURELLT ANNORLUNDA, INTE BARA FLYTTAD. Den GAMLA
 * hooken loggade aktiviteten KLIENT-SIDA (`recordActivity`, ett separat
 * `log-activity`-anrop EFTER skrivningen) — det var DÄR integritetsvakten
 * satt: bevisa att fritexten aldrig band in i DEN utgående kroppen.
 * `registrera-inbetalning` loggar i stället SERVER-SIDA, i SAMMA
 * request/response som bär noteringen (`registrera-inbetalning/index.ts`
 * § "Steg 4: aktivitetsloggen" — `byggStatement`s `objektNamn` läser
 * `anmalan.namn`, ALDRIG `notering`-variabeln, som strukturell garanti,
 * samma "fritexten finns inte ens som binding i scopet"-mönster den gamla
 * hooken bar). Den garantin är server-sidig och hör hemma i `tests/api/`
 * (t.ex. en utökning av `inbetalning-notering.test.ts`) — INTE i denna
 * klass, som bara ser vad KLIENTEN skickar och visar (se
 * `acceptance-bas.ts` § VAD KLASSEN BEVISAR).
 *
 * VAD DENNA FIL DÄRFÖR BEVISAR, PÅ KLIENT-LAGRET: (1) att fritexten FAKTISKT
 * skickas i `registrera-inbetalning`-anropets `notering`-fält — det ÄR
 * meningen, det är inte längre en läcka (RIKTNING 1); (2) att fritexten
 * ALDRIG ekas tillbaka i den bekräftelse (`RegistreringsUtfall.kvittens`)
 * formuläret lämnar till sin anropare — det enda ANDRA klient-observerbara
 * stället en läcka strukturellt skulle kunna uppstå, eftersom det inte
 * längre finns något separat klient-drivet loggnings-anrop att läcka in i
 * (RIKTNING 1, samma test); (3) att en FALLERAD skrivning varken visar en
 * missvisande bekräftelse eller en notering någonstans i felytan
 * (RIKTNING 2).
 *
 * VARFÖR `/dev/registrera-form-registrera` OCH INTE EN PRODUKTIONSROUTE:
 * se den routens egen docblock. Kort sagt: alla tre produktionskonsumenter
 * (`BetalningsInkorg.tsx`, `AnmalansBetalningar.tsx`, `PersonBetalningar.tsx`)
 * är bakom `betalningarPa()`, och `playwright.config.ts` hårdkodar den
 * flaggan `'av'` för acceptance-klassens fixturvärld (TASK-346.4). Att
 * flippa den globala raden hade rört samtliga acceptance-tester (samma
 * WebSocket-vakt TASK-346.4 skrev raden för att undvika) för att lösa ETT
 * testfils behov — en `/dev/*`-route (samma ADR-044-mönster som
 * `/dev/matyta-option-c`, TASK-340.4, redan konsumerad av
 * `dev-matyta-option-c.acceptance.test.ts`) är den avgränsade vägen.
 *
 * RÖTT-FÖRST (AC #3): verifierat 2026-09-08 genom att skarpt injicera
 * ` (${notering})` i `RegistreraForm.tsx`s `kvittens`-konstruktion (samma
 * plats en framtida regression rimligen skulle råka lägga till fritexten).
 * Med injektionen föll RIKTNING 1 exakt på integritetsassertionen ("HELA
 * noteringen läckte in i bekräftelsen") — se PR-kroppen för exakt
 * testutdata. Injektionen reverterades omedelbart efter; ingen produktionskod
 * i denna PR bär den.
 */

/** Precis den sortens känsliga fritext Lotta faktiskt skriver i fältet — och
 * som ALDRIG får ekas tillbaka i en bekräftelse andra kan läsa över axeln
 * (S105 Del 2 beslut 2 — samma disciplin, ny plats). */
const HEMLIG_NOTERING = 'Sjukskriven, betalar efter lönen den 25:e — ring inte igen';
const FRAGMENT = ['Sjukskriven', 'lönen', '25:e', 'ring inte igen'];

type Kropp = Record<string, unknown>;

async function oppnaOchNoteraKvar(page: import('@playwright/test').Page, notering: string) {
  await page.goto('/dev/registrera-form-registrera');
  const falt = page.getByLabel('Notering');
  await expect(falt).toBeVisible();
  await falt.fill(notering);
  return falt;
}

test.describe('Betalningsnoteringens integritetsgaranti (TASK-201.13, TASK-435)', () => {
  test('RIKTNING 1/2 — sparas: notering skickas i inbetalningen, men ekas ALDRIG i bekräftelsen', async ({
    page,
    network,
  }) => {
    let skrivKropp: Kropp | null = null;

    network.use(
      http.post(EF('registrera-inbetalning'), async ({ request }) => {
        skrivKropp = (await request.json()) as Kropp;
        return json({
          inbetalning: {
            id: '00000000-0000-4000-8000-000000000001',
            anmalanRecordId: 'dev-fixtur-registrera-form-registrera',
            ogonblicksbildNamn: 'Dev Testsson',
            ogonblicksbildEvent: 'Dev-eventet (demo)',
            ogonblicksbildEventdatum: '2099-12-01',
            belopp: 1500,
            betalsatt: 'Swish',
            betalningsdatum: '2026-09-08',
            typ: 'inbetalning',
            status: 'aktiv',
            makuleradSkal: null,
            makuleradNar: null,
            bankreferens: null,
            kvittoId: null,
            // Servern ekar noteringen tillbaka — precis som en riktig
            // sparad rad. Det är HÄR den FÅR finnas; testet nedan bevisar
            // att den INTE också läcker ut i kvittensen.
            notering: HEMLIG_NOTERING,
            skapadAv: 'dev@example.test',
            skapadNar: '2026-09-08T08:00:00.000Z',
          },
          harledning: {
            summa: 1500,
            gallandePris: 1500,
            saknas: 0,
            avgiftKlar: true,
            alltKlart: true,
            arForelasning: false,
          },
          spegel: { skrivet: true, forsok: 1, skal: null },
        });
      }),
    );

    await oppnaOchNoteraKvar(page, HEMLIG_NOTERING);
    await page.getByRole('button', { name: 'Registrera', exact: true }).click();

    // RIKTNING 1a — SKRIVNINGEN BÄR FRITEXTEN. Det SKA den: det är hela
    // poängen med fältet (Marcus dom 2026-09-01).
    await expect.poll(() => skrivKropp).not.toBeNull();
    expect(JSON.stringify(skrivKropp)).toContain('Sjukskriven');
    expect((skrivKropp as unknown as { notering: string }).notering).toBe(HEMLIG_NOTERING);

    // RIKTNING 1b — INTEGRITETEN, mätt på HELA bekräftelsen formuläret
    // lämnar till sin anropare (`RegistreringsUtfall`, visad här som
    // `senast-klar`). Detta är det ENDA andra klient-observerbara stället
    // en läcka strukturellt kan uppstå, eftersom `registrera-inbetalning`
    // loggar aktiviteten SERVER-SIDA (se filhuvudet) — det finns inget
    // separat klient-drivet loggningsanrop att läcka in i.
    const senastKlar = page.getByTestId('senast-klar');
    await expect(senastKlar).not.toHaveText('inget än');
    const bekraftelse = await senastKlar.innerText();
    expect(bekraftelse, 'HELA noteringen läckte in i bekräftelsen').not.toContain(HEMLIG_NOTERING);
    for (const fragment of FRAGMENT) {
      expect(
        bekraftelse,
        `fritext-fragmentet "${fragment}" läckte in i bekräftelsen`,
      ).not.toContain(fragment);
    }
  });

  test('RIKTNING 2/2 — skrivningen MISSLYCKAS: ingen bekräftelse visas, notering läcker inte i felytan', async ({
    page,
    network,
  }) => {
    network.use(
      // Basen avvisar — mutationen når aldrig sin onSuccess/onKlar.
      http.post(EF('registrera-inbetalning'), () => json({ error: 'Airtable 422' }, 422)),
    );

    await oppnaOchNoteraKvar(page, HEMLIG_NOTERING);
    await page.getByRole('button', { name: 'Registrera', exact: true }).click();

    // Felytan bekräftar att mutationen FAKTISKT föll (utan denna rad kunde
    // testet vara grönt för att inget hände alls). 422 kortsluter retry-
    // lagret (4xx retryas inte, `supabase-client.ts`), så den normala
    // expect-timeouten räcker.
    const fel = page.getByRole('alert');
    await expect(fel).toBeVisible();
    const felText = await fel.innerText();
    expect(felText, 'noteringen läckte in i felmeddelandet').not.toContain(HEMLIG_NOTERING);

    // INGEN bekräftelse — `onKlar` anropas bara vid lyckad mutation
    // (`RegistreraForm.tsx` § `spara`), så en missvisande "sparat"-text vore
    // värre än inget svar alls (samma princip som PRD TASK-201 berättelse 9,
    // överförd från aktivitetsloggen till bekräftelsen).
    await expect(page.getByTestId('senast-klar')).toHaveText('inget än');
  });
});
