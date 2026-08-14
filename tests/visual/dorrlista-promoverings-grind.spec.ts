import type { NetworkFixture } from '@msw/playwright';
import { http } from 'msw';
import { EVENT_DETAIL_RESPONSE, REGISTRATIONS_RESPONSE } from '../support/fixturvarld/fixture-data';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from '../support/fixturvarld/hermetic';

/**
 * PROMOVERINGS-GRINDEN för Dörrlistan (TASK-214.3, `ADR-103` B4).
 *
 * [FAS 1 — FÖRE-HALVAN, fångad UR VARIANT-LÄGET] Detta är den första halvan
 * av B4:s `ariaSnapshot`-PAR: referenserna fångas ur prototyp-formen
 * (`?variant=d`) INNAN flippen (TASK-214.4). Efter flippen ska SAMMA
 * lokatorer och SAMMA `name:`-nycklar peka mot den promoverade, ovillkorliga
 * ytan — skiljer sig trädet på en enda byte fäller grinden, exakt beviset för
 * att promoveringen tog FORMEN och ingenting annat.
 *
 * ORDNINGEN ÄR ENKELRIKTAD, och det är skälet denna fil skrivs FÖRE flippen:
 * variant-grenen renderas bara under `import.meta.env.DEV` (route-nivån,
 * `src/routes/_authenticated/event/$eventId/narvaro.tsx`). Flippas villkoret
 * i TASK-214.4 innan referenserna finns, upphör FÖRE-läget att existera och
 * paret kan aldrig konstrueras i efterhand.
 *
 * PRECEDENSEN denna fil följer, ordagrant i form (fixturkatalog,
 * referens-namngivning, ariaSnapshot-valet): `personer-promoverings-grind.spec.ts`
 * (S103, commits `46c03f6c` + `301d17af`) och `atgardssida-promoverings-grind.spec.ts`
 * (TASK-171.1). Samma val, samma skäl: deterministiskt, noll nya beroenden,
 * jämför STRUKTUR + TILLGÄNGLIGT NAMN — pixel-diff är den bokförda
 * eskaleringsvägen om `ariaSnapshot` empiriskt missar en formskillnad, inte
 * default.
 *
 * A11Y-GOLVET (axe) INGÅR MEDVETET INTE HÄR — avvikelse mot personer-
 * precedentens filstruktur, som bar sitt axe-block redan i FÖRE-halvan.
 * PRD task-214 delar ISTÄLLET härdningen ut som en EGEN skiva (TASK-214.5:
 * "Härdningen — a11y-golvet, skrivvägs-prövningen i promoverat läge,
 * städet"), och task-214.3:s egna AC/DoD nämner inte axe. Att duplicera
 * axe-täckning här hade förgripit 214.5:s scope utan att någon AC krävde
 * det; 214.5 äger a11y-golvet och kan verifiera mot SAMMA lokatorer och
 * SAMMA fixturvärld som byggs här.
 *
 * FACIT: `tasks/sessions/bilagor/s103-checkin-konvergens/facit.json`, ytan
 * "check-in (dörrlistan, variant D)" — godkänd av Marcus 2026-08-14
 * (sha `c7db8b16`). Formvalen nedan (ingen sessionsrad vid en session,
 * kryssruta utan synlig etikett, klargrupp kollapsad längst ned, kvittot i
 * framstegskortet) speglar facitets `not`-fält ordagrant.
 *
 * ══════════════════════════════════════════════════════════════════════════
 *  SCOPE — SEX LÄGEN (kortets AC #1), FYRA FIXTURVÄRLDAR
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Fyra världar bär de sex lägena — inte sex, eftersom sök-med/sök-utan-träff
 * återanvänder SAMMA värld som "en session" (personer-precedentens mönster:
 * ett dataset, flera interaktioner), och "en session" i sig behöver en EGEN
 * värld skild från "flera sessioner" eftersom `sessioner`-listan härleds ur
 * de FAKTISKA sessions-värdena i `get-attendance`-svaret
 * (`useSessionsval` läser `Dorrad[]`, inte det session-filtrerade
 * `DorradD[]`) — ett andra sessions-värde MÅSTE finnas i datat för att
 * togglen ska rendera, och kan alltså inte simuleras genom interaktion allena.
 *
 *   VÄRLD A (flera sessioner)   4 anmälda, Deltaganden i BÅDA 'Dag 1' och
 *                                'Dag 2' → `SessionsRadD` renderar togglen.
 *                                Default-sessionen är 'Dag 1' (eventets
 *                                slutdatum ≠ FROZEN_NOW:s datum — se
 *                                `useSessionsval` § härledningen).
 *   VÄRLD B (en session, ren)   3 anmälda, EN session ('Föreläsning') →
 *                                `SessionsRadD` returnerar `null` (kravet:
 *                                inget val när det inte finns något att
 *                                välja). Bär tre lägen via interaktion:
 *                                listläget, sökning med träff ("Anna"),
 *                                sökning utan träff ("zzz").
 *   VÄRLD C (klargrupp)         4 anmälda, 2 redan 'Närvarande' (med
 *                                `avstamt`, så "Incheckad HH:MM" har ett
 *                                klockslag), 2 kvar i arbetslistan. Kvittot
 *                                i framstegskortet uteblir MEDVETET — det
 *                                drivs av `historik` (interaktivt tillstånd),
 *                                inte av `basStatus`, så en fixtur-seedad
 *                                incheckning kan aldrig trigga det.
 *   VÄRLD D (tomläge)           2 anmälda, BÅDA 'Närvarande' → arbetslistan
 *                                är tom UTAN sökning: "Alla 2 är incheckade".
 *                                Skild från "sök utan träff" (VÄRLD B), som
 *                                är EN sökning mot en icke-tom lista som ger
 *                                noll träffar — två olika kodgrenar
 *                                (`fraga`-villkoret i `attGora`-tomläget),
 *                                därmed två olika referenser.
 *
 * MEDVETET UTANFÖR: laddningsläget (samma skäl som personer-precedenten —
 * tidsberoende, inte en formfråga) och avbokade/saknad-deltagande-raden
 * (`utanDeltagande`-förbehållet) — inget AC-krav pekar på dem, och
 * `event-checkin-dorrlistan.acceptance.test.ts` (TASK-214.2) täcker redan
 * CREATE-backupvägens existens-bevis via nätverksobservation.
 */

/** Sökfältets tillgängliga namn (`VariantD` § `SearchField aria-label`). */
const SOKFALT = 'Sök bland de anmälda';

/** En anmälan i dörrlistans form. Mallen är fixturvärldens generiska
 *  Anmälan-shape (`REGISTRATIONS_RESPONSE.registrations[0]`); identiteten är
 *  vår egen — samma mönster som `event-checkin-dorrlistan.acceptance.test.ts`
 *  (TASK-214.2) etablerade för samma domän. */
function anmalan(id: string, fornamn: string, efternamn: string, eventId: string) {
  return {
    ...REGISTRATIONS_RESPONSE.registrations[0],
    id,
    namn: `${fornamn} ${efternamn}`,
    fornamn,
    efternamn,
    email: `${fornamn.toLowerCase()}@example.se`,
    eventId,
    // Basens faktiska optionsträng (`RegistrationStatus.BEKRAFTAD`,
    // `src/domain/types/Status.ts`), inte "Bekräftad" — schemat är en enum
    // och parsen fäller varje avvikelse.
    status: 'Bekräftad (mail skickat)',
  };
}

/** Ett deltagande i dörrlistans form (`get-attendance`-svarets rad-shape). */
function deltagande(
  id: string,
  anmalanId: string,
  eventId: string,
  personNamn: string,
  session: string,
  status: string,
  avstamt: string | null = null,
) {
  return {
    id,
    anmalanId,
    eventId,
    personId: `${id}Person`,
    personNamn,
    session,
    status,
    noteringar: null,
    avstamt,
  };
}

/**
 * Eventet — Utbildning/Föreläsning-formen som `VariantD` läser för identitet
 * och sessions-härledning (`event.eventNamn`, `startdatum`, `slutdatum`).
 *
 * Mallen är `EVENT_DETAIL_RESPONSE.event` (samma bas som
 * `event-checkin-dorrlistan.acceptance.test.ts` § `dorrEvent()`), inte ett
 * handskrivet objekt: `EventSchema` kräver flera numeriska räknefält
 * (`antalAnmalda`, `antalNyaAnmalningar`, m.fl.) som VariantD aldrig läser
 * men parsen fäller om de saknas — mallen bär dem redan.
 */
function dorrEvent(
  id: string,
  eventNamn: string,
  typ: string,
  startdatum: string,
  slutdatum: string,
) {
  return {
    ...EVENT_DETAIL_RESPONSE.event,
    id,
    eventlabel: eventNamn,
    eventNamn,
    typ,
    ort: 'Referensstad',
    startdatum,
    slutdatum,
  };
}

/** Överskuggar läsvägens tre EF:er med en fullständig fixturvärld. */
function mockaVarld(
  network: NetworkFixture,
  event: ReturnType<typeof dorrEvent>,
  registrations: ReturnType<typeof anmalan>[],
  attendance: ReturnType<typeof deltagande>[],
) {
  network.use(
    http.get(EF('get-event'), () => json({ event })),
    http.get(EF('get-registrations'), () => json({ registrations })),
    http.get(EF('get-attendance'), () => json({ attendance })),
  );
}

async function gotoDorrlista(page: import('@playwright/test').Page, eventId: string) {
  await page.goto(`/event/${eventId}/narvaro?variant=d`);
  await expect(page.getByRole('heading', { level: 1, name: 'Check-in' })).toBeVisible();
  await expect(page.getByTestId('dorrlista-yta')).toBeVisible();
}

// ═══════════════════════════════════════════════════════════════════════════
//  VÄRLD A — FLERA SESSIONER
// ═══════════════════════════════════════════════════════════════════════════

const EVENT_FLERA = 'recDorrEvtFlera0001';
const REG_FLERA_ANNA = 'recDorrRegFlera0001';
const REG_FLERA_BJORN = 'recDorrRegFlera0002';
const REG_FLERA_CECILIA = 'recDorrRegFlera0003';
const REG_FLERA_DAVID = 'recDorrRegFlera0004';

function varldFlera() {
  const event = dorrEvent(
    EVENT_FLERA,
    'Utbildning Referensstad',
    'Utbildning - 2 dagar',
    '2026-09-26',
    '2026-09-27',
  );
  const registrations = [
    anmalan(REG_FLERA_ANNA, 'Anna', 'Andersson', EVENT_FLERA),
    anmalan(REG_FLERA_BJORN, 'Björn', 'Bergström', EVENT_FLERA),
    anmalan(REG_FLERA_CECILIA, 'Cecilia', 'Ek', EVENT_FLERA),
    anmalan(REG_FLERA_DAVID, 'David', 'Nilsson', EVENT_FLERA),
  ];
  const attendance = [
    // Dag 1 — samtliga fyra, ingen ännu incheckad.
    deltagande(
      'recDorrAttFlera01',
      REG_FLERA_ANNA,
      EVENT_FLERA,
      'Anna Andersson',
      'Dag 1',
      'Ej avstämt',
    ),
    deltagande(
      'recDorrAttFlera02',
      REG_FLERA_BJORN,
      EVENT_FLERA,
      'Björn Bergström',
      'Dag 1',
      'Ej avstämt',
    ),
    deltagande(
      'recDorrAttFlera03',
      REG_FLERA_CECILIA,
      EVENT_FLERA,
      'Cecilia Ek',
      'Dag 1',
      'Ej avstämt',
    ),
    deltagande(
      'recDorrAttFlera04',
      REG_FLERA_DAVID,
      EVENT_FLERA,
      'David Nilsson',
      'Dag 1',
      'Ej avstämt',
    ),
    // Dag 2 — ETT deltagande räcker för att registrera det andra
    // sessions-värdet (`useSessionsval` kräver bara att värdet FINNS, inte
    // att alla anmälda har en rad för det).
    deltagande(
      'recDorrAttFlera05',
      REG_FLERA_ANNA,
      EVENT_FLERA,
      'Anna Andersson',
      'Dag 2',
      'Ej avstämt',
    ),
  ];
  return { event, registrations, attendance };
}

test.describe('flera sessioner — sessionsvalet synligt', () => {
  test('Dag 1 (default), fyra anmälda, ingen incheckad', async ({ page, network }) => {
    const { event, registrations, attendance } = varldFlera();
    mockaVarld(network, event, registrations, attendance);
    await gotoDorrlista(page, EVENT_FLERA);

    // Sessionstoggeln är den mätbara skillnaden mot Värld B — vänta in den
    // innan referensen tas, annars kan snapshotten fångas mitt i en render.
    // Rollbaserat, INTE `getByText`: eventets datumtext "lördag 26 september"
    // innehåller själv understrängen "dag 2" (…lör**dag 2**6 september…) och
    // `getByText` är skiftlägesokänslig — mätt i denna körning (strict-mode
    // violation mot spannet, inte togglen). `ToggleButtonGroup` renderar en
    // `radiogroup`/`radio`-par (react-aria-components), inte knappar.
    await expect(page.getByRole('radio', { name: 'Dag 1', checked: true })).toBeVisible();
    await expect(page.getByRole('radio', { name: 'Dag 2' })).toBeVisible();
    await expect(page.getByText('David Nilsson')).toBeVisible();

    await expect(page.getByTestId('dorrlista-yta')).toMatchAriaSnapshot({
      name: 'dorrlista-flera-sessioner.aria.yml',
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  VÄRLD B — EN SESSION, REN (tre lägen: lista, sök-träff, sök-utan-träff)
// ═══════════════════════════════════════════════════════════════════════════

const EVENT_EN = 'recDorrEvtEnSess0001';
const REG_EN_ANNA = 'recDorrRegEnSess0001';
const REG_EN_BJORN = 'recDorrRegEnSess0002';
const REG_EN_CECILIA = 'recDorrRegEnSess0003';

function varldEnSession() {
  const event = dorrEvent(
    EVENT_EN,
    'Föreläsning Referensstad',
    'Föreläsning',
    '2026-10-05',
    '2026-10-05',
  );
  const registrations = [
    anmalan(REG_EN_ANNA, 'Anna', 'Andersson', EVENT_EN),
    anmalan(REG_EN_BJORN, 'Björn', 'Bergström', EVENT_EN),
    anmalan(REG_EN_CECILIA, 'Cecilia', 'Ek', EVENT_EN),
  ];
  const attendance = [
    deltagande(
      'recDorrAttEnSess01',
      REG_EN_ANNA,
      EVENT_EN,
      'Anna Andersson',
      'Föreläsning',
      'Ej avstämt',
    ),
    deltagande(
      'recDorrAttEnSess02',
      REG_EN_BJORN,
      EVENT_EN,
      'Björn Bergström',
      'Föreläsning',
      'Ej avstämt',
    ),
    deltagande(
      'recDorrAttEnSess03',
      REG_EN_CECILIA,
      EVENT_EN,
      'Cecilia Ek',
      'Föreläsning',
      'Ej avstämt',
    ),
  ];
  return { event, registrations, attendance };
}

test.describe('en session — inget sessionsval (utan sessionsval)', () => {
  test('EN session: SessionsRadD renderar ingenting', async ({ page, network }) => {
    const { event, registrations, attendance } = varldEnSession();
    mockaVarld(network, event, registrations, attendance);
    await gotoDorrlista(page, EVENT_EN);
    await expect(page.getByText('Cecilia Ek')).toBeVisible();

    // Negativt bevis: kravet är att TOGGELN INTE renderas när det bara finns
    // en session — `SessionsRadD` returnerar `null` (`sessioner.length <= 1`).
    // Rollbaserat, INTE `getByText`: "Vilken session checkar du in?" är
    // `radiogroup`:ens `aria-label`, aldrig synlig DOM-text — `getByText`
    // hade gett 0 träffar OAVSETT om togglen renderades, ett tautologiskt
    // bevis (se Värld A:s docblock om samma fälla åt andra hållet).
    await expect(
      page.getByRole('radiogroup', { name: 'Vilken session checkar du in?' }),
    ).toHaveCount(0);

    await expect(page.getByTestId('dorrlista-yta')).toMatchAriaSnapshot({
      name: 'dorrlista-en-session.aria.yml',
    });
  });
});

test.describe('sökning i dörrlistan', () => {
  test('sök med träff — "Anna" filtrerar till en rad', async ({ page, network }) => {
    const { event, registrations, attendance } = varldEnSession();
    mockaVarld(network, event, registrations, attendance);
    await gotoDorrlista(page, EVENT_EN);

    await page.getByRole('searchbox', { name: SOKFALT }).fill('Anna');
    // Deterministisk skarv: vänta ut de bortfiltrerade namnen (VariantD
    // filtrerar synkront på `fraga`, ingen debounce — men rendret sker ändå
    // i en efterföljande tick, precis som personer-precedentens väntan).
    await expect(page.getByText('Björn Bergström')).toHaveCount(0);
    await expect(page.getByText('Cecilia Ek')).toHaveCount(0);
    await expect(page.getByText('Visar 1 av 3 anmälda för "Anna".')).toBeVisible();

    await expect(page.getByTestId('dorrlista-yta')).toMatchAriaSnapshot({
      name: 'dorrlista-sokning-traff.aria.yml',
    });
  });

  test('sök utan träff — "zzz" ger noll träffar', async ({ page, network }) => {
    const { event, registrations, attendance } = varldEnSession();
    mockaVarld(network, event, registrations, attendance);
    await gotoDorrlista(page, EVENT_EN);

    await page.getByRole('searchbox', { name: SOKFALT }).fill('zzz');
    await expect(page.getByText('Ingen kvar att checka in bland träffarna')).toBeVisible();
    await expect(page.getByText('Visar 0 av 3 anmälda för "zzz".')).toBeVisible();

    await expect(page.getByTestId('dorrlista-yta')).toMatchAriaSnapshot({
      name: 'dorrlista-sokning-tomt.aria.yml',
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  VÄRLD C — KLARGRUPP MED POSTER
// ═══════════════════════════════════════════════════════════════════════════

const EVENT_KLAR = 'recDorrEvtKlargrp001';
const REG_KLAR_ANNA = 'recDorrRegKlargrp001';
const REG_KLAR_BJORN = 'recDorrRegKlargrp002';
const REG_KLAR_CECILIA = 'recDorrRegKlargrp003';
const REG_KLAR_DAVID = 'recDorrRegKlargrp004';

test.describe('klargrupp med poster — expanderad', () => {
  test('två redan incheckade i Klargruppen, två kvar i arbetslistan', async ({ page, network }) => {
    const event = dorrEvent(
      EVENT_KLAR,
      'Föreläsning Klargrupp',
      'Föreläsning',
      '2026-10-12',
      '2026-10-12',
    );
    const registrations = [
      anmalan(REG_KLAR_ANNA, 'Anna', 'Andersson', EVENT_KLAR),
      anmalan(REG_KLAR_BJORN, 'Björn', 'Bergström', EVENT_KLAR),
      anmalan(REG_KLAR_CECILIA, 'Cecilia', 'Ek', EVENT_KLAR),
      anmalan(REG_KLAR_DAVID, 'David', 'Nilsson', EVENT_KLAR),
    ];
    const attendance = [
      // Redan incheckade — basStatus 'Närvarande' MED avstamt, så
      // "Incheckad HH:MM" bär ett klockslag (KLOCKSLAG-formatern faller
      // annars tillbaka på `tider`-overlägget, som ALDRIG sätts av en
      // fixtur-seedad rad — bara av en interaktiv `satt()`).
      deltagande(
        'recDorrAttKlargrp01',
        REG_KLAR_ANNA,
        EVENT_KLAR,
        'Anna Andersson',
        'Föreläsning',
        'Närvarande',
        '2026-10-12T09:15:00.000Z',
      ),
      deltagande(
        'recDorrAttKlargrp02',
        REG_KLAR_BJORN,
        EVENT_KLAR,
        'Björn Bergström',
        'Föreläsning',
        'Närvarande',
        '2026-10-12T09:20:00.000Z',
      ),
      // Kvar att checka in.
      deltagande(
        'recDorrAttKlargrp03',
        REG_KLAR_CECILIA,
        EVENT_KLAR,
        'Cecilia Ek',
        'Föreläsning',
        'Ej avstämt',
      ),
      deltagande(
        'recDorrAttKlargrp04',
        REG_KLAR_DAVID,
        EVENT_KLAR,
        'David Nilsson',
        'Föreläsning',
        'Ej avstämt',
      ),
    ];
    mockaVarld(network, event, registrations, attendance);
    await gotoDorrlista(page, EVENT_KLAR);
    await expect(page.getByText('Cecilia Ek')).toBeVisible();

    // Klargruppen är KOLLAPSAD som default (`visaKlara` startar `false`,
    // facit § "klargrupp kollapsad längst ned") — expandera innan referensen
    // tas, annars fångas bara knappen, inte posterna AC #1 efterfrågar.
    await page.getByRole('button', { name: '2 incheckade' }).click();
    await expect(page.getByRole('list', { name: 'Incheckade' })).toBeVisible();
    await expect(page.getByText(/^Incheckad \d{2}:\d{2}$/).first()).toBeVisible();

    await expect(page.getByTestId('dorrlista-yta')).toMatchAriaSnapshot({
      name: 'dorrlista-klargrupp.aria.yml',
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  VÄRLD D — TOMLÄGE (alla incheckade, ingen sökning)
// ═══════════════════════════════════════════════════════════════════════════

const EVENT_TOM = 'recDorrEvtTomlage001';
const REG_TOM_ANNA = 'recDorrRegTomlage001';
const REG_TOM_BJORN = 'recDorrRegTomlage002';

test.describe('tomläge — alla incheckade, ingen kvar i arbetslistan', () => {
  test('"Alla 2 är incheckade" — skild från sök-utan-träff', async ({ page, network }) => {
    const event = dorrEvent(
      EVENT_TOM,
      'Föreläsning Tomläge',
      'Föreläsning',
      '2026-10-19',
      '2026-10-19',
    );
    const registrations = [
      anmalan(REG_TOM_ANNA, 'Anna', 'Andersson', EVENT_TOM),
      anmalan(REG_TOM_BJORN, 'Björn', 'Bergström', EVENT_TOM),
    ];
    const attendance = [
      deltagande(
        'recDorrAttTomlage01',
        REG_TOM_ANNA,
        EVENT_TOM,
        'Anna Andersson',
        'Föreläsning',
        'Närvarande',
        '2026-10-19T09:00:00.000Z',
      ),
      deltagande(
        'recDorrAttTomlage02',
        REG_TOM_BJORN,
        EVENT_TOM,
        'Björn Bergström',
        'Föreläsning',
        'Närvarande',
        '2026-10-19T09:05:00.000Z',
      ),
    ];
    mockaVarld(network, event, registrations, attendance);
    await gotoDorrlista(page, EVENT_TOM);

    // "Alla 2 är incheckade" — INGEN sökning inblandad, till skillnad från
    // Värld B:s "sök utan träff" (som kräver att `fraga` är satt). Klargruppen
    // står MEDVETET kollapsad här: tomläget är rubrikens/meddelandets form,
    // inte klargruppens — den formen bevisas separat av Värld C.
    await expect(page.getByText('Alla 2 är incheckade')).toBeVisible();
    await expect(page.getByRole('button', { name: '2 incheckade' })).toBeVisible();

    await expect(page.getByTestId('dorrlista-yta')).toMatchAriaSnapshot({
      name: 'dorrlista-tomlage.aria.yml',
    });
  });
});
