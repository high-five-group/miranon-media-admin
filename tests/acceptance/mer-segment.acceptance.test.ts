import AxeBuilder from '@axe-core/playwright';
import type { NetworkFixture } from '@msw/playwright';
import type { Locator } from '@playwright/test';
import { http } from 'msw';
import type { z } from 'zod';
import type { EventSchema, Par } from '../../src/domain/schemas';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, type Page, test } from './acceptance-bas';

/**
 * Fas 6g L2 — Segment-yta (/mer/segment), SKRIVEN MOT DEN PROMOVERADE
 * VariantD-FORMEN (TASK-249.9).
 *
 * ── VAD SOM HÄNDE FÖRE DENNA FIL ─────────────────────────────────────────
 *
 * `TASK-249.5` flippade routen till `VariantD` (ADR-103 B2 steg 1) och
 * `TASK-249.6` rev divergens-passets ställning (`SegmentPrototyp`-växeln,
 * varianterna a/b/c, `PrototypRigg`/`SkalprovsVaxel`). Den gamla
 * `SegmentBuilder`-ytan — dess egen sidrubrik (samma ord som Mer-flikens
 * etikett bar innan TASK-348 döpte om den till "Segment"), en `RadioGroup`
 * per kurs-par med Inkludera/Exkludera/Ignorera, "Räkna antal"-knappen,
 * SKOOL-exporten och spara-fältet — finns inte längre på någon route.
 *
 * De nio SegmentBuilder-specifika testerna i denna fil BORTTOGS i 249.5
 * (aldrig skippade: `tasks/lessons.d/acceptance-klassens-sjalvtest-tillater-
 * ingen-parkering.md` — hermetik-självtestet kräver att VARJE test i klassen
 * fälls med `OmockadRequestError` när fixturvärlden töms, och ett `skipped`
 * test räknas som en AVVIKELSE). Denna fil är omskrivningen: samma BETEENDEN
 * bevisade mot VariantD:s faktiska ytor och flöden.
 *
 * ── VAD SOM ÅTERUPPSTOD, YTA FÖR YTA ─────────────────────────────────────
 *
 * | Gammalt bevis (SegmentBuilder)          | Här, mot VariantD                       |
 * |-----------------------------------------|-----------------------------------------|
 * | taxonomi-rendering + fälla-35-etiketten | verkstadens `VillkorsKort` "Träffar N   |
 * |   distinkt (`labelForPar` per par)      |   av M …"-rad — samma `labelForPar`     |
 * | tom-regel-grind (knapp låst + ledtext)  | mallvyns steg 2/3-ledtexter + verk-     |
 * |                                         |   stadens "Bygg minst ett villkor …"    |
 * | include/exclude → klartext-spegling     | verkstadens steg 3 (`predikatKlartext`) |
 * |                                         |   med OCH utan, plus antalet som följer |
 * | "Räkna antal" → count + aria-live       | räkningen följer regeln utan knapp      |
 * |   (knappen är RIVEN, Marcus 2026-08-10) |   (steg 3:s `aria-live`-region)         |
 * | tomt resultat → NEUTRAL text, ej alert  | detaljvyns header + `PublikSektion`     |
 * | axe 0 violations                        | listan (oförändrat) + verkstaden (nytt) |
 * | spara (L3) → syns i sparade-listan      | LÄS-halvan: `get-segments`-raden blir   |
 * |                                         |   ett kort med sin uppräknade regel     |
 *
 * ── VAD SOM MEDVETET INTE ÅTERUPPSTOD (aldrig tyst bortglömt) ────────────
 *
 * 1. SKOOL-EXPORTEN. Den fanns bara i `SegmentBuilder`; `VariantD` bär ingen
 *    export-affordans alls. `src/lib/segment-export.ts` lever kvar och dess
 *    enda konsument är `tests/api/segment-export.test.ts` (api-pure) — CSV:ns
 *    innehåll, dedupen och consent-allokeringen bevisas alltså fortfarande,
 *    men UI-halvan (nedladdningen, "N personer med e-post laddades ner",
 *    "M saknar e-post") har ingen yta att bevisas mot. Den återuppstår först
 *    om/när export byggs in i den promoverade formen.
 * 2. SPARANDETS SKRIVVÄG. `saveSegment` är no-op i `VariantD` (filhuvudet
 *    § READ-ONLY FÖRSTÄRKT) — "Spara segmentet" lägger entiteten i
 *    sid-state och visar en `Prototyp - ingenting sparades`-ruta. Det finns
 *    därmed inget invalidate/refetch-flöde att bevisa. LÄS-halvan (en rad ur
 *    `get-segments` blir ett kort) bevisas nedan; skriv-halvan väntar på den
 *    skarpa mutations-wiringen.
 * 3. DE TRE RADERADE SYSKONFILERNA — `mer-segment-send.acceptance.test.ts`,
 *    `mer-segment-send-aktivitetslogg.acceptance.test.ts` och
 *    `mer-segment-spara-aktivitetslogg.acceptance.test.ts` (7 tester, raderade
 *    i 249.5:s fix-commit `2650b42c`). De drev `SegmentMailCompose` respektive
 *    `useSaveSegment`/`useSendSegmentMail`; INGEN av dem är monterad på
 *    `/mer/segment` längre (`SegmentMailCompose` har efter rivningen noll
 *    konsumenter i `src/routes/**`). `VariantD`s utskicksvy simulerar utfallet
 *    i webbläsaren (`simulera`) och når aldrig `send-email`, så det finns
 *    varken payload-kontrakt, bekräftelse-grind eller aktivitetspost att
 *    observera. De återskapas i samma kort som bygger mutations-wiringen —
 *    inte här, och inte som skippade skal (självtestet tillåter det inte).
 *
 * ── ACCEPTANCE-KLASSEN ───────────────────────────────────────────────────
 *
 * (task-59.5, ADR-080.) **Deterministisk via `network.use()`** — inte
 * `page.route`: page-routes prövas FÖRE MSW:s context-routes och hade lagt en
 * andra avlyssningsmekanism ovanpå fixturvärlden (tudelningen task-54.2 tog
 * bort). Mönstren byggs med `EF(namn)` ur handlers-modulen och svaren med
 * `json(...)`, aldrig som handskrivna strängar — en överskuggning vars mönster
 * inte matchar faller igenom UTAN att något fälls (den tysta fällan,
 * `hermetic.ts` § Överskugga en delad handler).
 *
 * Fixtur-formerna speglar EF:ernas RIKTIGA svar: get-events →
 * `{ events: EventSchema[] }` (adaptern `z.array(EventSchema).parse`),
 * get-segments → `{ segments: SavedSegmentSchema[] }`, compute-segment →
 * `{ members: SegmentMemberSchema[], count }` (`SegmentResultSchema.parse`).
 * Ofullständig rad → parse-fel, så fixturerna är kompletta.
 *
 * `get-segments` ligger i NORMALLÄGET med tom lista (`handlers.ts`) — bara det
 * test som faktiskt äger en sparad rad överskuggar den.
 */

/** Härledd ur schemat, ej beskriven bredvid det (TASK-63) — se `acceptance-bas.ts` § fogen. */
type EventRow = z.infer<typeof EventSchema>;

/** En komplett Event-rad (EF-svarets form, EventSchema). Alla fält närvarande —
 * adaptern .parse():ar mot z.array(EventSchema), så ofullständig rad → parse-fel.
 * `kursfamilj`/`kursniva` (TASK-249.4/249.5) matchar basens verifierade backfill
 * (`course-dimensions.ts`); `byggParInfo` läser dem i stället för den rivna
 * `KURS_KARTA`. */
function ev(
  eventNamn: string | null,
  typ: string | null,
  overrides: Partial<EventRow> = {},
): EventRow {
  return {
    id: `recEV${Math.random().toString(36).slice(2, 10)}`,
    eventlabel: eventNamn,
    eventNamn,
    typ,
    ort: 'Skövde',
    startdatum: '2026-03-01',
    slutdatum: '2026-03-02',
    tidKvarTillEvent: null,
    maxPlatser: 20,
    antalAnmalda: 0,
    platserKvar: 20,
    anmaldBelaggning: 0,
    bekraftadBelaggning: 0,
    antalNyaAnmalningar: 0,
    antalAnmalningsavgifter: 0,
    antalSlutbetalningar: 0,
    antalSlutbetalningFelande: 0,
    status: null,
    ...overrides,
  };
}

/**
 * TAXONOMI-FIXTUREN — SEX par, valda så att varje bevis nedan har något att
 * greppa i:
 *
 *   · de FYRA atomerna `DE_FJORTON_ATOMER` bygger på (Fjärrskådning, RIM 1,
 *     RIM 2, Psionautics) med basens Kursfamilj/Kursnivå satta, så de fjorton
 *     förskapade grupperna faktiskt expanderar till kurspar;
 *   · FÄLLA 35 (`data-model.md` §Kända fällor): naket "Resor i medvetandet"
 *     som FÖRELÄSNING är ett DISTINKT kursnamn skilt från RIM 1/2/3-serien
 *     och får en omisskännlig etikett ur `labelForPar`. Det var det gamla
 *     taxonomi-testets skarpaste assertion och är det här också;
 *   · "Drömtydning" UTAN Kursfamilj — den öppna luckan `OkandaKurser` säger
 *     rakt ut i stället för att låta kursen försvinna tyst ur familj-villkoren.
 *
 * Global `EVENTS_RESPONSE` duger inte: dess kursnamn matchar varken atomerna
 * eller `Modalitet`-enumets råa värden (`typ: 'Utbildning - 2 dagar'` parsar
 * inte som `Modalitet`), så `get-events` överskuggas i varje test.
 */
const TAXONOMI_EVENTS: EventRow[] = [
  ev('Resor i medvetandet 1', 'Utbildning', { kursfamilj: 'RIM', kursniva: 'Nivå 1' }),
  ev('Resor i medvetandet 2', 'Utbildning', { kursfamilj: 'RIM', kursniva: 'Nivå 2' }),
  ev('Fjärrskådning', 'Utbildning', { kursfamilj: 'Fjärrskådning', kursniva: null }),
  ev('Psionautics', 'Utbildning', { kursfamilj: 'Psionautics', kursniva: null }),
  // FÄLLA 35 — distinkt kursnamn, egen etikett.
  ev('Resor i medvetandet', 'Föreläsning', { kursfamilj: 'RIM', kursniva: 'Intro' }),
  // Utan Kursfamilj i basen → `familjFranBas` ger null → `OkandaKurser`.
  ev('Drömtydning', 'Utbildning', { kursfamilj: null, kursniva: null }),
];

function mockEvents(network: NetworkFixture): void {
  network.use(http.get(EF('get-events'), () => json({ events: TAXONOMI_EVENTS })));
}

const KURS_RIM1: Par = { kurs: 'Resor i medvetandet 1', modalitet: 'Utbildning' };
const KURS_RIM2: Par = { kurs: 'Resor i medvetandet 2', modalitet: 'Utbildning' };
const KURS_FS: Par = { kurs: 'Fjärrskådning', modalitet: 'Utbildning' };
const KURS_PS: Par = { kurs: 'Psionautics', modalitet: 'Utbildning' };

/** `namn` är NULLBAR som i `SegmentMemberSchema` — `TASK-213.4` byter basens
 *  `"Ej tillgängligt"`-formel mot `BLANK()`, och den formen måste gå att
 *  fixtursätta i dag (se `NAMNLOSHET_*`-matriserna nedan). */
type FixturPerson = {
  id: string;
  namn: string | null;
  email: string | null;
  ejGodkandMail: boolean;
};

/**
 * ÅTTA PERSONER MED KÄNDA KURSKOMBINATIONER — samma matris som
 * `tests/visual/segment-promoverings-grind.spec.ts` (medvetet: två sviter som
 * räknar mot samma fixturvärld ska få jämförbara tal, och matrisen är redan
 * genomräknad där). `David` bär `ejGodkandMail: true`, den enda av de åtta.
 *
 *   Alice, Bertil → RIM 1                Cecilia, David → RIM 1 + RIM 2
 *   Erika         → RIM 2                Fredrik        → Fjärrskådning
 *   Greta         → Fjärrskådning + RIM 1  Hugo         → Psionautics
 *
 * Talen som faller ut och används nedan:
 *   RIM 1 eller RIM 2 (mallvyns "minst en av")           → 6
 *   samma, minus alla som gått Fjärrskådning             → 5
 *   Fjärrskådning (det sparade segmentets ärvda regel)   → 2
 *   RIM 1 + Psionautics (exakt kombination)              → 0  ← tomläget
 */
const ALICE: FixturPerson = {
  id: 'recSegA001',
  namn: 'Alice Andersson',
  email: 'alice.andersson@example.se',
  ejGodkandMail: false,
};
const BERTIL: FixturPerson = {
  id: 'recSegA002',
  namn: 'Bertil Berg',
  email: 'bertil.berg@example.se',
  ejGodkandMail: false,
};
const CECILIA: FixturPerson = {
  id: 'recSegA003',
  namn: 'Cecilia Cederqvist',
  email: 'cecilia.cederqvist@example.se',
  ejGodkandMail: false,
};
const DAVID: FixturPerson = {
  id: 'recSegA004',
  namn: 'David Dahl',
  email: 'david.dahl@example.se',
  ejGodkandMail: true,
};
const ERIKA: FixturPerson = {
  id: 'recSegA005',
  namn: 'Erika Ek',
  email: 'erika.ek@example.se',
  ejGodkandMail: false,
};
const FREDRIK: FixturPerson = {
  id: 'recSegA006',
  namn: 'Fredrik Falk',
  email: 'fredrik.falk@example.se',
  ejGodkandMail: false,
};
const GRETA: FixturPerson = {
  id: 'recSegA007',
  namn: 'Greta Grahn',
  email: 'greta.grahn@example.se',
  ejGodkandMail: false,
};
const HUGO: FixturPerson = {
  id: 'recSegA008',
  namn: 'Hugo Hall',
  email: 'hugo.hall@example.se',
  ejGodkandMail: false,
};

type Narvaro = { person: FixturPerson; kurser: Par[] };

const ATTENDANCE: Narvaro[] = [
  { person: ALICE, kurser: [KURS_RIM1] },
  { person: BERTIL, kurser: [KURS_RIM1] },
  { person: CECILIA, kurser: [KURS_RIM1, KURS_RIM2] },
  { person: DAVID, kurser: [KURS_RIM1, KURS_RIM2] },
  { person: ERIKA, kurser: [KURS_RIM2] },
  { person: FREDRIK, kurser: [KURS_FS] },
  { person: GRETA, kurser: [KURS_FS, KURS_RIM1] },
  { person: HUGO, kurser: [KURS_PS] },
];

/**
 * NAMNLÖSHETENS TVÅ FORMER — [TASK-264] egen fixturvärld, DEN DELADE ÄR ORÖRD.
 *
 * `ATTENDANCE` ovan speglar `tests/visual/segment-promoverings-grind.spec.ts`
 * person för person, medvetet (samma matris ⇒ jämförbara tal). Namnlösheten
 * får därför INTE bakas in där — den bor i egna matriser som bara de två
 * testerna nedan väljer, via `gotoSegmentytan`s tredje argument.
 *
 * Formerna som måste tålas, båda med belägg:
 *
 *   1. `'Ej tillgängligt'` — basens formel `IF(AND(Förnamn="", Efternamn=""),
 *      "Ej tillgängligt", …)` (`fldnYys0Ac3UGOdpe`, fälla 43). En ICKE-TOM
 *      sträng, så en falsy-fallback är död kod mot den. 154 av 247 mottagare
 *      i den publik Marcus granskade 2026-08-17 bär den.
 *   2. `null` / `'   '` — formen `TASK-213.4` byter till (`BLANK()`).
 *      Framtidssäkring: utan den grenen hade bas-fixen gjort "Hej Ej," till
 *      "Hej (namn,".
 *
 * ALLA GÅR RIM 1 + RIM 2 och inget annat, så de faller ut ur den förskapade
 * gruppen "RIM 1 + RIM 2" (en EXAKT kombination — övriga atomer exkluderas).
 * Det är samma väg in i utskicksvyn som visual-grinden använder.
 *
 * ORDNINGEN ÄR EN DEL AV BEVISET: den namnlösa står FÖRST, alltså på den plats
 * `mottagare[0]` läser. Blir hon exemplet är valet inte gjort.
 */
function namnlos(id: string, namn: string | null): FixturPerson {
  return { id, namn, email: `${id.toLowerCase()}@example.se`, ejGodkandMail: false };
}

const NAMNLOSHET_BLANDAT: Narvaro[] = [
  { person: namnlos('recSegN001', 'Ej tillgängligt'), kurser: [KURS_RIM1, KURS_RIM2] },
  { person: namnlos('recSegN002', null), kurser: [KURS_RIM1, KURS_RIM2] },
  { person: namnlos('recSegN003', 'Cecilia Cederqvist'), kurser: [KURS_RIM1, KURS_RIM2] },
  { person: namnlos('recSegN004', 'David Dahl'), kurser: [KURS_RIM1, KURS_RIM2] },
];

const NAMNLOSHET_ALLA: Narvaro[] = [
  { person: namnlos('recSegN101', 'Ej tillgängligt'), kurser: [KURS_RIM1, KURS_RIM2] },
  { person: namnlos('recSegN102', null), kurser: [KURS_RIM1, KURS_RIM2] },
  // Rent blanksteg — samma tomtillstånd som `null`, en annan väg dit.
  { person: namnlos('recSegN103', '   '), kurser: [KURS_RIM1, KURS_RIM2] },
];

function harPar(kurser: readonly Par[], mal: Par): boolean {
  return kurser.some((p) => p.kurs === mal.kurs && p.modalitet === mal.modalitet);
}

/**
 * DNF-MEDVETEN, precis som servern (ADR-115). `VariantD` skickar sedan
 * TASK-249.5 EN `SegmentRuleDnf` per fråga (`predikatTillDnfRegel`): ett
 * `include`-element är antingen ett enkelt `Par` (OR) eller en Konjunkt-grupp
 * (`Par[]`, AND). `uppfyllerVillkor` speglar `_shared/segment-membership.ts`
 * `matchedViaPars` — en grupp kräver ALLA sina par samtidigt.
 *
 * Är den gamla filens `mockCompute` (samma N oavsett regel) medvetet ersatt:
 * varje bevis nedan asserterar ett TAL, och ett hårdkodat svar hade gjort talet
 * till en egenskap hos mocken i stället för hos regeln. Handlern läser
 * `request.json()` och svarar olika beroende på VILKEN regel som frågas —
 * samma form som `segment-promoverings-grind.spec.ts` etablerade.
 *
 * Ingen ATTENDANCE-rad bär `period`, och inget scenario nedan väljer en
 * tidsperiod, så mocken behöver inte filtrera på det.
 */
function uppfyllerVillkor(kurser: readonly Par[], villkor: Par | Par[]): boolean {
  return Array.isArray(villkor)
    ? villkor.every((par) => harPar(kurser, par))
    : harPar(kurser, villkor);
}

function mockComputeSegment(network: NetworkFixture, matris: Narvaro[] = ATTENDANCE): void {
  network.use(
    http.post(EF('compute-segment'), async ({ request }) => {
      const rule = (await request.json()) as { include: (Par | Par[])[]; exclude: Par[] };
      const members = matris
        .filter(
          ({ kurser }) =>
            rule.include.some((villkor) => uppfyllerVillkor(kurser, villkor)) &&
            !rule.exclude.some((par) => harPar(kurser, par)),
        )
        .map(({ person }) => ({
          id: person.id,
          namn: person.namn,
          email: person.email,
          ejGodkandMail: person.ejGodkandMail,
        }));
      return json({ members, count: members.length });
    }),
  );
}

/** Grundnavigeringen: taxonomin + medlemsmotorn mockade, sedan segment-ytan.
 *  `narvaro` byter ut medlemsmotorns fixturvärld utan att röra den delade
 *  matrisen — mocken måste ligga FÖRE `page.goto`, annars hinner listans egna
 *  räkningar landa i query-cachen mot fel svar. */
async function gotoSegmentytan(
  page: Page,
  network: NetworkFixture,
  narvaro: Narvaro[] = ATTENDANCE,
): Promise<void> {
  mockEvents(network);
  mockComputeSegment(network, narvaro);
  await page.goto('/mer/segment');
  await expect(page.getByRole('heading', { level: 1, name: 'Segment' })).toBeVisible();
  await expect(page.getByTestId('segment-listan')).toBeVisible();
}

/** Väntar in att SAMTLIGA `compute-segment`-frågor på sidan landat —
 *  "Räknar…"/"Räknar personer…"/"Räknar täckningen…" delar ordstammen. */
async function vantaInRakningar(page: Page): Promise<void> {
  await expect(page.getByText(/Räknar/)).toHaveCount(0);
}

/**
 * KLICKAR ETT RadioGroup-VAL VIA DESS SYNLIGA ETIKETTEXT, INTE VIA
 * `getByRole('radio')`. `@/components/primitives/RadioGroup`s react-aria-`Radio`
 * lägger rollen på en visuellt dold input och renderar en dekorativ
 * prick-`<span>` inuti sin egen `<label>`; ett rollbaserat klick slår därför i
 * praktiken alltid fast i "element intercepts pointer events" och timeoutar
 * (mätt 2026-08-17 under TASK-249.5:s grind-bygge). Samma kringgång som den
 * raderade filens `choosePar` och som `segment-promoverings-grind.spec.ts`
 * § `klickRadioText`. `exact: true` eftersom flera etiketter annars är
 * substrängar av varandra.
 */
function klickRadio(scope: Page | Locator, etikett: string): Promise<void> {
  return scope.getByText(etikett, { exact: true }).click();
}

/** Ett stegkort (`StegSektion`) — `<section aria-labelledby>` med sr-only-numret
 *  i rubriken, alltså rollen `region` med namnet "Steg N: Rubrik". Det är
 *  ytornas enda stabila scope-handtag när samma kontroll finns i två steg. */
function steg(page: Page, nummer: number, rubrik: string): Locator {
  return page.getByRole('region', { name: `Steg ${nummer}: ${rubrik}` });
}

test.describe('Segment-yta (Fas 6g L2, promoverad TASK-249.5)', () => {
  /**
   * MALLVYN — steg-grinden och klartext-speglingen i mallens form.
   *
   * ERSÄTTER det gamla "tom-regel-grind"-testet (include=[] → "Räkna antal"
   * disabled + "Välj minst en kurs att inkludera."). Grinden finns kvar, men
   * som stegvis ledtext i stället för en låst knapp: steg 2 VILAR tills
   * modaliteten valts, och steg 3 säger vad som saknas. Skapa-knappen finns
   * inte alls förrän valen är kompletta — en yta som inte kan tryckas fel.
   */
  test('mallvyn: stegen grindar tomt val, färdigt val ger mening + antal', async ({
    page,
    network,
  }) => {
    await gotoSegmentytan(page, network);
    await vantaInRakningar(page);

    await page.getByRole('button', { name: 'Nytt segment' }).click();
    await expect(page.getByTestId('nytt-segment-mallvyn')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'Nytt segment' })).toBeVisible();

    // TOM-REGEL-GRINDEN, mallvyns form: inget val gjort ⇒ steg 2 vilar och
    // steg 3 säger vad som fattas. Ingen skapa-knapp att trycka på.
    await expect(steg(page, 2, 'Vilka ska ingå?')).toContainText(
      'Välj först vilka som räknas med.',
    );
    await expect(steg(page, 3, 'Det här blir segmentet')).toContainText(
      'Gör valen ovan, så visas segmentet här.',
    );
    await expect(page.getByRole('button', { name: 'Skapa segmentet' })).toHaveCount(0);

    await klickRadio(page, 'De som gått utbildningar');
    await klickRadio(page, 'Alla som gått minst en av utbildningarna');
    await page.getByRole('button', { name: 'RIM 1', exact: true }).click();
    await page.getByRole('button', { name: 'RIM 2', exact: true }).click();

    await vantaInRakningar(page);
    // KLARTEXT-SPEGLINGEN: meningen genereras UR valet (`malMening`), och
    // antalet räknas mot samma DNF-regel som skickas till servern.
    const steg3 = steg(page, 3, 'Det här blir segmentet');
    await expect(steg3).toContainText('Har gått minst en av RIM 1 och RIM 2.');
    await expect(steg3).toContainText('6 personer i det här segmentet.');
    await expect(page.getByRole('button', { name: 'Skapa segmentet' })).toBeEnabled();
  });

  /**
   * VERKSTADEN — taxonomin renderas, och de två fällorna sägs rakt ut.
   *
   * ERSÄTTER det gamla "taxonomi renderas (inkl. fälla-35-etikett distinkt)"-
   * testet. Den gamla ytan gav varje par en egen `RadioGroup` vars aria-label
   * var `labelForPar(par)`; VariantD bygger i stället predikat över
   * dimensioner, och `labelForPar` överlever i villkorskortets "Träffar N av M
   * …"-rad — som därmed är den yta där taxonomin syns par för par.
   */
  test('verkstaden: taxonomin renderas par för par, fälla-35-etiketten distinkt, okänd familj sägs rakt ut', async ({
    page,
    network,
  }) => {
    await gotoSegmentytan(page, network);
    await vantaInRakningar(page);

    await page.getByRole('button', { name: 'Nytt segment' }).click();
    await page.getByRole('button', { name: 'Bygg med egna villkor' }).click();

    const verkstaden = page.getByTestId('verkstaden');
    await expect(verkstaden).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'Nytt segment' })).toBeVisible();

    // DEN ÖPPNA LUCKAN, SAGD RAKT UT: "Drömtydning" saknar Kursfamilj i basen
    // och matchar därför inget familj-villkor. Utan `OkandaKurser` hade kursen
    // försvunnit tyst ur varje regel.
    await expect(verkstaden).toContainText('Utbildningar utan familj i basen');
    await expect(verkstaden).toContainText(
      'Drömtydning saknar Kursfamilj på sin(a) Eventplanering-rad(er), och matchar därför inget familj-villkor.',
    );

    // "Båda" utan familj-/nivåval träffar HELA taxonomin — sex par i
    // `deriveTaxonomy`s deterministiska ordning, var och en med sin
    // `labelForPar`-etikett.
    await klickRadio(steg(page, 1, 'Vilka ska ingå?'), 'Båda');
    await expect(verkstaden).toContainText('Träffar 6 av 6 event:');
    await expect(verkstaden).toContainText('Drömtydning (utbildning)');
    await expect(verkstaden).toContainText('Resor i medvetandet 1 (utbildning)');
    await expect(verkstaden).toContainText('Resor i medvetandet 2 (utbildning)');
    // FÄLLA 35: det nakna kursnamnet som föreläsning bär en OMISSKÄNNLIG
    // etikett, skild från RIM-serien. Detta var det gamla testets kärna.
    await expect(verkstaden).toContainText(
      'Resor i medvetandet - fristående föreläsning (ej del 1/2/3)',
    );
  });

  /**
   * VERKSTADEN — klartext-speglingen och räkningen, med OCH utan.
   *
   * ERSÄTTER två gamla tester på en gång: "include/exclude uppdaterar
   * klartext-speglingen" och "'Räkna antal' → count visas; aria-live".
   * Räkna-knappen är RIVEN (Marcus 2026-08-10) — hamrings-skyddet bor i
   * frågans cache-nyckel i stället — så beviset är att TALET FÖLJER REGELN:
   * utan-villkoret drar bort Greta (Fjärrskådning + RIM 1) och 6 blir 5.
   * Talet står i steg 3:s monterade `aria-live`-region.
   */
  test('verkstaden: klartexten och antalet följer både med- och utan-villkoret', async ({
    page,
    network,
  }) => {
    await gotoSegmentytan(page, network);
    await vantaInRakningar(page);

    await page.getByRole('button', { name: 'Nytt segment' }).click();
    await page.getByRole('button', { name: 'Bygg med egna villkor' }).click();
    await expect(page.getByTestId('verkstaden')).toBeVisible();

    const steg1 = steg(page, 1, 'Vilka ska ingå?');
    const steg2 = steg(page, 2, 'Ska några räknas bort?');
    const steg3 = steg(page, 3, 'Det här blir segmentet');

    // TOM-REGEL-GRINDEN, verkstadens form. Ett nyskapat villkor bär INGEN
    // modalitet — säkerhetskravet (filhuvudet i `VariantD.tsx` § MODALITET ÄR
    // OBLIGATORISK: "det finns material som är direkt olämpligt att skicka
    // till människor som enbart gått föreläsning"), så steg 3 pekar på det
    // val som saknas i stället för att räkna. Detta är den branch som möter en
    // orörd verkstad; "Bygg minst ett villkor ovan…" hör till en regel UTAN
    // villkor alls, ett läge man bara når genom att ta bort det sista.
    await expect(steg3).toContainText(
      'Ett villkor saknar valet av vad som räknas (Räknas som) och används inte.',
    );

    // MED: RIM som utbildning ⇒ RIM 1 + RIM 2 (föreläsnings-paret faller på
    // modaliteten). Sex personer har gått minst en av dem.
    await klickRadio(steg1, 'De som gått utbildningar');
    // FAMILJ-CHIPPETS TILLGÄNGLIGA NAMN BÄR TRÄFF-ANTALET UTAN MELLANSLAG:
    // `{familj}<span>{antal}</span>` ger "RIM3", inte "RIM 3" — accname-
    // algoritmen skarvar ihop syskonnoderna utan att lägga till whitespace
    // (mätt mot sidans egen ariaSnapshot 2026-08-17). Mönstret matchar därför
    // siffran uttryckligen i stället för att anta ett ordgräns-mellanslag, och
    // binder sig inte vid ett visst antal.
    await steg1
      .getByRole('group', { name: 'Familj' })
      .getByRole('button', { name: /^RIM\d+$/ })
      .click();
    await vantaInRakningar(page);
    await expect(steg3).toContainText('Har gått RIM.');
    await expect(steg3).toContainText('6 personer i det här segmentet.');

    // UTAN: Fjärrskådning dras bort sist. Greta räknades in via RIM 1 men
    // har också gått Fjärrskådning ⇒ 6 → 5.
    await steg2.getByRole('button', { name: 'Lägg till villkor' }).click();
    await klickRadio(steg2, 'De som gått utbildningar');
    await steg2
      .getByRole('group', { name: 'Familj' })
      .getByRole('button', { name: /^Fjärrskådning\d+$/ })
      .click();
    await vantaInRakningar(page);
    await expect(steg3).toContainText('Har gått RIM. Utan: Har gått Fjärrskådning.');
    await expect(steg3).toContainText('5 personer i det här segmentet.');

    // A11Y-GOLVET PÅ DEN YTA DÄR REGELN BYGGS (11 utan undantag). Den gamla
    // filens axe-test skannade `SegmentBuilder` EFTER en interaktion, av
    // samma skäl: klartext-speglingen och de aktiva kontrollerna ska vara med
    // i scanet, inte bara den orörda vyn.
    const resultat = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(resultat.violations).toEqual([]);
  });

  /**
   * DETALJVYN — tomt resultat är NEUTRALT, aldrig ett feltillstånd.
   *
   * ERSÄTTER "tomt resultat (count===0) → NEUTRAL text, ej role=alert".
   * Fälla #34 oförändrad: golvet (Närvaropoäng=1) lättas inte, och noll
   * träffar är en ärlig signal — inte ett fel. "RIM 1 + Psionautics" är en av
   * de fjorton förskapade grupperna vars exakta kombination ingen i
   * fixturvärlden har, så tomläget uppstår ur REGELN, inte ur en tom fixtur.
   */
  test('detaljvyn: 0 träffar renderas neutralt, aldrig som ett fel', async ({ page, network }) => {
    await gotoSegmentytan(page, network);
    await vantaInRakningar(page);

    await page.getByRole('button', { name: 'RIM 1 + Psionautics', exact: true }).click();

    const detalj = page.getByTestId('segment-detaljvyn');
    await expect(detalj).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 1, name: 'RIM 1 + Psionautics' }),
    ).toBeVisible();
    await vantaInRakningar(page);

    // Talet står på TVÅ ställen — headerns sammanfattning och publikens
    // tomläge — och båda är neutrala.
    await expect(detalj.getByText('0 personer ännu')).toHaveCount(2);
    const publiken = page.getByRole('region', { name: 'Publiken' });
    await expect(publiken).toContainText('0 personer ännu');
    await expect(publiken).toContainText(
      'Närvaron för de utbildningar regeln träffar är inte avstämd i basen - publiken fylls av sig själv när den blir det.',
    );

    // ÄRLIG SIGNAL, INTE ETT FELTILLSTÅND.
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  /**
   * LISTAN — en sparad rad ur basen blir ett kort med sin egen regel.
   *
   * ERSÄTTER LÄS-HALVAN av "spara (L3): bygg regel → namnge → spara → syns i
   * sparade-listan". Skriv-halvan har ingen yta kvar (`saveSegment` är no-op,
   * se filhuvudet § VAD SOM MEDVETET INTE ÅTERUPPSTOD punkt 2). Det som
   * bevisas här är migrations-sömmen: en rad i den ÄLDRE uppräknade formen
   * (`arvdRegel`, `predikat === null`) renderas med `labelForPar`-klartext och
   * räknas mot samma motor som predikat-segmenten.
   *
   * CI-FIXTURFILTRET ÄR EN DEL AV BEVISET: staging-basens `Segment` bär
   * acceptance-svitens egna `app-segment-test+<uuid>`-rader (TASK-87:s
   * purge-target hinner inte alltid emellan), och de får inte synas som
   * innehåll när formen bedöms.
   */
  test('listan: sparad rad ur basen renderas med sin uppräknade regel; CI-fixturerna filtreras bort', async ({
    page,
    network,
  }) => {
    network.use(
      http.get(EF('get-segments'), () =>
        json({
          segments: [
            {
              id: 'recSAVED1',
              namn: 'FS-utbildningsdeltagare',
              rule: { include: [KURS_FS], exclude: [] },
              definition: 'Med: deltog i Fjärrskådning (utbildning).',
            },
            {
              id: 'recSAVEDci',
              namn: 'app-segment-test+7f3c1a2e',
              rule: { include: [KURS_PS], exclude: [] },
              definition: null,
            },
          ],
        }),
      ),
    );

    await gotoSegmentytan(page, network);
    await vantaInRakningar(page);

    const kort = page.getByRole('listitem').filter({ hasText: 'FS-utbildningsdeltagare' });
    await expect(kort).toHaveCount(1);
    // Klartexten kommer ur den ÄRVDA regeln via `labelForPar` — samma
    // etikettkälla som taxonomi-testet ovan asserterar.
    await expect(kort).toContainText('Fjärrskådning (utbildning).');
    // Antalet räknas: Fredrik och Greta har gått Fjärrskådning.
    await expect(kort).toContainText('2 personer');

    await expect(page.getByText(/app-segment-test/)).toHaveCount(0);
  });

  /**
   * [TASK-264] UTSKICKSVYN — NAMNLÖSA I PUBLIKEN, BLANDAT MED NAMNGIVNA.
   *
   * Bevisar två av kortets tre led i det läge som faktiskt råder i prod: en
   * publik där majoriteten saknar namn men någon har det.
   *
   *   · LED 2 — exemplet VÄLJS. `mottagare[0]` är här den sentinel-namnlösa,
   *     alltså exakt den person den gamla koden exemplifierade med ("som Ej
   *     tillgängligt får det", och "Hej Ej," i brödtexten). Efter valet står
   *     Cecilia där, och `{förnamn}` visar vad platshållaren faktiskt gör.
   *   · LED 3 — publiken säger talet öppet, räknat ur BÅDA namnlösa formerna
   *     (sentinel + `null`), inte bara den ena.
   */
  test('utskicksvyn: exemplet väljer en namngiven mottagare, publiken säger hur många som saknar namn', async ({
    page,
    network,
  }) => {
    await gotoSegmentytan(page, network, NAMNLOSHET_BLANDAT);
    await vantaInRakningar(page);

    await page.getByRole('button', { name: 'RIM 1 + RIM 2', exact: true }).click();
    await vantaInRakningar(page);
    // TASK-390 punkt 1 (Marcus 2026-09-04): "Skicka" → "Gör ett utskick" —
    // en explicit synlighets-assertion på den NYA texten, inte bara
    // klick-lokatorns implicita namnmatchning.
    const utskicksKnapp = page.getByRole('button', {
      name: 'Gör ett utskick till det här segmentet',
    });
    await expect(utskicksKnapp).toBeVisible();
    await utskicksKnapp.click();
    await expect(page.getByRole('heading', { level: 1, name: 'Utskick' })).toBeVisible();
    await vantaInRakningar(page);

    const utskicksvyn = page.getByTestId('utskicksvyn');
    await expect(page.getByText('Utskick till 4 personer.')).toBeVisible();

    // LED 3: talet är DYNAMISKT (2 av 4), och räknar sentinel-formen lika väl
    // som `null`-formen.
    await expect(page.getByRole('region', { name: 'Publiken' })).toContainText(
      '2 av 4 saknar registrerat namn.',
    );

    // LED 2: exemplet är den namngivna, inte `mottagare[0]`.
    await expect(utskicksvyn).toContainText(
      'Förhandsvisningsexempel - som Cecilia Cederqvist får det',
    );
    // BRÖDTEXTEN SCOPAS, aldrig hela vyn: `Meddelande`-fältet bär mallen
    // `Hej {förnamn},` och hade gjort varje negativ assertion nedan svagare
    // än den ser ut.
    const brodtext = page.getByTestId('forhandsvisning-brodtext');
    await expect(brodtext).toContainText('Hej Cecilia,');

    // DE TVÅ UTFALL SOM ALDRIG FÅR ÅTERKOMMA — platshållartexten som namn,
    // i etiketten respektive i hälsningen.
    await expect(utskicksvyn).not.toContainText('som Ej tillgängligt får det');
    await expect(brodtext).not.toContainText('Hej Ej,');
  });

  /**
   * [TASK-264] UTSKICKSVYN — INGEN I PUBLIKEN HAR ETT NAMN.
   *
   * Led 1 i sin renaste form, och led 2:s neutrala gren. Det finns ingen
   * namngiven att exemplifiera med, så hälsningen måste stå på egna ben.
   *
   * BÅDA FRAMTIDA FELFORMERNA ASSERTERAS BORTA, inte bara dagens: "Hej Ej,"
   * är utfallet med basens nuvarande formel, "Hej (namn," det `TASK-213.4`
   * hade gett om `visatNamn`s fallback-sträng fortsatt plockas isär med
   * `split(' ')`. Fixturen bär därför BÅDA formerna samtidigt.
   */
  test('utskicksvyn: ingen namngiven mottagare ger generisk hälsning och neutralt exempel', async ({
    page,
    network,
  }) => {
    await gotoSegmentytan(page, network, NAMNLOSHET_ALLA);
    await vantaInRakningar(page);

    await page.getByRole('button', { name: 'RIM 1 + RIM 2', exact: true }).click();
    await vantaInRakningar(page);
    // TASK-390 punkt 1 (Marcus 2026-09-04): "Skicka" → "Gör ett utskick" —
    // en explicit synlighets-assertion på den NYA texten, inte bara
    // klick-lokatorns implicita namnmatchning.
    const utskicksKnapp = page.getByRole('button', {
      name: 'Gör ett utskick till det här segmentet',
    });
    await expect(utskicksKnapp).toBeVisible();
    await utskicksKnapp.click();
    await expect(page.getByRole('heading', { level: 1, name: 'Utskick' })).toBeVisible();
    await vantaInRakningar(page);

    const utskicksvyn = page.getByTestId('utskicksvyn');
    await expect(page.getByText('Utskick till 3 personer.')).toBeVisible();

    // LED 3: hela publiken saknar namn, och det sägs.
    await expect(page.getByRole('region', { name: 'Publiken' })).toContainText(
      '3 av 3 saknar registrerat namn.',
    );

    // LED 2, neutrala grenen: ingen person pekas ut som exempel.
    await expect(utskicksvyn).toContainText(
      'Förhandsvisningsexempel - ingen i publiken har ett registrerat namn',
    );

    // LED 1: hälsningen är GENERISK. Mallen är `Hej {förnamn},` — kommat följer
    // med namnet ut, annars hade det stått "Hej ,". Scopat till brödtexten:
    // `Meddelande`-fältet bär fortfarande mallen med sin platshållare, och en
    // negativ assertion mot hela vyn hade därför bevisat mindre än den ser ut.
    const brodtext = page.getByTestId('forhandsvisning-brodtext');
    await expect(brodtext).toContainText('Hej!');
    await expect(brodtext).not.toContainText('Hej Ej,');
    await expect(brodtext).not.toContainText('Hej (namn,');
    await expect(brodtext).not.toContainText('Hej ,');
    // Platshållaren är HANTERAD, inte kvarlämnad i förhandsvisningen — och
    // `ofyllda`-varningen ska därför inte fälla på den.
    await expect(brodtext).not.toContainText('{förnamn}');
    await expect(page.getByText('Något i texten kunde inte fyllas i')).toHaveCount(0);
  });

  /**
   * A11Y-GOLVET PÅ LANDNINGSVYN (11 utan undantag). Behållen oförändrad i sak
   * från TASK-249.5:s flipp-commit — den enda skillnaden är fixturen, som nu
   * är filens gemensamma.
   */
  test('axe 0 violations på den promoverade segment-ytan', async ({ page, network }) => {
    await gotoSegmentytan(page, network);
    await vantaInRakningar(page);

    const resultat = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(resultat.violations).toEqual([]);
  });
});
