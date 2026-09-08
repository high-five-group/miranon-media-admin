import type { NetworkFixture } from '@msw/playwright';
import type { Locator } from '@playwright/test';
import { http } from 'msw';
import type { z } from 'zod';
import type {
  PersonDetailSchema,
  RegistrationDetailSchema,
  RegistrationSchema,
} from '../../src/domain/schemas';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, type Page, test } from './acceptance-bas';

/**
 * TASK-439 (fynd) — regressionstest C: tidslinjens ikon-noder på
 * persondetaljen och anmälans detaljvy ritades FRAMFÖR menybaren.
 *
 * ROTORSAK (två lager, kortets Description): (1) `TabBar.tsx`s `nav` var
 * `fixed` med `z-index: auto` — ett fixed element utan eget z-index ritas i
 * rot-staplingskontexten på nivå 0/auto. (2) tidslinjens ikon-noder
 * (`Tidslinje.tsx`, `PersonDetail.tsx`s `StromRadD`) är flex-items med
 * `z-10` utan att någon förälder isolerar staplingen — nivå 10 läcker ut i
 * ROT-kontexten och konkurrerar direkt med menybaren.
 *
 * REPRODUKTION (samma avsikt som orkestrerarens repro i kortet — "en
 * ikon-nod rullad in i menybarens rektangel"): sidan scrollas tills
 * ikon-nodens (`span.z-10`) egen MITTPUNKT sammanfaller med menybarens
 * mittpunkt (fixed, konstant oavsett scroll — se `scrollaIkonTillMenybaren`
 * för varför en enkel `scrollIntoView({ block: 'end' })` på `<li>` inte
 * räcker). `document.elementFromPoint` på den mittpunkten avgör VEM som
 * vann målningsordningen.
 *
 * Sanity-assertionen (ikonens mittpunkt ligger inuti navets rektangel)
 * bevisar att reproduktionen faktiskt placerade ikonen där kortet
 * beskriver — oberoende av fixen. Den andra assertionen
 * (`elementFromPoint` träffar `nav`) är den som fälls FÖRE fixen och går
 * grön EFTER (RÖTT-FÖRST, utfall bokfört i PR-kroppen).
 */

async function traffarNav(page: Page, ikon: { x: number; y: number }) {
  return page.evaluate(({ x, y }) => {
    const el = document.elementFromPoint(x, y);
    return el?.closest('nav[aria-label="Huvudnavigation"]') != null;
  }, ikon);
}

/**
 * Scrollar sidan tills ikon-nodens MITTPUNKT hamnar mitt i menybarens
 * rektangel, och returnerar mittpunkten (viewport-koordinater).
 *
 * `scrollIntoView({ block: 'end' })` på `<li>` RÄCKER INTE (mätt): raden är
 * `items-start` med icon (32 px) bredvid en tre-radig textkolumn + fast
 * pill-slot — textkolumnen är högre än ikonen, så `<li>`s NEDRE kant landar
 * ~12 px längre ner än ikonens mittpunkt när LI:t (inte ikonen) scrollas
 * till viewportens botten. Riktar man i stället in ikon-ELEMENTET direkt
 * (samma metod, men målet är ikonens egen mittpunkt) hamnar den exakt vid
 * navets NEDRE kant i stället för dess mitt — också för nära marginalen.
 * Denna funktion räknar i stället ut sid-absolut Y för ikonens mittpunkt
 * (oberoende av nuvarande scroll — `getBoundingClientRect().top +
 * window.scrollY`) och sätter scrollY så att den mittpunkten hamnar på
 * navets EGEN mittpunkt (fixed — konstant oavsett scroll).
 */
async function scrollaIkonTillMenybaren(
  page: Page,
  li: Locator,
  navBox: { y: number; height: number },
) {
  const ikon = li.locator('span[aria-hidden="true"]').first();
  await ikon.scrollIntoViewIfNeeded();
  const ikonSidY = await ikon.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return rect.top + window.scrollY + rect.height / 2;
  });
  const navMittViewport = navBox.y + navBox.height / 2;
  const maxScroll = await page.evaluate(
    () => document.documentElement.scrollHeight - window.innerHeight,
  );
  const malScrollY = Math.max(0, Math.min(maxScroll, ikonSidY - navMittViewport));
  await page.evaluate((y) => window.scrollTo(0, y), malScrollY);
  const box = await ikon.boundingBox();
  if (!box) throw new Error('Ikon-noden saknar boundingBox — reproduktionen kunde inte köras.');
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

type PersonDetailMock = z.infer<typeof PersonDetailSchema>;

/**
 * MEDVETET RIK (inte minimal): `scrollaIkonTillMenybaren` klämmer sitt
 * beräknade mål-scrollY mot `[0, maxScroll]` — sidans EGEN scrollhöjd sätter
 * alltså ett tak för hur långt ner ikonen kan flyttas. En gles fixtur (allt
 * tomt/null) ger en kortare sida än 390×844, `maxScroll` blir för litet, och
 * ikonen når aldrig menybarens rektangel (mätt: första försöket med en gles
 * fixtur gav en icke-flakande, DETERMINISTISK miss — ikonens mittpunkt låg
 * ~136 px ovanför navets topp, klämd av det otillräckliga taket). Historik-
 * posterna nedan bygger både "Eventhistorik"-listan och interaktionsströmmens
 * år-grupper, så sidan blir tillräckligt hög.
 */
function personDetail(overrides: Partial<PersonDetailMock> = {}): PersonDetailMock {
  return {
    id: 'recTASK439PERSON1',
    namn: 'Test Testsson',
    fornamn: 'Test',
    efternamn: 'Testsson',
    email: 'test@example.test',
    telefon: '070-0000000',
    ort: ['Skövde'],
    manuellFlagga: null,
    aiFlagga: null,
    anteckningar: 'Testperson för TASK-439s regressionstest.',
    antalAnmalningar: 1,
    antalDeltaganden: 2,
    erfarenhetsniva: 'Genomfört RIM steg 1–2',
    erfarenhetsbadge: 'Resenär steg 1–2',
    senasteInteraktion: 'RIM 2',
    senasteInteraktionDatum: '2026-03-01',
    dagarSedanSenaste: 100,
    harAktivAnmalan: null,
    ejGodkandMail: false,
    radSkapad: '2026-01-01T00:00:00.000Z',
    anmalningIds: ['recANM0000000001'],
    deltagandeIds: ['recDLT0000000001', 'recDLT0000000002'],
    aterkommande: 'Ja',
    nastaEvent: null,
    antalGenomfordaEvent: 2,
    senasteDeltagandeDatum: '2026-03-01',
    antalHamtningar: 1,
    allaHamtningar: ['Gratis meditation'],
    motivering: ['Vill utvecklas vidare.'],
    hamtningar: [
      {
        id: 'recTP0000000001',
        erbjudande: 'Gratis meditation',
        typ: 'Angett e-post för att ta del av ett erbjudande',
        datum: '2026-01-20',
      },
    ],
    motiveringar: [
      {
        id: 'recANM0000000001',
        motivering: 'Vill utvecklas vidare.',
        event: 'Resor i medvetandet 2',
        datum: '2026-02-20T09:00:00.000Z',
        eventDatum: '2026-03-14',
        ort: 'Skövde',
        eventId: 'recEVT0000000001',
      },
    ],
    flagga: null,
    inbjudenCommunity: true,
    skapatKontoCommunity: false,
    historik: [
      {
        id: 'recDLT0000000002',
        kursnamn: 'Resor i medvetandet 2',
        eventLabel: 'RIM 2 — Göteborg 2026-03-01',
        datum: '2026-03-01',
        session: 'Dag 1',
        status: 'Frånvarande',
        narvaro: false,
        ort: 'Göteborg',
        typ: 'Utbildning',
        eventId: null,
        registrationId: null,
      },
      {
        id: 'recDLT0000000001',
        kursnamn: 'Resor i medvetandet 1',
        eventLabel: 'RIM 1 — Skövde 2026-02-01',
        datum: '2026-02-01',
        session: 'Dag 1',
        status: 'Närvarande',
        narvaro: true,
        ort: 'Skövde',
        typ: 'Utbildning',
        eventId: null,
        registrationId: null,
      },
      // Två extra 2025-poster — utöver Eventhistorik-listan bygger de en
      // egen ÅR-GRUPP i interaktionsströmmen (utan dem är sidan för kort
      // för att `scrollIntoView({ block: 'end' })` ska nå menybarens
      // rektangel: mätt miss med bara de två posterna ovan, 756 px mot
      // navets topp på 768 px — 12 px kvar).
      {
        id: 'recDLT0000000003',
        kursnamn: 'Resor i medvetandet 1',
        eventLabel: 'RIM 1 — Skövde 2025-11-01',
        datum: '2025-11-01',
        session: 'Dag 1',
        status: 'Närvarande',
        narvaro: true,
        ort: 'Skövde',
        typ: 'Utbildning',
        eventId: null,
        registrationId: null,
      },
      {
        id: 'recDLT0000000004',
        kursnamn: 'Resor i medvetandet 1',
        eventLabel: 'RIM 1 — Skövde 2025-10-01',
        datum: '2025-10-01',
        session: 'Dag 2',
        status: 'Frånvarande',
        narvaro: false,
        ort: 'Skövde',
        typ: 'Utbildning',
        eventId: null,
        registrationId: null,
      },
    ],
    ...overrides,
  };
}

type ListRow = z.infer<typeof RegistrationSchema>;
type DetaljRow = z.infer<typeof RegistrationDetailSchema>;

const ANMALAN_EVENT_ID = 'recTASK439EVENT01';
const ANMALAN_REG_ID = 'recTASK439REG001';

function listRad(overrides: Partial<ListRow> = {}): ListRow {
  return {
    id: ANMALAN_REG_ID,
    namn: 'Test Testsson',
    fornamn: 'Test',
    efternamn: 'Testsson',
    email: 'test@example.test',
    telefon: '070-0000000',
    eventNamn: 'Resor i medvetandet 2',
    ort: 'Skövde',
    status: 'Bekräftad (mail skickat)',
    flagga: null,
    anmalningsavgift: 'Mottagen',
    slutbetalning: 'Ej mottagen',
    betalningspaminnelseSkickad: null,
    inskickad: '2026-06-30T12:32:00.000Z',
    motivering: null,
    tidigareErfarenhet: null,
    antalPlatser: 1,
    notering: null,
    eventId: ANMALAN_EVENT_ID,
    personId: 'recTASK439PERSON2',
    noteringAnmalningsavgift: null,
    noteringSlutbetalning: null,
    paminnelseAnmalningsavgiftSkickad: null,
    paminnelseSlutbetalningSkickad: null,
    kalla: null,
    medfoljandeTill: null,
    bekraftelseSkickad: '2026-07-01T07:15:00.000Z',
    deltagarinfoSkickad: null,
    antalGenomfordaEvent: 0,
    borOver: false,
    erfarenhetsbadge: null,
    kurshistorik: null,
    ...overrides,
  };
}

function detalj(): DetaljRow {
  return {
    ...listRad(),
    noteringAnmalningsavgift: null,
    anmalanId: 439,
    franFormular: 'Huvudformulär',
    franFormularId: 'selTASK439000000',
    fragorFunderingar: null,
    villkorOk: true,
    eventTyp: 'Utbildning',
    eventOrt: 'Skövde',
    startdatum: '2026-08-10',
    slutdatum: '2026-08-12',
    tidKvar: '2 veckor och 3 dagar',
    eventKey: 'Event-31',
    deadlineSlutbetalning: '2026-07-27',
    dagarKvarTillDeadline: 3,
    plusOneForfraganSkickad: null,
    medfoljandeTillNamn: null,
    plusEttor: [],
    sidUrl: null,
    utm: null,
  };
}

// get-event/get-event-notes registreras INTE: sidan (anmälans egen detaljvy)
// anropar dem inte — bara get-registrations (medföljande-uppslaget) och
// get-registration. Överskuggnings-vakten fäller en registrering ingen
// körd test i filen använder (mätt: registrering av båda gav "använd av 0").
function mockAnmalan(network: NetworkFixture): void {
  network.use(
    http.get(EF('get-registrations'), () => json({ registrations: [] })),
    http.get(EF('get-registration'), () => json({ registration: detalj() })),
  );
}

test.describe('TASK-439 — tidslinjens ikon-noder ritas bakom menybaren', () => {
  test('persondetaljen: ikon rullad in i menybarens rektangel träffar nav, inte ikonen', async ({
    page,
    network,
  }) => {
    network.use(http.get(EF('get-person'), () => json({ person: personDetail() })));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/personer/recTASK439PERSON1');
    await expect(page.getByRole('heading', { level: 1, name: 'Test Testsson' })).toBeVisible();

    const strom = page.locator('section[aria-labelledby="proto-d-strom"]');
    const sistaLi = strom.locator('li').last();
    await expect(sistaLi).toBeVisible();
    await expect(sistaLi).toContainText('Kom in i registret');

    const nav = page.getByRole('navigation', { name: 'Huvudnavigation' });
    const navBox = await nav.boundingBox();
    if (!navBox) throw new Error('nav saknar boundingBox.');
    const ikonMitt = await scrollaIkonTillMenybaren(page, sistaLi, navBox);

    // Sanity: reproduktionen placerade verkligen ikonens mittpunkt inuti
    // menybarens rektangel — oberoende av fixen, ren layout-kontroll.
    expect(ikonMitt.x).toBeGreaterThanOrEqual(navBox.x);
    expect(ikonMitt.x).toBeLessThanOrEqual(navBox.x + navBox.width);
    expect(ikonMitt.y).toBeGreaterThanOrEqual(navBox.y);
    expect(ikonMitt.y).toBeLessThanOrEqual(navBox.y + navBox.height);

    // Den fällande assertionen: elementFromPoint ska träffa navet, inte
    // ikon-noden som ligger geometriskt ovanpå den.
    expect(await traffarNav(page, ikonMitt)).toBe(true);
  });

  test('anmälans detaljvy: ikon rullad in i menybarens rektangel träffar nav, inte ikonen', async ({
    page,
    network,
  }) => {
    mockAnmalan(network);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/event/${ANMALAN_EVENT_ID}/anmalan/${ANMALAN_REG_ID}`);
    await expect(page.getByRole('heading', { level: 1, name: 'Test Testsson' })).toBeVisible();

    const handelser = page.locator('section[aria-labelledby="grupp-handelser"]');
    const sistaLi = handelser.locator('li').last();
    await expect(sistaLi).toBeVisible();

    const nav = page.getByRole('navigation', { name: 'Huvudnavigation' });
    const navBox = await nav.boundingBox();
    if (!navBox) throw new Error('nav saknar boundingBox.');
    const ikonMitt = await scrollaIkonTillMenybaren(page, sistaLi, navBox);

    expect(ikonMitt.x).toBeGreaterThanOrEqual(navBox.x);
    expect(ikonMitt.x).toBeLessThanOrEqual(navBox.x + navBox.width);
    expect(ikonMitt.y).toBeGreaterThanOrEqual(navBox.y);
    expect(ikonMitt.y).toBeLessThanOrEqual(navBox.y + navBox.height);

    expect(await traffarNav(page, ikonMitt)).toBe(true);
  });
});
