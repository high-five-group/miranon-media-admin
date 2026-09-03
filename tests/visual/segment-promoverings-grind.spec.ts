import type { NetworkFixture } from '@msw/playwright';
import { http } from 'msw';
import type { Par } from '../../src/domain/schemas';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from '../support/fixturvarld/hermetic';

/**
 * PROMOVERINGS-GRINDEN (TASK-249.1, ADR-103 B4) — ariaSnapshot-referenser
 * för segment-ytan, FÅNGADE UR VARIANT D-LÄGET, FÖRE NÅGON FLIP.
 *
 * Sjätte spec-filen i den befintliga aria-grind-klassen, efter
 * åtgärdssidans/dörrlistans/eventsidans/hem-spaltens/persondetaljens/
 * personers mönster. Facit-manifestet (`tasks/sessions/bilagor/
 * s104-segment-divergens/facit.json`, godkänt av Marcus 2026-08-17, sha
 * a40f3543) deklarerar SJU ytor, SAMTLIGA med `bilder: []` — bevisformen
 * ÄR ariaSnapshot-referenserna denna fil fångar (facitets egen "not"-fält
 * på varje yta, ADR-102 B5). ADR-115 äger regelspråket (AND-primitiven,
 * partitionen som generator, täckningen som kvittens) som ytorna nedan
 * övar.
 *
 * ORDNINGEN VAR ENKELRIKTAD, OCH ÄR NU GENOMFÖRD. När referenserna låstes
 * renderades `VariantD` bara under `import.meta.env.DEV && variant === 'd'`
 * (`src/routes/_authenticated/mer/segment.tsx`), så FÖRE-läget upphörde att
 * existera i samma stund villkoret flippades — därför låstes de i EN EGEN
 * commit före flippen, exakt som `persondetalj-promoverings-grind.spec.ts`
 * (77bc2ada) och `personer-promoverings-grind.spec.ts` (46c03f6c) redan
 * etablerat. Flippen landade i TASK-249.5 och rivningen i TASK-249.6;
 * routen monterar sedan dess `VariantD` ovillkorligt, och testerna nedan
 * navigerar därför till `/mer/segment` utan variantparameter.
 *
 * VARFÖR ARIASNAPSHOT OCH INTE PIXLAR (ADR-103 B4): deterministiskt, noll
 * nya beroenden, jämför STRUKTUR + TILLGÄNGLIGT NAMN. Särskilt relevant
 * här: facit.json:s egen "not" på `segment-listan` säger uttryckligen att
 * `Playwright`-screenshots TIMEOUTAR KONSEKVENT på den här ytan (S104 Del
 * 7, lesson-kandidat 11) — ariaSnapshot är alltså inte bara det vanliga
 * förstahandsvalet här, det är den enda formen som fungerar alls.
 *
 * TESTID-AVGRÄNSNINGEN (kortets AC #3, s93-atgardssida-mönstret,
 * `atgardssida-promoverings-grind.spec.ts` § `granskning-yta`): SEX av de
 * sju testid-scopen nedan (`segment-listan`, `tackningsvyn`, `verkstaden`,
 * `nytt-segment-mallvyn`, `generatorn`, `utskicksvyn`) utesluter
 * `PrototypRigg`/`SkalprovsVaxel` STRUKTURELLT — instrumenten är
 * omplacerade till egna syskon-noder UTANFÖR testid-divven i
 * `VariantD.tsx` (se ankar-kommentarerna vid varje `data-testid` där), så
 * en `toMatchAriaSnapshot()` scopad till dem kan aldrig fånga riggen. Ingen
 * av dessa sex tester klickar någonsin på en rigg-kontroll.
 *
 * DEN SJUNDE — `segment-detaljvyn` — VAR ETT KÄNT, RAPPORTERAT UNDANTAG,
 * OCH ÄR UPPLÖST AV RIVNINGEN (TASK-249.6, 2026-08-17).
 *
 * `SkalprovsVaxel` satt i `PublikSektion` mitt i SAMMA `<div>` som
 * `ToggleButtonGroup`/`Input` ("VÄXELN BOR DÄR PUBLIKEN BOR, sist bland
 * dess kontroller"), inte som ett efterföljande syskon. En ariaSnapshot-
 * lokator scopar till ETT sammanhängande subträd och kan inte hoppa över
 * ett mittensyskon; att FLYTTA växeln för att lösa det hade ändrat en redan
 * godkänd (facit.json, sha a40f3543) DOM-position — exakt den sortens
 * ändring `ADR-102` (prototypen ÄR facit) förbjuder lika hårt som att ändra
 * formen självt. De två `segment-detaljvyn`-referenserna bar därför växeln
 * synligt, med sin egen "Prototyp-rigg."-text.
 *
 * NÄR VÄXELN REVS I STÄLLET FÖR FLYTTADES försvann de noderna utan att
 * formen rördes, och `children: 'contain'` (se nedan) kräver att
 * referensens noder FINNS — de två filerna omgenererades därför i
 * rivnings-committen, med Marcus kvittens 2026-08-17, och ENDAST de två.
 * Övriga tolv referenser är byte-identiska genom rivningen; skillnaden i de
 * två nya är uteslutande växelns frånvaro — `ToggleButtonGroup`, `Input`,
 * publiklistan och regeldelen står rad för rad oförändrade. Det är beviset
 * ADR-103 efterfrågar: rivningen tog en växel, aldrig formen.
 *
 * RÖTT-FÖRST-BEVISET FÖR AVGRÄNSNINGEN (kortets AC #4), OCH EN VIKTIG
 * PRECISERING AV VAD DET FAKTISKT BEVISAR: `toMatchAriaSnapshot()` matchar
 * i Playwrights DEFAULT-läge (`children: 'contain'`, ej `'equal'`/
 * `'deep-equal'` — verifierat mot Playwrights egen dokumentation under
 * bygget) en ORDNAD DELSEKVENS, inte en exakt fullständig mängd — extra
 * syskon-noder UTANFÖR det som listas i referensen FÄLLER ALLTSÅ INTE
 * grinden, oavsett var de sitter. Skarpt prövat: `SkalprovsVaxel` flyttades
 * TILLFÄLLIGT tillbaka in i `segment-listan`s testid-scope, och
 * `segment-listan`-testet förblev GRÖNT mot den redan låsta (rigg-fria)
 * referensen — bevisat via en direkt `getByTestId('segment-listan').
 * ariaSnapshot()`-dump (utanför `toMatchAriaSnapshot`) som bekräftade att
 * riggens "Prototyp-rigg."/"Skalprov: fyll publiken till 85 personer"-text
 * FAKTISKT låg inom scopet trots det gröna testresultatet. Ändringen
 * reverterades omedelbart efteråt (arbetsträdet är rent, `git status`
 * verifierat).
 *
 * TESTID-AVGRÄNSNINGENS VERKLIGA FUNKTION ÄR DÄRFÖR EN ANNAN ÄN "annars
 * fäller testet": den avgör vad som BAKAS IN i referensfilen när den FÖRST
 * genereras (`--update-snapshots` snapshotar den FAKTISKA, levande DOM:en
 * — en orörd `SkalprovsVaxel` i scopet hade blivit en PERMANENT del av
 * facit-artefakten, synlig för varje granskare av `.aria.yml`-filen, exakt
 * den kontaminering AC #3 uttryckligen ber om att undvika). Sex av sju
 * referenser nedan är därför rigg-fria eftersom den fångades UR en DOM där
 * riggen strukturellt aldrig var en del av scopet — inte för att en
 * kvarlämnad rigg skulle ha fällt testet i efterhand. `segment-detaljvyn`s
 * dokumenterade undantag (ovan) står därmed på fastare grund än det
 * ursprungligen framställdes: att låta `SkalprovsVaxel` synas där bryter
 * INGEN mekanisk grind, bara den läsbarhets-/renlighetsnorm de andra sex
 * ytorna följer.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * FIXTURVÄRLDEN — en liten, HELT KONTROLLERAD kurs-/deltagandevärld
 *
 * Global `EVENTS_RESPONSE` (`fixture-data.ts`) duger inte: dess tre event
 * ("Utbildning Skövde" m.fl.) matchar varken `KURS_KARTA`s kursnamn
 * (`VariantD.tsx`) eller `Modalitet`-enumets råa värden (`typ: 'Utbildning
 * - 2 dagar'` parsar inte som `Modalitet`). `get-events` överskuggas
 * därför lokalt (`mockEvents`) med FYRA event som matchar `KURS_KARTA`
 * exakt: Fjärrskådning, Resor i medvetandet 1/2, Psionautics — samma fyra
 * atomer som `DE_FJORTON_ATOMER` i `VariantD.tsx`.
 *
 * `compute-segment` överskuggas (`mockComputeSegment`) med en ÄKTA
 * mängdlogik-handler (union av `include`, minus union av `exclude`) över
 * ÅTTA fixturpersoner (`ATTENDANCE`) — INGEN av räkningarna nedan är
 * hårdkodade svar per fråga (till skillnad från `mer-segment.acceptance.
 * test.ts`s `mockCompute`, som alltid svarar samma N oavsett regel): denna
 * handler läser `request.json()` och svarar olika beroende på VILKEN regel
 * som frågas, exakt som en riktig EF. Räkningarna är DÄRFÖR EGNA, INTE
 * Skool-bilagans juli-2026-facit (`DE_FJORTON_DATA` i `VariantD.tsx`). Så
 * länge skalprovet fanns slog `skalprovMal` upp de talen via `FACIT_KARTA`,
 * men riggen var AV som default i varje test här och rörde alltså aldrig
 * referenserna; med den riven (TASK-249.6) finns ingen sådan väg alls kvar.
 *
 * ATTENDANCE-MATRISEN ÄR KONSTRUERAD SÅ ATT TÄCKNINGEN BLIR 100 % REN
 * (`tackningsvyn`-testet): var och en av de åtta personerna hamnar i
 * EXAKT en av de fjorton förskapade grupperna (ingen dubbelräknad, ingen
 * utanför) — se kommentaren vid `ATTENDANCE` för den fullständiga
 * uträkningen. `Group4` ("RIM 1 + RIM 2", Cecilia + David) är dessutom
 * VERBATIM det exempel facit.json:s `verkstaden`-not citerar ("Har gått
 * både RIM 1 och RIM 2 - men ingen av de andra två utbildningarna.") —
 * inte en slump, se `ATTENDANCE`-kommentaren.
 */

const KURS_RIM1: Par = { kurs: 'Resor i medvetandet 1', modalitet: 'Utbildning' };
const KURS_RIM2: Par = { kurs: 'Resor i medvetandet 2', modalitet: 'Utbildning' };
const KURS_FS: Par = { kurs: 'Fjärrskådning', modalitet: 'Utbildning' };
const KURS_PS: Par = { kurs: 'Psionautics', modalitet: 'Utbildning' };

/** Minimal `EventRow`, all fält `EventSchema` kräver — samma helper-form som
 *  `mer-segment.acceptance.test.ts` § `ev()`, förenklad till denna filens behov.
 *  `kursfamilj`/`kursniva` (TASK-249.5) matchar basens verifierade backfill
 *  (`course-dimensions.ts` — samma mappning `byggParInfo`/`VariantD.tsx` nu
 *  läser via `familjFranBas`/`nivaFranBas`; historiskt `KURS_KARTA`s form). */
function ev(
  eventNamn: string,
  typ: string,
  id: string,
  kursfamilj: string,
  kursniva: string | null,
) {
  return {
    id,
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
    kursfamilj,
    kursniva,
  };
}

/** Matchar basens Kursfamilj/Kursnivå-backfill exakt — de fyra atomer
 *  `DE_FJORTON_ATOMER` också bygger på. */
const SEGMENT_TAXONOMY_EVENTS = [
  ev('Resor i medvetandet 1', 'Utbildning', 'recSegEvRim1', 'RIM', 'Nivå 1'),
  ev('Resor i medvetandet 2', 'Utbildning', 'recSegEvRim2', 'RIM', 'Nivå 2'),
  ev('Fjärrskådning', 'Utbildning', 'recSegEvFs', 'Fjärrskådning', null),
  ev('Psionautics', 'Utbildning', 'recSegEvPs', 'Psionautics', null),
];

function mockEvents(network: NetworkFixture): void {
  network.use(http.get(EF('get-events'), () => json({ events: SEGMENT_TAXONOMY_EVENTS })));
}

type FixturPerson = { id: string; namn: string; email: string; ejGodkandMail: boolean };

const ALICE: FixturPerson = {
  id: 'recSegM001',
  namn: 'Alice Andersson',
  email: 'alice.andersson@example.se',
  ejGodkandMail: false,
};
const BERTIL: FixturPerson = {
  id: 'recSegM002',
  namn: 'Bertil Berg',
  email: 'bertil.berg@example.se',
  ejGodkandMail: false,
};
const CECILIA: FixturPerson = {
  id: 'recSegM003',
  namn: 'Cecilia Cederqvist',
  email: 'cecilia.cederqvist@example.se',
  ejGodkandMail: false,
};
/** BÄR `ejGodkandMail: true` — den enda av de åtta. Prövar "Får inte mailet"
 *  i `segment-detaljvyn`/`utskicksvyn` (facit.json § segment-detaljvyn). */
const DAVID: FixturPerson = {
  id: 'recSegM004',
  namn: 'David Dahl',
  email: 'david.dahl@example.se',
  ejGodkandMail: true,
};
const ERIKA: FixturPerson = {
  id: 'recSegM005',
  namn: 'Erika Ek',
  email: 'erika.ek@example.se',
  ejGodkandMail: false,
};
const FREDRIK: FixturPerson = {
  id: 'recSegM006',
  namn: 'Fredrik Falk',
  email: 'fredrik.falk@example.se',
  ejGodkandMail: false,
};
const GRETA: FixturPerson = {
  id: 'recSegM007',
  namn: 'Greta Grahn',
  email: 'greta.grahn@example.se',
  ejGodkandMail: false,
};
const HUGO: FixturPerson = {
  id: 'recSegM008',
  namn: 'Hugo Hall',
  email: 'hugo.hall@example.se',
  ejGodkandMail: false,
};

/**
 * ÅTTA PERSONER, VARDERA MED EN KÄND KURSKOMBINATION. Konstruerad så att
 * varje person hamnar i EXAKT en av `DE_FJORTON_ATOMER`s "exakt
 * kombination"-grupper (`byggGrupp`s semantik, `VariantD.tsx`):
 *
 *   Alice, Bertil        → RIM1 ENDAST                → "RIM 1" (2)
 *   Cecilia, David        → RIM1 + RIM2, INTE FS/PS     → "RIM 1 + RIM 2" (2)
 *   Erika                 → RIM2 ENDAST                → "RIM 2" (1)
 *   Fredrik                → FS ENDAST                  → "Fjärrskådning" (1)
 *   Greta                  → FS + RIM1, INTE RIM2/PS     → "Fjärrskådning + RIM 1" (1)
 *   Hugo                   → PS ENDAST                  → "Psionautics" (1)
 *
 * Samtliga övriga av de fjorton kombinationerna (RIM1+RIM2+FS,
 * RIM1+RIM2+FS+PS, RIM1+PS, RIM1+RIM2+PS, FS+RIM1+PS, FS+PS, RIM2+PS,
 * FS+RIM2) är TOMMA (0 personer) — ett legitimt, dokumenterat läge
 * (`VariantD.tsx` fälla #34: "0 personer ännu" är neutralt, aldrig fel).
 *
 * TÄCKNINGEN BLIR DÄRMED 100 % REN: alla åtta är med i EXAKT en grupp
 * (`dubbla: 0`), och den samlade Utbildnings-populationen ÄR just dessa
 * åtta (`utanfor: []`) — `tackningsvyn`-testet fångar därför precis den
 * "friska" kvittensformen facit.json:s `tackningsvyn`-not citerar verbatim
 * ("100 % - Full täckning…").
 */
const ATTENDANCE: { person: FixturPerson; kurser: Par[] }[] = [
  { person: ALICE, kurser: [KURS_RIM1] },
  { person: BERTIL, kurser: [KURS_RIM1] },
  { person: CECILIA, kurser: [KURS_RIM1, KURS_RIM2] },
  { person: DAVID, kurser: [KURS_RIM1, KURS_RIM2] },
  { person: ERIKA, kurser: [KURS_RIM2] },
  { person: FREDRIK, kurser: [KURS_FS] },
  { person: GRETA, kurser: [KURS_FS, KURS_RIM1] },
  { person: HUGO, kurser: [KURS_PS] },
];

function harPar(kurser: readonly Par[], mal: Par): boolean {
  return kurser.some((p) => p.kurs === mal.kurs && p.modalitet === mal.modalitet);
}

/**
 * ÄKTA MÄNGDLOGIK, INTE ETT HÅRDKODAT SVAR (jfr `mer-segment.acceptance.
 * test.ts`s `mockCompute`, som alltid svarar samma N). Läser `request.
 * json()` — samma body-läsande mönster som `handlers.ts` § `log-activity`
 * — och svarar `include`-unionen minus `exclude`-unionen över `ATTENDANCE`,
 * precis som en riktig `compute-segment`-EF skulle göra för denna
 * fixturvärld.
 *
 * [TASK-249.5] DNF-MEDVETEN: `VariantD.tsx` skickar numera EN DNF-formad
 * regel per fråga (`predikatTillDnfRegel`) i stället för att AND-kombinera
 * flera enkla svar klient-side (`raknaSammansatt`, borttagen) — ett
 * `include`-element är antingen ett enkelt `Par` (OR) eller en Konjunkt-grupp
 * (`Par[]`, AND, ADR-115). `uppfyllerVillkor` speglar servern
 * (`_shared/segment-membership.ts` `matchedViaPars`) exakt: en grupp kräver
 * ALLA sina par samtidigt. Ingen av fixturens ATTENDANCE-rader bär `period`,
 * så mocken behöver inte filtrera på det (grind-scenarierna väljer aldrig en
 * tidsperiod).
 */
function uppfyllerVillkor(kurser: readonly Par[], villkor: Par | Par[]): boolean {
  return Array.isArray(villkor)
    ? villkor.every((par) => harPar(kurser, par))
    : harPar(kurser, villkor);
}

function mockComputeSegment(network: NetworkFixture): void {
  network.use(
    http.post(EF('compute-segment'), async ({ request }) => {
      const rule = (await request.json()) as { include: (Par | Par[])[]; exclude: Par[] };
      const members = ATTENDANCE.filter(
        ({ kurser }) =>
          rule.include.some((villkor) => uppfyllerVillkor(kurser, villkor)) &&
          !rule.exclude.some((par) => harPar(kurser, par)),
      ).map(({ person }) => ({
        id: person.id,
        namn: person.namn,
        email: person.email,
        ejGodkandMail: person.ejGodkandMail,
      }));
      return json({ members, count: members.length });
    }),
  );
}

/** Grundnavigeringen: mockar taxonomin + medlemsmotorn, går till segment-ytan,
 *  väntar in listans ankare.
 *
 *  [TASK-249.6] URL:en är `/mer/segment` UTAN `?variant=d`. Referenserna
 *  fångades genom den parametern medan varianterna levde; flippen
 *  (TASK-249.5) gjorde `VariantD` till routens ovillkorliga form och
 *  rivningen tog bort växeln som läste parametern, så `?variant=d` är sedan
 *  dess en oläst sträng — kvar bara som en vilseledande pekare till en riven
 *  mekanism. Samma städning som `personer-promoverings-grind.spec.ts` gjorde
 *  efter sin flipp. Referenserna är oförändrade av bytet: samma komponent
 *  renderades i båda fallen. */
async function gotoSegmentytan(page: import('@playwright/test').Page, network: NetworkFixture) {
  mockEvents(network);
  mockComputeSegment(network);
  await page.goto('/mer/segment');
  await expect(page.getByTestId('segment-listan')).toBeVisible();
}

/** Väntar in att SAMTLIGA `compute-segment`-frågor synliga på sidan har
 *  landat — "Räknar…"/"Räknar täckningen…"/"Räknar personer…" delar alla
 *  ordstammen "Räknar", så ett enda villkor täcker alla ytors laddningstext. */
async function vantaInRakningar(page: import('@playwright/test').Page) {
  await expect(page.getByText(/Räknar/)).toHaveCount(0);
}

/**
 * KLICKAR RadioGroup-VALET VIA DESS SYNLIGA ETIKETTEXT, INTE VIA `getByRole
 * ('radio')`. Mätt under bygget (2026-08-17): ett `getByRole('radio',
 * {name}).click()` på `@/components/primitives/RadioGroup`s react-aria-
 * `Radio` slår i praktiken alltid fast i "element intercepts pointer
 * events" mot sin egen dekorativa prick-`<span>`/omslutande `<label>` och
 * timeoutar — samma primitiv `mer-segment.acceptance.test.ts` § `choosePar`
 * redan kringgår genom att klicka på den SYNLIGA texten i stället för
 * rollen. `exact: true` eftersom flera etiketter annars är substrängar av
 * varandra (t.ex. modalitetens tre alternativ delar ordstammar).
 */
async function klickRadioText(page: import('@playwright/test').Page, etikett: string) {
  await page.getByText(etikett, { exact: true }).click();
}

test.describe('promoverings-grinden — ariaSnapshot-referenser för segment-ytan (ADR-103 B4, TASK-249.1)', () => {
  test('segment-listan — de fjorton förskapade grupperna, kontrolläget dolt', async ({
    page,
    network,
  }) => {
    await gotoSegmentytan(page, network);
    await vantaInRakningar(page);
    await expect(page.getByTestId('segment-listan')).toMatchAriaSnapshot({
      name: 'segment-listan.aria.yml',
    });
  });

  test('tackningsvyn — 100 % full täckning (de fjorton, friskt läge)', async ({
    page,
    network,
  }) => {
    await gotoSegmentytan(page, network);
    await vantaInRakningar(page);
    // [B2-promoveringen, S117] Knappen heter INTE längre garanterat "Visa
    // täckning" vid det här laget: sedan flippen räknar `SegmentLista` de
    // fjortons täckning EAGERT (samma frågor som `TackningsPanel` skulle
    // ställt, bara tidigare), och i DENNA fixturvärld är utfallet redan känt
    // och friskt när `vantaInRakningar` (väntar in ALLA `/Räknar/`-texter,
    // inklusive knappens egen "Räknar täckningen…") går igenom — etiketten
    // har då redan hunnit bli "Full täckning · 8 av 8" (facitets tillägg,
    // se `VariantD.tsx` § `tackningsEtikett`). Matchningen mot /täckning/i
    // fångar alla tre etiketterna ("Visa täckning"/"Dölj täckning"/"Full
    // täckning · N av N") och är därmed oberoende av VILKEN av dem knappen
    // råkar bära i just detta ögonblick — testets ärende är att KLICKA på
    // täckningsknappen, inte att bevisa dess etikett (det gör den låsta
    // `segment-listan`-referensen). `tackningsvyn.aria.yml` self scopar
    // ENDAST till panelen (en syskon-nod till knappen), och är därför
    // OFÖRÄNDRAD av detta — se PR-kroppens § Aria-omlåsning.
    await page.getByRole('button', { name: /täckning/i }).click();
    await vantaInRakningar(page);
    await expect(page.getByText('100 % - Full täckning')).toBeVisible();
    await expect(page.getByTestId('tackningsvyn')).toMatchAriaSnapshot({
      name: 'tackningsvyn.aria.yml',
    });
  });

  test('nytt-segment-mallvyn — steg 1-3, "minst en av" RIM 1 + RIM 2', async ({
    page,
    network,
  }) => {
    await gotoSegmentytan(page, network);
    await vantaInRakningar(page);
    await page.getByRole('button', { name: 'Nytt segment' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Nytt segment' })).toBeVisible();

    await klickRadioText(page, 'De som gått utbildningar');
    await klickRadioText(page, 'Alla som gått minst en av utbildningarna');
    await page.getByRole('button', { name: 'RIM 1', exact: true }).click();
    await page.getByRole('button', { name: 'RIM 2', exact: true }).click();

    await vantaInRakningar(page);
    await expect(page.getByText('6 personer i det här segmentet.')).toBeVisible();
    await expect(page.getByTestId('nytt-segment-mallvyn')).toMatchAriaSnapshot({
      name: 'nytt-segment-mallvyn.aria.yml',
    });
  });

  test('verkstaden — AND-primitiven, "RIM 1 + RIM 2" öppnad via Ändra regeln', async ({
    page,
    network,
  }) => {
    await gotoSegmentytan(page, network);
    await vantaInRakningar(page);
    await page.getByRole('button', { name: 'RIM 1 + RIM 2', exact: true }).click();
    await vantaInRakningar(page);
    await page.getByRole('button', { name: 'Ändra regeln' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'RIM 1 + RIM 2' })).toBeVisible();
    await vantaInRakningar(page);
    await expect(page.getByText('2 personer i det här segmentet.')).toBeVisible();
    await expect(page.getByTestId('verkstaden')).toMatchAriaSnapshot({
      name: 'verkstaden.aria.yml',
    });
  });

  test('segment-detaljvyn — "RIM 1 + RIM 2" (2 personer, en "Får inte mailet")', async ({
    page,
    network,
  }) => {
    await gotoSegmentytan(page, network);
    await vantaInRakningar(page);
    await page.getByRole('button', { name: 'RIM 1 + RIM 2', exact: true }).click();
    await vantaInRakningar(page);
    await expect(page.getByText('2 personer · 1 får mailet · 1 får inte mailet')).toBeVisible();
    await expect(page.getByTestId('segment-detaljvyn')).toMatchAriaSnapshot({
      name: 'segment-detaljvyn.aria.yml',
    });
  });

  test('generatorn — Utbildning, RIM 1 + RIM 2 valda (tre kombinationer)', async ({
    page,
    network,
  }) => {
    await gotoSegmentytan(page, network);
    await vantaInRakningar(page);
    await page.getByRole('button', { name: 'Dela upp i grupper' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Dela upp i grupper' })).toBeVisible();

    await klickRadioText(page, 'De som gått utbildningar');
    await page.getByRole('button', { name: 'RIM 1', exact: true }).click();
    await page.getByRole('button', { name: 'RIM 2', exact: true }).click();

    await vantaInRakningar(page);
    await expect(page.getByText('3 grupper skapas · 6 personer får en grupp')).toBeVisible();
    await expect(page.getByTestId('generatorn')).toMatchAriaSnapshot({
      name: 'generatorn.aria.yml',
    });
  });

  test('utskicksvyn — granska-läget, "RIM 1 + RIM 2" (2 mottagare)', async ({ page, network }) => {
    await gotoSegmentytan(page, network);
    await vantaInRakningar(page);
    await page.getByRole('button', { name: 'RIM 1 + RIM 2', exact: true }).click();
    await vantaInRakningar(page);
    await page.getByRole('button', { name: 'Skicka utskick till det här segmentet' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Utskick' })).toBeVisible();
    await vantaInRakningar(page);
    await expect(page.getByText('Utskick till 2 personer.')).toBeVisible();
    await expect(page.getByTestId('utskicksvyn')).toMatchAriaSnapshot({
      name: 'utskicksvyn.aria.yml',
    });
  });
});
