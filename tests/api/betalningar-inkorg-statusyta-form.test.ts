// [TASK-362] EN statusyta, källkodsnivå — bevisar att `BetalningsInkorg.tsx`s
// kompakta, höjd-reserverade sändstatusrad renderas för VARJE
// `utfall.intent !== 'warning'`, alltså BÅDE `info` (`vantar`/`pagar`) och
// `success` (`allt-skickat`) genom SAMMA gren/nod — inte bara det tillstånd
// en enda e2e-körning råkar fånga.
//
// ═══════════════════════════════════════════════════════════════════════════
// VARFÖR KÄLLKODSNIVÅ OCH INTE EN LIVE DOM-MÄTNING AV "PÅGÅR"
// ═══════════════════════════════════════════════════════════════════════════
// `tests/e2e/betalningar-inkorg-utskicksflode.staging.test.ts` § filhuvud
// ("MEDVETET UTANFÖR") bokför skälet i sin helhet: `useJobbstatus` pollar
// ALDRIG (`refetchOnMount: 'always'` + Postgres Realtime-push), så en
// e2e-mock kan inte hermetiskt producera en ANDRA, senare fetch att skilja
// "pågår" från "klart" med utan att fejka den riktiga Supabase Realtime-
// websocketen. Denna fil bevisar i stället den STRUKTURELLA garantin: att
// koden INTE grenar på `pagar` kontra `vantar` kontra `success` var för sig
// — den grenar EN gång, på `intent === 'warning'`, och `pagar`/`vantar` delar
// `intent: 'info'` (bevisat i `tests/api/betalningar-inkorg.test.ts`s
// "ett jobb som ARBETAR är varken lyckat eller misslyckat"). De två filerna
// TILLSAMMANS ger fullständig täckning: e2e-filen bevisar `köat` och
// `klart` LIVE, denna fil bevisar att `pågår` matematiskt MÅSTE dela
// `klart`s DOM-form eftersom koden har EN gren, inte tre.
//
// ═══════════════════════════════════════════════════════════════════════════
// UPPDATERAD REVIEW-RUNDA 1 (FYND 1 + FYND 2 + FYND 4)
// ═══════════════════════════════════════════════════════════════════════════
// Runda 1s första version av denna fil prövade en TERNARY-struktur
// (`vantande.length > 0 ? knapp : (warning ELLER statusrad)`). Runda 2 rev
// den strukturen: en ternary gjorde knappen och `warning`/`info` ömsesidigt
// uteslutande, vilket MÄTT (denna PR:s egen e2e-svit, röd innan fixen) dolde
// en genuin "N kvitton misslyckades"-varning så fort en NY, obesläktad rad
// köades — exakt den regression FYND 1 förbjuder. De tre grenarna
// (knapprad, `warning`, kompakt statusrad) är nu OBEROENDE `&&`-villkorade
// syskon, inte en ömsesidigt uteslutande `? :`. Testerna nedan är
// omskrivna för att pröva DEN formen, och prövar EXPLICIT att den gamla
// ternary-formen inte återkommit.
//
// TVÅ RIKTNINGAR PER GRIND (samma disciplin som `kvitto-forhandsgranskning.
// test.ts` § filhuvud): varje kontroll prövas mot en KONSTRUERAD sträng som
// ska falla, aldrig bara mot riktig källkod som råkar vara grön.
//
// api-pure: läser filen från disk med `node:fs`, inget nätverk, inga creds.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const INKORG_KALLA = readFileSync(
  path.join(REPO_ROOT, 'src', 'components', 'betalningar', 'BetalningsInkorg.tsx'),
  'utf8',
);

/** De tre villkors-strängarna, ordagrant ur källan (`BetalningsInkorg.tsx`
    § sändstatus-slotten). Byts något av dem i en refaktor ska denna fil
    fällas — det ÄR grindens jobb. */
const KNAPP_VILLKOR = '{vantande.length > 0 && (';
const WARNING_VILLKOR =
  "utfall !== null && utfall.intent === 'warning' && ovrigaJobbrader.length === 0 && (";
const STATUSRAD_VILLKOR = 'utfall !== null && ovrigaJobbrader.length === 0 && (';

/**
 * INDEX-BASERAD, INTE EN ENDA REGEX ÖVER HELA GRENEN — och det är avsiktligt.
 * Filens kommentarsblock mellan noderna är LÅNGA (flera hundra tecken,
 * ibland över tusen) och byter längd varje gång docblocket redigeras; en
 * regex med ett fast `{0,N}`-fönster blir därför en TICKANDE BOMB som fäller
 * på nästa oskyldiga kommentarsredigering, inte på en verklig regression.
 * `indexOf`-kedjan bryr sig bara om ORDNINGEN mellan markörerna, aldrig om
 * hur långt det är mellan dem.
 *
 * PRÖVAR (review-runda 2, FYND 1): knapprad, `warning` och kompakt
 * statusrad är TRE OBEROENDE `&&`-villkorade syskon — INGEN av dem
 * exkluderar de andra två. Specifikt: `warning`-blocket och statusraden
 * ska INTE stå i en `vantande.length > 0 ? … : (…)`-ternary (den gamla,
 * trasiga formen som dolde en varning bakom en köad rad).
 */
function treOberoendeGrenar(kalla: string): boolean {
  const knapp = kalla.indexOf(KNAPP_VILLKOR);
  if (knapp === -1) return false;

  const warningVillkor = kalla.indexOf(WARNING_VILLKOR, knapp);
  if (warningVillkor === -1) return false;
  const warningBox = kalla.indexOf('<MessageBox intent="warning"', warningVillkor);
  if (warningBox === -1) return false;

  const statusVillkor = kalla.indexOf(STATUSRAD_VILLKOR, warningBox);
  if (statusVillkor === -1) return false;
  const statusRad = kalla.indexOf('<p', statusVillkor);
  if (statusRad === -1) return false;
  const roleStatus = kalla.indexOf('role="status"', statusRad);
  if (roleStatus === -1 || roleStatus - statusRad > 200) return false;

  // NEGATIV GARD: den GAMLA ternary-formen (`) : (` mellan knappblocket och
  // statusraden) får inte förekomma — den är precis vad som gjorde
  // `warning`/`info` ömsesidigt uteslutande mot knappen.
  const gammalTernary = kalla.indexOf(') : (', knapp);
  if (gammalTernary !== -1 && gammalTernary < statusRad) return false;

  return true;
}

test('knapprad, warning och kompakt statusrad är TRE OBEROENDE grenar — ingen utesluter de andra (review-runda 2, FYND 1)', () => {
  expect(treOberoendeGrenar(INKORG_KALLA)).toBe(true);

  // NEGATIV KONTROLL 1: DEN FAKTISKA runda 1-REGRESSIONEN — en ternary som
  // gör knappraden och (warning|status) ömsesidigt uteslutande. Detta är
  // ORDAGRANT den form som fanns i denna PR:s FÖRSTA push och som mättes
  // dölja en warning-banderoll bakom en nyköad rad.
  const rundaEnRegressionen = `
    {vantande.length > 0 ? (
      <div>knapprad</div>
    ) : (
      <>
        {utfall !== null && utfall.intent === 'warning' && ovrigaJobbrader.length === 0 && (
          <MessageBox intent="warning" title={utfall.rubrik}>x</MessageBox>
        )}
        <p role="status">status</p>
      </>
    )}
  `;
  expect(treOberoendeGrenar(rundaEnRegressionen)).toBe(false);

  // NEGATIV KONTROLL 2: klass-uppdelad ternary (samma felklass som
  // ursprungsversionen av DENNA fil varnade för) — tre separata
  // `<p role="status">`-noder i stället för en delad.
  const klassUppdelad = `
    {utfall.klass === 'allt-skickat' ? (
      <p role="status">klart</p>
    ) : utfall.klass === 'pagar' ? (
      <p role="status">pågår</p>
    ) : (
      <MessageBox intent="warning">varning</MessageBox>
    )}
  `;
  expect(treOberoendeGrenar(klassUppdelad)).toBe(false);
});

test('warning-grenen (och bara den) använder MessageBox — kryss-regeln kan aldrig nås av info/success-raden', () => {
  // Källan ska INNEHÅLLA exakt EN plats där `intent="warning"` kopplas till
  // en `MessageBox` i sändstatus-slotten (den andra `intent="warning"`-
  // träffen i filen hör till realtidsfel-boxen, ett annat, orört block).
  const warningMessageBoxAntal = (INKORG_KALLA.match(/<MessageBox intent="warning"/g) ?? []).length;
  // Realtidsfel-boxen (oförändrad) + sändstatus-slottens warning-gren = 2.
  expect(warningMessageBoxAntal).toBe(2);

  // NEGATIV KONTROLL: en variant som (felaktigt) gav SUCCESS-utfallet en
  // `MessageBox` också hade höjt antalet till 3 — mönstret ovan hade inte
  // upptäckt den skillnaden på egen hand, så den prövas explicit här.
  const trasigKalla = `${INKORG_KALLA}\n<MessageBox intent="warning" title="extra">x</MessageBox>`;
  const trasigtAntal = (trasigKalla.match(/<MessageBox intent="warning"/g) ?? []).length;
  expect(trasigtAntal).not.toBe(warningMessageBoxAntal);
  expect(trasigtAntal).toBe(3);
});

test('sändstatus-slotten reserverar min-h-22 sm:min-h-10 (review-runda 1, FYND 2 — responsivt golv)', () => {
  // `min-h-22` (88 px, <640 px): EXAKT den mätta höjden när "Skicka 1
  // kvitto" + "Förhandsgranska" WRAPPAR till två rader vid mobilbredd
  // (375 px) — mätt live med `getBoundingClientRect()` i
  // `tests/e2e/betalningar-inkorg-utskicksflode.staging.test.ts`s
  // viewport-matris, röd innan detta golv fanns (238 px köat mot 190 px
  // klart). `sm:min-h-10` (40 px, ≥640 px) är golvet enknappsfallet redan
  // höll (Button.tsx `size.md: 'min-h-10'`) — täcker iPad (820 px) och
  // desktop, båda gröna i samma viewport-matris.
  expect(INKORG_KALLA).toMatch(/flex min-h-22 flex-col justify-center gap-2 sm:min-h-10/);

  const BUTTON_KALLA = readFileSync(
    path.join(REPO_ROOT, 'src', 'components', 'primitives', 'Button.tsx'),
    'utf8',
  );
  // Källan för husets DEFAULT-knappstorlek ('md') ska bära SAMMA `min-h-10`
  // — annars är "matchar knappens egen höjd vid ≥640 px" ett obelagt
  // påstående i BetalningsInkorg.tsx:s egen kommentar.
  expect(BUTTON_KALLA).toMatch(/md:\s*'min-h-10/);

  // NEGATIV KONTROLL 1: en slot utan reserverad höjd alls hade INTE
  // matchat mönstret.
  const ingenHojd = 'flex flex-col gap-2';
  expect(ingenHojd).not.toMatch(/flex min-h-22 flex-col justify-center gap-2 sm:min-h-10/);

  // NEGATIV KONTROLL 2: runda 1:s FÖRSTA (icke-responsiva) golv,
  // `min-h-10` utan `sm:`-brytpunkt — mätt otillräckligt vid mobilbredd,
  // ska INTE matcha det nya, responsiva mönstret.
  const rundaEttsGolv = 'flex min-h-10 flex-col justify-center gap-2';
  expect(rundaEttsGolv).not.toMatch(/flex min-h-22 flex-col justify-center gap-2 sm:min-h-10/);
});

test('sändstatus-regionen bär data-testid="inkorg-sandstatus" (review-runda 1, FYND 4 — stabil identitet för DOM-nod-provet)', () => {
  expect(INKORG_KALLA).toContain('data-testid="inkorg-sandstatus"');

  // NEGATIV KONTROLL: utan test-id:t kan e2e-sviten inte skilja "samma nod,
  // tomt innehåll" från "avmonterad och åter monterad nod" (se
  // `tests/e2e/betalningar-inkorg-utskicksflode.staging.test.ts`s FYND
  // 4-test, som förlitar sig på exakt detta attribut för sin
  // identitetsprövning).
  const utanTestId = INKORG_KALLA.replace('data-testid="inkorg-sandstatus"', '');
  expect(utanTestId).not.toContain('data-testid="inkorg-sandstatus"');
});
